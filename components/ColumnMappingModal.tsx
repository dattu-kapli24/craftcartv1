import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
  Phone,
  IndianRupee,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { RawSpreadsheetData, ColumnMapping, guessBestColumnMapping, transformRowsWithMapping } from '../utils/excelParser';
import { Invoice } from '../src/types/collect';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawData: RawSpreadsheetData | null;
  vendorId: string;
  onConfirmMapping: (invoices: Invoice[]) => void;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  rawData,
  vendorId,
  onConfirmMapping
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    customerNameCol: '',
    amountCol: '',
    phoneCol: '',
    invoiceNoCol: '',
    dueDateCol: ''
  });

  const [previewRows, setPreviewRows] = useState<Invoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // When rawData loads or changes, auto-guess the best initial mappings
  useEffect(() => {
    if (rawData && rawData.headers.length > 0) {
      const guessed = guessBestColumnMapping(rawData.headers);
      setMapping(guessed);
    }
  }, [rawData]);

  // Recalculate dynamic preview rows whenever mapping changes
  useEffect(() => {
    if (rawData && rawData.rawRows.length > 0 && mapping.customerNameCol && mapping.amountCol) {
      try {
        const samples = rawData.rawRows.slice(0, 3);
        const transformed = transformRowsWithMapping(samples, mapping, vendorId);
        setPreviewRows(transformed);
      } catch (err) {
        console.warn('Preview calculation error:', err);
      }
    } else {
      setPreviewRows([]);
    }
  }, [mapping, rawData, vendorId]);

  if (!isOpen || !rawData) return null;

  const isFormValid = Boolean(mapping.customerNameCol && mapping.amountCol && mapping.phoneCol);

  const handleConfirm = () => {
    if (!isFormValid || !rawData) return;
    setIsProcessing(true);
    try {
      const transformedInvoices = transformRowsWithMapping(rawData.rawRows, mapping, vendorId);
      onConfirmMapping(transformedInvoices);
    } catch (err: any) {
      alert(`Error mapping spreadsheet: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="column-mapping-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="column-mapping-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Map Spreadsheet Columns
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {rawData.totalRows} rows found
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Match your file headers to OrderSpot's invoice recovery fields
              </p>
            </div>
          </div>
          <button
            id="close-mapping-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* File Info Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">File:</span>
              <span className="font-semibold text-slate-200 truncate max-w-xs">{rawData.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">Sheet:</span>
              <span className="text-slate-300 font-mono">{rawData.sheetName}</span>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Select Corresponding Columns
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-detected using standard ERP terms</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Client / Party Name */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Client / Party Name
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Required</span>
                </label>
                <select
                  id="map-client-name-select"
                  value={mapping.customerNameCol}
                  onChange={(e) => setMapping({ ...mapping, customerNameCol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Choose Column --</option>
                  {rawData.headers.map((h, i) => (
                    <option key={i} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">e.g. Party Name, Customer, Particulars, Ledger</p>
              </div>

              {/* 2. Outstanding Balance / Amount */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    Outstanding Balance / Amount
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Required</span>
                </label>
                <select
                  id="map-amount-select"
                  value={mapping.amountCol}
                  onChange={(e) => setMapping({ ...mapping, amountCol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Choose Column --</option>
                  {rawData.headers.map((h, i) => (
                    <option key={i} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">e.g. Closing Balance, Debit, Pending Amount, Total</p>
              </div>

              {/* 3. Mobile / Phone Number */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Mobile / Phone Number
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Required</span>
                </label>
                <select
                  id="map-phone-select"
                  value={mapping.phoneCol}
                  onChange={(e) => setMapping({ ...mapping, phoneCol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Choose Column --</option>
                  {rawData.headers.map((h, i) => (
                    <option key={i} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">e.g. Mobile, Phone, WhatsApp, Contact No</p>
              </div>

              {/* 4. Invoice / Bill Number */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    Invoice / Bill Number
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">Optional</span>
                </label>
                <select
                  id="map-invoice-no-select"
                  value={mapping.invoiceNoCol || ''}
                  onChange={(e) => setMapping({ ...mapping, invoiceNoCol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Auto-generate (OS-INV-001) --</option>
                  {rawData.headers.map((h, i) => (
                    <option key={i} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">e.g. Invoice No, Bill No, Vch No, Ref No</p>
              </div>

              {/* 5. Due Date / Bill Date */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Due Date / Bill Date
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">Optional (Default Net-15)</span>
                </label>
                <select
                  id="map-due-date-select"
                  value={mapping.dueDateCol || ''}
                  onChange={(e) => setMapping({ ...mapping, dueDateCol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Default to 15 Days from Today --</option>
                  {rawData.headers.map((h, i) => (
                    <option key={i} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Mapping Preview (Sample 3 Records)
              </span>
              <span className="text-[11px] text-slate-500">Updates in real time as you adjust columns</span>
            </div>

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Inv #</th>
                      <th className="px-3 py-2.5 font-medium">Client / Party</th>
                      <th className="px-3 py-2.5 font-medium">Mobile (WhatsApp)</th>
                      <th className="px-3 py-2.5 font-medium text-right">Balance</th>
                      <th className="px-3 py-2.5 font-medium">Due Date</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {previewRows.map((sample, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-3 py-2 font-mono text-slate-300">{sample.invoiceNo}</td>
                        <td className="px-3 py-2 font-semibold text-white">{sample.customerName}</td>
                        <td className="px-3 py-2 font-mono text-emerald-400">{sample.phone}</td>
                        <td className="px-3 py-2 text-right font-bold text-white">
                          ₹{sample.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{sample.dueDate}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sample.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {sample.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Select Client Name and Balance column dropdowns above to generate sample preview.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Non-positive/zero balances will be skipped automatically</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-mapping-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-mapping-btn"
              type="button"
              onClick={handleConfirm}
              disabled={!isFormValid || isProcessing}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                isFormValid && !isProcessing
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Rows...</span>
                </>
              ) : (
                <>
                  <span>Confirm Mapping & Ingest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
