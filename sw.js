// Service Worker для PWA
const CACHE_NAME = 'instagram-clone-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/feed.html',
  '/profile.html',
  '/messages.html',
  '/stories.html',
  '/chat.html',
  '/css/style.css',
  '/css/light-theme.css',
  '/css/dark-theme.css',
  '/js/storage.js',
  '/js/app.js',
  '/js/feed.js',
  '/js/profile.js',
  '/js/messages.js',
  '/js/stories.js',
  '/js/theme.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
