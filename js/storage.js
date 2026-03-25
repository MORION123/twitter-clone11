// Хранилище данных (localStorage)
const STORAGE_KEYS = {
    USERS: 'twitter_users',
    POSTS: 'twitter_posts',
    CURRENT_USER: 'twitter_current_user'
};

// Инициализация данных
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                bio: 'Администратор Twitter Clone',
                avatar: '👨‍💻',
                followers: [],
                following: []
            },
            {
                id: '2',
                username: 'john_doe',
                email: 'john@example.com',
                password: '123456',
                bio: 'Люблю программирование и кофе ☕',
                avatar: '👨‍💻',
                followers: [],
                following: []
            },
            {
                id: '3',
                username: 'jane_smith',
                email: 'jane@example.com',
                password: '123456',
                bio: 'Дизайнер, фотограф 📸',
                avatar: '👩‍🎨',
                followers: [],
                following: []
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        const defaultPosts = [
            {
                id: '1',
                userId: '2',
                content: 'Привет, мир! Это мой первый пост в Twitter Clone 🚀',
                image: null,
                timestamp: Date.now() - 3600000,
                likes: [],
                retweets: [],
                replies: []
            },
            {
                id: '2',
                userId: '3',
                content: 'Отличный день для разработки! 💻✨',
                image: null,
                timestamp: Date.now() - 7200000,
                likes: [],
                retweets: [],
                replies: []
            }
        ];
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(defaultPosts));
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

// Сохранить пользователей
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
        avatar: '👤',
        followers: [],
        following: []
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// Обновить пользователя
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        saveUsers(users);
        
        // Если обновляем текущего пользователя, обновляем localStorage
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
        }
        return users[index];
    }
    return null;
}
