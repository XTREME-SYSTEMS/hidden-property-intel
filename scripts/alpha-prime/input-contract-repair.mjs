import fs from 'node:fs';

const targets = [
  'base44/functions/acceptBid/entry.ts',
  'base44/functions/advancedSkipTrace/entry.ts',
  'base44/functions/agentThink/entry.ts',
  'base44/functions/agentToolGenerator/entry.ts',
  'base44/functions/compareSnapshots/entry.ts',
  'base44/functions/configureFollowUp/entry.ts',
  'base44/functions/createCheckoutSession/entry.ts',
  'base44/functions/createExport/entry.ts',
  'base44/functions/createSnapshot/entry.ts',
  'base44/functions/fetchPropertyImages/entry.ts',
  'base44/functions/importWallet/entry.ts',
  'base44/functions/independentValidate/entry.ts',
  'base44/functions/matchAndNotifyAlerts/entry.ts',
  'base44/functions/outreachInvestors/entry.ts',
  'base44/functions/outreachProbateHeirs/entry.ts',
  'base44/functions/outreachSellers/entry.ts',
  'base44/functions/processProxyBids/entry.ts',
  'base44/functions/queryGraph/entry.ts',
  'base44/functions/resolveEntities/entry.ts',
  'base44/functions/runMasterEnrichment/entry.ts',
  'base44/functions/scoreProperty/entry.ts',
  'base44/functions/scrapeInvestors/entry.ts',
  'base44/functions/scrapeProperties/entry.ts',
  'base44/functions/sendBidNotifications/entry.ts',
  'base44/functions/sendOutreach/entry.ts',
  'base44/functions/signDocument/entry.ts',
  'base44/functions/syncFromSupabase/entry.ts',
  'base44/functions/syncToGoogleSheets/entry.ts',
  'base44/functions/syncToSupabase/entry.ts',
];

const marker = 'JSON object body required';
const parserPattern = /^(\s*)const\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:req|request)\.json\(\)([^;]*);\s*$/m;

function hasObjectUse(text, variable, parserEnd) {
  const tail = text.slice(parserEnd);
  const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:\\{[^}]+\\}\\s*=\\s*${escaped}\\b|\\b${escaped}\\s*\\|\\|\\s*\\{|\\b${escaped}(?:\\?|)\\.[A-Za-z_$])`).test(tail);
}

let changed = 0;
for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(marker)) {
    console.log(`already hardened: ${file}`);
    continue;
  }

  const match = parserPattern.exec(text);
  if (!match) throw new Error(`${file}: could not locate a single-line JSON body assignment`);

  const [statement, indent, variable] = match;
  const statementEnd = match.index + statement.length;
  if (!hasObjectUse(text, variable, statementEnd)) {
    throw new Error(`${file}: parsed body '${variable}' is not provably used as an object; refusing automatic repair`);
  }

  const guard = `\n${indent}if (!${variable} || typeof ${variable} !== 'object' || Array.isArray(${variable})) {\n${indent}  return Response.json({ error: '${marker}' }, { status: 400 });\n${indent}}`;
  const next = text.slice(0, statementEnd) + guard + text.slice(statementEnd);
  fs.writeFileSync(file, next);
  changed += 1;
  console.log(`hardened: ${file} (${variable})`);
}

console.log(JSON.stringify({ changed, targets: targets.length }));
