import { getStoreData, saveStoreConfig, uploadImageToCloud, onAuthChange, logoutAdmin, getStoreIdFromUrl, getOwnedStores, deleteStoreData } from "./firebase-service.js";

let currentConfig = null;
let currentStoreId = getStoreIdFromUrl();
let currentUser = null;

const $ = (id) => document.getElementById(id);
const sidebarList = $('sidebarStoreList');
const adminForm = $('adminForm');
const welcomeState = $('welcomeState');
const viewStoreLink = $('viewStoreLink');

// 1. AUTH & SIDEBAR INITIALIZATION
onAuthChange(async (user) => {
  if (!user) {
    window.location.href = `/login.html`;
  } else {
    currentUser = user;
    await refreshSidebar();

    // If a store is in the URL, load it.
    if (currentStoreId && currentStoreId !== 'demo' && currentStoreId !== 'admin') {
      fetchConfig(currentStoreId);
    }
  }
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

      fetchConfig(s.id);
    };

    const delBtn = btn.querySelector('.delete-store-btn');
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      const id = e.target.dataset.id;
      if (confirm(`Are you sure you want to delete the store "${id}"? This cannot be undone.`)) {
        showToast(`Deleting ${id}...`);
        const result = await deleteStoreData(id);
        if (result.success) {
          showToast('Store deleted successfully');
          if (currentStoreId === id) {
            window.location.search = '';
          } else {
            await refreshSidebar();
          }
        } else {
          showToast('Error: ' + result.error);
        }
      }
    };
    sidebarList.appendChild(btn);
  });
}

// 2. FETCH DATA
async function fetchConfig(id) {
  showToast(`Loading ${id}...`);
  currentConfig = await getStoreData(id);

  welcomeState.hidden = true;
  adminForm.hidden = false;
  viewStoreLink.hidden = false;
  viewStoreLink.href = `/${id}`;

  if (!currentConfig) {
    showToast('Template not found. Creating new...');
    currentConfig = {
      store: { name: "New Store", whatsappNumber: "", accentColor: "#0f766e", accentColorDark: "#0d9488" },
      categories: ["All"],
      products: []
    };
  }

  renderForm();
}

// 3. RENDER FORM
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
        <div class="form-group"><label>Name</label><input type="text" value="${prod.name}" class="p-name" data-index="${index}"></div>
        <div class="form-group"><label>Price</label><input type="number" value="${prod.price}" class="p-price" data-index="${index}"></div>
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

  // Event re-binding
  list.querySelectorAll('.p-name').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].name = e.target.value);
  list.querySelectorAll('.p-price').forEach(el => el.onchange = e => currentConfig.products[e.target.dataset.index].price = parseFloat(e.target.value));
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

import { STORE_BLUEPRINTS } from "./blueprints.js";

$('sidebarCreateBtn').onclick = $('mainCreateBtn').onclick = () => {
  const id = prompt("Enter a unique ID for your new store (e.g. fashion-hub):");
  if (!id) return;

  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const templateType = prompt("Choose a template (type: gifting, crochet, or bakers):", "gifting");

  const blueprint = STORE_BLUEPRINTS[templateType.toLowerCase()] || STORE_BLUEPRINTS['gifting'];

  // Clone the blueprint as the initial config
  currentConfig = JSON.parse(JSON.stringify(blueprint));
  currentStoreId = cleanId;

  // Update URL without reload
  const newUrl = `${window.location.pathname}?store=${cleanId}`;
  window.history.pushState({path:newUrl},'',newUrl);

  showToast(`Created store using "${templateType}" template!`);
  renderForm();
  adminForm.hidden = false;
  welcomeState.hidden = true;
};

adminForm.onsubmit = async (e) => {
  e.preventDefault();

  // Sync branding
  currentConfig.store.name = $('name').value;
  currentConfig.store.tagline = $('tagline').value;
  currentConfig.store.whatsappNumber = $('whatsappNumber').value;
  currentConfig.store.currencySymbol = $('currencySymbol').value;
  currentConfig.store.accentColor = $('accentColor').value;
  currentConfig.store.accentColorDark = $('accentColorDark').value;

  showToast('Saving...');
  const res = await saveStoreConfig(currentStoreId, currentConfig);
  if (res.success) {
    showToast('Saved Successfully!');
    await refreshSidebar();
  } else {
    showToast('Error: ' + res.error);
  }
};

$('migrateBtn').onclick = async () => {
  if (!window.STORE_CONFIG) { showToast('Error: Local template not found.'); return; }
  if (confirm('Sync local template to this store?')) {
    showToast('Migrating...');
    currentConfig = JSON.parse(JSON.stringify(window.STORE_CONFIG));
    const res = await saveStoreConfig(currentStoreId, currentConfig);
    if (res.success) { renderForm(); showToast('Sync Successful!'); }
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
  toast.hidden = false;
  toast.classList.add('toast--show');
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 3000);
}
