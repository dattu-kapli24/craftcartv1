import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Layers, 
  Ruler, 
  Award, 
  Truck, 
  MessageSquare, 
  Check, 
  Plus, 
  Minus, 
  FileText, 
  Sparkles,
  PhoneCall
} from 'lucide-react';

export interface PlywoodProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock?: boolean;
  moq?: number;
  unit?: string;
  size?: string;
  thickness?: string;
  grade?: string;
  core?: string;
  finish?: string;
  description?: string;
  bulkPricing?: Array<{ minQty: number; price: number }>;
}

interface PlywoodSpecModalProps {
  product: PlywoodProduct | null;
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
  currencySymbol: string;
  onAddToCart: (item: { product: PlywoodProduct; quantity: number; calculatedPrice: number; totalSqFt: number; notes: string }) => void;
}

export function PlywoodSpecModal({
  product,
  isOpen,
  onClose,
  whatsappNumber,
  currencySymbol,
  onAddToCart
}: PlywoodSpecModalProps) {
  if (!isOpen || !product) return null;

  const moq = product.moq || 10;
  const [quantity, setQuantity] = useState<number>(moq);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [requestSample, setRequestSample] = useState<boolean>(false);

  // Calculate unit price based on tiered bulk pricing
  let activeUnitPrice = product.price;
  if (product.bulkPricing && product.bulkPricing.length > 0) {
    const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQty) {
        activeUnitPrice = tier.price;
        break;
      }
    }
  }

  const totalAmount = activeUnitPrice * quantity;
  const totalSqFt = quantity * 32; // Standard 8x4 ft = 32 sqft per sheet

  const handleIncrement = () => setQuantity(prev => prev + 5);
  const handleDecrement = () => setQuantity(prev => (prev > moq ? prev - 5 : moq));

  const handleWhatsAppInquiry = () => {
    const message = `*B2B Wholesale Quotation Request — Shreeji Ply & Laminates*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Product:* ${product.name}
📐 *Size & Spec:* ${product.size || '8x4 ft (32 sq.ft)'} | ${product.thickness || '18mm'}
🏅 *Grade / Standard:* ${product.grade || 'Commercial Grade'}
${product.finish ? `🎨 *Finish:* ${product.finish}\n` : ''}${product.core ? `🪵 *Core Material:* ${product.core}\n` : ''}
🔢 *Order Quantity:* ${quantity} ${product.unit || 'Sheets'} (${totalSqFt} sq.ft)
💰 *Wholesale Rate:* ${currencySymbol}${activeUnitPrice} / ${product.unit || 'sheet'}
💵 *Estimated Total (ex-mill):* ${currencySymbol}${totalAmount.toLocaleString('en-IN')}

${requestSample ? '🔖 *Sample Request:* Yes, please arrange a 4x4 inch catalog swatch sample box.\n' : ''}${customNotes ? `📝 *Project / Dispatch Notes:* ${customNotes}\n` : ''}
📍 *Delivery Requirement:* Please provide freight dispatch quote, E-way bill & GST invoice breakdown for our site.`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noreferrer');
  };

  const handleAdd = () => {
    onAddToCart({
      product,
      quantity,
      calculatedPrice: activeUnitPrice,
      totalSqFt,
      notes: customNotes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-amber-200 relative my-auto animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border border-amber-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>B2B Technical Spec Sheet</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white">
              {product.name}
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Category: {product.category} • SKU: {product.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top Product Specs & Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-5 aspect-4/3 rounded-2xl overflow-hidden bg-amber-50 border border-amber-200 shadow-inner relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/products/plywood-marine-18mm.jpg';
                }}
              />
              <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                MOQ: {moq} {product.unit || 'Sheets'}
              </div>
            </div>

            <div className="sm:col-span-7 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Dimensions</span>
                  <strong className="text-slate-900">{product.size || '8x4 ft (32 sq.ft)'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Thickness</span>
                  <strong className="text-slate-900">{product.thickness || '18 mm'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Standard / Grade</span>
                  <strong className="text-slate-900 truncate block">{product.grade || 'IS:710 Marine'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Finish / Texture</span>
                  <strong className="text-slate-900 truncate block">{product.finish || 'Smooth Sanded'}</strong>
                </div>
              </div>

              {product.core && (
                <div className="p-2.5 rounded-xl bg-slate-900 text-amber-300 text-xs flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200"><strong>Core:</strong> {product.core}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Technical Overview & Application</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Tiered Bulk Wholesale Matrix */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Tiered B2B Wholesale Pricing</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Direct Factory Mill Rates
                </span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className={`p-2.5 rounded-xl border transition-all ${quantity < (product.bulkPricing[0]?.minQty || 30) ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  <span className="text-[10px] block opacity-80">MOQ Tier</span>
                  <span className="font-extrabold text-sm">{currencySymbol}{product.price}</span>
                  <span className="text-[10px] block opacity-80">{moq} - {(product.bulkPricing[0]?.minQty || 30) - 1} {product.unit || 'sheets'}</span>
                </div>
                {product.bulkPricing.map((tier, idx) => {
                  const nextTier = product.bulkPricing?.[idx + 1];
                  const isCurrent = quantity >= tier.minQty && (!nextTier || quantity < nextTier.minQty);
                  return (
                    <div
                      key={tier.minQty}
                      className={`p-2.5 rounded-xl border transition-all ${isCurrent ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      <span className="text-[10px] block opacity-80">Tier {idx + 2}</span>
                      <span className="font-extrabold text-sm">{currencySymbol}{tier.price}</span>
                      <span className="text-[10px] block opacity-80">{tier.minQty}+ {product.unit || 'sheets'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Total Calculation */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-amber-400 font-semibold block">Order Volume ({product.unit || 'Sheets'})</span>
                <span className="text-[11px] text-slate-400">Min. order quantity is {moq} {product.unit || 'sheets'}</span>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= moq}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-base px-3 text-amber-300">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-500 flex items-center justify-center text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Total Coverage</span>
                <strong className="text-white font-mono">{totalSqFt.toLocaleString('en-IN')} sq.ft ({quantity} sheets)</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Estimated Amount (ex-factory)</span>
                <strong className="text-lg font-mono text-amber-400 font-black">
                  {currencySymbol}{totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* Sample Box Request Toggle */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={requestSample}
              onChange={(e) => setRequestSample(e.target.checked)}
              className="mt-0.5 rounded text-amber-700 focus:ring-amber-500"
            />
            <div className="text-xs">
              <strong className="text-amber-950 font-bold block">Request 4x4" Physical Catalog Sample Swatch</strong>
              <span className="text-amber-800/80">Check this if you require courier dispatch of physical finish samples to your office before bulk dispatch.</span>
            </div>
          </label>

          {/* Project / Site Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Project / Site Dispatch Notes (Optional)</label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Delivery needed at Bandra West interior project site, need GST invoice"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition-all cursor-pointer shadow-sm"
          >
            + Add to Wholesale Cart
          </button>
          
          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct WhatsApp RFQ ({currencySymbol}{totalAmount.toLocaleString('en-IN')})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
