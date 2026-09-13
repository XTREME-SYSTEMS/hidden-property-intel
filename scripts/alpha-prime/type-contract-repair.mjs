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
  'function Stat({ label, value, color }) {',
  'function Stat({ label, value, color = "" }) {'
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

console.log(JSON.stringify({ changed }));
