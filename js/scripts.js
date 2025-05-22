const API_URL = 'http://localhost:3000';


document.addEventListener('DOMContentLoaded', async () => {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = navMenu.classList.toggle('show');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }


    await updateAuthLink();


    if (document.getElementById('product-grid')) {
        fetch(`${API_URL}/products`)
            .then(response => response.json())
            .then(products => displayProducts(products))
            .catch(error => {
                console.error('Error fetching products:', error);
                document.getElementById('product-grid').innerHTML = '<p class="text-red-500">Ошибка загрузки товаров.</p>';
            });
    }


    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            document.getElementById('name-error').textContent = '';
            document.getElementById('email-error').textContent = '';
            document.getElementById('message-error').textContent = '';

            let isValid = true;
            if (!name) {
                document.getElementById('name-error').textContent = 'Имя обязательно.';
                isValid = false;
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                document.getElementById('email-error').textContent = 'Введите корректный email.';
                isValid = false;
            }
            if (!message) {
                document.getElementById('message-error').textContent = 'Сообщение обязательно.';
                isValid = false;
            }
            if (isValid) {
                alert('Сообщение отправлено!');
                contactForm.reset();
            }
        });
    }


    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginSection = document.querySelector('section:has(#login-form)');
    const registerSection = document.getElementById('register-section');

    if (showRegister && showLogin) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.remove('hidden');
            registerSection.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorDiv = document.getElementById('login-error');
            errorDiv.textContent = '';

            try {
                const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
                const users = await response.json();
                if (users.length > 0) {
                    localStorage.setItem('user', JSON.stringify(users[0]));
                    await updateAuthLink();
                    window.location.href = 'index.html';
                } else {
                    errorDiv.textContent = 'Неверный email или пароль.';
                }
            } catch (error) {
                errorDiv.textContent = 'Ошибка входа. Попробуйте снова.';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const errorDiv = document.getElementById('register-error');
            errorDiv.textContent = '';

            try {
                const response = await fetch(`${API_URL}/users?email=${email}`);
                const existingUsers = await response.json();
                if (existingUsers.length > 0) {
                    errorDiv.textContent = 'Email уже зарегистрирован.';
                    return;
                }
                const newUser = { name, email, password, cart: [], orders: [], owned_items: [] };
                const postResponse = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
                if (postResponse.ok) {
                    const user = await postResponse.json();
                    localStorage.setItem('user', JSON.stringify(user));
                    await updateAuthLink();
                    window.location.href = 'index.html';
                } else {
                    errorDiv.textContent = 'Ошибка регистрации. Попробуйте снова.';
                }
            } catch (error) {
                errorDiv.textContent = 'Ошибка регистрации. Попробуйте снова.';
            }
        });
    }
});


function displayProducts(products) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('article');

        productCard.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col'; 
        productCard.setAttribute('role', 'article');
        productCard.setAttribute('aria-label', `Товар: ${product.name}`);
        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="flex-grow flex items-center justify-center">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-contain rounded-md mb-4" onerror="this.src='https://via.placeholder.com/150'">
            </a>
            <div class="flex flex-col items-start">
                <h3 class="text-lg font-semibold text-gray-800 mb-1">
                    <a href="product.html?id=${product.id}">${product.name}</a>
                </h3>
                <p class="text-gray-600 mb-3">${product.price} ₽</p>
                <button class="btn-primary w-full mt-auto" aria-label="Добавить ${product.name} в корзину" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">Добавить в корзину</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });


    document.querySelectorAll('.btn-primary[data-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Пожалуйста, войдите в аккаунт.');
                window.location.href = 'login.html';
                return;
            }
            const id = btn.dataset.id;
            window.location.href = `product.html?id=${id}`;
        });
    });
}


async function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        try {
            const response = await fetch(`${API_URL}/users/${user.id}`);
            if (response.ok) {
                const serverUser = await response.json();
                localStorage.setItem('user', JSON.stringify(serverUser));
            }
        } catch (error) {
            console.error('Ошибка синхронизации пользователя:', error);
        }

        authLink.textContent = 'Выйти';
        authLink.href = '#';
        authLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    } else {
        authLink.textContent = 'Войти';
        authLink.href = 'login.html';
    }
}


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});


tailwind.config = {
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 1s ease-in-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                }
            }
        }
    }
};