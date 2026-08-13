import { getStoreData, saveStoreConfig, onAuthChange, logoutAdmin, getStoreIdFromUrl, getOwnedStores, auth } from "./firebase-service.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

(async function() {
  let currentConfig = null;
  let currentStoreId = getStoreIdFromUrl();
  const $ = (id) => document.getElementById(id);

  onAuthChange(async (user) => {
    if (!user) {
      window.location.href = "/login.html";
    } else {
      const stores = await getOwnedStores(user.uid);
      renderSidebar(stores);
      if (currentStoreId && currentStoreId !== 'admin') {
        loadConfig(currentStoreId);
      } else if (stores.length > 0) {
        loadConfig(stores[0].id);
      }
    }
  });

  function renderSidebar(stores) {
    const list = $("sidebarStoreList");
    list.innerHTML = "";
    stores.forEach(s => {
      const btn = document.createElement('button');
      btn.className = "store-nav-item" + (s.id === currentStoreId ? " active" : "");
      btn.innerHTML = `<strong>${s.name || s.id}</strong>`;
      btn.onclick = () => {
        currentStoreId = s.id;
        window.history.pushState({}, '', `?store=${s.id}`);
        loadConfig(s.id);
      };
      list.appendChild(btn);
    });
  }

  async function loadConfig(id) {
    const data = await getStoreData(id);
    if (data) {
      currentConfig = data;
      renderForm();
      $("adminForm").hidden = false;
      $("welcomeState").hidden = true;
      if ($("viewStoreLink")) {
        $("viewStoreLink").href = `/${id}`;
        $("viewStoreLink").hidden = false;
      }
    }
  }

  function renderForm() {
    const s = currentConfig.store;
    $("name").value = s.name || "";
    $("tagline").value = s.tagline || "";
    $("whatsappNumber").value = s.whatsappNumber || "";
    $("currencySymbol").value = s.currencySymbol || "₹";
    $("accentColor").value = s.accentColor || "#c96c8a";
    $("accentColorDark").value = s.accentColorDark || "#8f4160";
    $("storeType").value = s.storeType || "B2C";

    renderCategories();
    renderProducts();
  }

  function renderCategories() {
    const list = $("categoriesList");
    list.innerHTML = "";
    (currentConfig.categories || []).forEach((cat, idx) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.innerHTML = `${cat} <button type="button" onclick="window.removeCat(${idx})">&times;</button>`;
      list.appendChild(span);
    });
  }

  window.removeCat = (idx) => {
    currentConfig.categories.splice(idx, 1);
    renderCategories();
  };

  $("addCategoryBtn").onclick = () => {
    const val = $("newCategory").value.trim();
    if (val) {
      if (!currentConfig.categories) currentConfig.categories = [];
      currentConfig.categories.push(val);
      $("newCategory").value = "";
      renderCategories();
    }
  };

  function renderProducts() {
    const list = $("productsList");
    list.innerHTML = "";
    const isB2B = $("storeType").value === "B2B";

    (currentConfig.products || []).forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = "admin-section product-edit-card";
      card.style.position = "relative";
      card.style.marginBottom = "20px";
      card.style.padding = "20px";
      card.style.border = "1px solid #e2e8f0";

      let b2bSection = "";
      if (isB2B) {
        b2bSection = `
          <div class="form-row" style="margin-top:15px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            <div class="form-group">
              <label>MOQ</label>
              <input type="number" value="${p.moq || 0}" onchange="window.updateProd(${idx}, 'moq', parseInt(this.value))">
            </div>
            <div class="form-group">
              <label>SKU</label>
              <input type="text" value="${p.sku || ''}" onchange="window.updateProd(${idx}, 'sku', this.value)">
            </div>
          </div>
          <div class="form-group" style="margin-top:10px;">
            <label>Bulk Pricing (JSON Array)</label>
            <textarea rows="3" style="width:100%; font-family:monospace; font-size:0.8rem;" onchange="try{ window.updateProd(${idx}, 'bulkPricing', JSON.parse(this.value)); this.style.borderColor='#e2e8f0'; }catch(e){ this.style.borderColor='red'; }">${JSON.stringify(p.bulkPricing || [], null, 2)}</textarea>
            <small style="color:#64748b">Format: [{"minQty": 10, "price": 800}]</small>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; gap:15px;">
           <img src="${p.image || ''}" class="product-preview-img" onerror="this.src='https://placehold.co/100x100?text=No+Image'">
           <div style="flex:1;">
              <div class="form-row">
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" value="${p.name}" onchange="window.updateProd(${idx}, 'name', this.value)">
                </div>
                <div class="form-group">
                  <label>Price</label>
                  <input type="number" value="${p.price}" onchange="window.updateProd(${idx}, 'price', parseFloat(this.value))">
                </div>
              </div>
              ${b2bSection}
              <div style="margin-top:10px; display:flex; gap:10px;">
                <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:4px 8px;" onclick="window.deleteProd(${idx})">Delete</button>
              </div>
           </div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  $("storeType").onchange = () => {
    currentConfig.store.storeType = $("storeType").value;
    renderProducts();
  };

  window.updateProd = (idx, key, val) => {
    if (!currentConfig.products[idx]) return;
    currentConfig.products[idx][key] = val;
  };

  window.deleteProd = (idx) => {
    if (confirm("Delete this product?")) {
      currentConfig.products.splice(idx, 1);
      renderProducts();
    }
  };

  $("addProductBtn").onclick = () => {
    const newProd = {
      id: "new-" + Date.now(),
      name: "New Product",
      price: 0,
      image: "https://placehold.co/400x400?text=Product+Image",
      category: currentConfig.categories[0] || "All"
    };
    if (!currentConfig.products) currentConfig.products = [];
    currentConfig.products.push(newProd);
    renderProducts();
  };

  $("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.submitter || $("adminForm").querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = "Saving to Cloud...";

      const s = currentConfig.store;
      if ($("name")) s.name = $("name").value;
      if ($("tagline")) s.tagline = $("tagline").value;
      if ($("whatsappNumber")) s.whatsappNumber = $("whatsappNumber").value;
      if ($("currencySymbol")) s.currencySymbol = $("currencySymbol").value;
      if ($("accentColor")) s.accentColor = $("accentColor").value;
      if ($("accentColorDark")) s.accentColorDark = $("accentColorDark").value;
      if ($("storeType")) s.storeType = $("storeType").value;

      console.log("Submitting config for store:", currentStoreId);
      const res = await saveStoreConfig(currentStoreId, currentConfig);

      if (res.success) {
        alert("Changes saved to cloud successfully!");
      } else {
        alert("Error saving: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("A critical error occurred while saving: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  // RECOVERY BUTTON LOGIC
  $("migrateBtn").textContent = "Apply Blueprint Template";
  $("migrateBtn").onclick = async () => {
    const blueprintKeys = Object.keys(STORE_BLUEPRINTS);
    const choice = prompt(`Enter blueprint key to apply to current store (${currentStoreId}):\nOptions: ${blueprintKeys.join(', ')}`, 'bakerswholesale');

    if (!choice || !STORE_BLUEPRINTS[choice]) {
      if (choice) alert("Invalid blueprint key.");
      return;
    }

    if (!confirm(`This will OVERWRITE all products and branding for "${currentStoreId}" with the "${choice}" template. Proceed?`)) return;

    const blueprint = STORE_BLUEPRINTS[choice];
    const res = await saveStoreConfig(currentStoreId, blueprint);

    if (res.success) {
      alert("Blueprint applied! Refreshing...");
      window.location.reload();
    } else {
      alert("Error applying blueprint: " + res.error);
    }
  };

  $("logoutBtn").onclick = async () => { await logoutAdmin(); window.location.href = "/login.html"; };

  // REPAIR ALL STORES LOGIC
  $("repairAllBtn").onclick = async () => {
    if (!confirm("This will scan all your stores, ensure they follow the new schema, and REMOVE B2B/Wholesale items from B2C stores. Proceed?")) return;

    const user = auth.currentUser;
    if (!user) return alert("You must be logged in.");

    const stores = await getOwnedStores(user.uid);
    let count = 0;

    for (const s of stores) {
      const config = await getStoreData(s.id);
      if (config) {
        // Ensure storeType exists
        const type = config.store.storeType || "B2C";
        config.store.storeType = type;

        if (type === "B2C") {
          // Remove items in Wholesale category or with MOQ > 1 or with Bulk Pricing
          config.products = config.products.filter(p => {
            const isWholesaleCat = p.category?.toLowerCase() === "wholesale";
            const hasHighMOQ = p.moq > 1;
            const hasBulkPricing = p.bulkPricing && p.bulkPricing.length > 0;
            return !(isWholesaleCat || hasHighMOQ || hasBulkPricing);
          });

          // Remove "Wholesale" category from the categories list
          config.categories = (config.categories || []).filter(c => c.toLowerCase() !== "wholesale");
        } else {
          // For B2B, just ensure fields are present
          config.products = config.products.map(p => ({
            ...p,
            moq: p.moq || 1,
            bulkPricing: p.bulkPricing || []
          }));
        }

        await saveStoreConfig(s.id, config);
        count++;
      }
    }
    alert(`Successfully repaired and cleaned ${count} stores.`);
    window.location.reload();
  };
})();
