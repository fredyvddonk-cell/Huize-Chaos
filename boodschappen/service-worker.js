const CACHE='huize-chaos-boodschappen-v1-4-202-41';
const ASSETS=['./','./index.html','./manifest.webmanifest'];
const SHARED_RECEIPT_CACHE='huize-chaos-shared-receipts-v1';
const SHARED_CONTENT_CACHE='huize-chaos-shared-content-v1';
async function handleSharedContent(request){
  const requestUrl=new URL(request.url);
  const landingUrl=new URL('./?share-target=1',requestUrl);
  try{
    const formData=await request.formData();
    const files=[...formData.values()].filter(x=>x&&typeof x.arrayBuffer==='function'&&x.size>0);
    const file=files.find(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name||''))
      ||files.find(x=>x.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(x.name||''));
    if(file){
      // A unique token prevents two shares overwriting each other before the app opens.
      const token=crypto.randomUUID();
      const keyUrl=new URL('__shared-receipt__/'+token,landingUrl);
      const name=file.name|| (file.type==='application/pdf'?'gedeelde-bon.pdf':'gedeelde-bon.jpg');
      const headers=new Headers({'Content-Type':file.type||'application/octet-stream','X-HC-File-Name':encodeURIComponent(name)});
      const cache=await caches.open(SHARED_RECEIPT_CACHE);
      await cache.put(keyUrl.href,new Response(file,{headers}));
      landingUrl.searchParams.set('share-id',token);
      return Response.redirect(landingUrl.href,303);
    }
    // Some supermarket apps share a URL instead of the PDF itself. Do not
    // pretend this is a receipt: explain what was received to the user.
    const sharedText=[formData.get('title'),formData.get('text'),formData.get('url')]
      .filter(x=>typeof x==='string'&&x.trim()).join(' ').trim();
    landingUrl.searchParams.set('share-error',sharedText
      ?'Er is alleen een link of tekst gedeeld, geen PDF of afbeelding. Open de bon in Jumbo of AH en deel het bestand, of sla de bon op als PDF en kies deze in HC.'
      :'Geen PDF of afbeelding ontvangen. Deel de digitale bon als bestand vanuit Jumbo of AH.');
    if(sharedText){landingUrl.searchParams.set('share-text',sharedText.slice(0,1500));}
    return Response.redirect(landingUrl.href,303);
  }catch(err){
    console.error('Ontvangen gedeelde bon mislukt',err);
    landingUrl.searchParams.set('share-error','Ontvangen van het gedeelde bestand is mislukt. Kies de bon eventueel handmatig.');
    return Response.redirect(landingUrl.href,303);
  }
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==SHARED_RECEIPT_CACHE&&k!==SHARED_CONTENT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.searchParams.has('share-target')){e.respondWith(handleSharedContent(e.request));return;}if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));});
