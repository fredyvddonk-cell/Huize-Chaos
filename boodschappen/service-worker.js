const CACHE_NAME='huize-chaos-boodschappen-v1-4-202-18';
const APP_ASSETS=['./','./index.html','./style.css?v=1.4.202.23','./js/app.js?v=1.4.202.23','./js/shopping.js?v=1.4.202.23','./js/stock.js?v=1.4.202.23','./js/hutsel.js?v=1.4.202.23','./js/insight.js?v=1.4.202.23','./js/firebase.js?v=1.4.202.23','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
const SHARED_RECEIPT_CACHE='huize-chaos-shared-receipts-v1';
async function handleSharedReceipt(request){
  const requestUrl=new URL(request.url);
  const landingUrl=new URL('./?share-target=1',requestUrl);
  try{
    const formData=await request.formData();
    const files=[...formData.values()].filter(x=>x&&typeof x.arrayBuffer==='function'&&x.size>0);
    const file=files.find(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name||''))||files.find(x=>x.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(x.name||''));
    if(file){
      const keyUrl=new URL('__shared-receipt__',landingUrl);
      const name=file.name||(file.type==='application/pdf'?'gedeelde-bon.pdf':'gedeelde-bon.jpg');
      const headers=new Headers({'Content-Type':file.type||'application/octet-stream','X-HC-File-Name':encodeURIComponent(name)});
      await (await caches.open(SHARED_RECEIPT_CACHE)).put(keyUrl.href,new Response(file,{headers}));
    }else landingUrl.searchParams.set('share-error','Geen PDF of afbeelding ontvangen vanuit OneNote.');
  }catch(err){console.error('Gedeelde bon ontvangen mislukt',err);landingUrl.searchParams.set('share-error','Ontvangen van het gedeelde bestand is mislukt.');}
  return Response.redirect(landingUrl.href,303);
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k!==SHARED_RECEIPT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.searchParams.has('share-target')){e.respondWith(handleSharedReceipt(e.request));return;}if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
