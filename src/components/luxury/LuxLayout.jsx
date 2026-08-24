import React from "react";
import { Outlet } from "react-router-dom";
import LuxNav from "@/components/luxury/LuxNav";
import LuxFooter from "@/components/luxury/LuxFooter";

export default function LuxLayout() {
  return (
    <div className="min-h-screen bg-white text-black">
      <LuxNav />
      <main className="pt-20"><Outlet /></main>
      <LuxFooter />
    </div>
  );
}