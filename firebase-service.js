import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Helper to get Store ID from URL query param (?store=name)
export function getStoreIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('store') || 'demo'; // Fallback to 'demo' store
}

export { auth, onAuthChange, logoutAdmin };

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

export function logoutAdmin() {
  return signOut(auth);
}

export async function loginAdmin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// FETCH MULTI-TENANT CONFIG
export async function getStoreData(storeId) {
  try {
    // 1. Get Store Branding/Config
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) return null;
    const storeConfig = storeSnap.data();

    // 2. Get Store Products
    const q = query(collection(db, "products"), where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return {
      store: storeConfig,
      categories: storeConfig.categories || ["All"],
      products: products
    };
  } catch (error) {
    console.error("Multi-tenant fetch error:", error);
    return null;
  }
}

// SAVE STORE CONFIG
export async function saveStoreConfig(storeId, config) {
  try {
    const { products, ...branding } = config;

    // Save Branding
    await setDoc(doc(db, "stores", storeId), branding.store ? { ...branding.store, categories: branding.categories } : branding);

    // Save Products individually (Multi-tenant style)
    for (const prod of products) {
      const prodRef = doc(collection(db, "products"), prod.id.startsWith('new-') ? undefined : prod.id);
      await setDoc(prodRef, { ...prod, storeId: storeId }, { merge: true });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function uploadImageToFirebase(storeId, file) {
  try {
    const storageRef = ref(storage, `stores/${storeId}/products/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url };
  } catch (error) {
    return { error: error.message };
  }
}
