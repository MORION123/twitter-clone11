let currentExploreTab = 'all';

function loadExplorePage() {
    const currentUser = getCurrentUser();
    if (!currentUser) { window.location.href = 'index.html'; return; }
    showExploreTab(currentExploreTab);
}

function showExploreTab(tab) {
    currentExploreTab = tab;
    const currentUser = getCurrentUser();
    const allUsers = getUsers();
    const tabs = document.querySelectorAll('.explore-tab');
    tabs.forEach((t, i) => { if ((tab === 'all' && i === 0) || (tab === 'recommended' && i === 1) || (tab === 'following' && i === 2) || (tab === 'followers' && i === 3)) t.classList.add('active'); else t.classList.remove('active'); });
    let filteredUsers = [];
    switch(tab) {
        case 'all': filteredUsers = allUsers.filter(u => u.id !== currentUser.id); break;
        case 'recommended': filteredUsers = allUsers.filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id)); break;
        case 'following': filteredUsers = allUsers.filter(u => currentUser.following.includes(u.id)); break;
        case 'followers': filteredUsers = allUsers.filter(u => currentUser.followers?.includes(u.id)); break;
    }
    renderUsersList(filteredUsers);
}

function renderUsersList(users) {
    const container = document.getElementById('users-list');
    const currentUser = getCurrentUser();
    if (users.length === 0) { container.innerHTML = `<div class="empty-state"><p>👥</p><p><strong>Нет пользователей</strong></p><p style="font-size: 14px;">${getEmptyMessage()}</p></div>`; return; }
    container.innerHTML = users.map(user => { const isFollowing = currentUser.following.includes(user.id); const postsCount = getPosts().filter(p => p.userId === user.id).length; return `<div class="user-card" onclick="goToUserProfile('${user.username}')"><div class="user-avatar" style="background-image: url('${user.avatarData || ''}'); background-size: cover; background-position: center;">${!user.avatarData ? (user.username[0]?.toUpperCase() || '👤') : ''}</div><div class="user-info"><div class="user-name">${escapeHtml(user.username)}</div><div class="user-bio">${user.bio || 'Нет описания'}</div><div class="user-stats"><span>📸 ${postsCount}</span><span>👥 ${user.followers?.length || 0}</span></div></div><button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="event.stopPropagation(); toggleFollowFromExplore('${user.username}')">${isFollowing ? '✓ Подписан' : '+ Подписаться'}</button></div>`; }).join('');
}

function getEmptyMessage() { switch(currentExploreTab) { case 'following': return 'Вы еще ни на кого не подписаны'; case 'followers': return 'У вас пока нет подписчиков'; case 'recommended': return 'Нет рекомендаций'; default: return 'Пользователи не найдены'; } }

function searchUsers() {
    const query = document.getElementById('search-users').value.toLowerCase();
    const allUsers = getUsers();
    const currentUser = getCurrentUser();
    const filtered = allUsers.filter(u => u.id !== currentUser.id && u.username.toLowerCase().includes(query));
    const container = document.getElementById('users-list');
    if (filtered.length === 0) { container.innerHTML = `<div class="empty-state"><p>🔍</p><p><strong>Пользователь не найден</strong></p><p style="font-size: 14px;">Попробуйте другой запрос</p></div>`; return; }
    renderUsersList(filtered);
}

function toggleFollowFromExplore(username) {
    const currentUser = getCurrentUser();
    const userToFollow = findUserByUsername(username);
    if (!userToFollow) return;
    const isFollowing = currentUser.following.includes(userToFollow.id);
    if (isFollowing) { currentUser.following = currentUser.following.filter(id => id !== userToFollow.id); userToFollow.followers = userToFollow.followers.filter(id => id !== currentUser.id); }
    else { currentUser.following.push(userToFollow.id); userToFollow.followers.push(currentUser.id); }
    updateUser(currentUser.id, { following: currentUser.following });
    updateUser(userToFollow.id, { followers: userToFollow.followers });
    showExploreTab(currentExploreTab);
    if (typeof loadFeed === 'function') loadFeed();
}

function goToUserProfile(username) { window.location.href = `profile.html?user=${username}`; }

document.addEventListener('DOMContentLoaded', () => { loadExplorePage(); });
