import fs from 'node:fs';

function repair(path, oldText, newText) {
  const current = fs.readFileSync(path, 'utf8');
  if (current.includes(newText)) {
    console.log(`already repaired: ${path}`);
    return false;
  }
  const count = current.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${path}: expected exactly one repair target, found ${count}`);
  }
  fs.writeFileSync(path, current.replace(oldText, newText));
  console.log(`repaired: ${path}`);
  return true;
}

let changed = false;

changed = repair(
  'src/components/SmartContractSimulator.jsx',
  'function StateRow({ icon: Icon, label, done, status }) {',
  'function StateRow({ icon: Icon, label, done = false, status = "" }) {'
) || changed;

changed = repair(
  'src/components/admin/AdminOverview.jsx',
  'function MetricCard({ icon: Icon, label, value, sub }) {',
  'function MetricCard({ icon: Icon, label, value, sub = "" }) {'
) || changed;

changed = repair(
  'src/components/admin/SmartContractActionModal.jsx',
  'function ActionBtn({ label, onClick, loading, disabled, variant }) {',
  'function ActionBtn({ label, onClick, loading, disabled, variant = "default" }) {'
) || changed;

changed = repair(
  'src/pages/AdminArchitecture.jsx',
  'function Stat({ label, value, sub, tone }) {',
  'function Stat({ label, value, sub, tone = "" }) {'
) || changed;

changed = repair(
  'src/pages/AdminDistressTracker.jsx',
  'const [busy, setBusy] = useState({});',
  'const [busy, setBusy] = useState({ all: false, enrich: false, score: false });'
) || changed;

changed = repair(
  'src/pages/AdminNumbers.jsx',
  'const [numbers, setNumbers] = useState([]);',
  'const [numbers, setNumbers] = useState("");'
) || changed;

changed = repair(
  'src/pages/AdminProbateDashboard.jsx',
  'function Stat({ icon: Icon, label, value, tone }) {',
  'function Stat({ icon: Icon, label, value, tone = "" }) {'
) || changed;

changed = repair(
  'src/pages/AdminSmartContracts.jsx',
  'function StatCard({ label, value, color }) {',
  'function StatCard({ label, value, color = "" }) {'
) || changed;

changed = repair(
  'src/pages/AgentDashboard.jsx',
  'function ActionCard({ icon: Icon, title, desc, onClick, to }) {',
  'function ActionCard({ icon: Icon, title, desc, onClick = null, to = null }) {'
) || changed;

changed = repair(
  'src/pages/ConvergenceCenter.jsx',
  'function Panel({ title, icon, count, children }) {',
  'function Panel({ title, icon, count = null, children }) {'
) || changed;

changed = repair(
  'src/pages/DigitalWorkforce.jsx',
  'function Meter({ label, value, color, suffix }) {',
  'function Meter({ label, value, color, suffix = "" }) {'
) || changed;

changed = repair(
  'src/pages/LegalCompliance.jsx',
  'function ExpandableItem({ title, detail, citation, link, expanded, onToggle }) {',
  'function ExpandableItem({ id, title, detail, citation = "", link = "", expanded, onToggle }) {'
) || changed;

changed = repair(
  'src/pages/PropertyDetail.jsx',
  'function Card({ title, children, className = "" }) {',
  'function Card({ title = "", children, className = "" }) {'
) || changed;

changed = repair(
  'src/components/admin/EdenBubble.jsx',
  'const existing = await base44.agents.listConversations({ agent_name: AGENT_NAME });',
  'const existing = await base44.agents.listConversations({ q: { agent_name: AGENT_NAME }, sort: "-updated_date", limit: 1 });'
) || changed;

changed = repair(
  'src/components/admin/InvestorCommandCenter.jsx',
  '<FollowUpControls targetType="investor" record={investor} onUpdate={onUpdate} expanded />',
  '<FollowUpControls targetType="investor" record={investor} onUpdate={onUpdate} />'
) || changed;

changed = repair(
  'src/components/admin/InvestorCommandCenter.jsx',
  'setOutput(typeof res === "string" ? res : res.content || JSON.stringify(res));',
  'setOutput(typeof res === "string" ? res : (res && typeof res === "object" && "content" in res ? String(res.content || "") : JSON.stringify(res)));'
) || changed;

changed = repair(
  'src/components/admin/OutreachEditor.jsx',
  '  nextOfKin,',
  '  nextOfKin = [],'
) || changed;

changed = repair(
  'src/components/admin/OutreachEditor.jsx',
  '  recipientEmail: overrideEmail,',
  '  recipientEmail: overrideEmail = null,'
) || changed;

changed = repair(
  'src/pages/AdminSources.jsx',
  'onChange={(e) => setForm({ ...form, max_results: e.target.value })}',
  'onChange={(e) => setForm({ ...form, max_results: Number(e.target.value) })}'
) || changed;

changed = repair(
  'src/pages/AdminTestLab.jsx',
  'const TEST_GROUPS = [',
  '/** @type {Array<{ name: string, icon: any, color: string, tests: Array<{ name: string, desc: string, payload: Record<string, any> }> }>} */\nconst TEST_GROUPS = ['
) || changed;

changed = repair(
  'src/pages/EdenSkyeChat.jsx',
  'const existing = base44.agents.listConversations({ agent_name: AGENT_NAME });\n        // listConversations is synchronous in the SDK\n        const list = existing || [];',
  'const list = await base44.agents.listConversations({ q: { agent_name: AGENT_NAME }, sort: "-updated_date", limit: 1 });'
) || changed;

changed = repair(
  'src/pages/EdenSkyeChat.jsx',
  'const conv = base44.agents.getConversation(list[0].id);',
  'const conv = await base44.agents.getConversation(list[0].id);'
) || changed;

changed = repair(
  'src/pages/EdenSkyeChat.jsx',
  'const conv = base44.agents.createConversation({',
  'const conv = await base44.agents.createConversation({'
) || changed;

changed = repair(
  'src/pages/EdenSkyeChat.jsx',
  'const updated = base44.agents.addMessage(conversation, { role: "user", content: msg });\n      setConversation(updated);',
  'await base44.agents.addMessage(conversation, { role: "user", content: msg });'
) || changed;

changed = repair(
  'src/lib/app-params.js',
  "const isNode = typeof window === 'undefined';",
  "/// <reference types=\"vite/client\" />\nconst isNode = typeof window === 'undefined';"
) || changed;

changed = repair(
  'src/pages/OAuthConsent.jsx',
  '        const infoHeaders = {};',
  '        /** @type {Record<string, string>} */\n        const infoHeaders = {};'
) || changed;

changed = repair(
  'src/pages/TheProcess.jsx',
  '            const idx = Number(e.target.dataset.idx);',
  '            const idx = Number(/** @type {HTMLElement} */ (e.target).dataset.idx);'
) || changed;

console.log(JSON.stringify({ changed }));
