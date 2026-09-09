import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Search, MapPin, Building2, Sparkles, Phone, Menu, Smartphone } from "lucide-react";
import "../../styles/v2.css";

export default function V2Layout() {
  return (
    <div className="hpi-v2">
      {/* Top Nav */}
      <nav className="v2-nav">
        <div className="v2-nav-inner">
          <Link to="/v2" className="v2-brand">
            <span className="v2-brand-mark">HPI</span>
            Hidden Property Intel
          </Link>
          <div className="v2-nav-links">
            <Link to="/v2">Buy</Link>
            <Link to="/v2">Sell</Link>
            <Link to="/v2">Tools</Link>
            <Link to="/v2">Pricing</Link>
            <Link to="/v2">About</Link>
          </div>
          <div className="v2-nav-actions">
            <Link to="/v2/app" className="v2-btn v2-btn-ghost v2-btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Smartphone size={15} /> App
            </Link>
            <button className="v2-btn v2-btn-ghost v2-btn-sm">Sign in</button>
            <button className="v2-btn v2-btn-primary v2-btn-sm">Join free</button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="v2-footer">
        <div className="v2-footer-inner">
          <div className="v2-footer-grid">
            <div>
              <div className="v2-footer-brand">
                <span className="v2-brand-mark">HPI</span> Hidden Property Intel
              </div>
              <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 320 }}>
                AI-powered off-market distressed property intelligence for serious real estate investors.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <Link to="/v2">Browse listings</Link>
              <Link to="/v2">Deal calculator</Link>
              <Link to="/v2">Smart contracts</Link>
              <Link to="/v2">Market analytics</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/v2">About</Link>
              <Link to="/v2">Pricing</Link>
              <Link to="/v2">Blog</Link>
              <Link to="/v2">Contact</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link to="/v2">Terms</Link>
              <Link to="/v2">Privacy</Link>
              <Link to="/v2">Fair housing</Link>
              <Link to="/v2">Disclosures</Link>
            </div>
          </div>
          <div className="v2-footer-bottom">
            © 2026 Hidden Property Intel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}