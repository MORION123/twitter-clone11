// Логика профиля

function loadProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Заполняем информацию профиля
    document.getElementById('profile-fullname').textContent = user.username;
    document.getElementById('profile-username-display').textContent = `@${user.username}`;
    document.getElementById('profile-bio-display').textContent = user.bio || 'Нет описания';
    document.getElementById('profile-avatar-large').textContent = user.avatar || user.username[0].toUpperCase();
    
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === user.id);
    
    document.getElementById('profile-posts-count').textContent = userPosts.length;
    document.getElementById('profile-followers-count').textContent = user.followers?.length || 0;
    document.getElementById('profile-following-count').textContent = user.following?.length || 0;
    
    document.getElementById('current-user').textContent = `@${user.username}`;
    
    // Загружаем посты пользователя
    showUserPosts();
}

function showUserPosts() {
    const user = getCurrentUser();
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === user.id);
    
    const container = document.getElementById('user-posts');
    const repliesContainer = document.getElementById('user-replies');
    
    container.style.display = 'block';
    repliesContainer.style.display = 'none';
    
    // Активируем вкладку
    const tabs = document.querySelectorAll('.profile-tab');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    
    if (userPosts.length === 0) {
        container.innerHTML = '<div class="post">У вас пока нет постов</div>';
        return;
    }
    
    userPosts.sort((a, b) => b.timestamp - a.timestamp);
    container.innerHTML = userPosts.map(renderProfilePost).join('');
}

function showUserReplies() {
    const user = getCurrentUser();
    const posts = getPosts();
    // Для ответов нужна отдельная логика, пока показываем просто сообщение
    const container = document.getElementById('user-posts');
    const repliesContainer = document.getElementById('user-replies');
    
    container.style.display = 'none';
    repliesContainer.style.display = 'block';
    
    // Активируем вкладку
    const tabs = document.querySelectorAll('.profile-tab');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    
    repliesContainer.innerHTML = '<div class="post">Функция ответов будет добавлена позже</div>';
}

function renderProfilePost(post) {
    const user = findUserById(post.userId);
    if (!user) return '';
    
    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="avatar-small">${user.avatar || user.username[0].toUpperCase()}</div>
                <div class="post-info">
                    <span class="post-username">${escapeHtml(user.username)}</span>
                    <span class="post-time">${formatDate(post.timestamp)}</span>
                    <div class="post-content">${escapeHtml(post.content)}</div>
                    ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
                </div>
            </div>
            <div class="post-actions-bar">
                <button class="action-btn" onclick="toggleLikeFromProfile('${post.id}')">
                    ❤️ ${post.likes.length > 0 ? post.likes.length : ''}
                </button>
                <button class="action-btn" onclick="deletePostFromProfile('${post.id}')">
                    🗑️ Удалить
                </button>
            </div>
        </div>
    `;
}

function toggleLikeFromProfile(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (post.likes.includes(currentUser.id)) {
        post.likes = post.likes.filter(id => id !== currentUser.id);
    } else {
        post.likes.push(currentUser.id);
    }
    
    savePosts(posts);
    showUserPosts();
}

function deletePostFromProfile(postId) {
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post && post.userId === currentUser.id) {
        const updatedPosts = posts.filter(p => p.id !== postId);
        savePosts(updatedPosts);
        showUserPosts();
        
        // Обновляем счетчик постов
        const user = getCurrentUser();
        const userPosts = updatedPosts.filter(p => p.userId === user.id);
        document.getElementById('profile-posts-count').textContent = userPosts.length;
    }
}

function editProfile() {
    const user = getCurrentUser();
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-modal').style.display = 'flex';
}

function saveProfile() {
    const newBio = document.getElementById('edit-bio').value;
    const user = getCurrentUser();
    
    if (user) {
        updateUser(user.id, { bio: newBio });
        loadProfile();
        closeModal();
        
        // Обновляем sidebar если на странице ленты
        if (typeof updateUserStats === 'function') {
            updateUserStats();
        }
    }
}

function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Добавляем formatDate если не определена
if (typeof formatDate === 'undefined') {
    window.formatDate = function(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин`;
        if (hours < 24) return `${hours} ч`;
        return `${days} дн`;
    };
}

// Добавляем escapeHtml если не определена
if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

// Настройка обработчиков
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.onclick = editProfile;
    }
    
    // Закрытие модального окна при клике вне его
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) closeModal();
        };
    }
});
