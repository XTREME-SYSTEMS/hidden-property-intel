import React, { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

/**
 * V2-styled app download section with a working PWA install.
 * Store badges trigger the browser install prompt (native store build is a
 * separate publishing step). Hidden entirely once installed.
 */
export default function V2AppDownload() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIos(ios);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (ios && window.navigator.standalone === true);
    if (standalone) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setShowTip(true);
  };

  if (installed) return null;

  return (
    <section className="z-section">
      <div className="v2-app-download">
        <div>
          <span className="eyebrow">Mobile App</span>
          <h2>Carry the whole distressed market in your pocket</h2>
          <p>
            Install the Hidden Property Intel app for offline inventory browsing,
            instant push alerts on new distressed leads, on-the-go skip tracing,
            and on-chain smart-contract signing — right from your phone.
          </p>
          <div className="v2-store-badges">
            <button className="v2-store-badge" onClick={install}>
              <Download size={22} />
              <span>
                <small>Install the</small>
                <b>Hidden Property Intel App</b>
              </span>
            </button>
            <button className="v2-store-badge" onClick={install}>
              <Smartphone size={22} />
              <span>
                <small>Add to</small>
                <b>Home Screen</b>
              </span>
            </button>
          </div>
          <div className="v2-app-benefits">
            <div className="v2-app-benefit">
              <span className="ck">✓</span> Offline-ready inventory browsing
            </div>
            <div className="v2-app-benefit">
              <span className="ck">✓</span> Instant push alerts on new distressed leads
            </div>
            <div className="v2-app-benefit">
              <span className="ck">✓</span> Sign smart-contract escrow on-chain from anywhere
            </div>
          </div>
          {showTip && (
            <div style={{ marginTop: 16, fontSize: 13, color: "#cbd5e1" }}>
              {isIos
                ? "On iPhone/iPad: tap the Share icon in Safari, then “Add to Home Screen.”"
                : "Tap a badge above to install the app on this device."}
            </div>
          )}
        </div>
        <div className="v2-phone-mockup">
          <div className="v2-phone-screen">
            <div className="v2-phone-notch" />
            <div className="v2-phone-bar">
              <div className="av" />
              <b>Hidden Property Intel</b>
            </div>
            <div className="v2-phone-body">
              <div className="v2-phone-card">
                <div className="img" />
                <b>$187,000 · 3bd · 2ba</b>
                <span>917 Flores Ct, Miami</span>
              </div>
              <div className="v2-phone-card">
                <div className="img" style={{ background: "linear-gradient(135deg,#dbeafe,#93c5fd)" }} />
                <b>$142,500 · 3bd · 2ba</b>
                <span>3943 Filbert Way, Orlando</span>
              </div>
            </div>
            <div className="v2-phone-nav">
              <div>⌂</div>
              <div>🔍</div>
              <div>♡</div>
              <div>≡</div>
              <div>⊙</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}