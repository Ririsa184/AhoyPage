/* script.js
   Funcionalidades:
   - Carrossel editorial (navegação por botões e autoplay)
   - Injeção de produtos no catálogo
   - Carrinho simples usando localStorage (adicionar, remover, atualizar quantidade)
   - Atualização do contador do carrinho
*/

const PRODUCTS = [
  { id: 'p1', title: 'Miçanga de vidro - Azul', price: 4.50, category: 'beads', stock: 120 },
  { id: 'p2', title: 'Fecho mosquetão - Níquel', price: 6.90, category: 'findings', stock: 50 },
  { id: 'p3', title: 'Fio encerado 0.5mm - Preto', price: 8.00, category: 'threads', stock: 200 },
  { id: 'p4', title: 'Kit iniciante - Brincos', price: 39.90, category: 'kits', stock: 30 },
  { id: 'p5', title: 'Miçanga acrílica - Mix', price: 3.20, category: 'beads', stock: 300 },
  { id: 'p6', title: 'Fecho lagosta - Ouro', price: 7.50, category: 'findings', stock: 40 }
];

document.addEventListener('DOMContentLoaded', () => {
  // Year
  document.getElementById('year')?.textContent = new Date().getFullYear();
  document.getElementById('year-2')?.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    if (mobileMenu) {
      mobileMenu.hidden = expanded;
    }
  });

  // Carousel editorial
  initEditorialCarousel();

  // Render products
  renderProducts(PRODUCTS.slice(0, 6));

  // Cart
  updateCartCount();
  initCartPage();
  initCatalogControls();
});

/* ---------- Carousel ---------- */
function initEditorialCarousel(){
  const track = document.getElementById('editorial-track');
  if(!track) return;
  const slides = Array.from(track.querySelectorAll('.carousel__slide'));
  let index = 0;
  const prevBtn = document.querySelector('.carousel__nav--prev');
  const nextBtn = document.querySelector('.carousel__nav--next');

  function show(i){
    index = (i + slides.length) % slides.length;
    const offset = index * track.clientWidth;
    track.scrollTo({ left: offset, behavior: 'smooth' });
    slides.forEach((s, idx) => s.setAttribute('aria-hidden', idx !== index));
  }

  prevBtn?.addEventListener('click', () => show(index - 1));
  nextBtn?.addEventListener('click', () => show(index + 1));

  // autoplay
  let autoplay = setInterval(() => show(index + 1), 5000);
  track.addEventListener('mouseover', () => clearInterval(autoplay));
  track.addEventListener('mouseout', () => autoplay = setInterval(() => show(index + 1), 5000));
}

/* ---------- Products / Catalog ---------- */
function renderProducts(list){
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__img" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 200 160"><rect width="200" height="160" fill="#f7f6f4"/></svg>
      </div>
      <div class="product-card__meta">
        <div>
          <h3 style="margin:0;font-size:1rem">${escapeHtml(p.title)}</h3>
          <div class="badge">${p.category}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">R$ ${p.price.toFixed(2).replace('.',',')}</div>
          <button class="btn btn--ghost quick-view" data-id="${p.id}">Adicionar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach add handlers
  grid.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id, 1);
      showAddConfirmation();
    });
  });
}

function initCatalogControls(){
  const filter = document.getElementById('filter');
  filter?.addEventListener('change', (e) => {
    const val = e.target.value;
    if(val === 'all') renderProducts(PRODUCTS);
    else renderProducts(PRODUCTS.filter(p => p.category === val));
  });

  const loadMore = document.getElementById('load-more');
  loadMore?.addEventListener('click', () => {
    // in real app, fetch next page
    renderProducts(PRODUCTS);
  });
}

/* ---------- Cart (localStorage) ---------- */
const CART_KEY = 'atelier_cart_v1';

function getCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  }catch(e){
    return {};
  }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function addToCart(id, qty = 1){
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
}

function removeFromCart(id){
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
}

function updateQuantity(id, qty){
  const cart = getCart();
  if(qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart(cart);
}

function updateCartCount(){
  const countEl = document.getElementById('cart-count');
  const cart = getCart();
  const total = Object.values(cart).reduce((s,n) => s + n, 0);
  if(countEl) countEl.textContent = String(total);
}

/* Render cart page items */
function initCartPage(){
  renderCartItems();
  document.getElementById('apply-coupon')?.addEventListener('click', applyCoupon);
  document.getElementById('checkout')?.addEventListener('click', () => {
    // placeholder: redirecionar para checkout externo
    alert('Redirecionando para checkout (exemplo).');
  });
}

function renderCartItems(){
  const container = document.getElementById('cart-items');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  const ids = Object.keys(cart);
  if(ids.length === 0){
    document.getElementById('empty-state')?.removeAttribute('hidden');
    container.innerHTML = '<p>Seu carrinho está vazio.</p>';
    updateSummary(0);
    return;
  } else {
    document.getElementById('empty-state')?.setAttribute('hidden', 'true');
  }

  let subtotal = 0;
  ids.forEach(id => {
    const qty = cart[id];
    const product = PRODUCTS.find(p => p.id === id);
    if(!product) return;
    const itemTotal = product.price * qty;
    subtotal += itemTotal;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div class="cart-item__img" aria-hidden="true">
        <svg width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" fill="#f7f6f4"/></svg>
      </div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${escapeHtml(product.title)}</strong>
            <div style="color:var(--color-muted);font-size:0.9rem">R$ ${product.price.toFixed(2).replace('.',',')}</div>
          </div>
          <button class="btn btn--ghost remove-item" data-id="${id}" aria-label="Remover ${escapeHtml(product.title)}">Remover</button>
        </div>
        <div style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center">
          <label class="visually-hidden" for="qty-${id}">Quantidade</label>
          <input id="qty-${id}" type="number" min="1" value="${qty}" style="width:72px;padding:0.4rem;border:1px solid #eee;border-radius:6px" />
          <div style="margin-left:auto;font-weight:700">R$ ${itemTotal.toFixed(2).replace('.',',')}</div>
        </div>
      </div>
    `;
    container.appendChild(item);

    item.querySelector('.remove-item')?.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeFromCart(id);
    });

    item.querySelector(`#qty-${id}`)?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10) || 1;
      updateQuantity(id, val);
    });
  });

  updateSummary(subtotal);
}

function updateSummary(subtotal){
  const shipping = subtotal > 0 ? 12.00 : 0;
  const discount = 0;
  const total = subtotal + shipping - discount;
  document.getElementById('summary-subtotal')?.textContent = `R$ ${subtotal.toFixed(2).replace('.',',')}`;
  document.getElementById('summary-shipping')?.textContent = `R$ ${shipping.toFixed(2).replace('.',',')}`;
  document.getElementById('summary-discount')?.textContent = `R$ ${discount.toFixed(2).replace('.',',')}`;
  document.getElementById('summary-total')?.textContent = `R$ ${total.toFixed(2).replace('.',',')}`;
}

/* Coupon (demo) */
function applyCoupon(){
  const code = document.getElementById('coupon')?.value?.trim();
  if(!code) return alert('Insira um código.');
  // demo: qualquer código "DESCONTO10" aplica 10% de desconto
  if(code.toUpperCase() === 'DESCONTO10'){
    alert('Cupom aplicado: 10% de desconto (demo).');
    // in real app, recalc summary
  } else {
    alert('Cupom inválido.');
  }
}

/* Small helpers */
function showAddConfirmation(){
  // simples microinteração: flash no contador
  const el = document.getElementById('cart-count');
  if(!el) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
  updateCartCount();
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
