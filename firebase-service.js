import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Helper to get Store ID from URL path (e.g., orderspot.in/bakerscart)
export function getStoreIdFromUrl() {
  const path = window.location.pathname.split('/').filter(p => p !== "");

  // Reserved paths that are NOT store names
  const reserved = ["admin", "login", "admin.html", "login.html", "index.html"];

  // If the first segment is a store ID, return it. Otherwise check query param as fallback.
  if (path[0] && !reserved.includes(path[0].toLowerCase())) {
    return path[0];
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('store') || 'demo';
}

export { auth };

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

// B2B Wholesale Logic
export function getTieredPrice(product, qty) {
  if (!product.bulkPricing || !Array.isArray(product.bulkPricing) || product.bulkPricing.length === 0) {
    return product.price;
  }

  // Sort tiers by minQty descending to find the highest matching tier
  const tiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
  const matchedTier = tiers.find(tier => qty >= tier.minQty);

  return matchedTier ? matchedTier.unitPrice : product.price;
}

// FIND ALL STORES BY OWNER
export async function getOwnedStores(uid) {
  try {
    const q = query(collection(db, "stores"), where("ownerId", "==", uid));
    const querySnapshot = await getDocs(q);
    const stores = [];
    querySnapshot.forEach((doc) => {
      stores.push({ id: doc.id, ...doc.data() });
    });
    return stores;
  } catch (error) {
    console.error("Error finding stores:", error);
    return [];
  }
}

// FETCH MULTI-TENANT CONFIG
export async function getStoreData(storeId) {
  try {
    // 1. Get Store Branding/Config
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);

    let storeConfig = null;

    if (storeSnap.exists()) {
      storeConfig = storeSnap.data();
    } else if (storeId === 'demo') {
      // Fallback branding for the marketplace home page if 'demo' doc is missing
      storeConfig = {
        name: "OrderSpot Marketplace",
        whatsappNumber: "918722661098",
        currencySymbol: "₹",
        accentColor: "#0f766e",
        accentColorDark: "#0d9488",
        tagline: "Quality products from local vendors"
      };
    } else {
      return null; // Store truly not found
    }

    // 2. Get Store Products
    let q;
    if (storeId === 'demo') {
      // Marketplace Mode: Home page shows ALL products from ALL stores
      q = query(collection(db, "products"));
    } else {
      // Tenant Mode: Show only this store's products
      q = query(collection(db, "products"), where("storeId", "==", storeId));
    }

    console.log(`Executing product query for storeId: ${storeId}`);
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Fetched ${products.length} products for ${storeId}`);

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
    const currentUser = auth.currentUser;

    // Save Branding with ownerId for security
    const storeData = branding.store ? { ...branding.store, categories: branding.categories } : branding;
    if (currentUser) {
      storeData.ownerId = currentUser.uid;
    }

    await setDoc(doc(db, "stores", storeId), storeData, { merge: true });

    // Save Products individually
    for (const prod of products) {
      const prodRef = doc(collection(db, "products"), prod.id.startsWith('new-') ? undefined : prod.id);
      const prodData = { ...prod, storeId: storeId };
      if (currentUser) {
        prodData.ownerId = currentUser.uid;
      }
      await setDoc(prodRef, prodData, { merge: true });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// DELETE STORE AND ITS PRODUCTS
export async function deleteStoreData(storeId) {
  try {
    // 1. Delete Store Branding
    await deleteDoc(doc(db, "stores", storeId));

    // 2. Delete All Store Products
    const q = query(collection(db, "products"), where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, "products", document.id)));
    });
    await Promise.all(deletePromises);

    return { success: true };
  } catch (error) {
    console.error("Delete store error:", error);
    return { success: false, error: error.message };
  }
}

import { cloudinaryConfig } from "./firebase-config.js";

export async function uploadImageToCloud(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return { url: data.secure_url };
    } else {
      return { error: data.error?.message || "Upload failed" };
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: error.message };
  }
}
