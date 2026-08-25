import React from "react";
import ROICalculator from "@/components/ROICalculator";
import ExitStrategyModel from "@/components/ExitStrategyModel";

export default function Calculators() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Investment calculators</h1>
      <p className="mt-3 max-w-2xl text-[#6B7B72]">
        Model any deal four ways — long-term rental, fix &amp; flip, wholesale assignment, or short-term rental.
        Every output updates live as you type.
      </p>
      <div className="mt-9"><ROICalculator /></div>
      <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">Exit-strategy model</h2>
      <p className="mt-2 text-[#6B7B72]">Compare Flip, BRRRR, Buy &amp; Hold, and Wholesale on the same property.</p>
      <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-[#E5EDEA] sm:p-8">
        <ExitStrategyModel />
      </div>
    </div>
  );
}