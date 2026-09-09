import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Search, MapPin, Building2, Sparkles, Phone, Menu } from "lucide-react";
import "../../styles/v2.css";

export default function V2Layout() {
  return (
    <div className="hpi-v2">
      {/* Zillow-style Top Nav */}
      <nav className="z-nav">
        <div className="z-nav-inner">
          <div className="z-nav-left">
            <Link to="/v2" className="z-nav-link">Buy</Link>
            <Link to="/seller/post-property" className="z-nav-link">Sell</Link>
            <Link to="/deal-calculator" className="z-nav-link">Deal tools</Link>
            <Link to="/v2" className="z-nav-link">Find an agent</Link>
          </div>
          <Link to="/v2" className="z-nav-logo"><b>H</b>PI</Link>
          <div className="z-nav-right">
            <Link to="/v2/app" className="z-nav-link">Manage rentals</Link>
            <Link to="/v2" className="z-nav-link">Advertise</Link>
            <Link to="/v2" className="z-nav-link">Get help</Link>
            <Link to="/login" className="z-signin">Sign in</Link>
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