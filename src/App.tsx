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
  ChevronRight
} from 'lucide-react';
import { CustomCakeOrderModal, CakeProduct, CustomCakeOrderData } from './components/CustomCakeOrderModal';
import { STORE_BLUEPRINTS } from '../blueprints.js';

export function App() {
  const [activeStoreKey, setActiveStoreKey] = useState<'richwhisk' | 'resinart' | 'bakers' | 'bakerswholesale'>('richwhisk');
  const [selectedProduct, setSelectedProduct] = useState<CakeProduct | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<Array<CustomCakeOrderData | { id: string; name: string; price: number; qty: number; image: string }>>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Current store data
  const currentBlueprint = STORE_BLUEPRINTS[activeStoreKey] || STORE_BLUEPRINTS.richwhisk;
  const { store, categories, products } = currentBlueprint;

  // Filter products
  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenCustomization = (product: any) => {
    setSelectedProduct({
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
    setIsCustomModalOpen(true);
  };

  const handleAddToCart = (orderData: CustomCakeOrderData) => {
    setCartItems(prev => [...prev, orderData]);
    setIsCustomModalOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-pink-50/30 text-slate-800 font-sans antialiased">
      {/* Top Demo Bar / Store Switcher */}
      <header className="bg-slate-900 text-white text-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-200">Storefront Preview:</span>
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => { setActiveStoreKey('richwhisk'); setActiveCategory('All'); }}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                activeStoreKey === 'richwhisk'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎂 Rich Whisk (Custom Bakery)
            </button>
            <button
              onClick={() => { setActiveStoreKey('bakerswholesale'); setActiveCategory('All'); }}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                activeStoreKey === 'bakerswholesale'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📦 Bakers Wholesale (B2B)
            </button>
            <button
              onClick={() => { setActiveStoreKey('resinart'); setActiveCategory('All'); }}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                activeStoreKey === 'resinart'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌸 Resin Art (B2C)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </a>
        </div>
      </header>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-serif text-2xl font-black shadow-md shadow-rose-200 ring-2 ring-rose-200">
              {store.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif">
                  {store.name}
                </h1>
                {activeStoreKey === 'richwhisk' && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    100% Bespoke
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {store.tagline || 'Direct ordering from artisanal creators via WhatsApp'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Custom Cake Action */}
            {activeStoreKey === 'richwhisk' && (
              <button
                id="headerCustomCakeBtn"
                onClick={() => handleOpenCustomization(products[0])}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>+ Custom Cake Request</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-800 transition-colors shadow-sm"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Banner for Rich Whisk */}
      {activeStoreKey === 'richwhisk' && (
        <section className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Handcrafted Fresh to Order • Zero Artificial Preservatives</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight">
                Every Celebration Deserves a Masterpiece.
              </h2>
              <p className="text-sm sm:text-base text-rose-100 max-w-xl font-normal">
                At Rich Whisk, we specialize in 100% custom designer cakes, theme celebration tiers, and gourmet dessert hampers tailored to your unique flavor profile and aesthetic.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => handleOpenCustomization(products[products.length - 1] || products[0])}
                  className="px-6 py-3 rounded-full bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-lg shadow-rose-900/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Cake className="w-4 h-4" />
                  <span>Design Your Custom Cake</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent('Hello Rich Whisk! I would like to inquire about a custom cake order.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-full bg-rose-700/80 hover:bg-rose-800 text-white font-semibold text-sm flex items-center gap-2 border border-rose-300/40 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Direct WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Visual Showcase Reel */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 transform -rotate-1 hover:rotate-0 transition-transform bg-white">
                  <img
                    src="/products/rich-whisk-butterfly-tier.jpg"
                    alt="Butterfly Tier Cake"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <div className="p-2 bg-white text-slate-800 text-[11px] font-bold text-center">
                    Lavender Butterfly Tier
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 transform rotate-2 hover:rotate-0 transition-transform bg-white">
                  <img
                    src="/products/rich-whisk-cute-tooth.jpg"
                    alt="Custom Fondant Cake"
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="p-2 bg-white text-slate-800 text-[11px] font-bold text-center">
                    Sculpted 3D Theme Cake
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 transform rotate-1 hover:rotate-0 transition-transform bg-white">
                  <img
                    src="/products/rich-whisk-balloon-girl.jpg"
                    alt="Pink Balloon Sphere Cake"
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="p-2 bg-white text-slate-800 text-[11px] font-bold text-center">
                    Balloon Sphere Design
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 transform -rotate-2 hover:rotate-0 transition-transform bg-white">
                  <img
                    src="/products/rich-whisk-velvet-hamper.jpg"
                    alt="Velvet Bloom Hamper"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <div className="p-2 bg-white text-slate-800 text-[11px] font-bold text-center">
                    Velvet Bloom Hamper
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
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
              placeholder="Search designs or flavors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod: any) => {
            return (
              <article
                key={prod.id}
                className="group bg-white rounded-3xl overflow-hidden border border-rose-100 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-square overflow-hidden bg-rose-50">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Rich+Whisk+Cake';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {prod.category}
                      </span>
                      {prod.baseWeight && (
                        <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                          Base: {prod.baseWeight}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-rose-600 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {prod.description || 'Custom handcrafted gourmet creation baked on order.'}
                    </p>

                    {/* Flavors Preview */}
                    {prod.flavors && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {prod.flavors.slice(0, 3).map((f: string) => (
                          <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {f}
                          </span>
                        ))}
                        {prod.flavors.length > 3 && (
                          <span className="text-[10px] text-rose-600 font-bold self-center">
                            +{prod.flavors.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Action */}
                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Starting from</span>
                    <span className="text-xl font-black text-slate-900">
                      {store.currencySymbol || '₹'}{Number(prod.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCustomization(prod)}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-200 hover:shadow-rose-300 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Customize & Order</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Home Baker Custom Perks */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-3xl bg-gradient-to-r from-rose-50/70 via-pink-50/50 to-amber-50/60 border border-rose-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-rose-500 flex items-center justify-center shadow-sm border border-rose-100 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">100% Bespoke Customization</h4>
              <p className="text-xs text-slate-500 mt-1">
                Upload your Pinterest, Instagram, or hand-drawn reference designs directly with flavor notes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Egg & Eggless Specialties</h4>
              <p className="text-xs text-slate-500 mt-1">
                Dedicated eggless baking station ensuring 100% vegetarian hygiene without compromising texture.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-sm border border-amber-100 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Direct WhatsApp Scheduling</h4>
              <p className="text-xs text-slate-500 mt-1">
                Instant delivery slot booking and head baker consultation right inside your WhatsApp chat.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Cake Order Modal Component */}
      <CustomCakeOrderModal
        product={selectedProduct}
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        whatsappNumber={store.whatsappNumber || '918073511215'}
        storeName={store.name || 'Rich Whisk'}
        currencySymbol={store.currencySymbol || '₹'}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer for Custom Orders */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-rose-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900">Your Custom Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                    <Cake className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No cakes in cart yet</p>
                  <p className="text-xs text-slate-400">Customize a design or pick from catalog</p>
                </div>
              ) : (
                cartItems.map((item: any, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{item.productName || item.name}</h4>
                      <span className="text-xs font-black text-rose-600">
                        {item.unitPrice === 'quote' ? 'Quote' : `₹${item.unitPrice || item.price}`}
                      </span>
                    </div>

                    {item.weight && (
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>• <strong>Weight:</strong> {item.weight} ({item.dietary})</p>
                        <p>• <strong>Flavor:</strong> {item.flavor}</p>
                        <p>• <strong>Shape:</strong> {item.shape}</p>
                        {item.messageOnCake && (
                          <p>• <strong>Message:</strong> "{item.messageOnCake}"</p>
                        )}
                        {item.referencePhotoName && (
                          <p className="text-emerald-700">📷 <strong>Ref:</strong> {item.referencePhotoName}</p>
                        )}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-rose-200/60">
                      <button
                        onClick={() => setCartItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Remove
                      </button>
                      {item.formattedWhatsAppUrl && (
                        <a
                          href={item.formattedWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg shadow hover:bg-emerald-700"
                        >
                          Send WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
                <a
                  href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
                    `Hello ${store.name}! I have ${cartItems.length} custom item(s) in my cart for ordering.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send All to WhatsApp</span>
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
