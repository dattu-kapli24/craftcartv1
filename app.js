import { getStoreData, getStoreIdFromUrl } from "./firebase-service.js";
import { getEffectiveMOQ, calculateUnitPrice, calculateItemTotal } from "./utils/pricing.js";

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
    } else {
      // Fallback to local config if cloud is empty
      CFG = window.STORE_CONFIG;
      if (CFG) initializeApp(CFG);
      else handleNotFound(storeId);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    CFG = window.STORE_CONFIG;
    if (CFG) initializeApp(CFG);
    else handleNotFound(storeId);
  }

  function handleNotFound(id) {
    document.body.innerHTML = `<div style="padding:4rem; text-align:center;"><h1>Store Not Found</h1><p>The store "${id}" does not exist.</p></div>`;
  }

  function initializeApp(config) {
    const { store, categories, products } = config;
    const CURRENCY = store.currencySymbol || "₹";
    const STORAGE_KEY = `cart_${storeId}`;

    /* ---------- 2. App state ---------- */
    let cart = loadCart();
    let activeCategory = categories[0] || "All";
    let searchQuery = "";

    /* ---------- 3. DOM refs ---------- */
    const brandLogo = $("brandLogo");
    const storeNameEl = $("storeName");
    const storeTaglineEl = $("storeTagline");
    const searchInput = $("searchInput");
    const cartBtn = $("cartBtn");
    const cartCount = $("cartCount");
    const pillsEl = $("categoryPills");
    const gridEl = $("productGrid");
    const cartPanel = $("cartPanel");
    const cartClose = $("cartClose");
    const cartItemsEl = $("cartItems");
    const cartTotalEl = $("cartTotal");
    const checkoutForm = $("checkoutForm");
    const toast = $("toast");

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
      if (brandLogo) brandLogo.textContent = store.name.charAt(0).toUpperCase();
      document.documentElement.style.setProperty("--accent", store.accentColor);
      document.title = `${store.name} — OrderSpot`;
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
      const q = searchQuery.toLowerCase();
      const list = products.filter(p => (activeCategory === "All" || p.category === activeCategory) && p.name.toLowerCase().includes(q));
      gridEl.innerHTML = "";
      const storeType = store.storeType || 'B2C';

      list.forEach(p => {
        const card = document.createElement("article");
        card.className = "card";
        const moq = getEffectiveMOQ(p, storeType);

        let bulkPricingHtml = '';
        if (storeType === 'B2B' && p.bulkPricing) {
          bulkPricingHtml = `
            <div class="bulk-pricing-table">
              <strong>Bulk Pricing:</strong><br>
              ${p.bulkPricing.map(t => `${t.minQty}+: ${money(t.price)}`).join('<br>')}
            </div>
          `;
        }

        card.innerHTML = `
          <div class="card__img-wrap">
            <img class="card__img" src="${p.image}" alt="${p.name}">
            ${storeType === 'B2B' && p.moq ? `<span class="card__badge">MOQ: ${p.moq}</span>` : ''}
          </div>
          <div class="card__body">
            <h3 class="card__title">${p.name}</h3>
            ${p.sku ? `<p class="card__desc">SKU: ${p.sku}</p>` : ''}
            <p class="card__price">
              <span class="card__sell">${money(p.price)}</span>
              ${p.packSize ? `<span class="card__was" style="text-decoration:none">/ ${p.packSize}</span>` : ''}
            </p>
            ${bulkPricingHtml}
            <button class="card__add">Add to Cart</button>
          </div>
        `;
        card.querySelector('button').onclick = () => addToCart(p.id);
        gridEl.appendChild(card);
      });
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

    function updateBadge() {
      const qty = cart.reduce((s, i) => s + i.qty, 0);
      cartCount.textContent = qty;
      cartCount.hidden = qty === 0;
    }

    function renderCart() {
      cartItemsEl.innerHTML = "";
      const storeType = store.storeType || "B2C";

      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="cart__empty">Your cart is empty</div>';
        cartTotalEl.textContent = money(0);
        return;
      }

      cart.forEach(i => {
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
            <button class="qty__btn" onclick="window.updateQty('${i.id}', -1)">−</button>
            <span class="qty__num">${i.qty}</span>
            <button class="qty__btn" onclick="window.updateQty('${i.id}', 1)">+</button>
          </div>
          <button class="cart-item__remove" onclick="window.updateQty('${i.id}', -${i.qty})">Remove</button>
        `;
        cartItemsEl.appendChild(row);
      });
      cartTotalEl.textContent = money(cartTotal());
    }

    function placeOrder(e) {
      e.preventDefault();
      const storeType = store.storeType || "B2C";

      // MOQ Validation
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

      const text = `New Order from ${store.name} (${storeType}):\n\n${lines.join("\n")}\n\nTotal: ${money(cartTotal())}\n\nCustomer Details:\nName: ${$("custName").value}\nPhone: ${$("custPhone").value}\nAddress: ${$("custAddress").value}\nNotes: ${$("custNotes").value}`;

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
