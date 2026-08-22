const CACHE='huize-chaos-v1-3-95';
const ASSETS=["./", "./index.html", "./style.css?v=1.3.95", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./assets/huize-chaos-wordmark-v1111.png", "./boodschappen/", "./boodschappen/index.html", "./boodschappen/style.css?v=1.3.95", "./boodschappen/js/app.js?v=1.3.95", "./boodschappen/js/shopping.js?v=1.3.95", "./boodschappen/js/stock.js?v=1.3.95", "./boodschappen/js/hutsel.js?v=1.3.95", "./boodschappen/js/insight.js?v=1.3.95", "./boodschappen/js/firebase.js?v=1.3.95", "./boodschappen/assets/shopping-icon.png", "./boodschappen/assets/huize-chaos-wordmark-v1111.png", "./gezinsplanner/", "./gezinsplanner/index.html", "./gezinsplanner/style.css?v=1.3.95", "./gezinsplanner/planner-v131.css?v=1.3.95", "./gezinsplanner/app.js?v=1.3.95", "./gezinsplanner/firebase.js?v=1.3.95", "./recepten/", "./recepten/index.html", "./recepten/style.css?v=1.3.95", "./recepten/app.js?v=1.3.95", "./recepten/recipes-data.js", "./gelegenheden/", "./gelegenheden/index.html", "./gelegenheden/style.css?v=1.3.95", "./gelegenheden/app.js?v=1.3.95"];
const SHARED_RECEIPT_CACHE='huize-chaos-shared-receipts-v1';
const SHARED_CONTENT_CACHE='huize-chaos-shared-content-v1';
async function handleSharedContent(request){
  const formData=await request.formData();
  const candidates=formData.getAll('receipt');
  const file=candidates.find(x=>x&&typeof x==='object'&&typeof x.arrayBuffer==='function'&&x.size>0);
  const requestUrl=new URL(request.url);
  if(file){
    const landingUrl=new URL('./boodschappen/?share-target=1&defer=1',requestUrl);
    const keyUrl=new URL('__shared-receipt__',landingUrl);
    const headers=new Headers({'Content-Type':file.type||'application/octet-stream','X-HC-File-Name':encodeURIComponent(file.name||'gedeelde-bon')});
    const cache=await caches.open(SHARED_RECEIPT_CACHE);
    await cache.put(keyUrl.href,new Response(file,{headers}));
    return Response.redirect(landingUrl.href,303);
  }
  const payload={title:String(formData.get('title')||''),text:String(formData.get('text')||''),url:String(formData.get('url')||'')};
  const landingUrl=new URL('./recepten/?share-target=1',requestUrl);
  const cache=await caches.open(SHARED_CONTENT_CACHE);
  await cache.put(new URL('__shared-recipe__',landingUrl).href,new Response(JSON.stringify(payload),{headers:{'Content-Type':'application/json'}}));
  return Response.redirect(landingUrl.href,303);
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==SHARED_RECEIPT_CACHE&&k!==SHARED_CONTENT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.searchParams.has('share-target')){e.respondWith(handleSharedContent(e.request));return;}if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
