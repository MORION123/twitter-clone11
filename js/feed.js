// Логика ленты с геолокацией и упоминаниями

let currentPostForComment = null;
let currentLocation = null;

// Функция для получения геолокации
function getCurrentLocation() {
    if (!navigator.geolocation) {
        console.log('Геолокация не поддерживается');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Обратный геокодинг (получение названия места)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            currentLocation = data.display_name.split(',')[0]; // Берём первое название
            document.getElementById('post-location').value = currentLocation;
        } catch (error) {
            console.log('Ошибка получения адреса:', error);
            currentLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            document.getElementById('post-location').value = currentLocation;
        }
    }, (error) => {
        console.log('Ошибка геолокации:', error);
    });
}

// Функция для обработки упоминаний (@username)
function parseMentions(text) {
    const mentionRegex = /@(\w+)/g;
    let html = text;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        const username = match[1];
        const user = findUserByUsername(username);
        if (user) {
            html = html.replace(`@${username}`, `<span class="mention" onclick="goToProfile('${username}')">@${username}</span>`);
        }
    }
    
    return html;
}

// Обновленная функция рендеринга поста с геолокацией и упоминаниями
function renderPostWithLocation(post) {
    const user = findUserById(post.userId);
    if (!user) return '';
    
    const currentUser = getCurrentUser();
    const isLiked = post.likes.includes(currentUser?.id);
    const isSaved = isPostSaved(currentUser?.id, post.id);
    const comments = post.comments || [];
    
    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                <div class="post-user-info">
                    <div class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</div>
                    ${post.location ? `<div class="post-location" onclick="showOnMap('${post.location}')">📍 ${escapeHtml(post.location)}</div>` : ''}
                </div>
                <button class="action-icon" onclick="showPostOptions('${post.id}')" style="margin-left: auto;">⋯</button>
            </div>
            
            ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">` : ''}
            ${post.video ? `<video src="${post.video}" class="post-image" controls onclick="event.stopPropagation()"></video>` : ''}
            
            <div class="post-actions">
                <button class="action-icon ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">${isLiked ? '❤️' : '🤍'}</button>
                <button class="action-icon" onclick="openCommentsModal('${post.id}')">💬</button>
                <button class="action-icon" onclick="sharePost('${post.id}')">📤</button>
                <button class="action-icon" style="margin-left: auto;" onclick="toggleSave('${post.id}')">${isSaved ? '📌' : '🔖'}</button>
            </div>
            
            <div class="post-likes">${post.likes.length > 0 ? `${post.likes.length} отметок "Нравится"` : 'Будьте первым, кому это нравится'}</div>
            
            <div class="post-caption">
                <span class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</span>
                ${parseMentions(escapeHtml(post.content))}
            </div>
            
            ${comments.length > 0 ? `
                <div class="post-comments" onclick="openCommentsModal('${post.id}')">
                    Посмотреть все комментарии (${comments.length})
                </div>
            ` : ''}
            
            <div class="post-time">${formatInstagramTime(post.timestamp)}</div>
        </div>
    `;
}

// Функция для отображения на карте
function showOnMap(location) {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
}

// Обновленная функция создания поста с геолокацией
function createPostWithLocation(content, imageData, videoData = null, location = null) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts();
    const newPost = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: content,
        image: imageData,
        video: videoData,
        location: location || currentLocation,
        timestamp: Date.now(),
        likes: [],
        comments: []
    };
    
    posts.push(newPost);
    savePosts(posts);
    loadFeed();
    
    // Отправляем уведомления подписчикам
    currentUser.followers.forEach(followerId => {
        addNotification(followerId, {
            type: 'post',
            fromUser: currentUser.username,
            postId: newPost.id,
            message: `${currentUser.username} опубликовал новый пост`
        });
    });
    
    return newPost;
}

// Обновленная форма создания поста с геолокацией
function openCreatePostModalWithLocation() {
    document.getElementById('create-post-modal').style.display = 'flex';
    getCurrentLocation();
}
