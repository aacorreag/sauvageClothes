// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id'));

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedSize = null;
let quantity = 1;

// DOM Elements
const productImage = document.getElementById('product-image');
const productCategory = document.getElementById('product-category');
const productName = document.getElementById('product-name');
const productPrice = document.getElementById('product-price');
const productDescription = document.getElementById('product-description');
const sizeOptions = document.getElementById('size-options');
const quantityEl = document.getElementById('quantity');
const decreaseQtyBtn = document.getElementById('decrease-qty');
const increaseQtyBtn = document.getElementById('increase-qty');
const addToCartBtn = document.getElementById('add-to-cart-btn');

// Cart elements (shared with script.js)
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadge = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const toast = document.getElementById('toast');

// Load product details
function loadProduct() {
	const product = products.find(p => p.id === productId);
	if (!product) {
		window.location.href = 'index.html';
		return;
	}

	productImage.src = product.image;
	productImage.alt = product.name;
	productCategory.textContent = product.category;
	productName.textContent = product.name;
	productPrice.textContent = `$${product.price.toLocaleString('es-CO')}`;
	productDescription.textContent = product.description;

	// Render size options
	sizeOptions.innerHTML = product.sizes.map(size => `
        <button class="size-btn border border-white/20 px-4 py-2 text-white hover:border-sauvage-accent transition-colors" data-size="${size}">
            ${size}
        </button>
    `).join('');

	// Add event listeners to size buttons
	document.querySelectorAll('.size-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('border-sauvage-accent', 'bg-sauvage-accent', 'text-black'));
			btn.classList.add('border-sauvage-accent', 'bg-sauvage-accent', 'text-black');
			selectedSize = btn.dataset.size;
		});
	});

	// If only one size, select it automatically
	if (product.sizes.length === 1) {
		const firstBtn = document.querySelector('.size-btn');
		firstBtn.classList.add('border-sauvage-accent', 'bg-sauvage-accent', 'text-black');
		selectedSize = product.sizes[0];
	}
}

// Quantity controls
decreaseQtyBtn.addEventListener('click', () => {
	if (quantity > 1) {
		quantity--;
		quantityEl.textContent = quantity;
	}
});

increaseQtyBtn.addEventListener('click', () => {
	quantity++;
	quantityEl.textContent = quantity;
});

// Add to cart
addToCartBtn.addEventListener('click', () => {
	if (!selectedSize) {
		alert('Por favor selecciona una talla.');
		return;
	}
	addToCart(productId, quantity, selectedSize);
});

// Shared functions from script.js (copied for product.html)
function addToCart(productId, quantity = 1, size = null) {
	const product = products.find(p => p.id === productId);
	const existingItem = cart.find(item => item.id === productId && item.size === size);

	if (existingItem) {
		existingItem.quantity += quantity;
	} else {
		cart.push({ ...product, quantity, size });
	}

	localStorage.setItem('cart', JSON.stringify(cart));
	updateCartUI();
	openCart();
	showToast(`"${product.name}" añadido`);
}

function updateCartUI() {
	const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
	cartCountBadge.innerText = totalItems;
	cartCountBadge.style.opacity = totalItems > 0 ? '1' : '0';

	const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	cartTotalEl.innerText = `$${total.toLocaleString('es-CO')}`;

	if (cart.length === 0) {
		cartItemsContainer.innerHTML = `
            <div class="text-center text-gray-500 mt-20 flex flex-col items-center">
                <i class="ph ph-shopping-bag-open text-6xl mb-4 opacity-50"></i>
                <p>Tu carrito está vacío.</p>
                <button onclick="toggleCart()" class="mt-4 text-sauvage-accent underline hover:text-white">Explorar colección</button>
            </div>
        `;
	} else {
		cartItemsContainer.innerHTML = cart.map(item => `
            <div class="flex gap-4">
                <div class="h-24 w-20 bg-gray-800 flex-shrink-0">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-sm text-white">${item.name}</h4>
                        <p class="text-xs text-gray-400 mt-1">$${item.price.toLocaleString('es-CO')} x ${item.quantity}${item.size ? ` - Talla: ${item.size}` : ''}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center border border-white/20">
                            <button onclick="updateQuantity(${item.id}, -1, '${item.size}')" class="px-2 py-1 text-gray-400 hover:text-white">-</button>
                            <span class="px-2 text-sm text-white">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1, '${item.size}')" class="px-2 py-1 text-gray-400 hover:text-white">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id}, '${item.size}')" class="text-xs text-red-400 hover:text-red-300 underline">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('');
	}
	localStorage.setItem('cart', JSON.stringify(cart));
}

function removeFromCart(productId, size) {
	cart = cart.filter(item => !(item.id === productId && item.size === size));
	localStorage.setItem('cart', JSON.stringify(cart));
	updateCartUI();
}

function updateQuantity(productId, change, size) {
	const item = cart.find(item => item.id === productId && item.size === size);
	if (item) {
		item.quantity += change;
		if (item.quantity <= 0) {
			removeFromCart(productId, size);
		} else {
			localStorage.setItem('cart', JSON.stringify(cart));
			updateCartUI();
		}
	}
}

function toggleCart() {
	const isClosed = cartSidebar.classList.contains('translate-x-full');

	if (isClosed) {
		cartSidebar.classList.remove('translate-x-full');
		cartOverlay.classList.remove('hidden');
		setTimeout(() => {
			cartOverlay.classList.remove('opacity-0');
		}, 10);
		document.body.style.overflow = 'hidden';
	} else {
		cartSidebar.classList.add('translate-x-full');
		cartOverlay.classList.add('opacity-0');
		setTimeout(() => {
			cartOverlay.classList.add('hidden');
		}, 300);
		document.body.style.overflow = '';
	}
}

function openCart() {
	if (cartSidebar.classList.contains('translate-x-full')) {
		toggleCart();
	}
}

function showToast(message) {
	const toastText = toast.querySelector('span');
	toastText.innerText = message;

	toast.classList.remove('translate-y-20', 'opacity-0');

	setTimeout(() => {
		toast.classList.add('translate-y-20', 'opacity-0');
	}, 3000);
}

function checkout() {
	if (cart.length === 0) return;

	const phoneNumber = "573168684737"; 
	
	let message = "Hola, me gustaría completar mi pedido:\n\n";
	
	cart.forEach(item => {
		message += `- ${item.name} (${item.size || 'Unica'}) x ${item.quantity}: $${(item.price * item.quantity).toLocaleString('es-CO')}\n`;
	});
	
	const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	message += `\nTotal: $${total.toLocaleString('es-CO')}`;
	
	const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
	window.open(url, '_blank');
	
	cart = [];
	updateCartUI();
	toggleCart();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
	loadProduct();
	updateCartUI();
});