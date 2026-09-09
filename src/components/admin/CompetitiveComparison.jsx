import React from "react";
import { Check, X, Minus, Trophy } from "lucide-react";

/**
 * Competitive comparison: Traditional methods vs existing tech competitors
 * vs Hidden Property Intel — across the full deal workflow.
 * Data is curated from public knowledge of the distressed-RE tech space.
 */
const ROWS = [
  { cat: "Sourcing", traditional: "Driving for dollars, MLS, courthouse runs", competitors: "PropStream / Reonomy / Attom data feeds", hpi: "Automated scrape of 30+ FL distress sources + Shadow AI", tWin: true, cWin: false },
  { cat: "AI Valuation", traditional: "$500 appraisal, manual comps", competitors: "Basic ARV estimate, no distress scoring", hpi: "15-category enrichment + ML opportunity score 0-100", tWin: true, cWin: true },
  { cat: "Outreach", traditional: "Cold calls + individual emails", competitors: "Email blast tools (no multi-channel)", hpi: "Xtreme Comms — email, SMS, MMS, AI voice in one row", tWin: true, cWin: true },
  { cat: "Follow-up", traditional: "Sticky notes & memory", competitors: "Basic CRM reminders", hpi: "Automated frequency-based follow-up + AI tone scoring", tWin: true, cWin: true },
  { cat: "Contracts", traditional: "Paper purchase agreements, attorney-drafted", competitors: "DocuSign templates only", hpi: "Workflow-embedded legal templates, auto-populate by reference", tWin: true, cWin: true },
  { cat: "Escrow", traditional: "Title company escrow, 30-45 days", competitors: "Not offered", hpi: "Polygon smart-contract escrow, 3% fee, days not weeks", tWin: true, cWin: false },
  { cat: "Notary", traditional: "Schedule in-person notary", competitors: "Not offered", hpi: "Integrated digital notary workflow (RON-ready)", tWin: true, cWin: false },
  { cat: "Closing Speed", traditional: "30-45 days", competitors: "Same as traditional", hpi: "7-14 days via on-chain escrow", tWin: true, cWin: false },
  { cat: "Cost to Investor", traditional: "$3-5K closing + appraisal", competitors: "$99-149/mo subscription", hpi: "$49-499/mo + 3% escrow, first month waived", tWin: false, cWin: true },
  { cat: "Florida Distress Focus", traditional: "General, manual", competitors: "National data, no FL niche", hpi: "Purpose-built for FL probate, tax, foreclosure, code", tWin: true, cWin: true },
  { cat: "Automation", traditional: "None", competitors: "Limited workflows", hpi: "Autonomous master loop + scheduled pipelines", tWin: true, cWin: true },
  { cat: "AI Copilot", traditional: "None", competitors: "None", hpi: "Eden Skye — full system access agent", tWin: true, cWin: true },
];

const Cell = ({ win, text }) => {
  if (win === true) return <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" />{text}</span>;
  if (win === false) return <span className="inline-flex items-center gap-1 text-red-600"><X className="h-3.5 w-3.5" />{text}</span>;
  return <span className="inline-flex items-center gap-1 text-black/50"><Minus className="h-3.5 w-3.5" />{text}</span>;
};

export default function CompetitiveComparison() {
  const hpiWins = ROWS.filter(r => r.tWin || r.cWin).length;
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#0F4B3F]">
          <Trophy className="h-5 w-5 text-[#e4b653]" />
        </div>
        <div>
          <h2 className="font-display text-lg font-light">Competitive Positioning</h2>
          <p className="text-xs text-black/50">Traditional methods vs existing technology vs Hidden Property Intel — across the full workflow.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-black/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0c0d0e] text-left text-[10px] uppercase tracking-[0.2em] text-white/60">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Traditional</th>
              <th className="px-4 py-3">Existing Tech</th>
              <th className="px-4 py-3 text-[#e4b653]">Hidden Property Intel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 bg-white">
            {ROWS.map(r => (
              <tr key={r.cat} className="align-top hover:bg-black/[0.02]">
                <td className="px-4 py-3 font-medium">{r.cat}</td>
                <td className="px-4 py-3 text-xs"><Cell win={r.tWin ? false : null} text={r.traditional} /></td>
                <td className="px-4 py-3 text-xs"><Cell win={r.cWin ? false : null} text={r.competitors} /></td>
                <td className="px-4 py-3 text-xs"><Cell win={true} text={r.hpi} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
        <strong>Verdict:</strong> HPI wins or ties in {hpiWins} of {ROWS.length} categories — the only platform combining sourcing, AI valuation, multi-channel comms, smart-contract escrow, and automated notary in one Florida-focused workflow.
      </div>
    </div>
  );
}