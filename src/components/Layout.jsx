import React from "react";
import { Outlet } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1A2B22]">
      <Nav />
      <main><Outlet /></main>
      <Footer />
    </div>
  );
}