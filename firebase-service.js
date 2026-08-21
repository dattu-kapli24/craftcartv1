import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

let app;
let db;
let storage;
let auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Enable long-polling to prevent WebChannel connectivity drops and offline alerts in sandbox/iframe environments
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  });
  storage = getStorage(app);
  auth = getAuth(app);
} catch (e) {
  try {
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firestore fallback warning:", err);
  }
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, db, storage, auth };

export function getStoreIdFromUrl() {
  const path = window.location.pathname.split('/').filter(p => p !== "");
  const reserved = ["admin", "login", "admin.html", "login.html", "index.html", "store.html", "store", "collect.html", "collect"];
  if (path[0] && !reserved.includes(path[0].toLowerCase())) return path[0];
  const params = new URLSearchParams(window.location.search);
  return params.get('store') || 'plywoodwholesale';
}

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

export async function getOwnedStores(uid) {
  try {
    if (!db) return [];
    const q = query(collection(db, "stores"), where("ownerId", "==", uid));
    const querySnapshot = await getDocs(q);
    const stores = [];
    querySnapshot.forEach((doc) => { stores.push({ id: doc.id, ...doc.data() }); });
    return stores;
  } catch (error) {
    console.warn("getOwnedStores warning:", error.message);
    return [];
  }
}

export async function getStoreData(storeId) {
  const blueprint = STORE_BLUEPRINTS && STORE_BLUEPRINTS[storeId];
  try {
    if (!db) return blueprint || null;
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists()) {
      return blueprint || null;
    }

    const storeConfig = storeSnap.data();
    const q = query(collection(db, "products"), where("storeId", "==", storeId));

    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => { 
      const pData = { id: doc.id, ...doc.data() };
      // If image is missing, placeholder, or broken, resolve with blueprint image
      if (!pData.image || pData.image.includes("placehold.co") || pData.image.trim() === "") {
        if (blueprint && blueprint.products) {
          const match = blueprint.products.find(p => p.id === pData.id || p.name?.toLowerCase() === pData.name?.toLowerCase());
          if (match && match.image) {
            pData.image = match.image;
          }
        }
      }
      products.push(pData);
    });

    const finalProducts = products.length > 0 ? products : (blueprint ? blueprint.products : []);

    return {
      store: { ...(blueprint?.store || {}), ...storeConfig },
      categories: storeConfig.categories || blueprint?.categories || ["All"],
      products: finalProducts
    };
  } catch (error) {
    console.warn("getStoreData warning:", error.message);
    return blueprint || null;
  }
}

export async function syncAllBlueprintsToFirestore(ownerId = null) {
  try {
    if (!db) throw new Error("Database not initialized");
    const currentUser = auth?.currentUser;
    const uid = ownerId || currentUser?.uid || "admin_master_sync";

    const results = [];
    for (const [storeKey, blueprint] of Object.entries(STORE_BLUEPRINTS)) {
      const storeData = {
        ...blueprint.store,
        categories: blueprint.categories,
        updatedAt: new Date().toISOString(),
        ownerId: uid
      };

      await setDoc(doc(db, "stores", storeKey), storeData, { merge: true });

      if (blueprint.products && Array.isArray(blueprint.products)) {
        for (const prod of blueprint.products) {
          const prodRef = doc(db, "products", prod.id);
          await setDoc(prodRef, {
            ...prod,
            storeId: storeKey,
            ownerId: uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
      results.push(storeKey);
    }
    return { success: true, syncedStores: results };
  } catch (error) {
    console.error("Error syncing blueprints:", error);
    return { success: false, error: error.message };
  }
}

export async function saveStoreConfig(storeId, config) {
  try {
    if (!db) throw new Error("Database not initialized");
    const { products, ...branding } = config;
    const currentUser = auth?.currentUser;
    const storeData = branding.store ? { ...branding.store, categories: branding.categories } : branding;
    if (currentUser) storeData.ownerId = currentUser.uid;

    console.log("Saving store config for:", storeId, storeData);
    await setDoc(doc(db, "stores", storeId), storeData, { merge: true });

    // 1. Get current products in Firestore for this store to handle deletions
    const q = query(collection(db, "products"), where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);
    const existingProdIds = [];
    querySnapshot.forEach((doc) => existingProdIds.push(doc.id));

    const activeProdIds = [];

    if (products && Array.isArray(products)) {
      for (const prod of products) {
        const isNew = !prod.id || String(prod.id).startsWith('new-');
        const prodRef = isNew ? doc(collection(db, "products")) : doc(db, "products", String(prod.id));

        const { id, ...prodDataToSave } = prod;
        const prodData = { ...prodDataToSave, storeId: storeId };
        if (currentUser) prodData.ownerId = currentUser.uid;

        await setDoc(prodRef, prodData, { merge: true });
        activeProdIds.push(prodRef.id);

        // Update the local product object with the real ID if it was new
        if (isNew) prod.id = prodRef.id;
      }
    }

    // 2. Delete products that are no longer in the list (orphaned items)
    const idsToDelete = existingProdIds.filter(id => !activeProdIds.includes(id));
    if (idsToDelete.length > 0) {
      console.log("Deleting orphaned products:", idsToDelete);
      for (const idToDelete of idsToDelete) {
        await deleteDoc(doc(db, "products", idToDelete));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in saveStoreConfig:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteStoreData(storeId) {
  try {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, "stores", storeId));
    const q = query(collection(db, "products"), where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    querySnapshot.forEach((document) => { deletePromises.push(deleteDoc(doc(db, "products", document.id))); });
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function uploadImageToCloud(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url ? { url: data.secure_url } : { error: "Upload failed" };
  } catch (error) {
    return { error: error.message };
  }
}
