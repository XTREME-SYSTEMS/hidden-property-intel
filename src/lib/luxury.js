export const IMAGES = {
  hero: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/2f466fa1b_generated_image.png",
  living: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/1dd38ac4d_generated_image.png",
  pool: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/589150504_generated_image.png",
  penthouse: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/7bc2db482_generated_image.png",
  kitchen: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/b615fd174_generated_image.png",
  bedroom: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/cd8e1e116_generated_image.png",
  estate: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/bd264d797_generated_image.png",
  manor: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/567ae869d_generated_image.png",
  interior: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/a9e94bf9c_generated_image.png",
  aerial: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/14b8aad6b_generated_image.png",
};

export const ESTATES = [
  { id: "e1", name: "Villa Noir", location: "Beverly Hills, California", price: 24500000, beds: 7, baths: 9, sqft: 14200, img: IMAGES.hero, tag: "Architectural" },
  { id: "e2", name: "The Glass Pavilion", location: "Bel Air, California", price: 18900000, beds: 6, baths: 8, sqft: 11800, img: IMAGES.living, tag: "Newly Listed" },
  { id: "e3", name: "Maison Argent", location: "Malibu, California", price: 32750000, beds: 8, baths: 10, sqft: 16500, img: IMAGES.pool, tag: "Oceanfront" },
  { id: "e4", name: "Sky Residence", location: "Manhattan, New York", price: 21400000, beds: 5, baths: 6, sqft: 7400, img: IMAGES.penthouse, tag: "Penthouse" },
  { id: "e5", name: "Casa Bianca", location: "Aspen, Colorado", price: 16800000, beds: 6, baths: 7, sqft: 9200, img: IMAGES.kitchen, tag: "Private" },
  { id: "e6", name: "The Monolith", location: "Miami Beach, Florida", price: 28900000, beds: 7, baths: 8, sqft: 13100, img: IMAGES.bedroom, tag: "Waterfront" },
];

export const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });