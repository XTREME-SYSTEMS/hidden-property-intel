import React from "react";
import DealAnalyzer from "@/components/DealAnalyzer";

export default function Calculators() {
  return (
    <div className="bg-white">
      <section className="bg-[#0a0a0a] px-6 py-16 text-white lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#c5a059]">Deal Analyzer</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Run the numbers.</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Model any distressed deal in real time. Every metric updates live as you type — ROI, cash-on-cash, projected profit, and annualized returns.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12 lg:py-14">
        <DealAnalyzer />
      </section>
    </div>
  );
}