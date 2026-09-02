// Cloudbrowser engine client — session-based browser automation.
// Talks to the user's self-hosted cloudbrowser-control engine.

const ENGINE_URL = process.env.BROWSER_ENGINE_URL;
const ENGINE_KEY = process.env.BROWSER_ENGINE_API_KEY;

if (!ENGINE_URL || !ENGINE_KEY) {
  console.warn("[browser] BROWSER_ENGINE_URL or BROWSER_ENGINE_API_KEY not set — browser scraping disabled");
}

async function action(name, payload = {}) {
  if (!ENGINE_URL) throw new Error("BROWSER_ENGINE_URL not set");
  const res = await fetch(ENGINE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENGINE_KEY,
      Authorization: `Bearer ${ENGINE_KEY}`,
    },
    body: JSON.stringify({ action: name, ...payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine ${name} ${res.status}: ${text}`);
  }
  return res.json();
}

// Full session lifecycle: create → goto → extract → delete
export async function scrapeUrl(url, { selector = "table", waitMs = 3000 } = {}) {
  let sessionId = null;
  try {
    // Create session
    const createRes = await action("create", { url });
    sessionId = createRes.sessionId || createRes.id;
    if (!sessionId) throw new Error("No session ID returned");

    // Navigate
    await action("goto", { sessionId, url });

    // Wait for render
    await new Promise((r) => setTimeout(r, waitMs));

    // Extract table data
    let extractRes;
    try {
      extractRes = await action("extract_table", { sessionId, selector });
    } catch {
      // Fallback: extract text content
      extractRes = await action("evaluate", { sessionId, script: "document.body.innerText" });
    }

    return extractRes;
  } finally {
    if (sessionId) {
      try { await action("delete", { sessionId }); } catch {}
    }
  }
}

// Extract raw page text (for address parsing)
export async function extractPageText(url, { waitMs = 3000 } = {}) {
  let sessionId = null;
  try {
    const createRes = await action("create", { url });
    sessionId = createRes.sessionId || createRes.id;
    if (!sessionId) throw new Error("No session ID returned");

    await action("goto", { sessionId, url });
    await new Promise((r) => setTimeout(r, waitMs));

    const textRes = await action("evaluate", {
      sessionId,
      script: "document.body.innerText",
    });

    return textRes?.result || textRes?.text || textRes?.value || "";
  } finally {
    if (sessionId) {
      try { await action("delete", { sessionId }); } catch {}
    }
  }
}

// Extract all links from a page (useful for finding property detail pages)
export async function extractLinks(url, { waitMs = 3000 } = {}) {
  let sessionId = null;
  try {
    const createRes = await action("create", { url });
    sessionId = createRes.sessionId || createRes.id;
    if (!sessionId) throw new Error("No session ID returned");

    await action("goto", { sessionId, url });
    await new Promise((r) => setTimeout(r, waitMs));

    const linksRes = await action("evaluate", {
      sessionId,
      script: "JSON.stringify([...document.querySelectorAll('a')].map(a => ({text: a.innerText, href: a.href})).filter(l => l.text && l.href))",
    });

    const raw = linksRes?.result || linksRes?.text || linksRes?.value || "[]";
    return JSON.parse(raw);
  } finally {
    if (sessionId) {
      try { await action("delete", { sessionId }); } catch {}
    }
  }
}