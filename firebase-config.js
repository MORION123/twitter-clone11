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

// Функция для отправки push-уведомлений
async function sendPushNotification(userId, notification) {
    try {
        // Получаем токен пользователя из Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmToken = userDoc.data()?.fcmToken;
        
        if (fcmToken) {
            // Здесь нужно отправить запрос на ваш сервер или через Firebase Cloud Functions
            console.log('Sending push to:', fcmToken, notification);
        }
    } catch (error) {
        console.log('Push error:', error);
    }
}

// Запрос разрешения на уведомления
async function requestNotificationPermission() {
    if (!Notification) {
        console.log('Уведомления не поддерживаются');
        return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        try {
            const token = await messaging.getToken();
            console.log('FCM Token:', token);
            
            // Сохраняем токен в Firestore
            const user = getCurrentUser();
            if (user) {
                await db.collection('users').doc(user.id).set({
                    fcmToken: token
                }, { merge: true });
            }
            return token;
        } catch (error) {
            console.log('Error getting token:', error);
        }
    }
    return null;
}

// Обработка входящих уведомлений
messaging.onMessage((payload) => {
    console.log('Message received:', payload);
    if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-180.png'
        });
    }
});

// Запрашиваем разрешение при загрузке
if ('Notification' in window && Notification.permission !== 'denied') {
    requestNotificationPermission();
}
