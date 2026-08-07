/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes `const` to the module).
window.STORE_CONFIG = {

  /* ---------- Store identity ---------- */
  store: {
    name: "Saawariya Boutique",
    tagline: "Handpicked Jewelry & Accessories",
    // WhatsApp number in international format, digits only (no +, no spaces, no dashes)
    // Example: India 91 98765 43210  ->  "919876543210"
    whatsappNumber: "919876543210",
    currencySymbol: "₹",
    accentColor: "#0f766e",      // teal — change to any hex
    accentColorDark: "#115e59",  // slightly darker shade for gradients/hover
  },

  /* ---------- Category filter pills (first one is the default) ---------- */
  categories: ["All", "Jewelry", "Accessories"],

  /* ---------- Products ----------
   * image: can be a local path ("/products/saree1.jpg") or any URL.
   * originalPrice: optional — show a slashed price + discount %.
   * inStock: false greys out the card and disables add-to-cart.
   */
  products: [
    {
      id: "j1",
      name: "Layered Gold Necklace Set",
      price: 1899,
      originalPrice: 2599,
      category: "Jewelry",
      image: "https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Anti-tarnish layered necklace with matching earrings. Nickel-free.",
      inStock: true,
    },
    {
      id: "j2",
      name: "Temple Pendant Necklace",
      price: 999,
      originalPrice: 1499,
      category: "Jewelry",
      image: "https://images.pexels.com/photos/4889719/pexels-photo-4889719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "South-Indian inspired temple pendant on a delicate gold chain.",
      inStock: true,
    },
    {
      id: "j3",
      name: "Floral Gold Pendant",
      price: 799,
      originalPrice: 1199,
      category: "Jewelry",
      image: "https://images.pexels.com/photos/19564918/pexels-photo-19564918.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Minimal floral pendant — pairs beautifully with everyday wear.",
      inStock: true,
    },
    {
      id: "j4",
      name: "Goddess Layered Necklace",
      price: 1599,
      originalPrice: 2200,
      category: "Jewelry",
      image: "https://images.pexels.com/photos/14355033/pexels-photo-14355033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Statement layered necklace with goddess pendant. Festival ready.",
      inStock: true,
    },
    {
      id: "a1",
      name: "Classic Leather Handbag — Tan",
      price: 1799,
      originalPrice: 2499,
      category: "Accessories",
      image: "https://images.pexels.com/photos/36933384/pexels-photo-36933384.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Genuine leather handbag with adjustable strap and roomy interior.",
      inStock: true,
    },
    {
      id: "a2",
      name: "Quirky Handbag with Charm",
      price: 999,
      originalPrice: 1399,
      category: "Accessories",
      image: "https://images.pexels.com/photos/33853704/pexels-photo-33853704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Compact handbag with floral keychain. Lightweight and fun.",
      inStock: true,
    },
    {
      id: "a3",
      name: "Sage Green Tote Bag",
      price: 1299,
      originalPrice: 1799,
      category: "Accessories",
      image: "https://images.pexels.com/photos/22432991/pexels-photo-22432991.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Elegant structured tote in sage & beige. Fits a laptop up to 14\".",
      inStock: true,
    },
    {
      id: "a4",
      name: "Designer Statement Handbag",
      price: 2199,
      originalPrice: 2999,
      category: "Accessories",
      image: "https://images.pexels.com/photos/7747109/pexels-photo-7747109.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Eye-catching designer handbag. A conversation starter.",
      inStock: false,
    },
  ],
};
