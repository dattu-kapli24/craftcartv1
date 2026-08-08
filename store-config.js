/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes `const` to the module).
window.STORE_CONFIG = {
  "store": {
    "name": "Baker's Classic Cakes",
    "tagline": "Freshly baked goodness delivered to your doorstep",
    "whatsappNumber": "918073511215",
    "currencySymbol": "₹",
    "accentColor": "#d2691e",
    "accentColorDark": "#8b4513"
  },
  "categories": [
    "All",
    "Classic Cakes",
    "Premium Cakes"
  ],
  "products": [
    {
      "id": "chocolate-truffle",
      "name": "Chocolate Truffle Cake",
      "price": 950,
      "originalPrice": 1100,
      "category": "Classic Cakes",
      "image": "/products/chocolate-truffle.jpg",
      "description": "Rich and decadent chocolate truffle cake made with premium cocoa.",
      "inStock": true
    },
    {
      "id": "vanilla-bean",
      "name": "Vanilla Bean Cake",
      "price": 800,
      "category": "Classic Cakes",
      "image": "/products/vanilla-bean.jpg",
      "description": "Classic vanilla cake infused with real vanilla bean extract.",
      "inStock": true
    },
    {
      "id": "red-velvet",
      "name": "Red Velvet Cake",
      "price": 1050,
      "category": "Premium Cakes",
      "image": "/products/red-velvet.jpg",
      "description": "Elegant red velvet cake with a smooth cream cheese frosting.",
      "inStock": true
    },
    {
      "id": "black-forest",
      "name": "Black Forest Cake",
      "price": 900,
      "category": "Classic Cakes",
      "image": "/products/black-forest.jpg",
      "description": "Traditional Black Forest cake with layers of chocolate and cherries.",
      "inStock": true
    },
    {
      "id": "butterscotch-cake",
      "name": "Butterscotch Crunch Cake",
      "price": 950,
      "category": "Premium Cakes",
      "image": "/products/butterscotch-cake.jpg",
      "description": "Delicious butterscotch cake with crunchy praline bits.",
      "inStock": true
    },
    {
      "id": "new-1786181839228",
      "name": "rosecake",
      "price": 2000,
      "category": "All",
      "image": "/products/1786181863592-rose_cake.PNG",
      "description": "rose berry cake",
      "inStock": true
    },
    {
      "id": "new-1786199513074",
      "name": "Pineapple cake",
      "price": 550,
      "category": "Classic Cakes",
      "image": "/products/1786199617712-pineapplecake.png",
      "description": "pineapple cake baked with fruits",
      "inStock": true
    }
  ]
};
