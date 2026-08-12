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

// 1. AUTH & INITIALIZATION
onAuthChange(async (user) => {
  if (!user) {
    window.location.href = `/login.html`;
  } else {
    currentUser = user;
    await refreshSidebar();

    // Auto-load if store is in URL
    if (currentStoreId && currentStoreId !== 'demo' && currentStoreId !== 'admin') {
      fetchConfig(currentStoreId);
    }
    if (window.lucide) window.lucide.createIcons();
  }
});

// Mobile Toggle Fix
$('mobileMenuBtn').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  layout.classList.toggle('sidebar-open');
});

async function refreshSidebar() {
  const stores = await getOwnedStores(currentUser.uid);
  sidebarList.innerHTML = '';

  stores.forEach(s => {
    const btn = document.createElement('button');
    btn.className = `store-nav-item ${s.id === currentStoreId ? 'active' : ''}`;
    btn.innerHTML = `
      <div class="store-icon">${(s.name || s.id).charAt(0).toUpperCase()}</div>
      <div class="store-info">
        <strong>${s.name || s.id}</strong><br><small>Catalog</small>
      </div>
      <span class="delete-store-btn" data-id="${s.id}">&times;</span>
    `;
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-store-btn')) {
        handleDelete(e.target.dataset.id);
        return;
      }
      selectStore(s.id);
    });
    sidebarList.appendChild(btn);
  });
}

function selectStore(id) {
  const newUrl = `${window.location.pathname}?store=${id}`;
  window.history.pushState({path:newUrl},'',newUrl);
  currentStoreId = id;
  sidebar.classList.remove('open');
  layout.classList.remove('sidebar-open');
  fetchConfig(id);
}

async function handleDelete(id) {
  if (confirm(`Delete store "${id}"?`)) {
    showToast('Deleting...');
    const res = await deleteStoreData(id);
    if (res.success) {
      showToast('Deleted');
      if (currentStoreId === id) window.location.search = '';
      else await refreshSidebar();
    }
  }
}

// 2. DATA FETCHING (FAST LOAD)
async function fetchConfig(id) {
  // Use cached data for instant display
  const cached = localStorage.getItem(`config_${id}`);
  if (cached) {
    currentConfig = JSON.parse(cached);
    renderForm();
    showEditor();
  }

  const freshData = await getStoreData(id);
  if (freshData) {
    currentConfig = freshData;
    localStorage.setItem(`config_${id}`, JSON.stringify(freshData));
    renderForm();
    showEditor();
  } else if (!cached) {
    showToast('Initializing store...');
    currentConfig = { store: { name: id }, categories: ["All"], products: [] };
    renderForm();
    showEditor();
  }
}

function showEditor() {
  welcomeState.hidden = true;
  adminForm.hidden = false;
  viewStoreLink.hidden = false;
  viewStoreLink.href = `/${currentStoreId}`;
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
    tag.innerHTML = `<span>${cat}</span><button type="button" class="remove-cat" data-index="${index}">&times;</button>`;
    list.appendChild(tag);
  });
  list.querySelectorAll('.remove-cat').forEach(b => b.addEventListener('click', () => {
    currentConfig.categories.splice(b.dataset.index, 1);
    renderCategories();
  }));
}

function renderProducts() {
  const list = $('productsList');
  list.innerHTML = '';
  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product" data-index="${index}">Remove</button>
      <div class="form-group"><label>Name</label><input type="text" value="${prod.name}" class="p-name" data-index="${index}"></div>
      <div class="form-row">
        <div class="form-group"><label>Price</label><input type="number" value="${prod.price}" class="p-price" data-index="${index}"></div>
        <div class="form-group"><label>MOQ</label><input type="number" value="${prod.moq || 1}" class="p-moq" data-index="${index}"></div>
      </div>
      <div class="form-group"><label>Image URL</label><input type="text" value="${prod.image}" class="p-img" data-index="${index}"></div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.p-name').forEach(el => el.addEventListener('change', e => currentConfig.products[e.target.dataset.index].name = e.target.value));
  list.querySelectorAll('.p-price').forEach(el => el.addEventListener('change', e => currentConfig.products[e.target.dataset.index].price = parseFloat(e.target.value)));
  list.querySelectorAll('.p-moq').forEach(el => el.addEventListener('change', e => currentConfig.products[e.target.dataset.index].moq = parseInt(e.target.value)));
  list.querySelectorAll('.p-img').forEach(el => el.addEventListener('change', e => currentConfig.products[e.target.dataset.index].image = e.target.value));
}

// 4. BUTTON ACTIONS
$('addProductBtn').addEventListener('click', () => {
  currentConfig.products.push({ id: Date.now(), name: 'New Item', price: 0, category: 'All', inStock: true });
  renderProducts();
});

$('addCategoryBtn').addEventListener('click', () => {
  const val = $('newCategory').value.trim();
  if (val && !currentConfig.categories.includes(val)) {
    currentConfig.categories.push(val);
    $('newCategory').value = '';
    renderCategories();
  }
});

adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentConfig.store.name = $('name').value;
  currentConfig.store.whatsappNumber = $('whatsappNumber').value;
  currentConfig.store.accentColor = $('accentColor').value;
  currentConfig.store.accentColorDark = $('accentColorDark').value;
  showToast('Saving...');
  const res = await saveStoreConfig(currentStoreId, currentConfig);
  if (res.success) {
    localStorage.setItem(`config_${currentStoreId}`, JSON.stringify(currentConfig));
    showToast('Saved!');
    await refreshSidebar();
  }
});

const handleCreate = () => {
  const id = prompt("Unique ID (e.g. fashion):");
  if (!id) return;
  const type = prompt("Template: gifting, crochet, bakers, wholesale, or food", "gifting");
  const bp = STORE_BLUEPRINTS[type.toLowerCase()] || STORE_BLUEPRINTS.gifting;
  currentConfig = JSON.parse(JSON.stringify(bp));
  currentStoreId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  selectStore(currentStoreId);
};

$('sidebarCreateBtn').addEventListener('click', handleCreate);
$('mainCreateBtn').addEventListener('click', handleCreate);

$('migrateBtn').addEventListener('click', async () => {
  const type = prompt("Load data from: gifting, crochet, bakers, wholesale, or food?");
  if (type && STORE_BLUEPRINTS[type.toLowerCase()]) {
    currentConfig = JSON.parse(JSON.stringify(STORE_BLUEPRINTS[type.toLowerCase()]));
    renderForm();
    showToast(`Loaded ${type} data!`);
  }
});

$('logoutBtn').addEventListener('click', async () => {
  await logoutAdmin();
  window.location.href = `/login.html`;
});

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = 'toast toast--show';
  setTimeout(() => toast.className = 'toast', 3000);
}
