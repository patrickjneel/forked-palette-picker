this.addEventListener('install', event => {
  event.waitUntil(
    caches.open('palette-assets-v1').then(cache => {
      return cache.addAll([
        '/',
        '/css/styles.css',
        '/pantone.svg',
        '/js/scripts.js',
        '/js/jquery.js'
      ])
    })
  );
});

this.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

this.addEventListener('activate', (event) => {
  let cacheWhitelist = ['palette-assets-v1'];

  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
    .then(() => clients.claim())
  );
});

this.addEventListener('message', (event) => {
  if (event.data.type === 'add-palette') {
    self.registration.showNotification(`${event.data.paletteName} was added`)
  }
});


