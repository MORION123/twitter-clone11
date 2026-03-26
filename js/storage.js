// Хранилище данных
const STORAGE_KEYS = {
    USERS: 'instagram_users',
    POSTS: 'instagram_posts',
    STORIES: 'instagram_stories',
    MESSAGES: 'instagram_messages',
    SAVED_POSTS: 'instagram_saved',
    CURRENT_USER: 'instagram_current_user',
    THEME: 'instagram_theme'
};

// Инициализация данных
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            {
                id: '1',
                username: 'instagram',
                email: 'instagram@example.com',
                password: 'instagram123',
                bio: 'Официальный аккаунт Instagram Clone',
                avatarData: null,
                followers: ['2', '3'],
                following: ['2', '3']
            },
            {
                id: '2',
                username: 'john_doe',
                email: 'john@example.com',
                password: '123456',
                bio: 'Люблю фотографировать ☕',
                avatarData: null,
                followers: ['1'],
                following: ['1']
            },
            {
                id: '3',
                username: 'jane_smith',
                email: 'jane@example.com',
                password: '123456',
                bio: 'Путешествия и фото 📸',
                avatarData: null,
                followers: ['1'],
                following: ['1']
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        const defaultPosts = [
            {
                id: '1',
                userId: '2',
                content: 'Первый пост в Instagram Clone! 🚀',
                image: null,
                video: null,
                timestamp: Date.now() - 3600000,
                likes: ['1'],
                comments: [
                    { userId: '1', text: 'Отлично!', timestamp: Date.now() - 3000000 }
                ],
                location: 'Москва'
            },
            {
                id: '2',
                userId: '3',
                content: 'Красивый закат сегодня 🌅',
                image: null,
                video: null,
                timestamp: Date.now() - 7200000,
                likes: ['1'],
                comments: [],
                location: 'Санкт-Петербург'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(defaultPosts));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.STORIES)) {
        localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) {
        localStorage.setItem(STORAGE_KEYS.SAVED_POSTS, JSON.stringify({}));
    }
}

// Получить всех пользователей
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

// Получить все посты
function getPosts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || [];
}

// Сохранить посты
function savePosts(posts) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

// Получить текущего пользователя
function getCurrentUser() {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

// Установить текущего пользователя
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}

// Найти пользователя по имени
function findUserByUsername(username) {
    const users = getUsers();
    return users.find(u => u.username === username);
}

// Найти пользователя по ID
function findUserById(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId);
}

// Добавить пользователя
function addUser(userData) {
    const users = getUsers();
    const newUser = {
        id: Date.now().toString(),
        ...userData,
        bio: '',
        avatarData: null,
        followers: [],
        following: []
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// Сохранить пользователей
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Обновить пользователя
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        saveUsers(users);
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
        }
        return users[index];
    }
    return null;
}

// Истории
function getStories() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STORIES)) || [];
}

function saveStories(stories) {
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
}

function addStory(userId, imageData, text) {
    const stories = getStories();
    const newStory = {
        id: Date.now().toString(),
        userId: userId,
        imageData: imageData,
        text: text || '',
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
    };
    stories.push(newStory);
    saveStories(stories);
    return newStory;
}

function getActiveStories() {
    const stories = getStories();
    const now = Date.now();
    return stories.filter(s => s.expiresAt > now);
}

// Сообщения
function getMessages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
}

function saveMessages(messages) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
}

function sendMessage(fromUserId, toUserId, text, imageData = null) {
    const messages = getMessages();
    const newMessage = {
        id: Date.now().toString(),
        fromUserId: fromUserId,
        toUserId: toUserId,
        text: text,
        imageData: imageData,
        timestamp: Date.now(),
        read: false
    };
    messages.push(newMessage);
    saveMessages(messages);
    return newMessage;
}

function getChatMessages(userId1, userId2) {
    const messages = getMessages();
    return messages.filter(m => 
        (m.fromUserId === userId1 && m.toUserId === userId2) ||
        (m.fromUserId === userId2 && m.toUserId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
}

function getChats(userId) {
    const messages = getMessages();
    const chatUsers = new Set();
    messages.forEach(m => {
        if (m.fromUserId === userId) chatUsers.add(m.toUserId);
        if (m.toUserId === userId) chatUsers.add(m.fromUserId);
    });
    
    const chats = [];
    chatUsers.forEach(chatUserId => {
        const lastMessage = messages.filter(m => 
            (m.fromUserId === userId && m.toUserId === chatUserId) ||
            (m.fromUserId === chatUserId && m.toUserId === userId)
        ).sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (lastMessage) {
            chats.push({
                userId: chatUserId,
                lastMessage: lastMessage,
                unreadCount: messages.filter(m => 
                    m.fromUserId === chatUserId && m.toUserId === userId && !m.read
                ).length
            });
        }
    });
    
    return chats.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
}

function markMessagesAsRead(fromUserId, toUserId) {
    const messages = getMessages();
    let updated = false;
    messages.forEach(m => {
        if (m.fromUserId === fromUserId && m.toUserId === toUserId && !m.read) {
            m.read = true;
            updated = true;
        }
    });
    if (updated) saveMessages(messages);
}

// Сохраненные посты
function getSavedPosts(userId) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) || {};
    return saved[userId] || [];
}

function toggleSavePost(userId, postId) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) || {};
    if (!saved[userId]) saved[userId] = [];
    
    const index = saved[userId].indexOf(postId);
    if (index === -1) {
        saved[userId].push(postId);
    } else {
        saved[userId].splice(index, 1);
    }
    
    localStorage.setItem(STORAGE_KEYS.SAVED_POSTS, JSON.stringify(saved));
    return index === -1; // true если сохранили, false если удалили
}

function isPostSaved(userId, postId) {
    const saved = getSavedPosts(userId);
    return saved.includes(postId);
}

// Инициализация
initStorage();
