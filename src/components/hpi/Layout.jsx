import { NavLink, Link, useLocation } from 'react-router-dom';
import { Bell, Heart, Home, Map, MessageCircle, Menu, Search, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const publicNav = [
  ['Marketplace', '/marketplace'], ['Investors', '/investors'], ['Sellers', '/sellers'], ['How It Works', '/how-it-works'], ['Smart Contracts', '/smart-contracts'], ['Resources', '/help']
];

export default function Layout({ children, dark = false, app = false }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return <div className={dark ? 'site dark-shell' : 'site'}>
    <header className={`topbar ${dark ? 'topbar-dark' : ''}`}>
      <div className="nav-wrap">
        <Link className="brand" to="/">
          <img src={dark ? '/brand/header-logo-dark.png' : '/brand/header-logo.png'} alt="Hidden Property Intel" />
        </Link>
        <nav className="desktop-nav">
          {(app ? [['Dashboard', '/investor/dashboard'], ['Marketplace', '/marketplace'], ['Saved', '/investor/saved'], ['Bids', '/investor/bids'], ['Transactions', '/investor/transactions'], ['Messages', '/investor/messages']] : publicNav).map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
        </nav>
        <div className="nav-actions">
          {app ? <>
            <Link className="icon-button" to="/investor/alerts" aria-label="Notifications"><Bell size={18} /></Link>
            <Link className="icon-button" to="/profile" aria-label="Profile"><UserRound size={18} /></Link>
          </> : <>
            <Link className="btn ghost" to="/login">Sign In</Link>
            <Link className="btn gold" to="/register">Get Started</Link>
          </>}
          <button className="mobile-menu-btn" onClick={() => setOpen(v => !v)} aria-label="Open navigation">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <div className="mobile-menu">
        {(app ? [['Dashboard', '/investor/dashboard'], ['Marketplace', '/marketplace'], ['Saved', '/investor/saved'], ['Bids', '/investor/bids'], ['Transactions', '/investor/transactions'], ['Messages', '/investor/messages'], ['Alerts', '/investor/alerts'], ['Account', '/settings']] : publicNav).map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
      </div>}
    </header>
    <main>{children}</main>
    {app && <MobileBottomNav />}
    {!app && <Footer />}
  </div>;
}

function MobileBottomNav() {
  const items = [[Home, 'Home', '/investor/dashboard'], [Search, 'Market', '/marketplace'], [Heart, 'Saved', '/investor/saved'], [MessageCircle, 'Messages', '/investor/messages'], [UserRound, 'Account', '/profile']];
  return <nav className="mobile-bottom-nav">{items.map(([Icon, label, path]) => <NavLink key={path} to={path}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>;
}

function Footer() {
  return <footer className="footer">
    <div className="footer-grid">
      <div><img src="/brand/header-logo-dark.png" alt="Hidden Property Intel" /><p>Find what others miss. Distressed-property intelligence for serious investors and motivated sellers.</p></div>
      <div><h4>Investors</h4><Link to="/marketplace">Marketplace</Link><Link to="/advanced-search">Advanced Search</Link><Link to="/deal-analyzer">Deal Analyzer</Link></div>
      <div><h4>Sellers</h4><Link to="/sellers">List Free</Link><Link to="/smart-contracts">Closing</Link><Link to="/how-it-works">How It Works</Link></div>
      <div><h4>Company</h4><Link to="/how-it-works">How It Works</Link><Link to="/help">Help Center</Link><Link to="/support">Support</Link></div>
    </div>
    <div className="footer-bottom">© 2026 Hidden Property Intel. Financial estimates are not guarantees.</div>
  </footer>;
}