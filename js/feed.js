// Логика ленты Instagram

let currentPostForComment = null;

function formatInstagramTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderPost(post) {
    const user = findUserById(post.userId);
    if (!user) return '';
    
    const currentUser = getCurrentUser();
    const isLiked = post.likes.includes(currentUser?.id);
    const isSaved = isPostSaved(currentUser?.id, post.id);
    const comments = post.comments || [];
    
    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar" style="background-image: url('${user.avatarData || ''}'); background-size: cover; background-position: center;">
                    ${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}
                </div>
                <div class="post-user-info">
                    <div class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</div>
                    ${post.location ? `<div class="post-location">${escapeHtml(post.location)}</div>` : ''}
                </div>
                <button class="action-icon" onclick="showPostOptions('${post.id}')" style="margin-left: auto;">⋯</button>
            </div>
            
            ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">` : ''}
            ${post.video ? `<video src="${post.video}" class="post-image" controls onclick="event.stopPropagation()"></video>` : ''}
            
            <div class="post-actions">
                <button class="action-icon ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ${isLiked ? '❤️' : '🤍'}
                </button>
                <button class="action-icon" onclick="openCommentsModal('${post.id}')">
                    💬
                </button>
                <button class="action-icon" onclick="sharePost('${post.id}')">
                    📤
                </button>
                <button class="action-icon" style="margin-left: auto;" onclick="toggleSave('${post.id}')">
                    ${isSaved ? '📌' : '🔖'}
                </button>
            </div>
            
            <div class="post-likes">
                ${post.likes.length > 0 ? `${post.likes.length} отметок "Нравится"` : 'Будьте первым, кому это нравится'}
            </div>
            
            <div class="post-caption">
                <span class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</span>
                ${escapeHtml(post.content)}
            </div>
            
            ${comments.length > 0 ? `
                <div class="post-comments" onclick="openCommentsModal('${post.id}')">
                    Посмотреть все комментарии (${comments.length})
                </div>
            ` : ''}
            
            <div class="post-time">
                ${formatInstagramTime(post.timestamp)}
            </div>
        </div>
    `;
}

function loadFeed() {
    const posts = getPosts();
    const currentUser = getCurrentUser();
    
    if (!currentUser) return;
    
    // Посты от подписок + свои
    let followingPosts = posts.filter(post => 
        currentUser.following.includes(post.userId) || post.userId === currentUser.id
    );
    
    const feedEl = document.getElementById('feed');
    if (!feedEl) return;
    
    // Если нет подписок и нет своих постов, показываем рекомендованные
    if (followingPosts.length === 0) {
        // Показываем последние 10 постов от всех пользователей (кроме себя)
        const recommendedPosts = [...posts]
            .filter(post => post.userId !== currentUser.id)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        if (recommendedPosts.length === 0) {
            feedEl.innerHTML = `
                <div class="empty-feed">
                    <p>📸</p>
                    <p><strong>Добро пожаловать в Instagram Clone!</strong></p>
                    <p style="font-size: 14px;">Здесь будут публикации людей, на которых вы подписаны</p>
                    <button onclick="window.location.href='profile.html'" style="margin-top: 16px; padding: 10px 20px; background: #0095f6; color: white; border: none; border-radius: 8px;">Найти друзей</button>
                </div>
            `;
        } else {
            // Показываем рекомендации и популярные посты
            const users = getUsers();
            const suggestedUsers = users.filter(u => 
                u.id !== currentUser.id && !currentUser.following.includes(u.id)
            ).slice(0, 5);
            
            let suggestionsHtml = '';
            if (suggestedUsers.length > 0) {
                suggestionsHtml = `
                    <div class="empty-feed">
                        <p><strong>✨ Рекомендации для вас</strong></p>
                        <p style="font-size: 14px; margin-bottom: 16px;">Подпишитесь, чтобы видеть больше интересных постов</p>
                        <div class="suggestions-list" id="feed-suggestions"></div>
                    </div>
                `;
            }
            
            feedEl.innerHTML = suggestionsHtml + recommendedPosts.map(post => renderPost(post)).join('');
            
            // Добавляем кнопки подписки в рекомендации
            const suggestionsContainer = document.getElementById('feed-suggestions');
            if (suggestionsContainer && suggestedUsers.length > 0) {
                suggestionsContainer.innerHTML = suggestedUsers.map(user => `
                    <div class="suggestion-item">
                        <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.username[0] || '') : ''}</div>
                        <div style="flex: 1;">
                            <div><strong>${escapeHtml(user.username)}</strong></div>
                            <div style="font-size: 12px; color: #8e8e8e;">${user.bio || ''}</div>
                        </div>
                        <button class="follow-btn" onclick="followUserFromFeed('${user.username}')">Подписаться</button>
                    </div>
                `).join('');
            }
        }
        return;
    }
    
    followingPosts.sort((a, b) => b.timestamp - a.timestamp);
    feedEl.innerHTML = followingPosts.map(post => renderPost(post)).join('');
}

function followUserFromFeed(username) {
    const currentUser = getCurrentUser();
    const userToFollow = findUserByUsername(username);
    
    if (!userToFollow) return;
    
    if (!currentUser.following.includes(userToFollow.id)) {
        currentUser.following.push(userToFollow.id);
        userToFollow.followers.push(currentUser.id);
        
        updateUser(currentUser.id, { following: currentUser.following });
        updateUser(userToFollow.id, { followers: userToFollow.followers });
    }
    
    loadFeed(); // Обновляем ленту
    if (typeof loadSuggestions === 'function') loadSuggestions();
}

function createPost(content, imageData, videoData = null) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const newPost = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: content,
        image: imageData,
        video: videoData,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        location: ''
    };
    
    posts.push(newPost);
    savePosts(posts);
    loadFeed();
    return newPost;
}

function toggleLike(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const wasLiked = post.likes.includes(currentUser.id);
    if (wasLiked) {
        post.likes = post.likes.filter(id => id !== currentUser.id);
    } else {
        post.likes.push(currentUser.id);
    }
    
    savePosts(posts);
    loadFeed();
}

function toggleSave(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const saved = toggleSavePost(currentUser.id, postId);
    loadFeed();
}

function openCommentsModal(postId) {
    currentPostForComment = postId;
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    if (!post.comments || post.comments.length === 0) {
        commentsList.innerHTML = '<div style="text-align: center; padding: 20px;">Нет комментариев. Будьте первым!</div>';
    } else {
        commentsList.innerHTML = post.comments.map(comment => {
            const user = findUserById(comment.userId);
            return `
                <div class="comment-item">
                    <div class="avatar-small" style="background-image: url('${user?.avatarData || ''}'); background-size: cover;">${!user?.avatarData ? (user?.username[0] || '') : ''}</div>
                    <div style="flex: 1;">
                        <strong>${escapeHtml(user?.username)}</strong>
                        <span>${escapeHtml(comment.text)}</span>
                        <div style="font-size: 10px; color: #8e8e8e;">${formatInstagramTime(comment.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('comments-modal').style.display = 'flex';
}

function closeCommentsModal() {
    document.getElementById('comments-modal').style.display = 'none';
    currentPostForComment = null;
}

function submitComment() {
    const commentText = document.getElementById('new-comment').value;
    if (!commentText.trim()) return;
    
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const post = posts.find(p => p.id === currentPostForComment);
    
    if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push({
            userId: currentUser.id,
            text: commentText,
            timestamp: Date.now()
        });
        savePosts(posts);
        
        document.getElementById('new-comment').value = '';
        openCommentsModal(currentPostForComment);
        loadFeed();
    }
}

