import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export function getStoreIdFromUrl() {
  const path = window.location.pathname.split('/').filter(p => p !== "");
  const reserved = ["admin", "login", "admin.html", "login.html", "index.html"];
  if (path[0] && !reserved.includes(path[0].toLowerCase())) return path[0];
  const params = new URLSearchParams(window.location.search);
  return params.get('store') || 'richwhisk';
}

export { auth };
export function onAuthChange(callback) { onAuthStateChanged(auth, callback); }
export function logoutAdmin() { return signOut(auth); }
export async function loginAdmin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOwnedStores(uid) {
  try {
    const q = query(collection(db, "stores"), where("ownerId", "==", uid));
    const querySnapshot = await getDocs(q);
    const stores = [];
    querySnapshot.forEach((doc) => { stores.push({ id: doc.id, ...doc.data() }); });
    return stores;
  } catch (error) {
    return [];
  }
}

export async function getStoreData(storeId) {
  try {
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists()) return null;

    const storeConfig = storeSnap.data();
    let q = (storeId === 'demo')
      ? query(collection(db, "products"))
      : query(collection(db, "products"), where("storeId", "==", storeId));

    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => { products.push({ id: doc.id, ...doc.data() }); });

    return {
      store: storeConfig,
      categories: storeConfig.categories || ["All"],
      products: products
    };
  } catch (error) {
    return null;
  }
}

export async function saveStoreConfig(storeId, config) {
  try {
    const { products, ...branding } = config;
    const currentUser = auth.currentUser;
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
