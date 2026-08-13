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
  },
  bakerswholesale: {
    store: {
      name: "Bakers Wholesale World",
      tagline: "Premium Baking Supplies & Packaging",
      whatsappNumber: "918129853443",
      currencySymbol: "₹",
      accentColor: "#f59e0b",
      accentColorDark: "#b45309",
      storeType: "B2B"
    },
    categories: ["All", "Packaging & Boxes", "Baking Ingredients & Additives", "Cake Toppers & Decor", "Sprinkles & Edible Decor", "Cake Stands & Displays", "Baking Pans & Trays"],
    products: [
      { id: "prod_001", name: "8inch pvc box", price: 89, category: "Packaging & Boxes", image: "/products/pvc-box-8.jpg", inStock: true, moq: 1 },
      { id: "prod_002", name: "Evaporex Bakehaven", price: 90, category: "Baking Ingredients & Additives", image: "/products/evaporex.jpg", inStock: true, moq: 1 },
      { id: "prod_003", name: "Football toy set", price: 279, category: "Cake Toppers & Decor", image: "/products/football-topper.jpg", inStock: true, moq: 1 },
      { id: "prod_004", name: "Edible Glue", price: 85, category: "Baking Ingredients & Additives", image: "/products/edible-glue.jpg", inStock: true, moq: 1 },
      { id: "prod_005", name: "Sprinkles blue mixed-55gram bottle", price: 54, category: "Sprinkles & Edible Decor", image: "/products/blue-sprinkles.jpg", inStock: true, moq: 1 },
      { id: "prod_010", name: "Gold sugarballs big & small", price: 54, category: "Sprinkles & Edible Decor", image: "/products/gold-sugarballs.jpg", inStock: true, moq: 1 },
      { id: "prod_011", name: "Sugarballs silver big & small", price: 54, category: "Sprinkles & Edible Decor", image: "/products/silver-sugarballs.jpg", inStock: true, moq: 1 },
      { id: "prod_006", name: "Geometric Cake Stand-Gold", price: 690, category: "Cake Stands & Displays", image: "/products/geometric-stand.jpg", inStock: true, moq: 1 },
      { id: "prod_007", name: "Cake seperater round", price: 499, category: "Cake Stands & Displays", image: "/products/cake-separator.jpg", inStock: true, moq: 1 },
      { id: "prod_008", name: "Mouse cups with lid", price: 14, category: "Packaging & Cups", image: "/products/mousse-cups.jpg", inStock: true, moq: 10 },
      { id: "prod_012", name: "Girl front topper 10pcs packets", price: 59, category: "Cake Toppers & Decor", image: "/products/girl-topper.jpg", inStock: true, moq: 1 },
      { id: "prod_014", name: "Hbd acrylic toppers", price: 29, category: "Cake Toppers & Decor", image: "/products/hbd-topper.jpg", inStock: true, moq: 1 },
      { id: "prod_013", name: "Coin toppers per pcs 2.5inch", price: 17, category: "Cake Toppers & Decor", image: "/products/coin-toppers.jpg", inStock: true, moq: 1 },
      { id: "prod_009", name: "Brownie tray aluminum", price: 155, category: "Baking Pans & Trays", image: "/products/brownie-tray.jpg", inStock: true, moq: 1 }
    ]
  }
};