function openCreatePostModal() {
    document.getElementById('create-post-modal').style.display = 'flex';
}

function closeCreatePostModal() {
    document.getElementById('create-post-modal').style.display = 'none';
    document.getElementById('new-post-content').value = '';
    document.getElementById('new-post-preview').innerHTML = '';
    document.getElementById('new-post-image').value = '';
}

function createPostFromModal() {
    const content = document.getElementById('new-post-content').value;
    const imageInput = document.getElementById('new-post-image');
    
    if (!content.trim() && !imageInput.files[0]) {
        alert('Напишите подпись или добавьте фото/видео');
        return;
    }
    
    if (imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            createPost(content, e.target.result);
            closeCreatePostModal();
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        createPost(content, null);
        closeCreatePostModal();
    }
}

function sharePost(postId) {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка на пост скопирована!');
}

function goToProfile(username) {
    window.location.href = `profile.html?user=${username}`;
}

function openImage(imageUrl) {
    window.open(imageUrl, '_blank');
}

function showPostOptions(postId) {
    const options = confirm('Удалить этот пост?');
    if (options) {
        const currentUser = getCurrentUser();
        const posts = getPosts();
        const post = posts.find(p => p.id === postId);
        if (post && post.userId === currentUser.id) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            savePosts(updatedPosts);
            loadFeed();
        }
    }
}

// Загрузка превью изображения
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user && window.location.pathname.includes('feed.html')) {
        loadFeed();
        
        const imageInput = document.getElementById('new-post-image');
        if (imageInput) {
            imageInput.addEventListener('change', function() {
                const preview = document.getElementById('new-post-preview');
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-top: 12px;">`;
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }
});
