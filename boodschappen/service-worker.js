const CACHE_NAME='boodschappen-v1-3-81-pwa-1';
const APP_ASSETS=['./','./index.html','./style.css?v=1.3.84','./js/app.js?v=1.3.84','./js/shopping.js?v=1.3.84','./js/stock.js?v=1.3.84','./js/hutsel.js?v=1.3.84','./js/insight.js?v=1.3.84','./js/firebase.js?v=1.3.84','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
const SHARED_RECEIPT_CACHE='huize-chaos-shared-receipts-v1';
async function handleSharedReceipt(request){
  const formData=await request.formData();
  const candidates=formData.getAll('receipt');
  const file=candidates.find(x=>x&&typeof x==='object'&&typeof x.arrayBuffer==='function');
  const requestUrl=new URL(request.url);
  const landingUrl=new URL(requestUrl.href);
  landingUrl.search='?share-target=1';
  landingUrl.hash='';
  if(file){
    const keyUrl=new URL('__shared-receipt__',landingUrl);
    const headers=new Headers({'Content-Type':file.type||'application/octet-stream','X-HC-File-Name':encodeURIComponent(file.name||'gedeelde-bon')});
    const cache=await caches.open(SHARED_RECEIPT_CACHE);
    await cache.put(keyUrl.href,new Response(file,{headers}));
  }
  return Response.redirect(landingUrl.href,303);
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k!==SHARED_RECEIPT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.searchParams.has('share-target')){e.respondWith(handleSharedReceipt(e.request));return;}if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
