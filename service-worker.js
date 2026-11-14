const CACHE='huize-chaos-v1-4-202-24';
const ASSETS=["./", "./index.html", "./style.css?v=1.4.202.23", "./hc-theme.css?v=1.4.202.23", "./hc-module-nav.js?v=1.4.202.23", "./hc-sync-indicator.js?v=1.4.202.23", "./home-firebase.js?v=1.4.202.23", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./assets/huize-chaos-wordmark-v1111.png", "./boodschappen/", "./boodschappen/index.html", "./boodschappen/style.css?v=1.4.202.23", "./boodschappen/js/app.js?v=1.4.202.23", "./boodschappen/js/shopping.js?v=1.4.202.23", "./boodschappen/js/stock.js?v=1.4.202.23", "./boodschappen/js/hutsel.js?v=1.4.202.23", "./boodschappen/js/insight.js?v=1.4.202.23", "./boodschappen/js/firebase.js?v=1.4.202.23", "./boodschappen/assets/shopping-icon.png", "./boodschappen/assets/huize-chaos-wordmark-v1111.png", "./gezinsplanner/", "./gezinsplanner/index.html", "./gezinsplanner/style.css?v=1.4.117", "./gezinsplanner/planner-v131.css?v=1.4.202.23", "./gezinsplanner/app.js?v=1.4.202.23", "./gezinsplanner/firebase.js?v=1.4.202.23", "./recepten/", "./recepten/index.html", "./recepten/style.css?v=1.4.202.23", "./recepten/app.js?v=1.4.202.23", "./recepten/recipes-data.js", "./gelegenheden/", "./gelegenheden/index.html", "./gelegenheden/style.css?v=1.4.117", "./gelegenheden/app.js?v=1.4.117", "./notities/", "./notities/index.html", "./notities/style.css?v=1.4.117", "./notities/app.js?v=1.4.202.23", "./auto/", "./auto/index.html", "./auto/style.css?v=1.4.117", "./auto/app.js?v=1.4.117", "./auto/firebase.js?v=1.4.117", "./aankopen/", "./aankopen/index.html", "./aankopen/style.css?v=1.4.202.23", "./aankopen/app.js?v=1.4.202.23"];
const SHARED_RECEIPT_CACHE='huize-chaos-shared-receipts-v1';
const SHARED_CONTENT_CACHE='huize-chaos-shared-content-v1';
async function handleSharedContent(request){
  const requestUrl=new URL(request.url);
  const landingUrl=new URL('./boodschappen/?share-target=1',requestUrl);
  try{
    const formData=await request.formData();
    const files=[...formData.values()].filter(x=>x&&typeof x.arrayBuffer==='function'&&x.size>0);
    const file=files.find(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name||''))||files.find(x=>x.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(x.name||''));
    if(file){
      const keyUrl=new URL('__shared-receipt__',landingUrl);
      const name=file.name|| (file.type==='application/pdf'?'gedeelde-bon.pdf':'gedeelde-bon.jpg');
      const headers=new Headers({'Content-Type':file.type||'application/octet-stream','X-HC-File-Name':encodeURIComponent(name)});
      const cache=await caches.open(SHARED_RECEIPT_CACHE);
      await cache.put(keyUrl.href,new Response(file,{headers}));
      return Response.redirect(landingUrl.href,303);
    }
    // Een lege of ongeschikte deelactie mag niet stilzwijgend op het startscherm eindigen.
    landingUrl.searchParams.set('share-error','Geen PDF of afbeelding ontvangen vanuit OneNote.');
    return Response.redirect(landingUrl.href,303);
  }catch(err){
    console.error('Ontvangen gedeelde bon mislukt',err);
    landingUrl.searchParams.set('share-error','Ontvangen van het gedeelde bestand is mislukt.');
    return Response.redirect(landingUrl.href,303);
  }
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==SHARED_RECEIPT_CACHE&&k!==SHARED_CONTENT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.searchParams.has('share-target')){e.respondWith(handleSharedContent(e.request));return;}if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
