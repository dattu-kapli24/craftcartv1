import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  IndianRupee, 
  QrCode, 
  Settings, 
  Upload, 
  Search, 
  Filter, 
  ArrowLeft, 
  Check, 
  X, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Edit2,
  Phone,
  User,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { Vendor, Invoice, ReminderLog, InvoiceStatus } from '../types/collect';
import { sanitizePhone, generateUpiUrl, generatePaymentWebUrl, generateQrCodeDataUrl, parseTallyExcel } from '../utils/collectUtils';
import { sendWhatsAppReminder, formatReminderMessage } from '../services/whatsappService';
import { downloadSampleTallyExcel } from '../utils/sampleExcelGenerator';
import { 
  saveInvoice, 
  updateInvoiceInFirestore, 
  deleteInvoiceFromFirestore, 
  saveVendorProfile,
  getVendorProfile,
  getVendorInvoices 
} from '../../lib/firebase';

interface OrderSpotCollectDashboardProps {
  onBackToStore: () => void;
}

export function OrderSpotCollectDashboard({ onBackToStore }: OrderSpotCollectDashboardProps) {
  // Vendor State with persistence to localStorage
  const [vendor, setVendor] = useState<Vendor>(() => {
    const saved = localStorage.getItem('orderspot_collect_vendor');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'vendor_orderspot_01',
      businessName: 'OrderSpot Wholesale Mart',
      upiId: 'orderspot@icici',
      payeeName: 'OrderSpot Wholesale & Distributors',
      phone: '+919876543210',
      paymentTerms: 'Net 15 Days',
      whatsappTemplateName: 'order_spot_invoice_reminder'
    };
  });

  // Invoices State (with persistence)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('orderspot_collect_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'inv_101',
        vendorId: 'vendor_orderspot_01',
        invoiceNo: 'OS-2026-891',
        customerName: 'Shree Balaji Traders (Mumbai)',
        phone: '+919822123456',
        amount: 48500,
        dueDate: '2026-08-10',
        status: 'OVERDUE',
        createdAt: '2026-08-01',
        reminderCount: 2,
        lastReminderSentAt: '2026-08-15 11:30 AM'
      },
      {
        id: 'inv_102',
        vendorId: 'vendor_orderspot_01',
        invoiceNo: 'OS-2026-895',
        customerName: 'Gupta & Sons General Store',
        phone: '+919898765432',
        amount: 24300,
        dueDate: '2026-08-18',
        status: 'OVERDUE',
        createdAt: '2026-08-03',
        reminderCount: 1,
        lastReminderSentAt: '2026-08-18 09:15 AM'
      },
      {
        id: 'inv_103',
        vendorId: 'vendor_orderspot_01',
        invoiceNo: 'OS-2026-902',
        customerName: 'Khandelwal Retail Hub',
        phone: '+919711223344',
        amount: 12800,
        dueDate: '2026-08-25',
        status: 'PENDING',
        createdAt: '2026-08-10',
        reminderCount: 0
      },
      {
        id: 'inv_104',
        vendorId: 'vendor_orderspot_01',
        invoiceNo: 'OS-2026-910',
        customerName: 'Patel & Co. Provisions',
        phone: '+919422556677',
        amount: 67200,
        dueDate: '2026-08-28',
        status: 'PENDING',
        createdAt: '2026-08-12',
        reminderCount: 0
      },
      {
        id: 'inv_105',
        vendorId: 'vendor_orderspot_01',
        invoiceNo: 'OS-2026-874',
        customerName: 'Mehta Supermarket & Cafe',
        phone: '+919811122233',
        amount: 15400,
        dueDate: '2026-08-05',
        status: 'PAID',
        createdAt: '2026-07-25',
        reminderCount: 1,
        lastReminderSentAt: '2026-08-06 02:00 PM'
      }
    ];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('orderspot_collect_vendor', JSON.stringify(vendor));
  }, [vendor]);

  useEffect(() => {
    localStorage.setItem('orderspot_collect_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Edit Customer / Invoice modal state
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editInvoiceNo, setEditInvoiceNo] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Reminder Logs State
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([
    {
      id: 'log_1',
      invoiceId: 'inv_101',
      invoiceNo: 'OS-2026-891',
      customerName: 'Shree Balaji Traders (Mumbai)',
      sentAt: '2026-08-15 11:30 AM',
      status: 'DELIVERED',
      whatsappMessageId: 'wamid.osc.172412384',
      triggerType: 'BATCH'
    },
    {
      id: 'log_2',
      invoiceId: 'inv_102',
      invoiceNo: 'OS-2026-895',
      customerName: 'Gupta & Sons General Store',
      sentAt: '2026-08-18 09:15 AM',
      status: 'DELIVERED',
      whatsappMessageId: 'wamid.osc.172445129',
      triggerType: 'MANUAL'
    }
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<'invoices' | 'logs' | 'analytics'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrInvoice, setActiveQrInvoice] = useState<Invoice | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Batch sender runner state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics calculations
  const totalOutstanding = invoices
    .filter(i => i.status !== 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const overdueInvoicesCount = invoices.filter(i => i.status === 'OVERDUE').length;
  
  const cashRecoveredThisMonth = invoices
    .filter(i => i.status === 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // File upload ref for Tally Excel
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      showToast(`Parsing Tally export file: ${file.name}...`);
      const parsedRows = await parseTallyExcel(file);
      
      if (parsedRows.length === 0) {
        showToast('No valid invoice rows found in spreadsheet.');
        return;
      }

      const newInvoices: Invoice[] = parsedRows.map((row, idx) => ({
        id: `inv_imported_${Date.now()}_${idx}`,
        vendorId: vendor.id,
        invoiceNo: row.invoiceNo || `OS-IMP-${idx + 1}`,
        customerName: row.customerName || 'Valued Client',
        phone: row.phone || '+919876543210',
        amount: row.amount || 10000,
        dueDate: row.dueDate || new Date().toISOString().split('T')[0],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        reminderCount: 0
      }));

      setInvoices(prev => [...newInvoices, ...prev]);
      for (const inv of newInvoices) {
        saveInvoice(inv);
      }
      showToast(`Successfully imported & saved ${newInvoices.length} invoices!`);
    } catch (err) {
      console.error(err);
      showToast('Error parsing Excel file. Ensure standard Tally columns exist.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Edit invoice handler
  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditCustomerName(inv.customerName);
    setEditPhone(inv.phone);
    setEditAmount(inv.amount.toString());
    setEditDueDate(inv.dueDate);
    setEditInvoiceNo(inv.invoiceNo);
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const formattedPhone = sanitizePhone(editPhone) || editPhone.trim();
    const parsedAmount = parseFloat(editAmount) || editingInvoice.amount;

    const updatedInv: Invoice = {
      ...editingInvoice,
      invoiceNo: editInvoiceNo.trim() || editingInvoice.invoiceNo,
      customerName: editCustomerName.trim() || editingInvoice.customerName,
      phone: formattedPhone,
      amount: parsedAmount,
      dueDate: editDueDate || editingInvoice.dueDate
    };

    // 1. Optimistic state & localStorage update
    setInvoices(prev => {
      const next = prev.map(inv => inv.id === editingInvoice.id ? updatedInv : inv);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('orderspot_collect_invoices', JSON.stringify(next));
          localStorage.setItem(`orderspot_invoices_${vendor.id}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    setEditingInvoice(null);
    showToast(`✓ Updated ${updatedInv.customerName} (${formattedPhone})`);

    // 2. Background Firestore update
    try {
      await updateInvoiceInFirestore(editingInvoice.id, updatedInv, vendor.id);
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  };

  const handleCreateNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = sanitizePhone(editPhone);
    const parsedAmount = parseFloat(editAmount) || 0;

    const newInv: Invoice = {
      id: `inv_custom_${Date.now()}`,
      vendorId: vendor.id,
      invoiceNo: editInvoiceNo.trim() || `OS-${Date.now().toString().slice(-4)}`,
      customerName: editCustomerName.trim() || 'New Wholesale Client',
      phone: formattedPhone || '+919876543210',
      amount: parsedAmount > 0 ? parsedAmount : 5000,
      dueDate: editDueDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reminderCount: 0
    };

    setInvoices(prev => [newInv, ...prev]);
    await saveInvoice(newInv);
    showToast(`New invoice created for ${newInv.customerName}!`);
    setIsAddModalOpen(false);
  };

  // 1-Click WhatsApp Reminder
  const handleSendReminder = async (invoice: Invoice, triggerType: 'MANUAL' | 'BATCH' = 'MANUAL') => {
    const res = await sendWhatsAppReminder(invoice, vendor, triggerType);
    
    // Update invoice state
    const nowStr = new Date().toLocaleString();
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          reminderCount: inv.reminderCount + 1,
          lastReminderSentAt: nowStr
        };
      }
      return inv;
    }));

    // Add reminder log
    const newLog: ReminderLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      sentAt: nowStr,
      status: 'DELIVERED',
      whatsappMessageId: res.messageId,
      triggerType
    };
    setReminderLogs(prev => [newLog, ...prev]);

    // Open WhatsApp Web automatically
    window.open(res.whatsappUrl, '_blank');
    if (triggerType === 'MANUAL') {
      showToast(`WhatsApp reminder dispatched for Invoice #${invoice.invoiceNo}!`);
    }
  };

  // Multi-select batch runner
  const handleBatchSend = async () => {
    const pendingToRemind = invoices.filter(inv => selectedInvoiceIds.includes(inv.id) && inv.status !== 'PAID');
    if (pendingToRemind.length === 0) {
      showToast('Please select at least one pending invoice to remind.');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: pendingToRemind.length, currentName: '' });

    for (let i = 0; i < pendingToRemind.length; i++) {
      const inv = pendingToRemind[i];
      setBatchProgress({ current: i + 1, total: pendingToRemind.length, currentName: inv.customerName });
      
      await handleSendReminder(inv, 'BATCH');
      
      // Rate limiting pause (500ms) to prevent API throttling
      if (i < pendingToRemind.length - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    setIsBatchRunning(false);
    setSelectedInvoiceIds([]);
    showToast(`Successfully dispatched batch of ${pendingToRemind.length} WhatsApp reminders!`);
  };

  // Open QR Code Modal
  const openQrModal = async (invoice: Invoice) => {
    setActiveQrInvoice(invoice);
    const upiUrl = generateUpiUrl(vendor.upiId, vendor.payeeName, invoice.amount, invoice.invoiceNo);
    const qrData = await generateQrCodeDataUrl(upiUrl);
    setQrCodeDataUrl(qrData);
    setIsQrModalOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    }
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const markAsPaid = async (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'PAID' as InvoiceStatus } : inv));
    await updateInvoiceInFirestore(id, { status: 'PAID' }, vendor.id);
    showToast('Invoice marked as PAID successfully!');
  };

  const deleteInvoice = async (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    await deleteInvoiceFromFirestore(id, vendor.id);
    showToast('Invoice removed.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToStore}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-semibold transition-all border border-amber-800/60 shadow-sm cursor-pointer"
            title="Return to Shreeji Ply & Laminates Wholesale Store"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>← Plywood Storefront</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">OrderSpot Collect</h1>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  B2B WhatsApp Reminders
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {vendor.businessName} • UPI:{' '}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Click to edit Store UPI ID"
                  className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-mono underline decoration-emerald-500/50 underline-offset-2 transition-colors cursor-pointer"
                >
                  <span>{vendor.upiId}</span>
                  <Edit2 className="w-3 h-3 text-emerald-400" />
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditInvoiceNo(`OS-${Date.now().toString().slice(-4)}`);
              setEditCustomerName('');
              setEditPhone('');
              setEditAmount('');
              setEditDueDate(new Date().toISOString().split('T')[0]);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition-all border border-slate-700 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Bill</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button 
            onClick={downloadSampleTallyExcel}
            title="Download formatted sample Excel with all fields (Invoice #, Party Name, Mobile, Amount, Due Date)"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 rounded-xl font-medium text-sm transition-all border border-emerald-900/50 hover:border-emerald-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Sample Excel</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Tally / Excel</span>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors border border-slate-700 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>UPI & Settings</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding</p>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Pending across {invoices.filter(i => i.status !== 'PAID').length} invoices
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overdue Invoices</p>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {overdueInvoicesCount} <span className="text-lg font-normal text-slate-400">bills</span>
            </div>
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1 font-medium">
              <span>Requires immediate WhatsApp follow-up</span>
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recovered This Month</p>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ₹{cashRecoveredThisMonth.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cleared via UPI deep links
            </p>
          </div>
        </div>

        {/* Tab Navigation & Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'invoices' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Pending & Due Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              WhatsApp Reminder Logs ({reminderLogs.length})
            </button>
          </div>

          {activeTab === 'invoices' && selectedInvoiceIds.length > 0 && (
            <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-800/80 px-4 py-2 rounded-xl">
              <span className="text-xs text-emerald-300 font-medium">
                {selectedInvoiceIds.length} invoices selected
              </span>
              <button
                onClick={handleBatchSend}
                disabled={isBatchRunning}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBatchRunning ? 'Sending Batch...' : 'Send WhatsApp Reminders (Batch)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Batch Running Progress Banner */}
        {isBatchRunning && (
          <div className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">Dispatching Bulk WhatsApp Reminders...</p>
                <p className="text-xs text-slate-400">Processing {batchProgress.current} of {batchProgress.total}: <span className="text-emerald-300 font-medium">{batchProgress.currentName}</span></p>
              </div>
            </div>
            <div className="w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300" 
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Invoices Table View */}
        {activeTab === 'invoices' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Table Search & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by invoice #, customer name, or phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            {/* Dual View: Mobile Cards (md:hidden) and Desktop Table (hidden md:block) */}
            
            {/* Empty State */}
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No invoices match your search or filter. Import a Tally Excel file to get started.
              </div>
            ) : (
              <>
                {/* A. Mobile Cards View */}
                <div className="md:hidden p-3 space-y-3">
                  {filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoiceIds.includes(inv.id);
                    const isPaid = inv.status === 'PAID';
                    const isOverdue = inv.status === 'OVERDUE';

                    return (
                      <div
                        key={inv.id}
                        className={`bg-slate-950 border rounded-2xl p-4 shadow-lg transition-all space-y-3 ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-950/20'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Row: Select, Invoice #, Date, Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectInvoice(inv.id)}
                              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="font-mono font-bold text-white text-sm whitespace-nowrap">
                              {inv.invoiceNo}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {inv.createdAt.split('T')[0]}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : isOverdue
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPaid ? 'bg-emerald-400' : isOverdue ? 'bg-rose-400' : 'bg-amber-400'
                                }`}
                              />
                              {inv.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Customer Info & Due Amount */}
                        <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-800/60">
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-slate-200 text-sm leading-snug break-words">
                              {inv.customerName}
                            </h4>
                            <button
                              onClick={() => openEditModal(inv)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 cursor-pointer"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{inv.phone}</span>
                            </button>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>Due: <strong className={isOverdue ? 'text-rose-400' : 'text-slate-300'}>{inv.dueDate}</strong></span>
                              <span>•</span>
                              <span>{inv.reminderCount > 0 ? `${inv.reminderCount} sent` : 'No reminders'}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[11px] text-slate-400 uppercase font-semibold">Amount Due</div>
                            <div className="text-lg font-black text-white font-mono leading-tight">
                              ₹{inv.amount.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                          <button
                            onClick={() => handleSendReminder(inv, 'MANUAL')}
                            className="flex-1 h-10 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Remind WhatsApp</span>
                          </button>

                          <button
                            onClick={() => openQrModal(inv)}
                            title="UPI QR"
                            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                          >
                            <QrCode className="w-4 h-4 text-emerald-400" />
                          </button>

                          <button
                            onClick={() => openEditModal(inv)}
                            title="Edit Bill Details"
                            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => markAsPaid(inv.id)}
                              title="Mark Paid"
                              className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 active:scale-95 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            title="Delete Invoice"
                            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 active:scale-95 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* B. Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/50">
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-4 font-semibold whitespace-nowrap">Invoice Details</th>
                        <th className="p-4 font-semibold">Customer & Contact</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Amount (₹)</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Due Date</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                        <th className="p-4 font-semibold whitespace-nowrap">WhatsApp Activity</th>
                        <th className="p-4 text-right font-semibold whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredInvoices.map((inv) => {
                        const isSelected = selectedInvoiceIds.includes(inv.id);
                        return (
                          <tr key={inv.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-emerald-950/20' : ''}`}>
                            <td className="p-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelectInvoice(inv.id)}
                                className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="font-bold text-white font-mono">{inv.invoiceNo}</span>
                              <div className="text-xs text-slate-400">Created: {inv.createdAt.split('T')[0]}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 group">
                                <span className="font-semibold text-slate-200">{inv.customerName}</span>
                                <button
                                  onClick={() => openEditModal(inv)}
                                  title="Edit Customer Details & Phone"
                                  className="opacity-60 hover:opacity-100 p-0.5 text-slate-400 hover:text-emerald-400 rounded transition-opacity cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => openEditModal(inv)}
                                title="Click to change WhatsApp Phone Number"
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{inv.phone}</span>
                              </button>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="font-extrabold text-white text-base">₹{inv.amount.toLocaleString('en-IN')}</span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                                inv.status === 'OVERDUE' 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : 'text-slate-300 bg-slate-800'
                              }`}>
                                {inv.dueDate}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                inv.status === 'PAID' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  inv.status === 'PAID' ? 'bg-emerald-400' : inv.status === 'OVERDUE' ? 'bg-rose-400' : 'bg-amber-400'
                                }`}></span>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="text-xs text-slate-300 font-medium">
                                {inv.reminderCount > 0 ? `${inv.reminderCount} sent` : 'No reminders'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {inv.lastReminderSentAt || 'Never'}
                              </div>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(inv)}
                                  title="Edit Customer, Phone & Invoice Amount"
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                                </button>

                                <button
                                  onClick={() => openQrModal(inv)}
                                  title="View UPI Payment QR Code"
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                                >
                                  <QrCode className="w-4 h-4 text-emerald-400" />
                                </button>

                                <button
                                  onClick={() => handleSendReminder(inv, 'MANUAL')}
                                  title="Send WhatsApp Payment Reminder"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Remind</span>
                                </button>

                                {inv.status !== 'PAID' && (
                                  <button
                                    onClick={() => markAsPaid(inv.id)}
                                    title="Mark as Paid"
                                    className="p-2 bg-slate-800 hover:bg-emerald-900/40 text-emerald-400 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => deleteInvoice(inv.id)}
                                  title="Delete Invoice"
                                  className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* WhatsApp Logs Tab View */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-white mb-4">WhatsApp Cloud API Delivery & Reminder History</h3>
            <div className="space-y-3">
              {reminderLogs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No reminder logs recorded yet.</p>
              ) : (
                reminderLogs.map(log => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Invoice #{log.invoiceNo}</span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{log.triggerType}</span>
                        </div>
                        <p className="text-xs text-slate-400">Sent to: <span className="text-slate-200 font-medium">{log.customerName}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> {log.status}
                        </span>
                        <div className="text-xs text-slate-500 font-mono mt-1">{log.whatsappMessageId}</div>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">{log.sentAt}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* UPI QR Code Modal */}
      {isQrModalOpen && activeQrInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Instant UPI Payment QR</h3>
              <p className="text-xs text-slate-400 mb-6">Scan with GPay, PhonePe, Paytm, or BHIM</p>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-6 border-4 border-emerald-500/20">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="UPI QR Code" className="w-56 h-56 mx-auto rounded-lg" />
                ) : (
                  <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400">Generating QR...</div>
                )}
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-left space-y-2 mb-6 border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Payee VPA:</span>
                  <span className="text-emerald-400 font-mono font-bold">{vendor.upiId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Business:</span>
                  <span className="text-white font-medium">{vendor.payeeName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Invoice Ref:</span>
                  <span className="text-white font-mono">{activeQrInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-800 font-bold">
                  <span className="text-slate-300">Amount Due:</span>
                  <span className="text-emerald-400 font-mono">₹{activeQrInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const payWebUrl = generatePaymentWebUrl(
                      vendor.upiId,
                      vendor.payeeName,
                      activeQrInvoice.amount,
                      activeQrInvoice.invoiceNo,
                      activeQrInvoice.customerName,
                      vendor.businessName,
                      activeQrInvoice.dueDate
                    );
                    navigator.clipboard.writeText(payWebUrl);
                    showToast('Web Payment Hyperlink copied to clipboard!');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy WhatsApp Payment Hyperlink
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const payWebUrl = generatePaymentWebUrl(
                        vendor.upiId,
                        vendor.payeeName,
                        activeQrInvoice.amount,
                        activeQrInvoice.invoiceNo,
                        activeQrInvoice.customerName,
                        vendor.businessName,
                        activeQrInvoice.dueDate
                      );
                      window.open(payWebUrl, '_blank');
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Checkout
                  </button>

                  <button
                    onClick={() => {
                      const upiUrl = generateUpiUrl(vendor.upiId, vendor.payeeName, activeQrInvoice.amount, activeQrInvoice.invoiceNo);
                      navigator.clipboard.writeText(upiUrl);
                      showToast('Raw UPI intent copied to clipboard!');
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                  >
                    Copy UPI URI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer / Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-800/80 relative">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
              <button 
                onClick={() => setEditingInvoice(null)}
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Edit Customer & Bill</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update phone number for WhatsApp reminders</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form id="edit-invoice-form" onSubmit={handleSaveInvoiceEdit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice #</label>
                <input 
                  type="text" 
                  required
                  value={editInvoiceNo}
                  onChange={e => setEditInvoiceNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer / Company Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={editCustomerName}
                    onChange={e => setEditCustomerName(e.target.value)}
                    placeholder="e.g. Shree Balaji Traders"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer WhatsApp Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-emerald-400" />
                  <input 
                    type="text" 
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+919822123456 or 9822123456"
                    className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Country code +91 will be auto-formatted if omitted.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount Due (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-2.5 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-invoice-form"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 min-w-[130px]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-800/80 relative">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Add New Due Bill</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Create an invoice with customer contact details</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form id="add-invoice-form" onSubmit={handleCreateNewInvoice} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice #</label>
                <input 
                  type="text" 
                  required
                  value={editInvoiceNo}
                  onChange={e => setEditInvoiceNo(e.target.value)}
                  placeholder="OS-2026-999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={editCustomerName}
                    onChange={e => setEditCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Supermarket"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer WhatsApp Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-emerald-400" />
                  <input 
                    type="text" 
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-2.5 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-invoice-form"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 min-w-[130px]"
              >
                Create & Save Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-800/80 relative">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Vendor & WhatsApp Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure your business UPI VPA and Meta credentials</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Name</label>
                <input 
                  type="text" 
                  value={vendor.businessName}
                  onChange={e => setVendor({...vendor, businessName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">UPI ID / VPA</label>
                  <input 
                    type="text" 
                    value={vendor.upiId}
                    onChange={e => setVendor({...vendor, upiId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payee Name on UPI</label>
                  <input 
                    type="text" 
                    value={vendor.payeeName}
                    onChange={e => setVendor({...vendor, payeeName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Cloud API Template Name</label>
                <input 
                  type="text" 
                  value={vendor.whatsappTemplateName || ''}
                  onChange={e => setVendor({...vendor, whatsappTemplateName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="order_spot_invoice_reminder"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-2.5 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveVendorProfile(vendor.id, vendor);
                  setIsSettingsOpen(false);
                  showToast('Vendor settings updated and saved!');
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 min-w-[130px]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
