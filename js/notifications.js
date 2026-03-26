// Логика уведомлений

function loadNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const notifications = getUserNotifications(currentUser.id);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = '<div style="padding: 12px; text-align: center; color: #71767b;">Нет уведомлений</div>';
        return;
    }
    
    container.innerHTML = notifications.slice(0, 10).map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="handleNotificationClick('${notif.id}', '${notif.type}', '${notif.postId || ''}')">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <div>${getNotificationIcon(notif.type)}</div>
                <div style="flex: 1;">
                    <div>${escapeHtml(notif.message)}</div>
                    <div style="font-size: 12px; color: #71767b;">${formatDate(notif.timestamp)}</div>
                </div>
                ${!notif.read ? '<div style="width: 8px; height: 8px; background-color: #1d9bf0; border-radius: 50%;"></div>' : ''}
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    switch(type) {
        case 'like': return '❤️';
        case 'retweet': return '🔄';
        case 'reply': return '💬';
        case 'follow': return '👤';
        default: return '🔔';
    }
}

function handleNotificationClick(notificationId, type, postId) {
    markNotificationRead(notificationId);
    
    if (postId && (type === 'like' || type === 'retweet' || type === 'reply')) {
        const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth' });
            postElement.style.backgroundColor = 'rgba(29, 155, 240, 0.2)';
            setTimeout(() => {
                postElement.style.backgroundColor = '';
            }, 2000);
        }
    }
    
    loadNotifications();
}
