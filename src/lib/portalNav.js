import {
  LayoutDashboard, Sparkles, Building2, TrendingUp, Home, Bell,
  Calculator, ShieldCheck, Settings, Crown,
} from "lucide-react";

const ALL = ["investor", "seller", "agent", "wholesaler", "manager", "partner", "admin"];

export const PORTAL_NAV = [
  { label: "Dashboard", path: "/portal", icon: LayoutDashboard, roles: ALL },
  { label: "Onboarding", path: "/portal/onboarding", icon: Sparkles, roles: ALL, badge: "Start here" },
  { label: "Property Command Center", path: "/portal/properties", icon: Building2, roles: ALL },
  { label: "My Deals", path: "/investor/pipeline", icon: TrendingUp, roles: ["investor", "agent", "wholesaler", "admin"] },
  { label: "Seller Dashboard", path: "/seller/dashboard", icon: Home, roles: ["seller", "admin"] },
  { label: "Alerts", path: "/alerts", icon: Bell, roles: ALL },
  { label: "Deal Calculator", path: "/deal-calculator", icon: Calculator, roles: ["investor", "agent", "wholesaler", "admin"] },
  { label: "Smart Contracts", path: "/smart-contracts", icon: ShieldCheck, roles: ALL },
  { label: "Settings", path: "/portal/settings", icon: Settings, roles: ALL },
  { label: "Admin Dashboard", path: "/admin", icon: Crown, roles: ["admin"] },
];

export const PORTAL_ROLES = [
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "Find off-market distressed deals, bid, and close with smart-contract escrow." },
  { id: "seller", label: "Seller", icon: Home, desc: "List your distressed or inherited property and receive cash offers." },
  { id: "agent", label: "Agent / Broker", icon: ShieldCheck, desc: "Manage deals, disclosures, and digital signatures for your clients." },
  { id: "wholesaler", label: "Wholesaler", icon: Building2, desc: "Assign contracts and grow your buyer list with verified off-market inventory." },
  { id: "manager", label: "Property Manager", icon: LayoutDashboard, desc: "Track maintenance, occupancy, and vendor coordination across your portfolio." },
  { id: "partner", label: "Partner / Vendor", icon: Bell, desc: "Offer services (title, legal, contracting) to the PropertyIntel network." },
];