import { getStoreData, saveStoreConfig, uploadImageToCloud, onAuthChange, logoutAdmin, getStoreIdFromUrl, getOwnedStores, deleteStoreData } from "./firebase-service.js";
import { STORE_BLUEPRINTS } from "./blueprints.js";

let currentConfig = null;
let currentStoreId = getStoreIdFromUrl();
let currentUser = null;

const $ = (id) => document.getElementById(id);
const sidebarList = $('sidebarStoreList');
const adminForm = $('adminForm');
const welcomeState = $('welcomeState');
const viewStoreLink = $('viewStoreLink');
const sidebar = $('adminSidebar');
const layout = document.querySelector('.admin-layout');

// 1. AUTH & SIDEBAR INITIALIZATION
onAuthChange(async (user) => {
  if (!user) {
    window.location.href = `/login.html`;
  } else {
    currentUser = user;
    await refreshSidebar();

    // Load cached config if exists for instant feel
    const cached = localStorage.getItem(`config_${currentStoreId}`);
    if (cached) {
      currentConfig = JSON.parse(cached);
      renderForm();
      welcomeState.hidden = true;
      adminForm.hidden = false;
    }

    if (currentStoreId && currentStoreId !== 'demo' && currentStoreId !== 'admin') {
      fetchConfig(currentStoreId);
    }

    // Initial icons
    if (window.lucide) window.lucide.createIcons();
  }
});

// Mobile Menu Toggle
$('mobileMenuBtn').onclick = () => {
  sidebar.classList.toggle('open');
  layout.classList.toggle('sidebar-open');
};

// Close sidebar on layout click
layout.onclick = (e) => {
  if (e.target === layout && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    layout.classList.remove('sidebar-open');
  }
};

async function refreshSidebar() {
  const stores = await getOwnedStores(currentUser.uid);
  sidebarList.innerHTML = '';

  stores.forEach(s => {
    const btn = document.createElement('button');
    btn.className = `store-nav-item ${s.id === currentStoreId ? 'active' : ''}`;
    btn.innerHTML = `
      <div class="store-icon">${(s.name || s.id).charAt(0).toUpperCase()}</div>
      <div class="store-info">
        <strong>${s.name || s.id}</strong><br>
        <small>Catalog</small>
      </div>
      <button class="delete-store-btn" title="Delete Store" data-id="${s.id}">&times;</button>
    `;
    btn.onclick = (e) => {
      if (e.target.classList.contains('delete-store-btn')) return;

      const newUrl = `${window.location.pathname}?store=${s.id}`;
      window.history.pushState({path:newUrl},'',newUrl);
      currentStoreId = s.id;

      document.querySelectorAll('.store-nav-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');

      // Close sidebar on mobile
      sidebar.classList.remove('open');
      layout.classList.remove('sidebar-open');

      fetchConfig(s.id);
    };

    const delBtn = btn.querySelector('.delete-store-btn');
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      const id = e.target.dataset.id;
      if (confirm(`Delete store "${id}"? This cannot be undone.`)) {
        showToast(`Deleting...`);
        const result = await deleteStoreData(id);
        if (result.success) {
          showToast('Deleted');
          if (currentStoreId === id) window.location.search = '';
          else await refreshSidebar();
        }
      }
    };
    sidebarList.appendChild(btn);
  });
}

// 2. FETCH DATA WITH CACHING
async function fetchConfig(id) {
  // Only show toast if not already loaded from cache
  if (!currentConfig) showToast(`Loading...`);

  const freshData = await getStoreData(id);

  if (freshData) {
    currentConfig = freshData;
    localStorage.setItem(`config_${id}`, JSON.stringify(freshData));
    renderForm();
  } else if (!currentConfig) {
    showToast('Creating new store...');
    currentConfig = {
      store: { name: "New Store", whatsappNumber: "", accentColor: "#0f766e", accentColorDark: "#0d9488" },
      categories: ["All"],
      products: []
    };
    renderForm();
  }

  welcomeState.hidden = true;
  adminForm.hidden = false;
  viewStoreLink.hidden = false;
  viewStoreLink.href = `/${id}`;
}

// 3. RENDER UI
function renderForm() {
  $('name').value = currentConfig.store.name || '';
  $('tagline').value = currentConfig.store.tagline || '';
  $('whatsappNumber').value = currentConfig.store.whatsappNumber || '';
  $('currencySymbol').value = currentConfig.store.currencySymbol || '₹';
  $('accentColor').value = currentConfig.store.accentColor || '#d2691e';
  $('accentColorDark').value = currentConfig.store.accentColorDark || '#8b4513';

  renderCategories();
  renderProducts();
}

