(function() {
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Пожалуйста, войдите в аккаунт.');
        window.location.href = 'login.html';
        return;
    }

    // Синхронизация с db.json
    try {
        const response = await fetch(`${API_URL}/users/${user.id}`);
        if (!response.ok) throw new Error('Ошибка синхронизации пользователя');
        const serverUser = await response.json();
        user.cart = serverUser.cart || [];
        user.owned_items = serverUser.owned_items || [];
        user.orders = serverUser.orders || [];
        localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
        alert('Ошибка синхронизации данных. Попробуйте снова.');
    }

    renderCart();
    renderOwnedItems();

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('customer-name').value.trim();
            const address = document.getElementById('customer-address').value.trim();
            const messageDiv = document.getElementById('checkout-message');
            messageDiv.textContent = '';

            if (!name || !address) {
                messageDiv.textContent = 'Пожалуйста, заполните все поля.';
                return;
            }

            if (!user.cart || user.cart.length === 0) {
                messageDiv.textContent = 'Корзина пуста. Добавьте товары перед оформлением заказа.';
                return;
            }

            try {
                const order = {
                    userId: user.id,
                    name,
                    address,
                    items: user.cart,
                    date: new Date().toISOString()
                };
                const orderResponse = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
                if (!orderResponse.ok) {
                    throw new Error('Ошибка при созданий заказа');
                }

                // Перемещаем товары из корзины в owned_items
                const updatedOwnedItems = [...(user.owned_items || []), ...user.cart];
                const userUpdateResponse = await fetch(`${API_URL}/users/${user.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cart: [],
                        orders: [...(user.orders || []), order],
                        owned_items: updatedOwnedItems
                    })
                });
                if (!userUpdateResponse.ok) {
                    throw new Error('Ошибка при обновлении пользователя');
                }

                user.cart = [];
                user.owned_items = updatedOwnedItems;
                user.orders = [...(user.orders || []), order];
                localStorage.setItem('user', JSON.stringify(user));
                renderCart();
                renderOwnedItems();
                messageDiv.textContent = 'Спасибо за заказ! Товары добавлены в "Мои покупки".';
                checkoutForm.reset();
            } catch (error) {
                console.error('Ошибка при оформлении заказа:', error);
                messageDiv.textContent = 'Не удалось оформить заказ. Попробуйте снова.';
            }
        });
    }
});

function renderCart() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    if (!cartItems || !cartSummary) {
        console.error('Элементы cart-items или cart-summary не найдены.');
        return;
    }

    const cart = user.cart || [];
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-600">Корзина пуста.</p>';
        cartSummary.innerHTML = '';
        return;
    }

    let total = 0;
    cartItems.innerHTML = '<ul class="space-y-4">' + cart.map(item => {
        total += item.price * item.qty;
        return `
            <li class="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain rounded">
                <div class="flex-1">
                    <div class="font-semibold text-gray-800">${item.name}</div>
                    <div class="text-gray-600">Размер: ${item.size || 'Не выбран'}</div>
                    <div class="text-gray-700">Цена: ${item.price} ₽ × ${item.qty}</div>
                </div>
                <button onclick="removeFromCart(${item.id}, '${item.size || ''}')" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200 ease-in-out" aria-label="Удалить ${item.name} из корзины">Удалить</button>
            </li>`;
    }).join('') + '</ul>';
    cartSummary.innerHTML = `<div class="text-lg font-bold text-gray-800 mt-4">Итого: ${total.toFixed(2)} ₽</div>`;
}

function renderOwnedItems() {
    const user = JSON.parse(localStorage.getItem('user'));
    const ownedItemsContainer = document.getElementById('owned-items');
    if (!ownedItemsContainer) {
        console.error('Элемент owned-items не найден.');
        return;
    }

    const ownedItems = user.owned_items || [];
    if (ownedItems.length === 0) {
        ownedItemsContainer.innerHTML = '<p class="text-gray-600">У вас пока нет купленных товаров.</p>';
        return;
    }

    ownedItemsContainer.innerHTML = '<ul class="space-y-4">' + ownedItems.map(item => {
        return `
            <li class="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain rounded">
                <div class="flex-1">
                    <div class="font-semibold text-gray-800">${item.name}</div>
                    <div class="text-gray-600">Размер: ${item.size || 'Не выбран'}</div>
                    <div class="text-gray-700">Цена: ${item.price} ₽</div>
                    <div class="text-gray-700">Количество: ${item.qty}</div>
                </div>
            </li>`;
    }).join('') + '</ul>';
}

async function removeFromCart(id, size) {
    const user = JSON.parse(localStorage.getItem('user'));
    let cart = user.cart || [];
    // Удаляем товар по id (как число) и размеру
    cart = cart.filter(item => !(parseInt(item.id) === parseInt(id) && item.size === size));
    try {
        const response = await fetch(`${API_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart })
        });
        if (!response.ok) {
            throw new Error('Ошибка при обновлении корзины');
        }
        user.cart = cart;
        localStorage.setItem('user', JSON.stringify(user));
        renderCart();
    } catch (error) {
        console.error('Ошибка при удалении из корзины:', error);
        alert('Не удалось удалить товар. Попробуйте снова.');
    }
}

window.removeFromCart = removeFromCart;

})();