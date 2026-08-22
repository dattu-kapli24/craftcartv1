import React, { useState, useId } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Image as ImageIcon, 
  AlertCircle, 
  Heart, 
  Share2, 
  Cake,
  Calendar,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export interface CakeProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  inStock?: boolean;
  isCustomizable?: boolean;
  baseWeight?: string;
  flavors?: string[];
  shapeOptions?: string[];
  tagline?: string;
}

export interface CustomCakeOrderModalProps {
  product: CakeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  storeName?: string;
  currencySymbol?: string;
  onAddToCart?: (orderSummary: CustomCakeOrderData) => void;
}

export interface CustomCakeOrderData {
  productId: string;
  productName: string;
  weight: string;
  dietary: 'Egg' | 'Eggless';
  flavor: string;
  customFlavorNote?: string;
  shape: string;
  messageOnCake: string;
  specialInstructions: string;
  referencePhotoName?: string;
  referencePhotoPreview?: string;
  unitPrice: number | 'quote';
  formattedWhatsAppUrl: string;
}

const WEIGHT_OPTIONS = [
  { label: '0.5 kg', value: '0.5 kg', multiplier: 0.6, serves: '4-6 Portions' },
  { label: '1 kg', value: '1 kg', multiplier: 1.0, serves: '8-10 Portions' },
  { label: '1.5 kg', value: '1.5 kg', multiplier: 1.45, serves: '12-15 Portions' },
  { label: '2 kg', value: '2 kg', multiplier: 1.85, serves: '18-20 Portions' },
  { label: 'Custom Size', value: 'Custom Size', multiplier: null, serves: 'Large Event / Multi-tier' }
];

const DEFAULT_FLAVORS = [
  'Belgium Chocolate Truffle',
  'Vanilla Berry',
  'Biscoff Caramel',
  'Hazelnut Praline',
  'Custom Flavor Request'
];

const SHAPE_OPTIONS = [
  { label: 'Round (Classic)', value: 'Round', icon: '⚪', extra: 0 },
  { label: 'Heart (Romantic)', value: 'Heart', icon: '💖', extra: 100 },
  { label: 'Square (Modern)', value: 'Square', icon: '⬜', extra: 50 },
  { label: 'Multi-tier (Grand)', value: 'Multi-tier', icon: '🎂', extra: 350 }
];

