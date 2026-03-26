// Логика профиля Instagram

let currentProfileUser = null;
let currentTab = 'posts';

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
    const posts = getPosts();
    const userPosts = posts.filter(p => p.userId === currentProfileUser.id);
    const savedPostsIds = getSavedPosts(currentUser?.id);
    const savedPosts = posts.filter(p => savedPostsIds.includes(p.id));
    
    // Заполняем данные профиля
    document.getElementById('profile-name').textContent = currentProfileUser.username;
    document.getElementById('profile-bio-text').textContent = currentProfileUser.bio || 'Нет описания';
    document.getElementById('posts-count').textContent = userPosts.length;
    document.getElementById('followers-count').textContent = currentProfileUser.followers?.length || 0;
    document.getElementById('following-count').textContent = currentProfileUser.following?.length || 0;
    
    const avatarElement = document.querySelector('#profile-avatar .avatar-large-inner');
    if (avatarElement) {
        if (currentProfileUser.avatarData) {
            avatarElement.style.backgroundImage = `url('${currentProfileUser.avatarData}')`;
            avatarElement.textContent = '';
        } else {
            avatarElement.style.backgroundImage = '';
            avatarElement.textContent = currentProfileUser.username[0].toUpperCase();
        }
    }
    
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        if (isOwnProfile) {
            editBtn.style.display = 'block';
            editBtn.textContent = 'Редактировать профиль';
        } else {
            editBtn.style.display = 'block';
            const isFollowing = currentUser?.following.includes(currentProfileUser.id);
            editBtn.textContent = isFollowing ? 'Отписаться' : 'Подписаться';
            editBtn.onclick = () => toggleFollowProfile();
        }
    }
    
    // Показываем посты
    showUserPosts(userPosts);
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
    }
    
    updateUser(currentUser.id, { following: currentUser.following });
    updateUser(currentProfileUser.id, { followers: currentProfileUser.followers });
    
    document.getElementById('followers-count').textContent = currentProfileUser.followers.length;
    
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.textContent = currentUser.following.includes(currentProfileUser.id) ? 'Отписаться' : 'Подписаться';
    }
    
    if (typeof loadFeed === 'function') loadFeed();
}

function showUserPosts(userPosts) {
    currentTab = 'posts';
    const postsGrid = document.getElementById('user-posts-grid');
    const savedGrid = document.getElementById('saved-posts-grid');
    const tabs = document.querySelectorAll('.profile-tab');
    
    postsGrid.style.display = 'grid';
    savedGrid.style.display = 'none';
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    
    if (userPosts.length === 0) {
        postsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>📸</p>
                <p><strong>Нет публикаций</strong></p>
                <p style="font-size: 14px;">Когда вы опубликуете фото, они появятся здесь</p>
            </div>
        `;
        return;
    }
    
    userPosts.sort((a, b) => b.timestamp - a.timestamp);
    postsGrid.innerHTML = userPosts.map(post => `
        <div class="grid-post" onclick="openPostModal('${post.id}')">
            ${post.image ? `<img src="${post.image}" alt="Post">` : ''}
            ${post.video ? `<video src="${post.video}" style="width:100%;height:100%;object-fit:cover;"></video>` : ''}
        </div>
    `).join('');
}

function showSavedPosts() {
    currentTab = 'saved';
    const currentUser = getCurrentUser();
    const posts = getPosts();
    const savedPostsIds = getSavedPosts(currentUser?.id);
    const savedPosts = posts.filter(p => savedPostsIds.includes(p.id));
    
    const postsGrid = document.getElementById('user-posts-grid');
    const savedGrid = document.getElementById('saved-posts-grid');
    const tabs = document.querySelectorAll('.profile-tab');
    
    postsGrid.style.display = 'none';
    savedGrid.style.display = 'grid';
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    
    if (savedPosts.length === 0) {
        savedGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>🔖</p>
                <p><strong>Сохраненные публикации</strong></p>
                <p style="font-size: 14px;">Добавляйте посты в сохраненное, чтобы увидеть их здесь</p>
            </div>
        `;
        return;
    }
    
    savedPosts.sort((a, b) => b.timestamp - a.timestamp);
    savedGrid.innerHTML = savedPosts.map(post => `
        <div class="grid-post" onclick="openPostModal('${post.id}')">
            ${post.image ? `<img src="${post.image}" alt="Post">` : ''}
            ${post.video ? `<video src="${post.video}" style="width:100%;height:100%;object-fit:cover;"></video>` : ''}
        </div>
    `).join('');
}

function openPostModal(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const user = findUserById(post.userId);
    const currentUser = getCurrentUser();
    const isLiked = post.likes.includes(currentUser?.id);
    const comments = post.comments || [];
    
    const modalHtml = `
        <div id="post-modal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; padding: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #efefef;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="avatar-small" style="background-image: url('${user?.avatarData || ''}'); background-size: cover;">${!user?.avatarData ? (user?.username[0] || '') : ''}</div>
                        <strong>${escapeHtml(user?.username)}</strong>
                    </div>
                    <button onclick="closePostModal()" style="background: none; border: none; font-size: 24px;">✕</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px; padding: 16px;">
                    ${post.image ? `<img src="${post.image}" style="max-width: 100%; border-radius: 8px;">` : ''}
                    <div>
                        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                            <button class="action-icon ${isLiked ? 'liked' : ''}" onclick="toggleLikeFromModal('${post.id}')">${isLiked ? '❤️' : '🤍'}</button>
                            <button class="action-icon" onclick="closePostModal(); openCommentsModal('${post.id}')">💬</button>
                            <button class="action-icon" onclick="sharePost('${post.id}')">📤</button>
                        </div>
                        <div><strong>${post.likes.length} отметок "Нравится"</strong></div>
                        <div style="margin-top: 8px;"><strong>${escapeHtml(user?.username)}</strong> ${escapeHtml(post.content)}</div>
                        ${comments.length > 0 ? `<div style="margin-top: 12px; color: #8e8e8e;">Посмотреть все комментарии (${comments.length})</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePostModal() {
    const modal = document.getElementById('post-modal');
    if (modal) modal.remove();
}

function toggleLikeFromModal(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    const currentUser = getCurrentUser();
    
    if (post) {
        const wasLiked = post.likes.includes(currentUser.id);
        if (wasLiked) {
            post.likes = post.likes.filter(id => id !== currentUser.id);
        } else {
            post.likes.push(currentUser.id);
        }
        savePosts(posts);
        closePostModal();
        openPostModal(postId);
        loadProfile();
        if (typeof loadFeed === 'function') loadFeed();
    }
}

function uploadAvatar() {
    const fileInput = document.getElementById('avatar-upload');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const currentUser = getCurrentUser();
            updateUser(currentUser.id, { avatarData: e.target.result });
            loadProfile();
            
            if (typeof loadStoriesForFeed === 'function') loadStoriesForFeed();
            if (typeof loadFeed === 'function') loadFeed();
        };
        reader.readAsDataURL(file);
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
        if (editBtn && window.location.search === '') {
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
