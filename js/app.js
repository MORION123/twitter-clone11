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

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnProfile = document.getElementById('logoutBtnProfile');
    
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            logout();
            return false;
        };
    }
    
    if (logoutBtnProfile) {
        logoutBtnProfile.onclick = function(e) {
            e.preventDefault();
            logout();
            return false;
        };
    }
}

function logout() {
    localStorage.removeItem('twitter_current_user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user && (window.location.pathname.includes('feed.html') || window.location.pathname.includes('profile.html'))) {
        window.location.href = 'index.html';
    }
    return user;
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const userElements = document.querySelectorAll('#current-user');
    userElements.forEach(el => {
        if (el) el.textContent = user ? `@${user.username}` : '';
    });
}

function displayAvatar(element, user, size = 'small') {
    if (user.avatarData) {
        element.style.backgroundImage = `url(${user.avatarData})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.textContent = '';
    } else {
        element.style.backgroundImage = '';
        element.textContent = user.avatar || user.username[0].toUpperCase();
    }
}

function uploadAvatar() {
    const fileInput = document.getElementById('avatar-upload');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const user = getCurrentUser();
            updateUser(user.id, { avatarData: e.target.result });
            
            // Обновляем все аватары на странице
            updateUserDisplay();
            if (typeof updateUserStats === 'function') {
                updateUserStats();
            }
            
            const profileAvatar = document.getElementById('profile-avatar');
            const postAvatar = document.getElementById('post-avatar');
            if (profileAvatar) displayAvatar(profileAvatar, user, 'large');
            if (postAvatar) displayAvatar(postAvatar, user, 'small');
        };
        reader.readAsDataURL(file);
    }
}

function uploadAvatarFromProfile() {
    const fileInput = document.getElementById('avatar-upload-profile');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const user = getCurrentUser();
            updateUser(user.id, { avatarData: e.target.result });
            
            const profileAvatarLarge = document.getElementById('profile-avatar-large');
            if (profileAvatarLarge) displayAvatar(profileAvatarLarge, user, 'large');
            
            if (typeof updateUserStats === 'function') {
                updateUserStats();
            }
        };
        reader.readAsDataURL(file);
    }
}

initStorage();

document.addEventListener('DOMContentLoaded', () => {
    setupLogoutButton();
    updateUserDisplay();
    checkAuth();
});
