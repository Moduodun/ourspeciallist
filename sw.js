const CACHE_NAME = 'ourspeciallist-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.4.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.html',
        '/manifest.json'
      ]);
    }).catch(err => console.log('Cache install error:', err))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests and Supabase/Resend/external API calls entirely
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (url.includes('supabase')) return;
  if (url.includes('resend.com')) return;
  if (url.includes('allorigins.win')) return;
  if (!url.startsWith(self.location.origin)) return; // only handle same-origin requests

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache when offline
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/app.html');
          }
        });
      })
  );
});
