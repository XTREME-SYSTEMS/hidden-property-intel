import React, { useState, useEffect, useRef } from "react";
import {
  Lock, Wallet, FileSignature, BadgeCheck, CheckCircle2, ArrowRight,
  Clock, TrendingDown, Sparkles, Zap, RefreshCw, ChevronRight, Building2, Gavel,
} from "lucide-react";

const PHASES = [
  { id: "idle", label: "Draft Contract" },
  { id: "deployed", label: "Deployed" },
  { id: "funded", label: "Funded" },
  { id: "buyer_signed", label: "Buyer Signed" },
  { id: "seller_signed", label: "Seller Signed" },
  { id: "contingencies", label: "Contingencies" },
  { id: "confirmed", label: "Confirmed" },
  { id: "released", label: "Funds Released" },
  { id: "recorded", label: "Deed Recorded" },
];

function fakeHash() {
  return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

export default function SmartContractSimulator() {
  const [form, setForm] = useState({
    address: "1234 SE Magnolia Blvd, Port St. Lucie, FL 34983",
    purchasePrice: 185000,
    earnestPct: 3,
    contingencyDays: 10,
    inspection: true,
    financing: true,
    title: true,
  });
  const [phase, setPhase] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [contractAddr] = useState(fakeHash());
  const [txHash, setTxHash] = useState("");
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [buyerSigned, setBuyerSigned] = useState(false);
  const [sellerSigned, setSellerSigned] = useState(false);
  const [contingencyStatus, setContingencyStatus] = useState({ inspection: "pending", financing: "pending", title: "pending" });
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef(null);
  const timersRef = useRef([]);

  const earnestAmount = Math.round((form.purchasePrice * form.earnestPct) / 100);
  const gasCost = 0.42; // simulated Polygon gas in MATIC
  const platformFee = Math.round(earnestAmount * 0.03); // 3% flat
  const traditionalEscrowFee = Math.round(form.purchasePrice * 0.015); // ~1.5%
  const savings = traditionalEscrowFee - platformFee;

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg, type = "info") => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), ts, msg, type }]);
  };

  const reset = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("idle");
    setLogs([]);
    setTxHash("");
    setEscrowBalance(0);
    setBuyerSigned(false);
    setSellerSigned(false);
    setContingencyStatus({ inspection: "pending", financing: "pending", title: "pending" });
    setRunning(false);
    setStartTime(null);
    setElapsed(0);
  };

  const schedule = (fn, delay) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
  };

  const run = () => {
    reset();
    setRunning(true);
    setStartTime(Date.now());
    addLog(`Contract drafted for ${form.address}`, "draft");
    addLog(`Purchase price: $${form.purchasePrice.toLocaleString()} · Earnest: $${earnestAmount.toLocaleString()} (${form.earnestPct}%)`, "draft");

    // Phase 1: Deploy
    schedule(() => {
      const hash = fakeHash();
      setTxHash(hash);
      setPhase("deployed");
      addLog(`Deploying smart contract to Polygon Mumbai…`, "tx");
      addLog(`✅ Contract deployed at ${contractAddr.slice(0, 18)}…`, "success");
      addLog(`Gas cost: ${gasCost} MATIC (~$0.42)`, "tx");
    }, 800);

    // Phase 2: Fund escrow
    schedule(() => {
      setPhase("funded");
      setEscrowBalance(earnestAmount);
      addLog(`Depositing ${earnestAmount.toLocaleString()} USDC into escrow…`, "tx");
      addLog(`✅ Escrow funded — $${earnestAmount.toLocaleString()} USDC locked on-chain`, "success");
    }, 1800);

    // Phase 3: Buyer signs
    schedule(() => {
      setPhase("buyer_signed");
      setBuyerSigned(true);
      addLog(`Buyer signing contract on-chain…`, "tx");
      addLog(`✅ Buyer signature recorded — timestamped & immutable`, "success");
    }, 2800);

    // Phase 4: Seller signs
    schedule(() => {
      setPhase("seller_signed");
      setSellerSigned(true);
      addLog(`Seller signing contract on-chain…`, "tx");
      addLog(`✅ Seller signature recorded — both parties bound`, "success");
    }, 3800);

    // Phase 5: Contingencies
    const conts = [];
    if (form.inspection) conts.push("inspection");
    if (form.financing) conts.push("financing");
    if (form.title) conts.push("title");

    conts.forEach((c, i) => {
      schedule(() => {
        setPhase("contingencies");
        setContingencyStatus((prev) => ({ ...prev, [c]: "cleared" }));
        addLog(`Contingency check: ${c}…`, "tx");
        addLog(`✅ ${c.charAt(0).toUpperCase() + c.slice(1)} contingency cleared`, "success");
      }, 4800 + i * 1000);
    });

    // Phase 6: Confirm
    const confirmDelay = 4800 + conts.length * 1000 + 500;
    schedule(() => {
      setPhase("confirmed");
      addLog(`Both parties confirming final terms…`, "tx");
      addLog(`✅ Mutual confirmation recorded — all contingencies satisfied`, "success");
    }, confirmDelay);

    // Phase 7: Release funds
    schedule(() => {
      setPhase("released");
      setEscrowBalance(0);
      addLog(`Releasing ${earnestAmount.toLocaleString()} USDC to seller…`, "tx");
      addLog(`✅ Funds released instantly — no wire window, no bank hold`, "success");
    }, confirmDelay + 1000);

    // Phase 8: Deed recorded
    schedule(() => {
      setPhase("recorded");
      addLog(`Coordinating deed recording with county clerk…`, "tx");
      addLog(`✅ Deed recorded & settlement statement delivered`, "success");
      addLog(`🎉 Transaction complete — full audit trail on-chain`, "complete");
      setRunning(false);
    }, confirmDelay + 2000);
  };

  useEffect(() => {
    if (startTime && running) {
      const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 100) / 10), 100);
      return () => clearInterval(interval);
    }
  }, [startTime, running]);

  const phaseIndex = PHASES.findIndex((p) => p.id === phase);
  const inputCls = "w-full rounded-sm border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black";

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* LEFT: INPUT PANEL */}
      <div className="rounded-sm border border-black/10 bg-white p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gold" />
          <p className="font-display text-lg tracking-tight">Deal Parameters</p>
        </div>
        <p className="mt-1 text-xs text-black/50">Enter your deal numbers — the simulator runs the contract as if it were live on Polygon.</p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Property Address</span>
            <input className={`${inputCls} mt-1.5`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Purchase Price ($)</span>
              <input type="number" className={`${inputCls} mt-1.5`} value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Earnest Money (%)</span>
              <input type="number" className={`${inputCls} mt-1.5`} value={form.earnestPct} onChange={(e) => setForm({ ...form, earnestPct: Number(e.target.value) })} />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contingency Period (days)</span>
            <input type="number" className={`${inputCls} mt-1.5`} value={form.contingencyDays} onChange={(e) => setForm({ ...form, contingencyDays: Number(e.target.value) })} />
          </label>

          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contingencies</span>
            <div className="mt-2 space-y-2">
              {[
                { key: "inspection", label: "Inspection contingency" },
                { key: "financing", label: "Financing contingency" },
                { key: "title", label: "Clear-title contingency" },
              ].map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2.5 text-sm text-black/70">
                  <input
                    type="checkbox"
                    checked={form[c.key]}
                    onChange={(e) => setForm({ ...form, [c.key]: e.target.checked })}
                    className="h-4 w-4 rounded border-black/30 accent-black"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-5 space-y-2 rounded-sm bg-black/[0.03] p-4 text-xs">
          <div className="flex justify-between"><span className="text-black/50">Earnest money</span><span className="font-medium tabular-nums">${earnestAmount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-black/50">HPI platform fee</span><span className="font-medium tabular-nums">${platformFee.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-black/50">Traditional escrow</span><span className="tabular-nums text-black/40 line-through">${traditionalEscrowFee.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-black/10 pt-2"><span className="text-emerald-700 font-medium">You save</span><span className="font-bold tabular-nums text-emerald-700">${savings.toLocaleString()}</span></div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition hover:bg-black/80 disabled:opacity-50"
          >
            {running ? <><Zap className="h-4 w-4 animate-pulse" /> Running…</> : phase === "idle" ? <><Sparkles className="h-4 w-4" /> Deploy Contract</> : <><RefreshCw className="h-4 w-4" /> Run Again</>}
          </button>
          {phase !== "idle" && !running && (
            <button onClick={reset} className="rounded-sm border border-black/15 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-black/60 hover:bg-black/5">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: CONTRACT EXECUTION VIEW */}
      <div className="space-y-4">
        {/* Contract header */}
        <div className="rounded-sm border border-black/10 bg-[#0c0c0b] p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-sm border border-gold-warm/40">
                <Lock className="h-5 w-5 text-gold-warm" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Smart Contract</p>
                <p className="font-mono text-xs text-gold-warm">{phase === "idle" ? "Not deployed" : `${contractAddr.slice(0, 22)}…`}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Escrow Balance</p>
                <p className="font-display text-xl font-light tabular-nums text-gold-warm">${escrowBalance.toLocaleString()} <span className="text-xs text-white/40">USDC</span></p>
              </div>
              {running && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase stepper */}
        <div className="rounded-sm border border-black/10 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contract Execution</p>
          <div className="mt-4 flex flex-wrap gap-1">
            {PHASES.map((p, i) => {
              const done = phaseIndex > i || (phaseIndex === i && !running);
              const active = phaseIndex === i && running;
              return (
                <React.Fragment key={p.id}>
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
                    done ? "bg-emerald-100 text-emerald-700" : active ? "bg-black text-white" : "bg-black/5 text-black/40"
                  }`}>
                    {done ? <CheckCircle2 className="h-3 w-3" /> : active ? <Zap className="h-3 w-3 animate-pulse" /> : <span className="h-3 w-3 rounded-full border border-current" />}
                    {p.label}
                  </div>
                  {i < PHASES.length - 1 && <ChevronRight className="h-3 w-3 self-center text-black/20" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Two-column: state + logs */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contract state */}
          <div className="rounded-sm border border-black/10 bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contract State</p>
            <div className="mt-4 space-y-3">
              <StateRow icon={FileSignature} label="Buyer signature" done={buyerSigned} />
              <StateRow icon={FileSignature} label="Seller signature" done={sellerSigned} />
              {form.inspection && <StateRow icon={BadgeCheck} label="Inspection" status={contingencyStatus.inspection} />}
              {form.financing && <StateRow icon={BadgeCheck} label="Financing" status={contingencyStatus.financing} />}
              {form.title && <StateRow icon={BadgeCheck} label="Clear title" status={contingencyStatus.title} />}
              <StateRow icon={Wallet} label="Funds released" done={phase === "released" || phase === "recorded"} />
              <StateRow icon={Building2} label="Deed recorded" done={phase === "recorded"} />
            </div>
          </div>

          {/* Transaction logs */}
          <div className="rounded-sm border border-black/10 bg-[#0c0c0b] p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Transaction Log</p>
              {txHash && <p className="font-mono text-[9px] text-white/30">{txHash.slice(0, 16)}…</p>}
            </div>
            <div ref={logRef} className="mt-4 h-[280px] space-y-1.5 overflow-y-auto pr-2 font-mono text-[11px] leading-relaxed">
              {logs.length === 0 && <p className="text-white/30">Awaiting contract deployment…</p>}
              {logs.map((l) => (
                <div key={l.id} className={`flex gap-2 ${l.type === "success" ? "text-emerald-400" : l.type === "complete" ? "text-gold-warm font-bold" : l.type === "draft" ? "text-white/50" : "text-white/70"}`}>
                  <span className="shrink-0 text-white/30">{l.ts}</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results band — only when complete */}
        {phase === "recorded" && (
          <div className="grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 md:grid-cols-3">
            <div className="bg-emerald-50 p-5">
              <Clock className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 font-display text-2xl font-light text-emerald-700">{form.contingencyDays + 4} days</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600/70">Total close time</p>
              <p className="mt-1 text-xs text-black/50">vs. 30–45 days traditional</p>
            </div>
            <div className="bg-white p-5">
              <TrendingDown className="h-5 w-5 text-gold" />
              <p className="mt-3 font-display text-2xl font-light">${savings.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Escrow savings</p>
              <p className="mt-1 text-xs text-black/50">${platformFee.toLocaleString()} vs ${traditionalEscrowFee.toLocaleString()}</p>
            </div>
            <div className="bg-black p-5 text-white">
              <Lock className="h-5 w-5 text-gold-warm" />
              <p className="mt-3 font-display text-2xl font-light text-gold-warm">$0</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Wire-fraud risk</p>
              <p className="mt-1 text-xs text-white/50">Funds never left the chain</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StateRow({ icon: Icon, label, done, status }) {
  const cleared = done || status === "cleared";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${cleared ? "text-emerald-600" : "text-black/30"}`} />
        <span className={`text-sm ${cleared ? "text-black/80" : "text-black/40"}`}>{label}</span>
      </div>
      {cleared ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : status === "pending" ? (
        <span className="text-[10px] uppercase tracking-[0.15em] text-amber-600">Pending</span>
      ) : (
        <span className="text-[10px] uppercase tracking-[0.15em] text-black/30">Waiting</span>
      )}
    </div>
  );
}