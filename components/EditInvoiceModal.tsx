import React, { useState, useEffect } from 'react';
import { X, Edit2, Phone, User, Calendar, DollarSign, CheckCircle2, History, AlertCircle, Save } from 'lucide-react';
import { Invoice, InvoiceStatus } from '../src/types/collect';
import { sanitizeIndianPhone } from '../utils/excelParser';
import { updateInvoiceInFirestore } from '../lib/firebase';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onInvoiceUpdated: (updatedInvoice: Invoice) => void;
}

export function EditInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onInvoiceUpdated
}: EditInvoiceModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<string>('0');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receivedToday, setReceivedToday] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (invoice) {
      setCustomerName(invoice.customerName || '');
      setPhone(invoice.phone || '');
      setAmount(invoice.amount?.toString() || '0');
      setDueDate(invoice.dueDate || '');
      setInvoiceNo(invoice.invoiceNo || '');
      setReceivedToday('');
      setPaymentNote('');
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const currentAmountNum = parseFloat(amount) || 0;
  const partialPaidNum = parseFloat(receivedToday) || 0;
  const remainingBalance = Math.max(0, currentAmountNum - partialPaidNum);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formattedPhone = sanitizeIndianPhone(phone) || phone.trim();
    const prevPaid = invoice.paidAmount || 0;
    const newPaidTotal = prevPaid + partialPaidNum;

    // Calculate new status
    let nextStatus: InvoiceStatus = invoice.status;
    const finalAmount = partialPaidNum > 0 ? remainingBalance : currentAmountNum;

    if (finalAmount <= 0) {
      nextStatus = 'PAID';
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      nextStatus = dueDate < todayStr ? 'OVERDUE' : 'PENDING';
    }

    const newPaymentHistory = invoice.paymentHistory ? [...invoice.paymentHistory] : [];
    if (partialPaidNum > 0) {
      newPaymentHistory.push({
        date: new Date().toISOString(),
        amount: partialPaidNum,
        notes: paymentNote.trim() || 'Recorded via OrderSpot Collect'
      });
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      invoiceNo: invoiceNo.trim() || invoice.invoiceNo,
      customerName: customerName.trim() || invoice.customerName,
      phone: formattedPhone,
      amount: finalAmount,
      originalAmount: invoice.originalAmount || (currentAmountNum + prevPaid),
      paidAmount: newPaidTotal,
      dueDate,
      status: nextStatus,
      paymentHistory: newPaymentHistory
    };

    // 1. Optimistically update parent dashboard state immediately
    onInvoiceUpdated(updatedInvoice);

    // 2. Immediately close the modal
    onClose();

    // 3. Persist to Firestore & offline storage in background
    try {
      await updateInvoiceInFirestore(invoice.id, updatedInvoice, invoice.vendorId);
    } catch (err) {
      console.warn('Firestore update error (saved locally):', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        id="edit-invoice-modal"
      >
        {/* Sticky Modal Header */}
        <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-800/80 relative">
          {/* Mobile pull indicator bar */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Edit Bill & Record Payment</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Invoice #{invoice.invoiceNo}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-invoice-form" onSubmit={handleSave} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {/* Row 1: Invoice # and Customer Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice #</label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer / Party Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 sm:top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 2: WhatsApp Phone & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer WhatsApp Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 sm:top-2.5 w-4 h-4 text-emerald-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="9822123456"
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-emerald-800/60 rounded-xl pl-10 pr-4 text-base sm:text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Sanitizes to {sanitizeIndianPhone(phone)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 sm:top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Current Due Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 sm:top-2.5 font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 sm:h-11 bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 text-lg sm:text-base font-extrabold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Partial Payment Feature Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span>Partial / Received Payment</span>
              </div>
              <span className="text-[11px] text-slate-400">Record cash / bank entry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Amount Received Today (₹)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={receivedToday}
                  onChange={(e) => setReceivedToday(e.target.value)}
                  className="w-full h-11 sm:h-9 bg-slate-900 border border-slate-700 rounded-xl px-3 text-base sm:text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Remaining Balance</label>
                <div className="h-11 sm:h-9 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-extrabold font-mono text-white flex items-center justify-between">
                  <span>₹{remainingBalance.toLocaleString('en-IN')}</span>
                  {remainingBalance === 0 && currentAmountNum > 0 ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      FULLY PAID
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>

            {partialPaidNum > 0 && (
              <div>
                <input
                  type="text"
                  placeholder="Payment note (e.g. Paid via GPay / Cheque #8912)"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full h-10 sm:h-9 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </form>

        {/* Sticky Modal Footer Actions - Always 100% visible on mobile */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden xs:block truncate">
            {remainingBalance === 0 && partialPaidNum > 0
              ? 'Will mark bill as PAID.'
              : 'Will update remaining balance.'}
          </div>

          <div className="flex gap-2.5 items-center w-full xs:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 xs:flex-initial h-11 sm:h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-invoice-form"
              disabled={isSaving}
              className="flex-1 xs:flex-initial h-11 sm:h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 min-w-[140px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Updates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
