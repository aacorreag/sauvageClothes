// --- DATOS ---
// Productos cargados desde JSON

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// --- ELEMENTOS DEL DOM ---
const productGrid = document.getElementById("product-grid");
const cartSidebar = document.getElementById("cart-sidebar");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartCountBadge = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");
const toast = document.getElementById("toast");

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
	try {
		const response = await fetch("data/products.json");
		const data = await response.json();
		products = data.items;

		if (document.getElementById("product-grid")) {
			renderProducts();
		}

		// Verificar productos en el carrito contra la nueva lista (opcional, por si cambian precios/nombres)
		// Por ahora simplemente actualizamos la UI
		updateCartUI();
	} catch (error) {
		console.error("Error cargando productos:", error);
	}
});

// --- FUNCIONES ---

let searchVisible = false;

function toggleSearch() {
	searchVisible = !searchVisible;
	const input = document.getElementById("search-input");
	if (input) {
		if (window.innerWidth <= 1023) {
			// Móvil/Tablet: deslizar desde arriba como superposición
			if (searchVisible) {
				input.style.opacity = "1";
				input.style.transform = "translateY(0)";
				input.style.pointerEvents = "auto";
				setTimeout(() => input.focus(), 300);
			} else {
				input.style.opacity = "0";
				input.style.transform = "translateY(-100%)";
				input.style.pointerEvents = "none";
				input.value = "";
				renderProducts();
			}
		} else {
			// Escritorio: deslizar desde la izquierda
			if (searchVisible) {
				input.style.opacity = "1";
				input.style.transform = "translateY(-50%) translateX(0)";
				input.style.pointerEvents = "auto";
				setTimeout(() => input.focus(), 300);
			} else {
				input.style.opacity = "0";
				input.style.transform = "translateY(-50%) translateX(-100%)";
				input.style.pointerEvents = "none";
				input.value = "";
				renderProducts();
			}
		}
	}
}

// Cerrar búsqueda al hacer clic fuera
document.addEventListener("click", (e) => {
	const input = document.getElementById("search-input");
	const button = document.querySelector('button[onclick="toggleSearch()"]');
	if (
		searchVisible &&
		input &&
		button &&
		!input.contains(e.target) &&
		!button.contains(e.target)
	) {
		toggleSearch();
	}
});

function renderProducts(filter = "") {
	const filteredProducts = products
		.filter((p) => p.status !== 'hidden')
		.filter(
			(p) =>
				!filter ||
				p.name.toLowerCase().includes(filter.toLowerCase()) ||
				p.category.toLowerCase().includes(filter.toLowerCase()),
		);
	productGrid.innerHTML = filteredProducts
		.map(
			(product) => `
        <div class="group product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="relative overflow-hidden bg-gray-800 aspect-[3/4] mb-4 cursor-pointer">
                <img src="${product.image}" alt="${product.name}" class="product-image w-full h-full object-cover transition-transform duration-700 ease-out" loading="lazy">
                
                ${product.status === 'sold_out' ? '<div class="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">Agotado</div>' : ''}
                
                <!-- Overlay Add Button -->
                <button onclick="window.location.href='product.html?id=${product.id}'; event.stopPropagation();" class="add-btn absolute bottom-0 left-0 right-0 bg-white text-black py-4 font-bold uppercase tracking-widest text-sm opacity-0 translate-y-full transition-all duration-300 hover:bg-sauvage-accent group-hover:opacity-100 group-hover:translate-y-0">
                    ${product.status === 'sold_out' ? 'Agotado' : `Ver Detalles - $${product.price.toLocaleString("es-CO")}`}
                </button>
            </div>
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">${product.category}</p>
                    <h3 class="font-bold text-lg text-white group-hover:text-sauvage-accent transition-colors cursor-pointer">${product.name}</h3>
                </div>
                <span class="font-serif text-lg text-gray-300">$${product.price.toLocaleString("es-CO")}</span>
            </div>
        </div>
    `,
		)
		.join("");

	// Actualizar contador de productos
	document.getElementById("product-count").textContent =
		`Mostrando ${filteredProducts.length} productos exclusivos`;
}

function addToCart(productId, quantity = 1, size = null) {
	const product = products.find((p) => p.id === productId);
	const existingItem = cart.find(
		(item) => item.id === productId && item.size === size,
	);

	if (existingItem) {
		existingItem.quantity += quantity;
	} else {
		cart.push({ ...product, quantity, size });
	}

	localStorage.setItem("cart", JSON.stringify(cart));
	updateCartUI();
	openCart(); // Opcional: abrir el carrito al añadir
	showToast(`"${product.name}" añadido`);
}

function removeFromCart(productId, size) {
	cart = cart.filter((item) => !(item.id === productId && item.size === size));
	localStorage.setItem("cart", JSON.stringify(cart));
	updateCartUI();
}

