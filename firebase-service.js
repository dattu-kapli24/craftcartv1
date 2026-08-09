import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Use a dynamic store ID. Defaulting to 'shridevi-resinart'
const STORE_ID = window.STORE_ID || "shridevi-resinart";
const CONFIG_DOC_ID = "config";
const CONFIG_COLLECTION = `stores/${STORE_ID}/settings`;

// Authentication Helper
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

export async function getStoreConfig() {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
}

export async function saveStoreConfig(config) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, config);
    return { success: true };
  } catch (error) {
    console.error("Error saving config:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadImageToFirebase(file) {
  try {
    const storageRef = ref(storage, `stores/${STORE_ID}/products/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { error: error.message };
  }
}
