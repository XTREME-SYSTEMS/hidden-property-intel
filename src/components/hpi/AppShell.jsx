import { NavLink, Link } from 'react-router-dom';
import { Bell, FileSignature, Home, MessageCircle, Search, Settings, ShieldCheck, UserRound } from 'lucide-react';

const nav = [
  [Home, 'Dashboard', '/investor/dashboard'],
  [Search, 'Marketplace', '/marketplace'],
  [Bell, 'Alerts', '/investor/alerts'],
  [MessageCircle, 'Messages', '/investor/messages'],
  [FileSignature, 'Transactions', '/investor/transactions'],
  [Settings, 'Settings', '/settings'],
];

export default function AppShell({ children }) {
  return <div className="app-shell">
    <aside className="side-nav">
      <div className="portal-label">
        <span>HI</span>
        <div><b>Investor Portal</b><small>Hidden Property Intel</small></div>
      </div>
      <nav>
        {nav.map(([Icon, label, path]) => <NavLink key={path} to={path}><Icon size={16} />{label}</NavLink>)}
      </nav>
    </aside>
    <div className="app-main">{children}</div>
  </div>;
}