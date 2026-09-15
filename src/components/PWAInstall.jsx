import React, { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import Logo from "@/components/luxury/Logo";

/**
 * PWA install prompt with a branded "Download" button and a "Get on mobile" button.
 * variant="nav"  -> compact single icon button for the header
 * variant="card" -> full branded card with both buttons (for landing pages)
 */
export default function PWAInstall({ variant = "nav", active = false }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIos(ios);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (ios && window.navigator.standalone === true);
    if (standalone) setInstalled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  const onMobile = () => {
    if (deferred) { install(); return; }
    if (isIos) { setShowIosTip(true); return; }
    // non-iOS without a prompt yet: nudge the user
    setShowIosTip(true);
  };

  if (installed) return null;

  if (variant === "mobiletab") {
    return (
      <button
        onClick={install}
        disabled={!deferred}
        className={`flex items-center justify-center transition-colors disabled:opacity-30 ${
          deferred ? (active ? "text-black" : "text-black/35") : "text-black/25"
        }`}
        aria-label="Install app"
      >
        <span className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors duration-200 ${deferred && active ? "bg-black/[0.04]" : ""}`}>
          <Download className="h-[21px] w-[21px]" strokeWidth={deferred && active ? 2.25 : 1.6} />
          <span className="font-brand text-[9.5px] uppercase tracking-[0.14em] leading-none">{deferred ? "Install" : "Add"}</span>
        </span>
      </button>
    );
  }

  if (variant === "nav") {
    return (
      <button
        onClick={install}
        disabled={!deferred}
        title="Install Hidden Property Intel app"
        className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-3.5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-black transition-colors hover:bg-black hover:text-white disabled:hidden"
      >
        <Download className="h-3.5 w-3.5" /> Install
      </button>
    );
  }

  // variant === "card"
  return (
    <div className="relative rounded-sm border border-black/10 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Logo variant="dark" className="h-10 w-auto" />
      </div>
      <h3 className="mt-5 font-display text-2xl font-light">Get the Hidden Property Intel app.</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-black/60">
        Install on your phone or desktop for a full-screen, app-like experience —
        offline-ready inventory browsing, no app store required.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={install}
          disabled={!deferred}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> {deferred ? "Download app" : "Add to home screen"}
        </button>
        <button
          onClick={onMobile}
          className="inline-flex items-center gap-2 rounded-sm border border-black/20 px-5 py-3.5 text-[11px] uppercase tracking-[0.25em] text-black transition-colors hover:bg-black hover:text-white"
        >
          <Smartphone className="h-4 w-4" /> Get on mobile
        </button>
      </div>
      {showIosTip && (
        <div className="mt-4 flex items-start gap-2 rounded-sm bg-black/5 px-4 py-3 text-xs text-black/60">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer" onClick={() => setShowIosTip(false)} />
          <span>On iPhone/iPad: tap the <span className="font-medium text-black">Share</span> icon in Safari, then <span className="font-medium text-black">Add to Home Screen</span>.</span>
        </div>
      )}
    </div>
  );
}