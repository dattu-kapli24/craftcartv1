export const STORE_BLUEPRINTS = {
  demo: {
    store: {
      name: "CraftCreative Cart",
      tagline: "Direct ordering from local vendors via WhatsApp.",
      whatsappNumber: "918073511215",
      currencySymbol: "₹",
      accentColor: "#c96c8a",
      accentColorDark: "#8f4160",
      storeType: "B2C"
    },
    categories: ["All", "Resin Art", "Crochet", "Bakers", "Gifting"],
    products: [
      { id: "resin-frame-8", name: "8 Inch Resin Frame", price: 2600, category: "Resin Art", image: "/products/resin-frame-8.jpeg", inStock: true },
      { id: "rose-pendant-combo", name: "Rose Black & Pendant Combo", price: 1450, category: "Resin Art", image: "/products/rose-pendant-combo.jpeg", inStock: true },
      { id: "crochet-flower-bouquet", name: "Crochet Flower Bouquet", price: 1200, category: "Crochet", image: "/products/crochet-flower-bouquet.jpg", inStock: true },
      { id: "bakers-chocolate-cake", name: "Homemade Chocolate Cake", price: 950, category: "Bakers", image: "/products/bakers-chocolate-cake.jpg", inStock: true }
    ]
  },
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
  richwhisk: {
    store: {
      name: "Rich Whisk",
      tagline: "Bespoke & 100% Customized Artisanal Cakes",
      whatsappNumber: "918073511215",
      currencySymbol: "₹",
      accentColor: "#db2777",
      accentColorDark: "#9d174d",
      storeType: "B2C",
      isBakeryCustom: true
    },
    categories: ["All", "Custom Cakes", "Theme Cakes", "Celebration Tiers", "Dessert Hampers"],
    products: [
      {
        id: "rw_01",
        name: "Lavender Butterfly Tier Celebration Cake",
        price: 1850,
        category: "Celebration Tiers",
        image: "/products/rich-whisk-butterfly-tier.jpg",
        description: "Artisan two-tier pastel lavender & white celebration cake decorated with 3D butterflies, fresh florist roses, and custom 3D acrylic text.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "1 kg",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Biscoff Caramel", "Hazelnut Praline", "Custom Flavor Request"]
      },
      {
        id: "rw_02",
        name: "Pastel Pink Balloon Sphere & Girl Cake",
        price: 1450,
        category: "Theme Cakes",
        image: "/products/rich-whisk-balloon-girl.jpg",
        description: "Chic luxury pastel pink frosted cake adorned with metallic gold and pink sphere balloon toppers and artistic silhouette.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "1 kg",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Biscoff Caramel", "Hazelnut Praline", "Custom Flavor Request"]
      },
      {
        id: "rw_03",
        name: "Handcrafted 3D Cute Tooth Birthday Cake",
        price: 1350,
        category: "Custom Cakes",
        image: "/products/rich-whisk-cute-tooth.jpg",
        description: "Delightful custom sculpted smiling tooth character with toothbrush, gold crown, satin fondant ribbon, and personalized name plaque.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "1 kg",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Biscoff Caramel", "Hazelnut Praline", "Custom Flavor Request"]
      },
      {
        id: "rw_04",
        name: "Pastel Rainbow & Giraffe Celebration Cake",
        price: 1550,
        category: "Theme Cakes",
        image: "/products/rich-whisk-giraffe-rainbow.jpg",
        description: "Whimsical pastel rainbow arch cake with adorable illustrated giraffe topper, golden age crown, and sprinkle pearls.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "1 kg",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Biscoff Caramel", "Hazelnut Praline", "Custom Flavor Request"]
      },
      {
        id: "rw_05",
        name: "Velvet Bloom Dessert & Fresh Flowers Hamper",
        price: 1200,
        category: "Dessert Hampers",
        image: "/products/rich-whisk-velvet-hamper.jpg",
        description: "Luxury gift hamper with two gourmet layered dessert jars tied with satin ribbon and freshly plucked floral arrangement.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "Hamper Set",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Red Velvet Cream Cheese", "Biscoff Caramel"]
      },
      {
        id: "rw_06",
        name: "100% Bespoke Custom Cake (From Reference)",
        price: 1600,
        category: "Custom Cakes",
        image: "/products/rich-whisk-butterfly-tier.jpg",
        description: "Upload your dream design or reference image, pick tiers, custom sizes, bespoke dietary requirements, and tailor-made themes.",
        inStock: true,
        isCustomizable: true,
        baseWeight: "1 kg",
        flavors: ["Belgium Chocolate Truffle", "Vanilla Berry", "Biscoff Caramel", "Hazelnut Praline", "Custom Flavor Request"]
      }
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
  },
  plywoodwholesale: {
    store: {
      name: "Shreeji Ply & Laminates Wholesale",
      tagline: "Direct Mill & Manufacturer B2B Supply • Calibrated Marine Plywood, Decorative Laminates & Acrylic Panels",
      whatsappNumber: "918073511215",
      currencySymbol: "₹",
      accentColor: "#b45309",
      accentColorDark: "#78350f",
      storeType: "B2B",
      isPlywoodWholesale: true,
      minOrderValue: 15000,
      deliveryNote: "Direct factory dispatch across India • GST Invoice & E-Way Bill provided"
    },
    categories: [
      "All",
      "Calibrated Marine Plywood",
      "Decorative Laminates (1mm & 0.8mm)",
      "Acrylic & High-Gloss Panels",
      "Blockboards & Flush Doors",
      "Natural Wood Veneers",
      "Shuttering & Construction Ply"
    ],
    products: [
      {
        id: "ply_001",
        name: "Gurjan Core Calibrated Marine Plywood 18mm",
        price: 2450,
        category: "Calibrated Marine Plywood",
        image: "/products/plywood-marine-18mm.jpg",
        inStock: true,
        moq: 15,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "18 mm",
        grade: "IS:710 Marine BWP (Boiling Water Proof)",
        core: "100% Selected Gurjan & Hardwood Core",
        description: "Four-times pressed calibrated marine grade plywood with zero core gaps, calibrated thickness (+/- 0.2mm), 100% borer & termite proof with 25-year warranty.",
        bulkPricing: [
          { minQty: 30, price: 2320 },
          { minQty: 60, price: 2190 }
        ]
      },
      {
        id: "ply_002",
        name: "Premium 1mm High-Gloss Decorative Laminate - Italian Walnut",
        price: 1680,
        category: "Decorative Laminates (1mm & 0.8mm)",
        image: "/products/laminate-walnut-gloss.jpg",
        inStock: true,
        moq: 10,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "1.0 mm",
        grade: "IS:2046 Heavy Duty Decorative Surface",
        finish: "Mirror High Gloss / Scratch Resistant",
        description: "Imported German decorative paper layered with abrasive overlay. UV-resistant, zero-bubble adhesion, suitable for luxury wardrobes, wall paneling, and modular kitchens.",
        bulkPricing: [
          { minQty: 25, price: 1580 },
          { minQty: 50, price: 1490 }
        ]
      },
      {
        id: "ply_003",
        name: "Commercial MR Grade Plywood 12mm - Calibrated Hardwood",
        price: 1350,
        category: "Calibrated Marine Plywood",
        image: "/products/plywood-calibrated-12mm.jpg",
        inStock: true,
        moq: 20,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "12 mm",
        grade: "IS:303 Moisture Resistant (MR Grade)",
        core: "High-Density Eucalyptus & Poplar Alternate Core",
        description: "Uniform thickness calibrated commercial board with melamine fortified resin bonding. Ideal for bedroom wardrobes, living room carcasses, and false ceiling framing.",
        bulkPricing: [
          { minQty: 40, price: 1280 },
          { minQty: 80, price: 1210 }
        ]
      },
      {
        id: "ply_004",
        name: "Zero-Emission Mirror Acrylic Panel 1.5mm - Charcoal & Metallic",
        price: 3150,
        category: "Acrylic & High-Gloss Panels",
        image: "/products/acrylic-mirror-panel.jpg",
        inStock: true,
        moq: 5,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "1.5 mm",
        grade: "Export Grade Pure Polymethyl Methacrylate (PMMA)",
        finish: "Ultra Mirror 6H Scratch Resistant",
        description: "Non-yellowing crystal clear PMMA sheet with seamless reflection. Anti-bacterial surface with thermal scratch-buffing capability for luxury designer kitchen shutters.",
        bulkPricing: [
          { minQty: 12, price: 2980 },
          { minQty: 25, price: 2850 }
        ]
      },
      {
        id: "ply_005",
        name: "Solid Pine Timber Blockboard 19mm - BWP Grade",
        price: 2100,
        category: "Blockboards & Flush Doors",
        image: "/products/blockboard-pine-19mm.jpg",
        inStock: true,
        moq: 10,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "19 mm",
        grade: "IS:1659 Commercial & BWP Grade",
        core: "Kiln-Seasoned Imported New Zealand Pine Batons",
        description: "Engineered solid pine batons with hardwood cross bands. Exceptional screw-holding capacity, completely warp-free and resistant to sagging over long spans (up to 8ft).",
        bulkPricing: [
          { minQty: 25, price: 1990 },
          { minQty: 50, price: 1890 }
        ]
      },
      {
        id: "ply_006",
        name: "0.8mm Suede Finish Laminate - Scandinavian Natural Oak",
        price: 1050,
        category: "Decorative Laminates (1mm & 0.8mm)",
        image: "/products/laminate-oak-suede.jpg",
        inStock: true,
        moq: 15,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "0.8 mm",
        grade: "Compact Flexible Liner / Decorative Grade",
        finish: "Matte Suede / Tactile Woodgrain Embossed",
        description: "High-flexibility lining and surfacing laminate with natural organic wood pore embossing. High stain resistance against boiling water, coffee, and household solvents.",
        bulkPricing: [
          { minQty: 30, price: 980 },
          { minQty: 60, price: 920 }
        ]
      },
      {
        id: "ply_007",
        name: "100% Waterproof Heavy Duty BWP Marine Ply 6mm",
        price: 820,
        category: "Calibrated Marine Plywood",
        image: "/products/plywood-bwp-6mm.jpg",
        inStock: true,
        moq: 25,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "6 mm",
        grade: "IS:710 Marine 7-Ply Construction",
        core: "Hardwood Core with Unextended Phenol Formaldehyde Resin",
        description: "Seven-layer cross laminated marine ply for wardrobe backings, curved partitions, bathroom ceiling paneling, and naval woodwork. Withstands 72-hour boiling water test.",
        bulkPricing: [
          { minQty: 50, price: 770 },
          { minQty: 100, price: 720 }
        ]
      },
      {
        id: "ply_008",
        name: "Natural Burma Teak Exotic Wood Veneer Sheet 4mm",
        price: 2850,
        category: "Natural Wood Veneers",
        image: "/products/natural-teak-veneer.jpg",
        inStock: true,
        moq: 5,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "4.0 mm",
        grade: "Architectural AAA Crown Quarter Cut",
        finish: "Raw Untreated Natural Wood Veneer (Fleece Backed)",
        description: "Genuine sliced natural old-growth golden Burma teak veneer pressed on calibrated marine base. Uniform grain matching for prestige executive offices and luxury villas.",
        bulkPricing: [
          { minQty: 10, price: 2720 },
          { minQty: 20, price: 2590 }
        ]
      },
      {
        id: "ply_009",
        name: "High-Density Solid Core Flush Door (32mm, 7x3 ft)",
        price: 3400,
        category: "Blockboards & Flush Doors",
        image: "/products/flush-door-hardwood.jpg",
        inStock: true,
        moq: 5,
        unit: "Door",
        size: "7x3 ft (84x36 inches)",
        thickness: "32 mm",
        grade: "IS:2202 Part-1 Solid Hardwood Core",
        finish: "Sanded Ready for Polish or Laminate Cladding",
        description: "Solid hardwood core flush door treated with vacuum pressure impregnation against wood borers. Precision cut mortise lock provision and sound deadening core.",
        bulkPricing: [
          { minQty: 15, price: 3200 },
          { minQty: 30, price: 3050 }
        ]
      },
      {
        id: "ply_010",
        name: "Shuttering Film-Faced Concrete Plywood 30kg (12mm)",
        price: 1290,
        category: "Shuttering & Construction Ply",
        image: "/products/film-faced-shuttering.jpg",
        inStock: true,
        moq: 30,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "12 mm (30 kg High Density)",
        grade: "IS:4990 Heavy Construction Shuttering",
        finish: "120 GSM Phenolic Mirror Film Coating with Acrylic Edge Seal",
        description: "Engineered for maximum concrete casting repetitions (up to 25+ cycles). High load-bearing capacity with waterproof edge sealant to prevent slurry penetration.",
        bulkPricing: [
          { minQty: 60, price: 1220 },
          { minQty: 120, price: 1160 }
        ]
      },
      {
        id: "ply_011",
        name: "Feather-Touch Anti-Fingerprint Matte Laminate 1.2mm",
        price: 2250,
        category: "Decorative Laminates (1mm & 0.8mm)",
        image: "/products/laminate-feather-matte.jpg",
        inStock: true,
        moq: 8,
        unit: "Sheet",
        size: "8x4 ft (32 sq.ft)",
        thickness: "1.2 mm",
        grade: "Super-Matte Nanotechnology Anti-Smudge",
        finish: "Zero-Gloss Silky Smooth Touch",
        description: "Nano-coat technology resists greasy finger smudges, scratches, and micro-abrasions. Thermal healing capability for minor surface scuffs.",
        bulkPricing: [
          { minQty: 20, price: 2120 },
          { minQty: 40, price: 1990 }
        ]
      },
      {
        id: "ply_012",
        name: "Matching 2mm PVC Edge Banding Tape (50m Roll)",
        price: 450,
        category: "Decorative Laminates (1mm & 0.8mm)",
        image: "/products/pvc-edge-band-tape.jpg",
        inStock: true,
        moq: 5,
        unit: "Roll (50 meters)",
        size: "22mm width x 2mm thickness x 50m length",
        thickness: "2.0 mm",
        grade: "High Impact Virgin PVC Polymer",
        finish: "Color & Grain Matched to Premium Laminates",
        description: "Precision extruded PVC edge band with primer coating on back for flawless hot-melt glue adhesion on automatic edge banding machines.",
        bulkPricing: [
          { minQty: 15, price: 410 },
          { minQty: 30, price: 380 }
        ]
      }
    ]
  }
};
