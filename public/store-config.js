/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes `const` to the module).
window.STORE_CONFIG = {

  /* ---------- Store identity ---------- */
  store: {
    name: "CraftCreative Cart",
    tagline: "",
    // WhatsApp number in international format, digits only (no +, no spaces, no dashes)
    // Example: India 91 98765 43210  ->  "919876543210"
    whatsappNumber: "918073511215",
    currencySymbol: "₹",
    accentColor: "#c96c8a",      // rose-pink resin art accent
    accentColorDark: "#8f4160",  // deeper rose for hover/gradient
  },

  /* ---------- Category filter pills (first one is the default) ---------- */
  categories: ["All", "Resin Art", "Crochet", "Bakers", "Gifting"],

  /* ---------- Products ----------
   * image: can be a local path ("/products/saree1.jpg") or any URL.
   * originalPrice: optional — show a slashed price + discount %.
   * inStock: false greys out the card and disables add-to-cart.
   */
  products: [
    {
      id: "resin-frame-8",
      name: "8 Inch Resin Frame",
      price: 2600,
      category: "Resin Art",
      image: "/products/resin-frame-8.jpeg",
      description: "Elegant 8-inch resin frame with a smooth glossy finish and artistic detailing.",
      inStock: true,
    },
    {
      id: "rose-pendant-combo",
      name: "Rose Black & Pendant Combo",
      price: 1450,
      category: "Resin Art",
      image: "/products/rose-pendant-combo.jpeg",
      description: "A charming resin combo featuring rose tones and delicate pendant accents.",
      inStock: true,
    },
    {
      id: "rose-preservation-memento",
      name: "Rose Preservation Memento Style",
      price: 1500,
      originalPrice: 1600,
      category: "Resin Art",
      image: "/products/rose-preservation-memento.jpeg",
      description: "Premium memorial-style resin keepsake with a rich rose-inspired finish.",
      inStock: true,
    },
    {
      id: "memento-style",
      name: "Memento Style Resin Art",
      price: 3500,
      category: "Resin Art",
      image: "/products/memento-style.jpeg",
      description: "Elegant memento-style resin artwork with a timeless finish and premium detailing.",
      inStock: true,
    },
    {
      id: "crochet-flower-bouquet",
      name: "Crochet Flower Bouquet",
      price: 1200,
      category: "Crochet",
      image: "/products/crochet-flower-bouquet.jpg",
      description: "Hand-crocheted everlasting flower bouquet in soft pastel yarns.",
      inStock: true,
    },
    {
      id: "crochet-amigurumi-toy",
      name: "Amigurumi Teddy Trio",
      price: 850,
      category: "Crochet",
      image: "/products/crochet-amigurumi-toy.jpg",
      description: "Cuddly hand-stitched amigurumi teddies, perfect for nurseries and gifting.",
      inStock: true,
    },
    {
      id: "crochet-tote-bag",
      name: "Crochet Tote Bag",
      price: 1500,
      originalPrice: 1750,
      category: "Crochet",
      image: "/products/crochet-tote-bag.jpg",
      description: "Sturdy handmade mesh tote in cotton yarn with a contrast panel.",
      inStock: true,
    },
    {
      id: "bakers-chocolate-cake",
      name: "Homemade Chocolate Cake",
      price: 950,
      category: "Bakers",
      image: "/products/bakers-chocolate-cake.jpg",
      description: "Rich eggless chocolate cake baked fresh to order — 500g.",
      inStock: true,
    },
    {
      id: "bakers-cupcake-box",
      name: "Frosted Cupcake Box",
      price: 600,
      category: "Bakers",
      image: "/products/bakers-cupcake-box.jpg",
      description: "Box of six swirl-frosted cupcakes with seasonal sprinkles.",
      inStock: true,
    },
    {
      id: "bakers-cookie-hamper",
      name: "Choco Chip Cookie Hamper",
      price: 750,
      category: "Bakers",
      image: "/products/bakers-cookie-hamper.jpg",
      description: "Freshly baked chocolate chip cookies packed in a gift-ready hamper.",
      inStock: true,
    },
    {
      id: "gifting-hamper-basket",
      name: "Festive Gift Hamper Basket",
      price: 2200,
      category: "Gifting",
      image: "/products/gifting-hamper-basket.jpg",
      description: "Curated hamper basket with handmade treats, wrapped and ribboned.",
      inStock: true,
    },
    {
      id: "gifting-wrapped-box",
      name: "Premium Wrapped Gift Box",
      price: 1100,
      category: "Gifting",
      image: "/products/gifting-wrapped-box.jpg",
      description: "Elegant gift box with satin ribbon styling — customise the contents.",
      inStock: true,
    },
    {
      id: "gifting-scented-candle",
      name: "Handpoured Scented Candle Set",
      price: 900,
      category: "Gifting",
      image: "/products/gifting-scented-candle.jpg",
      description: "Set of hand-poured soy candles in assorted fragrances.",
      inStock: true,
    },
  ],
};
