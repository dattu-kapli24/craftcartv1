export const STORE_BLUEPRINTS = {
  gifting: {
    store: {
      name: "Luxury Gift Cart",
      tagline: "Curated hampers for every celebration",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#be185d",
      accentColorDark: "#831843"
    },
    categories: ["All", "Premium Hampers", "Gift Boxes", "Corporate"],
    products: [
      { id: "gift-1", name: "Luxury Celebration Hamper", price: 3500, category: "Premium Hampers", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800", description: "A grand selection of chocolates, nuts, and a scented candle.", inStock: true },
      { id: "gift-2", name: "Relaxation Spa Box", price: 2200, category: "Gift Boxes", image: "https://images.unsplash.com/photo-1544175089-6014404972ab?w=800", description: "Self-care kit with essential oils and organic soaps.", inStock: true },
      { id: "gift-3", name: "Gourmet Coffee Set", price: 1800, category: "Gift Boxes", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800", description: "Premium coffee beans with a ceramic mug and stirrer.", inStock: true },
      { id: "gift-4", name: "Festive Sweet Platter", price: 1200, category: "Hampers", image: "https://images.unsplash.com/photo-1581339399838-2a120c18bba3?w=800", description: "Assorted traditional sweets in a beautiful reusable box.", inStock: true }
    ]
  },
  crochet: {
    store: {
      name: "Handmade Crochet Haven",
      tagline: "Soft, hand-stitched joy for your little ones",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#0891b2",
      accentColorDark: "#0e7490"
    },
    categories: ["All", "Amigurumi Toys", "Tote Bags", "Apparel"],
    products: [
      { id: "crochet-1", name: "Hand-Stitched Bunny", price: 850, category: "Amigurumi Toys", image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800", description: "Cuddly organic cotton bunny toy.", inStock: true },
      { id: "crochet-2", name: "Boho Cotton Tote", price: 1500, category: "Tote Bags", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800", description: "Handmade mesh tote for daily essentials.", inStock: true },
      { id: "crochet-3", name: "Pastel Teddy Trio", price: 1200, category: "Amigurumi Toys", image: "https://images.unsplash.com/photo-1620002093398-8f16081af5ee?w=800", description: "Set of three miniature colorful bears.", inStock: true },
      { id: "crochet-4", name: "Baby Crochet Beanie", price: 450, category: "Apparel", image: "https://images.unsplash.com/photo-1553531384-411a247cc73b?w=800", description: "Soft woollen cap for infants.", inStock: true }
    ]
  },
  bakers: {
    store: {
      name: "The Classic Bakery",
      tagline: "Freshly baked goodness delivered to your doorstep",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#d2691e",
      accentColorDark: "#8b4513"
    },
    categories: ["All", "Classic Cakes", "Premium Cakes", "Cookies"],
    products: [
      { id: "cake-1", name: "Belgian Truffle Cake", price: 1250, category: "Premium Cakes", image: "https://images.unsplash.com/photo-1578985543662-477dac423cf9?w=800", description: "Rich dark chocolate with ganache layers.", inStock: true },
      { id: "cake-2", name: "Berry Vanilla Delight", price: 950, category: "Classic Cakes", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800", description: "Light sponge cake with fresh strawberries.", inStock: true },
      { id: "cake-3", name: "Pineapple Upside Down", price: 850, category: "Classic Cakes", image: "https://images.unsplash.com/photo-1596451190630-186aff535bf2?w=800", description: "Traditional caramelized pineapple cake.", inStock: true },
      { id: "cake-4", name: "Assorted Cookie Box", price: 600, category: "Cookies", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800", description: "Box of 12 freshly baked butter cookies.", inStock: true }
    ]
  },
  wholesale: {
    store: {
      name: "Wholesale Hub",
      tagline: "Bulk supplies for retailers and businesses",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#1e293b",
      accentColorDark: "#0f172a"
    },
    categories: ["All", "Raw Materials", "Packaging", "Bulk Goods"],
    products: [
      {
        id: "b2b-1",
        name: "Eco-Friendly Paper Bags",
        price: 15,
        moq: 500,
        sku: "BAG-ECO-001",
        packSize: "Bundle of 500",
        category: "Packaging",
        image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
        description: "Large biodegradable brown paper bags for retail.",
        inStock: true,
        bulkPricing: [
          { minQty: 500, maxQty: 999, unitPrice: 15 },
          { minQty: 1000, maxQty: 4999, unitPrice: 12 },
          { minQty: 5000, maxQty: null, unitPrice: 10 }
        ]
      },
      {
        id: "b2b-2",
        name: "Premium Cotton Yarn Spools",
        price: 250,
        moq: 20,
        sku: "YARN-COT-05",
        packSize: "Box of 20 spools",
        category: "Raw Materials",
        image: "https://images.unsplash.com/photo-1606212134546-609809968453?w=800",
        description: "100% organic cotton yarn for handicraft businesses.",
        inStock: true,
        bulkPricing: [
          { minQty: 20, maxQty: 49, unitPrice: 250 },
          { minQty: 50, maxQty: null, unitPrice: 210 }
        ]
      }
    ]
  }
};
