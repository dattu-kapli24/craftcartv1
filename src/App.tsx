import React, { useState, useEffect } from 'react';
import { 
  Cake, 
  Sparkles, 
  ShoppingBag, 
  Search, 
  Phone, 
  Check, 
  Heart, 
  Star, 
  MessageSquare, 
  SlidersHorizontal,
  Plus,
  ArrowRight,
  ExternalLink,
  Store,
  Layers,
  ShieldCheck,
  Clock,
  ChevronRight,
  Zap,
  Truck,
  Award,
  Ruler,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  PackageCheck
} from 'lucide-react';
import { CustomCakeOrderModal, CakeProduct, CustomCakeOrderData } from './components/CustomCakeOrderModal';
import { PlywoodSpecModal, PlywoodProduct } from './components/PlywoodSpecModal';
import { STORE_BLUEPRINTS } from '../blueprints.js';

export function App() {
  // Read URL query parameter for store key fallback
  const [activeStoreKey, setActiveStoreKey] = useState<'plywoodwholesale' | 'richwhisk' | 'bakerswholesale' | 'resinart'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const storeParam = params.get('store');
      if (storeParam === 'plywood' || storeParam === 'plywoodwholesale') return 'plywoodwholesale';
      if (storeParam === 'bakerswholesale') return 'bakerswholesale';
      if (storeParam === 'resinart') return 'resinart';
      if (storeParam === 'richwhisk') return 'richwhisk';
    }
    return 'plywoodwholesale';
  });

  // Modal States
  const [selectedCakeProduct, setSelectedCakeProduct] = useState<CakeProduct | null>(null);
  const [isCakeModalOpen, setIsCakeModalOpen] = useState<boolean>(false);

  const [selectedPlywoodProduct, setSelectedPlywoodProduct] = useState<PlywoodProduct | null>(null);
  const [isPlywoodModalOpen, setIsPlywoodModalOpen] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Cart Items State
  const [cartItems, setCartItems] = useState<Array<any>>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync active store on URL or key change
  const currentBlueprint = (STORE_BLUEPRINTS as any)[activeStoreKey] || STORE_BLUEPRINTS.plywoodwholesale;
  const { store, categories, products } = currentBlueprint;
  const isPlywoodStore = activeStoreKey === 'plywoodwholesale';
  const isBakeryCustomStore = activeStoreKey === 'richwhisk';

  // Filter products
  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.grade && p.grade.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.thickness && p.thickness.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenCakeCustomization = (product: any) => {
    setSelectedCakeProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      description: product.description || 'Handcrafted bespoke artisanal creation.',
      inStock: product.inStock,
      isCustomizable: true,
      flavors: product.flavors || [
        'Belgium Chocolate Truffle',
        'Vanilla Berry',
        'Biscoff Caramel',
        'Hazelnut Praline',
        'Custom Flavor Request'
      ]
    });
    setIsCakeModalOpen(true);
  };

  const handleOpenPlywoodSpec = (product: any) => {
    setSelectedPlywoodProduct(product);
    setIsPlywoodModalOpen(true);
  };

  const handleAddToCart = (item: any) => {
    setCartItems(prev => [...prev, item]);
    setIsCakeModalOpen(false);
    setIsPlywoodModalOpen(false);
    setIsCartOpen(true);
  };

  // Switch store handler with category reset
  const handleSwitchStore = (key: 'plywoodwholesale' | 'richwhisk' | 'bakerswholesale' | 'resinart') => {
    setActiveStoreKey(key);
    setActiveCategory('All');
    setSearchQuery('');
    // Update browser URL query without reload
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `?store=${key}`);
    }
  };

  // Calculate totals
  const totalCartSheets = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCartSqFt = cartItems.reduce((sum, item) => sum + (item.totalSqFt || (item.quantity ? item.quantity * 32 : 0)), 0);
  const totalCartPrice = cartItems.reduce((sum, item) => {
    if (item.calculatedPrice && item.quantity) return sum + (item.calculatedPrice * item.quantity);
    if (item.unitPrice && item.unitPrice !== 'quote') return sum + Number(item.unitPrice);
    if (item.price && item.quantity) return sum + (item.price * item.quantity);
    if (item.price) return sum + Number(item.price);
    return sum;
  }, 0);

  // Generate Wholesale WhatsApp Checkout Link
  const getWhatsAppCartUrl = () => {
    let orderText = `*B2B Wholesale Order Inquiry — ${store.name}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    cartItems.forEach((item, idx) => {
      if (item.product) {
        orderText += `${idx + 1}. *${item.product.name}*\n`;
        orderText += `   • Qty: ${item.quantity} ${item.product.unit || 'Sheets'} (${item.totalSqFt || item.quantity * 32} sq.ft)\n`;
        orderText += `   • Thickness: ${item.product.thickness || 'Standard'} | Size: ${item.product.size || '8x4 ft'}\n`;
        orderText += `   • Rate: ₹${item.calculatedPrice} / sheet = ₹${(item.calculatedPrice * item.quantity).toLocaleString('en-IN')}\n`;
        if (item.notes) orderText += `   • Notes: ${item.notes}\n`;
      } else {
        orderText += `${idx + 1}. *${item.productName || item.name}* (Qty: ${item.quantity || 1}) — ₹${item.unitPrice || item.price}\n`;
      }
    });

    orderText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (isPlywoodStore) {
      orderText += `📦 *Total Sheets:* ${totalCartSheets} Sheets\n`;
      orderText += `📐 *Total Area:* ${totalCartSqFt.toLocaleString('en-IN')} sq.ft\n`;
    }
    orderText += `💰 *Total Estimated Value:* ₹${totalCartPrice.toLocaleString('en-IN')}\n`;
    orderText += `\n📍 *Requirements:* Please confirm transport dispatch schedule, GST tax invoice, and mill availability.`;

    return `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(orderText)}`;
  };

  return (
    <div className={`min-h-screen ${isPlywoodStore ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-rose-50/40 via-white to-pink-50/30 text-slate-800'} font-sans antialiased`}>
      
      {/* Top Demo Bar / Store Switcher */}
      <header className="bg-slate-900 text-white text-xs px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-300">Storefront:</span>
          
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 flex-wrap">
            <button
              onClick={() => handleSwitchStore('plywoodwholesale')}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 text-xs ${
                activeStoreKey === 'plywoodwholesale'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🪵 Shreeji Ply & Laminates (B2B)</span>
            </button>
            <button
              onClick={() => handleSwitchStore('bakerswholesale')}
              className={`px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs ${
                activeStoreKey === 'bakerswholesale'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              📦 Bakers Wholesale
            </button>
            <button
              onClick={() => handleSwitchStore('richwhisk')}
              className={`px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs ${
                activeStoreKey === 'richwhisk'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              🎂 Rich Whisk (B2C)
            </button>
            <button
              onClick={() => handleSwitchStore('resinart')}
              className={`px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs ${
                activeStoreKey === 'resinart'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              🌸 Resin Art
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Link to OrderSpot Collect */}
          <a
            href="/collect"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>OrderSpot Collect (Payment Recovery)</span>
          </a>

          <a
            href="/admin.html"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Admin</span>
          </a>
        </div>
      </header>

      {/* Main Navbar */}
      <nav className={`border-b shadow-sm ${
        isPlywoodStore 
          ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-md' 
          : 'bg-white/95 border-rose-100 text-slate-900 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-2xl font-black shadow-md ${
              isPlywoodStore
                ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-900/30 ring-2 ring-amber-500/30'
                : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-200 ring-2 ring-rose-200'
            }`}>
              {store.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight font-serif">
                  {store.name}
                </h1>
                {store.storeType === 'B2B' && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    B2B Wholesale
                  </span>
                )}
              </div>
              <p className={`text-xs ${isPlywoodStore ? 'text-slate-400' : 'text-slate-500'} font-medium line-clamp-1`}>
                {store.tagline || 'Direct ordering from local vendors via WhatsApp'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Quick WhatsApp Inquiry */}
            <a
              href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(`Hello ${store.name}! We require wholesale mill rates and catalog availability for bulk order.`)}`}
              target="_blank"
              rel="noreferrer"
              className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                isPlywoodStore
                  ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/40'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Mill Desk: +{store.whatsappNumber}</span>
            </a>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`relative p-3 rounded-2xl border transition-all shadow-sm cursor-pointer ${
                isPlywoodStore
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-800'
              }`}
              aria-label="View Cart"
            >
              <ShoppingBag className={`w-5 h-5 ${isPlywoodStore ? 'text-amber-400' : 'text-slate-700'}`} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Banner for Plywood Wholesale Store */}
      {isPlywoodStore && (
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-2xl">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Award className="w-4 h-4 text-amber-400" />
                <span>IS:710 Marine Certified • 4-Times Calibrated Core • 25-Year Warranty</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight text-white">
                Architectural Timber, Plywood & High-Gloss Laminates at Direct Mill Rates.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                Direct wholesale manufacturer supply of calibrated Gurjan marine ply, 1mm decorative laminates, acrylic panels, solid pine blockboards, and flush doors for contractors, architects, and modular interior makers.
              </p>
              
              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <strong className="block text-white font-bold">100% Termite Proof</strong>
                    <span className="text-[11px] text-slate-400">Vacuum impregnated</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                  <Ruler className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <strong className="block text-white font-bold">Zero Thickness Warp</strong>
                    <span className="text-[11px] text-slate-400">+/- 0.2mm calibrated</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <Truck className="w-5 h-5 text-teal-400 shrink-0" />
                  <div className="text-left">
                    <strong className="block text-white font-bold">Truckload Freight</strong>
                    <span className="text-[11px] text-slate-400">Pan-India E-Way Bill</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Product Preview */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-900 group">
                  <img
                    src="/products/plywood-marine-18mm.jpg"
                    alt="Gurjan Marine Plywood"
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-900 text-slate-200 text-xs">
                    <strong className="block text-amber-400">18mm Gurjan Marine Plywood</strong>
                    <span className="text-[11px] text-slate-400">IS:710 BWP • ₹2,450/sheet</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-900 group">
                  <img
                    src="/products/acrylic-mirror-panel.jpg"
                    alt="Acrylic Panel"
                    className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-900 text-slate-200 text-xs">
                    <strong className="block text-amber-400">Mirror Acrylic Panel 1.5mm</strong>
                    <span className="text-[11px] text-slate-400">Scratch 6H • ₹3,150/sheet</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-900 group">
                  <img
                    src="/products/laminate-walnut-gloss.jpg"
                    alt="Italian Walnut Laminate"
                    className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-900 text-slate-200 text-xs">
                    <strong className="block text-amber-400">1mm Italian Walnut Mica</strong>
                    <span className="text-[11px] text-slate-400">High-Gloss • ₹1,680/sheet</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-900 group">
                  <img
                    src="/products/blockboard-pine-19mm.jpg"
                    alt="Pine Blockboard"
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-900 text-slate-200 text-xs">
                    <strong className="block text-amber-400">Solid Pine Blockboard 19mm</strong>
                    <span className="text-[11px] text-slate-400">Warp Free • ₹2,100/sheet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat: string) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isPlywoodStore 
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                        : 'bg-rose-600 text-white shadow-md shadow-rose-200'
                      : isPlywoodStore
                        ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/40 hover:text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isPlywoodStore ? "Search plywood, laminates, thickness..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none shadow-sm ${
                isPlywoodStore
                  ? 'border-slate-800 bg-slate-900 text-white focus:border-amber-500 placeholder-slate-500'
                  : 'border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-rose-400'
              }`}
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod: any) => {
            return (
              <article
                key={prod.id}
                className={`group rounded-3xl overflow-hidden border shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between ${
                  isPlywoodStore
                    ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                    : 'bg-white border-rose-100 hover:border-rose-300'
                }`}
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/products/plywood-marine-18mm.jpg';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-xs border border-white/10">
                        {prod.category}
                      </span>
                      {prod.moq && (
                        <span className="bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                          MOQ: {prod.moq} {prod.unit || 'Sheets'}
                        </span>
                      )}
                    </div>

                    {prod.thickness && (
                      <div className="absolute bottom-3 right-3 bg-black/80 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs border border-amber-500/30">
                        {prod.thickness} • {prod.size || '8x4 ft'}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className={`font-serif font-bold text-base sm:text-lg leading-snug group-hover:text-amber-400 transition-colors ${
                      isPlywoodStore ? 'text-white' : 'text-slate-900'
                    }`}>
                      {prod.name}
                    </h3>
                    
                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isPlywoodStore ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {prod.description || 'Wholesale grade product directly from verified manufacturer.'}
                    </p>

                    {/* Spec Summary Badges */}
                    {isPlywoodStore && (
                      <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                        {prod.grade && (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {prod.grade}
                          </span>
                        )}
                        {prod.finish && (
                          <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {prod.finish}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tiered Bulk Price Preview */}
                    {prod.bulkPricing && prod.bulkPricing.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Volume Discount:</div>
                        <div className="flex items-center justify-between">
                          <span>{prod.bulkPricing[0].minQty}+ {prod.unit || 'sheets'}:</span>
                          <strong className="text-emerald-400 font-mono">₹{prod.bulkPricing[0].price} / {prod.unit || 'sheet'}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Action */}
                <div className={`p-5 pt-3 border-t flex items-center justify-between gap-3 ${
                  isPlywoodStore ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Wholesale Rate</span>
                    <span className={`text-lg sm:text-xl font-black font-mono ${
                      isPlywoodStore ? 'text-amber-400' : 'text-slate-900'
                    }`}>
                      {store.currencySymbol || '₹'}{Number(prod.price).toLocaleString('en-IN')}
                      <span className="text-[11px] font-normal text-slate-400">/{prod.unit || 'sheet'}</span>
                    </span>
                  </div>

                  {isPlywoodStore ? (
                    <button
                      onClick={() => handleOpenPlywoodSpec(prod)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Specs & Order</span>
                    </button>
                  ) : isBakeryCustomStore ? (
                    <button
                      onClick={() => handleOpenCakeCustomization(prod)}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Customize</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart({ product: prod, quantity: prod.moq || 1, calculatedPrice: prod.price })}
                      className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* B2B Wholesale Guarantee Section */}
        {isPlywoodStore && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-slate-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">4-Times Calibrated Precision</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Imported sanding machines ensure seamless laminate pressing with zero air-pocket bubbles or core gaps.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">BWP 72-Hour Boiling Proof</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Fortified with unextended phenol formaldehyde synthetic resin passing rigid boiling water tests.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Direct Mill Truckload Freight</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Dedicated fleet logistics from timber mills straight to your warehouse or project construction site.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Plywood Spec & Order Modal */}
      <PlywoodSpecModal
        product={selectedPlywoodProduct}
        isOpen={isPlywoodModalOpen}
        onClose={() => setIsPlywoodModalOpen(false)}
        whatsappNumber={store.whatsappNumber || '918073511215'}
        currencySymbol={store.currencySymbol || '₹'}
        onAddToCart={handleAddToCart}
      />

      {/* Bakery Custom Modal (for Rich Whisk) */}
      <CustomCakeOrderModal
        product={selectedCakeProduct}
        isOpen={isCakeModalOpen}
        onClose={() => setIsCakeModalOpen(false)}
        whatsappNumber={store.whatsappNumber || '918073511215'}
        storeName={store.name || 'Rich Whisk'}
        currencySymbol={store.currencySymbol || '₹'}
        onAddToCart={handleAddToCart}
      />

      {/* Cart & B2B Wholesale RFQ Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 text-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-800">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {isPlywoodStore ? 'B2B Wholesale Order Cart' : 'Your Shopping Cart'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
                    <PackageCheck className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">No products added yet</p>
                  <p className="text-xs text-slate-400">Select sheets from the catalog to prepare your wholesale order</p>
                </div>
              ) : (
                cartItems.map((item: any, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-white">
                        {item.product?.name || item.productName || item.name}
                      </h4>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        ₹{((item.calculatedPrice || item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {item.product && (
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <p>• <strong>Volume:</strong> {item.quantity} Sheets ({item.totalSqFt || item.quantity * 32} sq.ft)</p>
                        <p>• <strong>Rate:</strong> ₹{item.calculatedPrice} / sheet</p>
                        {item.notes && <p className="text-amber-300">📝 {item.notes}</p>}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                      <button
                        onClick={() => setCartItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-3">
                <div className="space-y-1 text-xs text-slate-400">
                  {isPlywoodStore && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Quantity:</span>
                        <strong className="text-white font-mono">{totalCartSheets} Sheets</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Area:</span>
                        <strong className="text-white font-mono">{totalCartSqFt.toLocaleString('en-IN')} sq.ft</strong>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-800 font-bold">
                    <span className="text-white">Estimated Order Total:</span>
                    <span className="text-amber-400 font-mono text-base">₹{totalCartPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <a
                  href={getWhatsAppCartUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send B2B Order on WhatsApp (₹{totalCartPrice.toLocaleString('en-IN')})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
