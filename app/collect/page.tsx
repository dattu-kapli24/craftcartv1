import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Send,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  TrendingUp,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Edit2,
  Phone,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  ArrowUpDown,
  Download,
  AlertCircle,
  CheckSquare,
  Square,
  X,
  Share2,
  Store,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  Sparkles,
  Database,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { Vendor, Invoice, InvoiceStatus, ReminderLog } from '../../src/types/collect';
import {
  subscribeToAuth,
  loginWithEmail,
  resetPassword,
  logoutUser,
  getVendorProfile,
  saveVendorProfile,
  getVendorInvoices,
  saveInvoice,
  updateInvoiceInFirestore,
  deleteInvoiceFromFirestore,
  logReminderToFirestore,
  auth
} from '../../lib/firebase';
import { parseTallyExcelFile, batchWriteInvoicesToFirestore, sanitizeIndianPhone } from '../../utils/excelParser';
import { VendorSettingsModal } from '../../components/VendorSettingsModal';
import { EditInvoiceModal } from '../../components/EditInvoiceModal';

export default function OrderSpotCollectPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Vendor Admin Login & Password Reset State
  const [authView, setAuthView] = useState<'LOGIN' | 'FORGOT_PASSWORD'>('LOGIN');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Vendor Profile State
  const [vendor, setVendor] = useState<Vendor>({
    id: 'vendor_demo',
    businessName: 'OrderSpot Wholesale Mart',
    upiId: 'orderspot@icici',
    payeeName: 'OrderSpot Wholesale & Distributors',
    phone: '+919876543210',
    paymentTerms: '15'
  });

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'customerName'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<Invoice | null>(null);
  const [qrModalInvoice, setQrModalInvoice] = useState<Invoice | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);

  // Form State for Manual Bill Addition
  const [manualInvoiceNo, setManualInvoiceNo] = useState('');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');

  // Processing & Toast Notifications
  const [isBatchReminding, setIsBatchReminding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Vendor Profile and Invoices on Auth
  useEffect(() => {
    async function loadData() {
      const currentUid = user?.uid || (isDemoMode ? 'demo_vendor_uid' : null);
      if (!currentUid) return;

      setDataLoading(true);
      try {
        const [profile, loadedInvoices] = await Promise.all([
          getVendorProfile(currentUid),
          getVendorInvoices(currentUid)
        ]);

        if (profile) {
          setVendor(profile);
        }

        if (loadedInvoices.length > 0) {
          setInvoices(loadedInvoices);
        } else if (isDemoMode || !user) {
          // Seed initial demo data for smooth experience if in demo mode
          const seedData: Invoice[] = [
            {
              id: 'inv_101',
              vendorId: currentUid,
              invoiceNo: 'OS-2026-891',
              customerName: 'Shree Balaji Traders (Mumbai)',
              phone: '+919822123456',
              amount: 48500,
              originalAmount: 48500,
              dueDate: '2026-08-10',
              status: 'OVERDUE',
              createdAt: '2026-08-01',
              reminderCount: 2,
              lastReminderSentAt: '2026-08-15 11:30 AM'
            },
            {
              id: 'inv_102',
              vendorId: currentUid,
              invoiceNo: 'OS-2026-895',
              customerName: 'Gupta & Sons General Store',
              phone: '+919898765432',
              amount: 24300,
              originalAmount: 24300,
              dueDate: '2026-08-18',
              status: 'OVERDUE',
              createdAt: '2026-08-03',
              reminderCount: 1,
              lastReminderSentAt: '2026-08-18 09:15 AM'
            },
            {
              id: 'inv_103',
              vendorId: currentUid,
              invoiceNo: 'OS-2026-902',
              customerName: 'Khandelwal Retail Hub',
              phone: '+919711223344',
              amount: 12800,
              originalAmount: 12800,
              dueDate: '2026-08-25',
              status: 'PENDING',
              createdAt: '2026-08-10',
              reminderCount: 0
            },
            {
              id: 'inv_104',
              vendorId: currentUid,
              invoiceNo: 'OS-2026-910',
              customerName: 'Patel & Co. Provisions',
              phone: '+919422556677',
              amount: 67200,
              originalAmount: 67200,
              dueDate: '2026-08-28',
              status: 'PENDING',
              createdAt: '2026-08-12',
              reminderCount: 0
            },
            {
              id: 'inv_105',
              vendorId: currentUid,
              invoiceNo: 'OS-2026-874',
              customerName: 'Mehta Supermarket & Cafe',
              phone: '+919811122233',
              amount: 15400,
              originalAmount: 15400,
              dueDate: '2026-08-05',
              status: 'PAID',
              createdAt: '2026-07-25',
              reminderCount: 1,
              lastReminderSentAt: '2026-08-06 02:00 PM'
            }
          ];
          setInvoices(seedData);
        } else {
          // If a new vendor logged in and has 0 invoices in Firestore yet, initialize starter set or keep empty
          setInvoices([]);
        }
      } catch (err) {
        console.error('Error loading collect data:', err);
      } finally {
        setDataLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading, isDemoMode]);

  // Handle Login Form Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmittingAuth(true);

    try {
      const res = await loginWithEmail(loginEmail.trim(), loginPassword);
      if (res.success) {
        showToast('Signed in successfully! Syncing your invoices...');
      } else {
        setAuthError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed. Please check your network connection.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Forgot Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmittingAuth(true);

    try {
      const res = await resetPassword(loginEmail.trim());
      if (res.success) {
        setAuthSuccess(`Password reset link sent to ${loginEmail.trim()}! Check your inbox and spam folder.`);
      } else {
        setAuthError(res.error || 'Failed to send password reset email. Please verify the email address.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An error occurred while requesting password reset.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Manual Cloud Sync Trigger
  const handleManualCloudSync = async () => {
    const currentUid = user?.uid || (isDemoMode ? 'demo_vendor_uid' : null);
    if (!currentUid) {
      showToast('Please sign in with your email & password to sync to Firebase');
      return;
    }

    setIsSyncingCloud(true);
    try {
      showToast('Syncing with Firebase Firestore...');
      // 1. Push current vendor profile directly to Firestore
      await saveVendorProfile(currentUid, vendor);
      
      // 2. Push all current invoices in state to Firestore
      if (invoices.length > 0) {
        await batchWriteInvoicesToFirestore(invoices, currentUid);
      }

      // 3. Re-fetch from Firestore to verify documents are live
      const [profile, loadedInvoices] = await Promise.all([
        getVendorProfile(currentUid),
        getVendorInvoices(currentUid)
      ]);
      if (profile) setVendor(profile);
      if (loadedInvoices.length > 0) {
        setInvoices(loadedInvoices);
      }

      showToast(`✓ Cloud Synced: Vendor profile & ${invoices.length} invoices saved to Firebase Firestore!`);
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      showToast(`Sync alert: ${err.message || 'Saved to offline cache'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsDemoMode(false);
      showToast('Signed out of OrderSpot Collect.');
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // Dynamic KPI Metric Calculations
  const metrics = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdue = invoices.filter((inv) => inv.status === 'OVERDUE');
    const overdueCount = overdue.length;
    const overdueAmount = overdue.reduce((sum, inv) => sum + inv.amount, 0);

    const recovered = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount), 0);

    const totalRemindersSent = invoices.reduce((sum, inv) => sum + (inv.reminderCount || 0), 0);

    return {
      outstanding,
      overdueCount,
      overdueAmount,
      recovered,
      totalRemindersSent
    };
  }, [invoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'customerName') {
        comparison = a.customerName.localeCompare(b.customerName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, searchTerm, statusFilter, sortBy, sortOrder]);

  // Excel / CSV Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetVendorId = user?.uid || (isDemoMode ? 'demo_vendor_uid' : vendor.id);

    try {
      showToast('Parsing spreadsheet...');
      const parsed = await parseTallyExcelFile(file, targetVendorId);

      if (parsed.length === 0) {
        showToast('No valid receivables found in the sheet.');
        return;
      }

      showToast(`Uploading ${parsed.length} invoices to Firestore...`);
      await batchWriteInvoicesToFirestore(parsed, targetVendorId);

      // Merge newly uploaded invoices with state
      setInvoices((prev) => {
        const parsedIds = new Set(parsed.map((p) => p.id));
        const remaining = prev.filter((p) => !parsedIds.has(p.id));
        return [...parsed, ...remaining];
      });
      showToast(`✓ Successfully imported & saved ${parsed.length} invoices to Firestore!`);
    } catch (err: any) {
      console.error('File upload / Firestore error:', err);
      showToast(`Upload failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Construct NPCI UPI Deep Link
  const buildUpiUrl = (inv: Invoice): string => {
    const pa = encodeURIComponent(vendor.upiId.trim());
    const pn = encodeURIComponent(vendor.payeeName || vendor.businessName);
    const am = inv.amount.toFixed(2);
    const tr = encodeURIComponent(inv.invoiceNo);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tr=${tr}&cu=INR`;
  };

  // 1-Click WhatsApp Reminder Dispatch
  const handleSendWhatsAppReminder = async (invoice: Invoice) => {
    const upiLink = buildUpiUrl(invoice);

    let messageBody = vendor.whatsappTemplate || '';
    if (!messageBody.trim()) {
      messageBody = `Dear {{customer_name}},\n\nPayment reminder from {{business_name}} for Invoice #{{invoice_no}} of ₹{{amount}} (Due: {{due_date}}).\n\nPay instantly via UPI:\n{{upi_link}}\n\nThank you!`;
    }

    messageBody = messageBody
      .replace(/\{\{customer_name\}\}/g, invoice.customerName)
      .replace(/\{\{business_name\}\}/g, vendor.businessName)
      .replace(/\{\{invoice_no\}\}/g, invoice.invoiceNo)
      .replace(/\{\{amount\}\}/g, invoice.amount.toLocaleString('en-IN'))
      .replace(/\{\{due_date\}\}/g, invoice.dueDate)
      .replace(/\{\{upi_link\}\}/g, upiLink);

    const cleanPhone = sanitizeIndianPhone(invoice.phone).replace(/\+/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageBody)}`;

    // Open WhatsApp Web / App
    window.open(whatsappUrl, '_blank');

    // Update state and Firestore
    const updatedCount = (invoice.reminderCount || 0) + 1;
    const lastSent = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updatedInv: Invoice = {
      ...invoice,
      reminderCount: updatedCount,
      lastReminderSentAt: lastSent
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? updatedInv : inv)));

    try {
      await updateInvoiceInFirestore(invoice.id, {
        reminderCount: updatedCount,
        lastReminderSentAt: lastSent
      });

      const log: ReminderLog = {
        id: `log_${Date.now()}`,
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        customerName: invoice.customerName,
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        whatsappMessageId: `wamid_${Date.now()}`,
        triggerType: 'MANUAL'
      };

      await logReminderToFirestore(log, user?.uid || vendor.id);
    } catch (e) {
      console.warn('Firestore update sync error:', e);
    }

    showToast(`WhatsApp reminder dispatched for ${invoice.invoiceNo}!`);
  };

  // Batch Remind All Overdue Invoices or Selected Invoices
  const handleBatchRemind = async (targetInvoices: Invoice[]) => {
    if (targetInvoices.length === 0) {
      showToast('No invoices to remind.');
      return;
    }

    setIsBatchReminding(true);
    let count = 0;

    for (const inv of targetInvoices) {
      await handleSendWhatsAppReminder(inv);
      count++;
      // Brief interval between dispatches
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsBatchReminding(false);
    setSelectedInvoiceIds([]);
    showToast(`Batch completed: ${count} WhatsApp reminders sent!`);
  };

  // Toggle Single Invoice Selection
  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select/Deselect All Filtered Invoices
  const toggleSelectAll = () => {
    const unpaidFiltered = filteredInvoices.filter((i) => i.status !== 'PAID').map((i) => i.id);
    if (selectedInvoiceIds.length === unpaidFiltered.length && unpaidFiltered.length > 0) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(unpaidFiltered);
    }
  };

  // Mark as Paid Quick Action
  const handleMarkAsPaid = async (invoice: Invoice) => {
    const updated: Invoice = {
      ...invoice,
      status: 'PAID',
      paidAmount: invoice.amount
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? updated : inv)));
    setSelectedInvoiceIds((prev) => prev.filter((i) => i !== invoice.id));

    try {
      await updateInvoiceInFirestore(
        invoice.id,
        { status: 'PAID', paidAmount: invoice.amount },
        invoice.vendorId || user?.uid || vendor.id
      );
      showToast(`Invoice #${invoice.invoiceNo} marked as PAID!`);
    } catch (e) {
      console.warn('Mark as paid error:', e);
    }
  };

  // Delete Invoice Action
  const handleDeleteInvoice = async (invoiceId: string) => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    setSelectedInvoiceIds((prev) => prev.filter((i) => i !== invoiceId));
    try {
      await deleteInvoiceFromFirestore(
        invoiceId,
        target?.vendorId || user?.uid || vendor.id
      );
      showToast('Invoice deleted.');
    } catch (e) {
      console.warn('Delete error:', e);
    } finally {
      setDeleteConfirmInvoice(null);
    }
  };

  // Open QR Code Modal
  const handleOpenQrModal = async (invoice: Invoice) => {
    setQrModalInvoice(invoice);
    const upiUrl = buildUpiUrl(invoice);
    try {
      const qrData = await QRCode.toDataURL(upiUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      setQrCodeDataUrl(qrData);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  // Create Manual Bill
  const handleCreateManualBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = sanitizeIndianPhone(manualPhone);
    const amt = parseFloat(manualAmount) || 0;

    const newInv: Invoice = {
      id: `inv_manual_${Date.now()}`,
      vendorId: user?.uid || vendor.id,
      invoiceNo: manualInvoiceNo.trim() || `OS-${Date.now().toString().slice(-4)}`,
      customerName: manualCustomer.trim() || 'Walk-in Customer',
      phone: formattedPhone,
      amount: amt > 0 ? amt : 1000,
      originalAmount: amt > 0 ? amt : 1000,
      dueDate: manualDueDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reminderCount: 0
    };

    setInvoices((prev) => [newInv, ...prev]);
    await saveInvoice(newInv);
    showToast(`Bill #${newInv.invoiceNo} created!`);
    setIsAddInvoiceOpen(false);
  };

  const selectedInvoicesList = useMemo(() => {
    return invoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
  }, [invoices, selectedInvoiceIds]);

  // Loading Screen while Firebase Auth initial check occurs
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/10 animate-pulse">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">OrderSpot Collect</h2>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Initializing secure vendor session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VENDOR ADMIN LOGIN & FORGOT PASSWORD SCREEN (When Not Logged In)
  // -------------------------------------------------------------
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />

        {/* Top Minimal Header without storefront button */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-4 relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-md">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">OrderSpot Collect</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Vendor Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Payment Recovery & Automated Reminders</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Login / Reset Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-auto">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Form Header */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/30 mb-2">
                {authView === 'LOGIN' ? <LogIn className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {authView === 'LOGIN' ? 'Vendor Admin Sign In' : 'Reset Vendor Password'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
                {authView === 'LOGIN'
                  ? 'Sign in to access your collection dashboard, sync invoices, and automate WhatsApp reminders.'
                  : 'Enter your registered vendor email and we will send a password reset link directly to your inbox.'}
              </p>
            </div>

            {/* Error Message Notification */}
            {authError && (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            {/* Success Message Notification */}
            {authSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-snug">{authSuccess}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authView === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Vendor Email / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="vendor@orderspot.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('FORGOT_PASSWORD');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full min-h-[44px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Collect Portal</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Sandbox / Demo option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoMode(true);
                    showToast('Welcome to OrderSpot Collect Sandbox Mode!');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Continue in Offline / Sandbox Mode</span>
                </button>
              </form>
            ) : (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Your Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="vendor@orderspot.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full min-h-[44px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('LOGIN');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </form>
            )}

            {/* Footer Trust Indicator */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by Firebase Cloud Auth & Firestore Sync</span>
              </p>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED COLLECT DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white" id="orderspot-collect-app">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-emerald-600 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200 max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP NAVIGATION HEADER (Mobile Stack & Touch Friendly) */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3.5 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Brand & Store Details */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10 shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">OrderSpot Collect</h1>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    UPI Auto
                  </span>
                  {user ? (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Cloud Synced
                    </span>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Demo Mode
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer font-medium max-w-[140px] sm:max-w-[200px] truncate"
                  >
                    {vendor.businessName}
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-mono underline decoration-emerald-500/40 cursor-pointer text-[10px] sm:text-xs"
                  >
                    {vendor.upiId}
                  </button>
                  {user?.email && (
                    <>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className="text-slate-400 text-[10px] sm:text-xs hidden sm:inline font-mono truncate max-w-[150px]">
                        {user.email}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={handleManualCloudSync}
                disabled={isSyncingCloud}
                title="Sync with Firebase Cloud"
                className="p-2 rounded-xl bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-700 active:scale-95 transition-transform"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-transform"
              >
                <Settings className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <button
                onClick={handleSignOut}
                aria-label="Sign Out"
                title="Sign Out"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 active:scale-95 transition-all text-[11px] font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Full-width touch targets on small screens */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Manual Cloud Sync Button */}
            <button
              onClick={handleManualCloudSync}
              disabled={isSyncingCloud}
              title="Synchronize invoices and settings with Firebase Firestore"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl font-semibold text-xs sm:text-sm transition-all border border-slate-700 shadow-sm cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* Add Manual Bill */}
            <button
              onClick={() => {
                setManualInvoiceNo(`OS-${Date.now().toString().slice(-4)}`);
                setManualCustomer('');
                setManualPhone('');
                setManualAmount('');
                setManualDueDate(new Date().toISOString().split('T')[0]);
                setIsAddInvoiceOpen(true);
              }}
              className="flex-1 sm:flex-initial min-h-[42px] sm:min-h-[38px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl font-medium text-xs sm:text-sm transition-all border border-slate-700 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Bill</span>
            </button>

            {/* Import Tally Excel */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial min-h-[42px] sm:min-h-[38px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Tally</span>
            </button>

            {/* Desktop Settings & Logout */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition-colors border border-slate-700 cursor-pointer active:scale-95"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out of OrderSpot Collect"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer active:scale-95 text-xs sm:text-sm font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTENT */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 pb-24 sm:pb-8">
        
        {/* 1. METRIC CARDS: Mobile-first responsive stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Outstanding */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                ₹{metrics.outstanding.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Pending & overdue collections</p>
            </div>
          </div>

          {/* Card 2: Overdue Receivables */}
          <div className="bg-slate-900 border border-rose-900/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-400">Overdue Amount</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-400 tracking-tight truncate">
                ₹{metrics.overdueAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{metrics.overdueCount} bills past due date</p>
            </div>
          </div>

          {/* Card 3: Recovered Amount */}
          <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">Recovered Amount</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight truncate">
                ₹{metrics.recovered.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Directly credited to UPI</p>
            </div>
          </div>

          {/* Card 4: WhatsApp Reminders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp Sent</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {metrics.totalRemindersSent}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">1-click WhatsApp dispatches</p>
            </div>
          </div>
        </div>

        {/* 5. SEARCH, FILTER & RESPONSIVE CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-stretch sm:items-center justify-between">
          {/* Search Input: Full width on mobile */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-3 sm:top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Bill #, Customer, Phone..."
              className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl sm:rounded-2xl pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter & Sort Dropdowns */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl sm:rounded-2xl px-3.5 sm:px-4 pr-8 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All ({invoices.length})</option>
                <option value="OVERDUE">Overdue ({invoices.filter((i) => i.status === 'OVERDUE').length})</option>
                <option value="PENDING">Pending ({invoices.filter((i) => i.status === 'PENDING').length})</option>
                <option value="PAID">Paid ({invoices.filter((i) => i.status === 'PAID').length})</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 sm:top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl sm:rounded-2xl px-3.5 sm:px-4 pr-8 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="dueDate">Due Date</option>
                <option value="amount">Amount</option>
                <option value="customerName">Customer</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-3.5 sm:top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 2. INVOICE LIST: DUAL VIEW (NATIVE MOBILE CARDS + DESKTOP TABLE) */}
        <div className="space-y-3">
          {/* Mobile Select All Bar */}
          {filteredInvoices.length > 0 && (
            <div className="md:hidden flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {selectedInvoiceIds.length > 0 &&
                  selectedInvoiceIds.length === filteredInvoices.filter((i) => i.status !== 'PAID').length ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <span className="text-xs font-semibold text-slate-300">
                  {selectedInvoiceIds.length > 0
                    ? `${selectedInvoiceIds.length} Selected`
                    : 'Select All Unpaid'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Bill' : 'Bills'}
              </span>
            </div>
          )}

          {/* Empty State for Both Views */}
          {filteredInvoices.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xl">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h4 className="text-base font-bold text-white">No Invoices Found</h4>
                <p className="text-xs text-slate-400">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'No invoices match your active search filter criteria.'
                    : 'Import your Tally Excel spreadsheet or add manual bills to start automated WhatsApp collections.'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg"
                >
                  Import Tally File
                </button>
              </div>
            </div>
          )}

          {/* A. MOBILE CARDS VIEW (md:hidden) */}
          {filteredInvoices.length > 0 && (
            <div className="md:hidden space-y-3">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID';
                const isOverdue = inv.status === 'OVERDUE';
                const isSelected = selectedInvoiceIds.includes(inv.id);

                return (
                  <div
                    key={inv.id}
                    className={`bg-slate-900 border rounded-2xl p-4 shadow-lg transition-all space-y-3 ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Select, Invoice #, Date, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!isPaid && (
                          <button
                            onClick={() => toggleSelectInvoice(inv.id)}
                            className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        )}
                        <span className="font-mono font-bold text-white text-sm whitespace-nowrap">
                          {inv.invoiceNo}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {inv.createdAt?.split('T')[0] || 'Recent'}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" />
                            <span>OVERDUE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Customer Info & Due Amount */}
                    <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-800/60">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-slate-200 text-sm leading-snug break-words">
                          {inv.customerName}
                        </h4>
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 cursor-pointer"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{inv.phone}</span>
                        </button>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Due: <strong className={isOverdue ? 'text-rose-400' : 'text-slate-300'}>{inv.dueDate}</strong></span>
                          <span>•</span>
                          <span>{inv.reminderCount || 0} Sent</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Amount Due</div>
                        <div className="text-lg font-black text-white font-mono leading-tight">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </div>
                        {inv.paidAmount && inv.paidAmount > 0 ? (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            (Paid: ₹{inv.paidAmount.toLocaleString('en-IN')})
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Action Bar (Large touch targets for mobile) */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                      {!isPaid && (
                        <button
                          onClick={() => handleSendWhatsAppReminder(inv)}
                          className="flex-1 h-10 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Remind WhatsApp</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenQrModal(inv)}
                        title="UPI QR"
                        className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                      >
                        <QrCode className="w-4 h-4 text-slate-300" />
                      </button>

                      <button
                        onClick={() => setEditingInvoice(inv)}
                        title="Edit / Record Payment"
                        className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                      </button>

                      {!isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(inv)}
                          title="Mark Paid"
                          className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-400 active:scale-95 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmInvoice(inv)}
                        title="Delete Bill"
                        className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 active:scale-95 flex items-center justify-center border border-slate-700 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* B. DESKTOP TABLE VIEW (hidden md:block) */}
          {filteredInvoices.length > 0 && (
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <div className="w-full overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6 w-12 text-center">
                        <button
                          onClick={toggleSelectAll}
                          className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Select all unpaid"
                        >
                          {selectedInvoiceIds.length > 0 &&
                          selectedInvoiceIds.length === filteredInvoices.filter((i) => i.status !== 'PAID').length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </th>
                      <th className="p-4 whitespace-nowrap">Invoice #</th>
                      <th className="p-4">Customer & Contact</th>
                      <th className="p-4 whitespace-nowrap">Amount Due (₹)</th>
                      <th className="p-4 whitespace-nowrap">Due Date</th>
                      <th className="p-4 whitespace-nowrap">Status</th>
                      <th className="p-4 whitespace-nowrap">Reminders</th>
                      <th className="p-4 pr-6 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.status === 'PAID';
                      const isOverdue = inv.status === 'OVERDUE';
                      const isSelected = selectedInvoiceIds.includes(inv.id);

                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-800/40 transition-colors group ${
                            isSelected ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-4 pl-6 text-center">
                            {!isPaid ? (
                              <button
                                onClick={() => toggleSelectInvoice(inv.id)}
                                className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-4 h-4" />
                            )}
                          </td>

                          {/* Invoice # */}
                          <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                            <span className="text-sm">{inv.invoiceNo}</span>
                            <div className="text-[11px] text-slate-400 font-normal font-sans">
                              {inv.createdAt?.split('T')[0] || 'Recently'}
                            </div>
                          </td>

                          {/* Customer & WhatsApp Phone */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200 text-sm">{inv.customerName}</span>
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                title="Edit Customer"
                                className="opacity-60 hover:opacity-100 text-slate-400 hover:text-emerald-400 p-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => setEditingInvoice(inv)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 hover:underline cursor-pointer mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{inv.phone}</span>
                            </button>
                          </td>

                          {/* Amount Due */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-extrabold text-white text-base font-mono">
                              ₹{inv.amount.toLocaleString('en-IN')}
                            </div>
                            {inv.paidAmount && inv.paidAmount > 0 && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                (Paid: ₹{inv.paidAmount.toLocaleString('en-IN')})
                              </div>
                            )}
                          </td>

                          {/* Due Date */}
                          <td className="p-4 whitespace-nowrap">
                            <span className={`text-xs font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                              {inv.dueDate}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4 whitespace-nowrap">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>PAID</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>OVERDUE</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                <span>PENDING</span>
                              </span>
                            )}
                          </td>

                          {/* Reminder Dispatches */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="text-xs text-slate-300 font-semibold">
                              {inv.reminderCount || 0} Sent
                            </div>
                            {inv.lastReminderSentAt && (
                              <div className="text-[10px] text-slate-400">{inv.lastReminderSentAt}</div>
                            )}
                          </td>

                          {/* Desktop Actions */}
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Primary 1-Click WhatsApp Remind Button */}
                              {!isPaid && (
                                <button
                                  onClick={() => handleSendWhatsAppReminder(inv)}
                                  title="1-Click WhatsApp Reminder"
                                  className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Remind</span>
                                </button>
                              )}

                              {/* View Scannable UPI QR */}
                              <button
                                onClick={() => handleOpenQrModal(inv)}
                                title="Generate UPI QR"
                                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer shrink-0"
                              >
                                <QrCode className="w-4 h-4 text-slate-300" />
                              </button>

                              {/* Edit / Record Partial Payment */}
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                title="Edit Bill / Partial Payment"
                                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer shrink-0"
                              >
                                <Edit2 className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                              </button>

                              {/* Mark as Paid Quick Action */}
                              {!isPaid && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv)}
                                  title="Mark as Paid"
                                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-400 active:scale-95 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer shrink-0"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </button>
                              )}

                              {/* Delete Bill */}
                              <button
                                onClick={() => setDeleteConfirmInvoice(inv)}
                                title="Delete Bill"
                                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer shrink-0"
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
            </div>
          )}
        </div>

        {/* 5. FLOATING MULTI-SELECT BULK ACTION BAR */}
        {(selectedInvoiceIds.length > 0 || metrics.overdueCount > 0) && (
          <div className="fixed bottom-4 left-4 right-4 sm:static z-40 bg-slate-900/95 sm:bg-slate-900 border border-emerald-500/40 sm:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                    {selectedInvoiceIds.length > 0
                      ? `${selectedInvoiceIds.length} Bills Selected`
                      : `${metrics.overdueCount} Overdue Bills`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedInvoiceIds.length > 0
                      ? `Total: ₹${selectedInvoicesList.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN')}`
                      : `Total Overdue: ₹${metrics.overdueAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {selectedInvoiceIds.length > 0 && (
                <button
                  onClick={() => setSelectedInvoiceIds([])}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleBatchRemind(
                    selectedInvoiceIds.length > 0
                      ? selectedInvoicesList
                      : invoices.filter((i) => i.status === 'OVERDUE')
                  )
                }
                disabled={isBatchReminding}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isBatchReminding
                    ? 'Dispatching Reminders...'
                    : selectedInvoiceIds.length > 0
                    ? `Send WhatsApp to ${selectedInvoiceIds.length} Selected`
                    : `Remind All ${metrics.overdueCount} Overdue`}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. RESPONSIVE MODALS */}

      {/* MODAL 1: Vendor Profile & Settings Slide-Over */}
      <VendorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vendor={vendor}
        userId={user?.uid || vendor.id}
        onVendorUpdate={(updated) => {
          setVendor(updated);
          showToast('Vendor settings & UPI details updated!');
        }}
      />

      {/* MODAL 2: Edit Customer & Partial Payment Modal */}
      <EditInvoiceModal
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        invoice={editingInvoice}
        onInvoiceUpdated={(updated) => {
          setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
          showToast(`Invoice #${updated.invoiceNo} successfully updated!`);
        }}
      />

      {/* MODAL 3: Scannable Dynamic UPI QR Code (Bottom Sheet on Mobile) */}
      {qrModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile pull indicator bar */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

            <button
              onClick={() => setQrModalInvoice(null)}
              aria-label="Close QR Modal"
              className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Instant UPI Payment QR</h3>
            <p className="text-xs text-slate-400 mb-4">{qrModalInvoice.customerName} • #{qrModalInvoice.invoiceNo}</p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="UPI QR" className="w-48 h-48 sm:w-56 sm:h-56 mx-auto" />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-500">Generating QR...</div>
              )}
            </div>

            <div className="text-xl font-black text-emerald-400 font-mono mb-1">
              ₹{qrModalInvoice.amount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 font-mono">UPI VPA: {vendor.upiId}</p>

            <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2.5">
              <button
                onClick={() => setQrModalInvoice(null)}
                className="flex-1 h-11 sm:h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSendWhatsAppReminder(qrModalInvoice);
                  setQrModalInvoice(null);
                }}
                className="flex-1 h-11 sm:h-10 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation (Bottom Sheet on Mobile) */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Delete Invoice #{deleteConfirmInvoice.invoiceNo}?</h3>
            <p className="text-xs text-slate-400 mb-5">
              This action will remove the record for {deleteConfirmInvoice.customerName} permanently.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirmInvoice(null)}
                className="flex-1 h-11 sm:h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirmInvoice.id)}
                className="flex-1 h-11 sm:h-10 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Add New Due Bill (Bottom Sheet on Mobile with Sticky Footer) */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-800/80 relative">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

              <button
                onClick={() => setIsAddInvoiceOpen(false)}
                aria-label="Close Add Bill"
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2.5 sm:p-2 rounded-full bg-slate-800 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Create New Bill</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Add a receivable with customer contact</p>
                </div>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="create-bill-form" onSubmit={handleCreateManualBill} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice #</label>
                <input
                  type="text"
                  required
                  value={manualInvoiceNo}
                  onChange={(e) => setManualInvoiceNo(e.target.value)}
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer / Company Name</label>
                <input
                  type="text"
                  required
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  placeholder="e.g. Ramesh Supermarket"
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  required
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-11 sm:h-10 bg-slate-950 border border-emerald-800/60 rounded-xl px-4 text-base sm:text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="w-full h-11 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen(false)}
                className="flex-1 sm:flex-initial h-11 sm:h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-bill-form"
                className="flex-1 sm:flex-initial h-11 sm:h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 min-w-[130px]"
              >
                Create Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
