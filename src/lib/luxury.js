export const IMAGES = {
  hero: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/2f466fa1b_generated_image.png",
  living: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/1dd38ac4d_generated_image.png",
  pool: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/589150504_generated_image.png",
  penthouse: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/7bc2db482_generated_image.png",
  kitchen: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/b615fd174_generated_image.png",
  bedroom: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/cd8e1e116_generated_image.png",
  estate: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/c32957146_generated_image.png",
  manor: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/4c7ef3a70_generated_image.png",
  interior: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/6a88b8710_generated_image.png",
  aerial: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/6b91c6a13_generated_image.png",
};

export const LOGOS = [
  { id: 1, name: "Line Art", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/3eb8721ab_generated_image.png" },
  { id: 2, name: "Negative Space", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/0ae99915f_generated_image.png" },
  { id: 3, name: "Crest Emblem", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/cef129392_generated_image.png" },
  { id: 4, name: "Gold Monogram", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/82689270b_generated_image.png" },
  { id: 5, name: "Abstract Teal", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/969b9d9b5_generated_image.png" },
  { id: 6, name: "Gold Badge", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/f3deb0352_generated_image.png" },
  { id: 7, name: "Single Stroke", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/283ae94b2_generated_image.png" },
  { id: 8, name: "Platinum Diamond", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/54154e3a4_generated_image.png" },
  { id: 9, name: "Isometric 3D", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/0ac9cb1e2_generated_image.png" },
  { id: 10, name: "Emerald Grid", url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/e58cd961e_generated_image.png" },
];

export const ESTATES = [
  { id: "e1", name: "Villa Noir", location: "Beverly Hills, California", price: 24500000, beds: 7, baths: 9, sqft: 14200, img: IMAGES.hero, tag: "Architectural" },
  { id: "e2", name: "The Glass Pavilion", location: "Bel Air, California", price: 18900000, beds: 6, baths: 8, sqft: 11800, img: IMAGES.living, tag: "Newly Listed" },
  { id: "e3", name: "Maison Argent", location: "Malibu, California", price: 32750000, beds: 8, baths: 10, sqft: 16500, img: IMAGES.pool, tag: "Oceanfront" },
  { id: "e4", name: "Sky Residence", location: "Manhattan, New York", price: 21400000, beds: 5, baths: 6, sqft: 7400, img: IMAGES.penthouse, tag: "Penthouse" },
  { id: "e5", name: "Casa Bianca", location: "Aspen, Colorado", price: 16800000, beds: 6, baths: 7, sqft: 9200, img: IMAGES.kitchen, tag: "Private" },
  { id: "e6", name: "The Monolith", location: "Miami Beach, Florida", price: 28900000, beds: 7, baths: 8, sqft: 13100, img: IMAGES.bedroom, tag: "Waterfront" },
];

export const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });