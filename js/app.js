// Авторизация и регистрация

function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!username || !password) {
        errorEl.textContent = 'Заполните все поля';
        return;
    }
    
    const user = findUserByUsername(username);
    
    if (!user || user.password !== password) {
        errorEl.textContent = 'Неверное имя пользователя или пароль';
        return;
    }
    
    setCurrentUser(user);
    window.location.href = 'feed.html';
}

function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('reg-error');
    
    if (!username || !email || !password) {
        errorEl.textContent = 'Заполните все поля';
        return;
    }
    
    if (findUserByUsername(username)) {
        errorEl.textContent = 'Имя пользователя уже занято';
        return;
    }
    
    const newUser = addUser({ username, email, password });
    setCurrentUser(newUser);
    window.location.href = 'feed.html';
}

// Проверка авторизации
function checkAuth() {
    const user = getCurrentUser();
    if (!user && window.location.pathname.includes('feed.html')) {
        window.location.href = 'index.html';
    }
    return user;
}

// Выход из аккаунта
function logout() {
    localStorage.removeItem('twitter_current_user');
    window.location.href = 'index.html';
}

// Инициализация
initStorage();
