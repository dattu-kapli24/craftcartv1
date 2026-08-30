import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Hash,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Invoice } from '../src/types/collect';

interface ProofVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  vendor?: any;
  onApprove: (invoiceId: string, confirmedAmount: number, notes: string) => Promise<void>;
  onReject: (invoiceId: string, reason: string) => Promise<void>;
  isProcessing?: boolean;
  isSubmitting?: boolean;
}

export function ProofVerificationModal({
  isOpen,
  onClose,
  invoice,
  vendor,
  onApprove,
  onReject,
  isProcessing = false,
  isSubmitting = false
}: ProofVerificationModalProps) {
  const isBusy = isProcessing || isSubmitting;
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  
  // Accountant Audit & Adjustment State
  const initialOutstanding = invoice ? (invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : invoice.amount) : 0;
  const [confirmedAmount, setConfirmedAmount] = React.useState<number>(initialOutstanding);
  const [accountantNotes, setAccountantNotes] = React.useState<string>('');

  React.useEffect(() => {
    if (invoice) {
      const out = invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : invoice.amount;
      setConfirmedAmount(out);
      setAccountantNotes('');
      setShowRejectInput(false);
      setRejectReason('');
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const currentOutstanding = invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : invoice.amount;
  const remainingAfterAudit = Math.max(0, currentOutstanding - (Number(confirmedAmount) || 0));
  const isPartialSettlement = confirmedAmount > 0 && confirmedAmount < currentOutstanding;
  const isFullSettlement = confirmedAmount >= currentOutstanding;

  const handleApprove = async () => {
    await onApprove(invoice.id, Number(confirmedAmount) || currentOutstanding, accountantNotes);
  };

  const handleReject = async () => {
    await onReject(invoice.id, rejectReason || 'Transaction not found in bank statement');
    setShowRejectInput(false);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        id="proof-verification-modal"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Verify Proof of Settlement
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Pending Verification
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Check your corporate bank account / UPI app before closing this invoice.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Invoice Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block">Customer / Party</span>
              <span className="text-sm font-bold text-white truncate block">{invoice.customerName}</span>
              <span className="text-xs text-slate-400 font-mono">{invoice.phone}</span>
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block">Invoice Number</span>
              <span className="text-sm font-bold text-slate-200 font-mono block">#{invoice.invoiceNo}</span>
              <span className="text-xs text-slate-400">Due: {invoice.dueDate}</span>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] uppercase font-bold text-slate-500 block">Total Due Amount</span>
              <span className="text-lg font-black text-emerald-400 font-mono block">
                ₹{invoice.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400">
                Mode: <strong className="text-slate-300">{invoice.paymentMethod || 'UPI / Bank Transfer'}</strong>
              </span>
            </div>
          </div>

          {/* Settlement Proof Details */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>UTR / Bank Transaction Reference</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 select-all">
                {invoice.utrNumber || 'Not provided'}
              </span>
            </div>

            {invoice.proofSubmittedAt && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Proof Submitted At:</span>
                <span className="text-slate-200 font-medium">
                  {new Date(invoice.proofSubmittedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            )}

            {invoice.payerNotes && (
              <div className="text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1">Customer Note:</span>
                <p className="p-2.5 bg-slate-900 rounded-xl text-slate-300 italic border border-slate-800">
                  "{invoice.payerNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Receipt / Bank Screenshot Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Uploaded Bank Screenshot / Receipt</span>
              </span>
              {invoice.receiptUrl && (
                <a
                  href={invoice.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Open Full Image</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {invoice.receiptUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-center max-h-72">
                <img
                  src={invoice.receiptUrl}
                  alt={`Proof for invoice ${invoice.invoiceNo}`}
                  className="max-h-64 max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 text-center text-xs text-slate-400">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                Buyer did not attach a screenshot. Please verify via UTR Number: <strong className="text-white font-mono">{invoice.utrNumber || 'N/A'}</strong>.
              </div>
            )}
          </div>

          {/* Accountant Ledger Settlement Audit & Adjustment Panel */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-emerald-500/30 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Accountant Bank Audit & Settlement Adjustment
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Due: <strong className="text-emerald-400">₹{currentOutstanding.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Confirmed Amount Received (₹)</span>
                  {isPartialSettlement && (
                    <span className="text-[11px] text-amber-400 font-mono font-bold">
                      Bal: ₹{remainingAfterAudit.toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-emerald-400 font-mono select-none">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    max={currentOutstanding}
                    value={confirmedAmount}
                    onChange={(e) => setConfirmedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 bg-slate-950 border-2 border-emerald-500/40 focus:border-emerald-400 rounded-xl pl-8 pr-3 text-base font-mono font-black text-white focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Audit / Reconciliation Note (Optional)
                </label>
                <input
                  type="text"
                  value={accountantNotes}
                  onChange={(e) => setAccountantNotes(e.target.value)}
                  placeholder="e.g. Cleared via ICICI Current A/c, verified by John"
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Dynamic Status Preview Banner */}
            <div className="pt-1">
              {isFullSettlement ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Full Clearance:</strong> Received ₹{confirmedAmount.toLocaleString('en-IN')}. Invoice will be marked <strong>PAID</strong> and closed.
                  </span>
                </div>
              ) : isPartialSettlement ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Partial Settlement:</strong> Received ₹{confirmedAmount.toLocaleString('en-IN')}. Outstanding balance will adjust to <strong>₹{remainingAfterAudit.toLocaleString('en-IN')}</strong> and remain active for automated reminder follow-ups.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Please enter a valid positive settlement amount received.</span>
                </div>
              )}
            </div>
          </div>

          {/* Reject Reason Form (Accordion) */}
          {showRejectInput && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-rose-300">
                Reason for Rejection (Visible in invoice logs):
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not found in bank statement, amount mismatch..."
                className="w-full h-10 bg-slate-950 border border-rose-500/40 rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isBusy}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <span>Confirm Reject</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!showRejectInput && (
            <button
              type="button"
              onClick={() => setShowRejectInput(true)}
              disabled={isBusy}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reject / Request Re-transfer</span>
            </button>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isBusy || confirmedAmount <= 0}
              className={`w-full sm:w-auto px-6 py-2.5 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
                isPartialSettlement
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
              } ${isBusy || confirmedAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isBusy
                  ? 'Updating Ledger...'
                  : isPartialSettlement
                  ? `Approve Partial ₹${confirmedAmount.toLocaleString('en-IN')}`
                  : 'Approve & Close Invoice'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
