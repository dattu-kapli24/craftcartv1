/* =============================================================
 *  app.js — Core logic for the WhatsApp E-Commerce Store.
 *  Reads STORE_CONFIG, renders UI, manages cart in localStorage,
 *  and builds the WhatsApp checkout link.
 *  Pure vanilla JS. No frameworks, no build step.
 * ============================================================= */

(function () {
  "use strict";

  /* ---------- 1. Read config ---------- */
  const CFG = window.STORE_CONFIG;
  if (!CFG) {
    document.body.innerHTML = "<p style='padding:2rem;font-family:sans-serif'>Missing <code>store-config.js</code>.</p>";
    return;
  }

  const { store, categories, products } = CFG;
  const CURRENCY = store.currencySymbol || "₹";
  const STORAGE_KEY = "wa_store_cart_v1";

  /* ---------- 2. App state ---------- */
  let cart = loadCart();          // [{id, qty}]
  let activeCategory = categories[0] || "All";
  let searchQuery = "";

  /* ---------- 3. DOM refs ---------- */
  const $ = (id) => document.getElementById(id);
  const brandLogo = $("brandLogo");
  const storeNameEl = $("storeName");
  const storeTaglineEl = $("storeTagline");
  const footerNameEl = $("footerName");
  const searchInput = $("searchInput");
  const cartBtn = $("cartBtn");
  const cartCount = $("cartCount");
  const pillsEl = $("categoryPills");
  const gridEl = $("productGrid");
  const gridTitle = $("gridTitle");
  const gridCount = $("gridCount");
  const emptyState = $("emptyState");
  const overlay = $("overlay");
  const cartPanel = $("cartPanel");
  const cartClose = $("cartClose");
  const cartItemsEl = $("cartItems");
  const cartFoot = $("cartFoot");
  const cartTotalEl = $("cartTotal");
  const checkoutForm = $("checkoutForm");
  const custName = $("custName");
  const custAddress = $("custAddress");
  const custPin = $("custPin");
  const placeOrderBtn = $("placeOrderBtn");
  const toast = $("toast");
  const header = $("header");

  /* ---------- 4. Helpers ---------- */
  const money = (n) => CURRENCY + Number(n).toLocaleString("en-IN");

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }
  function findProduct(id) {
    return products.find((p) => p.id === id);
  }
  function cartQty() {
    return cart.reduce((s, i) => s + i.qty, 0);
  }
  function cartTotal() {
    return cart.reduce((s, i) => {
      const p = findProduct(i.id);
      return p ? s + p.price * i.qty : s;
    }, 0);
  }
  function discountPct(p) {
    if (!p.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }

  /* ---------- 5. Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("toast--show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("toast--show");
      setTimeout(() => { toast.hidden = true; }, 250);
    }, 1800);
  }

  /* ---------- 6. Apply branding ---------- */
  function applyBranding() {
    storeNameEl.textContent = store.name;
    storeTaglineEl.textContent = store.tagline;
    footerNameEl.textContent = store.name;
    brandLogo.textContent = store.name.charAt(0).toUpperCase();
    document.documentElement.style.setProperty("--accent", store.accentColor);
    document.documentElement.style.setProperty("--accent-dark", store.accentColorDark || store.accentColor);
    document.title = store.name + " — Shop via WhatsApp";
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", store.accentColor);
  }

  /* ---------- 7. Render category pills ---------- */
  function renderPills() {
    pillsEl.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "pill" + (cat === activeCategory ? " pill--active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderPills();
        renderGrid();
      });
      pillsEl.appendChild(btn);
    });
  }

  /* ---------- 8. Render product grid ---------- */
  function visibleProducts() {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = activeCategory === "All" || p.category === activeCategory;
      const inSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }

  function renderGrid() {
    const list = visibleProducts();
    gridTitle.textContent = activeCategory === "All" ? "All Products" : activeCategory;
    gridCount.textContent = list.length ? `${list.length} item${list.length > 1 ? "s" : ""}` : "";
    gridEl.innerHTML = "";

    if (!list.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card" + (p.inStock ? "" : " card--out");

      const off = discountPct(p);
      const imgWrap = document.createElement("div");
      imgWrap.className = "card__img-wrap";
      const img = document.createElement("img");
      img.className = "card__img";
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      imgWrap.appendChild(img);

      if (off > 0) {
        const badge = document.createElement("span");
        badge.className = "card__badge";
        badge.textContent = off + "% OFF";
        imgWrap.appendChild(badge);
      }
      if (!p.inStock) {
        const sold = document.createElement("span");
        sold.className = "card__soldout";
        sold.textContent = "Sold Out";
        imgWrap.appendChild(sold);
      }

      const body = document.createElement("div");
      body.className = "card__body";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = p.name;

      const desc = document.createElement("p");
      desc.className = "card__desc";
      desc.textContent = p.description;

      const priceRow = document.createElement("div");
      priceRow.className = "card__price";
      const sell = document.createElement("span");
      sell.className = "card__sell";
      sell.textContent = money(p.price);
      priceRow.appendChild(sell);
      if (p.originalPrice && p.originalPrice > p.price) {
        const was = document.createElement("span");
        was.className = "card__was";
        was.textContent = money(p.originalPrice);
        priceRow.appendChild(was);
      }

      const addBtn = document.createElement("button");
      addBtn.className = "card__add";
      addBtn.textContent = "Add to Cart";
      if (!p.inStock) {
        addBtn.disabled = true;
        addBtn.textContent = "Sold Out";
      } else {
        addBtn.addEventListener("click", () => addToCart(p.id));
      }

      body.append(title, desc, priceRow, addBtn);
      card.append(imgWrap, body);
      gridEl.appendChild(card);
    });
  }

  /* ---------- 9. Cart operations ---------- */
  function addToCart(id) {
    const item = cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart();
    updateCartBadge();
    const p = findProduct(id);
    showToast(p ? p.name + " added to cart" : "Added to cart");
  }

  function changeQty(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    }
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function updateCartBadge() {
    const q = cartQty();
    cartCount.textContent = q;
    cartCount.hidden = q === 0;
  }

  /* ---------- 10. Render cart panel ---------- */
  function renderCart() {
    cartItemsEl.innerHTML = "";
    if (!cart.length) {
      cartFoot.style.display = "none";
      return;
    }
    cartFoot.style.display = "";

    cart.forEach((i) => {
      const p = findProduct(i.id);
      if (!p) return;
      const row = document.createElement("div");
      row.className = "cart-item";

      const img = document.createElement("img");
      img.className = "cart-item__img";
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";

      const info = document.createElement("div");
      info.className = "cart-item__info";

      const name = document.createElement("div");
      name.className = "cart-item__name";
      name.textContent = p.name;

      const sub = document.createElement("div");
      sub.className = "cart-item__sub";
      sub.textContent = money(p.price) + " each";

      const qty = document.createElement("div");
      qty.className = "qty";
      const minus = document.createElement("button");
      minus.className = "qty__btn";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease quantity");
      minus.addEventListener("click", () => changeQty(i.id, -1));
      const num = document.createElement("span");
      num.className = "qty__num";
      num.textContent = i.qty;
      const plus = document.createElement("button");
      plus.className = "qty__btn";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase quantity");
      plus.addEventListener("click", () => changeQty(i.id, 1));
      qty.append(minus, num, plus);

      const lineTotal = document.createElement("div");
      lineTotal.className = "cart-item__total";
      lineTotal.textContent = money(p.price * i.qty);

      const remove = document.createElement("button");
      remove.className = "cart-item__remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + p.name);
      remove.addEventListener("click", () => removeItem(i.id));

      info.append(name, sub, qty);
      row.append(img, info, lineTotal, remove);
      cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = money(cartTotal());
  }

  /* ---------- 11. Cart open/close ---------- */
  function openCart() {
    renderCart();
    overlay.hidden = false;
    cartPanel.classList.add("cart--open");
    cartPanel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    overlay.hidden = true;
    cartPanel.classList.remove("cart--open");
    cartPanel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------- 12. WhatsApp checkout ---------- */
  function placeOrder(e) {
    e.preventDefault();
    if (!cart.length) { showToast("Your cart is empty"); return; }

    const name = custName.value.trim();
    const address = custAddress.value.trim();
    const pin = custPin.value.trim();

    if (!name || !address || !pin) {
      showToast("Please fill all delivery details");
      return;
    }

    const lines = cart.map((i) => {
      const p = findProduct(i.id);
      const sub = p.price * i.qty;
      return `- ${p.name} x ${i.qty} = ${money(sub)}`;
    });

    const text =
      `Hello ${store.name}, I would like to place an order:\n` +
      `--------------------------\n` +
      lines.join("\n") + "\n" +
      `--------------------------\n` +
      `Total Amount: ${money(cartTotal())}\n` +
      `Delivery Details:\n` +
      `Name: ${name}\n` +
      `Address: ${address}\n` +
      `Pincode: ${pin}`;

    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  /* ---------- 13. Search ---------- */
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      renderGrid();
    }, 120);
  });

  /* ---------- 14. Sticky header shadow on scroll ---------- */
  window.addEventListener("scroll", () => {
    header.classList.toggle("header--scrolled", window.scrollY > 8);
  }, { passive: true });

  /* ---------- 15. Wire up events ---------- */
  cartBtn.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });
  checkoutForm.addEventListener("submit", placeOrder);

  /* ---------- 16. Init ---------- */
  applyBranding();
  renderPills();
  renderGrid();
  updateCartBadge();
})();
