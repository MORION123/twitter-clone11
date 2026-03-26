let currentChatUserId = null;
let messageInterval = null;

function loadChats() {
    const currentUser = getCurrentUser();
    if (!currentUser) { window.location.href = 'index.html'; return; }
    const chats = getChats(currentUser.id);
    const container = document.getElementById('chats-list');
    if (chats.length === 0) { container.innerHTML = `<div style="text-align: center; padding: 40px;"><p>✉️</p><p><strong>Ваши сообщения</strong></p><p style="font-size: 14px;">Отправьте сообщение, чтобы начать чат</p><button onclick="openNewChat()" style="margin-top: 16px; padding: 8px 16px; background: #0095f6; color: white; border: none; border-radius: 8px;">Написать</button></div>`; return; }
    container.innerHTML = chats.map(chat => { const user = findUserById(chat.userId); const lastMessage = chat.lastMessage; const isFromMe = lastMessage.fromUserId === currentUser.id; return `<div class="chat-item" onclick="openChat('${user?.username}')"><div class="avatar-medium" style="background-image: url('${user?.avatarData || ''}'); background-size: cover;">${!user?.avatarData ? (user?.username[0] || '') : ''}</div><div style="flex: 1;"><div><strong>${escapeHtml(user?.username)}</strong></div><div style="font-size: 12px; color: #8e8e8e;">${isFromMe ? 'Вы: ' : ''}${escapeHtml(lastMessage.text?.substring(0, 30) || 'Фото')}</div></div>${chat.unreadCount > 0 ? `<div style="background: #0095f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${chat.unreadCount}</div>` : ''}</div>`; }).join('');
}

function openChat(username) { window.location.href = `chat.html?user=${username}`; }
function openNewChat() { document.getElementById('new-chat-modal').style.display = 'flex'; searchUsersForChat(); }
function closeNewChat() { document.getElementById('new-chat-modal').style.display = 'none'; }

function searchUsersForChat() {
    const query = document.getElementById('chat-search').value.toLowerCase();
    const currentUser = getCurrentUser();
    const users = getUsers();
    const filteredUsers = users.filter(u => u.id !== currentUser.id && u.username.toLowerCase().includes(query));
    const container = document.getElementById('users-list');
    container.innerHTML = filteredUsers.map(user => `<div class="chat-item" onclick="startChat('${user.username}')"><div class="avatar-medium" style="background-image: url('${user.avatarData || ''}'); background-size: cover;">${!user.avatarData ? (user.username[0] || '') : ''}</div><div><div><strong>${escapeHtml(user.username)}</strong></div><div style="font-size: 12px; color: #8e8e8e;">${user.bio || ''}</div></div></div>`).join('');
    if (filteredUsers.length === 0) container.innerHTML = '<div style="padding: 20px; text-align: center;">Пользователи не найдены</div>';
}

function startChat(username) { closeNewChat(); openChat(username); }

function loadChat() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
