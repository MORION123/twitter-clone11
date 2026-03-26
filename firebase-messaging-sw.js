importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background message:', payload);
    const notificationTitle = payload.notification?.title || 'Instagram Clone';
    const notificationOptions = {
        body: payload.notification?.body || 'У вас новое уведомление',
        icon: '/icon-180.png',
        badge: '/icon-180.png',
        data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
