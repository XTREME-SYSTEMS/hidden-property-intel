import React from "react";
import { Outlet } from "react-router-dom";
import LuxNav from "@/components/luxury/LuxNav";
import LuxFooter from "@/components/luxury/LuxFooter";
import MobileNav from "@/components/MobileNav";

export default function LuxLayout() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-black">
      <LuxNav />
      <main className="w-full min-w-0 overflow-x-hidden pt-20 md:pt-28 pb-[74px] lg:pb-0"><Outlet /></main>
      <LuxFooter />
      <MobileNav />
    </div>
  );
}