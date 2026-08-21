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
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth';
import { app, auth, db } from '../firebase-service.js';
import { Vendor, Invoice, ReminderLog } from '../src/types/collect';

// ---------------- AUTH HELPER FUNCTIONS ----------------

export async function loginWithEmail(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: cred.user };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ---------------- VENDOR SETTINGS FIRESTORE HELPERS ----------------

const DEFAULT_TEMPLATE = `Dear {{customer_name}},

This is a gentle payment reminder from {{business_name}} regarding Invoice #{{invoice_no}} for ₹{{amount}}, which is due on {{due_date}}.

Kindly complete the payment using this instant UPI link:
{{upi_link}}

Thank you for your business!`;

// Helper to timeout long Firestore requests gracefully
const withTimeout = <T>(promise: Promise<T>, ms = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out')), ms))
  ]);
};

export async function getVendorProfile(userId: string): Promise<Vendor> {
  const fallbackVendor: Vendor = {
    id: userId,
    businessName: 'OrderSpot Wholesale Mart',
    upiId: 'orderspot@icici',
    payeeName: 'OrderSpot Wholesale & Distributors',
    phone: '+919876543210',
    paymentTerms: 'Net 15 Days',
    whatsappTemplate: DEFAULT_TEMPLATE,
    whatsappTemplateName: 'order_spot_invoice_reminder'
  };

  if (!userId) return fallbackVendor;

  try {
    const docRef = doc(db, 'vendors', userId);
    const snap = await withTimeout(getDoc(docRef), 2500);
    if (snap.exists()) {
      return { ...fallbackVendor, ...snap.data(), id: userId } as Vendor;
    }
  } catch (err) {
    console.warn('Could not fetch vendor profile from Firestore, using cached/default state:', err);
  }

  // Check localStorage for offline persistence fallback
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`orderspot_vendor_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  return fallbackVendor;
}

export async function saveVendorProfile(userId: string, vendorData: Partial<Vendor>): Promise<void> {
  if (!userId) return;

  const dataToSave = {
    ...vendorData,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'vendors', userId);
    await withTimeout(setDoc(docRef, dataToSave, { merge: true }), 2500);
  } catch (err) {
    console.warn('Firestore setDoc failed for vendor, saving to localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(`orderspot_vendor_${userId}`, JSON.stringify(dataToSave));
    localStorage.setItem('orderspot_collect_vendor', JSON.stringify(dataToSave));
  }
}

// ---------------- INVOICES FIRESTORE HELPERS ----------------

export async function getVendorInvoices(userId: string): Promise<Invoice[]> {
  if (!userId) return [];

  try {
    const q = query(collection(db, 'invoices'), where('vendorId', '==', userId));
    const querySnapshot = await withTimeout(getDocs(q), 2500);
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
    const local = localStorage.getItem(`orderspot_invoices_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  return [];
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  if (!invoice || !invoice.id) return;
  const dataToSave = {
    ...invoice,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'invoices', invoice.id);
    await withTimeout(setDoc(docRef, dataToSave, { merge: true }), 3000);
  } catch (err) {
    console.warn('Firestore saveInvoice warning (offline fallback active):', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const vendorId = invoice.vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vendorId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        let list: Invoice[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex((i) => i.id === invoice.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...dataToSave };
        } else {
          list.unshift(dataToSave as Invoice);
        }
        localStorage.setItem(key, JSON.stringify(list));
      });
    } catch (e) {
      console.warn('Local invoice save error:', e);
    }
  }
}

export async function updateInvoiceInFirestore(
  invoiceId: string,
  updates: Partial<Invoice>,
  vendorId?: string
): Promise<void> {
  if (!invoiceId) return;

  const dataToSave = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'invoices', invoiceId);
    await withTimeout(setDoc(docRef, dataToSave, { merge: true }), 3000);
  } catch (err) {
    console.warn('Firestore updateInvoice warning (offline fallback active):', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const vId = vendorId || updates.vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        if (local) {
          let list: Invoice[] = JSON.parse(local);
          const idx = list.findIndex((i) => i.id === invoiceId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...dataToSave };
            localStorage.setItem(key, JSON.stringify(list));
          }
        }
      });
    } catch (e) {
      console.warn('Local invoice update error:', e);
    }
  }
}

export async function deleteInvoiceFromFirestore(invoiceId: string, vendorId?: string): Promise<void> {
  if (!invoiceId) return;

  try {
    const docRef = doc(db, 'invoices', invoiceId);
    await withTimeout(deleteDoc(docRef), 3000);
  } catch (err) {
    console.warn('Firestore deleteDoc warning:', err);
  }

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
}

export async function logReminderToFirestore(log: ReminderLog, vendorId: string): Promise<void> {
  try {
    const docRef = doc(db, 'reminder_logs', log.id);
    await setDoc(docRef, { ...log, vendorId });
  } catch (err) {
    console.warn('Firestore logReminder failed:', err);
  }
}

export { app, auth, db };
