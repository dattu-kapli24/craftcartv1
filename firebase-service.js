import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  setLogLevel
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { firebaseConfig } from "./firebase-config.js";

// Silence internal connection warning logs in sandbox / offline environments
try {
  setLogLevel("silent");
} catch (e) {
  // Ignore
}

let app;
let db;
let storage;
let auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Enable clean long-polling to prevent WebChannel drop errors in sandbox/iframe environments
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  storage = getStorage(app);
  auth = getAuth(app);
} catch (e) {
  try {
    db = getFirestore(app);
  } catch (err) {
    // Ignore fallback errors
  }
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, db, storage, auth };

export function onAuthChange(callback) {
  try {
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }
  } catch (e) {
    console.warn("Auth change listener warning:", e);
  }
}

export function logoutAdmin() { 
  try {
    return auth ? signOut(auth) : Promise.resolve();
  } catch (e) {
    return Promise.resolve();
  }
}

export async function loginAdmin(email, password) {
  try {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetPasswordEmail(email) {
  try {
    if (!auth) throw new Error("Auth not initialized");
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

