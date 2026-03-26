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
    const currentUser = getCurrentUser();
    if (!currentUser) { window.location.href = 'index.html'; return; }
    const otherUser = findUserByUsername(username);
    if (!otherUser) { window.location.href = 'messages.html'; return; }
    currentChatUserId = otherUser.id;
    document.getElementById('chat-username').textContent = otherUser.username;
    const avatarEl = document.getElementById('chat-avatar');
    if (otherUser.avatarData) { avatarEl.style.backgroundImage = `url('${otherUser.avatarData}')`; avatarEl.style.backgroundSize = 'cover'; avatarEl.textContent = ''; }
    else { avatarEl.style.backgroundImage = ''; avatarEl.textContent = otherUser.username[0].toUpperCase(); }
    markMessagesAsRead(otherUser.id, currentUser.id);
    loadMessages();
    if (typeof loadChats === 'function') setTimeout(() => loadChats(), 500);
}

function loadMessages() {
    const currentUser = getCurrentUser();
    const messages = getChatMessages(currentUser.id, currentChatUserId);
    const container = document.getElementById('chat-messages');
    if (messages.length === 0) { container.innerHTML = '<div style="text-align: center; padding: 40px;">Нет сообщений. Напишите что-нибудь!</div>'; return; }
    container.innerHTML = messages.map(msg => { const isFromMe = msg.fromUserId === currentUser.id; return `<div class="message ${isFromMe ? 'sent' : 'received'}">${msg.text ? escapeHtml(msg.text) : ''}${msg.imageData ? `<img src="${msg.imageData}" style="max-width: 200px; border-radius: 8px; margin-top: 4px;">` : ''}<div class="message-time">${formatInstagramTime(msg.timestamp)}</div></div>`; }).join('');
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;
    const currentUser = getCurrentUser();
    sendMessage(currentUser.id, currentChatUserId, text);
    input.value = '';
    loadMessages();
    if (typeof loadChats === 'function') setTimeout(() => loadChats(), 500);
}

function startMessagePolling() { if (messageInterval) clearInterval(messageInterval); messageInterval = setInterval(() => { if (currentChatUserId && window.location.pathname.includes('chat.html')) { loadMessages(); if (typeof loadChats === 'function') loadChats(); } }, 3000); }

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('messages.html')) { const user = getCurrentUser(); if (user) loadChats(); else window.location.href = 'index.html'; }
    if (window.location.pathname.includes('chat.html')) { const user = getCurrentUser(); if (user) { loadChat(); startMessagePolling(); } else window.location.href = 'index.html'; }
    const modal = document.getElementById('new-chat-modal'); if (modal) modal.onclick = function(e) { if (e.target === modal) closeNewChat(); };
});