export const CustomCakeOrderModal: React.FC<CustomCakeOrderModalProps> = ({
  product,
  isOpen,
  onClose,
  whatsappNumber = '918073511215',
  storeName = 'Rich Whisk',
  currencySymbol = '₹',
  onAddToCart
}) => {
  const fileInputId = useId();
  const [selectedWeight, setSelectedWeight] = useState<string>('1 kg');
  const [dietary, setDietary] = useState<'Egg' | 'Eggless'>('Eggless');
  const [flavor, setFlavor] = useState<string>('Belgium Chocolate Truffle');
  const [customFlavorNote, setCustomFlavorNote] = useState<string>('');
  const [shape, setShape] = useState<string>('Round');
  const [messageOnCake, setMessageOnCake] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  // Pricing Calculation
  const basePrice = product.price || 1450;
  const weightConfig = WEIGHT_OPTIONS.find(w => w.value === selectedWeight);
  const shapeConfig = SHAPE_OPTIONS.find(s => s.value === shape);
  const isEggless = dietary === 'Eggless';
  const egglessAddon = isEggless ? 50 : 0;
  const shapeAddon = shapeConfig?.extra || 0;

  const isCustomQuoteRequired = 
    selectedWeight === 'Custom Size' || 
    flavor === 'Custom Flavor Request' ||
    shape === 'Multi-tier' && selectedWeight === 'Custom Size';

  let calculatedTotal: number | 'quote' = 'quote';
  if (!isCustomQuoteRequired && weightConfig?.multiplier) {
    const rawPrice = Math.round(basePrice * weightConfig.multiplier) + egglessAddon + shapeAddon;
    calculatedTotal = rawPrice;
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setReferenceFile(null);
    setReferencePreview(null);
  };

  // WhatsApp Formatter
  const generateWhatsAppMessage = () => {
    const cleanProductName = product.name;
    const finalFlavor = flavor === 'Custom Flavor Request' 
      ? `Custom Request: ${customFlavorNote.trim() || 'Flavor to be discussed'}`
      : flavor;

    const formattedMessage = [
      `🎂 *NEW CUSTOM CAKE INQUIRY - ${storeName.toUpperCase()}* 🎂`,
      ``,
      `*Product:* ${cleanProductName}`,
      `*Weight:* ${selectedWeight}`,
      `*Type:* ${dietary}`,
      `*Flavor:* ${finalFlavor}`,
      `*Shape:* ${shape}`,
      `*Message on Cake:* "${messageOnCake.trim() || 'None / To be decided'}"`,
      `*Special Notes:* ${specialInstructions.trim() || 'Standard bakery finishing'}`,
      `*Attached Reference Photo:* ${referenceFile ? referenceFile.name + ' (Attached in chat)' : 'Standard catalog design'}`,
      deliveryDate ? `*Preferred Delivery Slot:* ${deliveryDate}` : null,
      ``,
      calculatedTotal === 'quote' 
        ? `*Estimated Quote:* Custom Pricing Requested` 
        : `*Estimated Total:* ${currencySymbol}${calculatedTotal.toLocaleString('en-IN')}`,
      ``,
      `_Please confirm availability and custom slot for this bespoke cake order!_`
    ].filter(Boolean).join('\n');

    return formattedMessage;
  };

  const getWhatsAppUrl = () => {
    const text = generateWhatsAppMessage();
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleSendWhatsApp = () => {
    const url = getWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddOrderSummary = () => {
    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        productName: product.name,
        weight: selectedWeight,
        dietary,
        flavor: flavor === 'Custom Flavor Request' ? `Custom: ${customFlavorNote}` : flavor,
        customFlavorNote,
        shape,
        messageOnCake,
        specialInstructions,
        referencePhotoName: referenceFile?.name,
        referencePhotoPreview: referencePreview || undefined,
        unitPrice: calculatedTotal,
        formattedWhatsAppUrl: getWhatsAppUrl()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        id="customCakeModalContainer"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-rose-100 text-slate-800"
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/40 border-b border-rose-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                  100% Bespoke Bakery
                </span>
                <span className="text-xs text-slate-500 font-medium">Bespoke Artisan Studio</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Customize Your Dream Cake
              </h2>
            </div>
          </div>
          <button
            id="closeCustomCakeModalBtn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Product Banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-inner flex-shrink-0 bg-rose-100 border border-rose-200">
              <img
                src={referencePreview || (product.image.startsWith('http') || product.image.startsWith('/') || product.image.startsWith('data:') ? product.image : '/' + product.image)}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/475569?text=Cake+Preview';
                }}
              />
              {referencePreview && (
                <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  Custom Ref
                </span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{product.name}</h3>
                <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-md">
                  {product.category || 'Custom Cakes'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2">
                {product.description || 'Every cake is baked from scratch with premium ingredients and customized according to your exact vision.'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5" /> Freshly Hand-Baked
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Custom Sugar Craft
                </span>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Selectors */}
            <div className="space-y-5">
              {/* 1. Weight Options */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>1. Cake Weight / Size <span className="text-rose-500">*</span></span>
                  <span className="text-xs text-slate-500 font-normal">
                    {weightConfig?.serves}
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {WEIGHT_OPTIONS.map((opt) => {
                    const isSelected = selectedWeight === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        id={`weight-btn-${opt.value.replace(/\s+/g, '-')}`}
                        onClick={() => setSelectedWeight(opt.value)}
                        className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200 ring-2 ring-rose-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        <span className="font-bold">{opt.label}</span>
                        {opt.multiplier && (
                          <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                            {currencySymbol}{Math.round(basePrice * opt.multiplier)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dietary Preference (Egg / Eggless) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span>2. Dietary Preference <span className="text-rose-500">*</span></span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    100% Veg Option Available
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      dietary === 'Eggless'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="dietary"
                        value="Eggless"
                        checked={dietary === 'Eggless'}
                        onChange={() => setDietary('Eggless')}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-sm">🌱 Eggless (Pure Veg)</div>
                        <div className="text-[11px] text-slate-500">+ ₹50 specialist bake</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">+₹50</span>
                  </label>

                  <label
                    className={`relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      dietary === 'Egg'
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300 text-amber-950 font-semibold'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="dietary"
                        value="Egg"
                        checked={dietary === 'Egg'}
                        onChange={() => setDietary('Egg')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-sm">🥚 Contains Egg</div>
                        <div className="text-[11px] text-slate-500">Standard base</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Included</span>
                  </label>
                </div>
              </div>

              {/* 3. Flavor Selection */}
              <div className="space-y-2">
                <label htmlFor="cakeFlavorSelect" className="text-sm font-semibold text-slate-800 block">
                  3. Flavor Selection <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="cakeFlavorSelect"
                    value={flavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 appearance-none shadow-sm cursor-pointer"
                  >
                    {(product.flavors || DEFAULT_FLAVORS).map((flv) => (
                      <option key={flv} value={flv}>
                        {flv}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>

                {flavor === 'Custom Flavor Request' && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      id="customFlavorInput"
                      placeholder="Specify your desired flavor (e.g. Pistachio Raspberry, Salted Biscoff, etc.)"
                      value={customFlavorNote}
                      onChange={(e) => setCustomFlavorNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-pink-300 bg-pink-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                )}
              </div>

              {/* 4. Shape Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 block">
                  4. Cake Shape / Structure <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SHAPE_OPTIONS.map((shp) => {
                    const isSelected = shape === shp.value;
                    return (
                      <button
                        key={shp.value}
                        type="button"
                        id={`shape-btn-${shp.value.toLowerCase()}`}
                        onClick={() => setShape(shp.value)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-300 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base mb-1">{shp.icon}</span>
                        <span>{shp.value}</span>
                        {shp.extra > 0 && (
                          <span className="text-[10px] text-rose-600 mt-0.5">+{currencySymbol}{shp.extra}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Customization Inputs */}
            <div className="space-y-5">
              {/* 5. Reference Design Upload */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>5. Upload Design / Reference Photo</span>
                  <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded">
                    Recommended for Custom Theme
                  </span>
                </label>

                {!referencePreview ? (
                  <label 
                    htmlFor={fileInputId}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 rounded-xl cursor-pointer transition-all hover:bg-rose-50 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 text-center">
                      Click or drag & drop reference photo
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PNG, JPG, JPEG up to 10MB
                    </span>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={referencePreview}
                        alt="Reference upload"
                        className="w-12 h-12 object-cover rounded-lg border border-rose-300 shadow-sm"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                          {referenceFile?.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Photo Attached
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 bg-white rounded-md shadow-sm border border-rose-200"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Message on Cake */}
              <div className="space-y-2">
                <label htmlFor="messageOnCakeInput" className="text-sm font-semibold text-slate-800 block">
                  6. Message on Cake (Greeting / Name)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="messageOnCakeInput"
                    maxLength={50}
                    placeholder='e.g., "Happy 25th Birthday Rahul!" or "Forever & Always 💕"'
                    value={messageOnCake}
                    onChange={(e) => setMessageOnCake(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">
                    {messageOnCake.length}/50
                  </span>
                </div>
              </div>

              {/* 7. Special Instructions */}
              <div className="space-y-2">
                <label htmlFor="specialInstructionsInput" className="text-sm font-semibold text-slate-800 block">
                  7. Special Notes & Themes
                </label>
                <textarea
                  id="specialInstructionsInput"
                  rows={3}
                  placeholder="Allergies (nut-free, less sweet), preferred color palette (pastel pink/gold), delivery timing or topper requests..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm resize-none"
                />
              </div>

              {/* 8. Delivery Slot / Date (Optional Helper) */}
              <div className="space-y-2">
                <label htmlFor="deliveryDateInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" /> Preferred Delivery Date & Slot
                </label>
                <input
                  type="text"
                  id="deliveryDateInput"
                  placeholder="e.g. 18th August, 4:00 PM evening slot"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/50 border border-rose-200/80">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                  Real-time Custom Estimate
                </div>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start mt-0.5">
                  {calculatedTotal === 'quote' ? (
                    <div className="text-xl sm:text-2xl font-black text-rose-700">
                      Quote on Request
                    </div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {currencySymbol}{calculatedTotal.toLocaleString('en-IN')}
                    </div>
                  )}
                  {calculatedTotal !== 'quote' && (
                    <span className="text-xs text-slate-500">
                      (Includes {dietary}, {selectedWeight}, {shape})
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">100% Direct WhatsApp Sync</p>
                  <p className="text-[11px] text-slate-500">Instant confirmation with head baker</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="sticky bottom-0 z-20 px-5 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const text = generateWhatsAppMessage();
              navigator.clipboard.writeText(text);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
            <span>{isCopied ? 'Inquiry Copied!' : 'Copy Summary Text'}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onAddToCart && (
              <button
                type="button"
                id="addToCartCustomBtn"
                onClick={handleAddOrderSummary}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-all shadow-sm"
              >
                Save to Cart
              </button>
            )}

            <button
              type="button"
              id="sendCustomRequestWhatsAppBtn"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.99] transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>
                {calculatedTotal === 'quote' ? 'Request Custom Quote on WhatsApp' : 'Send Custom Request on WhatsApp'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCakeOrderModal;
