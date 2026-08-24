import React from "react";
import ROICalculator from "@/components/ROICalculator";

export default function Calculators() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Investment calculators</h1>
      <p className="mt-3 max-w-2xl text-[#6B7B72]">
        Model any deal four ways — long-term rental, fix &amp; flip, wholesale assignment, or short-term rental.
        Every output updates live as you type.
      </p>
      <div className="mt-9"><ROICalculator /></div>
    </div>
  );
}