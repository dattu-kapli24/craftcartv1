export const STORE_BLUEPRINTS = {
  gifting: {
    store: {
      name: "OrderSpot Gifts",
      tagline: "Premium hampers for your loved ones",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#be185d",
      accentColorDark: "#831843"
    },
    categories: ["All", "Premium Hampers", "Gift Boxes", "Corporate", "Flowers"],
    products: [
      { id: "gift-1", name: "Luxury Celebration Hamper", price: 3500, category: "Premium Hampers", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800", description: "A grand selection of chocolates, nuts, and a luxury candle.", inStock: true },
      { id: "gift-2", name: "Relaxation Spa Box", price: 2200, category: "Gift Boxes", image: "https://images.unsplash.com/photo-1544175089-6014404972ab?w=800", description: "Self-care kit with essential oils and organic soaps.", inStock: true },
      { id: "gift-3", name: "Gourmet Coffee Set", price: 1800, category: "Gift Boxes", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800", description: "Premium coffee beans with a ceramic mug.", inStock: true },
      { id: "gift-4", name: "Red Rose Bouquet", price: 599, category: "Flowers", image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800", description: "Freshly cut 12 red roses in a silk wrap.", inStock: true },
      { id: "gift-5", name: "Corporate Desk Set", price: 2500, category: "Corporate", image: "https://images.unsplash.com/photo-1586075010623-2645395f1842?w=800", description: "Leather journal, metal pen and an insulated flask.", inStock: true }
    ]
  },
  crochet: {
    store: {
      name: "OrderSpot Crochet",
      tagline: "Soft, hand-stitched joy for all ages",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#0891b2",
      accentColorDark: "#0e7490"
    },
    categories: ["All", "Toys", "Bags", "Apparel", "Home Decor"],
    products: [
      { id: "crochet-1", name: "Hand-Stitched Bunny", price: 850, category: "Toys", image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800", description: "Cuddly organic cotton bunny toy.", inStock: true },
      { id: "crochet-2", name: "Boho Cotton Tote", price: 1500, category: "Bags", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800", description: "Handmade mesh tote for daily essentials.", inStock: true },
      { id: "crochet-3", name: "Mini Stuffed Dino", price: 650, category: "Toys", image: "https://images.unsplash.com/photo-1620002093398-8f16081af5ee?w=800", description: "Small green dinosaur toy, perfect for kids.", inStock: true },
      { id: "crochet-4", name: "Crochet Plant Pot", price: 450, category: "Home Decor", image: "https://images.unsplash.com/photo-1610473068533-3d026909893d?w=800", description: "Adorable non-fade crochet succulent.", inStock: true },
      { id: "crochet-5", name: "Cozy Winter Scarf", price: 999, category: "Apparel", image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800", description: "Warm and thick hand-knitted woolen scarf.", inStock: true }
    ]
  },
  bakers: {
    store: {
      name: "OrderSpot Bakery",
      tagline: "Freshly baked goodness delivered to your doorstep",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#d2691e",
      accentColorDark: "#8b4513"
    },
    categories: ["All", "Classic Cakes", "Premium Cakes", "Cookies", "Breads"],
    products: [
      { id: "cake-1", name: "Belgian Truffle Cake", price: 1250, category: "Premium Cakes", image: "https://images.unsplash.com/photo-1578985543662-477dac423cf9?w=800", description: "Rich dark chocolate with ganache layers.", inStock: true },
      { id: "cake-2", name: "Berry Vanilla Delight", price: 950, category: "Classic Cakes", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800", description: "Light sponge cake with fresh strawberries.", inStock: true },
      { id: "cake-3", name: "Assorted Cookie Box", price: 600, category: "Cookies", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800", description: "Box of 12 freshly baked butter cookies.", inStock: true },
      { id: "cake-4", name: "Artisan Sourdough Loaf", price: 350, category: "Breads", image: "https://images.unsplash.com/photo-1585478259715-876a6a81fc08?w=800", description: "Crispy crust and airy texture bread.", inStock: true },
      { id: "cake-5", name: "Blueberry Muffins (4pc)", price: 450, category: "Cookies", image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800", description: "Soft muffins with real blueberry chunks.", inStock: true }
    ]
  },
  wholesale: {
    store: {
      name: "Wholesale Central",
      tagline: "Bulk supplies for your business",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#1e293b",
      accentColorDark: "#0f172a"
    },
    categories: ["All", "Packaging", "Raw Materials", "Office"],
    products: [
      { id: "b2b-1", name: "Paper Bags (500pc)", price: 7500, moq: 500, category: "Packaging", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", description: "Bulk eco-friendly brown bags.", inStock: true, sku: "B-500", packSize: "Box of 500" },
      { id: "b2b-2", name: "Cotton Yarn Spools (50pc)", price: 4500, moq: 50, category: "Raw Materials", image: "https://images.unsplash.com/photo-1606212134546-609809968453?w=800", description: "Premium cotton thread for looms.", inStock: true, sku: "Y-050", packSize: "Case of 50" },
      { id: "b2b-3", name: "Shipping Tape (24pc)", price: 1200, moq: 24, category: "Packaging", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800", description: "Industrial strength clear tape.", inStock: true, sku: "T-024", packSize: "Roll of 24" },
      { id: "b2b-4", name: "A4 Paper Reams (10pc)", price: 2500, moq: 10, category: "Office", image: "https://images.unsplash.com/photo-1532153352641-07304566276b?w=800", description: "High quality white paper bundle.", inStock: true, sku: "A-010", packSize: "Box of 10 reams" }
    ]
  },
  food: {
    store: {
      name: "Gourmet Food Cart",
      tagline: "Fine dining delivered to you",
      whatsappNumber: "8073511215",
      currencySymbol: "₹",
      accentColor: "#ea580c",
      accentColorDark: "#9a3412"
    },
    categories: ["All", "Main Course", "Fast Food", "Beverages", "Desserts"],
    products: [
      { id: "food-1", name: "Chicken Dum Biryani", price: 350, category: "Main Course", image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800", description: "Traditional aromatic basmati rice thali.", inStock: true },
      { id: "food-2", name: "Classic Cheeseburger", price: 180, category: "Fast Food", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", description: "Beef patty with melted cheddar and fresh greens.", inStock: true },
      { id: "food-3", name: "Cold Brew Coffee", price: 150, category: "Beverages", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800", description: "Slow-steeped overnight smooth coffee.", inStock: true },
      { id: "food-4", name: "Chocolate Lava Cake", price: 220, category: "Desserts", image: "https://images.unsplash.com/photo-1511911063327-024f2b180c41?w=800", description: "Warm cake with a molten chocolate center.", inStock: true },
      { id: "food-5", name: "Garden Fresh Salad", price: 120, category: "Main Course", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", description: "Mix of seasonal greens with lemon vinaigrette.", inStock: true }
    ]
  }
};
