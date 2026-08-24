export const money = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

export const num = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");

export const pct = (n) => (typeof n === "number" ? `${n.toFixed(1)}%` : "—");