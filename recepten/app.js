// V1.3.116 - de receptenmodule start altijd lokaal. Firebase wordt pas daarna dynamisch geladen,
// zodat een netwerk/CDN-probleem het Weekmenu niet meer kan blokkeren.
const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
let auth=null,db=null,recipeRef=null,occasionRef=null;
let fbOnAuthStateChanged=null,fbGetDoc=null,fbOnSnapshot=null,fbServerTimestamp=null,fbSetDoc=null;
const BASE=window.HUIZE_CHAOS_RECIPES||[];const PENDING_KEY='hc-recipe-pending-v1',CUSTOM_KEY='hc-recipe-custom-v1',META_KEY='hc-recipe-meta-v1';
const list=document.querySelector('#list'),pendingBox=document.querySelector('#pending'),detail=document.querySelector('#detail'),search=document.querySelector('#search'),syncStatus=document.querySelector('#recipeSyncStatus');
let current=null,edited=null,cloudReady=false,applyingCloud=false,syncTimer=0,user=null,stopCloud=null,openedFromWeekMenu=false,returnEventId='',displayServings='';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(v)?v:f}catch(_){return f}};const pending=()=>read(PENDING_KEY),custom=()=>read(CUSTOM_KEY),recipeMeta=()=>read(META_KEY);
function metaFor(id){return recipeMeta().find(x=>String(x.id)===String(id))||{id:String(id),favorite:false,memo:''}}
function saveMetaFor(id,patch){const a=recipeMeta(),key=String(id),i=a.findIndex(x=>String(x.id)===key),next={...(i>=0?a[i]:{id:key,favorite:false,memo:''}),...patch,id:key};if(i>=0)a[i]=next;else a.push(next);write(META_KEY,a);scheduleSync();renderList();return next}
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));const mergeById=(a,b)=>{const m=new Map();[...a,...b].forEach(x=>m.set(String(x.id),x));return [...m.values()]};
function allRecipes(){const edits=new Map();BASE.forEach(r=>{try{const x=JSON.parse(localStorage.getItem('hc_recipe_'+r.id)||'null');if(x)edits.set(String(r.id),x)}catch(_){}});return [...BASE.map(r=>edits.get(String(r.id))||r),...custom()]}
function setStatus(t){if(syncStatus)syncStatus.textContent=t}
function scheduleSync(){if(!cloudReady||applyingCloud||!user)return;clearTimeout(syncTimer);setStatus('Synchroniseren…');syncTimer=setTimeout(syncCloud,250)}
async function syncCloud(){if(!user||!recipeRef||!fbSetDoc||!fbServerTimestamp)return;await fbSetDoc(recipeRef,{pending:pending(),custom:custom(),meta:recipeMeta(),updatedAt:fbServerTimestamp(),updatedBy:user.uid},{merge:false});setStatus('Gesynchroniseerd')}
async function initCloud(){
  try{
    const [appMod,authMod,fireMod]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js')
    ]);
    const firebaseApp=appMod.initializeApp(firebaseConfig);
    auth=authMod.getAuth(firebaseApp);db=fireMod.getFirestore(firebaseApp);
    recipeRef=fireMod.doc(db,'households','huize-chaos','insight','recipes');occasionRef=fireMod.doc(db,'households','huize-chaos','insight','occasions');
    fbOnAuthStateChanged=authMod.onAuthStateChanged;fbGetDoc=fireMod.getDoc;fbOnSnapshot=fireMod.onSnapshot;fbServerTimestamp=fireMod.serverTimestamp;fbSetDoc=fireMod.setDoc;
    fbOnAuthStateChanged(auth,async u=>{user=u;if(!u){setStatus('Alleen op dit apparaat');return}setStatus('Synchroniseren…');try{const snap=await fbGetDoc(recipeRef);if(snap.exists()){applyingCloud=true;const d=snap.data()||{};write(PENDING_KEY,mergeById(d.pending||[],pending()));write(CUSTOM_KEY,mergeById(d.custom||[],custom()));write(META_KEY,mergeById(d.meta||[],recipeMeta()));applyingCloud=false;renderList();renderWeekMenu?.();}cloudReady=true;await syncCloud();stopCloud?.();stopCloud=fbOnSnapshot(recipeRef,snap=>{if(!snap.exists()||applyingCloud)return;const d=snap.data()||{};applyingCloud=true;write(PENDING_KEY,d.pending||[]);write(CUSTOM_KEY,d.custom||[]);write(META_KEY,d.meta||[]);applyingCloud=false;renderList();renderWeekMenu?.();setStatus('Gesynchroniseerd')},()=>setStatus('Synchronisatie niet beschikbaar'));}catch(err){console.warn(err);setStatus('Alleen op dit apparaat')}});
  }catch(err){console.warn('Firebase kon niet worden geladen; lokaal gebruik blijft beschikbaar.',err);setStatus('Alleen op dit apparaat')}
}
function savePending(a){write(PENDING_KEY,a);renderList();scheduleSync()}function saveCustom(a){write(CUSTOM_KEY,a);renderList();scheduleSync()}
function sourceLabel(r){try{return r.sourceUrl?new URL(r.sourceUrl).hostname.replace(/^www\./,''):r.source||'Gedeeld'}catch(_){return r.source||'Gedeeld'}}
function renderList(){const q=search.value.trim().toLowerCase(),drafts=pending();pendingBox.innerHTML=drafts.length?`<section class="pending-recipes"><div class="pending-head"><h2>Te controleren</h2><span>${drafts.length}</span></div><p>Gedeelde recepten staan hier tot je ze hebt nagekeken.</p>${drafts.map(r=>`<button class="pending-recipe-card" data-pending="${esc(r.id)}"><span><strong>${esc(r.title||'Gedeeld recept')}</strong><small>${esc(sourceLabel(r))}</small></span><span>Controleren ›</span></button>`).join('')}</section>`:'';pendingBox.querySelectorAll('[data-pending]').forEach(b=>b.onclick=()=>openPending(b.dataset.pending));const a=allRecipes().filter(r=>(r.title||'').toLowerCase().includes(q)).sort((a,b)=>Number(metaFor(b.id).favorite)-Number(metaFor(a.id).favorite)).slice(0,150);list.innerHTML=a.length?a.map(r=>`<button class="recipe-card" data-id="${esc(r.id)}"><span><strong>${metaFor(r.id).favorite?'★ ':''}${esc(r.title)}</strong><small>${[r.servings?esc(r.servings)+' personen':'',r.source?esc(r.source):'',r.imported?'geïmporteerd':''].filter(Boolean).join(' · ')}</small></span><span class="go">›</span></button>`).join(''):`<div class="empty">Geen recepten gevonden.</div>`;list.querySelectorAll('.recipe-card').forEach(b=>b.onclick=()=>openRecipe(b.dataset.id))}
function hideList(){list.classList.add('hidden');pendingBox.classList.add('hidden');search.classList.add('hidden');detail.classList.remove('hidden');document.querySelector('.recipes')?.classList.add('recipe-detail-open')}function backList(){if(returnEventId){const id=returnEventId;returnEventId='';window.location.href=`../gelegenheden/?event=${encodeURIComponent(id)}`;return}detail.classList.add('hidden');list.classList.remove('hidden');pendingBox.classList.remove('hidden');search.classList.remove('hidden');document.querySelector('.recipes')?.classList.remove('recipe-detail-open');current=null;edited=null;displayServings='';const backToWeekMenu=openedFromWeekMenu;openedFromWeekMenu=false;window.hcShowRecipeModule?.(backToWeekMenu?'weekmenu':'recipes');renderList()}
function getRecipe(id){return allRecipes().find(r=>String(r.id)===String(id))}function isCustom(id){return custom().some(r=>String(r.id)===String(id))}
function openRecipe(id){current=String(id);edited=JSON.parse(JSON.stringify(getRecipe(id)));displayServings=String(edited?.servings||'');hideList();showView('ingredients')}
function openPending(id){const r=pending().find(x=>String(x.id)===String(id));if(!r)return;current='pending:'+id;edited=JSON.parse(JSON.stringify(r));hideList();showReview()}
function parseQtyNumber(value){let s=String(value??'').trim().replace(',','.');if(!s)return null;const u={'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};if(u[s]!=null)return u[s];const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(m)return Number(m[1])+Number(m[2])/Number(m[3]);const f=s.match(/^(\d+)\/(\d+)$/);if(f)return Number(f[1])/Number(f[2]);const n=Number(s);return Number.isFinite(n)?n:null}
function formatScaledNumber(n,unit='',ingredient=''){if(!Number.isFinite(n))return '';const u=String(unit||'').toLowerCase(),food=String(ingredient||'').toLowerCase();let v=n;if(['el','tl'].includes(u))v=Math.round(v*16)/16;else if(['g','gr','gram','ml'].includes(u))v=Math.round(v);else if(/^(stuks?|stuk|blik(?:je)?|zak(?:je)?|teen|tenen)$/.test(u))v=Math.round(v);else if(!u&&/(limoen|citroen)/.test(food))v=Math.round(v*2)/2;else v=Math.round(v*100)/100;const whole=Math.floor(v),fr=Math.round((v-whole)*16)/16,fm={0.25:'¼',0.5:'½',0.75:'¾'};if(fm[fr]&&Math.abs(v-(whole+fr))<1e-8)return whole?`${whole} ${fm[fr]}`:fm[fr];return String(Number(v.toFixed(4))).replace('.',',')}
function scaledQty(qty,factor,unit,ingredient){const n=parseQtyNumber(qty);return n==null?String(qty||''):formatScaledNumber(n*factor,unit,ingredient)}
function scaledRecipe(r,servings=displayServings){const base=Number(r?.servings)||0,target=Number(servings)||base;if(!base||!target||base===target)return JSON.parse(JSON.stringify(r));const factor=target/base;const copy=JSON.parse(JSON.stringify(r));copy.servings=String(target);copy.ingredients=(copy.ingredients||[]).map(x=>({...x,qty:scaledQty(x.qty,factor,x.unit,x.ingredient)}));return copy}
function linkedRecipeForIngredient(x){return x?.linkedRecipeId?getRecipe(x.linkedRecipeId):null}
function ingredients(r){const shown=scaledRecipe(r);return `<div class="panel">${(shown.ingredients||[]).length?shown.ingredients.map(x=>{const linked=linkedRecipeForIngredient(x);return `<div class="ing"><span class="qty">${esc(x.qty)}</span><span class="unit">${esc(x.unit)}</span><span>${esc(x.ingredient)}${linked?` <button type="button" class="subrecipe-link" data-subrecipe="${esc(linked.id)}">Recept</button>`:''}</span>${x.memo?`<span class="memo">${esc(x.memo)}</span>`:''}</div>`}).join(''):'<div class="empty">Nog geen ingrediënten.</div>'}</div>`}
function bindSubrecipeLinks(){detail.querySelectorAll('[data-subrecipe]').forEach(btn=>btn.onclick=()=>{const target=getRecipe(btn.dataset.subrecipe);if(!target)return;const parent=current;current=String(target.id);edited=JSON.parse(JSON.stringify(target));displayServings=String(target.servings||'');showView('ingredients');const back=detail.querySelector('#backList');if(back){back.textContent='← Terug naar hoofdrecept';back.onclick=()=>{const r=getRecipe(parent);if(!r)return;current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=String(r.servings||'');showView('ingredients')}}})}

function showView(view){
  const r=edited;if(!displayServings)displayServings=String(r.servings||'');
  const sourceBits=[];
  if(r.source)sourceBits.push(`Bron: ${esc(r.source)}`);
  if(r.sourceUrl)sourceBits.push(`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Bron openen</a>`);
  const sourceLine=sourceBits.length?`<div class="recipe-source">${sourceBits.join(' · ')}</div>`:'';
  const servingsBox=view==='edit'?'':`<div class="recipe-serving-control"><label>Aantal personen <input id="displayServings" type="number" min="1" inputmode="numeric" enterkeyhint="go" value="${esc(displayServings||r.servings||'')}"></label><small>Ingrediënten worden direct omgerekend. Het basisrecept blijft ongewijzigd.</small></div>`;
  const meta=metaFor(r.id);detail.innerHTML=`<div class="detail-head"><div><h2>${esc(r.title)}</h2><small>${r.servings?`Basis: ${esc(r.servings)} personen`:''}</small>${sourceLine}</div><div class="actions"><button class="btn favorite-recipe ${meta.favorite?'active':''}" id="favoriteRecipe" type="button">${meta.favorite?'★ Favoriet':'☆ Favoriet'}</button><button class="btn" id="backList">Terug</button></div></div>${servingsBox}<div class="recipe-memo-panel"><label>Memo <textarea id="recipeMemo" placeholder="Eigen aanpassingen of opmerkingen…">${esc(meta.memo||'')}</textarea></label></div><div class="tabs"><button class="tab ${view==='ingredients'?'active':''}" data-v="ingredients">Ingrediënten</button><button class="tab ${view==='directions'?'active':''}" data-v="directions">Bereiding</button><button class="tab ${view==='edit'?'active':''}" data-v="edit">Wijzigen</button></div><div id="recipeViewBody">${view==='ingredients'?ingredients(r):view==='directions'?`<div class="panel directions">${esc(r.directions||'Nog geen bereidingswijze.')}</div>`:editForm(r,false)}</div>`;
  detail.querySelector('#backList').onclick=backList;
  detail.querySelector('#favoriteRecipe')?.addEventListener('click',()=>{const m=saveMetaFor(r.id,{favorite:!metaFor(r.id).favorite});const b=detail.querySelector('#favoriteRecipe');if(b){b.textContent=m.favorite?'★ Favoriet':'☆ Favoriet';b.classList.toggle('active',m.favorite)}});
  detail.querySelector('#recipeMemo')?.addEventListener('change',e=>saveMetaFor(r.id,{memo:e.target.value}));
  detail.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showView(b.dataset.v));
  const servingInput=detail.querySelector('#displayServings');
  if(servingInput){
    const applyServings=(refreshPlanner=false)=>{displayServings=String(Math.max(1,Number(servingInput.value)||1));if(view==='ingredients'){const body=detail.querySelector('#recipeViewBody');if(body)body.innerHTML=ingredients(r);ensureRecipeActions?.();if(refreshPlanner&&detail.querySelector('.recipe-week-picker')){const picker=detail.querySelector('.recipe-week-picker'),wk=picker.querySelector('#recipePlanWeek')?.value||'',gf=picker.querySelector('#gfPersons')?.value;showWeekPlanner(r,wk,gf)}}};
    servingInput.addEventListener('input',()=>applyServings(false));servingInput.addEventListener('change',()=>applyServings(true));servingInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyServings(true);servingInput.blur()}});
  }
  bindSubrecipeLinks();
  if(view==='edit')bindEdit(false)
}
function ingredientRows(r){return (r.ingredients||[]).map((x,i)=>{const linked=linkedRecipeForIngredient(x);return `<div class="edit-row ingredient-edit-row" data-row="${i}"><input data-f="qty" data-i="${i}" value="${esc(x.qty)}" placeholder="Aantal"><input data-f="unit" data-i="${i}" value="${esc(x.unit)}" placeholder="Eenheid"><input data-f="ingredient" data-i="${i}" value="${esc(x.ingredient)}" placeholder="Ingrediënt"><button type="button" class="remove-ing" data-remove="${i}" aria-label="Ingrediënt verwijderen">×</button><div class="subrecipe-editor"><button type="button" class="btn link-subrecipe" data-link-subrecipe="${i}">${linked?'Gekoppeld: '+esc(linked.title):'Koppel recept'}</button>${linked?`<button type="button" class="btn unlink-subrecipe" data-unlink-subrecipe="${i}">Ontkoppelen</button>`:''}</div></div>`}).join('')}
function chooseSubrecipe(index){const q=prompt('Zoek een recept om aan dit ingrediënt te koppelen:');if(!q)return;const matches=allRecipes().filter(r=>String(r.id)!==String(edited.id)&&(r.title||'').toLowerCase().includes(q.trim().toLowerCase())).slice(0,12);if(!matches.length){alert('Geen passend recept gevonden.');return}let chosen=matches[0];if(matches.length>1){const answer=prompt('Kies een nummer:\n'+matches.map((r,i)=>`${i+1}. ${r.title}`).join('\n'),'1');const n=Number(answer);if(!Number.isInteger(n)||n<1||n>matches.length)return;chosen=matches[n-1]}edited.ingredients[index].linkedRecipeId=String(chosen.id);showReviewOrEdit()}

