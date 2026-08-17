const CACHE_NAME='boodschappen-v1-2-10-pwa-1';
const APP_ASSETS=['./','./index.html','./style.css?v=1.2.10','./js/app.js?v=1.2.10','./js/shopping.js?v=1.2.10','./js/stock.js?v=1.2.10','./js/hutsel.js?v=1.2.10','./js/firebase.js?v=1.2.10','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
