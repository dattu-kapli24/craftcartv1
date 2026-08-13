export const STORE_BLUEPRINTS = {
  resinart: {
    store: {
      name: "Shridevi Resin Art",
      tagline: "Handcrafted resin keepsakes",
      whatsappNumber: "918073511215",
      currencySymbol: "₹",
      accentColor: "#c96c8a",
      accentColorDark: "#8f4160",
      storeType: "B2C"
    },
    categories: ["All", "Frames", "Jewelry", "Wholesale"],
    products: [
      { id: "r1", name: "8 Inch Frame", price: 2600, category: "Frames", image: "/products/resin-frame-8.jpeg", inStock: true },
      { id: "r2", name: "Pendant Combo", price: 1450, category: "Jewelry", image: "/products/rose-pendant-combo.jpeg", inStock: true },
      {
        id: "r-ws-1",
        name: "Bulk Frames (MOQ 10)",
        price: 2000,
        category: "Wholesale",
        image: "/products/resin-frame-8.jpeg",
        inStock: true,
        moq: 10,
        sku: "WS-FRAME-8",
        bulkPricing: [{ minQty: 50, price: 1800 }]
      }
    ]
  },
  bakers: {
    store: {
      name: "Bakers Cart",
      tagline: "Freshly baked goodness",
      whatsappNumber: "918073511215",
      currencySymbol: "₹",
      accentColor: "#d2691e",
      accentColorDark: "#8b4513",
      storeType: "B2C"
    },
    categories: ["All", "Cakes", "Cookies"],
    products: [
      { id: "b1", name: "Chocolate Cake", price: 950, category: "Cakes", image: "/products/bakers-chocolate-cake.jpg", inStock: true },
      { id: "b2", name: "Cookie Box", price: 600, category: "Cookies", image: "/products/bakers-cupcake-box.jpg", inStock: true }
    ]
  }
};
