// Centralized business identity — update here to propagate everywhere
export const BUSINESS = {
  legalEntity: "Strategic Minds AI LLC",
  brand: "Hidden Property Intel",
  phone: "+19548848885",
  phoneDisplay: "954-884-8885",
  email: "steve@giordanocustoms.com",
  broker: "Steve Giordano",
  brokerage: "Giordano Customs",
  address: "951 SW Country Club Dr, Suite 102",
  city: "Port St. Lucie",
  state: "FL",
  zip: "34986",
};

export const DISTRESS_TYPES = [
  "pre-foreclosure", "foreclosure", "probate_inherited", "tax_delinquent",
  "code_violation", "divorce", "bankruptcy", "auction", "short_sale", "bank_owned",
];

export const PROPERTY_TYPES = ["residential", "commercial", "land", "multi-family", "mixed-use"];

export const DISTRESS_LABELS = {
  "pre-foreclosure": "Pre-Foreclosure",
  "foreclosure": "Foreclosure",
  "probate_inherited": "Probate / Inherited",
  "tax_delinquent": "Tax Delinquent",
  "code_violation": "Code Violation",
  "divorce": "Divorce",
  "bankruptcy": "Bankruptcy",
  "auction": "Auction",
  "short_sale": "Short Sale",
  "bank_owned": "Bank Owned",
};