function editForm(r,review){return `<div class="review-fields"><label>Titel<input id="titleEdit" value="${esc(r.title||'')}"></label><label>Personen<input id="servingsEdit" type="number" min="1" inputmode="numeric" value="${esc(r.servings||'')}"></label><label class="source-field">Bron<input id="sourceEdit" value="${esc(r.source||'')}" placeholder="Bijv. Picnic, Allerhande, eigen recept"></label><label class="source-field">Bron / URL<input id="sourceUrlEdit" type="url" value="${esc(r.sourceUrl||'')}" placeholder="https://…"></label></div><div class="edit-section open"><button type="button">Ingrediënten <span>▾</span></button><div class="edit-body"><div id="ingredientEditor">${ingredientRows(r)}</div><button type="button" class="btn add-ing" id="addIngredient">+ Ingrediënt</button></div></div><div class="edit-section open"><button type="button">Bereiding <span>▾</span></button><div class="edit-body"><textarea id="directionsEdit">${esc(r.directions||'')}</textarea></div></div><div class="actions review-actions">${review?'<button class="btn primary" id="approve">Goedkeuren</button><button class="btn" id="keepPending">Bewaren voor later</button><button class="btn danger" id="deletePending">Verwijderen</button>':'<button class="btn primary" id="save">Opslaan</button><button class="btn" id="cancel">Annuleren</button>'}</div>`}
function bindCommonEdit(){detail.querySelector('#titleEdit').oninput=e=>edited.title=e.target.value;detail.querySelector('#servingsEdit').oninput=e=>edited.servings=e.target.value;detail.querySelector('#sourceEdit')?.addEventListener('input',e=>edited.source=e.target.value);detail.querySelector('#sourceUrlEdit')?.addEventListener('input',e=>edited.sourceUrl=e.target.value);detail.querySelector('#directionsEdit').oninput=e=>edited.directions=e.target.value;detail.querySelectorAll('.edit-section>button').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));detail.querySelectorAll('input[data-f]').forEach(el=>el.oninput=()=>edited.ingredients[+el.dataset.i][el.dataset.f]=el.value);detail.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{edited.ingredients.splice(+b.dataset.remove,1);showReviewOrEdit()});detail.querySelectorAll('[data-link-subrecipe]').forEach(b=>b.onclick=()=>chooseSubrecipe(+b.dataset.linkSubrecipe));detail.querySelectorAll('[data-unlink-subrecipe]').forEach(b=>b.onclick=()=>{delete edited.ingredients[+b.dataset.unlinkSubrecipe].linkedRecipeId;showReviewOrEdit()});detail.querySelector('#addIngredient').onclick=()=>{edited.ingredients.push({qty:'',unit:'',ingredient:'',memo:'',linkedRecipeId:''});showReviewOrEdit()}}
function showReviewOrEdit(){if(String(current).startsWith('pending:'))showReview();else showView('edit')}
function bindEdit(){bindCommonEdit();detail.querySelector('#save').onclick=()=>{if(isCustom(current)){const a=custom(),i=a.findIndex(x=>String(x.id)===String(current));a[i]={...edited,imported:true};saveCustom(a)}else{localStorage.setItem('hc_recipe_'+edited.id,JSON.stringify(edited))}showView('ingredients')};detail.querySelector('#cancel').onclick=()=>{edited=JSON.parse(JSON.stringify(getRecipe(current)));showView('ingredients')}}
function showReview(){detail.innerHTML=`<div class="detail-head"><div><div class="review-label">Te controleren</div><h2>${esc(edited.title||'Gedeeld recept')}</h2><small>${esc(sourceLabel(edited))}</small></div><div class="actions"><button class="btn" id="backList">Terug</button></div></div><div class="review-note">Controleer het recept. Je kunt dit nu doen of later op een ander apparaat.</div>${editForm(edited,true)}`;detail.querySelector('#backList').onclick=()=>{savePendingEdit();backList()};bindCommonEdit();detail.querySelector('#keepPending').onclick=()=>{savePendingEdit();backList()};detail.querySelector('#approve').onclick=approvePending;detail.querySelector('#deletePending').onclick=()=>{const id=String(current).replace('pending:','');savePending(pending().filter(x=>String(x.id)!==id));backList()}}
function savePendingEdit(){const id=String(current).replace('pending:','');const a=pending(),i=a.findIndex(x=>String(x.id)===id);if(i>=0){a[i]={...edited,id};savePending(a)}}
function approvePending(){if(!edited.title.trim()){alert('Vul eerst een titel in.');return}const id=String(current).replace('pending:',''),clean={...edited,id:'import-'+id,title:edited.title.trim(),ingredients:(edited.ingredients||[]).filter(x=>x.ingredient.trim()),status:'approved',imported:true};saveCustom([...custom(),clean]);savePending(pending().filter(x=>String(x.id)!==id));current=clean.id;edited=JSON.parse(JSON.stringify(clean));showView('ingredients')}
function parseIngredient(line){let s=String(line||'').replace(/^[-•*]\s*/,'').trim();const m=s.match(/^(\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])?\s*(g|gr|kg|ml|cl|dl|l|el|tl|eetlepel(?:s)?|theelepel(?:s)?|stuks?|stuk|blik(?:je)?|zak(?:je)?|teen|tenen|snuf(?:je)?)?\s*(.*)$/i);return{qty:(m?.[1]||'').replace(',','.'),unit:(m?.[2]||'').replace(/eetlepels?/i,'el').replace(/theelepels?/i,'tl'),ingredient:(m?.[3]||s).trim(),memo:''}}
function parseSharedText(payload){const raw=[payload.title,payload.text].filter(Boolean).join('\n').replace(/\r/g,'').trim(),url=payload.url||raw.match(/https?:\/\/\S+/)?.[0]||'';const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean).filter(x=>!/^https?:\/\//.test(x));let title=(payload.title||lines[0]||'Gedeeld recept').replace(/https?:\/\/\S+/g,'').trim();let ingStart=lines.findIndex(x=>/^ingred/i.test(x)),dirStart=lines.findIndex(x=>/^(bereiding|bereidingswijze|werkwijze|instructies?)/i.test(x));let ingLines=[],directions='';if(ingStart>=0){const end=dirStart>ingStart?dirStart:lines.length;ingLines=lines.slice(ingStart+1,end)}if(dirStart>=0)directions=lines.slice(dirStart+1).join('\n');else if(lines.length>1&&ingStart<0)directions=lines.slice(1).join('\n');return{id:crypto.randomUUID(),title,servings:'',ingredients:ingLines.map(parseIngredient).filter(x=>x.ingredient),directions,sourceUrl:url,source:sourceFromUrl(url),status:'pending',sharedAt:new Date().toISOString()}}
function sourceFromUrl(url){try{const h=new URL(url).hostname.toLowerCase();if(h.includes('picnic'))return 'Picnic';return h.replace(/^www\./,'')}catch(_){return 'Gedeeld'}}
function findRecipeJson(value){if(!value)return null;if(Array.isArray(value)){for(const x of value){const f=findRecipeJson(x);if(f)return f}}else if(typeof value==='object'){const t=value['@type'];if(t==='Recipe'||(Array.isArray(t)&&t.includes('Recipe')))return value;if(value['@graph'])return findRecipeJson(value['@graph'])}return null}
function instructionText(v){if(Array.isArray(v))return v.map(x=>typeof x==='string'?x:(x?.text||x?.name||instructionText(x?.itemListElement))).filter(Boolean).join('\n');if(typeof v==='string')return v;return v?.text||''}
function parseYield(y){const s=Array.isArray(y)?y[0]:y;return String(s||'').match(/\d+/)?.[0]||''}
async function enrichFromUrl(draft){if(!draft.sourceUrl)return draft;try{const res=await fetch(draft.sourceUrl,{credentials:'omit'});if(!res.ok)throw new Error('HTTP '+res.status);const html=await res.text(),docu=new DOMParser().parseFromString(html,'text/html');for(const el of docu.querySelectorAll('script[type="application/ld+json"]')){try{const recipe=findRecipeJson(JSON.parse(el.textContent));if(!recipe)continue;return{...draft,title:recipe.name||draft.title,servings:parseYield(recipe.recipeYield)||draft.servings,ingredients:(recipe.recipeIngredient||[]).map(parseIngredient),directions:instructionText(recipe.recipeInstructions)||draft.directions,source:sourceFromUrl(draft.sourceUrl)}}catch(_){}}}catch(err){console.info('Receptlink kon niet rechtstreeks worden uitgelezen; bron blijft bij concept.',err)}return draft}
async function takeSharedRecipe(){const url=new URL(location.href);if(!url.searchParams.has('share-target')||!('caches'in window))return null;try{const cache=await caches.open('huize-chaos-shared-content-v1'),key=new URL('__shared-recipe__',url).href,res=await cache.match(key);if(!res)return null;await cache.delete(key);return await res.json()}catch(err){console.warn(err);return null}}
async function receiveSharedRecipe(){const payload=await takeSharedRecipe();if(!payload)return;let draft=parseSharedText(payload);draft=await enrichFromUrl(draft);savePending([...pending(),draft]);history.replaceState({},'',location.pathname+location.hash);openPending(draft.id)}
search.oninput=renderList;renderList();setStatus('Recepten geladen');initCloud();receiveSharedRecipe();

// V1.3.116 - voorraad koppelen aan recepten
const STOCK_KEY='household-products-v2';
const stockRecipeButton=document.querySelector('#stockRecipeButton'),stockPicker=document.querySelector('#stockPicker');
let stockFilterIds=[];
function stockProducts(){try{return JSON.parse(localStorage.getItem(STOCK_KEY)||'[]')}catch(_){return[]}}
function relevantStock(){return stockProducts().filter(x=>x.status==='In huis' && /^(Bewaarproducten \(voorraad\)|Groente|Diepvries|Vlees\s*\/?\s*vis|Vlees|Vis)$/i.test(String(x.category||'')))}
function normFood(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\(gv\)/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(blik|blikje|pot|zak|pak|stuks?|verse|vers|diepvries|gekookte|gesneden)\b/g,' ').replace(/\s+/g,' ').trim().replace(/en$/,'')}
const PASTA_TYPES=['spaghetti','macaroni','fusilli','penne','farfalle','rigatoni','tagliatelle','linguine','vermicelli','orzo','noedels','noedel','mie','lasagne'];
function isGlutenFreeProduct(p){const raw=String(p?.name||'')+' '+String(p?.memo||'');return /(?:^|\b)(glutenvrij|gluten[ -]?vrij|gv)(?:\b|$)/i.test(raw)}
function pastaStockOptions(includeUnavailable=false){return stockProducts().filter(p=>pastaType(p.name)&&(includeUnavailable||p.status==='In huis'))}
function splitQty(qty,part,total,unit,ingredient){const n=qtyNumber(qty);if(n==null||!total)return qty;return formatScaledNumber(n*part/total,unit,ingredient)}
function isGenericPasta(s){return normFood(s).split(/\s+/).includes('pasta')}
function pastaType(s){const words=normFood(s).split(/\s+/);return PASTA_TYPES.find(x=>words.includes(x))||''}
function ingredientMatchesProduct(ingredient,product){
  const raw=String(ingredient||'');
  if(/glutenvrij|gluten[ -]?vrij|\bgv\b/i.test(raw)&&!isGlutenFreeProduct(product))return false;
  const a=normFood(ingredient),b=normFood(product.name);
  if(!a||!b)return false;
  // Pasta is een bewuste productgroep: een recept met 'pasta' mag worden gedekt
  // door een concrete pastasoort. Een concrete soort wordt niet zomaar een andere soort.
  const ai=isGenericPasta(a),bi=isGenericPasta(b),at=pastaType(a),bt=pastaType(b);
  if((ai&&!at&&bt)||(bi&&!bt&&at))return true;
  if(at&&bt&&at!==bt)return false;
  // Match verder op volledige woorden. Zo blijft paprika != paprikapoeder enzovoort.
  const words=s=>s.split(/\s+/).filter(Boolean);
  const aw=words(a),bw=words(b);
  const meaningful=w=>w.length>1 && !/^(rood|rode|geel|gele|groen|groene|wit|witte|zwart|zwarte|klein|kleine|groot|grote|heel|halve|half)$/.test(w);
  const aa=aw.filter(meaningful),bb=bw.filter(meaningful);
  const subset=(need,have)=>need.length>0&&need.every(w=>have.includes(w));
  return subset(bb,aw)||subset(aa,bw);
}
function recipeStockScore(r,selected){const ingredients=r.ingredients||[];const hits=selected.filter(p=>ingredients.some(i=>ingredientMatchesProduct(i.ingredient,p))).length;const all=stockProducts().filter(p=>p.status==='In huis');const missing=ingredients.filter(i=>!all.some(p=>ingredientMatchesProduct(i.ingredient,p))).length;return{hits,missing}}
function renderStockPicker(){const a=relevantStock();stockPicker.innerHTML=`<div class="stock-picker"><h2>Kies uit je voorraad</h2><p>Bewaarproducten, groente, diepvries en vlees/vis. Kies één of meer producten.</p>${a.length?`<div class="actions stock-picker-actions"><button class="btn" id="clearStockSelection">Alles deselecteren</button></div><div class="stock-options">${a.map(x=>`<label class="stock-option"><input type="checkbox" data-stock-id="${esc(x.id)}" ${stockFilterIds.includes(String(x.id))?'checked':''}><span>${esc(x.name)} <small>${esc([x.quantity,x.unit].filter(Boolean).join(' '))}</small></span></label>`).join('')}</div><div class="actions"><button class="btn primary" id="findStockRecipes">Passende recepten zoeken</button><button class="btn" id="closeStockPicker">Sluiten</button></div>`:'<div class="empty">Geen producten uit deze groepen staan op In huis.</div>'}</div>`;stockPicker.querySelector('#closeStockPicker')?.addEventListener('click',()=>stockPicker.innerHTML='');stockPicker.querySelector('#clearStockSelection')?.addEventListener('click',()=>{stockFilterIds=[];stockPicker.querySelectorAll('[data-stock-id]').forEach(x=>x.checked=false);renderList()});stockPicker.querySelector('#findStockRecipes')?.addEventListener('click',()=>{stockFilterIds=[...stockPicker.querySelectorAll('[data-stock-id]:checked')].map(x=>x.dataset.stockId);renderList()})}
stockRecipeButton?.addEventListener('click',renderStockPicker);
const originalRenderList=renderList;
renderList=function(){if(!stockFilterIds.length)return originalRenderList();const selected=relevantStock().filter(x=>stockFilterIds.includes(String(x.id)));const q=search.value.trim().toLowerCase();const ranked=allRecipes().filter(r=>(r.title||'').toLowerCase().includes(q)).map(r=>({r,s:recipeStockScore(r,selected)})).filter(x=>x.s.hits>0).sort((a,b)=>b.s.hits-a.s.hits||a.s.missing-b.s.missing).slice(0,150);pendingBox.innerHTML='';list.innerHTML=ranked.length?ranked.map(({r,s})=>`<button class="recipe-card" data-id="${esc(r.id)}"><span><strong>${esc(r.title)}</strong><small>${r.servings?esc(r.servings)+' personen':''}</small><div class="match-label">${s.missing===0?'Alles in huis':s.missing<=1?'Bijna compleet':'Past bij voorraad'} · ${s.hits} gekozen product${s.hits===1?'':'en'}</div></span><span class="go">›</span></button>`).join(''):'<div class="empty">Geen passende recepten gevonden.</div>';list.querySelectorAll('.recipe-card').forEach(b=>b.onclick=()=>openRecipe(b.dataset.id))};
function deductionCandidates(r){const stock=stockProducts().filter(p=>p.status==='In huis');return (r.ingredients||[]).map(i=>{const p=stock.find(p=>i.stockProductId&&String(p.id)===String(i.stockProductId))||stock.find(p=>ingredientMatchesProduct(i.ingredient,p));return p?{ingredient:i,product:p}:null}).filter(Boolean)}
function showDeduct(r){const rows=deductionCandidates(r);detail.innerHTML=`<div class="detail-head"><div><h2>Recept gemaakt</h2><small>${esc(r.title)}</small></div></div><div class="panel deduct-panel"><p>Controleer wat van de voorraad wordt afgeboekt. Pas een hoeveelheid aan als je minder of meer hebt gebruikt.</p>${rows.length?rows.map((x,i)=>`<div class="deduct-row"><span>${esc(x.product.name)}</span><input data-deduct="${i}" inputmode="decimal" value="${esc(x.ingredient.qty||'')}" aria-label="Hoeveelheid"><span>${esc(x.ingredient.unit||x.product.unit||'')}</span></div>`).join(''):'<div class="empty">Geen ingrediënten gevonden die aan je voorraad gekoppeld kunnen worden.</div>'}</div><div class="actions"><button class="btn primary" id="confirmDeduct" ${rows.length?'':'disabled'}>Bevestigen en afboeken</button><button class="btn" id="cancelDeduct">Annuleren</button></div>`;detail.querySelector('#cancelDeduct').onclick=()=>showView('ingredients');detail.querySelector('#confirmDeduct')?.addEventListener('click',()=>{const products=stockProducts();rows.forEach((row,i)=>{const p=products.find(x=>String(x.id)===String(row.product.id));if(!p)return;const used=parseFloat(String(detail.querySelector(`[data-deduct="${i}"]`).value).replace(',','.'));const have=parseFloat(String(p.quantity).replace(',','.'));if(Number.isFinite(used)&&Number.isFinite(have)){p.quantity=String(Math.max(0,have-used));if(+p.quantity===0){p.status='Niet in huis';p.shopping=false;p.done=false}}});localStorage.setItem(STOCK_KEY,JSON.stringify(products));window.dispatchEvent(new Event('huize-chaos-products-changed'));alert('Voorraad is bijgewerkt.');showView('ingredients')})}
function ensureRecipeActions(){
  if(!edited || !detail || detail.classList.contains('hidden')) return;
  const body=detail.querySelector('#recipeViewBody');
  const panel=body?.querySelector('.panel');
  if(!panel) return;
  let actions=detail.querySelector('.recipe-occasion-actions');
  if(!actions){
    actions=document.createElement('div');
    actions.className='actions recipe-occasion-actions';
    panel.insertAdjacentElement('afterend',actions);
  }
  let made=actions.querySelector('#madeRecipe');
  if(!made){made=document.createElement('button');made.className='btn primary';made.id='madeRecipe';made.textContent='Recept gemaakt';actions.appendChild(made)}
  made.onclick=()=>showDeduct(scaledRecipe(edited));
  let occasion=actions.querySelector('#addToOccasion');
  if(!occasion){occasion=document.createElement('button');occasion.className='btn';occasion.id='addToOccasion';occasion.textContent='Toevoegen aan gelegenheid';actions.appendChild(occasion)}
  occasion.onclick=()=>showOccasionPicker(edited);
  if(typeof showWeekPlanner==='function'){
    let plan=actions.querySelector('#planRecipeWeek');
    if(!plan){plan=document.createElement('button');plan.className='btn';plan.id='planRecipeWeek';plan.textContent='Plan voor week';actions.appendChild(plan)}
    plan.onclick=()=>showWeekPlanner(edited);
  }
}
const originalShowView=showView;
showView=function(view){originalShowView(view);if(view==='ingredients'&&edited)ensureRecipeActions()};
const OCCASION_KEY='huize-chaos-occasions-v1';
function localOccasions(){try{return JSON.parse(localStorage.getItem(OCCASION_KEY)||'[]')}catch(_){return[]}}
function showOccasionPicker(r){const a=localOccasions();detail.insertAdjacentHTML('beforeend',`<div class="panel occasion-picker"><h3>Toevoegen aan gelegenheid</h3>${a.length?a.map(e=>`<button class="btn occasion-choice" data-occ="${esc(e.id)}">${esc(e.name)} <small>${esc(e.date||'')}</small></button>`).join(''):'<p>Nog geen gelegenheden gevonden. Maak eerst een gelegenheid aan.</p>'}</div>`);detail.querySelectorAll('[data-occ]').forEach(b=>b.onclick=()=>addCurrentRecipeToOccasion(r,b.dataset.occ))}
async function addCurrentRecipeToOccasion(r,id){const a=localOccasions(),e=a.find(x=>String(x.id)===String(id));if(!e)return;e.menu=e.menu||[];const base=Number(r.servings)||Number(e.people)||1,target=Number(e.people)||Number(displayServings)||base,factor=target/base;e.menu.push({type:'Hapje',dish:r.title,recipeId:String(r.id),recipeServings:String(r.servings||''),recipeBaseServings:String(base),servings:String(target),ingredients:(r.ingredients||[]).map(x=>({baseQty:x.qty||'',qty:scaledQty(x.qty||'',factor,x.unit,x.ingredient),unit:x.unit||'',ingredient:x.ingredient||'',memo:x.memo||'',enabled:true}))});localStorage.setItem(OCCASION_KEY,JSON.stringify(a));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));try{if(user)await setDoc(occasionRef,{events:a,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:false})}catch(err){console.warn('Gelegenheid is lokaal bijgewerkt; cloudsynchronisatie volgt via Gelegenheden.',err)}alert('Recept toegevoegd aan '+e.name+'. Je kunt daar het aantal personen en de ingrediënten aanpassen.');showView('ingredients')}



