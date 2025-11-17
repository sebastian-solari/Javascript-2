// main.js - carrito flotante (offcanvas) + ofertas
// No usar prompt/alert/console.log en versión final

// Estado
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// DOM refs
const productosRow = document.getElementById("productos-row");
const cartCount = document.getElementById("cart-count");

const cartList = document.getElementById("cart-list");
const subtotalOff = document.getElementById("subtotal-offcanvas");
const ivaOff = document.getElementById("iva-offcanvas");
const totalOff = document.getElementById("total-offcanvas");

const btnClear = document.getElementById("btn-clear");
const btnCheckout = document.getElementById("btn-checkout");
const modalTotal = document.getElementById("modal-total-offcanvas");
const modalConfirmBtn = document.getElementById("modal-confirm");

const btnTodos = document.getElementById("btn-todos");
const btnOfertas = document.getElementById("btn-ofertas");
const badgeOfertas = document.getElementById("badge-ofertas");

// Fetch productos
fetch("data/productos.json")
  .then(r => r.json())
  .then(data => {
    productos = data;
    // mostrar todos al inicio
    renderProductos(productos);
    updateOffersBadge();
    renderCart();
  })
  .catch(() => {
    // fallback: vacío
    productos = [];
    renderProductos(productos);
  });

// --- Render productos ---
function renderProductos(list) {
  productosRow.innerHTML = "";
  list.forEach(p => {
    const col = document.createElement("div");
    col.className = "col";

    // precio HTML (oferta 30% si aplica)
    let precioHTML = `<p class="precio">$${p.precio.toLocaleString()}</p>`;
    if (p.oferta) {
      const precioOf = Math.round(p.precio * 0.7);
      precioHTML = `<p><span class="precio-tachado">$${p.precio.toLocaleString()}</span> <span class="precio-oferta">$${precioOf.toLocaleString()}</span></p>`;
    }

    col.innerHTML = `
      <div class="card product-card h-100">
        <img src="${p.imagen}" alt="${p.nombre}" class="producto-img card-img-top">
        <div class="card-body text-center">
          <h6 class="card-title">${p.nombre}</h6>
          ${precioHTML}
          <div class="d-grid mt-2">
            <button class="btn btn-primary btn-add" data-id="${p.id}">Agregar</button>
          </div>
        </div>
      </div>
    `;
    productosRow.appendChild(col);
  });

  // listeners agregar
  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      addToCart(id);
    });
  });
}

// --- Ofertas / filtros ---
btnTodos.addEventListener("click", (e) => {
  e.preventDefault();
  renderProductos(productos);
});

btnOfertas.addEventListener("click", (e) => {
  e.preventDefault();
  const ofertas = productos.filter(p => p.oferta);
  renderProductos(ofertas);
});

// contador de ofertas en badge
function updateOffersBadge() {
  const n = productos.filter(p => p.oferta).length;
  if (n > 0) {
    badgeOfertas.textContent = `-${30}%`;
  } else {
    badgeOfertas.style.display = "none";
  }
}

// --- CART logic ---
function addToCart(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  // guardamos con cantidad: si ya existe, incrementa cantidad
  const existing = carrito.find(i => i.id === id);
  if (existing) {
    existing.cantidad++;
  } else {
    carrito.push({ id: p.id, nombre: p.nombre, precio: p.precio, oferta: p.oferta || false, cantidad: 1, imagen: p.imagen });
  }
  saveCart();
  renderCart();
  flash("Producto agregado al carrito");
}

function renderCart() {
  cartList.innerHTML = "";
  let subtotal = 0;

  carrito.forEach((item, idx) => {
    const precioUnit = item.oferta ? Math.round(item.precio * 0.7) : item.precio;
    const itemTotal = precioUnit * item.cantidad;
    subtotal += itemTotal;

    const li = document.createElement("li");
    li.className = "list-group-item d-flex gap-3 align-items-center";
    li.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}" style="width:60px;height:50px;object-fit:cover;border-radius:6px;">
      <div class="flex-grow-1">
        <div class="fw-bold">${item.nombre}</div>
        <div class="small text-muted">Unit: $${precioUnit.toLocaleString()}</div>
      </div>
      <div class="text-end">
        <div class="d-flex align-items-center gap-1 justify-content-end">
          <button class="btn btn-sm btn-outline-secondary btn-decrease" data-idx="${idx}">-</button>
          <span class="mx-1">${item.cantidad}</span>
          <button class="btn btn-sm btn-outline-secondary btn-increase" data-idx="${idx}">+</button>
        </div>
        <div class="precio-item mt-2">$${itemTotal.toLocaleString()}</div>
        <div class="mt-1">
          <button class="btn btn-sm btn-outline-danger btn-remove" data-idx="${idx}">Eliminar</button>
        </div>
      </div>
    `;
    cartList.appendChild(li);
  });

  // totals
  const iva = Math.round(subtotal * 0.21);
  const total = subtotal + iva;
  subtotalOff.textContent = `$${subtotal.toLocaleString()}`;
  ivaOff.textContent = `$${iva.toLocaleString()}`;
  totalOff.textContent = `$${total.toLocaleString()}`;
  modalTotal.textContent = `$${total.toLocaleString()}`;
  document.getElementById("modal-total-offcanvas").textContent = `$${total.toLocaleString()}`;

  // badge count
  const count = carrito.reduce((s, i) => s + i.cantidad, 0);
  cartCount.textContent = count;

  // attach item buttons
  document.querySelectorAll(".btn-remove").forEach(b => {
    b.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      carrito.splice(i, 1);
      saveCart();
      renderCart();
    });
  });
  document.querySelectorAll(".btn-decrease").forEach(b => {
    b.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      if (carrito[i].cantidad > 1) carrito[i].cantidad--;
      else carrito.splice(i, 1);
      saveCart();
      renderCart();
    });
  });
  document.querySelectorAll(".btn-increase").forEach(b => {
    b.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      carrito[i].cantidad++;
      saveCart();
      renderCart();
    });
  });
}

// clear / checkout
btnClear.addEventListener("click", () => {
  carrito = [];
  saveCart();
  renderCart();
});

btnCheckout.addEventListener("click", () => {
  // just opens modal via data-bs-toggle; nothing here
});

// confirm modal action
modalConfirmBtn.addEventListener("click", () => {
  if (carrito.length === 0) {
    // close modal gracefully
    const modalEl = document.getElementById("modalConfirm");
    const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    bsModal.hide();
    flash("El carrito está vacío");
    return;
  }

  // save to history (optional)
  const history = JSON.parse(localStorage.getItem("compras_historial") || "[]");
  history.push({ date: new Date().toISOString(), items: carrito });
  localStorage.setItem("compras_historial", JSON.stringify(history));

  // clear cart
  carrito = [];
  saveCart();
  renderCart();

  // hide offcanvas if open
  const off = document.getElementById("offcanvasCart");
  const offInst = bootstrap.Offcanvas.getInstance(off);
  if (offInst) offInst.hide();

  // hide modal
  const modalEl = document.getElementById("modalConfirm");
  const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  bsModal.hide();

  flash("✅ Compra realizada con éxito");
});

// persistence
function saveCart() { localStorage.setItem("carrito", JSON.stringify(carrito)); }
function loadCart() {
  const data = localStorage.getItem("carrito");
  if (data) carrito = JSON.parse(data);
}
loadCart();
renderCart();

// small flash helper
function flash(text) {
  const el = document.createElement("div");
  el.className = "flash-msg";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