function updateQuantity(productId, change, size) {
	const item = cart.find((item) => item.id === productId && item.size === size);
	if (item) {
		item.quantity += change;
		if (item.quantity <= 0) {
			removeFromCart(productId, size);
		} else {
			localStorage.setItem("cart", JSON.stringify(cart));
			updateCartUI();
		}
	}
}

function updateCartUI() {
	// Actualizar Insignia de Conteo
	const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
	cartCountBadge.innerText = totalItems;
	cartCountBadge.style.opacity = totalItems > 0 ? "1" : "0";

	// Actualizar Total
	const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
	cartTotalEl.innerText = `$${total.toLocaleString("es-CO")}`;

	// Renderizar Ítems
	if (cart.length === 0) {
		cartItemsContainer.innerHTML = `
            <div class="text-center text-gray-500 mt-20 flex flex-col items-center">
                <i class="ph ph-shopping-bag-open text-6xl mb-4 opacity-50"></i>
                <p>Tu carrito está vacío.</p>
                <button onclick="toggleCart()" class="mt-4 text-sauvage-accent underline hover:text-white">Explorar colección</button>
            </div>
        `;
	} else {
		cartItemsContainer.innerHTML = cart
			.map(
				(item) => `
            <div class="flex gap-4">
                <div class="h-24 w-20 bg-gray-800 flex-shrink-0">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-sm text-white">${item.name}</h4>
                        <p class="text-xs text-gray-400 mt-1">$${item.price.toLocaleString("es-CO")} x ${item.quantity}${item.size ? ` - Talla: ${item.size}` : ""}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center border border-white/20">
                        <button onclick="updateQuantity(${item.id}, -1, ${item.size ? `'${item.size}'` : null})" class="px-2 py-1 text-gray-400 hover:text-white">-</button>
                        <span class="px-2 text-sm text-white">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1, ${item.size ? `'${item.size}'` : null})" class="px-2 py-1 text-gray-400 hover:text-white">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id}, ${item.size ? `'${item.size}'` : null})" class="text-xs text-red-400 hover:text-red-300 underline">Eliminar</button>
                    </div>
                </div>
            </div>
        `,
			)
			.join("");
	}
	localStorage.setItem("cart", JSON.stringify(cart));
}

// Lógica para alternar barra lateral
function toggleCart() {
	const isClosed = cartSidebar.classList.contains("translate-x-full");

	if (isClosed) {
		// Abrir
		cartSidebar.classList.remove("translate-x-full");
		cartOverlay.classList.remove("hidden");
		// Pequeño retraso para permitir que display:block se aplique antes de la transición de opacidad
		setTimeout(() => {
			cartOverlay.classList.remove("opacity-0");
		}, 10);
		document.body.style.overflow = "hidden"; // Prevenir desplazamiento del fondo
	} else {
		// Cerrar
		cartSidebar.classList.add("translate-x-full");
		cartOverlay.classList.add("opacity-0");
		setTimeout(() => {
			cartOverlay.classList.add("hidden");
		}, 300);
		document.body.style.overflow = "";
	}
}

function openCart() {
	if (cartSidebar.classList.contains("translate-x-full")) {
		toggleCart();
	}
}

function showToast(message) {
	const toastText = toast.querySelector("span");
	toastText.innerText = message;

	toast.classList.remove("translate-y-20", "opacity-0");

	setTimeout(() => {
		toast.classList.add("translate-y-20", "opacity-0");
	}, 3000);
}

function checkout() {
	if (cart.length === 0) return;

	const phoneNumber = "573168684737"; // Placeholder

	let message = "Hola, me gustaría completar mi pedido:\n\n";

	cart.forEach((item) => {
		message += `- ${item.name} (${item.size || "Unica"}) x ${item.quantity}: $${(item.price * item.quantity).toLocaleString("es-CO")}\n`;
	});

	const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
	message += `\nTotal: $${total.toLocaleString("es-CO")}`;

	const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
	window.open(url, "_blank");

	cart = []; // Opcional: Limpiar carrito después de la redirección.
	// Keeping cart clear for now as per previous logic, but strictly maybe better to keep it.
	// The previous logic cleared it: "cart = []; updateCartUI();".
	// Let's keep the clear logic if that's what the "demo" did, but usually for whatsapp checkout you might want to keep it.
	// Actually, let's CLEAR it to match the previous behavior of "completing" the purchase flow.
	cart = [];
	updateCartUI();
	toggleCart();
}

// Efecto de desplazamiento de la barra de navegación
window.addEventListener("scroll", () => {
	const nav = document.getElementById("navbar");
	if (window.scrollY > 50) {
		nav.classList.add("py-0");
		nav.classList.replace("h-20", "h-16");
	} else {
		nav.classList.remove("py-0");
		nav.classList.replace("h-16", "h-20");
	}
});
