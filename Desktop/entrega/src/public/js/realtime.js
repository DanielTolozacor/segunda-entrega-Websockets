const socket = io();

const list = document.getElementById('productList');
const form = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const imageInput = document.getElementById('image');
const priceInput = document.getElementById('price');
const toast = document.getElementById('toast');
const adminSection = document.getElementById('admin-section');
const guestSection = document.getElementById('guest-section');
const logoutBtn = document.getElementById('logout-btn');

// Elementos del modal de edición
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editNameInput = document.getElementById('edit-name');
const editPriceInput = document.getElementById('edit-price');
const editImageInput = document.getElementById('edit-image');
const editCurrentImage = document.getElementById('edit-current-image');
const cancelEditBtn = document.getElementById('cancel-edit');

let isAdmin = false;

// Verificar si hay sesión activa
async function checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  
  if (sessionId) {
    try {
      const response = await fetch('/api/auth/check', {
        headers: {
          'session-id': sessionId
        }
      });
      const data = await response.json();
      isAdmin = data.isAdmin;
    } catch (error) {
      isAdmin = false;
    }
  }
  
  // Mostrar/ocultar secciones según permisos
  if (isAdmin) {
    adminSection.classList.remove('hidden');
    guestSection.classList.add('hidden');
  } else {
    adminSection.classList.add('hidden');
    guestSection.classList.remove('hidden');
  }
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'session-id': sessionId
        }
      });
      localStorage.removeItem('sessionId');
    }
    window.location.href = '/login';
  });
}

checkAuth();

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!isAdmin) {
    showToast('Solo administradores pueden agregar productos');
    return;
  }

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value.trim());
  const imageFile = imageInput.files[0];

  if (!name || isNaN(price) || !imageFile) return;

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const uploadRes = await fetch('/upload-image', {
      method: 'POST',
      body: formData
    });

    const { imageUrl } = await uploadRes.json();
    const product = { name, image: imageUrl, price };

    socket.emit('addProduct', product);

    nameInput.value = '';
    imageInput.value = '';
    priceInput.value = '';
    showToast('Producto agregado');
  } catch (err) {
    showToast('Error al subir imagen');
  }
});

socket.on('products', products => {
  list.innerHTML = '';
  products.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong> (ID: ${p.id})<br/>
        <span>Precio: $${p.price}</span><br/>
        <img src="${p.image}" alt="${p.name}" />
        ${isAdmin ? `
          <div class="action-buttons">
            <button class="edit-btn btn btn-secondary" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">✏️ Editar</button>
            <button class="delete-btn btn btn-danger" data-id="${p.id}">🗑️ Eliminar</button>
          </div>
        ` : ''}
      </div>
    `;
    list.appendChild(li);
  });

  // Solo agregar listeners si es admin
  if (isAdmin) {
    // Listeners para eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Eliminar este producto?')) {
          socket.emit('deleteProduct', id);
        }
      });
    });

    // Listeners para editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const price = btn.getAttribute('data-price');
        const image = btn.getAttribute('data-image');
        
        openEditModal(id, name, price, image);
      });
    });
  }
});

// Abrir modal de edición
function openEditModal(id, name, price, image) {
  editIdInput.value = id;
  editNameInput.value = name;
  editPriceInput.value = price;
  editCurrentImage.src = image;
  editModal.classList.remove('hidden');
}

// Cerrar modal
if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
  editModal.classList.add('hidden');
    editForm.reset();
  });
}

// Manejar edición de producto
if (editForm) {
  editForm.addEventListener('submit', async e => {
    e.preventDefault();

    const id = editIdInput.value;
    const name = editNameInput.value.trim();
    const price = parseFloat(editPriceInput.value);
    const imageFile = editImageInput.files[0];

    let imageUrl = editCurrentImage.src.replace(window.location.origin, '');

    // Si hay nueva imagen, subirla
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      try {
        const uploadRes = await fetch('/upload-image', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      } catch (err) {
        showToast('Error al subir imagen');
        return;
      }
    }

    // Emitir actualización por WebSocket
    socket.emit('updateProduct', {
      id,
      product: { name, price, image: imageUrl }
    });

  editModal.classList.add('hidden');
    editForm.reset();
    showToast('Producto actualizado');
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 2000);
}
