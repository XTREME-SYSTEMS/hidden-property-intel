import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

// Autonomous Code Push — pushes validated code to the GitHub repo with NO manual
// approval. Creates a branch → commits files → opens a PR → squash-merges to the
// base branch → deletes the branch. Called by the autonomous code orchestrator
// after the Validator approves, and by agentAPI (push_code) so any agent can push.
//
// Auth: BASE44_SYNC_TOKEN (cron/swarm) OR admin user.
// Secrets: GITHUB_TOKEN (PAT, repo scope), GITHUB_REPO (owner/repo), GITHUB_BASE_BRANCH (default main).

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str || "");
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);

    const syncToken = secrets.get("BASE44_SYNC_TOKEN");
    if (!syncToken || body.sync_token !== syncToken) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const token = secrets.get("GITHUB_TOKEN");
    const repo = secrets.get("GITHUB_REPO") || "XTREME-SYSTEMS/vision-cortex";
    let baseBranch = (secrets.get("GITHUB_BASE_BRANCH") || "main").trim();
    if (!token) return Response.json({ error: "GITHUB_TOKEN secret not set — add it in Settings → Secrets" }, { status: 500 });

    const action = body.action || "push";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "property-intel-swarm",
    };
    const api = (path: string, init: any = {}) =>
      fetch(`https://api.github.com/repos/${repo}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });

    // ── PUSH ──
    if (action === "push") {
      const files = Array.isArray(body.files) ? body.files : [];
      if (!files.length) return Response.json({ error: "No files provided" }, { status: 400 });
      const message = body.message || `autonomous: ${new Date().toISOString()}`;
      const branchName = body.branch || `swarm/${Date.now()}`;

      // 1. Get base branch SHA (fall back to the repo's default branch if the
      //    configured name doesn't match — handles case mismatches like MAIN/main)
      let refRes = await api(`/git/refs/heads/${baseBranch}`);
      let refData = await refRes.json().catch(() => ({}));
      if (!refRes.ok) {
        const repoRes = await api(``);
        const repoData = await repoRes.json().catch(() => ({}));
        if (repoData.default_branch) {
          baseBranch = repoData.default_branch;
          refRes = await api(`/git/refs/heads/${baseBranch}`);
          refData = await refRes.json().catch(() => ({}));
        }
      }
      if (!refRes.ok) return Response.json({ error: `Cannot read base branch ${baseBranch}: ${refData.message}` }, { status: 500 });
      const baseSha = refData.object?.sha;

      // 2. Create branch from base
      const branchRes = await api(`/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
      });
      if (!branchRes.ok) {
        const e = await branchRes.json().catch(() => ({}));
        return Response.json({ error: `Cannot create branch ${branchName}: ${e.message}` }, { status: 500 });
      }

      // 3. Commit each file to the branch
      const committed = [];
      for (const f of files) {
        let sha: string | undefined;
        const getRes = await api(`/contents/${encodeURIComponent(f.path)}?ref=${branchName}`);
        if (getRes.ok) { const g = await getRes.json(); sha = g.sha; }
        const putRes = await api(`/contents/${encodeURIComponent(f.path)}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `${message} — ${f.path}`,
            content: toBase64(f.content || ""),
            branch: branchName,
            ...(sha ? { sha } : {}),
          }),
        });
        const putData = await putRes.json().catch(() => ({}));
        committed.push({ path: f.path, ok: putRes.ok, sha: putData.content?.sha, error: !putRes.ok ? putData.message : undefined });
      }

      // 4. Open + squash-merge a PR to the base branch, then delete the branch
      let merged = false, prNumber: number | null = null, prUrl: string | null = null;
      const prRes = await api(`/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: message,
          head: branchName,
          base: baseBranch,
          body: body.pr_body || `Autonomous push by the AGI swarm — no manual approval.\n\nFiles:\n${files.map((f) => `- \`${f.path}\``).join("\n")}`,
        }),
      });
      const prData = await prRes.json().catch(() => ({}));
      if (prRes.ok && prData.number) {
        prNumber = prData.number;
        prUrl = prData.html_url;
        const mergeRes = await api(`/pulls/${prNumber}/merge`, {
          method: "PUT",
          body: JSON.stringify({ merge_method: "squash" }),
        });
        merged = mergeRes.ok;
        if (!merged) {
          const me = await mergeRes.json().catch(() => ({}));
          return Response.json({ repo, branch: branchName, pr_number: prNumber, pr_url: prUrl, merged: false, error: me.message || "merge failed", committed }, { status: 500 });
        }
        await api(`/git/refs/heads/${branchName}`, { method: "DELETE" });
      } else {
        // PR creation failed (e.g. no diff) — still report committed files
        return Response.json({ repo, branch: branchName, merged: false, pr_error: prData.message, committed }, { status: 500 });
      }

      return Response.json({
        repo, branch: branchName, base: baseBranch, pr_number: prNumber, pr_url: prUrl, merged,
        committed, message,
        commit_url: `https://github.com/${repo}/commits/${baseBranch}`,
      });
    }

    return Response.json({ error: "Unknown action. Use: push" }, { status: 400 });
  } catch (error) {
    console.error("autonomousCodePush error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}