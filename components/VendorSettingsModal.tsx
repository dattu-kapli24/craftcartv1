import React, { useState, useEffect } from 'react';
import { X, Save, Building2, QrCode, Calendar, MessageSquare, Sparkles, Check, HelpCircle, ShieldCheck } from 'lucide-react';
import { Vendor } from '../src/types/collect';
import { saveVendorProfile } from '../lib/firebase';

interface VendorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  userId: string;
  onVendorUpdate: (updatedVendor: Vendor) => void;
}

export function VendorSettingsModal({
  isOpen,
  onClose,
  vendor,
  userId,
  onVendorUpdate
}: VendorSettingsModalProps) {
  const [businessName, setBusinessName] = useState(vendor.businessName || '');
  const [upiId, setUpiId] = useState(vendor.upiId || '');
  const [payeeName, setPayeeName] = useState(vendor.payeeName || '');
  const [paymentTerms, setPaymentTerms] = useState(vendor.paymentTerms || '15');
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    vendor.whatsappTemplate ||
      `Dear {{customer_name}},\n\nThis is a gentle payment reminder from {{business_name}} regarding Invoice #{{invoice_no}} for ₹{{amount}}, due on {{due_date}}.\n\nKindly clear the dues via this instant UPI payment link:\n{{upi_link}}\n\nThank you for your business!`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.businessName || '');
      setUpiId(vendor.upiId || '');
      setPayeeName(vendor.payeeName || '');
      setPaymentTerms(vendor.paymentTerms || '15');
      if (vendor.whatsappTemplate) {
        setWhatsappTemplate(vendor.whatsappTemplate);
      }
    }
  }, [vendor]);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setWhatsappTemplate((prev) => `${prev} {{${tag}}}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const updated: Vendor = {
      ...vendor,
      id: userId || vendor.id,
      businessName: businessName.trim() || 'OrderSpot Wholesale Mart',
      upiId: upiId.trim() || 'orderspot@icici',
      payeeName: payeeName.trim() || businessName.trim(),
      paymentTerms: paymentTerms.trim(),
      whatsappTemplate
    };

    try {
      await saveVendorProfile(userId || vendor.id, updated);
      onVendorUpdate(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error updating vendor profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview generated text
  const previewText = whatsappTemplate
    .replace(/\{\{customer_name\}\}/g, 'Shree Balaji Traders')
    .replace(/\{\{business_name\}\}/g, businessName || 'OrderSpot Wholesale Mart')
    .replace(/\{\{invoice_no\}\}/g, 'OS-2026-891')
    .replace(/\{\{amount\}\}/g, '48,500')
    .replace(/\{\{due_date\}\}/g, '10-Aug-2026')
    .replace(/\{\{upi_link\}\}/g, `upi://pay?pa=${upiId || 'orderspot@icici'}&pn=${encodeURIComponent(payeeName || businessName || 'OrderSpot')}&am=48500.00&tr=INV-891&cu=INR`);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div 
        className="w-full max-w-full sm:max-w-xl bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
        id="vendor-settings-drawer"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Vendor & WhatsApp Settings</h2>
              <p className="text-xs text-slate-400">Store identity, UPI VPA, and reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Section 1: Business Profile */}
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Building2 className="w-4 h-4" />
              <span>Business Profile</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. OrderSpot Wholesale Mart"
                className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payee Registered Name on Bank</label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. OrderSpot Wholesale & Distributors Private Limited"
                className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: UPI & Banking */}
          <div className="space-y-3.5 sm:space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <QrCode className="w-4 h-4" />
              <span>Payment & UPI VPA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">UPI ID / VPA</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="merchant@icici / store@okaxis"
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-emerald-800/50 rounded-xl px-4 text-base sm:text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">Direct bank settlements go here.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Credit Terms (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 sm:top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 15 or Net 30 Days"
                    className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Custom WhatsApp Template */}
          <div className="space-y-3.5 sm:space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Template</span>
              </div>
              <span className="text-[11px] text-slate-400">Tap tags to insert</span>
            </div>

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: 'customer_name', label: '+ Customer' },
                { tag: 'business_name', label: '+ Business' },
                { tag: 'invoice_no', label: '+ Invoice #' },
                { tag: 'amount', label: '+ Amount' },
                { tag: 'due_date', label: '+ Due Date' },
                { tag: 'upi_link', label: '+ UPI Link' }
              ].map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleInsertTag(item.tag)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-emerald-300 text-slate-300 text-xs rounded-lg font-mono border border-slate-700 transition-colors cursor-pointer active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div>
              <textarea
                rows={5}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm sm:text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
              />
            </div>

            {/* Live Message Preview */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Preview (Client's View)</span>
              </div>
              <div className="bg-[#0b141a] border border-[#202c33] rounded-xl p-3 text-xs text-[#e9edef] whitespace-pre-line leading-relaxed shadow-inner">
                {previewText}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Firestore sync</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial h-11 sm:h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial h-11 sm:h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
