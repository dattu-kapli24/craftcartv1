import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

async function syncAllStores() {
  console.log("Initializing Firebase app...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const [storeKey, blueprint] of Object.entries(STORE_BLUEPRINTS)) {
    console.log(`Syncing store '${blueprint.store?.name || storeKey}' (${storeKey})...`);
    
    const storeData = {
      ...blueprint.store,
      categories: blueprint.categories,
      updatedAt: new Date().toISOString(),
      ownerId: "admin_master_sync"
    };

    await setDoc(doc(db, "stores", storeKey), storeData, { merge: true });

    if (blueprint.products && Array.isArray(blueprint.products)) {
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
      console.log(`  -> Synced ${blueprint.products.length} products with image paths for ${storeKey}`);
    }
  }

  console.log("✅ All stores and product images successfully synced to Firebase DB!");
}

syncAllStores().catch(err => {
  console.error("Error syncing all stores:", err);
});
