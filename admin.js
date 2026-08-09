import { getStoreConfig, saveStoreConfig, uploadImageToFirebase, onAuthStateChanged, signOut } from "./firebase-service.js";

// Check authentication status immediately
onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = '/login.html';
  } else {
    // Remove the automatic call to fetchConfig() at the end
// fetchConfig();
  }
});

async function fetchConfig() {
  showToast('Fetching configuration...');
  currentConfig = await getStoreConfig();

  if (!currentConfig && window.STORE_CONFIG) {
    showToast('Cloud is empty. Ready to sync local config.');
    currentConfig = JSON.parse(JSON.stringify(window.STORE_CONFIG));
  }

  if (currentConfig) {
    renderForm();
  } else {
    showToast('Error: No configuration found.');
  }
}

function renderForm() {
  if (!currentConfig) return;

  // Store info
  document.getElementById('name').value = currentConfig.store.name;
  document.getElementById('tagline').value = currentConfig.store.tagline || '';
  document.getElementById('whatsappNumber').value = currentConfig.store.whatsappNumber;
  document.getElementById('currencySymbol').value = currentConfig.store.currencySymbol;
  document.getElementById('accentColor').value = currentConfig.store.accentColor;
  document.getElementById('accentColorDark').value = currentConfig.store.accentColorDark;

  // Real-time logo update
  const nameInput = document.getElementById('name');
  const brandLogo = document.getElementById('brandLogo');

  if (brandLogo && currentConfig.store.name) {
    brandLogo.textContent = currentConfig.store.name.charAt(0).toUpperCase();
  }

  nameInput.addEventListener('input', (e) => {
    if (brandLogo) brandLogo.textContent = e.target.value.charAt(0).toUpperCase() || 'A';
  });

  // Set CSS variables for accent colors in admin view
  document.documentElement.style.setProperty('--accent', currentConfig.store.accentColor);
  document.documentElement.style.setProperty('--accent-dark', currentConfig.store.accentColorDark);

  // Categories
  renderCategories();

  // Products
  renderProducts();
}

function renderCategories() {
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';
  currentConfig.categories.forEach((cat, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${cat}</span>
      <button type="button" class="remove-cat-btn" data-index="${index}">&times;</button>
    `;
    list.appendChild(tag);
  });

  // Re-attach event listeners
  list.querySelectorAll('.remove-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      removeCategory(idx);
    });
  });
}

function removeCategory(index) {
  const cat = currentConfig.categories[index];
  currentConfig.categories.splice(index, 1);
  renderCategories();
  showToast(`Category "${cat}" removed`);
}

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategory');
  const val = input.value.trim();
  if (val && !currentConfig.categories.includes(val)) {
    currentConfig.categories.push(val);
    input.value = '';
    renderCategories();
    showToast(`Category "${val}" added`);
  }
});

function renderProducts() {
  const list = document.getElementById('productsList');
  list.innerHTML = '';
  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product remove-prod-btn" data-index="${index}">Remove</button>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" value="${prod.name}" class="prod-name" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" value="${prod.price}" class="prod-price" data-index="${index}">
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
        <textarea class="prod-desc" data-index="${index}">${prod.description}</textarea>
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

  // Attach event listeners for dynamic fields
  list.querySelectorAll('.prod-name').forEach(el => el.addEventListener('change', e => updateProduct(e.target.dataset.index, 'name', e.target.value)));
  list.querySelectorAll('.prod-price').forEach(el => el.addEventListener('change', e => updateProduct(e.target.dataset.index, 'price', parseFloat(e.target.value))));
  list.querySelectorAll('.prod-cat').forEach(el => el.addEventListener('change', e => updateProduct(e.target.dataset.index, 'category', e.target.value)));
  list.querySelectorAll('.prod-desc').forEach(el => el.addEventListener('change', e => updateProduct(e.target.dataset.index, 'description', e.target.value)));
  list.querySelectorAll('.prod-upload').forEach(el => el.addEventListener('change', e => uploadImage(e.target.dataset.index, e.target.files[0])));
  list.querySelectorAll('.remove-prod-btn').forEach(el => el.addEventListener('click', e => removeProduct(e.target.dataset.index)));
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

document.getElementById('addProductBtn').addEventListener('click', () => {
  const newProd = {
    id: 'new-' + Date.now(),
    name: 'New Product',
    price: 0,
    category: currentConfig.categories[0] || 'All',
    image: '/products/placeholder.jpg',
    description: '',
    inStock: true
  };
  currentConfig.products.push(newProd);
  renderProducts();
  showToast('New product added to the list');
});

async function uploadImage(index, file) {
  if (!file) return;

  showToast('Uploading image to cloud...');
  const result = await uploadImageToFirebase(file);

  if (result.url) {
    currentConfig.products[index].image = result.url;
    document.getElementById(`prev-${index}`).src = result.url;
    showToast('Image uploaded successfully');
  } else {
    showToast('Upload failed: ' + (result.error || 'Unknown error'));
  }
}

document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Update store info from form
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
});

document.getElementById('migrateBtn').addEventListener('click', async () => {
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
});

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;

  clearTimeout(toastTimer);

  requestAnimationFrame(() => {
    toast.classList.add('toast--show');
  });

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => {
      if (!toast.classList.contains('toast--show')) {
        toast.hidden = true;
      }
    }, 300);
  }, 4000);
}

// Remove the automatic call to fetchConfig() at the end
// fetchConfig();
