import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  runTransaction,
  serverTimestamp,
  setLogLevel,
  onSnapshot,
  type Firestore
} from 'firebase/firestore';

try {
  setLogLevel('silent');
} catch (e) {}
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type Auth
} from 'firebase/auth';
import { app, auth, db } from '../firebase-service.js';
import { Vendor, Invoice, ReminderLog } from '../src/types/collect';

// ---------------- AUTH HELPER FUNCTIONS ----------------

export interface RegisterVendorPayload {
  email: string;
  password: string;
  businessName: string;
  phone: string;
  upiId: string;
  payeeName?: string;
  paymentTerms?: string;
  whatsappTemplate?: string;
}

export async function registerVendorWithTrial(
  payload: RegisterVendorPayload
): Promise<{ success: boolean; user?: User; vendor?: Vendor; error?: string }> {
  try {
    if (!auth) throw new Error('Auth service is initializing. Please try again in a moment.');
    const email = payload.email.trim();
    const pass = payload.password;

    // 1. Create User in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const userId = cred.user.uid;

    // 2. Setup 14-Day Free Trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const vendorProfile: Vendor = {
      id: userId,
      email: email,
      businessName: payload.businessName.trim() || 'My Business Mart',
      upiId: payload.upiId.trim() || `${payload.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      payeeName: (payload.payeeName || payload.businessName).trim(),
      phone: payload.phone.trim(),
      paymentTerms: payload.paymentTerms?.trim() || 'Net 15 Days',
      whatsappTemplate: payload.whatsappTemplate || DEFAULT_TEMPLATE,
      whatsappTemplateName: 'order_spot_invoice_reminder',
      planStatus: 'TRIAL_ACTIVE',
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      trialDaysLeft: 14,
      updatedAt: now.toISOString()
    };

    // 3. Save Vendor Document to Firestore
    await saveVendorProfile(userId, vendorProfile);

    return { success: true, user: cred.user, vendor: vendorProfile };
  } catch (err: any) {
    let msg = err?.message || 'Registration failed';
    if (err?.code === 'auth/email-already-in-use') {
      msg = 'An account with this email already exists. Please Sign In instead.';
    } else if (err?.code === 'auth/weak-password') {
      msg = 'Password should be at least 6 characters long.';
    } else if (err?.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { success: false, error: msg };
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (!auth) throw new Error('Auth service is initializing. Please try again in a moment.');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: cred.user };
  } catch (err: any) {
    let msg = err?.message || 'Login failed';
    if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
      msg = 'Invalid email or password. Please check your credentials.';
    } else if (err?.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    } else if (err?.code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please wait a moment or reset your password.';
    }
    return { success: false, error: msg };
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!auth) throw new Error('Auth service not initialized');
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: any) {
    let msg = err?.message || 'Password reset request failed';
    if (err?.code === 'auth/user-not-found') {
      msg = 'No user account found with this email address.';
    } else if (err?.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { success: false, error: msg };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth) await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ---------------- UTILITY: CLEAN OBJECT FOR FIRESTORE ----------------
// Firestore throws an error if any field is `undefined`. This helper cleans all fields.
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// ---------------- VENDOR SETTINGS FIRESTORE HELPERS ----------------

const DEFAULT_TEMPLATE = `Dear {{customer_name}},

Payment reminder from {{business_name}} regarding Invoice #{{invoice_no}} for ₹{{amount}}, due on {{due_date}}.

Click here to view invoice, pay via UPI / Corporate Bank, and upload payment confirmation:
{{presentment_link}}

Thank you for your business!`;

export async function getVendorProfile(userId: string): Promise<Vendor> {
  const fallbackVendor: Vendor = {
    id: userId || 'demo_vendor_uid',
    businessName: 'OrderSpot Wholesale Mart',
    upiId: 'orderspot@icici',
    payeeName: 'OrderSpot Wholesale & Distributors',
    phone: '+919876543210',
    paymentTerms: 'Net 15 Days',
    bankAccountNumber: '50200084729103',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank Ltd',
    bankBranch: 'Industrial Finance Branch, Bengaluru',
    whatsappTemplate: DEFAULT_TEMPLATE,
    whatsappTemplateName: 'order_spot_invoice_reminder'
  };

  if (!userId) return fallbackVendor;

  try {
    // 1. Try vendor_profiles collection first
    const profileRef = doc(db, 'vendor_profiles', userId);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      return { ...fallbackVendor, ...profileSnap.data(), id: userId } as Vendor;
    }

    // 2. Fallback check on vendors collection
    const docRef = doc(db, 'vendors', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...fallbackVendor, ...snap.data(), id: userId } as Vendor;
    }
  } catch (err) {
    console.warn('Could not fetch vendor profile from Firestore, using cached state:', err);
  }

  // Check localStorage for offline persistence fallback
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`orderspot_vendor_${userId}`) || localStorage.getItem('orderspot_collect_vendor');
    if (local) {
      try {
        return { ...fallbackVendor, ...JSON.parse(local), id: userId };
      } catch (e) {}
    }
  }

  return fallbackVendor;
}

export async function saveVendorProfile(userId: string, vendorData: Partial<Vendor>): Promise<void> {
  if (!userId) throw new Error('User ID is required to save vendor settings');

  const cleanData = cleanFirestoreData({
    ...vendorData,
    id: userId,
    updatedAt: new Date().toISOString()
  });

  // 1. Save to Firestore in vendor_profiles and vendors
  let firestoreError: any = null;
  try {
    const profileRef = doc(db, 'vendor_profiles', userId);
    await setDoc(profileRef, cleanData, { merge: true });

    const docRef = doc(db, 'vendors', userId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err: any) {
    console.error('Firestore saveVendorProfile error:', err);
    firestoreError = err;
  }

  // 2. LocalStorage backup
  if (typeof window !== 'undefined') {
    localStorage.setItem(`orderspot_vendor_${userId}`, JSON.stringify(cleanData));
    localStorage.setItem('orderspot_collect_vendor', JSON.stringify(cleanData));
  }

  if (firestoreError) {
    throw new Error(`Firestore save failed: ${firestoreError.message || 'Permission or connection issue'}`);
  }
}

// ---------------- INVOICES FIRESTORE HELPERS ----------------

export async function getVendorInvoices(userId: string): Promise<Invoice[]> {
  if (!userId) return [];

  try {
    const q = query(collection(db, 'invoices'), where('vendorId', '==', userId));
    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    querySnapshot.forEach((docSnap) => {
      invoices.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
    });

    if (invoices.length > 0) {
      // Sort by creation date descending
      invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return invoices;
    }
  } catch (err) {
    console.warn('Could not fetch invoices from Firestore, checking offline storage:', err);
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`orderspot_invoices_${userId}`) || localStorage.getItem('orderspot_collect_invoices');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  return [];
}

/**
 * Real-time listener for vendor invoices on the Collect Dashboard.
 * Emits live updates whenever an invoice is added, proof submitted, or marked PAID.
 */
export function subscribeToVendorInvoices(
  userId: string,
  onUpdate: (invoices: Invoice[]) => void
): () => void {
  if (!userId) return () => {};

  try {
    const q = query(collection(db, 'invoices'), where('vendorId', '==', userId));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const liveInvoices: Invoice[] = [];
        querySnapshot.forEach((docSnap) => {
          liveInvoices.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
        });
        if (liveInvoices.length > 0) {
          liveInvoices.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          onUpdate(liveInvoices);
        }
      },
      (error) => {
        console.warn('subscribeToVendorInvoices onSnapshot error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToVendorInvoices init error:', err);
    return () => {};
  }
}

/**
 * Real-time listener for a single invoice on the Payment Presentment page (pay.html).
 * Instantly transitions the buyer view from PENDING_VERIFICATION to PAID in real-time.
 */
export function subscribeToInvoice(
  invoiceId: string,
  onUpdate: (invoice: Invoice | null) => void
): () => void {
  if (!invoiceId) return () => {};

  try {
    const docRef = doc(db, 'invoices', invoiceId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate({ id: docSnap.id, ...docSnap.data() } as Invoice);
        }
      },
      (error) => {
        console.warn('subscribeToInvoice onSnapshot error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToInvoice init error:', err);
    return () => {};
  }
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  if (!invoice || !invoice.id) return;
  const cleanData = cleanFirestoreData({
    ...invoice,
    updatedAt: new Date().toISOString()
  });

  // 1. Always update localStorage cache first (guaranteed instant offline persistence)
  if (typeof window !== 'undefined') {
    try {
      const vendorId = invoice.vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vendorId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        let list: Invoice[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex((i) => i.id === invoice.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...cleanData } as Invoice;
        } else {
          list.unshift(cleanData as Invoice);
        }
        localStorage.setItem(key, JSON.stringify(list));
      });
    } catch (e) {
      console.warn('Local invoice save error:', e);
    }
  }

  // 2. Persist to Firestore if authenticated & online
  try {
    const docRef = doc(db, 'invoices', invoice.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Firestore saveInvoice warning (cached locally):', err);
  }
}

export async function updateInvoiceInFirestore(
  invoiceId: string,
  updates: Partial<Invoice>,
  vendorId?: string
): Promise<void> {
  if (!invoiceId) return;

  const cleanData = cleanFirestoreData({
    ...updates,
    updatedAt: new Date().toISOString()
  });

  // 1. Always update localStorage cache first (guaranteed instant offline persistence)
  if (typeof window !== 'undefined') {
    try {
      const vId = vendorId || updates.vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        let list: Invoice[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex((i) => i.id === invoiceId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...cleanData } as Invoice;
        } else {
          list.unshift(cleanData as Invoice);
        }
        localStorage.setItem(key, JSON.stringify(list));
      });
    } catch (e) {
      console.warn('Local invoice update error:', e);
    }
  }

  // 2. Sync to Firestore if authenticated & online
  try {
    const docRef = doc(db, 'invoices', invoiceId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Firestore updateInvoice warning (cached locally):', err);
  }
}

export async function deleteInvoiceFromFirestore(invoiceId: string, vendorId?: string): Promise<void> {
  if (!invoiceId) return;

  // 1. Remove from local storage first
  if (typeof window !== 'undefined') {
    try {
      const vId = vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        if (local) {
          const list: Invoice[] = JSON.parse(local);
          const filtered = list.filter((i) => i.id !== invoiceId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      });
    } catch (e) {}
  }

  // 2. Delete from Firestore if authenticated & online
  try {
    const docRef = doc(db, 'invoices', invoiceId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc warning (cached locally):', err);
  }
}

export async function logReminderToFirestore(log: ReminderLog, vendorId: string): Promise<void> {
  try {
    const cleanData = cleanFirestoreData({ ...log, vendorId });
    const docRef = doc(db, 'reminder_logs', log.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Firestore logReminder failed:', err);
  }
}

// ---------------- PROOF-OF-SETTLEMENT & INVOICE PRESENTMENT ----------------

export async function getInvoiceById(invoiceId: string): Promise<{ invoice: Invoice | null; vendor: Vendor | null }> {
  if (!invoiceId) return { invoice: null, vendor: null };

  try {
    const invRef = doc(db, 'invoices', invoiceId);
    const invSnap = await getDoc(invRef);
    if (invSnap.exists()) {
      const invoiceData = { id: invSnap.id, ...invSnap.data() } as Invoice;
      const vendorData = await getVendorProfile(invoiceData.vendorId);
      return { invoice: invoiceData, vendor: vendorData };
    }
  } catch (err) {
    console.warn('Could not fetch invoice from Firestore, checking localStorage:', err);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const localKeys = ['orderspot_collect_invoices'];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('orderspot_invoices_')) {
        localKeys.push(k);
      }
    }
    for (const key of localKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const list: Invoice[] = JSON.parse(data);
          const found = list.find((i) => i.id === invoiceId || i.invoiceNo === invoiceId);
          if (found) {
            const vendor = await getVendorProfile(found.vendorId);
            return { invoice: found, vendor };
          }
        } catch (e) {}
      }
    }
  }

  return { invoice: null, vendor: null };
}

export interface SettlementProofSubmission {
  invoiceId: string;
  vendorId: string;
  receiptUrl?: string; // Base64 data URL or uploaded URL
  utrNumber?: string;
  paymentMethod?: 'UPI' | 'NEFT_RTGS' | 'IMPS' | 'CASH' | 'CHEQUE' | 'OTHER';
  payerNotes?: string;
}

export async function submitInvoicePaymentProof(
  proof: SettlementProofSubmission
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updates: Partial<Invoice> = {
      status: 'PENDING_VERIFICATION',
      proofSubmittedAt: nowIso,
      receiptUrl: proof.receiptUrl || '',
      utrNumber: proof.utrNumber?.trim() || '',
      paymentMethod: proof.paymentMethod || 'UPI',
      payerNotes: proof.payerNotes?.trim() || ''
    };

    // Update in Firestore and local storage caches
    await updateInvoiceInFirestore(proof.invoiceId, updates, proof.vendorId);
    return { success: true };
  } catch (err: any) {
    console.error('submitInvoicePaymentProof error:', err);
    return { success: false, error: err?.message || 'Failed to submit proof' };
  }
}

export interface SettlementAuditParams {
  invoiceId: string;
  vendorId: string;
  confirmedAmount?: number;
  verifiedByEmail?: string;
  accountantNotes?: string;
}

export interface SettlementAuditResult {
  success: boolean;
  invoice?: Invoice;
  newStatus?: InvoiceStatus;
  remainingBalance?: number;
  error?: string;
}

/**
 * Executes an atomic Firestore transaction to audit and settle incoming payments.
 * Directly recalculates outstanding balance and adjusts status to PAID, PARTIALLY_PAID, or OVERDUE.
 */
export async function processAccountantSettlementAudit(
  params: SettlementAuditParams
): Promise<SettlementAuditResult> {
  const { invoiceId, vendorId, confirmedAmount, verifiedByEmail, accountantNotes } = params;
  if (!invoiceId) return { success: false, error: 'Invalid invoice ID' };

  try {
    const invRef = doc(db, 'invoices', invoiceId);
    let updatedInvoice: Invoice | null = null;
    const nowIso = new Date().toISOString();

    // 1. First fetch latest state from local cache or Firestore to determine balance
    let baseDoc: Partial<Invoice> = {};
    const local = await getInvoiceById(invoiceId);
    if (local.invoice) {
      baseDoc = local.invoice;
    }

    const currentDocOutstanding = Number(
      baseDoc.outstandingAmount !== undefined ? baseDoc.outstandingAmount : (baseDoc.amount || 0)
    );

    // If accountant didn't specify an amount or specified <= 0, default to full current outstanding
    const confirmedAmt = confirmedAmount !== undefined && !isNaN(confirmedAmount) && confirmedAmount >= 0
      ? confirmedAmount
      : currentDocOutstanding;

    // 2. Perform atomic Firestore mutation via runTransaction
    try {
      await runTransaction(db, async (transaction) => {
        const invSnap = await transaction.get(invRef);
        let docData: Partial<Invoice> = invSnap.exists() ? (invSnap.data() as Partial<Invoice>) : baseDoc;

        const prevOriginal = Number(docData.originalAmount || docData.amount || 0);
        const prevOutstanding = Number(
          docData.outstandingAmount !== undefined ? docData.outstandingAmount : (docData.amount || 0)
        );
        const prevPaid = Number(docData.paidAmount || 0);
        const newPaidTotal = prevPaid + confirmedAmt;
        const newOutstanding = Math.max(0, prevOutstanding - confirmedAmt);

        // Determine extended status
        let newStatus: InvoiceStatus = 'PAID';
        const isPastDue = docData.dueDate ? new Date(docData.dueDate) < new Date() : false;

        if (newOutstanding <= 0) {
          newStatus = 'PAID';
        } else {
          // Partial payment threshold matched: retain OVERDUE or transition to PARTIALLY_PAID
          newStatus = isPastDue ? 'OVERDUE' : 'PARTIALLY_PAID';
        }

        const paymentEntry = {
          date: nowIso,
          amount: confirmedAmt,
          notes: accountantNotes?.trim() || `Audited & confirmed by ${verifiedByEmail || 'Counter Desk'}`
        };

        const paymentHistory = Array.isArray(docData.paymentHistory)
          ? [...docData.paymentHistory, paymentEntry]
          : [paymentEntry];

        const updates: Partial<Invoice> = {
          originalAmount: prevOriginal || (docData.amount || 0),
          amount: newOutstanding > 0 ? newOutstanding : (docData.amount || 0),
          outstandingAmount: newOutstanding,
          paidAmount: newPaidTotal,
          status: newStatus,
          verifiedAt: nowIso,
          verifiedBy: verifiedByEmail || 'Store Counter Desk',
          paymentHistory: paymentHistory,
          payerNotes: accountantNotes ? `Accountant Note: ${accountantNotes}` : docData.payerNotes
        };

        const merged: Invoice = {
          id: invoiceId,
          vendorId: vendorId || (docData.vendorId as string) || 'demo_vendor_uid',
          invoiceNo: (docData.invoiceNo as string) || 'INV-001',
          customerName: (docData.customerName as string) || 'Customer',
          phone: (docData.phone as string) || '',
          amount: newOutstanding > 0 ? newOutstanding : (docData.amount || 0),
          originalAmount: prevOriginal || (docData.amount || 0),
          outstandingAmount: newOutstanding,
          paidAmount: newPaidTotal,
          dueDate: (docData.dueDate as string) || nowIso.split('T')[0],
          status: newStatus,
          createdAt: (docData.createdAt as string) || nowIso,
          reminderCount: docData.reminderCount || 0,
          ...updates
        };

        const cleanData = cleanFirestoreData({
          ...updates,
          updatedAt: nowIso
        });

        transaction.set(invRef, cleanData, { merge: true });
        updatedInvoice = merged;
      });
    } catch (txnError) {
      console.warn('Firestore transaction fallback to direct update:', txnError);
      
      const prevOriginal = Number(baseDoc.originalAmount || baseDoc.amount || 0);
      const prevOutstanding = Number(
        baseDoc.outstandingAmount !== undefined ? baseDoc.outstandingAmount : (baseDoc.amount || 0)
      );
      const prevPaid = Number(baseDoc.paidAmount || 0);
      const newPaidTotal = prevPaid + confirmedAmt;
      const newOutstanding = Math.max(0, prevOutstanding - confirmedAmt);

      const isPastDue = baseDoc.dueDate ? new Date(baseDoc.dueDate) < new Date() : false;
      const newStatus: InvoiceStatus = newOutstanding <= 0 ? 'PAID' : (isPastDue ? 'OVERDUE' : 'PARTIALLY_PAID');

      const paymentEntry = {
        date: nowIso,
        amount: confirmedAmt,
        notes: accountantNotes?.trim() || `Audited & confirmed by ${verifiedByEmail || 'Counter Desk'}`
      };

      const paymentHistory = Array.isArray(baseDoc.paymentHistory)
        ? [...baseDoc.paymentHistory, paymentEntry]
        : [paymentEntry];

      const updates: Partial<Invoice> = {
        originalAmount: prevOriginal || (baseDoc.amount || 0),
        amount: newOutstanding > 0 ? newOutstanding : (baseDoc.amount || 0),
        outstandingAmount: newOutstanding,
        paidAmount: newPaidTotal,
        status: newStatus,
        verifiedAt: nowIso,
        verifiedBy: verifiedByEmail || 'Store Counter Desk',
        paymentHistory: paymentHistory,
        payerNotes: accountantNotes ? `Accountant Note: ${accountantNotes}` : baseDoc.payerNotes
      };

      await updateInvoiceInFirestore(invoiceId, updates, vendorId);
      updatedInvoice = { ...(baseDoc as Invoice), ...updates };
    }

    // 3. Keep localStorage in sync
    if (updatedInvoice && typeof window !== 'undefined') {
      const vId = vendorId || updatedInvoice.vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const localData = localStorage.getItem(key);
        let list: Invoice[] = localData ? JSON.parse(localData) : [];
        const idx = list.findIndex((i) => i.id === invoiceId);
        if (idx >= 0) {
          list[idx] = updatedInvoice!;
        } else {
          list.unshift(updatedInvoice!);
        }
        localStorage.setItem(key, JSON.stringify(list));
      });
    }

    return {
      success: true,
      invoice: updatedInvoice || undefined,
      newStatus: updatedInvoice?.status,
      remainingBalance: updatedInvoice?.outstandingAmount
    };
  } catch (err: any) {
    console.error('processAccountantSettlementAudit error:', err);
    return { success: false, error: err?.message || 'Audit settlement update failed' };
  }
}

export async function approveAndCloseInvoice(
  invoiceId: string,
  vendorId: string,
  verifiedByEmail?: string,
  confirmedAmount?: number,
  accountantNotes?: string
): Promise<SettlementAuditResult> {
  return processAccountantSettlementAudit({
    invoiceId,
    vendorId,
    confirmedAmount,
    verifiedByEmail,
    accountantNotes
  });
}

export async function rejectInvoiceProof(
  invoiceId: string,
  vendorId: string,
  reason?: string
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const local = await getInvoiceById(invoiceId);
    const prevDoc = local.invoice;
    const isPastDue = prevDoc?.dueDate ? new Date(prevDoc.dueDate) < new Date() : false;
    
    const updates: Partial<Invoice> = {
      status: isPastDue ? 'OVERDUE' : (prevDoc?.status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'PENDING'),
      notes: reason ? `Proof Rejected: ${reason}` : 'Proof rejected by store desk',
      proofSubmittedAt: undefined
    };

    await updateInvoiceInFirestore(invoiceId, updates, vendorId);
    const updatedInvoice = prevDoc ? ({ ...prevDoc, ...updates } as Invoice) : undefined;

    return { success: true, invoice: updatedInvoice };
  } catch (err: any) {
    console.error('rejectInvoiceProof error:', err);
    return { success: false, error: err?.message || 'Failed to reject proof' };
  }
}

export { app, auth, db };
