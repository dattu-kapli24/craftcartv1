/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes `const` to the module).
window.STORE_CONFIG = {

  /* ---------- Store identity ---------- */
  store: {
    name: "CraftCreative ResinArt",
    tagline: "by Shridevi",
    // WhatsApp number in international format, digits only (no +, no spaces, no dashes)
    // Example: India 91 98765 43210  ->  "919876543210"
    whatsappNumber: "919844592771",
    currencySymbol: "₹",
    accentColor: "#c96c8a",      // rose-pink resin art accent
    accentColorDark: "#8f4160",  // deeper rose for hover/gradient
  },

  /* ---------- Category filter pills (first one is the default) ---------- */
  categories: ["All", "Resin Art"],

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
      image: "https://images.pexels.com/photos/1421903/pexels-photo-1421903.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Elegant 8-inch resin frame with a smooth glossy finish and artistic detailing.",
      inStock: true,
    },
    {
      id: "rose-pendant-combo",
      name: "Rose Black & Pendant Combo",
      price: 1450,
      category: "Resin Art",
      image: "https://images.pexels.com/photos/1179532/pexels-photo-1179532.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "A charming resin combo featuring rose tones and delicate pendant accents.",
      inStock: true,
    },
    {
      id: "rose-memento",
      name: "Rose Preservation Memento Style",
      price: 3500,
      originalPrice: 3800,
      category: "Resin Art",
      image: "https://images.pexels.com/photos/4113830/pexels-photo-4113830.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Premium memorial-style resin keepsake with a rich rose-inspired finish.",
      inStock: true,
    },
  ],
};
