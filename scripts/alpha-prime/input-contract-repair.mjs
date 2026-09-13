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
const optionalTryParserPattern = /^(\s*)let\s+([A-Za-z_$][\w$]*)\s*=\s*\{\};\s*\n\s*try\s*\{\s*\2\s*=\s*await\s+(?:req|request)\.json\(\);\s*\}\s*catch\s*(?:\([^)]*\))?\s*\{\s*\}\s*$/m;

function escapedName(variable) {
  return variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasObjectUse(text, variable, parserEnd) {
  const tail = text.slice(parserEnd);
  const escaped = escapedName(variable);
  return new RegExp(`(?:\\{[^}]+\\}\\s*=\\s*${escaped}\\b|\\b${escaped}\\s*\\|\\|\\s*\\{|\\b${escaped}(?:\\?|)\\.[A-Za-z_$])`).test(tail);
}

function hasAnyUse(text, variable, parserEnd) {
  const tail = text.slice(parserEnd);
  return new RegExp(`\\b${escapedName(variable)}\\b`).test(tail);
}

function objectGuard(indent, variable) {
  return `\n${indent}if (!${variable} || typeof ${variable} !== 'object' || Array.isArray(${variable})) {\n${indent}  return Response.json({ error: '${marker}' }, { status: 400 });\n${indent}}`;
}

let changed = 0;
for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(marker)) {
    console.log(`already hardened: ${file}`);
    continue;
  }
  if (!/(?:req|request)\.json\s*\(/.test(text)) {
    console.log(`no request-body parser remains: ${file}`);
    continue;
  }

  const optional = optionalTryParserPattern.exec(text);
  if (optional) {
    const [statement, indent, variable] = optional;
    const statementEnd = optional.index + statement.length;
    if (!hasObjectUse(text, variable, statementEnd)) {
      throw new Error(`${file}: optional parsed body '${variable}' is not provably used as an object; refusing automatic repair`);
    }
    const next = text.slice(0, statementEnd) + objectGuard(indent, variable) + text.slice(statementEnd);
    fs.writeFileSync(file, next);
    changed += 1;
    console.log(`hardened optional body: ${file} (${variable})`);
    continue;
  }

  const match = parserPattern.exec(text);
  if (!match) throw new Error(`${file}: could not locate a deterministic JSON body assignment`);

  const [statement, indent, variable] = match;
  const statementEnd = match.index + statement.length;
  if (!hasObjectUse(text, variable, statementEnd)) {
    if (!hasAnyUse(text, variable, statementEnd)) {
      const next = text.slice(0, match.index) + text.slice(statementEnd);
      fs.writeFileSync(file, next);
      changed += 1;
      console.log(`removed unused request-body parse: ${file} (${variable})`);
      continue;
    }
    throw new Error(`${file}: parsed body '${variable}' is used but not provably as an object; refusing automatic repair`);
  }

  const next = text.slice(0, statementEnd) + objectGuard(indent, variable) + text.slice(statementEnd);
  fs.writeFileSync(file, next);
  changed += 1;
  console.log(`hardened: ${file} (${variable})`);
}

console.log(JSON.stringify({ changed, targets: targets.length }));
