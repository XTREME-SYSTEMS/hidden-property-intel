import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Search, Bell, Heart, Calendar, Mail } from "lucide-react";
import PWAInstall from "@/components/PWAInstall";
import V2LeadCapture from "@/components/v2/V2LeadCapture";
import "../../styles/v2.css";

export default function V2Layout() {
  const [lead, setLead] = useState({ open: false, feature: "updates" });
  const openLead = (feature) => setLead({ open: true, feature });
  return (
    <div className="hpi-v2">
      {/* Zillow-style Top Nav (full width) */}
      <nav className="z-nav">
        <div className="z-nav-inner">
          <div className="z-nav-left">
            <Link to="/investor/dashboard" className="z-nav-link">Investors</Link>
            <Link to="/seller/dashboard" className="z-nav-link">Sellers</Link>
            <Link to="/smart-contracts" className="z-nav-link">Smart Contracts</Link>
            <Link to="/process" className="z-nav-link">The Process</Link>
            <Link to="/pricing" className="z-nav-link">Save $</Link>
            <Link to="/eden-skye/chat" className="z-nav-link z-nav-hot">Instant Message</Link>
          </div>
          <Link to="/v2" className="z-nav-logo"><b>H</b>PI</Link>
          <div className="z-nav-right">
            <Link to="/v2/listings" className="z-nav-link">Browse</Link>
            <Link to="/contact" className="z-nav-link">Help</Link>
            <PWAInstall variant="nav" />
            <Link to="/login" className="z-signin">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="z-body">
        {/* Zillow left sidebar rail */}
        <aside className="z-rail">
          <Link to="/v2/listings" className="active"><Search /> Search</Link>
          <button className="z-rail-btn" onClick={() => openLead("updates")}><Bell /> Updates</button>
          <button className="z-rail-btn" onClick={() => openLead("favorites")}><Heart /> Favorites</button>
          <button className="z-rail-btn" onClick={() => openLead("plan")}><Calendar /> Plan</button>
          <button className="z-rail-btn" onClick={() => openLead("inbox")}><Mail /> Inbox</button>
        </aside>

        <div className="z-content">
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
                  <Link to="/deal-calculator">Deal calculator</Link>
                  <Link to="/smart-contracts">Smart contracts</Link>
                  <Link to="/v2">Market analytics</Link>
                </div>
                <div>
                  <h4>Company</h4>
                  <Link to="/about">About</Link>
                  <Link to="/pricing">Pricing</Link>
                  <Link to="/blog">Blog</Link>
                  <Link to="/contact">Contact</Link>
                </div>
                <div>
                  <h4>Legal</h4>
                  <Link to="/legal-compliance">Terms</Link>
                  <Link to="/legal-compliance">Privacy</Link>
                  <Link to="/legal-compliance">Fair housing</Link>
                  <Link to="/legal-compliance">Disclosures</Link>
                </div>
              </div>
              <div className="v2-footer-bottom">
                © 2026 Hidden Property Intel. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </div>
      <V2LeadCapture open={lead.open} feature={lead.feature} onClose={() => setLead({ open: false, feature: lead.feature })} />
    </div>
  );
}