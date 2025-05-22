(function() {
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const id = getProductIdFromUrl();
    console.log('Extracted product ID:', id);
    const detail = document.getElementById('product-detail');

    if (!detail) {
        console.error('Element #product-detail not found');
        return;
    }

    if (!id) {
        detail.innerHTML = '<p class="text-gray-600">Товар не найден. ID не указан.</p>';
        return;
    }

    console.log('Fetching product from:', `${API_URL}/products/${id}`);
    fetch(`${API_URL}/products/${id}`)
        .then(res => {
            console.log('Fetch response status:', res.status);
            if (!res.ok) {
                throw new Error(`Ошибка загрузки товара: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then(product => {
            console.log('Fetched product:', product);
            if (!product) {
                throw new Error('Продукт не найден в ответе сервера');
            }
            renderProductDetail(product);
        })
        .catch(error => {
            console.error('Ошибка при загрузке товара:', error);
            detail.innerHTML = `<p class="text-red-500">Ошибка загрузки товара: ${error.message}</p>`;
        });
});

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id;
}

function renderProductDetail(product) {
    const detail = document.getElementById('product-detail');
    if (!detail) {
        console.error('Элемент product-detail не найден.');
        return;
    }

    // Validate product data
    if (!product.name || !product.price || !product.image || !product.description) {
        console.error('Некорректные данные продукта:', product);
        detail.innerHTML = '<p class="text-gray-600">Некорректные данные товара.</p>';
        return;
    }

    // Ensure sizes is an array
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    if (sizes.length === 0) {
        console.warn('Размеры продукта отсутствуют:', product);
    }

    detail.innerHTML = `
        <div class="flex flex-col md:flex-row gap-8 bg-white p-6 rounded-lg shadow-lg">
            <img src="${product.image}" alt="${product.name}" class="w-full md:w-80 h-80 object-contain rounded shadow flex-shrink-0" onerror="this.src='https://via.placeholder.com/300'">
            <div class="flex-grow">
                <h1 class="text-3xl font-bold mb-3 text-gray-900">${product.name}</h1>
                <p class="text-gray-700 mb-6 leading-relaxed">${product.description}</p>
                <div class="text-2xl font-semibold mb-6 text-indigo-600">${product.price} ₽</div>
                ${sizes.length > 0 ? `
                <label for="size-select" class="block text-gray-700 font-semibold mb-2">Выберите размер</label>
                <select id="size-select" class="w-full md:w-auto p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800">
                    <option value="">Выберите размер</option>
                    ${sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
                <div id="size-error" class="text-red-600 text-sm mb-4"></div>
                ` : '<p class="text-gray-600 mb-4">Размеры недоступны.</p>'} 
                <button id="add-to-cart" class="btn-primary w-full md:w-auto px-6 py-3 text-lg font-semibold rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200 ease-in-out" aria-label="Добавить ${product.name} в корзину">Добавить в корзину</button>
            </div>
        </div>
    `;

    const addBtn = document.getElementById('add-to-cart');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Пожалуйста, войдите в аккаунт.');
                window.location.href = 'login.html';
                return;
            }

            if (sizes.length > 0) {
                const size = document.getElementById('size-select').value;
                const sizeError = document.getElementById('size-error');
                sizeError.textContent = '';
                if (!size) {
                    sizeError.textContent = 'Пожалуйста, выберите размер.';
                    return;
                }

                addItemToCart(product, size);
            } else {
                addItemToCart(product, '');
            }
        });
    } else {
        console.error('Кнопка add-to-cart не найдена.');
    }
}

async function addItemToCart(product, size) {
    const user = JSON.parse(localStorage.getItem('user'));
    let cart = user.cart || [];
    const exists = cart.find(item => item.id === product.id && item.size === size);
    if (!exists) {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1, size });
    } else {
        exists.qty += 1;
    }
    try {
        const response = await fetch(`${API_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart })
        });
        if (!response.ok) {
            throw new Error(`Ошибка при обновлении корзины: ${response.status}`);
        }
        user.cart = cart;
        localStorage.setItem('user', JSON.stringify(user));
        alert('Товар добавлен в корзину!');
    } catch (error) {
        console.error('Ошибка при добавлении в корзину:', error);
        alert('Не удалось добавить товар в корзину. Попробуйте снова.');
    }
}

})();