/**
 * Vercel cron — the autonomous coding loop heartbeat.
 * Every 5 minutes: calls the Base44 autonomousCodeOrchestrator (Planner → Coder
 * → Validator over the Vercel AI Gateway), then commits the generated code to
 * GitHub when GITHUB_TOKEN + GITHUB_REPO are configured. Without GitHub, specs
 * are stored as SystemGap records in Base44 for the builder to implement.
 *
 * Env vars:
 *   BASE44_APP_URL   — published app base (default https://my-property-intel.base44.app)
 *   BASE44_SYNC_TOKEN — shared secret to auth the Base44 orchestrator
 *   GITHUB_TOKEN      — optional, enables autonomous file commits
 *   GITHUB_REPO       — optional, "owner/repo" for the synced Base44 repo
 */
const BASE44_URL = process.env.BASE44_APP_URL || "https://my-property-intel.base44.app";
const SYNC_TOKEN = process.env.BASE44_SYNC_TOKEN;
const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_REPO = process.env.GITHUB_REPO;

export default async function handler(req, res) {
  if (!SYNC_TOKEN) {
    return res.status(500).json({ error: "BASE44_SYNC_TOKEN env var not set" });
  }
  try {
    // 1. Run the Base44 orchestrator cycle (audit → plan → code → validate)
    const orchRes = await fetch(`${BASE44_URL}/functions/autonomousCodeOrchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sync_token: SYNC_TOKEN, action: "cycle" }),
    });
    const orch = await orchRes.json().catch(() => ({}));
    if (orch.error) {
      return res.status(500).json({ error: orch.error });
    }
    if (orch.complete) {
      return res.status(200).json({ cycle: orch.cycle_id, complete: true, timestamp: new Date().toISOString() });
    }

    // 2. Commit to GitHub if configured and code was generated
    let committed = false;
    let commitInfo = null;
    if (GH_TOKEN && GH_REPO && orch.file_path && orch.code) {
      const result = await commitToGitHub(GH_TOKEN, GH_REPO, orch.file_path, orch.code, `autonomous: ${orch.gap_title}`);
      committed = result.ok;
      commitInfo = result;
    }

    return res.status(200).json({
      cycle: orch.cycle_id,
      gap: orch.gap_title,
      blueprint_id: orch.blueprint_id,
      file_path: orch.file_path,
      approved: orch.approved,
      speced: !!orch.spec,
      committed,
      commit: commitInfo,
      ai_gateway: orch.ai_gateway,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("autonomous-code-cycle error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

async function commitToGitHub(token, repo, path, content, message) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
  // Get existing file sha if it exists (for updates)
  let sha;
  try {
    const g = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } });
    if (g.ok) {
      const j = await g.json();
      sha = j.sha;
    }
  } catch { /* new file */ }
  const putRes = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  });
  const data = await putRes.json().catch(() => ({}));
  return { ok: putRes.ok, sha: data.content?.sha || null, html_url: data.content?.html_url || null };
}