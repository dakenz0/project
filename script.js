
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const dynamicContentPlaceholder = document.getElementById('dynamic-content-placeholder');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            let isValid = true;

            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

            const nameInput = document.getElementById('name');
            if (nameInput.value.trim() === '') {
                document.getElementById('name-error').textContent = 'Пожалуйста, введите ваше имя.';
                isValid = false;
            }


            const emailInput = document.getElementById('email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput.value.trim() === '') {
                document.getElementById('email-error').textContent = 'Пожалуйста, введите ваш email.';
                isValid = false;
            } else if (!emailPattern.test(emailInput.value.trim())) {
                document.getElementById('email-error').textContent = 'Пожалуйста, введите корректный email.';
                isValid = false;
            }

            const messageInput = document.getElementById('message');
            if (messageInput.value.trim() === '') {
                document.getElementById('message-error').textContent = 'Пожалуйста, введите ваше сообщение.';
                isValid = false;
            }

            if (isValid) {
                alert('Форма успешно отправлена!');
                contactForm.reset(); 
            } else {
                alert('Пожалуйста, исправьте ошибки в форме.');
            }
        });
    }

    function loadDynamicContent() {
        const apiUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Сетевой ответ был не в порядке ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (dynamicContentPlaceholder) {
                    const contentElement = document.createElement('div');
                    contentElement.innerHTML = `
                        <h3>${data.title}</h3>
                        <p>${data.body}</p>
                    `;
                    dynamicContentPlaceholder.appendChild(contentElement);
                }
            })
            .catch(error => {
                console.error('Проблема с операцией fetch:', error);
                if (dynamicContentPlaceholder) {
                    dynamicContentPlaceholder.textContent = 'Не удалось загрузить динамический контент.';
                }
            });
    }

    if (dynamicContentPlaceholder) {
        loadDynamicContent();
    }


    const companyMilestonesPlaceholder = document.getElementById('company-milestones-placeholder');

    function loadCompanyMilestones() {
        const milestonesApiUrl = 'https://jsonplaceholder.typicode.com/users/1/todos'; 
        fetch(milestonesApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Сетевой ответ был не в порядке ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (companyMilestonesPlaceholder) {
                    companyMilestonesPlaceholder.innerHTML = ''; 
                    const list = document.createElement('ul');
                    data.slice(0, 5).forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${item.title} (Статус: ${item.completed ? 'Выполнено' : 'В процессе'})`;
                        list.appendChild(listItem);
                    });
                    companyMilestonesPlaceholder.appendChild(list);
                }
            })
            .catch(error => {
                console.error('Проблема с операцией fetch для достижений:', error);
                if (companyMilestonesPlaceholder) {
                    companyMilestonesPlaceholder.textContent = 'Не удалось загрузить информацию о достижениях.';
                }
            });
    }
    if (companyMilestonesPlaceholder) {
        loadCompanyMilestones();
    }

    const myButton = document.getElementById('myButton'); 
    if (myButton) {
        myButton.addEventListener('click', function() {
            alert('Кнопка была нажата!');
        });
    }


    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

});
