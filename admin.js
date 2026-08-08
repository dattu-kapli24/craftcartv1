let currentConfig = null;

async function fetchConfig() {
  const res = await fetch('/api/config');
  currentConfig = await res.json();
  renderForm();
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
      <button type="button" onclick="removeCategory(${index})">&times;</button>
    `;
    list.appendChild(tag);
  });
}

function removeCategory(index) {
  currentConfig.categories.splice(index, 1);
  renderCategories();
}

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategory');
  const val = input.value.trim();
  if (val && !currentConfig.categories.includes(val)) {
    currentConfig.categories.push(val);
    input.value = '';
    renderCategories();
  }
});

function renderProducts() {
  const list = document.getElementById('productsList');
  list.innerHTML = '';
  currentConfig.products.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <button type="button" class="remove-product" onclick="removeProduct(${index})">Remove</button>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" value="${prod.name}" onchange="updateProduct(${index}, 'name', this.value)">
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" value="${prod.price}" onchange="updateProduct(${index}, 'price', parseFloat(this.value))">
        </div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select onchange="updateProduct(${index}, 'category', this.value)">
          ${currentConfig.categories.map(cat => `<option value="${cat}" ${prod.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea onchange="updateProduct(${index}, 'description', this.value)">${prod.description}</textarea>
      </div>
      <div class="form-group">
        <label>Image</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="${prod.image}" class="product-preview-img" id="prev-${index}">
          <input type="file" accept="image/*" onchange="uploadImage(${index}, this.files[0])">
          <input type="text" value="${prod.image}" readonly style="flex: 1; font-size: 0.8rem; background: #f8fafc;">
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function updateProduct(index, field, value) {
  currentConfig.products[index][field] = value;
}

function removeProduct(index) {
  currentConfig.products.splice(index, 1);
  renderProducts();
}

document.getElementById('addProductBtn').addEventListener('click', () => {
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
});

async function uploadImage(index, file) {
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  showToast('Uploading image...');
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();

  if (data.url) {
    currentConfig.products[index].image = data.url;
    document.getElementById(`prev-${index}`).src = data.url;
    showToast('Image uploaded successfully');
  } else {
    showToast('Upload failed: ' + (data.error || 'Unknown error'));
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

  showToast('Saving changes...');
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentConfig)
  });

  const data = await res.json();
  if (data.success) {
    showToast('Store configuration updated!');
  } else {
    showToast('Error saving: ' + (data.error || 'Unknown error'));
  }
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3000);
}

fetchConfig();
