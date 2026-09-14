import fs from "node:fs";

const files = {
  profiles: "src/lib/digitalAgentProfiles.js",
  page: "src/pages/DigitalAgentProfile.jsx",
};

const read = (path) => fs.readFileSync(path, "utf8");
const profiles = read(files.profiles);
const page = read(files.page);
const failures = [];

const forbiddenProfilePatterns = [
  ["fabricated phone placeholder", /555-\d{4}/i],
  ["fabricated human email/contact block", /contact\s*:\s*\{/],
  ["fabricated birthplace field", /place_of_birth\s*:/],
  ["fabricated birth date field", /birth_date\s*:/],
  ["fabricated LinkedIn identity", /linkedin\.com\/in\//i],
  ["fabricated human life history", /life_experiences\s*:/],
  ["fabricated human biography container", /unique_qualities\s*:/],
];

for (const [label, pattern] of forbiddenProfilePatterns) {
  if (pattern.test(profiles)) failures.push(`${files.profiles}: ${label}`);
}

const requiredProfilePatterns = [
  ["explicit AI agent type", /agent_type:\s*["']AI digital agent["']/],
  ["identity provenance disclaimer", /provenance:\s*["'][^"']+not a human biography/i],
  ["governed action guardrails", /agentforce_guardrails\s*:/],
];

for (const [label, pattern] of requiredProfilePatterns) {
  if (!pattern.test(profiles)) failures.push(`${files.profiles}: missing ${label}`);
}

const forbiddenPagePatterns = [
  ["human birthplace UI", /Place of Birth/i],
  ["human birth-date UI", />Born</i],
  ["personal-image identity UI", /Personal Image/i],
  ["business-image identity UI", /Business Image/i],
  ["fabricated contact-information UI", /Contact Information/i],
  ["human biography uniqueness UI", /What Makes Me Unique/i],
];

for (const [label, pattern] of forbiddenPagePatterns) {
  if (pattern.test(page)) failures.push(`${files.page}: ${label}`);
}

const requiredPagePatterns = [
  ["identity notice", /Identity notice:/],
  ["capability profile heading", /Capability Summary/],
  ["runtime identity section", /Runtime Identity/],
  ["guardrails section", /Guardrails/],
];

for (const [label, pattern] of requiredPagePatterns) {
  if (!pattern.test(page)) failures.push(`${files.page}: missing ${label}`);
}

if (/AgentPicture/.test(page)) {
  failures.push(`${files.page}: human-style AgentPicture component must not be rendered by the governed capability profile`);
}

const evidence = {
  validator: "digital-agent-truth-audit",
  source_sha: process.env.GITHUB_SHA || "local",
  status: failures.length ? "FAIL" : "PASS",
  inspected_files: Object.values(files),
  failure_count: failures.length,
  failures,
};

console.log(JSON.stringify(evidence, null, 2));

if (failures.length) process.exit(1);
