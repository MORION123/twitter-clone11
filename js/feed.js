// Логика ленты новостей

function formatDate(timestamp) {
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
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderPost(post) {
    const user = findUserById(post.userId);
    if (!user) return '';
    
    const currentUser = getCurrentUser();
    
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
                <button class="action-btn" onclick="toggleLike('${post.id}')">
                    ❤️ ${post.likes.length > 0 ? post.likes.length : ''}
                </button>
                <button class="action-btn" onclick="toggleRetweet('${post.id}')">
                    🔄 ${post.retweets.length > 0 ? post.retweets.length : ''}
                </button>
                <button class="action-btn" onclick="deletePost('${post.id}')" ${currentUser?.id !== post.userId ? 'style="display:none"' : ''}>
                    🗑️ Удалить
                </button>
            </div>
        </div>
    `;
}

function loadFeed() {
    const posts = getPosts();
    const feedEl = document.getElementById('feed');
    
    if (!feedEl) return;
    
    if (posts.length === 0) {
        feedEl.innerHTML = '<div class="post">Нет постов. Напишите первый!</div>';
        return;
    }
    
    posts.sort((a, b) => b.timestamp - a.timestamp);
    feedEl.innerHTML = posts.map(renderPost).join('');
}

function createPost() {
    const content = document.getElementById('post-content').value;
    const imageInput = document.getElementById('post-image');
    const currentUser = getCurrentUser();
    
    if (!content.trim() && !imageInput.files[0]) {
        alert('Напишите что-нибудь или добавьте изображение');
        return;
    }
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    let imageUrl = null;
    
    if (imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageUrl = e.target.result;
            savePost(content, imageUrl);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        savePost(content, null);
    }
}

function savePost(content, imageUrl) {
    const currentUser = getCurrentUser();
    const posts = getPosts();
    
    const newPost = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: content,
        image: imageUrl,
        timestamp: Date.now(),
        likes: [],
        retweets: [],
        replies: []
    };
    
    posts.push(newPost);
    savePosts(posts);
    
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    document.getElementById('post-preview').innerHTML = '';
    
    loadFeed();
    updateUserStats();
}

function toggleLike(postId) {
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
    loadFeed();
}

function toggleRetweet(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (post.retweets.includes(currentUser.id)) {
        post.retweets = post.retweets.filter(id => id !== currentUser.id);
    } else {
        post.retweets.push(currentUser.id);
    }
    
    savePosts(posts);
    loadFeed();
}

function deletePost(postId) {
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post && post.userId === currentUser.id) {
        const updatedPosts = posts.filter(p => p.id !== postId);
        savePosts(updatedPosts);
        loadFeed();
        updateUserStats();
    }
}

function updateUserStats() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === currentUser.id);
    
    const postsCountEl = document.getElementById('posts-count');
    const followersCountEl = document.getElementById('followers-count');
    const followingCountEl = document.getElementById('following-count');
    const currentUserEl = document.getElementById('current-user');
    const profileNameEl = document.getElementById('profile-name');
    const profileBioEl = document.getElementById('profile-bio');
    const profileAvatarEl = document.getElementById('profile-avatar');
    const postAvatarEl = document.getElementById('post-avatar');
    
    if (postsCountEl) postsCountEl.textContent = userPosts.length;
    if (followersCountEl) followersCountEl.textContent = currentUser.followers?.length || 0;
    if (followingCountEl) followingCountEl.textContent = currentUser.following?.length || 0;
    if (currentUserEl) currentUserEl.textContent = `@${currentUser.username}`;
    if (profileNameEl) profileNameEl.textContent = currentUser.username;
    if (profileBioEl) profileBioEl.textContent = currentUser.bio || 'Нет описания';
    if (profileAvatarEl) profileAvatarEl.textContent = currentUser.avatar || currentUser.username[0].toUpperCase();
    if (postAvatarEl) postAvatarEl.textContent = currentUser.avatar || currentUser.username[0].toUpperCase();
}

function loadSuggestions() {
    const currentUser = getCurrentUser();
    const users = getUsers();
    const suggestions = users.filter(u => u.id !== currentUser?.id).slice(0, 3);
    
    const suggestionsList = document.getElementById('suggestions-list');
    if (suggestionsList) {
        suggestionsList.innerHTML = suggestions.map(user => `
            <div class="suggestion-item" style="display: flex; gap: 12px; padding: 8px 0;">
                <div class="avatar-small">${user.avatar || user.username[0]}</div>
                <div>
                    <div><strong>${escapeHtml(user.username)}</strong></div>
                    <div style="font-size: 12px; color: #71767b">@${escapeHtml(user.username)}</div>
                </div>
            </div>
        `).join('');
    }
}

function loadPreview() {
    const imageInput = document.getElementById('post-image');
    const preview = document.getElementById('post-preview');
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 16px; margin-top: 12px;">`;
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        loadFeed();
        updateUserStats();
        loadSuggestions();
        
        const imageInput = document.getElementById('post-image');
        if (imageInput) {
            imageInput.addEventListener('change', loadPreview);
        }
    } else {
        window.location.href = 'index.html';
    }
});
