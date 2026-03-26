// Firebase конфигурация
// ЗАМЕНИТЕ ЭТИ ДАННЫЕ НА СВОИ ИЗ КОНСОЛИ FIREBASE
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const messaging = firebase.messaging();

// Настройка Firestore
const postsCollection = db.collection('posts');
const usersCollection = db.collection('users');
const reelsCollection = db.collection('reels');
const notificationsCollection = db.collection('notifications');

// Функции для работы с Firebase
async function createUserInFirebase(user) {
    await usersCollection.doc(user.id).set({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        avatarData: user.avatarData || null,
        followers: [],
        following: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function savePostToFirebase(post) {
    const docRef = await postsCollection.add({
        userId: post.userId,
        content: post.content,
        image: post.image || null,
        video: post.video || null,
        location: post.location || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
        comments: []
    });
    return docRef.id;
}

async function saveReelToFirebase(reel) {
    const docRef = await reelsCollection.add({
        userId: reel.userId,
        video: reel.video,
        caption: reel.caption,
        music: reel.music || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
        comments: []
    });
    return docRef.id;
}

async function uploadFileToStorage(file, path) {
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return url;
}

// Push-уведомления
async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        const token = await messaging.getToken();
        // Сохраняем токен в Firebase
        const user = getCurrentUser();
        if (user) {
            await usersCollection.doc(user.id).update({
                fcmToken: token
            });
        }
        return token;
    }
    return null;
}

// Обработка входящих уведомлений
messaging.onMessage((payload) => {
    console.log('Message received:', payload);
    showNotification(payload.notification.title, payload.notification.body);
});

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-180.png' });
    }
}
