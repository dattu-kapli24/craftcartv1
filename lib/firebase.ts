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
  setLogLevel,
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

This is a gentle payment reminder from {{business_name}} regarding Invoice #{{invoice_no}} for ₹{{amount}}, which is due on {{due_date}}.

Kindly complete the payment using this instant UPI link:
{{upi_link}}

Thank you for your business!`;

export async function getVendorProfile(userId: string): Promise<Vendor> {
  const fallbackVendor: Vendor = {
    id: userId || 'demo_vendor_uid',
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

export { app, auth, db };
