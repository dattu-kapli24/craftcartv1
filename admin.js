import { getStoreConfig, saveStoreConfig, uploadImageToFirebase, onAuthChange, logoutAdmin } from "./firebase-service.js";

let currentConfig = null;

console.log("Admin.js loaded. Checking auth...");

// Check authentication status immediately
onAuthChange((user) => {
  if (!user) {
    console.warn("User not logged in. Redirecting to login...");
    window.location.href = '/login.html';
  } else {
    console.log("Auth success: User is logged in.", user.email);
    fetchConfig();
  }
});

async function fetchConfig() {
  showToast('Fetching configuration...');
  console.log("Fetching config from cloud...");
  try {
    currentConfig = await getStoreConfig();

    if (!currentConfig) {
      console.log("Cloud config is empty. Checking local fallback...");
      if (window.STORE_CONFIG) {
        showToast('Cloud is empty. Ready to sync local config.');
        currentConfig = JSON.parse(JSON.stringify(window.STORE_CONFIG));
        console.log("Local config found and loaded into memory.");
      } else {
        console.error("No local config found in window.STORE_CONFIG.");
      }
    } else {
      console.log("Cloud config fetched successfully.");
    }

    if (currentConfig) {
      renderForm();
    } else {
      showToast('Error: No configuration found.');
      console.error("Configuration chain failed: no data source found.");
    }
  } catch (err) {
    console.error("Fetch error:", err);
    showToast('Error loading configuration.');
  }
}

function renderForm() {
  if (!currentConfig) {
    console.error("renderForm called but currentConfig is null.");
    return;
  }
  console.log("Rendering form...");

  // Store info
  try {
    document.getElementById('name').value = currentConfig.store?.name || '';
    document.getElementById('tagline').value = currentConfig.store?.tagline || '';
    document.getElementById('whatsappNumber').value = currentConfig.store?.whatsappNumber || '';
    document.getElementById('currencySymbol').value = currentConfig.store?.currencySymbol || '₹';
    document.getElementById('accentColor').value = currentConfig.store?.accentColor || '#d2691e';
    document.getElementById('accentColorDark').value = currentConfig.store?.accentColorDark || '#8b4513';

    // Real-time logo update
    const brandLogo = document.getElementById('brandLogo');
    if (brandLogo && currentConfig.store?.name) {
      brandLogo.textContent = currentConfig.store.name.charAt(0).toUpperCase();
    }

    // Set CSS variables for accent colors in admin view
    document.documentElement.style.setProperty('--accent', currentConfig.store?.accentColor || '#d2691e');
    document.documentElement.style.setProperty('--accent-dark', currentConfig.store?.accentColorDark || '#8b4513');

    renderCategories();
    renderProducts();
    console.log("Form render complete.");
  } catch (e) {
    console.error("Error during form rendering:", e);
  }
}

