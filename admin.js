import { getStoreData, saveStoreConfig, uploadImageToCloud, onAuthChange, logoutAdmin, getStoreIdFromUrl, findStoreByOwner } from "./firebase-service.js";

let currentConfig = null;
let storeId = getStoreIdFromUrl();

console.log(`Admin Dashboard Initialized. Current storeId from URL: ${storeId}`);

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = `/login.html?store=${storeId}`;
  } else {
    // AUTO-STORE DISCOVERY
    // If no storeId in URL or it's 'demo', try to find the store owned by this user
    if (!storeId || storeId === 'demo') {
      const discoveredId = await findStoreByOwner(user.uid);
      if (discoveredId) {
        storeId = discoveredId;
        console.log(`Auto-discovered store for user: ${storeId}`);
        // Optional: Update URL without refreshing to keep it clean
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?store=${storeId}`;
        window.history.pushState({path:newUrl},'',newUrl);
      }
    }
    fetchConfig();
  }
});

async function fetchConfig() {
  showToast('Fetching configuration...');
  currentConfig = await getStoreData(storeId);

  if (!currentConfig) {
    showToast('Store not found in Cloud. Initializing...');
    currentConfig = {
      store: { name: "New Store", whatsappNumber: "", accentColor: "#d2691e", accentColorDark: "#8b4513" },
      categories: ["All"],
      products: []
    };
  }

  renderForm();
}

function renderForm() {
  if (!currentConfig) return;

  document.getElementById('name').value = currentConfig.store.name || '';
  document.getElementById('tagline').value = currentConfig.store.tagline || '';
  document.getElementById('whatsappNumber').value = currentConfig.store.whatsappNumber || '';
  document.getElementById('currencySymbol').value = currentConfig.store.currencySymbol || '₹';
  document.getElementById('accentColor').value = currentConfig.store.accentColor || '#d2691e';
  document.getElementById('accentColorDark').value = currentConfig.store.accentColorDark || '#8b4513';

  const brandLogo = document.getElementById('brandLogo');
  if (brandLogo) brandLogo.textContent = (currentConfig.store.name || 'A').charAt(0).toUpperCase();

  renderCategories();
  renderProducts();
}

function renderCategories() {
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';
  currentConfig.categories.forEach((cat, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${cat}</span><button type="button" onclick="removeCategory(${index})">&times;</button>`;
    list.appendChild(tag);
  });
}

window.removeCategory = (index) => {
  currentConfig.categories.splice(index, 1);
  renderCategories();
};

document.getElementById('addCategoryBtn').onclick = () => {
  const input = document.getElementById('newCategory');
  const val = input.value.trim();
  if (val && !currentConfig.categories.includes(val)) {
    currentConfig.categories.push(val);
    input.value = '';
    renderCategories();
  }
};

function renderProducts() {
  const list = document.getElementById('productsList');
  list.innerHTML = '';
  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product" onclick="removeProduct(${index})">Remove</button>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" value="${prod.name}" onchange="updateProduct(${index}, 'name', this.value)"></div>
        <div class="form-group"><label>Price</label><input type="number" value="${prod.price}" onchange="updateProduct(${index}, 'price', parseFloat(this.value))"></div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select onchange="updateProduct(${index}, 'category', this.value)">
          ${currentConfig.categories.map(cat => `<option value="${cat}" ${prod.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Description</label><textarea onchange="updateProduct(${index}, 'description', this.value)">${prod.description || ''}</textarea></div>
      <div class="form-group">
        <label>Image</label>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <img src="${prod.image}" class="product-preview-img" id="prev-${index}">
          <input type="file" accept=".jpg,.jpeg,.png,.webp" onchange="uploadImage(${index}, this.files[0])" style="font-size: 0.8rem;">
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

window.removeProduct = (index) => {
  currentConfig.products.splice(index, 1);
  renderProducts();
};

window.updateProduct = (index, field, value) => {
  currentConfig.products[index][field] = value;
};

document.getElementById('addProductBtn').onclick = () => {
  currentConfig.products.push({ id: 'new-' + Date.now(), name: 'New Item', price: 0, category: currentConfig.categories[0], image: '', inStock: true });
  renderProducts();
};

window.uploadImage = async (index, file) => {
  if (!file) return;
  showToast('Uploading to Cloudinary...');
  const res = await uploadImageToCloud(file);
  if (res.url) {
    currentConfig.products[index].image = res.url;
    const imgEl = document.getElementById(`prev-${index}`);
    if (imgEl) imgEl.src = res.url;
    showToast('Image uploaded successfully');
  } else {
    showToast('Upload failed: ' + (res.error || 'Unknown error'));
  }
};

document.getElementById('adminForm').onsubmit = async (e) => {
  e.preventDefault();
  showToast('Saving...');
  const res = await saveStoreConfig(storeId, currentConfig);
  if (res.success) showToast('Saved Successfully!');
  else showToast('Error: ' + res.error);
};

document.getElementById('logoutBtn').onclick = async () => {
  await logoutAdmin();
  window.location.href = `/login.html?store=${storeId}`;
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('toast--show');
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 3000);
}