// V1.3.116 - recepten per week plannen (zonder dagen)
const RECIPE_WEEK_KEY='huize-chaos-recipe-weeks-v1';
function recipeWeekPlans(){try{return JSON.parse(localStorage.getItem(RECIPE_WEEK_KEY)||'[]')}catch(_){return[]}}
function isoWeekKey(d=new Date()){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return `${x.getUTCFullYear()}-W${String(Math.ceil((((x-y)/86400000)+1)/7)).padStart(2,'0')}`}
function weekOptions(count=16){let d=new Date(),out=[];for(let i=0;i<count;i++){const x=new Date(d);x.setDate(x.getDate()+i*7);const k=isoWeekKey(x),n=Number(k.slice(-2));out.push(`<option value="${k}">Week ${n}</option>`)}return out.join('')}
function upcomingWeekKey(){const d=new Date();d.setDate(d.getDate()+7);return isoWeekKey(d)}
function normalizedUnit(u){
  const x=String(u||'').trim().toLowerCase();
  return ({gram:'g',gr:'g',kilogram:'kg',milliliter:'ml',milliliters:'ml',liter:'l',liters:'l',stuk:'stuks',stuks:'stuks',potje:'pot',potten:'pot',blikje:'blik',blikjes:'blik',zakje:'zak',zakjes:'zak',pakje:'pak',pakjes:'pak',flesje:'fles',flesjes:'fles'}[x]||x)
}
function qtyNumber(v){const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null}
function toBaseAmount(qty,unit){const n=qtyNumber(qty),u=normalizedUnit(unit);if(n==null)return null;if(u==='kg')return {n:n*1000,u:'g'};if(u==='l')return {n:n*1000,u:'ml'};return {n,u}}
function stockCoverage(ingredient,preferredProductId='',glutenMode=''){
  const allProducts=stockProducts();
  let matches=allProducts.filter(p=>p.status==='In huis'&&ingredientMatchesProduct(ingredient.ingredient,p));
  if(glutenMode==='gf')matches=matches.filter(isGlutenFreeProduct);
  if(glutenMode==='regular')matches=matches.filter(p=>!isGlutenFreeProduct(p));
  const genericPasta=isGenericPasta(ingredient.ingredient);
  const preferred=preferredProductId?allProducts.find(p=>String(p.id)===String(preferredProductId)):null;
  if(preferred&&preferred.status!=='In huis')return {matched:false,enough:false,label:'Niet in huis',product:preferred,shortage:null,matches};
  const product=matches.find(p=>String(p.id)===String(preferredProductId))||(genericPasta?matches.find(p=>pastaType(p.name)):null)||matches[0];
  if(!product)return {matched:false,enough:false,label:'Niet in huis',product:preferred||null,shortage:null,matches};
  const have=toBaseAmount(product.quantity,product.unit),need=toBaseAmount(ingredient.qty,ingredient.unit);
  let enough=true,shortage=null;
  if(have&&need&&have.u&&need.u&&have.u===need.u){
    enough=have.n>=need.n;
    if(!enough){let missing=need.n-have.n,unit=need.u;if(normalizedUnit(ingredient.unit)==='kg'){missing/=1000;unit='kg'}else if(normalizedUnit(ingredient.unit)==='l'){missing/=1000;unit='l'}else unit=ingredient.unit||need.u;shortage={qty:formatScaledNumber(missing,unit,ingredient.ingredient),unit}}
  }
  const available=[product.quantity,product.unit].filter(Boolean).join(' ')||'aanwezig';
  const productName=String(product.name||'').trim();
  const label=genericPasta&&pastaType(productName)?`In huis: ${productName} · ${available}`:`In huis: ${available}`;
  return {matched:true,enough,label,product,shortage,matches};
}
function pastaSplitRows(i,n,oldRows,gfPersons,totalPersons){
  const prevFor=mode=>(Array.isArray(oldRows)?oldRows.find(x=>String(x.id)===`${n}-${mode}`):oldRows)||{};
  const regularPersons=Math.max(0,totalPersons-gfPersons), rows=[];
  if(regularPersons>0){const ing={...i,qty:splitQty(i.qty,regularPersons,totalPersons,i.unit,i.ingredient)},cov=stockCoverage(ing,prevFor('regular')?.stockProductId||prevFor('regular')?.regularStockProductId||'','regular');rows.push({mode:'regular',label:`Normale pasta · ${regularPersons} ${regularPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options:pastaStockOptions(true).filter(p=>!isGlutenFreeProduct(p)),shoppingSelected:prevFor('regular')?.shoppingSelected})}
  if(gfPersons>0){const ing={...i,qty:splitQty(i.qty,gfPersons,totalPersons,i.unit,i.ingredient)},cov=stockCoverage(ing,prevFor('gf')?.stockProductId||prevFor('gf')?.gfStockProductId||'','gf');rows.push({mode:'gf',label:`Glutenvrije pasta · ${gfPersons} ${gfPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options:pastaStockOptions(true).filter(isGlutenFreeProduct),shoppingSelected:prevFor('gf')?.shoppingSelected})}
  return rows.map(row=>{const c=row.coverage,info=c.matched?(c.enough?c.label:`${c.label} · tekort ${[c.shortage?.qty,c.shortage?.unit].filter(Boolean).join(' ')}`):'Niet in huis';const checked=row.shoppingSelected!==false&&!c.enough;return `<div class="pasta-diet-row"><strong>${esc(row.label)}</strong><span class="order-ingredient-line">${esc([row.ingredient.qty,row.ingredient.unit,'pasta'].filter(Boolean).join(' '))}</span>${row.options.length?`<select class="stock-alternative-select" data-pasta-split-choice="${n}:${row.mode}">${row.options.map(p=>`<option value="${esc(p.id)}" ${String(c.product?.id)===String(p.id)?'selected':''}>${esc(p.name)} · ${p.status==='In huis'?`In huis: ${esc([p.quantity,p.unit].filter(Boolean).join(' ')||'aanwezig')}`:'Niet in huis'}</option>`).join('')}</select>`:`<small class="stock-coverage missing">Geen ${row.mode==='gf'?'glutenvrije':'glutenvolle'} pastasoorten in voorraadbeheer</small>`}<small class="stock-coverage ${c.enough?'enough':c.matched?'partial':'missing'}">${esc(info)}</small>${!c.enough?`<label class="pasta-shopping-choice"><input type="checkbox" data-pasta-shopping="${n}:${row.mode}" ${checked?'checked':''}> Op boodschappenlijst</label>`:''}</div>`}).join('')
}
function subrecipePreview(linked,parentIndex,checked){if(!linked||!checked)return '';const sub=scaledRecipe(linked,linked.servings);return `<div class="subrecipe-plan-preview"><small>Ingrediënten voor ${esc(linked.title)}</small>${(sub.ingredients||[]).map((si,j)=>{const sc=stockCoverage(si),info=sc.matched?(sc.enough?sc.label:`${sc.label}${sc.shortage?` · tekort ${[sc.shortage.qty,sc.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';return `<label class="subrecipe-plan-row ${sc.enough?'in-stock':''}"><input type="checkbox" data-sub-shopping="${parentIndex}:${j}" ${sc.enough?'disabled':'checked'}><span><span>${esc([si.qty,si.unit,si.ingredient].filter(Boolean).join(' '))}</span><small class="stock-coverage ${sc.enough?'enough':sc.matched?'partial':'missing'}">${esc(info)}</small></span></label>`}).join('')}</div>`} 
function plannerOrderRows(shown,existing,week,gfPersons=1){
  if(week!==upcomingWeekKey())return '';
  const old=existing?.ingredients||[],total=Math.max(1,Number(shown.servings)||1);
  return `<div class="recipe-order-box"><h4>Voorraad & besteld</h4><p>Huize Chaos controleert eerst wat al in huis is. Bij pasta worden glutenvol en glutenvrij apart verdeeld.</p><div class="recipe-order-list">${(shown.ingredients||[]).map((i,n)=>{if(isGenericPasta(i.ingredient)){return `<div class="recipe-order-row pasta-split"><span class="pasta-split-wrap"><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Pasta'].filter(Boolean).join(' '))}</span>${pastaSplitRows(i,n,old,gfPersons,total)}</span></div>`}const prev=old[n],coverage=stockCoverage(i),disabled=coverage.enough?'disabled':'',info=coverage.matched?(coverage.enough?coverage.label:`${coverage.label} · tekort ${[coverage.shortage?.qty,coverage.shortage?.unit].filter(Boolean).join(' ')}`):'Niet in huis';const linked=linkedRecipeForIngredient(i);return `<label class="recipe-order-row ${coverage.enough?'in-stock':''}"><input type="checkbox" data-plan-ordered="${n}" ${prev?.ordered?'checked':''} ${disabled}><span><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Ingrediënt'].filter(Boolean).join(' '))}</span><small class="stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}">${esc(info)}</small>${linked&&!coverage.enough?`<label class="make-subrecipe-choice"><input type="checkbox" data-make-subrecipe="${n}" ${prev?.makeSubrecipe?'checked':''}> Zelf maken: ${esc(linked.title)}</label>${subrecipePreview(linked,n,Boolean(prev?.makeSubrecipe))}`:''}</span></label>`}).join('')}</div></div>`
}
function showWeekPlanner(r,preferredWeek='',preferredGf=null){
  detail.querySelector('.recipe-week-picker')?.remove();
  const box=document.createElement('div');box.className='panel recipe-week-picker';
  const shown=scaledRecipe(r),plans=recipeWeekPlans();
  box.innerHTML=`<h3>Plan voor week</h3><p>Geen dag nodig. De ingrediënten voor ${esc(displayServings||r.servings||'?')} personen verschijnen alleen op de boodschappenlijst van deze week.</p><select id="recipePlanWeek">${weekOptions()}</select><label class="gf-person-control">Glutenvrij <input id="gfPersons" type="number" min="0" max="${Math.max(1,Number(shown.servings)||1)}" value="1"> van ${esc(shown.servings||1)} personen</label><div id="recipePlanOrdered"></div><div class="actions"><button class="btn primary" id="saveRecipeWeek">Inplannen</button></div>`;
  detail.appendChild(box);
  const select=box.querySelector('#recipePlanWeek'),orderedBox=box.querySelector('#recipePlanOrdered'),gfInput=box.querySelector('#gfPersons');
  if(preferredWeek&&[...select.options].some(o=>o.value===preferredWeek))select.value=preferredWeek;if(preferredGf!==null&&preferredGf!==undefined){gfInput.value=preferredGf;gfInput.dataset.touched='1'}
  const refreshOrdered=()=>{
    const week=select.value,existing=plans.find(x=>String(x.recipeId)===String(r.id)&&x.week===week);
    if(existing?.gfPersons!=null&&!gfInput.dataset.touched)gfInput.value=existing.gfPersons;const gfPersons=Math.max(0,Math.min(Number(shown.servings)||1,Number(gfInput.value)||0));orderedBox.innerHTML=plannerOrderRows(shown,existing,week,gfPersons);
    orderedBox.querySelectorAll('[data-stock-choice]').forEach(choice=>choice.addEventListener('change',()=>{
      const n=Number(choice.dataset.stockChoice),ingredient=shown.ingredients?.[n];if(!ingredient)return;
      const coverage=stockCoverage(ingredient,choice.value),row=choice.closest('.recipe-order-row'),info=row?.querySelector('.stock-coverage'),cb=row?.querySelector('[data-plan-ordered]');
      if(info){info.textContent=coverage.matched?(coverage.enough?coverage.label:`${coverage.label}${coverage.shortage?` · tekort ${[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';info.className=`stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}`}
      row?.classList.toggle('in-stock',Boolean(coverage.enough));if(cb){cb.disabled=Boolean(coverage.enough);if(coverage.enough)cb.checked=false}
    }));
    orderedBox.querySelectorAll('[data-make-subrecipe]').forEach(cb=>cb.addEventListener('change',()=>{const n=Number(cb.dataset.makeSubrecipe),linked=linkedRecipeForIngredient(shown.ingredients?.[n]),holder=cb.closest('.recipe-order-row')?.querySelector('span');holder?.querySelector('.subrecipe-plan-preview')?.remove();if(cb.checked&&linked)holder?.insertAdjacentHTML('beforeend',subrecipePreview(linked,n,true))}));
    orderedBox.querySelectorAll('[data-pasta-split-choice]').forEach(choice=>choice.addEventListener('change',()=>{const [idx,mode]=String(choice.dataset.pastaSplitChoice).split(':'),ingredient=shown.ingredients?.[Number(idx)];if(!ingredient)return;const count=mode==='gf'?gfPersons:Math.max(0,(Number(shown.servings)||1)-gfPersons),total=Math.max(1,Number(shown.servings)||1),ing={...ingredient,qty:splitQty(ingredient.qty,count,total,ingredient.unit,ingredient.ingredient)},coverage=stockCoverage(ing,choice.value,mode),row=choice.closest('.pasta-diet-row'),info=row?.querySelector('.stock-coverage'),shopping=row?.querySelector('[data-pasta-shopping]');if(info){info.textContent=coverage.matched?(coverage.enough?coverage.label:`${coverage.label}${coverage.shortage?` · tekort ${[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';info.className=`stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}`}if(shopping){shopping.closest('.pasta-shopping-choice').style.display=coverage.enough?'none':'flex';if(coverage.enough)shopping.checked=false}}));
  };
  select.addEventListener('change',refreshOrdered);gfInput.addEventListener('input',()=>{gfInput.dataset.touched='1';refreshOrdered()});gfInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();gfInput.blur();refreshOrdered()}});refreshOrdered();
  box.querySelector('#saveRecipeWeek').onclick=()=>{const week=select.value,existing=plans.find(x=>String(x.recipeId)===String(r.id)&&x.week===week),old=existing?.ingredients||[],gfPersons=Math.max(0,Math.min(Number(shown.servings)||1,Number(gfInput.value)||0)),total=Math.max(1,Number(shown.servings)||1),planned=[];(shown.ingredients||[]).forEach((i,n)=>{if(isGenericPasta(i.ingredient)){const reg=total-gfPersons;[['regular',reg,'pasta'],['gf',gfPersons,'glutenvrije pasta']].forEach(([mode,count,name])=>{if(!count)return;const ing={...i,qty:splitQty(i.qty,count,total,i.unit,i.ingredient)},sel=box.querySelector(`[data-pasta-split-choice=\"${n}:${mode}\"]`),cov=stockCoverage(ing,sel?.value||'',mode);const shoppingSelected=cov.enough?false:Boolean(box.querySelector(`[data-pasta-shopping=\"${n}:${mode}\"]`)?.checked);planned.push({id:`${n}-${mode}`,qty:ing.qty||'',unit:i.unit||'',ingredient:cov.product?.name||name,memo:i.memo||'',done:false,ordered:false,shoppingSelected,stockEnough:Boolean(cov.enough),stockProductId:cov.product?.id??'',stockLabel:cov.matched?cov.label:'',shoppingQty:cov.shortage?[cov.shortage.qty,cov.shortage.unit].filter(Boolean).join(' '):'',store:cov.product?.store||'',category:cov.product?.category||''})});return}const coverage=stockCoverage(i),ordered=week===upcomingWeekKey()?Boolean(box.querySelector(`[data-plan-ordered=\"${n}\"]`)?.checked):false,makeSubrecipe=Boolean(box.querySelector(`[data-make-subrecipe=\"${n}\"]`)?.checked),linked=linkedRecipeForIngredient(i);if(makeSubrecipe&&linked){const sub=scaledRecipe(linked,linked.servings);(sub.ingredients||[]).forEach((si,j)=>{const sc=stockCoverage(si),subShopping=box.querySelector(`[data-sub-shopping=\"${n}:${j}\"]`);if(!sc.enough&&subShopping&&!subShopping.checked)return;planned.push({id:`${n}-sub-${j}`,qty:si.qty||'',unit:si.unit||'',ingredient:si.ingredient||'',memo:`Voor zelfgemaakte ${i.ingredient||'component'}${si.memo?' · '+si.memo:''}`,done:false,ordered:false,makeSubrecipe:true,parentIngredient:i.ingredient||'',subRecipeId:String(linked.id),stockEnough:Boolean(sc.enough),stockProductId:sc.product?.id??'',stockLabel:sc.matched?sc.label:'',shoppingQty:sc.shortage?[sc.shortage.qty,sc.shortage.unit].filter(Boolean).join(' '):'',store:sc.product?.store||'',category:sc.product?.category||''})})}else planned.push({id:String(n),qty:i.qty||'',unit:i.unit||'',ingredient:i.ingredient||'',memo:i.memo||'',done:old[n]?.done||false,ordered,makeSubrecipe:false,linkedRecipeId:i.linkedRecipeId||'',stockEnough:Boolean(coverage.enough),stockProductId:coverage.product?.id??'',stockLabel:coverage.matched?coverage.label:'',shoppingQty:coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):'',store:coverage.product?.store||'',category:coverage.product?.category||''})});const plan={id:existing?.id||String(Date.now()),recipeId:String(r.id),title:r.title,week,servings:shown.servings||r.servings||'',gfPersons,ingredients:planned};if(existing)Object.assign(existing,plan);else plans.push(plan);localStorage.setItem(RECIPE_WEEK_KEY,JSON.stringify(plans));window.dispatchEvent(new Event('huize-chaos-recipe-weeks-changed'));alert(`${r.title} staat gepland voor week ${Number(week.slice(-2))}.`);box.remove()}
}
const _showViewWeek=showView;showView=function(view){_showViewWeek(view);if(view==='ingredients'&&edited)ensureRecipeActions()};

// V1.3.116 - Weekmenu-overzicht: recepten per week bekijken, verplaatsen en verwijderen
const weekMenuPanel=document.querySelector('#weekMenuPanel');
const recipeLibraryPanel=document.querySelector('#recipeLibraryPanel');
const showWeekMenuButton=document.querySelector('#showWeekMenu');
const showRecipesButton=document.querySelector('#showRecipes');
const weekMenuList=document.querySelector('#weekMenuList');
const weekMenuTitle=document.querySelector('#weekMenuTitle');
const WEEK_MENU_SELECTED_KEY='huize-chaos-weekmenu-selected-v1';
let selectedMenuWeek=localStorage.getItem(WEEK_MENU_SELECTED_KEY)||isoWeekKey(new Date());

function weekMondayFromKey(key){
  const m=String(key||'').match(/^(\d{4})-W(\d{2})$/);if(!m)return new Date();
  const year=Number(m[1]),week=Number(m[2]);
  const jan4=new Date(Date.UTC(year,0,4));
  const jan4Day=jan4.getUTCDay()||7;
  const monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-(jan4Day-1)+(week-1)*7);
  return monday;
}
function shiftMenuWeek(key,amount){const d=weekMondayFromKey(key);d.setUTCDate(d.getUTCDate()+amount*7);return isoWeekKey(new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()))}
function weekNumberLabel(key){const m=String(key).match(/^(\d{4})-W(\d{2})$/);return m?`Week ${Number(m[2])} · ${m[1]}`:'Week'}
function menuWeekOptions(selected){let out=[];for(let i=-8;i<=24;i++){const k=shiftMenuWeek(selectedMenuWeek,i);out.push(`<option value="${k}" ${k===selected?'selected':''}>${esc(weekNumberLabel(k))}</option>`)}return out.join('')}
function saveRecipeWeekPlans(plans){localStorage.setItem(RECIPE_WEEK_KEY,JSON.stringify(plans));window.dispatchEvent(new Event('huize-chaos-recipe-weeks-changed'))}
function renderWeekMenu(){
  if(!weekMenuList||!weekMenuTitle)return;
  weekMenuTitle.textContent=weekNumberLabel(selectedMenuWeek);
  const plans=recipeWeekPlans().filter(p=>p.week===selectedMenuWeek);
  if(!plans.length){weekMenuList.innerHTML=`<div class="week-menu-empty">Voor deze week zijn nog geen recepten geselecteerd.<br><button class="btn primary" id="weekMenuFindRecipes" type="button">Recept kiezen</button></div>`;weekMenuList.querySelector('#weekMenuFindRecipes')?.addEventListener('click',()=>showRecipeModule('recipes'));return}
  weekMenuList.innerHTML=plans.map(p=>`<article class="week-menu-card" data-plan-card="${esc(p.id)}"><button class="week-menu-recipe-link" data-open-week-recipe="${esc(p.recipeId)}" type="button"><span><strong>${esc(p.title||'Recept')}</strong><small>${p.servings?esc(p.servings)+' personen · ':''}${(p.ingredients||[]).length} ingrediënten</small></span><span class="go">›</span></button><label class="week-menu-servings">Aantal personen <input type="number" min="1" inputmode="numeric" enterkeyhint="go" data-plan-servings="${esc(p.id)}" value="${esc(p.servings||getRecipe(p.recipeId)?.servings||1)}"></label><div class="week-menu-actions"><select data-move-week="${esc(p.id)}" aria-label="Andere week">${menuWeekOptions(p.week)}</select><button class="btn" data-move-plan="${esc(p.id)}" type="button">Verplaatsen</button><button class="btn danger remove-week-plan" data-remove-plan="${esc(p.id)}" type="button">Uit deze week verwijderen</button></div>${selectedMenuWeek===upcomingWeekKey()?`<div class="week-menu-ordered"><strong>Voorraad & besteld</strong>${(p.ingredients||[]).map((i,n)=>{const coverage=stockCoverage(i,i.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');const info=coverage.matched?(coverage.enough?coverage.label:`${coverage.label}${coverage.shortage?` · tekort ${[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';return `<label class="recipe-order-row ${coverage.enough?'in-stock':''}"><input type="checkbox" data-week-ordered="${esc(p.id)}:${n}" ${i.ordered?'checked':''} ${coverage.enough?'disabled':''}><span><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Ingrediënt'].filter(Boolean).join(' '))}</span><small class="stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}">${esc(info)}</small>${isGenericPasta(i.ingredient)&&coverage.matches?.some(x=>pastaType(x.name))?`<select class="stock-alternative-select" data-week-stock-choice="${esc(p.id)}:${n}" aria-label="Kies pastasoort uit voorraad">${coverage.matches.filter(x=>pastaType(x.name)).map(x=>`<option value="${esc(x.id)}" ${String(i.stockProductId||coverage.product?.id)===String(x.id)?'selected':''}>${esc(x.name)} · ${esc([x.quantity,x.unit].filter(Boolean).join(' '))}</option>`).join('')}</select>`:''}</span></label>`}).join('')}</div>`:''}</article>`).join('');
  const applyPlannedServings=(input)=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(input.dataset.planServings)),target=Math.max(1,Number(input.value)||1);if(!plan)return;const recipe=getRecipe(plan.recipeId);if(!recipe)return;const previous=plan.ingredients||[],scaled=scaledRecipe(recipe,target),gf=Math.max(0,Math.min(target,Number(plan.gfPersons)||0));plan.servings=String(target);plan.ingredients=(scaled.ingredients||[]).map((i,n)=>{const old=previous.find(x=>String(x.id)===String(n))||previous[n]||{};const coverage=stockCoverage(i,old.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');return {...old,id:String(n),qty:i.qty||'',unit:i.unit||'',ingredient:i.ingredient||'',memo:i.memo||'',done:Boolean(old.done),ordered:coverage.enough?false:Boolean(old.ordered),stockEnough:Boolean(coverage.enough),stockProductId:coverage.product?.id??old.stockProductId??'',stockLabel:coverage.matched?coverage.label:'',shoppingQty:coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):'',store:coverage.product?.store||old.store||'',category:coverage.product?.category||old.category||''}});plan.gfPersons=gf;saveRecipeWeekPlans(plans);input.blur();renderWeekMenu()};
  weekMenuList.querySelectorAll('[data-plan-servings]').forEach(input=>{input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyPlannedServings(input)}});input.addEventListener('change',()=>applyPlannedServings(input))});
  weekMenuList.querySelectorAll('[data-week-ordered]').forEach(cb=>cb.addEventListener('change',()=>{const [id,idx]=String(cb.dataset.weekOrdered).split(':');const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===id);if(!plan?.ingredients?.[Number(idx)])return;plan.ingredients[Number(idx)].ordered=cb.checked;saveRecipeWeekPlans(plans)}));
  weekMenuList.querySelectorAll('[data-week-stock-choice]').forEach(choice=>choice.addEventListener('change',()=>{const [id,idx]=String(choice.dataset.weekStockChoice).split(':');const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===id),ingredient=plan?.ingredients?.[Number(idx)];if(!ingredient)return;const coverage=stockCoverage(ingredient,choice.value);ingredient.stockProductId=coverage.product?.id??'';ingredient.stockEnough=Boolean(coverage.enough);ingredient.stockLabel=coverage.matched?coverage.label:'';ingredient.shoppingQty=coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):'';ingredient.store=coverage.product?.store||ingredient.store||'';ingredient.category=coverage.product?.category||ingredient.category||'';if(coverage.enough)ingredient.ordered=false;saveRecipeWeekPlans(plans);renderWeekMenu()}));
  weekMenuList.querySelectorAll('[data-open-week-recipe]').forEach(btn=>btn.addEventListener('click',()=>{const r=getRecipe(btn.dataset.openWeekRecipe);if(!r){alert('Dit recept is niet meer beschikbaar in Recepten.');return}const plan=recipeWeekPlans().find(x=>String(x.recipeId)===String(r.id)&&x.week===selectedMenuWeek);openedFromWeekMenu=true;current=String(r.id);edited=JSON.parse(JSON.stringify(r));if(plan?.ingredients?.length)edited.ingredients=JSON.parse(JSON.stringify(plan.ingredients));displayServings=String(plan?.servings||r.servings||'');weekMenuPanel?.classList.add('hidden');recipeLibraryPanel?.classList.add('hidden');hideList();showView('directions')}));
  weekMenuList.querySelectorAll('[data-move-plan]').forEach(btn=>btn.addEventListener('click',()=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(btn.dataset.movePlan));const select=weekMenuList.querySelector(`[data-move-week="${CSS.escape(String(btn.dataset.movePlan))}"]`);if(!plan||!select)return;const oldWeek=plan.week,newWeek=select.value;if(newWeek===oldWeek)return;plan.week=newWeek;saveRecipeWeekPlans(plans);renderWeekMenu()}));
  weekMenuList.querySelectorAll('[data-remove-plan]').forEach(btn=>btn.addEventListener('click',()=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(btn.dataset.removePlan));if(!plan)return;if(!confirm(`${plan.title||'Dit recept'} uit ${weekNumberLabel(selectedMenuWeek)} verwijderen?`))return;saveRecipeWeekPlans(plans.filter(x=>String(x.id)!==String(btn.dataset.removePlan)));renderWeekMenu()}));
}
function showRecipeModule(view){
  const recipes=view==='recipes';
  document.querySelector('.recipes')?.classList.remove('recipe-detail-open');
  detail?.classList.add('hidden');
  weekMenuPanel?.classList.toggle('hidden',recipes);
  recipeLibraryPanel?.classList.toggle('hidden',!recipes);
  showWeekMenuButton?.classList.toggle('active',!recipes);
  showRecipesButton?.classList.toggle('active',recipes);
  if(recipes){list.classList.remove('hidden');pendingBox.classList.remove('hidden');search.classList.remove('hidden');renderList()}else renderWeekMenu();
}
window.hcShowRecipeModule=showRecipeModule;
showWeekMenuButton?.addEventListener('click',()=>showRecipeModule('weekmenu'));
showRecipesButton?.addEventListener('click',()=>showRecipeModule('recipes'));
document.querySelector('#weekMenuPrev')?.addEventListener('click',()=>{selectedMenuWeek=shiftMenuWeek(selectedMenuWeek,-1);localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
document.querySelector('#weekMenuNext')?.addEventListener('click',()=>{selectedMenuWeek=shiftMenuWeek(selectedMenuWeek,1);localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
document.querySelector('#weekMenuTitle')?.addEventListener('click',()=>{selectedMenuWeek=isoWeekKey(new Date());localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
window.addEventListener('huize-chaos-recipe-weeks-changed',renderWeekMenu);
window.addEventListener('storage',e=>{if(e.key===RECIPE_WEEK_KEY)renderWeekMenu()});
showRecipeModule('weekmenu');
function showReadonlyRecipe(r,view='ingredients'){
  const m=metaFor(r.id),memo=m.memo||'';current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=String(new URLSearchParams(location.search).get('servings')||r.servings||'');hideList();
  const sourceBits=[];if(r.source)sourceBits.push(`Bron: ${esc(r.source)}`);if(r.sourceUrl)sourceBits.push(`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Bron openen</a>`);
  const render=tab=>{detail.innerHTML=`<div class="detail-head"><div><h2>${esc(r.title)}</h2><small>${displayServings?esc(displayServings)+' personen':''}</small>${sourceBits.length?`<div class="recipe-source">${sourceBits.join(' · ')}</div>`:''}</div><div class="actions"><button class="btn primary" id="backShopping">← Terug naar boodschappenlijst</button></div></div>${memo?`<div class="recipe-readonly-memo"><strong>Memo</strong><div>${esc(memo)}</div></div>`:''}<div class="tabs readonly-tabs"><button class="tab ${tab==='ingredients'?'active':''}" data-ro-v="ingredients">Ingrediënten</button><button class="tab ${tab==='directions'?'active':''}" data-ro-v="directions">Bereiding</button></div><div id="recipeViewBody">${tab==='ingredients'?ingredients(r):`<div class="panel directions">${esc(r.directions||'Nog geen bereidingswijze.')}</div>`}</div>`;
    detail.querySelector('#backShopping').onclick=()=>{window.location.href='../boodschappen/?page=list'};detail.querySelectorAll('[data-ro-v]').forEach(b=>b.onclick=()=>render(b.dataset.roV));
  };render(view==='directions'?'directions':'ingredients');
}
const directParams=new URLSearchParams(location.search),directRecipe=directParams.get('recipe');
if(directRecipe){const r=getRecipe(directRecipe);if(r){weekMenuPanel?.classList.add('hidden');recipeLibraryPanel?.classList.add('hidden');if(directParams.get('readonly')==='shopping')showReadonlyRecipe(r,directParams.get('view')||'ingredients');else{returnEventId=directParams.get('event')||'';current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=directParams.get('servings')||String(r.servings||'');hideList();showView(directParams.get('view')==='directions'?'directions':'ingredients')}}}

// V1.3.116 - slimme bulkinvoer voor handmatige recepten toegevoegd.


// V1.3.116 - handmatig recept toevoegen met slimme algemene bulkinvoer
function normalizeBulkUnit(unit){
  const u=String(unit||'').trim().toLowerCase();
  const map={'eetlepel':'el','eetlepels':'el','tablespoon':'el','tablespoons':'el','tbsp':'el','theelepel':'tl','theelepels':'tl','teaspoon':'tl','teaspoons':'tl','tsp':'tl','teentje':'teentje','teentjes':'teentjes'};
  return map[u]||u;
}
function looksLikeAmountLine(line){
  const s=String(line||'').trim();
  return /^(?:\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+)(?:\s+(?:g|gr|gram|kg|ml|cl|dl|l|el|tl|stuks?|stuk|blik(?:je)?s?|zak(?:je)?s?|teen|tenen|teentje|teentjes|snuf(?:je)?))?$/i.test(s)||/^naar smaak$/i.test(s);
}
function parseBulkAmount(line){
  const s=String(line||'').trim();
  if(/^naar smaak$/i.test(s))return {qty:'naar smaak',unit:''};
  const m=s.match(/^((?:\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+))\s*(.*)$/);
  if(!m)return {qty:'',unit:'',warning:'Hoeveelheid niet herkend'};
  return {qty:m[1].replace('.',','),unit:normalizeBulkUnit(m[2])};
}
function cleanBulkLines(text){return String(text||'').replace(/\r/g,'').split('\n').map(x=>x.replace(/\*\*/g,'').trim()).filter(Boolean)}
function parseBulkIngredients(text){
  let lines=cleanBulkLines(text).filter(x=>!/^ingrediënten?$/i.test(x)&&!/^bereiding(?:swijze)?$/i.test(x)&&!/^waarschijnlijk al in huis$/i.test(x));
  const out=[];
  for(let i=0;i<lines.length;){
    let name=lines[i];
    if(looksLikeAmountLine(name)){out.push({...parseBulkAmount(name),ingredient:'',memo:'Controleer deze regel',warning:true});i++;continue}
    if(i+1<lines.length&&lines[i+1].toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl'))i++;
    const next=lines[i+1];
    if(next&&looksLikeAmountLine(next)){
      const a=parseBulkAmount(next);out.push({qty:a.qty,unit:a.unit,ingredient:name,memo:'',warning:false});i+=2;
    }else{
      // Gewone één-regel ingrediëntenlijsten blijven ook ondersteund.
      const parsed=parseIngredient(name);out.push({...parsed,warning:!parsed.ingredient});i++;
    }
  }
  return out.filter(x=>x.ingredient||x.qty||x.unit);
}
function parseBulkDirections(text){
  const lines=cleanBulkLines(text).filter(x=>!/^bereiding(?:swijze)?$/i.test(x));
  const steps=[];let current='';
  for(const line of lines){
    if(/^\d+[.)]?$/.test(line)){
      if(current.trim())steps.push(current.trim());current='';continue;
    }
    const numbered=line.match(/^\d+[.)]\s+(.+)$/);
    if(numbered){if(current.trim())steps.push(current.trim());current=numbered[1];continue}
    current+=(current?'\n':'')+line;
  }
  if(current.trim())steps.push(current.trim());
  return steps.map((x,i)=>`${i+1}. ${x}`).join('\n\n');
}
function showManualRecipeForm(){
  current='new:'+Date.now();edited={id:'custom-'+Date.now(),title:'',servings:'',ingredients:[],directions:'',source:'Handmatig',imported:true};displayServings='';hideList();
  detail.innerHTML=`<div class="detail-head"><div><h2>Recept toevoegen</h2><small>Handmatig of door tekst te plakken</small></div><div class="actions"><button class="btn" id="cancelNewRecipe">Terug</button></div></div>
  <div class="panel bulk-recipe-panel"><label>Titel<input id="newRecipeTitle" placeholder="Naam van het recept"></label><label>Aantal personen<input id="newRecipeServings" type="number" min="1" inputmode="numeric" placeholder="4"></label><label>Bron<input id="newRecipeSource" placeholder="Bijv. Picnic, Allerhande, eigen recept"></label><label>Bron / URL (optioneel)<input id="newRecipeSourceUrl" type="url" placeholder="https://…"></label>
  <h3>Ingrediënten</h3><p class="bulk-help">Plak een complete ingrediëntenlijst. Huize Chaos zet ieder ingrediënt op een eigen regel. Dit werkt ook met lijsten waarin productnamen dubbel voorkomen.</p><textarea id="bulkIngredients" placeholder="800 g kipdrumsticks\n3 el sojasaus\n2 tenen knoflook"></textarea><button class="btn" id="processBulkIngredients" type="button">Ingrediënten verwerken</button><div id="bulkIngredientPreview"></div>
  <h3>Bereiding</h3><p class="bulk-help">Plak de volledige bereidingswijze. Losse stapnummers worden automatisch verwerkt.</p><textarea id="bulkDirections" placeholder="Verwarm de oven...\n2\nMeng de ingrediënten..."></textarea><button class="btn" id="processBulkDirections" type="button">Bereiding verwerken</button><div id="bulkDirectionsPreview"></div>
  <div class="actions bulk-save-actions"><button class="btn primary" id="saveNewRecipe" type="button">Recept opslaan</button><button class="btn" id="cancelNewRecipe2" type="button">Annuleren</button></div></div>`;
  const renderPreview=()=>{const box=detail.querySelector('#bulkIngredientPreview');box.innerHTML=edited.ingredients.length?`<div class="bulk-preview-title">Controleer de ingrediënten</div>${edited.ingredients.map((x,i)=>`<div class="edit-row ingredient-edit-row ${x.warning?'bulk-warning':''}"><input data-new-f="qty" data-new-i="${i}" value="${esc(x.qty||'')}" placeholder="Aantal"><input data-new-f="unit" data-new-i="${i}" value="${esc(x.unit||'')}" placeholder="Eenheid"><input data-new-f="ingredient" data-new-i="${i}" value="${esc(x.ingredient||'')}" placeholder="Ingrediënt"><button class="remove-ing" data-new-remove="${i}" type="button">×</button>${x.warning?'<small class="bulk-warning-text">Controleer deze regel</small>':''}</div>`).join('')}`:'';box.querySelectorAll('[data-new-f]').forEach(el=>el.oninput=()=>edited.ingredients[+el.dataset.newI][el.dataset.newF]=el.value);box.querySelectorAll('[data-new-remove]').forEach(b=>b.onclick=()=>{edited.ingredients.splice(+b.dataset.newRemove,1);renderPreview()})};
  detail.querySelector('#processBulkIngredients').onclick=()=>{edited.ingredients=parseBulkIngredients(detail.querySelector('#bulkIngredients').value);renderPreview()};
  detail.querySelector('#processBulkDirections').onclick=()=>{edited.directions=parseBulkDirections(detail.querySelector('#bulkDirections').value);detail.querySelector('#bulkDirectionsPreview').innerHTML=edited.directions?`<div class="bulk-preview-title">Controleer de bereiding</div><textarea id="parsedDirections">${esc(edited.directions)}</textarea>`:'';detail.querySelector('#parsedDirections')?.addEventListener('input',e=>edited.directions=e.target.value)};
  const cancel=()=>backList();detail.querySelector('#cancelNewRecipe').onclick=cancel;detail.querySelector('#cancelNewRecipe2').onclick=cancel;
  detail.querySelector('#saveNewRecipe').onclick=()=>{edited.title=detail.querySelector('#newRecipeTitle').value.trim();edited.servings=detail.querySelector('#newRecipeServings').value.trim();edited.source=detail.querySelector('#newRecipeSource').value.trim()||'Handmatig';edited.sourceUrl=detail.querySelector('#newRecipeSourceUrl').value.trim();if(!edited.ingredients.length&&detail.querySelector('#bulkIngredients').value.trim())edited.ingredients=parseBulkIngredients(detail.querySelector('#bulkIngredients').value);if(!edited.directions&&detail.querySelector('#bulkDirections').value.trim())edited.directions=parseBulkDirections(detail.querySelector('#bulkDirections').value);if(!edited.title){alert('Vul eerst een titel in.');return}edited.ingredients=edited.ingredients.filter(x=>x.ingredient.trim()).map(({warning,...x})=>x);saveCustom([...custom(),edited]);current=String(edited.id);displayServings=String(edited.servings||'');showView('ingredients')};
}
document.querySelector('#addRecipeManual')?.addEventListener('click',showManualRecipeForm);

// V1.3.116 - Ga/Enter: invoer toepassen en toetsenbord sluiten; textarea houdt nieuwe regels.
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.tagName==='TEXTAREA')return;const input=e.target;if(!(input instanceof HTMLInputElement))return;if(input.type==='search')return;e.preventDefault();input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();});
