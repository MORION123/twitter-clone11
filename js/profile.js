// Логика профиля

let currentProfileUser = null;

function loadProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    const currentUser = getCurrentUser();
    
    if (username) {
        currentProfileUser = findUserByUsername(username);
    } else {
        currentProfileUser = currentUser;
    }
    
    if (!currentProfileUser) {
        window.location.href = 'feed.html';
        return;
    }
    
    const isOwnProfile = currentUser?.id === currentProfileUser.id;
    
    document.getElementById('profile-fullname').textContent = currentProfileUser.username;
    document.getElementById('profile-username-display').textContent = `@${currentProfileUser.username}`;
    document.getElementById('profile-bio-display').textContent = currentProfileUser.bio || 'Нет описания';
    
    const avatarLarge = document.getElementById('profile-avatar-large');
    displayAvatar(avatarLarge, currentProfileUser, 'large');
    
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === currentProfileUser.id);
    
    document.getElementById('profile-posts-count').textContent = userPosts.length;
    document.getElementById('profile-followers-count').textContent = currentProfileUser.followers?.length || 0;
    document.getElementById('profile-following-count').textContent = currentProfileUser.following?.length || 0;
    document.getElementById('current-user').textContent = `@${currentUser?.username || ''}`;
    
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        if (isOwnProfile) {
            editBtn.style.display = 'block';
        } else {
            editBtn.style.display = 'none';
            
            // Добавляем кнопку подписки для чужих профилей
            const isFollowing = currentUser?.following.includes(currentProfileUser.id);
            const followBtn = document.createElement('button');
            followBtn.id = 'follow-profile-btn';
            followBtn.className = 'edit-profile-btn';
            followBtn.textContent = isFollowing ? 'Отписаться' : 'Подписаться';
            followBtn.onclick = () => toggleFollowProfile();
            document.querySelector('.profile-info').appendChild(followBtn);
        }
    }
    
    showUserPosts();
}

function toggleFollowProfile() {
    const currentUser = getCurrentUser();
    const isFollowing = currentUser.following.includes(currentProfileUser.id);
    
    if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== currentProfileUser.id);
        currentProfileUser.followers = currentProfileUser.followers.filter(id => id !== currentUser.id);
    } else {
        currentUser.following.push(currentProfileUser.id);
        currentProfileUser.followers.push(currentUser.id);
        
        addNotification(currentProfileUser.id, {
            type: 'follow',
            fromUser: currentUser.username,
            message: `${currentUser.username} подписался на вас`
        });
    }
    
    updateUser(currentUser.id, { following: currentUser.following });
    updateUser(currentProfileUser.id, { followers: currentProfileUser.followers });
    
    document.getElementById('profile-followers-count').textContent = currentProfileUser.followers.length;
    
    const followBtn = document.getElementById('follow-profile-btn');
    if (followBtn) {
        followBtn.textContent = currentUser.following.includes(currentProfileUser.id) ? 'Отписаться' : 'Подписаться';
    }
    
    if (typeof loadSuggestions === 'function') loadSuggestions();
    if (typeof loadFeed === 'function') loadFeed();
}

function showUserPosts() {
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === currentProfileUser.id);
    
    const container = document.getElementById('user-posts');
    const repliesContainer = document.getElementById('user-replies');
    
    container.style.display = 'block';
    repliesContainer.style.display = 'none';
    
    const tabs = document.querySelectorAll('.profile-tab');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    
    if (userPosts.length === 0) {
        container.innerHTML = '<div class="post">У пользователя пока нет постов</div>';
        return;
    }
    
    userPosts.sort((a, b) => b.timestamp - a.timestamp);
    container.innerHTML = userPosts.map(post => renderProfilePost(post)).join('');
}

function showUserReplies() {
    const posts = getPosts();
    const allReplies = [];
    
    posts.forEach(post => {
        if (post.replies) {
            post.replies.forEach(reply => {
                if (reply.userId === currentProfileUser.id) {
                    allReplies.push({
                        ...reply,
                        originalPostId: post.id,
                        originalPostContent: post.content,
                        originalPostUser: findUserById(post.userId)
                    });
                }
            });
        }
    });
    
    const container = document.getElementById('user-posts');
    const repliesContainer = document.getElementById('user-replies');
    
    container.style.display = 'none';
    repliesContainer.style.display = 'block';
    
    const tabs = document.querySelectorAll('.profile-tab');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    
    if (allReplies.length === 0) {
        repliesContainer.innerHTML = '<div class="post">У пользователя пока нет ответов</div>';
        return;
    }
    
    allReplies.sort((a, b) => b.timestamp - a.timestamp);
    repliesContainer.innerHTML = allReplies.map(reply => `
        <div class="post">
            <div class="post-header">
                <div class="avatar-small">${currentProfileUser.avatar || currentProfileUser.username[0].toUpperCase()}</div>
                <div class="post-info">
                    <span class="post-username">${escapeHtml(currentProfileUser.username)}</span>
                    <span class="post-time">${formatDate(reply.timestamp)}</span>
                    <div class="post-content">${escapeHtml(reply.content)}</div>
                    <div class="reply-context" style="margin-top: 12px; padding: 12px; background-color: rgba(29, 155, 240, 0.1); border-radius: 12px;">
                        <div style="font-size: 12px; color: #1d9bf0;">Ответ на пост @${reply.originalPostUser?.username}</div>
                        <div style="font-size: 14px;">${escapeHtml(reply.originalPostContent?.substring(0, 100))}${reply.originalPostContent?.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProfilePost(post) {
    const user = currentProfileUser;
    const currentUser = getCurrentUser();
    const isOwnProfile = currentUser?.id === user.id;
    
    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="avatar-small" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div>
                <div class="post-info">
                    <span class="post-username">${escapeHtml(user.username)}</span>
                    <span class="post-time">${formatDate(post.timestamp)}</span>
                    <div class="post-content">${escapeHtml(post.content)}</div>
                    ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">` : ''}
                </div>
            </div>
            <div class="post-actions-bar">
                <button class="action-btn ${post.likes.includes(currentUser?.id) ? 'liked' : ''}" onclick="toggleLikeFromProfile('${post.id}')">
                    ❤️ ${post.likes.length > 0 ? post.likes.length : ''}
                </button>
                <button class="action-btn" onclick="openReplyFromProfile('${post.id}')">
                    💬 ${post.replies?.length > 0 ? post.replies.length : ''}
                </button>
                ${isOwnProfile ? `
                    <button class="action-btn" onclick="deletePostFromProfile('${post.id}')">
                        🗑️
                    </button>
                ` : ''}
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
    showUserPosts();
}

function deletePostFromProfile(postId) {
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post && post.userId === currentUser.id) {
        if (confirm('Удалить этот пост?')) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            savePosts(updatedPosts);
            showUserPosts();
            
            const userPosts = updatedPosts.filter(p => p.userId === currentUser.id);
            document.getElementById('profile-posts-count').textContent = userPosts.length;
            
            if (typeof loadFeed === 'function') loadFeed();
            if (typeof updateUserStats === 'function') updateUserStats();
        }
    }
}

function openReplyFromProfile(postId) {
    if (typeof openReplyModal === 'function') {
        openReplyModal(postId);
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
        
        if (typeof updateUserStats === 'function') {
            updateUserStats();
        }
    }
}

function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        loadProfile();
        
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.onclick = editProfile;
        }
        
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.onclick = function(e) {
                if (e.target === modal) closeModal();
            };
        }
    } else {
        window.location.href = 'index.html';
    }
});
