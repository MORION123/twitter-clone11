// Логика ленты новостей

let currentFeed = 'following';
let currentReplyPostId = null;

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
    if (days < 7) return `${days} дн`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML;
    // Преобразуем хештеги в ссылки
    html = html.replace(/#[\wа-яё]+/gi, match => `<a href="#" onclick="searchHashtag('${match}'); return false;">${match}</a>`);
    return html;
}

function renderPost(post, showReplies = true) {
    const user = findUserById(post.userId);
    if (!user) return '';
    
    const currentUser = getCurrentUser();
    const isLiked = post.likes.includes(currentUser?.id);
    const isRetweeted = post.retweets.includes(currentUser?.id);
    const replies = post.replies || [];
    const replyCount = replies.length;
    
    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover; background-position: center;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                <div class="post-info">
                    <span class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</span>
                    <span class="post-time">${formatDate(post.timestamp)}</span>
                    <div class="post-content">${escapeHtml(post.content)}</div>
                    ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">` : ''}
                </div>
            </div>
            <div class="post-actions-bar">
                <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ❤️ ${post.likes.length > 0 ? post.likes.length : ''}
                </button>
                <button class="action-btn ${isRetweeted ? 'retweeted' : ''}" onclick="toggleRetweet('${post.id}')">
                    🔄 ${post.retweets.length > 0 ? post.retweets.length : ''}
                </button>
                <button class="action-btn" onclick="openReplyModal('${post.id}')">
                    💬 ${replyCount > 0 ? `<span class="replies-count">${replyCount}</span>` : ''}
                </button>
                <button class="action-btn" onclick="sharePost('${post.id}')">
                    📤
                </button>
                <button class="action-btn" onclick="deletePost('${post.id}')" ${currentUser?.id !== post.userId ? 'style="display:none"' : ''}>
                    🗑️
                </button>
            </div>
            ${showReplies && replies.length > 0 ? `
                <div class="replies-section">
                    ${replies.slice(0, 3).map(reply => renderReply(reply)).join('')}
                    ${replies.length > 3 ? `<button class="show-more-replies" onclick="showAllReplies('${post.id}')">Показать все ответы (${replies.length})</button>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function renderReply(reply) {
    const user = findUserById(reply.userId);
    if (!user) return '';
    
    return `
        <div class="reply">
            <div class="post-header">
                <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover; background-position: center;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                <div class="post-info">
                    <span class="post-username" onclick="goToProfile('${user.username}')">${escapeHtml(user.username)}</span>
                    <span class="post-time">${formatDate(reply.timestamp)}</span>
                    <div class="post-content">${escapeHtml(reply.content)}</div>
                </div>
            </div>
        </div>
    `;
}

function loadFeed() {
    const posts = getPosts();
    const currentUser = getCurrentUser();
    let filteredPosts = posts;
    
    if (currentFeed === 'following') {
        filteredPosts = posts.filter(post => 
            currentUser.following.includes(post.userId) || post.userId === currentUser.id
        );
    }
    
    const feedEl = document.getElementById('feed');
    if (!feedEl) return;
    
    if (filteredPosts.length === 0) {
        feedEl.innerHTML = '<div class="post">Нет постов. Подпишитесь на кого-нибудь или напишите первый пост!</div>';
        return;
    }
    
    filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
    feedEl.innerHTML = filteredPosts.map(post => renderPost(post)).join('');
    
    updateTrending();
}

function showFeed(type) {
    currentFeed = type;
    const tabs = document.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
        if ((type === 'following' && tab.textContent.includes('Для вас')) ||
            (type === 'global' && tab.textContent.includes('Глобальная'))) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    loadFeed();
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
    
    const wasLiked = post.likes.includes(currentUser.id);
    
    if (wasLiked) {
        post.likes = post.likes.filter(id => id !== currentUser.id);
    } else {
        post.likes.push(currentUser.id);
        if (post.userId !== currentUser.id) {
            addNotification(post.userId, {
                type: 'like',
                fromUser: currentUser.username,
                postId: postId,
                message: `${currentUser.username} лайкнул ваш пост`
            });
        }
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
    
    const wasRetweeted = post.retweets.includes(currentUser.id);
    
    if (wasRetweeted) {
        post.retweets = post.retweets.filter(id => id !== currentUser.id);
    } else {
        post.retweets.push(currentUser.id);
        if (post.userId !== currentUser.id) {
            addNotification(post.userId, {
                type: 'retweet',
                fromUser: currentUser.username,
                postId: postId,
                message: `${currentUser.username} ретвитнул ваш пост`
            });
        }
    }
    
    savePosts(posts);
    loadFeed();
}

function openReplyModal(postId) {
    currentReplyPostId = postId;
    document.getElementById('reply-content').value = '';
    document.getElementById('reply-modal').style.display = 'flex';
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
    currentReplyPostId = null;
}

function submitReply() {
    const content = document.getElementById('reply-content').value;
    const currentUser = getCurrentUser();
    
    if (!content.trim()) {
        alert('Напишите ответ');
        return;
    }
    
    const posts = getPosts();
    const post = posts.find(p => p.id === currentReplyPostId);
    
    if (post) {
        const reply = {
            id: Date.now().toString(),
            userId: currentUser.id,
            content: content,
            timestamp: Date.now()
        };
        
        if (!post.replies) post.replies = [];
        post.replies.push(reply);
        
        savePosts(posts);
        
        if (post.userId !== currentUser.id) {
            addNotification(post.userId, {
                type: 'reply',
                fromUser: currentUser.username,
                postId: currentReplyPostId,
                message: `${currentUser.username} ответил на ваш пост`
            });
        }
        
        closeReplyModal();
        loadFeed();
    }
}

function deletePost(postId) {
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post && post.userId === currentUser.id) {
        if (confirm('Удалить этот пост?')) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            savePosts(updatedPosts);
            loadFeed();
            updateUserStats();
        }
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

function updateTrending() {
    const trending = getTrendingHashtags();
    const trendingList = document.getElementById('trending-list');
    
    if (trendingList) {
        if (trending.length === 0) {
            trendingList.innerHTML = '<div class="trending-item">Пока нет популярных тем</div>';
        } else {
            trendingList.innerHTML = trending.map(t => `
                <div class="trending-item" onclick="searchHashtag('${t.tag}')">
                    <div class="trending-tag">${t.tag}</div>
                    <div class="trending-count">${t.count} постов</div>
                </div>
            `).join('');
        }
    }
}

function searchHashtag(hashtag) {
    document.getElementById('search-input').value = hashtag;
    searchContent();
}

function searchContent() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    
    if (!query.trim()) {
        resultsContainer.classList.remove('show');
        return;
    }
    
    const users = getUsers();
    const posts = getPosts();
    const currentUser = getCurrentUser();
    
    const userResults = users.filter(u => 
        u.username.toLowerCase().includes(query) && u.id !== currentUser?.id
    ).slice(0, 3);
    
    const postResults = posts.filter(p => 
        p.content.toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (userResults.length === 0 && postResults.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item">Ничего не найдено</div>';
    } else {
        let html = '';
        
        if (userResults.length > 0) {
            html += '<div class="search-section"><strong>Пользователи</strong></div>';
            userResults.forEach(user => {
                html += `
                    <div class="search-result-item" onclick="goToProfile('${user.username}')">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                            <div>
                                <div><strong>${escapeHtml(user.username)}</strong></div>
                                <div style="font-size: 12px;">${user.bio || ''}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        if (postResults.length > 0) {
            html += '<div class="search-section"><strong>Посты</strong></div>';
            postResults.forEach(post => {
                const user = findUserById(post.userId);
                html += `
                    <div class="search-result-item" onclick="scrollToPost('${post.id}')">
                        <div><strong>${escapeHtml(user?.username)}</strong></div>
                        <div style="font-size: 12px;">${escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</div>
                    </div>
                `;
            });
        }
        
        resultsContainer.innerHTML = html;
    }
    
    resultsContainer.classList.add('show');
}

function scrollToPost(postId) {
    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth' });
        postElement.style.backgroundColor = 'rgba(29, 155, 240, 0.2)';
        setTimeout(() => {
            postElement.style.backgroundColor = '';
        }, 2000);
    }
    document.getElementById('search-results').classList.remove('show');
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
    if (profileAvatarEl) displayAvatar(profileAvatarEl, currentUser, 'large');
    if (postAvatarEl) displayAvatar(postAvatarEl, currentUser, 'small');
}

function loadSuggestions() {
    const currentUser = getCurrentUser();
    const users = getUsers();
    const suggestions = users.filter(u => 
        u.id !== currentUser?.id && !currentUser?.following.includes(u.id)
    ).slice(0, 3);
    
    const suggestionsList = document.getElementById('suggestions-list');
    if (suggestionsList) {
        suggestionsList.innerHTML = suggestions.map(user => `
            <div class="suggestion-item">
                <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                <div>
                    <div><strong>${escapeHtml(user.username)}</strong></div>
                    <div style="font-size: 12px;">${user.bio || ''}</div>
                </div>
                <button class="follow-btn" onclick="followUser('${user.username}')">Подписаться</button>
            </div>
        `).join('');
    }
}

function followUser(username) {
    const currentUser = getCurrentUser();
    const userToFollow = findUserByUsername(username);
    
    if (!userToFollow) return;
    
    const isFollowing = currentUser.following.includes(userToFollow.id);
    
    if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== userToFollow.id);
        userToFollow.followers = userToFollow.followers.filter(id => id !== currentUser.id);
    } else {
        currentUser.following.push(userToFollow.id);
        userToFollow.followers.push(currentUser.id);
        
        addNotification(userToFollow.id, {
            type: 'follow',
            fromUser: currentUser.username,
            message: `${currentUser.username} подписался на вас`
        });
    }
    
    updateUser(currentUser.id, { following: currentUser.following });
    updateUser(userToFollow.id, { followers: userToFollow.followers });
    
    updateUserStats();
    loadSuggestions();
    loadFeed();
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

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        loadFeed();
        updateUserStats();
        loadSuggestions();
        updateTrending();
        
        const imageInput = document.getElementById('post-image');
        if (imageInput) {
            imageInput.addEventListener('change', loadPreview);
        }
        
        // Закрытие поиска при клике вне
        document.addEventListener('click', function(e) {
            const searchBar = document.querySelector('.search-bar');
            const results = document.getElementById('search-results');
            if (searchBar && !searchBar.contains(e.target)) {
                results.classList.remove('show');
            }
        });
    } else {
        window.location.href = 'index.html';
    }
});
