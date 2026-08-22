import { getStoreData, getStoreIdFromUrl, onAuthChange } from "./firebase-service.js";
import { getEffectiveMOQ, calculateUnitPrice, calculateItemTotal } from "./utils/pricing.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

(async function () {
  "use strict";

  const storeId = getStoreIdFromUrl();
  const $ = (id) => document.getElementById(id);

  /* ---------- 1. Fetch Dynamic Config ---------- */
  let CFG = null;

  try {
    const data = await getStoreData(storeId);
    if (data) {
      CFG = data;
      initializeApp(CFG);
    } else if (STORE_BLUEPRINTS && STORE_BLUEPRINTS[storeId]) {
      CFG = STORE_BLUEPRINTS[storeId];
      initializeApp(CFG);
    } else {
      // Fallback to local config if cloud is empty
      CFG = window.STORE_CONFIG;
      if (CFG) initializeApp(CFG);
      else handleNotFound(storeId);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    if (STORE_BLUEPRINTS && STORE_BLUEPRINTS[storeId]) {
      CFG = STORE_BLUEPRINTS[storeId];
      initializeApp(CFG);
    } else {
      CFG = window.STORE_CONFIG;
      if (CFG) initializeApp(CFG);
      else handleNotFound(storeId);
    }
  }

  function handleNotFound(id) {
    document.body.innerHTML = `<div style="padding:4rem; text-align:center;"><h1>Store Not Found</h1><p>The store "${id}" does not exist.</p></div>`;
  }

  function initializeApp(config) {
    const { store, categories, products } = config;
    const CURRENCY = store.currencySymbol || "₹";
    const STORAGE_KEY = `cart_${storeId}`;
    const isBakeryStore = Boolean(store.isBakeryCustom || storeId === "richwhisk");

    /* ---------- 1.1 Auth Check for Preview Bar ---------- */
    const switcherBar = $("storeSwitcherBar");
    if (switcherBar) {
      // Hide by default
      switcherBar.style.display = "none";
      // Show only if admin is logged in
      onAuthChange((user) => {
        if (user) {
          switcherBar.style.display = "block";
        } else {
          switcherBar.style.display = "none";
        }
      });
    }

    /* ---------- 2. App state ---------- */
    let cart = loadCart();
    let activeCategory = categories[0] || "All";
    let searchQuery = "";

    // Cake Modal State
    let activeCustomProduct = null;
    let selectedWeight = "1 kg";
    let selectedWeightMult = 1.0;
    let selectedDietary = "Eggless";
    let selectedFlavor = "Belgium Chocolate Truffle";
    let selectedShape = "Round";
    let selectedShapeExtra = 0;
    let referenceFileName = "";

    /* ---------- 3. DOM refs ---------- */
    const brandLogo = $("brandLogo");
    const storeNameEl = $("storeName");
    const storeTaglineEl = $("storeTagline");
    const footerNameEl = $("footerName");
    const searchInput = $("searchInput");
    const cartBtn = $("cartBtn");
    const cartCount = $("cartCount");
    const pillsEl = $("categoryPills");
    const gridEl = $("productGrid");
    const cartPanel = $("cartPanel");
    const cartClose = $("cartClose");
    const cartItemsEl = $("cartItems");
    const cartTotalEl = $("cartTotal");
    const summaryCountEl = $("summaryCount");
    const summaryTotalEl = $("summaryTotal");
    const checkoutForm = $("checkoutForm");
    const toast = $("toast");

    // Modal DOM refs
    const cakeModalBackdrop = $("cakeModalBackdrop");
    const closeCakeModalBtn = $("closeCakeModalBtn");
    const cakeModalImg = $("cakeModalImg");
    const cakeModalName = $("cakeModalName");
    const cakeModalDesc = $("cakeModalDesc");
    const weightSelectorGrid = $("weightSelectorGrid");
    const cakeServesInfo = $("cakeServesInfo");
    const dietaryEgglessBtn = $("dietaryEgglessBtn");
    const dietaryEggBtn = $("dietaryEggBtn");
    const cakeFlavorSelect = $("cakeFlavorSelectVanilla");
    const customFlavorInput = $("customFlavorInputVanilla");
    const shapeSelectorGrid = $("shapeSelectorGrid");
    const cakeRefFileInput = $("cakeRefFileInput");
    const refUploadText = $("refUploadText");
    const cakeMessageInput = $("cakeMessageInput");
    const cakeNotesInput = $("cakeNotesInput");
    const cakeDynamicPrice = $("cakeDynamicPrice");
    const copyCakeSummaryBtn = $("copyCakeSummaryBtn");
    const sendCakeWhatsAppBtn = $("sendCakeWhatsAppBtn");
    const sendCakeWhatsAppBtnText = $("sendCakeWhatsAppBtnText");

    // Checkout Form refs
    const toggleNotesBtn = $("toggleNotesBtn");
    const notesContainer = $("notesContainer");

    /* ---------- 4. Helpers ---------- */
    const money = (n) => CURRENCY + Number(n).toLocaleString("en-IN");
    function loadCart() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
    function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
    function findProduct(id) { return products.find((p) => p.id === id); }

    function cartTotal() {
      return cart.reduce((s, i) => {
        const p = findProduct(i.id);
        if (!p) return s;
        const unitPrice = calculateUnitPrice(p, i.qty, store.storeType || "B2C");
        return s + (unitPrice * i.qty);
      }, 0);
    }

    function showToast(msg) {
      toast.textContent = msg;
      toast.hidden = false;
      toast.classList.add("toast--show");
      setTimeout(() => { toast.classList.remove("toast--show"); setTimeout(() => toast.hidden = true, 300); }, 2000);
    }

    /* ---------- 5. UI Logic ---------- */
    function applyBranding() {
      storeNameEl.textContent = store.name;
      storeTaglineEl.textContent = store.tagline || "";
      if (footerNameEl) footerNameEl.textContent = store.name;
      if (brandLogo) brandLogo.textContent = store.name.charAt(0).toUpperCase();
      document.documentElement.style.setProperty("--accent", store.accentColor || "#db2777");
      document.documentElement.style.setProperty("--accent-dark", store.accentColorDark || "#9d174d");
      document.title = `${store.name} — ${store.tagline || 'OrderSpot'}`;

      // Set checkout form placeholders for B2B vs standard stores
      const storeType = store.storeType || "B2C";
      const custName = $("custName");
      const custPhone = $("custPhone");
      const custAddress = $("custAddress");
      const custPin = $("custPin");
      const custNotes = $("custNotes");

      if (storeType === "B2B") {
        if (custName) custName.placeholder = "Business / Contact Name *";
        if (custPhone) custPhone.placeholder = "Phone Number *";
        if (custAddress) custAddress.placeholder = "Delivery Address / Warehouse Address *";
        if (custPin) custPin.placeholder = "Pincode / City *";
        if (custNotes) custNotes.placeholder = "Notes (GST No., PO Number, Delivery instructions, etc.)";
      } else if (isBakeryStore) {
        if (custName) custName.placeholder = "Your Name *";
        if (custPhone) custPhone.placeholder = "Phone Number *";
        if (custAddress) custAddress.placeholder = "Delivery Address *";
        if (custPin) custPin.placeholder = "Pincode / City *";
        if (custNotes) custNotes.placeholder = "Notes (delivery date, special instructions, celebration timing)";
      } else {
        if (custName) custName.placeholder = "Your Name *";
        if (custPhone) custPhone.placeholder = "Phone Number *";
        if (custAddress) custAddress.placeholder = "Delivery Address *";
        if (custPin) custPin.placeholder = "Pincode / City *";
        if (custNotes) custNotes.placeholder = "Notes for the artist (any custom colours, dates or gift message)";
      }

      // Highlight active switcher pill
      const switcherPills = document.querySelectorAll(".switcher-pill");
      switcherPills.forEach(pill => {
        const pStore = pill.getAttribute("data-store");
        if (pStore === storeId || (storeId === "demo" && pStore === "richwhisk")) {
          pill.classList.add("switcher-pill--active");
        } else {
          pill.classList.remove("switcher-pill--active");
        }
      });
    }

    function renderPills() {
      pillsEl.innerHTML = "";
      categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.className = "pill" + (cat === activeCategory ? " pill--active" : "");
        btn.textContent = cat;
        btn.onclick = () => { activeCategory = cat; renderPills(); renderGrid(); };
        pillsEl.appendChild(btn);
      });
    }

    function renderGrid() {
      gridEl.innerHTML = "";
      const storeType = store.storeType || "B2C";
      const q = searchQuery.trim().toLowerCase();

      const list = products.filter((p) => {
        const matchCat = activeCategory === "All" || p.category === activeCategory;
        const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
        return matchCat && matchQ;
      });

      const emptyEl = $("emptyState");
      if (list.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      list.forEach((p) => {
        const card = document.createElement("article");
        card.className = "card";
        const moq = getEffectiveMOQ(p, storeType);

        // Custom cake logic only applies to isBakeryStore items marked customizable
        const isCustom = isBakeryStore && Boolean(p.isCustomizable);

        let imgSrc = p.image || '';
        if (!imgSrc || imgSrc.includes('placehold.co')) {
          const bpMatch = STORE_BLUEPRINTS?.[storeId]?.products?.find(item => item.id === p.id || item.name?.toLowerCase() === p.name?.toLowerCase());
          if (bpMatch?.image) imgSrc = bpMatch.image;
        }
        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('/')) {
          imgSrc = '/' + imgSrc;
        }

        let bulkPricingHtml = '';
        if (storeType === 'B2B' && p.bulkPricing && p.bulkPricing.length > 0) {
          bulkPricingHtml = `
            <div class="bulk-pricing-table">
              <strong>Bulk Pricing:</strong><br>
              ${p.bulkPricing.map(t => `${t.minQty}+: ${money(t.price)}`).join('<br>')}
            </div>
          `;
        }

        card.innerHTML = `
          <div class="card__img-wrap">
            <img class="card__img" src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="if(!this.dataset.retry){this.dataset.retry='1';const fname=this.src.split('/').pop();this.src='/products/'+fname;}">
            ${storeType === 'B2B' && p.moq ? `<span class="card__badge">MOQ: ${p.moq}</span>` : (isCustom ? `<span class="card__badge" style="background:#db2777; color:#fff;">Customizable</span>` : '')}
          </div>
          <div class="card__body">
            <h3 class="card__title">${p.name}</h3>
            ${storeType === 'B2B' && p.sku ? `<p class="card__desc">SKU: ${p.sku}</p>` : (p.description ? `<p class="card__desc" style="font-size:0.8rem; color:#64748b; margin-top:2px;">${p.description}</p>` : '')}
            <p class="card__price">
              <span class="card__sell">${money(p.price)}</span>
              ${p.packSize ? `<span class="card__was" style="text-decoration:none">/ ${p.packSize}</span>` : ''}
            </p>
            ${bulkPricingHtml}
            <button class="card__add" style="${isCustom ? 'background: linear-gradient(135deg, #db2777, #ec4899);' : ''}">
              ${isCustom ? '✨ Customize & Order' : 'Add to Cart'}
            </button>
          </div>
        `;

        const btn = card.querySelector('.card__add');
        if (isCustom) {
          btn.onclick = (e) => { e.stopPropagation(); openCakeCustomModal(p); };
          card.onclick = () => openCakeCustomModal(p);
        } else {
          btn.onclick = (e) => { e.stopPropagation(); addToCart(p.id); };
        }

        gridEl.appendChild(card);
      });
    }

    /* ---------- 6. Custom Cake Ordering Logic ---------- */
    function openCakeCustomModal(prod) {
      activeCustomProduct = prod;
      let modalImgSrc = prod.image || '';
      if (!modalImgSrc || modalImgSrc.includes('placehold.co')) {
        const bpMatch = STORE_BLUEPRINTS?.[storeId]?.products?.find(item => item.id === prod.id || item.name?.toLowerCase() === prod.name?.toLowerCase());
        if (bpMatch?.image) modalImgSrc = bpMatch.image;
      }
      if (modalImgSrc && !modalImgSrc.startsWith('http') && !modalImgSrc.startsWith('data:') && !modalImgSrc.startsWith('/')) {
        modalImgSrc = '/' + modalImgSrc;
      }
      if (cakeModalImg) cakeModalImg.src = modalImgSrc;
      if (cakeModalName) cakeModalName.textContent = prod.name;
      if (cakeModalDesc) cakeModalDesc.textContent = prod.description || "Customizable handcrafted cake.";

      // Reset options
      selectedWeight = "1 kg";
      selectedWeightMult = 1.0;
      selectedDietary = "Eggless";
      selectedFlavor = prod.flavors?.[0] || "Belgium Chocolate Truffle";
      selectedShape = "Round";
      selectedShapeExtra = 0;
      referenceFileName = "";

      if (cakeMessageInput) cakeMessageInput.value = "";
      if (cakeNotesInput) cakeNotesInput.value = "";
      if (refUploadText) refUploadText.textContent = "Click to upload reference photo";
      if (customFlavorInput) {
        customFlavorInput.style.display = "none";
        customFlavorInput.value = "";
      }

      // Populate flavors if custom product has specific flavors
      if (cakeFlavorSelect && prod.flavors && Array.isArray(prod.flavors)) {
        cakeFlavorSelect.innerHTML = "";
        prod.flavors.forEach(flv => {
          const opt = document.createElement("option");
          opt.value = flv;
          opt.textContent = flv;
          cakeFlavorSelect.appendChild(opt);
        });
        if (!prod.flavors.includes("Custom Flavor Request")) {
          const customOpt = document.createElement("option");
          customOpt.value = "Custom Flavor Request";
          customOpt.textContent = "Custom Flavor Request";
          cakeFlavorSelect.appendChild(customOpt);
        }
      }

      // Reset Weight Buttons
      if (weightSelectorGrid) {
        const wBtns = weightSelectorGrid.querySelectorAll(".weight-btn");
        wBtns.forEach(btn => {
          btn.classList.toggle("weight-btn--active", btn.getAttribute("data-weight") === selectedWeight);
        });
      }

      // Reset Shape Buttons
      if (shapeSelectorGrid) {
        const sBtns = shapeSelectorGrid.querySelectorAll(".shape-btn");
        sBtns.forEach(btn => {
          btn.classList.toggle("shape-btn--active", btn.getAttribute("data-shape") === selectedShape);
        });
      }

      updateDietaryUI();
      recalculateCakePrice();

      if (cakeModalBackdrop) {
        cakeModalBackdrop.classList.add("cake-modal--open");
        cakeModalBackdrop.setAttribute("aria-hidden", "false");
      }
    }

    function closeCakeCustomModal() {
      if (cakeModalBackdrop) {
        cakeModalBackdrop.classList.remove("cake-modal--open");
        cakeModalBackdrop.setAttribute("aria-hidden", "true");
      }
    }

    function updateDietaryUI() {
      if (dietaryEgglessBtn) dietaryEgglessBtn.classList.toggle("dietary-btn--active", selectedDietary === "Eggless");
      if (dietaryEggBtn) dietaryEggBtn.classList.toggle("dietary-btn--active", selectedDietary === "Egg");
    }

    function recalculateCakePrice() {
      if (!activeCustomProduct) return;
      const base = activeCustomProduct.price || 1450;
      const isEggless = selectedDietary === "Eggless";
      const egglessFee = isEggless ? 50 : 0;

      const isQuote = selectedWeight === "Custom Size" || selectedFlavor === "Custom Flavor Request";

      if (isQuote || selectedWeightMult === null) {
        if (cakeDynamicPrice) cakeDynamicPrice.textContent = "Quote on Request";
        if (sendCakeWhatsAppBtnText) sendCakeWhatsAppBtnText.textContent = "Request Custom Quote on WhatsApp";
      } else {
        const total = Math.round(base * selectedWeightMult) + egglessFee + selectedShapeExtra;
        if (cakeDynamicPrice) cakeDynamicPrice.textContent = money(total);
        if (sendCakeWhatsAppBtnText) sendCakeWhatsAppBtnText.textContent = "Send Custom Request on WhatsApp";
      }
    }

    function generateCakeWhatsAppMessage() {
      if (!activeCustomProduct) return "";
      const base = activeCustomProduct.price || 1450;
      const egglessFee = selectedDietary === "Eggless" ? 50 : 0;
      const isQuote = selectedWeight === "Custom Size" || selectedFlavor === "Custom Flavor Request";
      const estTotal = isQuote 
        ? "Custom Quote Requested" 
        : money(Math.round(base * (selectedWeightMult || 1.0)) + egglessFee + selectedShapeExtra);

      const msgOnCake = cakeMessageInput?.value?.trim() || "None / To be decided";
      const specialNotes = cakeNotesInput?.value?.trim() || "Standard bakery finishing";
      const finalFlavor = selectedFlavor === "Custom Flavor Request" && customFlavorInput?.value?.trim()
        ? `Custom: ${customFlavorInput.value.trim()}`
        : selectedFlavor;

      return [
        `🎂 *NEW CUSTOM CAKE INQUIRY - ${store.name.toUpperCase()}* 🎂`,
        ``,
        `*Product:* ${activeCustomProduct.name}`,
        `*Weight:* ${selectedWeight}`,
        `*Type:* ${selectedDietary}`,
        `*Flavor:* ${finalFlavor}`,
        `*Shape:* ${selectedShape}`,
        `*Message on Cake:* "${msgOnCake}"`,
        `*Special Notes:* ${specialNotes}`,
        `*Attached Reference Photo:* ${referenceFileName ? referenceFileName + ' (Attached in chat)' : 'Standard design'}`,
        ``,
        `*Estimated Price:* ${estTotal}`,
        ``,
        `_Please confirm availability and custom order slot!_`
      ].join("\n");
    }

    // Modal Event Listeners
    if (closeCakeModalBtn) closeCakeModalBtn.onclick = closeCakeCustomModal;
    if (cakeModalBackdrop) {
      cakeModalBackdrop.onclick = (e) => {
        if (e.target === cakeModalBackdrop) closeCakeCustomModal();
      };
    }

    if (weightSelectorGrid) {
      weightSelectorGrid.onclick = (e) => {
        const btn = e.target.closest(".weight-btn");
        if (!btn) return;
        selectedWeight = btn.getAttribute("data-weight");
        const multAttr = btn.getAttribute("data-mult");
        selectedWeightMult = multAttr === "null" ? null : parseFloat(multAttr);

        weightSelectorGrid.querySelectorAll(".weight-btn").forEach(b => b.classList.remove("weight-btn--active"));
        btn.classList.add("weight-btn--active");

        if (cakeServesInfo) {
          if (selectedWeight === "0.5 kg") cakeServesInfo.textContent = "4-6 Portions";
          else if (selectedWeight === "1 kg") cakeServesInfo.textContent = "8-10 Portions";
          else if (selectedWeight === "1.5 kg") cakeServesInfo.textContent = "12-15 Portions";
          else if (selectedWeight === "2 kg") cakeServesInfo.textContent = "18-20 Portions";
          else cakeServesInfo.textContent = "Multi-tier / Large Event";
        }
        recalculateCakePrice();
      };
    }

    if (dietaryEgglessBtn) {
      dietaryEgglessBtn.onclick = () => {
        selectedDietary = "Eggless";
        updateDietaryUI();
        recalculateCakePrice();
      };
    }

    if (dietaryEggBtn) {
      dietaryEggBtn.onclick = () => {
        selectedDietary = "Egg";
        updateDietaryUI();
        recalculateCakePrice();
      };
    }

    if (cakeFlavorSelect) {
      cakeFlavorSelect.onchange = (e) => {
        selectedFlavor = e.target.value;
        if (customFlavorInput) {
          customFlavorInput.style.display = selectedFlavor === "Custom Flavor Request" ? "block" : "none";
        }
        recalculateCakePrice();
      };
    }

    if (shapeSelectorGrid) {
      shapeSelectorGrid.onclick = (e) => {
        const btn = e.target.closest(".shape-btn");
        if (!btn) return;
        selectedShape = btn.getAttribute("data-shape");
        selectedShapeExtra = parseInt(btn.getAttribute("data-extra") || "0", 10);

        shapeSelectorGrid.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("shape-btn--active"));
        btn.classList.add("shape-btn--active");
        recalculateCakePrice();
      };
    }

    if (cakeRefFileInput) {
      cakeRefFileInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          referenceFileName = file.name;
          if (refUploadText) refUploadText.textContent = `✓ ${file.name}`;
          const reader = new FileReader();
          reader.onload = (re) => {
            if (cakeModalImg) cakeModalImg.src = re.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
    }

    if (copyCakeSummaryBtn) {
      copyCakeSummaryBtn.onclick = () => {
        const text = generateCakeWhatsAppMessage();
        navigator.clipboard.writeText(text);
        showToast("Inquiry text copied!");
      };
    }

    if (sendCakeWhatsAppBtn) {
      sendCakeWhatsAppBtn.onclick = () => {
        const text = generateCakeWhatsAppMessage();
        window.open(`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
      };
    }

    // Checkout Form Event Listeners
    if (toggleNotesBtn) {
      toggleNotesBtn.onclick = () => {
        const isHidden = notesContainer.hidden;
        notesContainer.hidden = !isHidden;
        toggleNotesBtn.textContent = isHidden ? "- Hide Order Note" : "+ Add Order Note / PO Number";
      };
    }

    function addToCart(id) {
      const p = findProduct(id);
      const storeType = store.storeType || 'B2C';
      const moq = getEffectiveMOQ(p, storeType);

      const item = cart.find(i => i.id === id);
      if (item) {
        item.qty++;
      } else {
        cart.push({ id, qty: moq });
      }
      saveCart();
      updateBadge();
      showToast(item ? "Updated cart quantity" : "Added to cart");
    }

    function updateBadge() {
      const count = cart.reduce((s, i) => s + i.qty, 0);
      cartCount.textContent = count;
      cartCount.hidden = count === 0;
    }

    function updateCartQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (!item) return;
      const p = findProduct(id);
      const moq = getEffectiveMOQ(p, store.storeType || 'B2C');
      item.qty += delta;
      if (item.qty < moq) {
        if (delta < 0) {
          cart = cart.filter(i => i.id !== id);
        } else {
          item.qty = moq;
        }
      }
      saveCart();
      renderCart();
      updateBadge();
    }
    window.updateQty = updateCartQty;

    function renderCart() {
      cartItemsEl.innerHTML = "";
      const storeType = store.storeType || "B2C";

      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="cart__empty">Your cart is empty</div>';
        if (cartTotalEl) cartTotalEl.textContent = money(0);
        if (summaryTotalEl) summaryTotalEl.textContent = money(0);
        if (summaryCountEl) summaryCountEl.textContent = "0";
        return;
      }

      cart.forEach((i) => {
        const p = findProduct(i.id);
        if (!p) return;

        const unitPrice = calculateUnitPrice(p, i.qty, storeType);
        const itemTotal = unitPrice * i.qty;
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <img src="${p.image}" class="cart-item__img" alt="${p.name}">
          <div class="cart-item__info">
            <h4 class="cart-item__name">${p.name}</h4>
            <div class="cart-item__sub">${money(unitPrice)} / unit</div>
            ${storeType === 'B2B' && p.sku ? `<div class="cart-item__sub">SKU: ${p.sku}</div>` : ''}
          </div>
          <div class="cart-item__total">${money(itemTotal)}</div>
          <div class="qty">
            <button class="qty__btn" type="button" onclick="window.updateQty('${i.id}', -1)">−</button>
            <span class="qty__num">${i.qty}</span>
            <button class="qty__btn" type="button" onclick="window.updateQty('${i.id}', 1)">+</button>
          </div>
          <button class="cart-item__remove" type="button" onclick="window.updateQty('${i.id}', -${i.qty})">Remove</button>
        `;
        cartItemsEl.appendChild(row);
      });

      const total = cartTotal();
      if (cartTotalEl) cartTotalEl.textContent = money(total);
      if (summaryTotalEl) summaryTotalEl.textContent = money(total);
      if (summaryCountEl) summaryCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
    }

    function placeOrder(e) {
      e.preventDefault();
      const storeType = store.storeType || "B2C";

      if (!cart.length) {
        showToast("Your cart is empty");
        return;
      }

      const name = $("custName")?.value.trim();
      const phone = $("custPhone")?.value.trim();
      const address = $("custAddress")?.value.trim();
      const pin = $("custPin")?.value.trim();
      const date = $("deliveryDate")?.value;
      const gstin = $("gstin")?.value.trim();
      const notes = $("custNotes")?.value.trim();

      if (!name || !phone || !address || !pin || !date) {
        showToast("Please fill all required details");
        return;
      }

      if (storeType === 'B2B') {
        for (const item of cart) {
          const p = findProduct(item.id);
          const moq = getEffectiveMOQ(p, storeType);
          if (item.qty < moq) {
            showToast(`Minimum order for ${p.name} is ${moq}`);
            return;
          }
        }
      }

      const lines = cart.map(i => {
        const p = findProduct(i.id);
        const unitPrice = calculateUnitPrice(p, i.qty, storeType);
        let line = `- ${p.name}`;
        if (p.sku) line += ` [${p.sku}]`;
        line += ` x ${i.qty} @ ${money(unitPrice)} = ${money(unitPrice * i.qty)}`;
        return line;
      });

      const orderTitle = storeType === 'B2B'
        ? `New Wholesale B2B Order from ${store.name}:`
        : `New Order from ${store.name}:`;

      const text = [
        orderTitle,
        ``,
        lines.join("\n"),
        ``,
        `Total: ${money(cartTotal())}`,
        ``,
        `Customer Details:`,
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Delivery Date: ${date}`,
        `GSTIN: ${gstin || "N/A"}`,
        `Address: ${address}`,
        `Pincode: ${pin}`,
        notes ? `Notes: ${notes}` : ""
      ].filter(Boolean).join("\n");

      window.open(`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
    }

    /* ---------- Init ---------- */
    searchInput.oninput = () => { searchQuery = searchInput.value; renderGrid(); };
    cartBtn.onclick = () => { renderCart(); cartPanel.classList.add("cart--open"); };
    cartClose.onclick = () => cartPanel.classList.remove("cart--open");
    checkoutForm.onsubmit = placeOrder;
    applyBranding(); renderPills(); renderGrid(); updateBadge();
  }
})();