function renderCategories() {
  const list = $('categoriesList');
  list.innerHTML = '';
  currentConfig.categories.forEach((cat, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${cat}</span><button type="button" class="remove-cat-btn" data-index="${index}">&times;</button>`;
    list.appendChild(tag);
  });

  list.querySelectorAll('.remove-cat-btn').forEach(btn => {
    btn.onclick = () => {
      currentConfig.categories.splice(btn.dataset.index, 1);
      renderCategories();
    };
  });
}

function renderProducts() {
  const list = $('productsList');
  list.innerHTML = '';
  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product" data-index="${index}">Remove</button>
      <div class="form-row">
        <div class="form-group"><label>Base Price</label><input type="number" value="${prod.price}" class="p-price" data-index="${index}"></div>
        <div class="form-group"><label>MOQ (Min Order Qty)</label><input type="number" value="${prod.moq || 1}" class="p-moq" data-index="${index}"></div>
      </div>
      <div class="form-group"><label>Product Name</label><input type="text" value="${prod.name}" class="p-name" data-index="${index}"></div>
      <div class="form-row">
        <div class="form-group"><label>Base Price</label><input type="number" value="${prod.price}" class="p-price" data-index="${index}"></div>
        <div class="form-group"><label>MOQ (Min Order Qty)</label><input type="number" value="${prod.moq || 1}" class="p-moq" data-index="${index}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>SKU</label><input type="text" value="${prod.sku || ''}" class="p-sku" data-index="${index}"></div>
        <div class="form-group"><label>Pack Size</label><input type="text" value="${prod.packSize || ''}" class="p-pack" data-index="${index}"></div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select class="p-cat" data-index="${index}">
          ${currentConfig.categories.map(cat => `<option value="${cat}" ${prod.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Description</label><textarea class="p-desc" data-index="${index}">${prod.description || ''}</textarea></div>
      <div class="form-group">
        <label>Image</label>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <img src="${prod.image}" class="product-preview-img" id="prev-${index}">
          <input type="file" accept=".jpg,.jpeg,.png,.webp" class="p-upload" data-index="${index}">
        </div>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.p-name').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].name = e.target.value);
  list.querySelectorAll('.p-price').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].price = parseFloat(e.target.value));
  list.querySelectorAll('.p-moq').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].moq = parseInt(e.target.value));
  list.querySelectorAll('.p-sku').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].sku = e.target.value);
  list.querySelectorAll('.p-pack').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].packSize = e.target.value);
  list.querySelectorAll('.p-cat').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].category = e.target.value);
  list.querySelectorAll('.p-sku').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].sku = e.target.value);
  list.querySelectorAll('.p-pack').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].packSize = e.target.value);
  list.querySelectorAll('.p-cat').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].category = e.target.value);
  list.querySelectorAll('.p-desc').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].description = e.target.value);
  list.querySelectorAll('.p-upload').forEach(el => el.onchange = e => uploadImage(e.target.dataset.index, e.target.files[0]));
  list.querySelectorAll('.remove-product').forEach(btn => btn.onclick = e => {
    currentConfig.products.splice(btn.dataset.index, 1);
    renderProducts();
  });
}

// 4. ACTIONS
async function uploadImage(index, file) {
  if (!file) return;
  showToast('Uploading...');
  const res = await uploadImageToCloud(file);
  if (res.url) {
    currentConfig.products[index].image = res.url;
    document.getElementById(`prev-${index}`).src = res.url;
    showToast('Uploaded!');
  }
}

const handleCreate = () => {
  const id = prompt("Unique store ID (e.g. fashion-hub):");
  if (!id) return;
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const type = prompt("Template: gifting, crochet, bakers, wholesale, or food", "food");

  const blueprint = STORE_BLUEPRINTS[type.toLowerCase()] || STORE_BLUEPRINTS['gifting'];
  currentConfig = JSON.parse(JSON.stringify(blueprint));
  currentStoreId = cleanId;

  window.history.pushState({path: `${window.location.pathname}?store=${cleanId}`},'', `${window.location.pathname}?store=${cleanId}`);
  renderForm();
  welcomeState.hidden = true;
  adminForm.hidden = false;
  sidebar.classList.remove('open');
  layout.classList.remove('sidebar-open');
};

$('sidebarCreateBtn').onclick = $('mainCreateBtn').onclick = handleCreate;

adminForm.onsubmit = async (e) => {
  e.preventDefault();
  currentConfig.store.name = $('name').value;
  currentConfig.store.tagline = $('tagline').value;
  currentConfig.store.whatsappNumber = $('whatsappNumber').value;
  currentConfig.store.currencySymbol = $('currencySymbol').value;
  currentConfig.store.accentColor = $('accentColor').value;
  currentConfig.store.accentColorDark = $('accentColorDark').value;

  showToast('Saving...');
  const res = await saveStoreConfig(currentStoreId, currentConfig);
  if (res.success) {
    localStorage.setItem(`config_${currentStoreId}`, JSON.stringify(currentConfig));
    showToast('Saved!');
    await refreshSidebar();
  }
};

$('migrateBtn').onclick = async () => {
  if (confirm('Sync local template?')) {
    currentConfig = JSON.parse(JSON.stringify(window.STORE_CONFIG));
    await saveStoreConfig(currentStoreId, currentConfig);
    renderForm();
    showToast('Synced!');
  }
};

$('logoutBtn').onclick = async () => {
  await logoutAdmin();
  window.location.href = `/login.html`;
};

function showToast(msg) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast toast--show';
  setTimeout(() => toast.className = 'toast', 3000);
}