function renderCategories() {
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';
  if (!currentConfig.categories) currentConfig.categories = ["All"];

  currentConfig.categories.forEach((cat, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${cat}</span>
      <button type="button" class="remove-cat-btn" data-index="${index}">&times;</button>
    `;
    list.appendChild(tag);
  });

  list.querySelectorAll('.remove-cat-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      const cat = currentConfig.categories[idx];
      currentConfig.categories.splice(idx, 1);
      renderCategories();
      showToast(`Category "${cat}" removed`);
    };
  });
}

function renderProducts() {
  const list = document.getElementById('productsList');
  list.innerHTML = '';
  if (!currentConfig.products) currentConfig.products = [];

  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product remove-prod-btn" data-index="${index}">Remove</button>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" value="${prod.name || ''}" class="prod-name" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" value="${prod.price || 0}" class="prod-price" data-index="${index}">
        </div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select class="prod-cat" data-index="${index}">
          ${currentConfig.categories.map(cat => `<option value="${cat}" ${prod.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="prod-desc" data-index="${index}">${prod.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Image</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="${prod.image}" class="product-preview-img" id="prev-${index}">
          <input type="file" accept="image/*" class="prod-upload" data-index="${index}">
          <input type="text" value="${prod.image}" readonly style="flex: 1; font-size: 0.8rem; background: #f8fafc;">
        </div>
      </div>
    `;
    list.appendChild(div);
  });

  // Re-bind listeners
  list.querySelectorAll('.prod-name').forEach(el => el.onchange = e => updateProduct(e.target.dataset.index, 'name', e.target.value));
  list.querySelectorAll('.prod-price').forEach(el => el.onchange = e => updateProduct(e.target.dataset.index, 'price', parseFloat(e.target.value)));
  list.querySelectorAll('.prod-cat').forEach(el => el.onchange = e => updateProduct(e.target.dataset.index, 'category', e.target.value));
  list.querySelectorAll('.prod-desc').forEach(el => el.onchange = e => updateProduct(e.target.dataset.index, 'description', e.target.value));
  list.querySelectorAll('.prod-upload').forEach(el => el.onchange = e => uploadImage(e.target.dataset.index, e.target.files[0]));
  list.querySelectorAll('.remove-prod-btn').forEach(el => el.onclick = e => removeProduct(e.target.dataset.index));
}

function updateProduct(index, field, value) {
  currentConfig.products[index][field] = value;
}

function removeProduct(index) {
  const name = currentConfig.products[index].name;
  currentConfig.products.splice(index, 1);
  renderProducts();
  showToast(`Product "${name}" removed`);
}

document.getElementById('name').addEventListener('input', (e) => {
  const brandLogo = document.getElementById('brandLogo');
  if (brandLogo) brandLogo.textContent = e.target.value.charAt(0).toUpperCase() || 'A';
});

document.getElementById('addCategoryBtn').onclick = () => {
  const input = document.getElementById('newCategory');
  const val = input.value.trim();
  if (val && !currentConfig.categories.includes(val)) {
    currentConfig.categories.push(val);
    input.value = '';
    renderCategories();
    showToast(`Category "${val}" added`);
  }
};

document.getElementById('addProductBtn').onclick = () => {
  currentConfig.products.push({
    id: 'new-' + Date.now(),
    name: 'New Product',
    price: 0,
    category: currentConfig.categories[0] || 'All',
    image: '/products/placeholder.jpg',
    description: '',
    inStock: true
  });
  renderProducts();
  showToast('New product added to the list');
};

async function uploadImage(index, file) {
  if (!file) return;
  showToast('Uploading image...');
  const result = await uploadImageToFirebase(file);
  if (result.url) {
    currentConfig.products[index].image = result.url;
    document.getElementById(`prev-${index}`).src = result.url;
    showToast('Image uploaded successfully');
  } else {
    showToast('Upload failed: ' + (result.error || 'Unknown error'));
  }
}

document.getElementById('adminForm').onsubmit = async (e) => {
  e.preventDefault();
  currentConfig.store.name = document.getElementById('name').value;
  currentConfig.store.tagline = document.getElementById('tagline').value;
  currentConfig.store.whatsappNumber = document.getElementById('whatsappNumber').value;
  currentConfig.store.currencySymbol = document.getElementById('currencySymbol').value;
  currentConfig.store.accentColor = document.getElementById('accentColor').value;
  currentConfig.store.accentColorDark = document.getElementById('accentColorDark').value;

  showToast('Saving to cloud...');
  const result = await saveStoreConfig(currentConfig);
  if (result.success) {
    showToast('Store configuration saved to Cloud!');
  } else {
    showToast('Error saving: ' + result.error);
  }
};

document.getElementById('migrateBtn').onclick = async () => {
  if (confirm('This will overwrite cloud settings with your local file settings. Proceed?')) {
    showToast('Syncing...');
    currentConfig = JSON.parse(JSON.stringify(window.STORE_CONFIG));
    const result = await saveStoreConfig(currentConfig);
    if (result.success) {
      renderForm();
      showToast('Local config successfully synced to Cloud!');
    } else {
      showToast('Sync failed: ' + result.error);
    }
  }
};

document.getElementById('logoutBtn').onclick = async () => {
  await logoutAdmin();
  window.location.href = '/login.html';
};

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.error("Toast element not found in DOM");
    return;
  }
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => toast.classList.add('toast--show'));
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => { if (!toast.classList.contains('toast--show')) toast.hidden = true; }, 300);
  }, 4000);
}
