import { getStoreData, saveStoreConfig, uploadImageToFirebase, onAuthChange, logoutAdmin, getStoreIdFromUrl } from "./firebase-service.js";

let currentConfig = null;
const storeId = getStoreIdFromUrl();

console.log(`Admin Dashboard for: ${storeId}`);

onAuthChange((user) => {
  if (!user) {
    window.location.href = `/login.html?store=${storeId}`;
  } else {
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
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="${prod.image}" class="product-preview-img" id="prev-${index}">
          <input type="file" accept="image/*" onchange="uploadImage(${index}, this.files[0])">
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
  showToast('Uploading...');
  const res = await uploadImageToFirebase(storeId, file);
  if (res.url) {
    currentConfig.products[index].image = res.url;
    document.getElementById(`prev-${index}`).src = res.url;
    showToast('Uploaded!');
  }
};

document.getElementById('adminForm').onsubmit = async (e) => {
  e.preventDefault();
  showToast('Saving...');
  const res = await saveStoreConfig(storeId, currentConfig);
  if (res.success) showToast('Saved Successfully!');
};

document.getElementById('logoutBtn').onclick = async () => {
  await logoutAdmin();
  window.location.href = `/login.html?store=${storeId}`;
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('toast--show');
  setTimeout(() => { toast.hidden = true; toast.classList.remove('toast--show'); }, 3000);
}
