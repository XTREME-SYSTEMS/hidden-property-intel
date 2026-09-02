import React from "react";
import ROICalculator from "@/components/ROICalculator";
import ExitStrategyModel from "@/components/ExitStrategyModel";
import Seo from "@/components/Seo";

export default function Calculators() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <Seo
        title="Real Estate Investment Calculators — ROI, Flip, BRRRR, Wholesale"
        description="Free real estate investment calculators. Model ROI for long-term rentals, fix & flip, wholesale assignments, and short-term rentals. Compare Flip, BRRRR, Buy & Hold, and Wholesale exit strategies on the same property with live updates."
        keywords="real estate ROI calculator, investment property calculator, fix and flip calculator, BRRRR calculator, wholesale real estate calculator, rental property ROI, cash flow calculator, cap rate calculator, ARV calculator, after repair value, exit strategy real estate, real estate investment analysis, property investment model, flip profit calculator, BRRRR method, wholesale assignment fee, short-term rental calculator, Airbnb ROI calculator"
        path="/calculators"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Real Estate Investment Calculators",
          "description": "Free ROI, flip, BRRRR, and wholesale real estate investment calculators with live updates.",
          "url": "https://hiddenpropertyintel.com/calculators",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "isPartOf": { "@id": "https://hiddenpropertyintel.com/#website" }
        }}
      />
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