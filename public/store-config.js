/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes `const` to the module).
window.STORE_CONFIG = {

  /* ---------- Store identity ---------- */
  store: {
    name: "Bakers Wholesale World",
    tagline: "Premium Baking Supplies & Packaging",
    whatsappNumber: "918129853443",
    currencySymbol: "₹",
    accentColor: "#f59e0b",
    accentColorDark: "#b45309",
    storeType: "B2B",
  },

  /* ---------- Category filter pills (first one is the default) ---------- */
  categories: ["All", "Packaging & Boxes", "Baking Ingredients & Additives", "Cake Toppers & Decor", "Sprinkles & Edible Decor", "Cake Stands & Displays", "Baking Pans & Trays"],

  /* ---------- Products ---------- */
  products: [
    { id: "prod_001", name: "8inch pvc box", price: 89, category: "Packaging & Boxes", image: "/products/pvc-box-8.jpg", inStock: true, moq: 1, description: "Transparent box size: 8\"x8\" inches (8x8x4)" },
    { id: "prod_002", name: "Evaporex Bakehaven", price: 90, category: "Baking Ingredients & Additives", image: "/products/evaporex.jpg", inStock: true, moq: 1, description: "Bake Haven Liquid Evaporex (50ml)" },
    { id: "prod_003", name: "Football toy set", price: 279, category: "Cake Toppers & Decor", image: "/products/football-topper.jpg", inStock: true, moq: 1, description: "Football toy set cake toppers with goal posts and players" },
    { id: "prod_004", name: "Edible Glue", price: 85, category: "Baking Ingredients & Additives", image: "/products/edible-glue.jpg", inStock: true, moq: 1, description: "Bake Haven 100% Edible Glue (30g)" },
    { id: "prod_005", name: "Sprinkles blue mixed-55gram bottle", price: 54, category: "Sprinkles & Edible Decor", image: "/products/blue-sprinkles.jpg", inStock: true, moq: 1, description: "Blue mixed sprinkles in 55-gram bottle" },
    { id: "prod_010", name: "Gold sugarballs big & small", price: 54, category: "Sprinkles & Edible Decor", image: "/products/gold-sugarballs.jpg", inStock: true, moq: 1, description: "Gold sugar balls available in big and small sizes (50gram)" },
    { id: "prod_011", name: "Sugarballs silver big & small", price: 54, category: "Sprinkles & Edible Decor", image: "/products/silver-sugarballs.jpg", inStock: true, moq: 1, description: "Silver sugar balls available in big and small sizes (55gram)" },
    { id: "prod_006", name: "Geometric Cake Stand-Gold", price: 690, category: "Cake Stands & Displays", image: "/products/geometric-stand.jpg", inStock: true, moq: 1, description: "10inch high quality product, gold finish geometric base" },
    { id: "prod_007", name: "Cake seperater round", price: 499, category: "Cake Stands & Displays", image: "/products/cake-separator.jpg", inStock: true, moq: 1, description: "Metallic detachable round cake separator" },
    { id: "prod_008", name: "Mouse cups with lid", price: 14, category: "Packaging & Cups", image: "/products/mousse-cups.jpg", inStock: true, moq: 10, description: "165ml acrylic material mousse cups with lid" },
    { id: "prod_012", name: "Girl front topper 10pcs packets", price: 59, category: "Cake Toppers & Decor", image: "/products/girl-topper.jpg", inStock: true, moq: 1, description: "Princess/Girl front cake topper set, 10pcs per packet" },
    { id: "prod_014", name: "Hbd acrylic toppers", price: 29, category: "Cake Toppers & Decor", image: "/products/hbd-topper.jpg", inStock: true, moq: 1, description: "Gold Happy Birthday acrylic crown cake topper" },
    { id: "prod_013", name: "Coin toppers per pcs 2.5inch", price: 17, category: "Cake Toppers & Decor", image: "/products/coin-toppers.jpg", inStock: true, moq: 1, description: "2.5inch acrylic coin toppers" },
    { id: "prod_009", name: "Brownie tray aluminum", price: 155, category: "Baking Pans & Trays", image: "/products/brownie-tray.jpg", inStock: true, moq: 1, description: "Aluminum brownie trays available in multiple sizes." }
  ],
};
