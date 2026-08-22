import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

async function syncPlywoodStore() {
  console.log("Initializing Firebase app...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const storeKey = "plywoodwholesale";
  const blueprint = STORE_BLUEPRINTS[storeKey];

  if (!blueprint) {
    throw new Error(`Blueprint ${storeKey} not found!`);
  }

  console.log(`Syncing store '${blueprint.store.name}' to Firestore (stores/${storeKey})...`);
  
  const storeData = {
    ...blueprint.store,
    categories: blueprint.categories,
    updatedAt: new Date().toISOString(),
    ownerId: "admin_master_sync"
  };

  await setDoc(doc(db, "stores", storeKey), storeData, { merge: true });
  // Also add alias 'plywood' for easy access
  await setDoc(doc(db, "stores", "plywood"), storeData, { merge: true });
  console.log("✅ Store metadata synced successfully!");

  console.log(`Syncing ${blueprint.products.length} products for ${storeKey}...`);
  const batch = writeBatch(db);

  for (const prod of blueprint.products) {
    const prodRef = doc(db, "products", prod.id);
    batch.set(prodRef, {
      ...prod,
      storeId: storeKey,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  await batch.commit();
  console.log("✅ All products synced successfully to Firestore database!");
  process.exit(0);
}

syncPlywoodStore().catch(err => {
  console.error("Error syncing plywood store:", err);
  process.exit(1);
});
