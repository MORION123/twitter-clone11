const STORAGE_KEYS = {
    USERS: 'instagram_users',
    POSTS: 'instagram_posts',
    STORIES: 'instagram_stories',
    MESSAGES: 'instagram_messages',
    SAVED_POSTS: 'instagram_saved',
    CURRENT_USER: 'instagram_current_user',
    THEME: 'instagram_theme'
};

const BOT_ACCOUNTS = [
    { id: 'bot_1', username: 'natgeo', email: 'natgeo@instagram.com', password: 'bot123', bio: 'National Geographic 📸 Фото дикой природы и путешествий', avatarData: null, followers: [], following: [], isBot: true },
    { id: 'bot_2', username: 'travel_diaries', email: 'travel@instagram.com', password: 'bot123', bio: 'Путешествия по миру ✈️ Лучшие места для вдохновения', avatarData: null, followers: [], following: [], isBot: true },
    { id: 'bot_3', username: 'foodie_paradise', email: 'food@instagram.com', password: 'bot123', bio: 'Гастрономические путешествия 🍜 Лучшие рестораны мира', avatarData: null, followers: [], following: [], isBot: true },
    { id: 'bot_4', username: 'fitness_life', email: 'fitness@instagram.com', password: 'bot123', bio: 'Здоровый образ жизни 💪 Тренировки и правильное питание', avatarData: null, followers: [], following: [], isBot: true },
    { id: 'bot_5', username: 'art_gallery', email: 'art@instagram.com', password: 'bot123', bio: 'Современное искусство 🎨 Картины и фотографии', avatarData: null, followers: [], following: [], isBot: true },
    { id: 'bot_6', username: 'tech_world', email: 'tech@instagram.com', password: 'bot123', bio: 'Технологии и гаджеты 📱 Обзоры новинок', avatarData: null, followers: [], following: [], isBot: true }
];

const BOT_POSTS = [
    { userId: 'bot_1', content: 'Закат над горами 🏔️ Невероятная красота! #природа #горы', image: null },
    { userId: 'bot_1', content: 'Львы в саванне 🦁 Дикая природа Африки', image: null },
    { userId: 'bot_2', content: 'Бали, Индонезия 🌴 Рай на земле #travel #bali', image: null },
    { userId: 'bot_2', content: 'Париж, Эйфелева башня 🗼 Город любви', image: null },
    { userId: 'bot_3', content: 'Японская кухня 🍣 Суши и сашими', image: null },
    { userId: 'bot_3', content: 'Итальянская пицца 🍕 Настоящий вкус Италии', image: null },
    { userId: 'bot_4', content: 'Утренняя зарядка 🌅 Начни день с пользы! #fitness', image: null },
    { userId: 'bot_4', content: 'Правильное питание 🥗 Здоровое меню на неделю', image: null },
    { userId: 'bot_5', content: 'Картина "Звездная ночь" 🌟 Ван Гог', image: null },
    { userId: 'bot_5', content: 'Современная скульптура 🗿 Уличное искусство', image: null },
    { userId: 'bot_6', content: 'Новый iPhone 📱 Обзор флагмана', image: null },
    { userId: 'bot_6', content: 'Умные часы ⌚ Фитнес-трекеры', image: null }
];

function initStorage() {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    if (!users) {
        users = [...BOT_ACCOUNTS];
        users.push({ id: 'user_1', username: 'instagram_user', email: 'user@example.com', password: 'user123', bio: 'Обычный пользователь Instagram', avatarData: null, followers: [], following: [], isBot: false });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
        const hasBots = users.some(u => u.isBot);
        if (!hasBots) {
            users.push(...BOT_ACCOUNTS);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
    
    let posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS));
    if (!posts) {
        const now = Date.now();
        posts = BOT_POSTS.map((post, index) => ({
            id: `post_${index}_${Date.now()}`,
            userId: post.userId,
            content: post.content,
            image: null,
            video: null,
            timestamp: now - (index * 3600000),
            likes: [],
            comments: [],
            location: ''
        }));
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.STORIES)) localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) localStorage.setItem(STORAGE_KEYS.SAVED_POSTS, JSON.stringify({}));
}

function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || []; }
function getPosts() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || []; }
function savePosts(posts) { localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)); }
function getCurrentUser() {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}
function setCurrentUser(user) { if (user) { localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id); } else { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); } }
function findUserByUsername(username) { const users = getUsers(); return users.find(u => u.username === username); }
function findUserById(userId) { const users = getUsers(); return users.find(u => u.id === userId); }
function addUser(userData) {
    const users = getUsers();
    const newUser = { id: Date.now().toString(), ...userData, bio: '', avatarData: null, followers: [], following: [] };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
}
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
        return users[index];
    }
    return null;
}
function getStories() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STORIES)) || []; }
function saveStories(stories) { localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories)); }
function addStory(userId, imageData, text) {
    const stories = getStories();
    stories.push({ id: Date.now().toString(), userId, imageData, text: text || '', timestamp: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    saveStories(stories);
}
function getActiveStories() { return getStories().filter(s => s.expiresAt > Date.now()); }
function getMessages() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || []; }
function saveMessages(messages) { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }
function sendMessage(fromUserId, toUserId, text, imageData = null) {
    const messages = getMessages();
    messages.push({ id: Date.now().toString(), fromUserId, toUserId, text, imageData, timestamp: Date.now(), read: false });
    saveMessages(messages);
}
function getChatMessages(userId1, userId2) {
    const messages = getMessages();
    return messages.filter(m => (m.fromUserId === userId1 && m.toUserId === userId2) || (m.fromUserId === userId2 && m.toUserId === userId1)).sort((a, b) => a.timestamp - b.timestamp);
}
function getChats(userId) {
    const messages = getMessages();
    const chatUsers = new Set();
    messages.forEach(m => { if (m.fromUserId === userId) chatUsers.add(m.toUserId); if (m.toUserId === userId) chatUsers.add(m.fromUserId); });
    const chats = [];
    chatUsers.forEach(chatUserId => {
        const lastMessage = messages.filter(m => (m.fromUserId === userId && m.toUserId === chatUserId) || (m.fromUserId === chatUserId && m.toUserId === userId)).sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastMessage) chats.push({ userId: chatUserId, lastMessage, unreadCount: messages.filter(m => m.fromUserId === chatUserId && m.toUserId === userId && !m.read).length });
    });
    return chats.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
}
function markMessagesAsRead(fromUserId, toUserId) {
    const messages = getMessages();
    messages.forEach(m => { if (m.fromUserId === fromUserId && m.toUserId === toUserId && !m.read) m.read = true; });
    saveMessages(messages);
}
function getSavedPosts(userId) { const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) || {}; return saved[userId] || []; }
function toggleSavePost(userId, postId) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_POSTS)) || {};
    if (!saved[userId]) saved[userId] = [];
    const index = saved[userId].indexOf(postId);
    if (index === -1) saved[userId].push(postId);
    else saved[userId].splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.SAVED_POSTS, JSON.stringify(saved));
    return index === -1;
}
function isPostSaved(userId, postId) { return getSavedPosts(userId).includes(postId); }

initStorage();
