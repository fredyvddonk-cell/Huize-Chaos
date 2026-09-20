// V1.4.47 - receptkeuze tekstueel opgebouwd: categorie = keuken, soort = gerechtvorm, plus hoofdingrediënt en tijd thuis.
// V1.4.47 - weekmenuvariatie houdt rekening met keuken, gerechtvorm en hoofdingrediënt.
// V1.4.47 - voorraadproduct opent eigen receptsuggesties; online zoeken blijft een rustige tweede stap.
// V1.4.44 - rustiger en sneller receptenmenu, recept eerst openen, categorie wijzigen, voorraad- en variatiefilters.
// V1.3.116 - de receptenmodule start altijd lokaal. Firebase wordt pas daarna dynamisch geladen,
// zodat een netwerk/CDN-probleem het Weekmenu niet meer kan blokkeren.
const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
let auth=null,db=null,recipeRef=null,occasionRef=null;
let fbOnAuthStateChanged=null,fbGetDoc=null,fbOnSnapshot=null,fbServerTimestamp=null,fbSetDoc=null,fbDoc=null,fbCollection=null;
const BASE=window.HUIZE_CHAOS_RECIPES||[];const PENDING_KEY='hc-recipe-pending-v1',CUSTOM_KEY='hc-recipe-custom-v1',META_KEY='hc-recipe-meta-v1',DELETED_KEY='hc-recipe-deleted-v1',RECIPE_WEEK_KEY='huize-chaos-recipe-weeks-v1',RECIPE_WEEK_DELETED_KEY='huize-chaos-recipe-weeks-deleted-v1';
const list=document.querySelector('#list'),pendingBox=document.querySelector('#pending'),detail=document.querySelector('#detail'),search=document.querySelector('#search'),syncStatus=document.querySelector('#recipeSyncStatus');
let current=null,edited=null,cloudReady=false,applyingCloud=false,syncTimer=0,user=null,stopCloud=null,openedFromWeekMenu=false,returnEventId='',displayServings='';
let recipeModuleView='weekmenu',recipeHistoryReady=false;
const launchParams=new URLSearchParams(location.search),stockIngredientQuery=String(launchParams.get('ingredient')||'').trim(),stockIngredientProductId=String(launchParams.get('stockProductId')||'').trim();
const RECIPE_CATEGORIES=['Nederlands','Italiaans','Aziatisch','Grieks / Mediterraan','Mexicaans / Tex-Mex','Midden-Oosters','Amerikaans','Overig'];
const RECIPE_TYPES=['Pastagerecht','Rijstgerecht','Aardappelgerecht','Bowl','Wrap / tortilla','Ovenschotel','Soep','Salade','Pizza / plaatgerecht','Broodgerecht','Stamppot','Eenpansgerecht','Anders'];
const MAIN_INGREDIENT_OPTIONS=['Kip','Rund','Varken','Vis','Vegetarisch','Anders'];
const HOME_TIME_OPTIONS=['Kort','Middellang','Lang'];
let allRecipesCache=null,stockFitCache=new Map(),smartRecipeMode='all',smartRecipeLimit=24,smartRecipeTime='Alles',recipeListScrollY=0;
function invalidateRecipeCaches(){allRecipesCache=null;stockFitCache.clear()}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(v)?v:f}catch(_){return f}};const pending=()=>read(PENDING_KEY),custom=()=>read(CUSTOM_KEY),recipeMeta=()=>read(META_KEY),deletedRecipes=()=>read(DELETED_KEY);
function saveDeletedRecipes(ids){write(DELETED_KEY,[...new Set((ids||[]).map(String))]);invalidateRecipeCaches();scheduleSync()}
function metaFor(id){return recipeMeta().find(x=>String(x.id)===String(id))||{id:String(id),favorite:false,memo:''}}
function saveMetaFor(id,patch){const a=recipeMeta(),key=String(id),i=a.findIndex(x=>String(x.id)===key),next={...(i>=0?a[i]:{id:key,favorite:false,memo:''}),...patch,id:key};if(i>=0)a[i]=next;else a.push(next);write(META_KEY,a);scheduleSync();renderList();return next}
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));const mergeById=(a,b)=>{const m=new Map();[...a,...b].forEach(x=>m.set(String(x.id),x));return [...m.values()]};
function recipeWeekDeleted(){try{return JSON.parse(localStorage.getItem(RECIPE_WEEK_DELETED_KEY)||'{}')||{}}catch(_){return {}}}
function saveRecipeWeekDeleted(v){localStorage.setItem(RECIPE_WEEK_DELETED_KEY,JSON.stringify(v||{}))}
function mergeWeekDeleted(remote={},local={}){const out={...remote};Object.entries(local||{}).forEach(([id,ts])=>out[id]=Math.max(Number(out[id]||0),Number(ts||0)));return out}
function mergeWeekPlans(remote=[],local=[],deleted=recipeWeekDeleted()){const merged=new Map();(remote||[]).forEach(plan=>merged.set(String(plan.id),plan));(local||[]).forEach(plan=>{const id=String(plan.id),current=merged.get(id);if(!current||Number(plan.changedAt||0)>Number(current.changedAt||0))merged.set(id,plan)});return [...merged.values()].filter(plan=>Number(deleted[String(plan.id)]||0)<Number(plan.changedAt||0))}
function allRecipes(){if(allRecipesCache)return allRecipesCache;const deleted=new Set(deletedRecipes().map(String)),edits=new Map();BASE.forEach(r=>{if(deleted.has(String(r.id)))return;try{const x=JSON.parse(localStorage.getItem('hc_recipe_'+r.id)||'null');if(x)edits.set(String(r.id),x)}catch(_){}});allRecipesCache=[...BASE.filter(r=>!deleted.has(String(r.id))).map(r=>edits.get(String(r.id))||r),...custom().filter(r=>!deleted.has(String(r.id)))];return allRecipesCache}
function setStatus(t){if(syncStatus){syncStatus.textContent=t;syncStatus.hidden=/^(Gesynchroniseerd|Recepten laden…)$/.test(t)}}
function scheduleSync(){if(!cloudReady||applyingCloud||!user)return;clearTimeout(syncTimer);setStatus('Synchroniseren…');syncTimer=setTimeout(syncCloud,250)}
async function syncCloud(){if(!user||!recipeRef||!fbSetDoc||!fbServerTimestamp)return;await fbSetDoc(recipeRef,{pending:pending(),custom:custom(),meta:recipeMeta(),deleted:deletedRecipes(),weekPlans:recipeWeekPlans(),deletedWeekPlans:recipeWeekDeleted(),updatedAt:fbServerTimestamp(),updatedBy:user.uid},{merge:false});setStatus('Gesynchroniseerd')}
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
    fbOnAuthStateChanged=authMod.onAuthStateChanged;fbGetDoc=fireMod.getDoc;fbOnSnapshot=fireMod.onSnapshot;fbServerTimestamp=fireMod.serverTimestamp;fbSetDoc=fireMod.setDoc;fbDoc=fireMod.doc;fbCollection=fireMod.collection;
    fbOnAuthStateChanged(auth,async u=>{user=u;if(!u){setStatus('Alleen op dit apparaat');return}setStatus('Synchroniseren…');try{const snap=await fbGetDoc(recipeRef);if(snap.exists()){applyingCloud=true;const d=snap.data()||{};write(PENDING_KEY,mergeById(d.pending||[],pending()));write(CUSTOM_KEY,mergeById(d.custom||[],custom()));write(META_KEY,mergeById(d.meta||[],recipeMeta()));write(DELETED_KEY,[...new Set([...(d.deleted||[]),...deletedRecipes()].map(String))]);const weekDeleted=mergeWeekDeleted(d.deletedWeekPlans||{},recipeWeekDeleted());saveRecipeWeekDeleted(weekDeleted);write(RECIPE_WEEK_KEY,mergeWeekPlans(d.weekPlans||[],recipeWeekPlans(),weekDeleted));applyingCloud=false;invalidateRecipeCaches();renderList();renderWeekMenu?.();}cloudReady=true;await syncCloud();stopCloud?.();stopCloud=fbOnSnapshot(recipeRef,snap=>{if(!snap.exists()||applyingCloud)return;const d=snap.data()||{};applyingCloud=true;write(PENDING_KEY,d.pending||[]);write(CUSTOM_KEY,d.custom||[]);write(META_KEY,d.meta||[]);write(DELETED_KEY,(d.deleted||[]).map(String));const weekDeleted=mergeWeekDeleted(d.deletedWeekPlans||{},recipeWeekDeleted());saveRecipeWeekDeleted(weekDeleted);write(RECIPE_WEEK_KEY,mergeWeekPlans(d.weekPlans||[],recipeWeekPlans(),weekDeleted));applyingCloud=false;invalidateRecipeCaches();renderList();renderWeekMenu?.();setStatus('Gesynchroniseerd')},()=>setStatus('Synchronisatie niet beschikbaar'));}catch(err){console.warn(err);setStatus('Alleen op dit apparaat')}});
  }catch(err){console.warn('Firebase kon niet worden geladen; lokaal gebruik blijft beschikbaar.',err);setStatus('Alleen op dit apparaat')}
}
function savePending(a){write(PENDING_KEY,a);renderList();scheduleSync()}function saveCustom(a){write(CUSTOM_KEY,a);invalidateRecipeCaches();renderList();scheduleSync()}
function sourceLabel(r){try{return r.sourceUrl?new URL(r.sourceUrl).hostname.replace(/^www\./,''):r.source||'Gedeeld'}catch(_){return r.source||'Gedeeld'}}
function renderList(){
  const q=search.value.trim().toLowerCase(),drafts=pending();
  pendingBox.innerHTML=drafts.length?`<section class="pending-recipes"><div class="pending-head"><h2>Te controleren</h2><span>${drafts.length}</span></div><p>Gedeelde recepten staan hier tot je ze hebt nagekeken.</p>${drafts.map(r=>`<button class="pending-recipe-card" data-pending="${esc(r.id)}"><span><strong>${esc(r.title||'Gedeeld recept')}</strong><small>${esc(sourceLabel(r))}</small></span><span>Controleren ›</span></button>`).join('')}</section>`:'';
  pendingBox.querySelectorAll('[data-pending]').forEach(b=>b.onclick=()=>openPending(b.dataset.pending));
  if(!q){list.innerHTML='';return}
  const a=allRecipes().filter(r=>(r.title||'').toLowerCase().includes(q)).sort((a,b)=>Number(metaFor(b.id).favorite)-Number(metaFor(a.id).favorite)).slice(0,40);
  list.innerHTML=a.length?a.map(r=>`<button class="recipe-card compact ${r.photo?'has-photo':''}" data-id="${esc(r.id)}">${r.photo?`<img class="recipe-card-photo" src="${esc(r.photo)}" alt="">`:''}<span class="recipe-card-copy"><strong>${metaFor(r.id).favorite?'★ ':''}${esc(r.title)}</strong><small>${esc(recipeCategory(r))}${r.servings?' · '+esc(r.servings)+' personen':''}</small></span><span class="go">›</span></button>`).join(''):`<div class="empty">Geen recepten gevonden.</div>`;
  list.querySelectorAll('.recipe-card').forEach(b=>b.onclick=()=>openRecipe(b.dataset.id))
}
function hideList(){if(recipeModuleView==='recipes')recipeListScrollY=window.scrollY||0;list.classList.add('hidden');pendingBox.classList.add('hidden');search.classList.add('hidden');recipeLibraryPanel?.classList.add('hidden');weekMenuPanel?.classList.add('hidden');detail.classList.remove('hidden');document.querySelector('.recipes')?.classList.add('recipe-detail-open');window.scrollTo({top:0,behavior:'instant'})}
function pushRecipeHistory(state){if(!recipeHistoryReady)return;history.pushState({...history.state,hcRecipeScreen:'detail',hcRecipeModule:recipeModuleView,...state},'',location.href)}
function backListDirect(refresh=false){detail.classList.add('hidden');document.querySelector('.recipes')?.classList.remove('recipe-detail-open');current=null;edited=null;displayServings='';const target=openedFromWeekMenu?'weekmenu':recipeModuleView;openedFromWeekMenu=false;showRecipeModule(target,true);if(refresh&&target==='recipes')renderList();if(target==='recipes')requestAnimationFrame(()=>window.scrollTo({top:recipeListScrollY,behavior:'instant'}))}
function backList(refresh=false){if(returnEventId){const id=returnEventId;returnEventId='';window.location.href=`../gelegenheden/?event=${encodeURIComponent(id)}`;return}if(history.state?.hcRecipeScreen==='detail'){history.back();return}backListDirect(refresh)}
function getRecipe(id){return allRecipes().find(r=>String(r.id)===String(id))}function isCustom(id){return custom().some(r=>String(r.id)===String(id))}
function openRecipe(id,{fromHistory=false}={}){const recipe=getRecipe(id);if(!recipe)return;if(!fromHistory)pushRecipeHistory({hcRecipeKind:'recipe',hcRecipeId:String(id),hcRecipeReturn:recipeModuleView});current=String(id);edited=JSON.parse(JSON.stringify(recipe));displayServings=String(edited?.servings||'');hideList();showView('ingredients')}
function openPending(id,{fromHistory=false}={}){const r=pending().find(x=>String(x.id)===String(id));if(!r)return;if(!fromHistory)pushRecipeHistory({hcRecipeKind:'pending',hcRecipeId:String(id),hcRecipeReturn:recipeModuleView});current='pending:'+id;edited=JSON.parse(JSON.stringify(r));hideList();showReview()}
function parseQtyNumber(value){let s=String(value??'').trim().replace(',','.');if(!s)return null;const u={'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};if(u[s]!=null)return u[s];const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(m)return Number(m[1])+Number(m[2])/Number(m[3]);const f=s.match(/^(\d+)\/(\d+)$/);if(f)return Number(f[1])/Number(f[2]);const n=Number(s);return Number.isFinite(n)?n:null}
function isPieceIngredient(unit='',ingredient=''){const u=String(unit||'').trim().toLowerCase(),food=String(ingredient||'').toLowerCase();if(/^(stuks?|stuk|blik(?:je)?|zak(?:je)?|teen|tenen)$/.test(u))return true;if(u)return false;return /(?:^|\b)(komkommer|ui|uien|tomaat|tomaten|avocado|avocado's|paprika|courgette|ei|eieren|citroen|limoen|naanbrood|stokbrood|wraps?|pita(?:broodjes?)?|tortilla's?|bosje|krop)(?:\b|$)/i.test(food)}
function formatScaledNumber(n,unit='',ingredient=''){if(!Number.isFinite(n))return '';const u=String(unit||'').toLowerCase(),food=String(ingredient||'').toLowerCase();let v=n;if(['el','tl'].includes(u))v=Math.round(v*16)/16;else if(['g','gr','gram','ml'].includes(u))v=Math.round(v);else if(isPieceIngredient(unit,ingredient))v=Math.round(v*100)/100;else if(!u&&/(limoen|citroen)/.test(food))v=Math.round(v*2)/2;else v=Math.round(v*100)/100;const whole=Math.floor(v),fr=Math.round((v-whole)*16)/16,fm={0.25:'¼',0.5:'½',0.75:'¾'};if(fm[fr]&&Math.abs(v-(whole+fr))<1e-8)return whole?`${whole} ${fm[fr]}`:fm[fr];return String(Number(v.toFixed(4))).replace('.',',')}
function scaledQty(qty,factor,unit,ingredient){const n=parseQtyNumber(qty);return n==null?String(qty||''):formatScaledNumber(n*factor,unit,ingredient)}
function scaledIngredient(x,factor){const n=parseQtyNumber(x.qty);if(n==null)return {...x};const exact=n*factor;if(isPieceIngredient(x.unit,x.ingredient)&&Math.abs(exact-Math.round(exact))>1e-8){return {...x,qty:String(Math.ceil(exact)),exactQty:formatScaledNumber(exact,x.unit,x.ingredient)}}return {...x,qty:formatScaledNumber(exact,x.unit,x.ingredient),exactQty:''}}
function scaledRecipe(r,servings=displayServings){const base=Number(r?.servings)||0,target=Number(servings)||base;if(!base||!target||base===target)return JSON.parse(JSON.stringify(r));const factor=target/base;const copy=JSON.parse(JSON.stringify(r));copy.servings=String(target);copy.ingredients=(copy.ingredients||[]).map(x=>scaledIngredient(x,factor));return copy}
function linkedRecipeForIngredient(x){return x?.linkedRecipeId?getRecipe(x.linkedRecipeId):null}
function ingredients(r){const shown=scaledRecipe(r);return `<div class="panel">${(shown.ingredients||[]).length?shown.ingredients.map(x=>{const linked=linkedRecipeForIngredient(x),exact=x.exactQty?`<small class="piece-exact">Berekend nodig: ${esc(x.exactQty)} ${esc(x.unit||'stuk')}</small>`:'';return `<div class="ing"><span class="qty">${esc(x.qty)}</span><span class="unit">${esc(x.unit)}</span><span>${esc(x.ingredient)}${linked?` <button type="button" class="subrecipe-link" data-subrecipe="${esc(linked.id)}">Recept</button>`:''}${exact}</span>${x.memo?`<span class="memo">${esc(x.memo)}</span>`:''}</div>`}).join(''):'<div class="empty">Nog geen ingrediënten.</div>'}</div>`}
function bindSubrecipeLinks(){detail.querySelectorAll('[data-subrecipe]').forEach(btn=>btn.onclick=()=>{const target=getRecipe(btn.dataset.subrecipe);if(!target)return;const parent=current;current=String(target.id);edited=JSON.parse(JSON.stringify(target));displayServings=String(target.servings||'');showView('ingredients');const back=detail.querySelector('#backList');if(back){back.textContent='← Terug naar hoofdrecept';back.onclick=()=>{const r=getRecipe(parent);if(!r)return;current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=String(r.servings||'');showView('ingredients')}}})}

function showView(view){
  const r=edited;if(!displayServings)displayServings=String(r.servings||'');
  const sourceBits=[];
  if(r.source)sourceBits.push(`Bron: ${esc(r.source)}`);
  if(r.sourceUrl)sourceBits.push(`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Bron openen</a>`);
  const sourceLine=sourceBits.length?`<div class="recipe-source">${sourceBits.join(' · ')}</div>`:'';
  const servingsBox=view==='edit'?'':`<div class="recipe-serving-control"><label>Aantal personen <input id="displayServings" type="number" min="1" inputmode="numeric" enterkeyhint="go" value="${esc(displayServings||r.servings||'')}"></label><small>Ingrediënten worden direct omgerekend. Het basisrecept blijft ongewijzigd.</small></div>`;
  const meta=metaFor(r.id);detail.innerHTML=`${r.photo?`<div class="recipe-detail-photo-wrap"><img class="recipe-detail-photo" src="${esc(r.photo)}" alt="${esc(r.title)}"></div>`:''}<div class="detail-head"><div><h2>${esc(r.title)}</h2><small>${[r.servings?`Basis: ${esc(r.servings)} personen`:'',`Categorie: ${esc(recipeCategory(r))}`,`Soort: ${esc(recipeType(r))}`,`Hoofdingrediënt: ${esc(recipeMainIngredient(r))}`,recipeHomeTime(r)?`Tijd thuis: ${esc(recipeHomeTime(r))}`:''].filter(Boolean).join(' · ')}</small>${sourceLine}</div><div class="actions"><button class="btn favorite-recipe ${meta.favorite?'active':''}" id="favoriteRecipe" type="button">${meta.favorite?'★ Favoriet':'☆ Favoriet'}</button><button class="btn" id="backList">Terug</button></div></div>${servingsBox}<div class="recipe-memo-panel"><label>Memo <textarea id="recipeMemo" placeholder="Eigen aanpassingen of opmerkingen…">${esc(meta.memo||'')}</textarea></label></div><div class="tabs"><button class="tab ${view==='ingredients'?'active':''}" data-v="ingredients">Ingrediënten</button><button class="tab ${view==='directions'?'active':''}" data-v="directions">Bereiding</button><button class="tab ${view==='edit'?'active':''}" data-v="edit">Wijzigen</button></div><div id="recipeViewBody">${view==='ingredients'?ingredients(r):view==='directions'?`<div class="panel directions">${esc(r.directions||'Nog geen bereidingswijze.')}</div>`:editForm(r,false)}</div>`;
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
function ingredientRows(r){const options=stockProducts().slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'nl',{sensitivity:'base'}));return (r.ingredients||[]).map((x,i)=>{const linked=linkedRecipeForIngredient(x),coverage=stockCoverage(x,x.stockProductId||''),selected=x.stockProductId||coverage.product?.id||'';return `<div class="edit-row ingredient-edit-row" data-row="${i}"><input data-f="qty" data-i="${i}" value="${esc(x.qty)}" placeholder="Aantal"><input data-f="unit" data-i="${i}" value="${esc(x.unit)}" placeholder="Eenheid"><input data-f="ingredient" data-i="${i}" value="${esc(x.ingredient)}" placeholder="Ingrediënt"><button type="button" class="remove-ing" data-remove="${i}" aria-label="Ingrediënt verwijderen">×</button><label class="ingredient-stock-link">Voorraadproduct<select data-stock-product="${i}"><option value="">Niet gekoppeld</option>${options.map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="subrecipe-editor"><button type="button" class="btn link-subrecipe" data-link-subrecipe="${i}">${linked?'Gekoppeld: '+esc(linked.title):'Koppel recept'}</button>${linked?`<button type="button" class="btn unlink-subrecipe" data-unlink-subrecipe="${i}">Ontkoppelen</button>`:''}</div></div>`}).join('')}
function chooseSubrecipe(index){const q=prompt('Zoek een recept om aan dit ingrediënt te koppelen:');if(!q)return;const matches=allRecipes().filter(r=>String(r.id)!==String(edited.id)&&(r.title||'').toLowerCase().includes(q.trim().toLowerCase())).slice(0,12);if(!matches.length){alert('Geen passend recept gevonden.');return}let chosen=matches[0];if(matches.length>1){const answer=prompt('Kies een nummer:\n'+matches.map((r,i)=>`${i+1}. ${r.title}`).join('\n'),'1');const n=Number(answer);if(!Number.isInteger(n)||n<1||n>matches.length)return;chosen=matches[n-1]}edited.ingredients[index].linkedRecipeId=String(chosen.id);showReviewOrEdit()}


function resizeRecipePhoto(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/')){reject(new Error('Kies een afbeelding.'));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Foto kon niet worden gelezen.'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('Foto kon niet worden geopend.'));
      img.onload=()=>{
        const maxW=720,maxH=540,scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',0.72));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function photoEditor(r){
  return `<div class="recipe-photo-editor"><span>Foto</span>${r.photo?`<img class="recipe-photo-preview" src="${esc(r.photo)}" alt="Receptfoto">`:''}<div class="recipe-photo-actions"><button class="btn recipe-photo-pick" id="chooseRecipePhoto" type="button">${r.photo?'Foto vervangen':'Foto toevoegen'}</button><input id="recipePhotoInput" class="recipe-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/*">${r.photo?'<button class="btn" id="removeRecipePhoto" type="button">Foto verwijderen</button>':''}</div><small class="field-help">Kies een foto uit je galerij. De foto wordt automatisch verkleind zodat Huize Chaos snel blijft.</small></div>`;
}
function bindRecipePhotoControls(afterChange){
  const input=detail.querySelector('#recipePhotoInput'),choose=detail.querySelector('#chooseRecipePhoto');
  if(choose&&input)choose.onclick=()=>input.click();
  if(input)input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{edited.photo=await resizeRecipePhoto(file);afterChange?.()}catch(err){alert(err.message||'Foto kon niet worden toegevoegd.')}};
  detail.querySelector('#removeRecipePhoto')?.addEventListener('click',()=>{edited.photo='';afterChange?.()});
}

function editForm(r,review){return `${photoEditor(r)}<div class="review-fields"><label>Titel<input id="titleEdit" value="${esc(r.title||'')}"></label><label>Personen<input id="servingsEdit" type="number" min="1" inputmode="numeric" value="${esc(r.servings||'')}"></label><label>Categorie <small class="field-help">Keuken / smaakrichting</small><select id="categoryEdit">${RECIPE_CATEGORIES.map(c=>`<option value="${esc(c)}" ${recipeCategory(r)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Soort <small class="field-help">Vorm van het gerecht</small><select id="typeEdit">${RECIPE_TYPES.map(c=>`<option value="${esc(c)}" ${recipeType(r)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Hoofdingrediënt<select id="mainIngredientEdit">${MAIN_INGREDIENT_OPTIONS.map(c=>`<option value="${esc(c)}" ${recipeMainIngredient(r)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Tijd thuis<select id="homeTimeEdit"><option value="">Niet ingesteld</option>${HOME_TIME_OPTIONS.map(c=>`<option value="${esc(c)}" ${recipeHomeTime(r)===c?'selected':''}>${esc(c)}</option>`).join('')}</select><small class="field-help">Kort = binnen ±30 min · Middellang = ±30–60 min · Lang = langer</small></label><label class="source-field">Bron<input id="sourceEdit" value="${esc(r.source||'')}" placeholder="Bijv. Picnic, Allerhande, eigen recept"></label><label class="source-field">Bron / URL<input id="sourceUrlEdit" type="url" value="${esc(r.sourceUrl||'')}" placeholder="https://…"></label></div><div class="edit-section open"><button type="button">Ingrediënten <span>▾</span></button><div class="edit-body"><div id="ingredientEditor">${ingredientRows(r)}</div><button type="button" class="btn add-ing" id="addIngredient">+ Ingrediënt</button></div></div><div class="edit-section open"><button type="button">Bereiding <span>▾</span></button><div class="edit-body"><textarea id="directionsEdit">${esc(r.directions||'')}</textarea></div></div><div class="actions review-actions">${review?'<button class="btn primary" id="approve">Goedkeuren</button><button class="btn" id="keepPending">Bewaren voor later</button><button class="btn danger" id="deletePending">Verwijderen</button>':'<button class="btn primary" id="save">Opslaan</button><button class="btn" id="cancel">Annuleren</button><button class="btn danger" id="deleteRecipe">Verwijder recept</button>'}</div>`}
function bindCommonEdit(){detail.querySelector('#titleEdit').oninput=e=>edited.title=e.target.value;detail.querySelector('#servingsEdit').oninput=e=>edited.servings=e.target.value;detail.querySelector('#categoryEdit')?.addEventListener('change',e=>edited.category=e.target.value);detail.querySelector('#typeEdit')?.addEventListener('change',e=>edited.type=e.target.value);detail.querySelector('#mainIngredientEdit')?.addEventListener('change',e=>edited.mainIngredient=e.target.value);detail.querySelector('#homeTimeEdit')?.addEventListener('change',e=>edited.homeTime=e.target.value);detail.querySelector('#sourceEdit')?.addEventListener('input',e=>edited.source=e.target.value);detail.querySelector('#sourceUrlEdit')?.addEventListener('input',e=>edited.sourceUrl=e.target.value);bindRecipePhotoControls(showReviewOrEdit);detail.querySelector('#directionsEdit').oninput=e=>edited.directions=e.target.value;detail.querySelectorAll('.edit-section>button').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));detail.querySelectorAll('input[data-f]').forEach(el=>el.oninput=()=>edited.ingredients[+el.dataset.i][el.dataset.f]=el.value);detail.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{edited.ingredients.splice(+b.dataset.remove,1);showReviewOrEdit()});detail.querySelectorAll('[data-link-subrecipe]').forEach(b=>b.onclick=()=>chooseSubrecipe(+b.dataset.linkSubrecipe));detail.querySelectorAll('[data-unlink-subrecipe]').forEach(b=>b.onclick=()=>{delete edited.ingredients[+b.dataset.unlinkSubrecipe].linkedRecipeId;showReviewOrEdit()});detail.querySelectorAll('[data-stock-product]').forEach(sel=>sel.onchange=()=>{const i=+sel.dataset.stockProduct,ing=edited.ingredients[i];if(!ing)return;ing.stockProductId=sel.value||'';if(sel.value){const all=stockProducts(),prod=all.find(p=>String(p.id)===String(sel.value)),alias=String(ing.ingredient||'').trim();if(prod&&alias){prod.aliases=Array.isArray(prod.aliases)?prod.aliases:[];if(!prod.aliases.some(a=>normFood(a)===normFood(alias))&&normFood(prod.name)!==normFood(alias))prod.aliases.push(alias);localStorage.setItem(STOCK_KEY,JSON.stringify(all));window.dispatchEvent(new Event('huize-chaos-products-changed'))}}});detail.querySelector('#addIngredient').onclick=()=>{edited.ingredients.push({qty:'',unit:'',ingredient:'',memo:'',linkedRecipeId:'',stockProductId:''});showReviewOrEdit()}}
function showReviewOrEdit(){if(String(current).startsWith('pending:'))showReview();else showView('edit')}
function deleteCurrentRecipe(){const id=String(current||edited?.id||''),title=edited?.title||'Dit recept';if(!id||id.startsWith('pending:'))return;if(!confirm(`Weet je zeker dat je \"${title}\" wilt verwijderen?`))return;if(isCustom(id)){write(CUSTOM_KEY,custom().filter(r=>String(r.id)!==id))}else{saveDeletedRecipes([...deletedRecipes(),id]);localStorage.removeItem('hc_recipe_'+id)}write(META_KEY,recipeMeta().filter(m=>String(m.id)!==id));stockRankCache=stockRankCache.filter(x=>String(x.r?.id)!==id);stockResultsReady=Boolean(stockFilterIds.length);scheduleSync();backList(true)}
function bindEdit(){bindCommonEdit();detail.querySelector('#save').onclick=()=>{if(isCustom(current)){const a=custom(),i=a.findIndex(x=>String(x.id)===String(current));a[i]={...edited,imported:true};saveCustom(a)}else{localStorage.setItem('hc_recipe_'+edited.id,JSON.stringify(edited))}invalidateRecipeCaches();stockResultsReady=false;showView('ingredients')};detail.querySelector('#cancel').onclick=()=>{edited=JSON.parse(JSON.stringify(getRecipe(current)));showView('ingredients')};detail.querySelector('#deleteRecipe')?.addEventListener('click',deleteCurrentRecipe)}
function showReview(){detail.innerHTML=`<div class="detail-head"><div><div class="review-label">Te controleren</div><h2>${esc(edited.title||'Gedeeld recept')}</h2><small>${esc(sourceLabel(edited))}</small></div><div class="actions"><button class="btn" id="backList">Terug</button></div></div><div class="review-note">Controleer het recept. Je kunt dit nu doen of later op een ander apparaat.</div>${editForm(edited,true)}`;detail.querySelector('#backList').onclick=()=>{savePendingEdit();backList()};bindCommonEdit();detail.querySelector('#keepPending').onclick=()=>{savePendingEdit();backList()};detail.querySelector('#approve').onclick=approvePending;detail.querySelector('#deletePending').onclick=()=>{const id=String(current).replace('pending:','');savePending(pending().filter(x=>String(x.id)!==id));backList()}}
function savePendingEdit(){const id=String(current).replace('pending:','');const a=pending(),i=a.findIndex(x=>String(x.id)===id);if(i>=0){a[i]={...edited,id};savePending(a)}}
function approvePending(){if(!edited.title.trim()){alert('Vul eerst een titel in.');return}const id=String(current).replace('pending:',''),clean={...edited,id:'import-'+id,title:edited.title.trim(),ingredients:(edited.ingredients||[]).filter(x=>x.ingredient.trim()),status:'approved',imported:true};saveCustom([...custom(),clean]);savePending(pending().filter(x=>String(x.id)!==id));current=clean.id;edited=JSON.parse(JSON.stringify(clean));showView('ingredients')}
function parseIngredient(line){let s=String(line||'').replace(/^[-•*]\s*/,'').trim();const m=s.match(/^(\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])?\s*(g|gr|kg|ml|cl|dl|l|el|tl|eetlepel(?:s)?|theelepel(?:s)?|stuks?|stuk|blik(?:je)?|zak(?:je)?|teen|tenen|snuf(?:je)?)?\s*(.*)$/i);return{qty:(m?.[1]||'').replace(',','.'),unit:(m?.[2]||'').replace(/eetlepels?/i,'el').replace(/theelepels?/i,'tl'),ingredient:(m?.[3]||s).trim(),memo:''}}
function parseSharedText(payload){const raw=[payload.title,payload.text].filter(Boolean).join('\n').replace(/\r/g,'').trim(),url=payload.url||raw.match(/https?:\/\/\S+/)?.[0]||'';const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean).filter(x=>!/^https?:\/\//.test(x));let title=(payload.title||lines[0]||'Gedeeld recept').replace(/https?:\/\/\S+/g,'').trim();let ingStart=lines.findIndex(x=>/^ingred/i.test(x)),dirStart=lines.findIndex(x=>/^(bereiding|bereidingswijze|werkwijze|instructies?)/i.test(x));let ingLines=[],directions='';if(ingStart>=0){const end=dirStart>ingStart?dirStart:lines.length;ingLines=lines.slice(ingStart+1,end)}if(dirStart>=0)directions=lines.slice(dirStart+1).join('\n');else if(lines.length>1&&ingStart<0)directions=lines.slice(1).join('\n');return{id:crypto.randomUUID(),title,servings:'',ingredients:ingLines.map(parseIngredient).filter(x=>x.ingredient),directions,sourceUrl:url,source:sourceFromUrl(url),status:'pending',sharedAt:new Date().toISOString()}}
function sourceFromUrl(url){try{const h=new URL(url).hostname.toLowerCase();if(h.includes('picnic'))return 'Picnic';if(h.includes('ah.nl'))return 'Allerhande';return h.replace(/^www\./,'')}catch(_){return 'Gedeeld'}}
function findRecipeJson(value){if(!value)return null;if(Array.isArray(value)){for(const x of value){const f=findRecipeJson(x);if(f)return f}}else if(typeof value==='object'){const t=value['@type'];if(t==='Recipe'||(Array.isArray(t)&&t.includes('Recipe')))return value;if(value['@graph'])return findRecipeJson(value['@graph'])}return null}
function instructionText(v){if(Array.isArray(v))return v.map(x=>typeof x==='string'?x:(x?.text||x?.name||instructionText(x?.itemListElement))).filter(Boolean).join('\n');if(typeof v==='string')return v;return v?.text||''}
function parseYield(y){const s=Array.isArray(y)?y[0]:y;return String(s||'').match(/\d+/)?.[0]||''}
function recipeImageUrl(image){if(Array.isArray(image))image=image[0];if(typeof image==='string')return image;if(image&&typeof image==='object')return image.url||image.contentUrl||'';return ''}
async function fetchRecipeHtml(url){
  const attempts=[
    ()=>fetch(url,{credentials:'omit'}),
    ()=>fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(url)),
    ()=>fetch('https://corsproxy.io/?url='+encodeURIComponent(url)),
    // Publieke leesweergave als receptsites directe browsertoegang blokkeren (CORS).
    ()=>fetch('https://r.jina.ai/'+url,{headers:{'Accept':'text/plain'}})
  ];
  let lastErr=null;
  for(const attempt of attempts){
    try{const res=await attempt();if(res.ok){const html=await res.text();if(html&&html.length>200)return html}lastErr=new Error('HTTP '+res.status)}catch(err){lastErr=err}
  }
  throw lastErr||new Error('Receptpagina kon niet worden opgehaald');
}
function cleanAhText(s){return String(s||'').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim()}
function recipeFromAhReadableText(text,url,draft={}){
  const raw=String(text||'').replace(/\r/g,'');
  if(!/Ingrediënten/i.test(raw)||!/Aan de slag/i.test(raw))return null;
  const lines=raw.split('\n').map(x=>cleanAhText(x.replace(/^\s*[-*]+\s*/,''))).filter(Boolean);
  let title=draft.title||'';
  const titleIdx=lines.findIndex(x=>/^#{1,2}\s+/.test(x));
  if(titleIdx>=0)title=lines[titleIdx].replace(/^#{1,2}\s+/,'').trim();
  if(!title||title==='Geïmporteerd recept'){
    const candidate=lines.find(x=>x&&!/^Title:|^URL Source:|^Markdown Content:/i.test(x)&&!/^(Ingrediënten|Aan de slag)$/i.test(x));
    if(candidate)title=candidate.replace(/^#+\s*/,'').trim();
  }
  const servings=(raw.match(/Aantal personen\s*:?\s*(\d+)/i)||raw.match(/\(Op basis van\s+(\d+)\s+personen\)/i)||raw.match(/\b(\d+)\s+personen\b/i)||[])[1]||draft.servings||'';
  const ingMatches=[...raw.matchAll(/(?:^|\n)#{1,3}\s*Ingrediënten\s*\n([\s\S]*?)(?=\n#{1,3}\s*(?:Dit heb je nodig|Aan de slag|Voedingswaarden)|$)/gi)];
  const ingBlock=ingMatches.length?ingMatches[ingMatches.length-1][1]:'';
  const ingredients=[];
  if(ingBlock){
    ingBlock.split('\n').map(x=>cleanAhText(x.replace(/^\s*[-*]+\s*/,''))).filter(Boolean).forEach(line=>{
      if(/^\(Op basis van|^Aantal personen|^\[?Input\]?$/i.test(line))return;
      const cleaned=line.replace(/^(?:\[Input\]\s*)+/i,'').replace(/\s+\d+(?:[.,]\d+)?\s*(?:g|gram|ml|cl|dl|l|el|eetlepel|tl|theelepel|stuks?)\s+.*$/i,'').trim();
      const x=parseIngredient(cleaned);if(x.ingredient)ingredients.push(x);
    });
  }
  const dirMatches=[...raw.matchAll(/(?:^|\n)#{1,3}\s*Aan de slag\s*\n([\s\S]*?)(?=\n#{1,3}\s*(?:Ingrediënten|Voedingswaarden)|$)/gi)];
  let directions='';
  if(dirMatches.length){
    const block=dirMatches[dirMatches.length-1][1];
    const steps=block.split('\n').map(x=>cleanAhText(x.replace(/^\s*[-*]+\s*/,''))).filter(Boolean).filter(x=>!/^\d+\.?$/.test(x)&&!/^variatietip|^combinatietip|^vegantip/i.test(x));
    directions=steps.join('\n');
  }
  if(!ingredients.length||!directions)return null;
  return {...draft,title:title||'Geïmporteerd recept',servings,ingredients,directions:stripIngredientAmountsFromDirections(parseBulkDirections(directions),ingredients),sourceUrl:url,source:'Allerhande',category:draft.category||'Overig',type:draft.type||'Anders',mainIngredient:draft.mainIngredient||'Anders',homeTime:draft.homeTime||'',status:'pending',sharedAt:new Date().toISOString()};
}
function recipeFromAhHtml(docu,url,draft={}){
  let title=cleanAhText(docu.querySelector('h1')?.textContent)||draft.title||'Geïmporteerd recept';
  const body=docu.body?.innerText||'';
  const servings=(body.match(/Aantal personen\s*:?\s*(\d+)/i)||body.match(/(\d+)\s+personen/i)||[])[1]||draft.servings||'';
  const headings=[...docu.querySelectorAll('h2,h3')];
  const ingHead=headings.find(h=>/^Ingrediënten$/i.test(cleanAhText(h.textContent)));
  const startHead=headings.find(h=>/^Aan de slag$/i.test(cleanAhText(h.textContent)));
  const ingredients=[];
  if(ingHead){
    let n=ingHead.nextElementSibling;
    while(n && !/^H[23]$/.test(n.tagName)){
      const candidates=[...n.querySelectorAll('li')];
      if(candidates.length)candidates.forEach(li=>{const t=cleanAhText(li.textContent);if(t&&!/^\[?Input\]?$/i.test(t)){const x=parseIngredient(t);if(x.ingredient)ingredients.push(x)}});
      n=n.nextElementSibling;
    }
  }
  // AH renders a second, compact ingredient block. Use text lines if DOM list extraction failed.
  if(!ingredients.length){
    const m=body.match(/Ingrediënten\s*(?:\(Op basis van\s+\d+\s+personen\))?([\s\S]*?)(?:Dit heb je nodig|Aan de slag)/i);
    if(m){m[1].split(/\n+/).map(cleanAhText).filter(Boolean).forEach(t=>{if(!/^(Aantal personen|Kies producten|\d+)$/.test(t)){const x=parseIngredient(t);if(x.ingredient)ingredients.push(x)}})}
  }
  let directions='';
  if(startHead){
    const steps=[];let n=startHead.nextElementSibling;
    while(n && !/^H[23]$/.test(n.tagName)){
      if(n.matches('ol,ul'))[...n.querySelectorAll(':scope > li')].forEach(li=>{const t=cleanAhText(li.textContent).replace(/^\d+\s*/,'');if(t)steps.push(t)});
      else {const t=cleanAhText(n.textContent);if(t&&!/^variatietip/i.test(t))steps.push(t.replace(/^\d+\s*/,''))}
      n=n.nextElementSibling;
    }
    directions=steps.filter((v,i,a)=>v&&a.indexOf(v)===i).join('\n');
  }
  if(!ingredients.length||!directions){const readable=recipeFromAhReadableText(docu.body?.innerText||docu.documentElement?.textContent||'',url,draft);if(readable)return readable;return null}
  return {...draft,title,servings,ingredients,directions:stripIngredientAmountsFromDirections(parseBulkDirections(directions),ingredients),sourceUrl:url,source:'Allerhande',category:draft.category||'Overig',type:draft.type||'Anders',mainIngredient:draft.mainIngredient||'Anders',homeTime:draft.homeTime||'',status:'pending',sharedAt:new Date().toISOString()};
}
function recipeFromHtml(html,url,draft={}){
  const docu=new DOMParser().parseFromString(html,'text/html');
  for(const el of docu.querySelectorAll('script[type="application/ld+json"]')){
    try{
      const recipe=findRecipeJson(JSON.parse(el.textContent));if(!recipe)continue;
      const rawDirections=instructionText(recipe.recipeInstructions)||draft.directions||'';
      const ingredients=(recipe.recipeIngredient||[]).map(parseIngredient).filter(x=>x.ingredient);
      const directions=stripIngredientAmountsFromDirections(parseBulkDirections(rawDirections),ingredients);
      return {...draft,title:recipe.name||draft.title||'Geïmporteerd recept',servings:parseYield(recipe.recipeYield)||draft.servings||'',ingredients,directions,photo:recipeImageUrl(recipe.image)||draft.photo||'',sourceUrl:url,source:sourceFromUrl(url),category:draft.category||'Overig',type:draft.type||'Anders',mainIngredient:draft.mainIngredient||'Anders',homeTime:draft.homeTime||'',status:'pending',sharedAt:new Date().toISOString()};
    }catch(_){ }
  }
  if(/(^|\.)ah\.nl$/i.test((()=>{try{return new URL(url).hostname}catch(_){return ''}})())){const ah=recipeFromAhHtml(docu,url,draft);if(ah)return ah}
  throw new Error('Geen receptgegevens gevonden op deze pagina');
}

function isAllerhandeUrl(url){try{return /(^|\.)ah\.nl$/i.test(new URL(url).hostname)&&/\/allerhande\/recept\/R-R\d+/i.test(new URL(url).pathname)}catch(_){return false}}
function ahRecipeIdFromUrl(url){const m=String(url||'').match(/\/R-R(\d+)/i);return m?Number(m[1]):0}
async function fetchAhRecipeApi(url){
  const id=ahRecipeIdFromUrl(url);if(!id)throw new Error('Geen Allerhande receptnummer gevonden');
  const common={'Accept':'application/json','Content-Type':'application/json','x-client-name':'appie-ios','x-client-version':'9.28','x-application':'AHWEBSHOP'};
  const tokenRes=await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous',{method:'POST',headers:common,body:JSON.stringify({clientId:'appie-ios'}),credentials:'omit'});
  if(!tokenRes.ok)throw new Error('AH anonieme toegang niet beschikbaar ('+tokenRes.status+')');
  const tokenData=await tokenRes.json(),token=tokenData.accessToken||tokenData.access_token;if(!token)throw new Error('AH gaf geen toegangstoken terug');
  const query=`{ recipe(id: ${id}) { id title slug description cookTime prepTime servings ingredients { text quantity name { singular plural } unit { singular plural } } steps { text index } images { rendition { url } } } }`;
  const gqlRes=await fetch('https://api.ah.nl/graphql',{method:'POST',headers:{...common,'Authorization':'Bearer '+token},body:JSON.stringify({query}),credentials:'omit'});
  if(!gqlRes.ok)throw new Error('AH receptservice niet beschikbaar ('+gqlRes.status+')');
  const data=await gqlRes.json();if(data.errors?.length)throw new Error(data.errors[0]?.message||'AH receptservice gaf een fout');
  const r=data.data?.recipe;if(!r)throw new Error('Allerhande recept niet gevonden');return r;
}
function recipeFromAhApi(r,url,draft={}){
  const ingredients=(r.ingredients||[]).map(x=>parseIngredient(x.text||[x.quantity,x.unit?.singular||x.unit?.plural,x.name?.singular||x.name?.plural].filter(Boolean).join(' '))).filter(x=>x.ingredient);
  const directions=(r.steps||[]).slice().sort((a,b)=>Number(a.index||0)-Number(b.index||0)).map(x=>String(x.text||'').trim()).filter(Boolean).join('\n');
  const photo=r.images?.[0]?.rendition?.url||draft.photo||'';
  if(!ingredients.length||!directions)throw new Error('Onvolledige Allerhande receptgegevens');
  return {...draft,title:r.title||draft.title||'Geïmporteerd recept',servings:String(r.servings||draft.servings||''),ingredients,directions:stripIngredientAmountsFromDirections(parseBulkDirections(directions),ingredients),photo,sourceUrl:url,source:'Allerhande',category:draft.category||'Overig',type:draft.type||'Anders',mainIngredient:draft.mainIngredient||'Anders',homeTime:draft.homeTime||'',status:'pending',sharedAt:new Date().toISOString()};
}
async function importRecipeFromUrl(url,base){
  // Allerhande heeft een eigen route. Dit verandert de bestaande Jumbo/HelloFresh/algemene import niet.
  if(isAllerhandeUrl(url)){
    try{return recipeFromAhApi(await fetchAhRecipeApi(url),url,base)}catch(apiErr){
      console.info('Allerhande API-route niet beschikbaar; bestaande HTML-route wordt geprobeerd.',apiErr);
      return recipeFromHtml(await fetchRecipeHtml(url),url,base);
    }
  }
  return recipeFromHtml(await fetchRecipeHtml(url),url,base);
}

async function enrichFromUrl(draft){if(!draft.sourceUrl)return draft;try{return await importRecipeFromUrl(draft.sourceUrl,draft)}catch(err){console.info('Receptlink kon niet worden uitgelezen; bron blijft bij concept.',err);return draft}}
function showRecipeUrlImport(){
  pushRecipeHistory({hcRecipeKind:'new',hcRecipeId:'import-url',hcRecipeReturn:recipeModuleView});
  hideList();
  detail.innerHTML=`<div class="detail-head"><div><h2>Recept importeren</h2><small>Plak een link van bijvoorbeeld Jumbo, HelloFresh of een andere receptsite</small></div><div class="actions"><button class="btn" id="cancelRecipeUrlImport" type="button">Terug</button></div></div><div class="panel recipe-url-import"><label>Receptlink<input id="recipeUrlImportInput" type="url" inputmode="url" autocomplete="off" placeholder="https://…"></label><p class="bulk-help">Huize Chaos probeert naam, foto, personen, ingrediënten en bereidingsstappen automatisch over te nemen. Je controleert alles voordat het wordt opgeslagen.</p><div class="actions"><button class="btn primary" id="fetchRecipeUrl" type="button">Recept ophalen</button></div><div id="recipeUrlImportStatus" class="recipe-url-import-status" aria-live="polite"></div></div>`;
  const input=detail.querySelector('#recipeUrlImportInput'),status=detail.querySelector('#recipeUrlImportStatus'),button=detail.querySelector('#fetchRecipeUrl');
  const cancel=()=>backList();detail.querySelector('#cancelRecipeUrlImport').onclick=cancel;
  const run=async()=>{
    const url=String(input.value||'').trim();
    if(!/^https?:\/\//i.test(url)){status.textContent='Plak eerst een geldige receptlink.';input.focus();return}
    button.disabled=true;button.textContent='Ophalen…';status.textContent='Receptgegevens worden opgehaald.';
    try{
      const id=crypto.randomUUID();
      const base={id,title:'Geïmporteerd recept',servings:'',ingredients:[],directions:'',sourceUrl:url,source:sourceFromUrl(url),photo:'',category:'Overig',type:'Anders',mainIngredient:'Anders',homeTime:'',status:'pending',sharedAt:new Date().toISOString()};
      const draft=await importRecipeFromUrl(url,base);
      savePending([...pending(),draft]);
      current='pending:'+id;edited=JSON.parse(JSON.stringify(draft));displayServings=String(draft.servings||'');
      showReview();
    }catch(err){
      console.warn(err);status.innerHTML='Automatisch uitlezen lukte niet. Je kunt het recept nog steeds via <strong>+ Recept toevoegen</strong> plakken.';
      button.disabled=false;button.textContent='Opnieuw proberen';
    }
  };
  button.onclick=run;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});setTimeout(()=>input.focus(),0);
}
document.querySelector('#importRecipeUrl')?.addEventListener('click',showRecipeUrlImport);
async function takeSharedRecipe(){const url=new URL(location.href);if(!url.searchParams.has('share-target')||!('caches'in window))return null;try{const cache=await caches.open('huize-chaos-shared-content-v1'),key=new URL('__shared-recipe__',url).href,res=await cache.match(key);if(!res)return null;await cache.delete(key);return await res.json()}catch(err){console.warn(err);return null}}
async function receiveSharedRecipe(){const payload=await takeSharedRecipe();if(!payload)return;let draft=parseSharedText(payload);draft=await enrichFromUrl(draft);savePending([...pending(),draft]);history.replaceState({...history.state,hcRecipeScreen:'module',hcRecipeModule:recipeModuleView},'',location.pathname+location.hash);openPending(draft.id)}
search.oninput=()=>{renderList();renderSmartRecipePicker()};renderList();setStatus('Recepten geladen');initCloud();receiveSharedRecipe();

// V1.3.116 - voorraad koppelen aan recepten
const STOCK_KEY='household-products-v2';
const stockRecipeButton=document.querySelector('#stockRecipeButton'),stockPicker=document.querySelector('#stockPicker');
let stockFilterIds=[],stockRankCache=[],stockResultsReady=false;
function stockProducts(){try{return JSON.parse(localStorage.getItem(STOCK_KEY)||'[]')}catch(_){return[]}}
function isFoodProduct(product){
  const category=String(product?.category||'').trim();
  return !/^(Schoonmaak(?:\s*&\s*huishouden)?|Huishouden|Huisdier(?:en)?|Persoonlijke verzorging|Verzorging|Keukenbenodigdheden)$/i.test(category);
}
function relevantStock(){return stockProducts().filter(x=>x.stockRole!=='hidden'&&x.status==='In huis'&&isFoodProduct(x)).sort((a,b)=>String(a.category||'').localeCompare(String(b.category||''),'nl',{sensitivity:'base'})||String(a.name||'').localeCompare(String(b.name||''),'nl',{sensitivity:'base'}))}
function normFood(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\(gv\)/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(blik|blikje|pot|zak|pak|stuks?|verse|vers|diepvries|gekookte|gesneden)\b/g,' ').replace(/\s+/g,' ').trim().replace(/en$/,'')}
const PASTA_TYPES=['spaghetti','macaroni','fusilli','penne','farfalle','rigatoni','tagliatelle','linguine','vermicelli','orzo','noedels','noedel','mie','lasagne'];
function isGlutenFreeProduct(p){const raw=String(p?.name||'')+' '+String(p?.memo||'');return /(?:^|\b)(glutenvrij|gluten[ -]?vrij|gv)(?:\b|$)/i.test(raw)}
function isGlutenSensitiveBread(s){const n=normFood(s);return /(?:^|\b)(naanbrood|naan|stokbrood|wrap|wraps|pita|pitabrood|pitabroodjes|tortilla|tortillas)(?:\b|$)/i.test(n)}
function pastaStockOptions(includeUnavailable=false){return stockProducts().filter(p=>p.stockRole!=='hidden'&&pastaType(p.name)&&(includeUnavailable||p.status==='In huis'))}
function pastaStockOptionsForIngredient(ingredient,includeUnavailable=false){const type=pastaType(ingredient);return pastaStockOptions(includeUnavailable).filter(p=>!type||pastaType(p.name)===type)}
function explicitGlutenFree(s){return /glutenvrij|gluten[ -]?vrij|\bgv\b/i.test(String(s||''))}
function stripGlutenWords(s){return normFood(String(s||'').replace(/glutenvrij|gluten[ -]?vrij|\bgv\b/ig,' '))}
function sensitiveBreadKey(s){
  const n=stripGlutenWords(s),w=n.split(/\s+/);
  if(w.includes('naanbrood')||w.includes('naan'))return 'naan';
  if(w.includes('stokbrood'))return 'stokbrood';
  if(w.includes('wrap')||w.includes('wraps'))return 'wrap';
  if(w.includes('pita')||w.includes('pitabrood')||w.includes('pitabroodjes'))return 'pita';
  if(w.includes('tortilla')||w.includes('tortillas'))return 'tortilla';
  return '';
}
function sensitiveBreadStockOptions(ingredient,includeUnavailable=false){
  const key=sensitiveBreadKey(ingredient);
  if(!key)return [];
  return stockProducts().filter(p=>p.stockRole!=='hidden'&&sensitiveBreadKey(p.name)===key&&(includeUnavailable||p.status==='In huis'));
}

function splitQty(qty,part,total,unit,ingredient){const n=qtyNumber(qty);if(n==null||!total)return qty;return formatScaledNumber(n*part/total,unit,ingredient)}
function isGenericPasta(s){return normFood(s).split(/\s+/).includes('pasta')}
function isPastaIngredient(s){return isGenericPasta(s)||Boolean(pastaType(s))}
function pastaType(s){const words=normFood(s).split(/\s+/);return PASTA_TYPES.find(x=>words.includes(x))||''}
function pastaVariantWords(s){
  const type=pastaType(s);
  return stripGlutenWords(s).split(/\s+/).filter(w=>w&&w!==type&&w!=='pasta'&&!/^(normaal|normale|regulier|reguliere)$/.test(w));
}
function pastaVariantRelation(ingredient,product){
  const it=pastaType(ingredient),pt=pastaType(product?.name);
  if(it&&pt&&it!==pt)return 'none';
  const need=pastaVariantWords(ingredient),have=pastaVariantWords(product?.name);
  if(!need.length&&!have.length)return 'exact';
  if(need.length===have.length&&need.every(w=>have.includes(w)))return 'exact';
  return 'alternative';
}
function stockAvailableAmount(product){
  const qty=qtyNumber(product?.quantity),unit=normalizedUnit(product?.unit);
  if(qty==null)return null;
  if(['g','kg','ml','l','stuks'].includes(unit))return toBaseAmount(qty,unit);
  const size=qtyNumber(product?.packageSize),sizeUnit=normalizedUnit(product?.packageUnit);
  if(size!=null&&sizeUnit){
    const one=toBaseAmount(size,sizeUnit);
    return one?{n:one.n*qty,u:one.u}:null;
  }
  return null;
}
function stockAvailableLabel(product){ return 'aanwezig'; }
function ingredientMatchesProduct(ingredient,product){
  const raw=String(ingredient||'');
  const ingredientIsGf=/glutenvrij|gluten[ -]?vrij|\bgv\b/i.test(raw);
  if(ingredientIsGf&&!isGlutenFreeProduct(product))return false;
  if(isGlutenSensitiveBread(raw)&&!ingredientIsGf&&isGlutenFreeProduct(product))return false;
  const a=normFood(ingredient),b=normFood(product.name);
  const aliases=Array.isArray(product?.aliases)?product.aliases:[];
  if(a&&aliases.some(alias=>normFood(alias)===a))return true;
  if(!a||!b)return false;
  const words=s=>s.split(/\s+/).filter(Boolean);
  const aw=words(a),bw=words(b);
  const subset=(need,have)=>need.length>0&&need.every(w=>have.includes(w));

  // Dressing is te algemeen voor een veilige match. Specifieke smaken moeten overeenkomen.
  const aDressing=aw.some(w=>w.includes('dressing')),bDressing=bw.some(w=>w.includes('dressing'));
  if(aDressing||bDressing){
    if(!(aDressing&&bDressing))return false;
    const stripDressing=list=>list.filter(w=>!w.includes('dressing'));
    const ad=stripDressing(aw),bd=stripDressing(bw);
    if(!ad.length||!bd.length)return false;
    if(!(subset(ad,bd)||subset(bd,ad)))return false;
  }

  const ai=isGenericPasta(a),bi=isGenericPasta(b),at=pastaType(a),bt=pastaType(b);
  if((ai&&!at&&bt)||(bi&&!bt&&at))return true;
  if(at&&bt&&at!==bt)return false;
  const meaningful=w=>w.length>1 && !/^(rood|rode|geel|gele|groen|groene|wit|witte|zwart|zwarte|klein|kleine|groot|grote|heel|halve|half)$/.test(w);
  const aa=aw.filter(meaningful),bb=bw.filter(meaningful);
  return subset(bb,aw)||subset(aa,bw);
}
function recipeStockScore(r,selected,allInHouse){const ingredients=r.ingredients||[];const hits=selected.filter(p=>ingredients.some(i=>ingredientMatchesProduct(i.ingredient,p))).length;const missing=ingredients.filter(i=>!allInHouse.some(p=>ingredientMatchesProduct(i.ingredient,p))).length;return{hits,missing}}
function renderStockResults(){const q=search.value.trim().toLowerCase();const ranked=stockRankCache.filter(x=>(x.r.title||'').toLowerCase().includes(q)).slice(0,150);pendingBox.innerHTML='';list.innerHTML=ranked.length?ranked.map(({r,s})=>`<button class="recipe-card" data-id="${esc(r.id)}"><span><strong>${esc(r.title)}</strong><small>${r.servings?esc(r.servings)+' personen':''}</small><div class="match-label">${s.missing===0?'Alles in huis':s.missing<=1?'Bijna compleet':'Past bij voorraad'} · ${s.hits} gekozen product${s.hits===1?'':'en'}</div></span><span class="go">›</span></button>`).join(''):'<div class="empty">Geen passende recepten gevonden.</div>';list.querySelectorAll('.recipe-card').forEach(b=>b.onclick=()=>openRecipe(b.dataset.id))}
function buildStockRecipeResults(){const selected=relevantStock().filter(x=>stockFilterIds.includes(String(x.id)));if(!selected.length){stockRankCache=[];stockResultsReady=true;renderStockResults();return}const allInHouse=stockProducts().filter(p=>p.stockRole!=='hidden'&&p.status==='In huis');stockRankCache=allRecipes().map(r=>({r,s:recipeStockScore(r,selected,allInHouse)})).filter(x=>x.s.hits>0).sort((a,b)=>b.s.hits-a.s.hits||a.s.missing-b.s.missing);stockResultsReady=true;renderStockResults()}
function renderStockPicker(){const a=relevantStock();stockPicker.innerHTML=`<div class="stock-picker"><h2>Kies uit alle voedingsmiddelen</h2><p>Alle eet- en drinkbare producten die op In huis staan. Kies één of meer producten.</p>${a.length?`<div class="stock-product-search"><input id="stockProductSearch" type="search" placeholder="Zoek voedingsmiddel…" autocomplete="off"></div><div class="actions stock-picker-actions"><button class="btn" id="clearStockSelection">Alles deselecteren</button></div><div class="stock-options">${a.map(x=>`<label class="stock-option" data-stock-name="${esc(`${x.name||''} ${x.category||''}`.toLowerCase())}"><input type="checkbox" data-stock-id="${esc(x.id)}" ${stockFilterIds.includes(String(x.id))?'checked':''}><span>${esc(x.name)} <small>${x.category?esc(x.category):''}</small></span></label>`).join('')}</div><div class="actions"><button class="btn primary" id="findStockRecipes">Passende recepten zoeken</button><button class="btn" id="closeStockPicker">Sluiten</button></div>`:'<div class="empty">Er staan geen voedingsmiddelen op In huis.</div>'}</div>`;stockPicker.querySelector('#closeStockPicker')?.addEventListener('click',()=>stockPicker.innerHTML='');stockPicker.querySelector('#stockProductSearch')?.addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();stockPicker.querySelectorAll('.stock-option').forEach(row=>row.hidden=q&&!String(row.dataset.stockName||'').includes(q))});stockPicker.querySelector('#clearStockSelection')?.addEventListener('click',()=>{stockFilterIds=[];stockRankCache=[];stockResultsReady=false;stockPicker.querySelectorAll('[data-stock-id]').forEach(x=>x.checked=false);renderList()});stockPicker.querySelector('#findStockRecipes')?.addEventListener('click',()=>{stockFilterIds=[...stockPicker.querySelectorAll('[data-stock-id]:checked')].map(x=>x.dataset.stockId);buildStockRecipeResults()})}
stockRecipeButton?.addEventListener('click',renderStockPicker);
const originalRenderList=renderList;
renderList=function(){if(!stockFilterIds.length)return originalRenderList();if(stockResultsReady)return renderStockResults();return originalRenderList()};
search.oninput=()=>{renderList();renderSmartRecipePicker()};
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
    if(!plan){plan=document.createElement('button');plan.className='btn';plan.id='planRecipeWeek';plan.textContent='Toevoegen aan weekmenu';actions.appendChild(plan)}
    plan.onclick=()=>showWeekPlanner(edited);
  }
  let picnic=actions.querySelector('#orderAtPicnic');
  if(!picnic){picnic=document.createElement('button');picnic.className='btn';picnic.id='orderAtPicnic';picnic.textContent='Bestellen bij Picnic';actions.appendChild(picnic)}
  picnic.onclick=()=>showPicnicOrder(edited);
}
function picnicOrderItems(recipe){
  const shown=scaledRecipe(recipe);
  return (shown.ingredients||[]).map((ingredient,index)=>{
    const coverage=stockCoverage(ingredient,ingredient.stockProductId||'',/glutenvrij/i.test(ingredient.ingredient)?'gf':'');
    if(coverage.enough)return null;
    const qty=coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):[ingredient.qty,ingredient.unit].filter(Boolean).join(' ');
    return {index,ingredient:String(ingredient.ingredient||'Ingrediënt').trim(),qty,memo:String(ingredient.memo||'').trim(),coverage};
  }).filter(Boolean)
}
async function copyPicnicText(text,button){
  try{
    await navigator.clipboard.writeText(text);
    if(button){const old=button.textContent;button.textContent='Gekopieerd';setTimeout(()=>button.textContent=old,1200)}
    return true;
  }catch(_){
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();
    if(ok&&button){const old=button.textContent;button.textContent='Gekopieerd';setTimeout(()=>button.textContent=old,1200)}
    return ok;
  }
}
async function addPicnicItemsToShopping(recipe,button){
  const items=picnicOrderItems(recipe);
  if(!items.length){alert('Voor dit recept hoef je volgens je voorraad niets meer te bestellen.');return}
  const products=stockProducts();
  let added=0,already=0;
  for(const item of items){
    const key=normFood(item.ingredient);
    let product=products.find(p=>normFood(p.name)===key||(Array.isArray(p.aliases)&&p.aliases.some(a=>normFood(a)===key)));
    if(!product){
      product={id:Date.now()+added,name:item.ingredient,category:'Overig',quantity:'',unit:'',store:'Picnic',memo:item.memo||'',status:'Niet in huis',shopping:false,done:false,temporary:false,stockRole:'hidden'};
      products.push(product);
    }
    if(product.shopping){already++;continue}
    product.shopping=true;product.done=false;
    if(!product.store||product.store==='Overig')product.store='Picnic';
    if(!product.cloudId)product.cloudId=crypto.randomUUID();
    product.cloudSource=product.temporary?'family':'stock';
    product.cloudAddedBy=user?.uid||product.cloudAddedBy||'';
    product.cloudAddedByName=user?.displayName||product.cloudAddedByName||'Gezinslid';
    product.cloudPending=true;
    added++;
    if(user&&fbDoc&&fbCollection&&fbSetDoc&&db){
      const ref=fbDoc(fbCollection(db,'households','huize-chaos','shoppingItems'),product.cloudId);
      const data={localId:String(product.id),name:String(product.name||''),quantity:String(product.quantity||''),unit:String(product.unit||''),store:String(product.store||''),category:String(product.category||''),memo:String(product.memo||''),done:false,temporary:Boolean(product.temporary),source:product.cloudSource,addedBy:product.cloudAddedBy,addedByName:product.cloudAddedByName,updatedAt:fbServerTimestamp()};
      try{await fbSetDoc(ref,data,{merge:true});product.cloudPending=false}catch(err){console.warn('Boodschap staat lokaal klaar; cloudsynchronisatie volgt later.',err)}
    }
  }
  localStorage.setItem(STOCK_KEY,JSON.stringify(products));
  window.dispatchEvent(new Event('huize-chaos-products-changed'));
  if(button){const old=button.textContent;button.textContent='Toegevoegd aan Bestellen';setTimeout(()=>button.textContent=old,1600)}
  alert(added?`${added} product${added===1?'':'en'} toegevoegd aan Voorraad & Boodschappen → Bestellen.${already?` ${already} stond${already===1?'':'en'} al op de lijst.`:''}`:'Deze producten staan al bij Bestellen.');
}
function showPicnicOrder(recipe){
  const button=detail.querySelector('#orderAtPicnic');
  addPicnicItemsToShopping(recipe,button);
}
const originalShowView=showView;
showView=function(view){originalShowView(view);if(view==='ingredients'&&edited)ensureRecipeActions()};
const OCCASION_KEY='huize-chaos-occasions-v1';
function localOccasions(){try{return JSON.parse(localStorage.getItem(OCCASION_KEY)||'[]')}catch(_){return[]}}
function showOccasionPicker(r){const a=localOccasions();detail.insertAdjacentHTML('beforeend',`<div class="panel occasion-picker"><h3>Toevoegen aan gelegenheid</h3>${a.length?a.map(e=>`<button class="btn occasion-choice" data-occ="${esc(e.id)}">${esc(e.name)} <small>${esc(e.date||'')}</small></button>`).join(''):'<p>Nog geen gelegenheden gevonden. Maak eerst een gelegenheid aan.</p>'}</div>`);detail.querySelectorAll('[data-occ]').forEach(b=>b.onclick=()=>addCurrentRecipeToOccasion(r,b.dataset.occ))}
async function addCurrentRecipeToOccasion(r,id){const a=localOccasions(),e=a.find(x=>String(x.id)===String(id));if(!e)return;e.menu=e.menu||[];const base=Number(r.servings)||Number(e.people)||1,target=Number(e.people)||Number(displayServings)||base,factor=target/base;e.menu.push({type:'Hapje',dish:r.title,recipeId:String(r.id),recipeServings:String(r.servings||''),recipeBaseServings:String(base),servings:String(target),ingredients:(r.ingredients||[]).map(x=>({baseQty:x.qty||'',qty:scaledQty(x.qty||'',factor,x.unit,x.ingredient),unit:x.unit||'',ingredient:x.ingredient||'',memo:x.memo||'',enabled:true}))});localStorage.setItem(OCCASION_KEY,JSON.stringify(a));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));try{if(user)await setDoc(occasionRef,{events:a,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:false})}catch(err){console.warn('Gelegenheid is lokaal bijgewerkt; cloudsynchronisatie volgt via Gelegenheden.',err)}alert('Recept toegevoegd aan '+e.name+'. Je kunt daar het aantal personen en de ingrediënten aanpassen.');showView('ingredients')}



// V1.3.116 - recepten per week plannen (zonder dagen)
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
  const allProducts=stockProducts().filter(p=>p.stockRole!=='hidden');
  const preferredId=String(preferredProductId||ingredient?.stockProductId||'');
  const pasta=isPastaIngredient(ingredient?.ingredient);
  let matches=(pasta?pastaStockOptionsForIngredient(ingredient?.ingredient,true):allProducts.filter(p=>ingredientMatchesProduct(ingredient.ingredient,p))).filter(p=>p.status==='In huis');
  if(glutenMode==='gf')matches=matches.filter(isGlutenFreeProduct);
  if(glutenMode==='regular')matches=matches.filter(p=>!isGlutenFreeProduct(p));
  if(!glutenMode&&pasta){
    if(explicitGlutenFree(ingredient?.ingredient))matches=matches.filter(isGlutenFreeProduct);
    else matches=matches.filter(p=>!isGlutenFreeProduct(p));
  }
  const preferredRaw=preferredId?allProducts.find(p=>String(p.id)===preferredId):null;
  const preferredValid=preferredRaw&&preferredRaw.status==='In huis'
    &&(pasta?pastaVariantRelation(ingredient?.ingredient,preferredRaw)!=='none':ingredientMatchesProduct(ingredient.ingredient,preferredRaw))
    &&(glutenMode!=='gf'||isGlutenFreeProduct(preferredRaw))
    &&(glutenMode!=='regular'||!isGlutenFreeProduct(preferredRaw));
  let product=preferredValid?preferredRaw:null;
  if(!product&&pasta){
    product=matches.find(p=>pastaVariantRelation(ingredient?.ingredient,p)==='exact')||matches[0]||null;
  }else if(!product){
    product=matches.find(p=>String(p.id)===preferredId)||matches[0]||null;
  }
  if(!product)return {matched:false,enough:false,label:'',product:null,shortage:null,matches,available:'',comparable:false,alternative:false};

  // V1.4.77: voorraad is aanwezig/niet aanwezig. De gebruiker controleert de hoeveelheid zelf.
  const comparable=false,available='aanwezig',enough=true,shortage=null;
  const alternative=pasta&&pastaVariantRelation(ingredient?.ingredient,product)==='alternative';
  const prefix=alternative?'Alternatief in huis':'In huis';
  const productName=String(product.name||'').trim();
  const showName=pasta||alternative;
  const label=`${prefix}${showName&&productName?`: ${productName}`:''}`;
  return {matched:true,enough,label,product,shortage,matches,available,comparable,alternative};
}

function pastaSplitRows(i,n,oldRows,gfPersons,totalPersons){
  const prevFor=mode=>(Array.isArray(oldRows)?oldRows.find(x=>String(x.id)===`${n}-${mode}`):oldRows)||{};
  const regularPersons=Math.max(0,totalPersons-gfPersons),rows=[];
  const optionsFor=mode=>pastaStockOptionsForIngredient(i.ingredient,true).filter(p=>mode==='gf'?isGlutenFreeProduct(p):!isGlutenFreeProduct(p));
  if(regularPersons>0){
    const ing={...i,qty:splitQty(i.qty,regularPersons,totalPersons,i.unit,i.ingredient)};
    const cov=stockCoverage(ing,prevFor('regular')?.stockProductId||prevFor('regular')?.regularStockProductId||'','regular');
    rows.push({mode:'regular',label:`Regulier · ${regularPersons} ${regularPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options:optionsFor('regular'),shoppingSelected:prevFor('regular')?.shoppingSelected});
  }
  if(gfPersons>0){
    const ing={...i,qty:splitQty(i.qty,gfPersons,totalPersons,i.unit,i.ingredient)};
    const cov=stockCoverage(ing,prevFor('gf')?.stockProductId||prevFor('gf')?.gfStockProductId||'','gf');
    rows.push({mode:'gf',label:`Glutenvrij · ${gfPersons} ${gfPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options:optionsFor('gf'),shoppingSelected:prevFor('gf')?.shoppingSelected});
  }
  return rows.map(row=>{
    const c=row.coverage,info=c.matched?(c.enough?c.label:`${c.label} · tekort ${[c.shortage?.qty,c.shortage?.unit].filter(Boolean).join(' ')}`):'Niet in huis';
    const checked=row.shoppingSelected!==false&&!c.enough;
    return `<div class="pasta-diet-row"><strong>${esc(row.label)}</strong><span class="order-ingredient-line">${esc([row.ingredient.qty,row.ingredient.unit,row.ingredient.ingredient||'pasta'].filter(Boolean).join(' '))}</span>${row.options.length?`<select class="stock-alternative-select" data-pasta-split-choice="${n}:${row.mode}">${row.options.map(p=>{const rel=pastaVariantRelation(row.ingredient.ingredient,p);return `<option value="${esc(p.id)}" ${String(c.product?.id)===String(p.id)?'selected':''}>${esc(p.name)}${rel==='alternative'?' · alternatief':''} · ${p.status==='In huis'?`In huis: ${esc(stockAvailableLabel(p))}`:'Niet in huis'}</option>`}).join('')}</select>`:`<small class="stock-coverage missing">Geen ${row.mode==='gf'?'glutenvrije':'reguliere'} ${esc(pastaType(i.ingredient)||'pasta')} in voorraadbeheer</small>`}<small class="stock-coverage ${c.enough?'enough':c.matched?'partial':'missing'}">${esc(info)}</small>${!c.enough?`<label class="pasta-shopping-choice"><input type="checkbox" data-pasta-shopping="${n}:${row.mode}" ${checked?'checked':''}> Op boodschappenlijst</label>`:''}</div>`
  }).join('')
}


function breadVariantCoverage(ingredient,options,preferredId=''){
  const candidates=(options||[]).filter(p=>p.status==='In huis');
  const product=candidates.find(p=>preferredId&&String(p.id)===String(preferredId))||candidates[0]||null;
  if(!product)return {matched:false,enough:false,label:'',product:null,shortage:null,matches:options||[],available:'',comparable:false};
  const available='aanwezig';
  return {matched:true,enough:true,label:'In huis',product,shortage:null,matches:options||[],available,comparable:false};
}
function breadSplitRows(i,n,oldRows,gfPersons,totalPersons){
  const prevFor=mode=>(Array.isArray(oldRows)?oldRows.find(x=>String(x.id)===`${n}-bread-${mode}`):null)||{};
  const regularPersons=Math.max(0,totalPersons-gfPersons),rows=[];
  const baseName=String(i.ingredient||'brood');
  if(regularPersons>0){
    const ing={...i,qty:splitQty(i.qty,regularPersons,totalPersons,i.unit,i.ingredient),ingredient:baseName.replace(/glutenvrij|gluten[ -]?vrij|\bgv\b/ig,'').trim()};
    const options=sensitiveBreadStockOptions(baseName,true).filter(p=>!isGlutenFreeProduct(p));
    const cov=breadVariantCoverage(ing,options,prevFor('regular')?.stockProductId||'');
    rows.push({mode:'regular',label:`Glutenvol · ${regularPersons} ${regularPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options,shoppingSelected:prevFor('regular')?.shoppingSelected});
  }
  if(gfPersons>0){
    const gfName=explicitGlutenFree(baseName)?baseName:`glutenvrij ${baseName}`;
    const ing={...i,qty:splitQty(i.qty,gfPersons,totalPersons,i.unit,i.ingredient),ingredient:gfName};
    const options=sensitiveBreadStockOptions(baseName,true).filter(isGlutenFreeProduct);
    const cov=breadVariantCoverage(ing,options,prevFor('gf')?.stockProductId||'');
    rows.push({mode:'gf',label:`Glutenvrij · ${gfPersons} ${gfPersons===1?'persoon':'personen'}`,ingredient:ing,coverage:cov,options,shoppingSelected:prevFor('gf')?.shoppingSelected});
  }
  return rows.map(row=>{
    const c=row.coverage;
    const info=c.matched?(c.enough?c.label:`${c.label}${c.shortage?` · tekort ${[c.shortage.qty,c.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';
    const checked=row.shoppingSelected!==false&&!c.enough;
    return `<div class="pasta-diet-row"><strong>${esc(row.label)}</strong><span class="order-ingredient-line">${esc([row.ingredient.qty,row.ingredient.unit,row.ingredient.ingredient].filter(Boolean).join(' '))}</span>${row.options.length?`<select class="stock-alternative-select" data-bread-split-choice="${n}:${row.mode}">${row.options.map(p=>`<option value="${esc(p.id)}" ${String(c.product?.id)===String(p.id)?'selected':''}>${esc(p.name)} · ${p.status==='In huis'?`In huis: ${esc([p.quantity,p.unit].filter(Boolean).join(' ')||'aanwezig')}`:'Niet in huis'}</option>`).join('')}</select><small class="stock-coverage ${c.enough?'enough':c.matched?'partial':'missing'}">${esc(info)}</small>`:`<small class="stock-coverage missing">Geen ${row.mode==='gf'?'glutenvrije':'glutenvolle'} variant in voorraadbeheer</small>`}${!c.enough?`<label class="pasta-shopping-choice"><input type="checkbox" data-bread-shopping="${n}:${row.mode}" ${checked?'checked':''}> Op boodschappenlijst</label>`:''}</div>`;
  }).join('');
}

function subrecipePreview(linked,parentIndex,checked){if(!linked||!checked)return '';const sub=scaledRecipe(linked,linked.servings);return `<div class="subrecipe-plan-preview"><small>Ingrediënten voor ${esc(linked.title)}</small>${(sub.ingredients||[]).map((si,j)=>{const sc=stockCoverage(si),info=sc.matched?(sc.enough?sc.label:`${sc.label}${sc.shortage?` · tekort ${[sc.shortage.qty,sc.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';return `<label class="subrecipe-plan-row ${sc.enough?'in-stock':''}"><input type="checkbox" data-sub-shopping="${parentIndex}:${j}" ${sc.enough?'disabled':'checked'}><span><span>${esc([si.qty,si.unit,si.ingredient].filter(Boolean).join(' '))}</span><small class="stock-coverage ${sc.enough?'enough':sc.matched?'partial':'missing'}">${esc(info)}</small></span></label>`}).join('')}</div>`} 
function stockCheckWeek(week){return week===isoWeekKey(new Date())||week===upcomingWeekKey()}
function plannerOrderRows(shown,existing,week,gfPersons=1){
  if(!stockCheckWeek(week))return '';
  const old=existing?.ingredients||[],total=Math.max(1,Number(shown.servings)||1);
  return `<div class="recipe-order-box"><h4>Voorraad & besteld</h4><p>Huize Chaos controleert of het product in huis is. De hoeveelheid controleer je zelf. Pasta en broodachtige producten worden automatisch verdeeld: standaard 1 persoon glutenvrij. Een andere pastavariant kan als alternatief uit voorraad worden gekozen.</p><div class="recipe-order-list">${(shown.ingredients||[]).map((i,n)=>{if(isPastaIngredient(i.ingredient)&&!explicitGlutenFree(i.ingredient)){return `<div class="recipe-order-row pasta-split"><span class="pasta-split-wrap"><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Pasta'].filter(Boolean).join(' '))}</span>${pastaSplitRows(i,n,old,gfPersons,total)}</span></div>`}if(isGlutenSensitiveBread(i.ingredient)&&!explicitGlutenFree(i.ingredient)&&gfPersons>0){return `<div class="recipe-order-row pasta-split"><span class="pasta-split-wrap"><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Brood'].filter(Boolean).join(' '))}</span>${breadSplitRows(i,n,old,gfPersons,total)}</span></div>`}const prev=old[n],coverage=stockCoverage(i),disabled=coverage.enough?'disabled':'',info=coverage.matched?(coverage.enough?coverage.label:`${coverage.label} · tekort ${[coverage.shortage?.qty,coverage.shortage?.unit].filter(Boolean).join(' ')}`):'Niet in huis';const linked=linkedRecipeForIngredient(i);return `<label class="recipe-order-row ${coverage.enough?'in-stock':''}"><input type="checkbox" data-plan-ordered="${n}" ${prev?.ordered?'checked':''} ${disabled}><span><span class="order-ingredient-line">${esc([i.qty,i.unit,i.ingredient||'Ingrediënt'].filter(Boolean).join(' '))}</span><small class="stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}">${esc(info)}</small>${linked&&!coverage.enough?`<label class="make-subrecipe-choice"><input type="checkbox" data-make-subrecipe="${n}" ${prev?.makeSubrecipe?'checked':''}> Zelf maken: ${esc(linked.title)}</label>${subrecipePreview(linked,n,Boolean(prev?.makeSubrecipe))}`:''}</span></label>`}).join('')}</div></div>`
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
    orderedBox.querySelectorAll('[data-bread-split-choice]').forEach(choice=>choice.addEventListener('change',()=>{
      const [idx,mode]=String(choice.dataset.breadSplitChoice).split(':'),ingredient=shown.ingredients?.[Number(idx)];if(!ingredient)return;
      const count=mode==='gf'?gfPersons:Math.max(0,(Number(shown.servings)||1)-gfPersons),total=Math.max(1,Number(shown.servings)||1);
      const name=mode==='gf'?(explicitGlutenFree(ingredient.ingredient)?ingredient.ingredient:`glutenvrij ${ingredient.ingredient}`):String(ingredient.ingredient||'').replace(/glutenvrij|gluten[ -]?vrij|\bgv\b/ig,'').trim();
      const ing={...ingredient,ingredient:name,qty:splitQty(ingredient.qty,count,total,ingredient.unit,ingredient.ingredient)};
      const options=sensitiveBreadStockOptions(ingredient.ingredient,true).filter(p=>mode==='gf'?isGlutenFreeProduct(p):!isGlutenFreeProduct(p));
      const coverage=breadVariantCoverage(ing,options,choice.value),row=choice.closest('.pasta-diet-row'),info=row?.querySelector('.stock-coverage'),shopping=row?.querySelector('[data-bread-shopping]');
      if(info){info.textContent=coverage.matched?(coverage.enough?coverage.label:`${coverage.label}${coverage.shortage?` · tekort ${[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' ')}`:''}`):'Niet in huis';info.className=`stock-coverage ${coverage.enough?'enough':coverage.matched?'partial':'missing'}`}
      if(shopping){shopping.closest('.pasta-shopping-choice').style.display=coverage.enough?'none':'flex';if(coverage.enough)shopping.checked=false}
    }));
  };
  select.addEventListener('change',refreshOrdered);gfInput.addEventListener('input',()=>{gfInput.dataset.touched='1';refreshOrdered()});gfInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();gfInput.blur();refreshOrdered()}});refreshOrdered();
  box.querySelector('#saveRecipeWeek').onclick=()=>{const week=select.value,existing=plans.find(x=>String(x.recipeId)===String(r.id)&&x.week===week),old=existing?.ingredients||[],gfPersons=Math.max(0,Math.min(Number(shown.servings)||1,Number(gfInput.value)||0)),total=Math.max(1,Number(shown.servings)||1),planned=[];(shown.ingredients||[]).forEach((i,n)=>{if(isPastaIngredient(i.ingredient)&&!explicitGlutenFree(i.ingredient)){const reg=total-gfPersons;[['regular',reg,i.ingredient||'pasta'],['gf',gfPersons,`glutenvrije ${i.ingredient||'pasta'}`]].forEach(([mode,count,name])=>{if(!count)return;const ing={...i,qty:splitQty(i.qty,count,total,i.unit,i.ingredient)},sel=box.querySelector(`[data-pasta-split-choice=\"${n}:${mode}\"]`),cov=stockCoverage(ing,sel?.value||'',mode);const shoppingSelected=cov.enough?false:Boolean(box.querySelector(`[data-pasta-shopping=\"${n}:${mode}\"]`)?.checked);planned.push({id:`${n}-${mode}`,qty:ing.qty||'',unit:i.unit||'',ingredient:cov.product?.name||name,memo:i.memo||'',done:false,ordered:false,shoppingSelected,stockEnough:Boolean(cov.enough),stockProductId:cov.product?.id??'',stockLabel:cov.matched?cov.label:'',shoppingQty:cov.shortage?[cov.shortage.qty,cov.shortage.unit].filter(Boolean).join(' '):'',store:cov.product?.store||'',category:cov.product?.category||''})});return}if(isGlutenSensitiveBread(i.ingredient)&&!explicitGlutenFree(i.ingredient)&&gfPersons>0){const reg=total-gfPersons;[['regular',reg],['gf',gfPersons]].forEach(([mode,count])=>{if(!count)return;const name=mode==='gf'?`glutenvrij ${i.ingredient}`:i.ingredient,ing={...i,ingredient:name,qty:splitQty(i.qty,count,total,i.unit,i.ingredient)},sel=box.querySelector(`[data-bread-split-choice=\"${n}:${mode}\"]`),options=sensitiveBreadStockOptions(i.ingredient,true).filter(p=>mode==='gf'?isGlutenFreeProduct(p):!isGlutenFreeProduct(p)),cov=breadVariantCoverage(ing,options,sel?.value||''),shoppingSelected=cov.enough?false:Boolean(box.querySelector(`[data-bread-shopping=\"${n}:${mode}\"]`)?.checked);planned.push({id:`${n}-bread-${mode}`,qty:ing.qty||'',unit:i.unit||'',ingredient:cov.product?.name||name,memo:i.memo||'',done:false,ordered:false,shoppingSelected,stockEnough:Boolean(cov.enough),stockProductId:cov.product?.id??'',stockLabel:cov.matched?cov.label:'',shoppingQty:cov.enough?'':(cov.shortage?[cov.shortage.qty,cov.shortage.unit].filter(Boolean).join(' '):[ing.qty,ing.unit].filter(Boolean).join(' ')),store:cov.product?.store||'',category:cov.product?.category||''})});return}const coverage=stockCoverage(i),ordered=stockCheckWeek(week)?Boolean(box.querySelector(`[data-plan-ordered=\"${n}\"]`)?.checked):false,makeSubrecipe=Boolean(box.querySelector(`[data-make-subrecipe=\"${n}\"]`)?.checked),linked=linkedRecipeForIngredient(i);if(makeSubrecipe&&linked){const sub=scaledRecipe(linked,linked.servings);(sub.ingredients||[]).forEach((si,j)=>{const sc=stockCoverage(si),subShopping=box.querySelector(`[data-sub-shopping=\"${n}:${j}\"]`);if(!sc.enough&&subShopping&&!subShopping.checked)return;const oldSub=old.find(x=>String(x.id)===`${n}-sub-${j}`)||{};planned.push({id:`${n}-sub-${j}`,qty:si.qty||'',unit:si.unit||'',ingredient:si.ingredient||'',memo:`Voor zelfgemaakte ${i.ingredient||'component'}${si.memo?' · '+si.memo:''}`,done:false,ordered:false,shoppingSelected:oldSub.shoppingSelected,shoppingRemovedAt:oldSub.shoppingRemovedAt,makeSubrecipe:true,parentIngredient:i.ingredient||'',subRecipeId:String(linked.id),stockEnough:Boolean(sc.enough),stockProductId:sc.product?.id??'',stockLabel:sc.matched?sc.label:'',shoppingQty:sc.shortage?[sc.shortage.qty,sc.shortage.unit].filter(Boolean).join(' '):'',store:sc.product?.store||'',category:sc.product?.category||''})})}else planned.push({id:String(n),qty:i.qty||'',unit:i.unit||'',ingredient:i.ingredient||'',memo:i.memo||'',done:old[n]?.done||false,ordered,shoppingSelected:old[n]?.shoppingSelected,shoppingRemovedAt:old[n]?.shoppingRemovedAt,makeSubrecipe:false,linkedRecipeId:i.linkedRecipeId||'',stockEnough:Boolean(coverage.enough),stockProductId:coverage.product?.id??'',stockLabel:coverage.matched?coverage.label:'',shoppingQty:coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):'',store:coverage.product?.store||'',category:coverage.product?.category||''})});const plan={id:existing?.id||String(Date.now()),recipeId:String(r.id),title:r.title,week,servings:shown.servings||r.servings||'',gfPersons,ingredients:planned};if(existing)Object.assign(existing,plan);else plans.push(plan);saveRecipeWeekPlans(plans,existing||plan);alert(`${r.title} staat gepland voor week ${Number(week.slice(-2))}.`);box.remove()}
}
const _showViewWeek=showView;showView=function(view){_showViewWeek(view);if(view==='ingredients'&&edited)ensureRecipeActions()};

// V1.3.116 - Weekmenu-overzicht: recepten per week bekijken, verplaatsen en verwijderen
const weekMenuPanel=document.querySelector('#weekMenuPanel');
const recipeLibraryPanel=document.querySelector('#recipeLibraryPanel');
const showWeekMenuButton=document.querySelector('#showWeekMenu');
const showRecipesButton=document.querySelector('#showRecipes');
const weekMenuList=document.querySelector('#weekMenuList');
const weekMenuTitle=document.querySelector('#weekMenuTitle');
const expandedWeekPlans=new Set();
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
function saveRecipeWeekPlans(plans,changedPlan=null){if(changedPlan)changedPlan.changedAt=Date.now();localStorage.setItem(RECIPE_WEEK_KEY,JSON.stringify(plans));window.dispatchEvent(new Event('huize-chaos-recipe-weeks-changed'));scheduleSync()}

function weekDateKeys(key){const monday=weekMondayFromKey(key),out=[];for(let i=0;i<7;i++){const d=new Date(monday);d.setUTCDate(monday.getUTCDate()+i);out.push(d.toISOString().slice(0,10))}return out}
function plannerEntries(){try{const x=JSON.parse(localStorage.getItem('huizeChaosPlannerV130')||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function lateShiftsForWeek(key){const dates=new Set(weekDateKeys(key));return plannerEntries().filter(x=>x.category==='work'&&dates.has(x.date)&&(/avond/i.test(x.title||'')||Number(String(x.time||'').slice(0,2))>=14)).sort((a,b)=>a.date.localeCompare(b.date))}
function mealType(title=''){const t=String(title).toLowerCase();if(/friet|patat|pizza|salade|kant.?en.?klaar|snack/.test(t))return 'Snel';if(/wrap|taco|naan|tex.?mex|mexica|tortilla|nacho/.test(t))return 'Tex-Mex';if(/soep|brood/.test(t))return 'Soep/brood';if(/aardappel|stamppot|ovenschotel/.test(t))return 'Aardappel/oven';if(/pasta|spaghetti|macaroni|lasagne|rijst|noedel|mie|bami|nasi/.test(t))return 'Pasta/rijst';return 'Overig'}
function hutselOpenItems(){try{const x=JSON.parse(localStorage.getItem('household-hutsel-v1')||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function suggestionRecipes(plans,lates){
  const all=allRecipes(),history=recipeWeekPlans(),counts=new Map(),last=new Map();
  history.forEach(p=>{const id=String(p.recipeId||'');counts.set(id,(counts.get(id)||0)+1);const wk=weekMondayFromKey(p.week||'');const ts=wk.getTime();if(!last.has(id)||ts>last.get(id))last.set(id,ts)});
  const selected=new Set(plans.map(p=>String(p.recipeId))),available=[...all].filter(r=>!selected.has(String(r.id))),now=weekMondayFromKey(selectedMenuWeek).getTime();
  const frequent=[...available].filter(r=>(counts.get(String(r.id))||0)>0).sort((a,b)=>(counts.get(String(b.id))||0)-(counts.get(String(a.id))||0)||variationScore(b,plans).score-variationScore(a,plans).score).slice(0,4);
  const old=[...available].filter(r=>{const ts=last.get(String(r.id));return ts&&now-ts>=6*7*86400000}).sort((a,b)=>(last.get(String(a.id))||0)-(last.get(String(b.id))||0)).slice(0,4);
  let fit=[...available].map(r=>({r,v:variationScore(r,plans),quick:/friet|pizza|wrap|soep|salade|snel|makkelijk|eenpans|naan/i.test(`${r.title||''} ${recipeType(r)}`)}));
  fit.sort((a,b)=>{const lateBonusA=lates.length>=2&&a.quick?2:0,lateBonusB=lates.length>=2&&b.quick?2:0;return (b.v.score+lateBonusB)-(a.v.score+lateBonusA)||String(a.r.title).localeCompare(String(b.r.title),'nl')});
  return {frequent,old,fit:fit.slice(0,6).map(x=>x.r)}
}
function quickAddRecipeToWeek(r){
  if(!r)return;const plans=recipeWeekPlans();if(plans.some(p=>p.week===selectedMenuWeek&&String(p.recipeId)===String(r.id)))return;
  const servings=String(Math.max(1,Number(r.servings)||4)),shown=scaledRecipe(r,servings),gfPersons=Math.min(1,Number(servings)||1);
  const planned=(shown.ingredients||[]).map((i,n)=>{const coverage=stockCoverage(i,i.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');return {id:String(n),qty:i.qty||'',unit:i.unit||'',ingredient:i.ingredient||'',memo:i.memo||'',done:false,ordered:false,stockEnough:Boolean(coverage.enough),stockProductId:coverage.product?.id??'',stockLabel:coverage.matched?coverage.label:'',shoppingQty:coverage.enough?'':(coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):[i.qty,i.unit].filter(Boolean).join(' ')),store:coverage.product?.store||'',category:coverage.product?.category||''}});
  const plan={id:String(Date.now()),recipeId:String(r.id),title:r.title,week:selectedMenuWeek,servings,gfPersons,ingredients:planned};plans.push(plan);saveRecipeWeekPlans(plans,plan);renderWeekMenu();
}
function renderWeekContext(plans){
  const box=document.querySelector('#weekMenuContext');if(!box)return;
  const lates=lateShiftsForWeek(selectedMenuWeek),hutsel=hutselOpenItems(),types={};
  plans.forEach(p=>{const r=getRecipe(p.recipeId)||p,k=mealType(r.title);types[k]=(types[k]||0)+1});
  const dayFmt=d=>new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
  const summary=Object.entries(types).map(([k,v])=>`${k} ${v}`).join(' · ')||'Nog geen vrije maaltijden gekozen',sug=suggestionRecipes(plans,lates);
  const group=(title,arr)=>arr.length?`<div class="meal-suggestion-group"><strong>${title}</strong>${arr.map(r=>{const v=variationScore(r,plans);return `<button type="button" data-suggest-recipe="${esc(r.id)}"><span>${esc(r.title)}</span><small>${esc(v.type)} · ${esc(v.mainIngredient)}</small></button>`}).join('')}</div>`:'';
  box.innerHTML=`<div class="week-fixed-meals"><strong>Vaste maaltijden</strong><span>Woensdag · friet met snacks</span><span>Zaterdag · soep met broodjes</span></div><details class="week-work-info"><summary>${lates.length} late ${lates.length===1?'dienst':'diensten'} deze week</summary>${lates.length?`<span>${lates.map(x=>dayFmt(x.date)).join(' · ')}</span>`:'<span>Geen late diensten in je werkrooster.</span>'}</details><div class="week-variation"><strong>Variatie</strong><span>${esc(summary)}</span></div>${hutsel.length?`<div class="week-hutsel"><strong>Hutsel Frutsel · ${hutsel.length} ${hutsel.length===1?'restje':'restjes'} opmaken</strong><span>Je kunt daardoor eventueel één maaltijd minder plannen.</span></div>`:''}<div class="week-menu-tools"><button class="btn primary week-add-recipe" id="weekAddRecipe" type="button">+ Recept kiezen</button><button class="btn week-print-button" id="weekPrintButton" type="button">Print weekoverzicht</button></div><div class="week-quick-picker hidden" id="weekQuickPicker"><div class="week-quick-title"><strong>Kies je volgende maaltijd</strong><small>De suggesties passen zich na iedere keuze opnieuw aan.</small></div>${group('Past bij deze week',sug.fit)}${group('Al even niet gegeten',sug.old)}${group('Vaak gegeten',sug.frequent)}<div class="week-quick-actions"><button class="btn" id="weekAllRecipes" type="button">Alle recepten bekijken</button></div></div>`;
  const picker=box.querySelector('#weekQuickPicker'),toggle=box.querySelector('#weekAddRecipe');
  box.querySelector('#weekPrintButton')?.addEventListener('click',()=>printWeekOverview());
  toggle?.addEventListener('click',()=>{picker?.classList.toggle('hidden');toggle.textContent=picker?.classList.contains('hidden')?'+ Recept kiezen':'Keuze sluiten'});
  box.querySelector('#weekAllRecipes')?.addEventListener('click',()=>showRecipeModule('recipes'));
  box.querySelectorAll('[data-suggest-recipe]').forEach(b=>b.addEventListener('click',()=>{const r=getRecipe(b.dataset.suggestRecipe);if(!r)return;quickAddRecipeToWeek(r);requestAnimationFrame(()=>{const p=document.querySelector('#weekQuickPicker'),t=document.querySelector('#weekAddRecipe');p?.classList.remove('hidden');if(t)t.textContent='Keuze sluiten'})}))
}


function printWeekOverview(){
  const plans=recipeWeekPlans().filter(p=>p.week===selectedMenuWeek);
  if(!plans.length){alert('Er staan nog geen recepten in deze week.');return}
  document.querySelector('#weekPrintSheet')?.remove();
  const sheet=document.createElement('section');sheet.id='weekPrintSheet';sheet.className='week-print-sheet';
  sheet.innerHTML=`<header><h1>${esc(weekNumberLabel(selectedMenuWeek))}</h1><p>${plans.length} ${plans.length===1?'recept':'recepten'}</p></header><ol>${plans.map(p=>`<li><strong>${esc(p.title||'Recept')}</strong>${p.servings?`<span>${esc(p.servings)} personen</span>`:''}</li>`).join('')}</ol>`;
  document.body.appendChild(sheet);
  const clean=()=>sheet.remove();
  window.addEventListener('afterprint',clean,{once:true});
  requestAnimationFrame(()=>window.print());
  setTimeout(()=>{if(document.body.contains(sheet))clean()},30000);
}

function recipeCategory(r){
  const saved=String(r?.category||'').trim();if(RECIPE_CATEGORIES.includes(saved))return saved;
  const t=`${r.title||''} ${(r.ingredients||[]).map(i=>i.ingredient||'').join(' ')} ${r.directions||''}`.toLowerCase();
  if(/gyros|tzatziki|feta|orzo|mediter|grieks/.test(t))return 'Grieks / Mediterraan';
  if(/thai|teriyaki|nasi|bami|soja|sambal|wok|saté|sate|curry|kokosmelk|aziat/.test(t))return 'Aziatisch';
  if(/taco|tortilla|burrito|nacho|enchilada|tex.?mex|mexica/.test(t))return 'Mexicaans / Tex-Mex';
  if(/pasta|spaghetti|lasagne|tagliatelle|penne|risotto|pizza|italia/.test(t))return 'Italiaans';
  if(/shoarma|falafel|harissa|lahmacun|midden.?oost/.test(t))return 'Midden-Oosters';
  if(/burger|hotdog|bbq|barbecue|amerika/.test(t))return 'Amerikaans';
  if(/stamppot|andijvie|boerenkool|hutspot|hollands|nederlands/.test(t))return 'Nederlands';
  return 'Overig'
}
function recipeType(r){
  const saved=String(r?.type||'').trim();if(RECIPE_TYPES.includes(saved))return saved;
  const t=`${r.title||''} ${(r.ingredients||[]).map(i=>i.ingredient||'').join(' ')}`.toLowerCase();
  if(/bowl/.test(t))return 'Bowl';
  if(/wrap|tortilla|burrito|taco|lahmacun/.test(t))return 'Wrap / tortilla';
  if(/stamppot/.test(t))return 'Stamppot';
  if(/soep/.test(t))return 'Soep';
  if(/salade/.test(t))return 'Salade';
  if(/pizza|flammkuchen|plaat/.test(t))return 'Pizza / plaatgerecht';
  if(/oven|ovenschotel|schotel|lasagne/.test(t))return 'Ovenschotel';
  if(/pasta|spaghetti|macaroni|tagliatelle|penne|orzo|noedel/.test(t))return 'Pastagerecht';
  if(/rijst|nasi|risotto/.test(t))return 'Rijstgerecht';
  if(/aardappel|krielt|puree/.test(t))return 'Aardappelgerecht';
  if(/brood|naan|pita|baguette/.test(t))return 'Broodgerecht';
  if(/eenpans|one.?pot/.test(t))return 'Eenpansgerecht';
  return 'Anders'
}
function recipeMainIngredient(r){
  const saved=String(r?.mainIngredient||'').trim();if(MAIN_INGREDIENT_OPTIONS.includes(saved))return saved;
  const t=`${r.title||''} ${(r.ingredients||[]).map(i=>i.ingredient||'').join(' ')}`.toLowerCase();
  if(/kip|kalkoen/.test(t))return 'Kip';if(/rund|runder|biefstuk|hamburger/.test(t))return 'Rund';if(/varken|ham|spek|pancetta|worst|salami/.test(t))return 'Varken';if(/zalm|tonijn|kabeljauw|vis|garnal|scampi/.test(t))return 'Vis';if(/tofu|tempeh|linzen|kikkererwt|vegetar|vega/.test(t))return 'Vegetarisch';return 'Anders'
}
function recipeHomeTime(r){const saved=String(r?.homeTime||'').trim();return HOME_TIME_OPTIONS.includes(saved)?saved:''}
function variationScore(r,plans){const cats=new Map(),types=new Map(),mains=new Map();(plans||[]).forEach(p=>{const pr=getRecipe(p.recipeId)||p,c=recipeCategory(pr),typ=recipeType(pr),main=recipeMainIngredient(pr);cats.set(c,(cats.get(c)||0)+1);types.set(typ,(types.get(typ)||0)+1);mains.set(main,(mains.get(main)||0)+1)});const c=recipeCategory(r),typ=recipeType(r),main=recipeMainIngredient(r);let score=8-(cats.get(c)||0)*1.5-(types.get(typ)||0)*2-(mains.get(main)||0)*2;if(c==='Overig')score-=.5;if(typ==='Anders')score-=.25;if(main==='Anders')score-=.25;return {score,category:c,type:typ,mainIngredient:main}}
function lateMealMode(r){const d=String(r.directions||'').toLowerCase(),t=String(r.title||'').toLowerCase();if(/lasagne|ovenschotel|stamppot|nasi|bami|chili|curry|stoof|soep/.test(t)||/opwarmen|verwarm.*opnieuw|bewaren.*koelkast/.test(d))return 'Opwarmen';if(/oven|ovenschaal/.test(d)&&/verwarm de oven|bak.*oven|zet.*oven/.test(d))return 'Afmaken';return 'Vers maken'}
function recipeStockFit(r,inhouse=null){const key=String(r.id);if(stockFitCache.has(key))return stockFitCache.get(key);const stock=inhouse||stockProducts().filter(p=>p.status==='In huis'&&isFoodProduct(p));let need=0,have=0;(r.ingredients||[]).forEach(i=>{const name=String(i.ingredient||'').toLowerCase();if(!name||/water|zout|peper|olie|boter|kruid|specer|bouillon/.test(name))return;need++;if(stock.some(p=>ingredientMatchesProduct(i,p)))have++});const result={need,have,missing:Math.max(0,need-have),ratio:need?have/need:0};stockFitCache.set(key,result);return result}
let smartRecipeCategory='Alles',smartRecipeType='Alles',smartRecipeMain='Alles';
function stockIngredientMatches(r){
  if(!stockIngredientQuery)return false;
  const known=stockProducts().find(p=>String(p.id)===stockIngredientProductId);
  const pseudo=known||{name:stockIngredientQuery,aliases:[]};

  // Bij een specifieke pastasoort alleen recepten tonen die dezelfde soort gebruiken.
  // Een generieke ingrediëntregel "pasta" mag nog wel, behalve wanneer titel of andere
  // ingrediënten duidelijk een andere pastasoort noemen (bijv. spaghetti bij orzo).
  const selectedPastaType=pastaType(pseudo.name)||pastaType(stockIngredientQuery);
  if(selectedPastaType){
    const recipeText=[r.title||'',...(r.ingredients||[]).map(i=>i.ingredient||'')].join(' ');
    const recipeTypes=new Set(normFood(recipeText).split(/\s+/).filter(w=>PASTA_TYPES.includes(w)));
    if([...recipeTypes].some(type=>type!==selectedPastaType))return false;
  }

  return (r.ingredients||[]).some(i=>ingredientMatchesProduct(i.ingredient,pseudo));
}
function renderStockIngredientSuggestions(box){
  const plans=recipeWeekPlans().filter(p=>p.week===selectedMenuWeek);
  const inhouse=stockProducts().filter(p=>p.stockRole!=='hidden'&&p.status==='In huis'&&isFoodProduct(p));
  const matches=allRecipes().filter(stockIngredientMatches).map(r=>({r,f:recipeStockFit(r,inhouse),v:variationScore(r,plans)})).sort((a,b)=>b.f.ratio-a.f.ratio||a.f.missing-b.f.missing||b.v.score-a.v.score||String(a.r.title).localeCompare(String(b.r.title),'nl'));
  const visible=matches.slice(0,24);
  const onlineUrl=`https://www.google.com/search?q=${encodeURIComponent('recept met '+stockIngredientQuery)}`;
  box.innerHTML=`<div class="stock-ingredient-suggestions"><button class="stock-suggestion-back" id="stockSuggestionBack" type="button">‹ Alle recepten</button><div class="stock-suggestion-head"><strong>Wat kan ik maken met ${esc(stockIngredientQuery)}?</strong><small>Eerst je eigen recepten. Recepten die ook goed bij je voorraad en week passen staan hoger.</small></div><div class="smart-category-results">${visible.length?visible.map(({r,f,v})=>`<button class="smart-recipe ${r.photo?'has-photo':''}" type="button" data-smart-recipe="${esc(r.id)}">${r.photo?`<img class="smart-recipe-photo" src="${esc(r.photo)}" alt="">`:''}<span>${esc(r.title)}</span><small>${f.missing===0?'Alles in huis':f.missing===1?'Nog 1 product nodig':`${f.missing} producten nodig`} · ${esc(v.category)} · ${esc(v.protein)}</small></button>`).join(''):'<div class="empty">In je eigen recepten staat nog niets dat goed bij dit product past.</div>'}</div>${matches.length>24?`<small class="stock-more-note">Er zijn nog ${matches.length-24} andere eigen recepten gevonden. Gebruik Zoeken als je een specifiek recept zoekt.</small>`:''}<div class="stock-online-step"><span>Geen passende eigen suggestie?</span><a href="${onlineUrl}" target="_blank" rel="noopener">Online zoeken</a></div></div>`;
  box.querySelectorAll('[data-smart-recipe]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.smartRecipe));
  box.querySelector('#stockSuggestionBack')?.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.delete('ingredient');u.searchParams.delete('stockProductId');history.replaceState(history.state,'',u);location.reload()});
}
function renderSmartRecipePicker(){
  const box=document.querySelector('#smartRecipePicker');if(!box||recipeLibraryPanel?.classList.contains('hidden'))return;
  if(stockIngredientQuery){renderStockIngredientSuggestions(box);return}
  if(search.value.trim()){box.innerHTML='';return}
  const plans=recipeWeekPlans().filter(p=>p.week===selectedMenuWeek),selected=new Set(plans.map(p=>String(p.recipeId))),all=allRecipes().filter(r=>!selected.has(String(r.id))),history=recipeWeekPlans(),counts=new Map();
  history.forEach(p=>{const id=String(p.recipeId||'');counts.set(id,(counts.get(id)||0)+1)});
  const cats=['Alles',...RECIPE_CATEGORIES];
  let rows=[...all],labelFor=()=>'';
  if(smartRecipeMode==='stock'){
    const inhouse=stockProducts().filter(p=>p.stockRole!=='hidden'&&p.status==='In huis'&&isFoodProduct(p));
    rows=rows.map(r=>({r,f:recipeStockFit(r,inhouse)})).filter(x=>x.f.need>=2&&x.f.ratio>=.45).sort((a,b)=>b.f.ratio-a.f.ratio||a.f.missing-b.f.missing).map(x=>x.r);
    labelFor=r=>{const f=recipeStockFit(r,inhouse);return f.missing===0?'Alles in huis':`${f.missing} ${f.missing===1?'product':'producten'} nodig`}
  }else if(smartRecipeMode==='variation'){
    rows=rows.map(r=>({r,v:variationScore(r,plans)})).sort((a,b)=>b.v.score-a.v.score||String(a.r.title).localeCompare(String(b.r.title),'nl')).map(x=>x.r);
    labelFor=r=>{const v=variationScore(r,plans);return `Meer afwisseling · ${v.category} · ${v.mainIngredient}`}
  }else if(smartRecipeMode==='frequent'){
    rows=rows.filter(r=>(counts.get(String(r.id))||0)>0).sort((a,b)=>(counts.get(String(b.id))||0)-(counts.get(String(a.id))||0));
    labelFor=r=>`${counts.get(String(r.id))||0}× eerder gepland`
  }else{
    rows.sort((a,b)=>Number(metaFor(b.id).favorite)-Number(metaFor(a.id).favorite)||String(a.title).localeCompare(String(b.title),'nl'));
    labelFor=r=>[recipeCategory(r),recipeType(r),recipeMainIngredient(r),recipeHomeTime(r),r.servings?r.servings+' personen':''].filter(Boolean).join(' · ')
  }
  if(smartRecipeCategory!=='Alles')rows=rows.filter(r=>recipeCategory(r)===smartRecipeCategory);
  if(smartRecipeType!=='Alles')rows=rows.filter(r=>recipeType(r)===smartRecipeType);
  if(smartRecipeMain!=='Alles')rows=rows.filter(r=>recipeMainIngredient(r)===smartRecipeMain);
  if(smartRecipeTime!=='Alles')rows=rows.filter(r=>recipeHomeTime(r)===smartRecipeTime);
  const visible=rows.slice(0,smartRecipeLimit);
  const button=r=>`<button class="smart-recipe ${r.photo?'has-photo':''}" type="button" data-smart-recipe="${esc(r.id)}">${r.photo?`<img class="smart-recipe-photo" src="${esc(r.photo)}" alt="">`:''}<span>${metaFor(r.id).favorite?'★ ':''}${esc(r.title)}</span><small>${esc(labelFor(r))}</small></button>`;
  box.innerHTML=`<div class="smart-picker calm"><div class="smart-picker-title"><strong>Recept kiezen</strong><small>Tik op een recept om het eerst te bekijken.</small></div><div class="smart-modes"><button type="button" data-smart-mode="all" class="${smartRecipeMode==='all'?'active':''}">Alles</button><button type="button" data-smart-mode="stock" class="${smartRecipeMode==='stock'?'active':''}">Past bij voorraad</button><button type="button" data-smart-mode="variation" class="${smartRecipeMode==='variation'?'active':''}">Variatie</button><button type="button" data-smart-mode="frequent" class="${smartRecipeMode==='frequent'?'active':''}">Vaak gegeten</button></div><div class="smart-filter-block"><span>Categorie</span><div class="smart-categories">${cats.map(c=>`<button type="button" data-smart-cat="${esc(c)}" class="${smartRecipeCategory===c?'active':''}">${esc(c)}</button>`).join('')}</div></div><div class="smart-filter-block"><span>Soort</span><div class="smart-times">${['Alles',...RECIPE_TYPES].map(t=>`<button type="button" data-smart-type="${esc(t)}" class="${smartRecipeType===t?'active':''}">${esc(t)}</button>`).join('')}</div></div><div class="smart-filter-block"><span>Hoofdingrediënt</span><div class="smart-times">${['Alles',...MAIN_INGREDIENT_OPTIONS].map(t=>`<button type="button" data-smart-main="${esc(t)}" class="${smartRecipeMain===t?'active':''}">${esc(t)}</button>`).join('')}</div></div><div class="smart-time-row"><span>Tijd thuis</span><div class="smart-times">${['Alles',...HOME_TIME_OPTIONS].map(t=>`<button type="button" data-smart-time="${esc(t)}" class="${smartRecipeTime===t?'active':''}">${esc(t)}</button>`).join('')}</div></div><div class="smart-category-results">${visible.length?visible.map(button).join(''):'<div class="empty">Geen recepten binnen deze keuze.</div>'}</div>${rows.length>visible.length?`<button class="btn smart-more" id="smartMore" type="button">Meer recepten tonen</button>`:''}</div>`;
  box.querySelectorAll('[data-smart-recipe]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.smartRecipe));
  box.querySelectorAll('[data-smart-mode]').forEach(b=>b.onclick=()=>{smartRecipeMode=b.dataset.smartMode;smartRecipeLimit=24;renderSmartRecipePicker()});
  box.querySelectorAll('[data-smart-cat]').forEach(b=>b.onclick=()=>{smartRecipeCategory=b.dataset.smartCat;smartRecipeLimit=24;renderSmartRecipePicker()});
  box.querySelectorAll('[data-smart-type]').forEach(b=>b.onclick=()=>{smartRecipeType=b.dataset.smartType;smartRecipeLimit=24;renderSmartRecipePicker()});
  box.querySelectorAll('[data-smart-main]').forEach(b=>b.onclick=()=>{smartRecipeMain=b.dataset.smartMain;smartRecipeLimit=24;renderSmartRecipePicker()});
  box.querySelectorAll('[data-smart-time]').forEach(b=>b.onclick=()=>{smartRecipeTime=b.dataset.smartTime;smartRecipeLimit=24;renderSmartRecipePicker()});
  box.querySelector('#smartMore')?.addEventListener('click',()=>{smartRecipeLimit+=24;renderSmartRecipePicker()})
}

function renderWeekMenu(){
  if(!weekMenuList||!weekMenuTitle)return;
  weekMenuTitle.textContent=weekNumberLabel(selectedMenuWeek);
  const plans=recipeWeekPlans().filter(p=>p.week===selectedMenuWeek);
  renderWeekContext(plans);
  if(!plans.length){weekMenuList.innerHTML=`<div class="week-menu-empty">Voor deze week zijn nog geen recepten geselecteerd.<br><button class="btn primary" id="weekMenuFindRecipes" type="button">Recept kiezen</button></div>`;weekMenuList.querySelector('#weekMenuFindRecipes')?.addEventListener('click',()=>showRecipeModule('recipes'));return}
  const stockStatusText=(coverage)=>{if(!coverage.matched)return 'Niet in voorraad';return coverage.alternative?`Alternatief in huis: ${coverage.product?.name||''}`:'In huis'};
  weekMenuList.innerHTML=plans.map(p=>{const expanded=expandedWeekPlans.has(String(p.id));return `<article class="week-menu-card ${expanded?'expanded':''}" data-plan-card="${esc(p.id)}"><button class="week-menu-recipe-link" data-toggle-week-recipe="${esc(p.id)}" type="button" aria-expanded="${expanded?'true':'false'}"><span><strong>${esc(p.title||'Recept')}</strong><small>${p.servings?esc(p.servings)+' personen · ':''}${(p.ingredients||[]).length} ingrediënten</small></span><span class="go">${expanded?'⌃':'⌄'}</span></button>${expanded?`<div class="week-menu-stock-check"><div class="week-menu-stock-title">Ingrediënten & voorraad</div>${(p.ingredients||[]).map(i=>{const coverage=stockCoverage(i,i.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');return `<div class="week-stock-row ${coverage.enough?'enough':coverage.matched?'partial':'missing'}"><span><strong>${esc([i.qty,i.unit,i.ingredient||'Ingrediënt'].filter(Boolean).join(' '))}</strong>${coverage.product?`<small>Gekoppeld aan ${esc(coverage.product.name)}</small>`:''}</span><span class="week-stock-status">${esc(stockStatusText(coverage))}</span></div>`}).join('')}<button class="btn week-open-recipe" data-open-week-recipe="${esc(p.recipeId)}" type="button">Recept bekijken / wijzigen</button></div>`:''}<label class="week-menu-servings">Aantal personen <input type="number" min="1" inputmode="numeric" enterkeyhint="go" data-plan-servings="${esc(p.id)}" value="${esc(p.servings||getRecipe(p.recipeId)?.servings||1)}"></label><div class="week-menu-actions"><select data-move-week="${esc(p.id)}" aria-label="Andere week">${menuWeekOptions(p.week)}</select><button class="btn" data-move-plan="${esc(p.id)}" type="button">Verplaatsen</button><button class="btn danger remove-week-plan" data-remove-plan="${esc(p.id)}" type="button">Uit deze week verwijderen</button></div></article>`}).join('');
  weekMenuList.querySelectorAll('[data-toggle-week-recipe]').forEach(btn=>btn.addEventListener('click',()=>{const id=String(btn.dataset.toggleWeekRecipe);if(expandedWeekPlans.has(id))expandedWeekPlans.delete(id);else expandedWeekPlans.add(id);renderWeekMenu()}));
  const applyPlannedServings=(input)=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(input.dataset.planServings)),target=Math.max(1,Number(input.value)||1);if(!plan)return;const recipe=getRecipe(plan.recipeId);if(!recipe)return;const previous=plan.ingredients||[],scaled=scaledRecipe(recipe,target),gf=Math.max(0,Math.min(target,Number(plan.gfPersons)||0));plan.servings=String(target);plan.ingredients=(scaled.ingredients||[]).map((i,n)=>{const old=previous.find(x=>String(x.id)===String(n))||previous[n]||{},coverage=stockCoverage(i,old.stockProductId||i.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');return {...old,id:String(n),qty:i.qty||'',unit:i.unit||'',ingredient:i.ingredient||'',memo:i.memo||'',done:Boolean(old.done),ordered:coverage.enough?false:Boolean(old.ordered),stockEnough:Boolean(coverage.enough),stockProductId:coverage.matched?(coverage.product?.id??''):'',stockLabel:coverage.matched?coverage.label:'',shoppingQty:coverage.enough?'':(coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):[i.qty,i.unit].filter(Boolean).join(' ')),store:coverage.matched?(coverage.product?.store||''):'',category:coverage.matched?(coverage.product?.category||''):(old.category||'')}});plan.gfPersons=gf;saveRecipeWeekPlans(plans,plan);input.blur();renderWeekMenu()};
  weekMenuList.querySelectorAll('[data-plan-servings]').forEach(input=>{input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyPlannedServings(input)}});input.addEventListener('change',()=>applyPlannedServings(input))});
  weekMenuList.querySelectorAll('[data-open-week-recipe]').forEach(btn=>btn.addEventListener('click',()=>{const r=getRecipe(btn.dataset.openWeekRecipe);if(!r){alert('Dit recept is niet meer beschikbaar in Recepten.');return}const plan=recipeWeekPlans().find(x=>String(x.recipeId)===String(r.id)&&x.week===selectedMenuWeek);pushRecipeHistory({hcRecipeKind:'recipe',hcRecipeId:String(r.id),hcRecipeReturn:'weekmenu'});openedFromWeekMenu=true;current=String(r.id);edited=JSON.parse(JSON.stringify(r));if(plan?.ingredients?.length)edited.ingredients=JSON.parse(JSON.stringify(plan.ingredients));displayServings=String(plan?.servings||r.servings||'');weekMenuPanel?.classList.add('hidden');recipeLibraryPanel?.classList.add('hidden');hideList();showView('ingredients')}));
  weekMenuList.querySelectorAll('[data-move-plan]').forEach(btn=>btn.addEventListener('click',()=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(btn.dataset.movePlan)),select=weekMenuList.querySelector(`[data-move-week="${CSS.escape(String(btn.dataset.movePlan))}"]`);if(!plan||!select)return;const oldWeek=plan.week,newWeek=select.value;if(newWeek===oldWeek)return;plan.week=newWeek;saveRecipeWeekPlans(plans,plan);expandedWeekPlans.delete(String(plan.id));renderWeekMenu()}));
  weekMenuList.querySelectorAll('[data-remove-plan]').forEach(btn=>btn.addEventListener('click',()=>{const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(btn.dataset.removePlan));if(!plan)return;if(!confirm(`${plan.title||'Dit recept'} uit ${weekNumberLabel(selectedMenuWeek)} verwijderen?`))return;expandedWeekPlans.delete(String(plan.id));const removedId=String(btn.dataset.removePlan),deleted=recipeWeekDeleted();deleted[removedId]=Date.now();saveRecipeWeekDeleted(deleted);saveRecipeWeekPlans(plans.filter(x=>String(x.id)!==removedId));renderWeekMenu()}));
}
function showRecipeModule(view,fromHistory=false){
  const safe=view==='recipes'?'recipes':'weekmenu',recipes=safe==='recipes',changed=recipeModuleView!==safe;
  recipeModuleView=safe;
  document.querySelector('.recipes')?.classList.remove('recipe-detail-open');
  detail?.classList.add('hidden');
  weekMenuPanel?.classList.toggle('hidden',recipes);
  recipeLibraryPanel?.classList.toggle('hidden',!recipes);
  showWeekMenuButton?.classList.toggle('active',!recipes);
  showRecipesButton?.classList.toggle('active',recipes);
  if(recipes){list.classList.remove('hidden');pendingBox.classList.remove('hidden');search.classList.remove('hidden');renderList();renderSmartRecipePicker()}else renderWeekMenu();
  if(recipeHistoryReady&&!fromHistory&&changed)history.pushState({...history.state,hcRecipeScreen:'module',hcRecipeModule:safe,hcRecipeKind:'',hcRecipeId:''},'',location.href);
}
window.hcShowRecipeModule=showRecipeModule;
showWeekMenuButton?.addEventListener('click',()=>showRecipeModule('weekmenu'));
showRecipesButton?.addEventListener('click',()=>showRecipeModule('recipes'));
document.querySelector('#weekMenuPrev')?.addEventListener('click',()=>{selectedMenuWeek=shiftMenuWeek(selectedMenuWeek,-1);localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
document.querySelector('#weekMenuNext')?.addEventListener('click',()=>{selectedMenuWeek=shiftMenuWeek(selectedMenuWeek,1);localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
document.querySelector('#weekMenuTitle')?.addEventListener('click',()=>{selectedMenuWeek=isoWeekKey(new Date());localStorage.setItem(WEEK_MENU_SELECTED_KEY,selectedMenuWeek);renderWeekMenu()});
window.addEventListener('huize-chaos-recipe-weeks-changed',()=>{renderWeekMenu();if(recipeModuleView==='recipes')renderSmartRecipePicker()});
window.addEventListener('huize-chaos-products-changed',()=>{stockFitCache.clear();if(recipeModuleView==='recipes'&&smartRecipeMode==='stock')renderSmartRecipePicker()});
window.addEventListener('storage',e=>{if(e.key===RECIPE_WEEK_KEY)renderWeekMenu()});
showRecipeModule(stockIngredientQuery?'recipes':'weekmenu',true);
history.replaceState({...history.state,hcRecipeScreen:'module',hcRecipeModule:stockIngredientQuery?'recipes':'weekmenu',hcRecipeKind:'',hcRecipeId:''},'',location.href);
recipeHistoryReady=true;
window.addEventListener('popstate',event=>{
  const state=event.state||{};
  if(state.hcRecipeScreen==='module'){openedFromWeekMenu=false;returnEventId='';backListDirect();showRecipeModule(state.hcRecipeModule||'weekmenu',true);return}
  if(state.hcRecipeScreen==='detail'&&state.hcRecipeId){
    recipeModuleView=state.hcRecipeReturn||state.hcRecipeModule||'recipes';
    if(state.hcRecipeKind==='pending')openPending(state.hcRecipeId,{fromHistory:true});else openRecipe(state.hcRecipeId,{fromHistory:true});
  }
});
function updateShoppingPlanServings(recipe,target){
  const params=new URLSearchParams(location.search),planId=params.get('plan')||'';
  if(!planId)return;
  const plans=recipeWeekPlans(),plan=plans.find(x=>String(x.id)===String(planId));
  if(!plan)return;
  const previous=plan.ingredients||[],scaled=scaledRecipe(recipe,target);
  const gf=Math.max(0,Math.min(target,Number(plan.gfPersons)||0));
  plan.servings=String(target);
  plan.ingredients=(scaled.ingredients||[]).map((i,n)=>{
    const old=previous.find(x=>String(x.id)===String(n))||previous[n]||{};
    const coverage=stockCoverage(i,old.stockProductId||i.stockProductId||'',/glutenvrij/i.test(i.ingredient)?'gf':'');
    return {
      ...old,
      id:String(n),
      qty:i.qty||'',
      unit:i.unit||'',
      ingredient:i.ingredient||'',
      memo:i.memo||'',
      done:Boolean(old.done),
      ordered:coverage.enough?false:Boolean(old.ordered),
      stockEnough:Boolean(coverage.enough),
      stockProductId:coverage.matched?(coverage.product?.id??''):'',
      stockLabel:coverage.matched?coverage.label:'',
      shoppingQty:coverage.enough?'':(coverage.shortage?[coverage.shortage.qty,coverage.shortage.unit].filter(Boolean).join(' '):[i.qty,i.unit].filter(Boolean).join(' ')),
      store:coverage.matched?(coverage.product?.store||''):'',
      category:coverage.matched?(coverage.product?.category||''):(old.category||'')
    };
  });
  plan.gfPersons=gf;
  saveRecipeWeekPlans(plans,plan);
}

function showReadonlyRecipe(r,view='ingredients'){
  const m=metaFor(r.id),memo=m.memo||'';current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=String(new URLSearchParams(location.search).get('servings')||r.servings||'');hideList();
  const sourceBits=[];if(r.source)sourceBits.push(`Bron: ${esc(r.source)}`);if(r.sourceUrl)sourceBits.push(`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Bron openen</a>`);
  const render=tab=>{detail.innerHTML=`<div class="detail-head"><div><h2>${esc(r.title)}</h2><small>Basis: ${esc(r.servings||displayServings||'?')} personen</small>${sourceBits.length?`<div class="recipe-source">${sourceBits.join(' · ')}</div>`:''}</div><div class="actions"><button class="btn primary" id="backShopping">← Terug naar boodschappenlijst</button></div></div><div class="recipe-serving-control"><label>Aantal personen <input id="readonlyServings" type="number" min="1" inputmode="numeric" value="${esc(displayServings||r.servings||1)}"></label><small>Ingrediënten en de gekoppelde boodschappenlijst worden direct aangepast.</small></div>${memo?`<div class="recipe-readonly-memo"><strong>Memo</strong><div>${esc(memo)}</div></div>`:''}<div class="tabs readonly-tabs"><button class="tab ${tab==='ingredients'?'active':''}" data-ro-v="ingredients">Ingrediënten</button><button class="tab ${tab==='directions'?'active':''}" data-ro-v="directions">Bereiding</button></div><div id="recipeViewBody">${tab==='ingredients'?ingredients(r):`<div class="panel directions">${esc(r.directions||'Nog geen bereidingswijze.')}</div>`}</div>`;
    detail.querySelector('#backShopping').onclick=()=>{window.location.href='../boodschappen/?page=list'};detail.querySelectorAll('[data-ro-v]').forEach(b=>b.onclick=()=>render(b.dataset.roV));const servings=detail.querySelector('#readonlyServings');if(servings){const apply=()=>{const target=Math.max(1,Number(servings.value)||1);displayServings=String(target);updateShoppingPlanServings(r,target);render(tab)};servings.addEventListener('change',apply);servings.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}})}
  };render(view==='directions'?'directions':'ingredients');
}
const directParams=new URLSearchParams(location.search),directRecipe=directParams.get('recipe');
if(directRecipe){const r=getRecipe(directRecipe);if(r){weekMenuPanel?.classList.add('hidden');recipeLibraryPanel?.classList.add('hidden');if(directParams.get('readonly')==='shopping')showReadonlyRecipe(r,directParams.get('view')||'ingredients');else{returnEventId=directParams.get('event')||'';current=String(r.id);edited=JSON.parse(JSON.stringify(r));displayServings=directParams.get('servings')||String(r.servings||'');hideList();showView(directParams.get('view')==='directions'?'directions':'ingredients')}}}

// V1.3.116 - slimme bulkinvoer voor handmatige recepten toegevoegd.


// V1.3.116 - handmatig recept toevoegen met slimme algemene bulkinvoer
function normalizeBulkUnit(unit){
  const u=String(unit||'').trim().toLowerCase().replace(/^stuk\(s\)$/,'stuk');
  const map={'g':'gram','gr':'gram','gram':'gram','eetlepel':'el','eetlepels':'el','tablespoon':'el','tablespoons':'el','tbsp':'el','theelepel':'tl','theelepels':'tl','teaspoon':'tl','teaspoons':'tl','tsp':'tl','stuk':'','stuks':'','stuk(s)':'','zakje(s)':'zakje','zakjes':'zakje','teentje':'teentje','teentjes':'teentjes'};
  return map[u]||u;
}
function bulkFractionNumber(value){
  const s=String(value||'').trim();
  const map={'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
  if(map[s]!=null)return s;
  const mixed=s.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);if(mixed&&map[mixed[2]]!=null)return `${mixed[1]}${mixed[2]}`;
  const hfHalf=s.match(/^(\d)1\/2$/);if(hfHalf)return `${hfHalf[1]}½`;
  const frac=s.match(/^(\d+)\/(\d+)$/);if(frac&&Number(frac[2]))return s;
  return s.replace('.',',');
}
function looksLikeAmountLine(line){
  const s=String(line||'').trim();
  return /^(?:\d+(?:[.,]\d+)?|\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞]|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+)(?:\s+(?:g|gr|gram|kg|ml|cl|dl|l|el|tl|eetlepel(?:s)?|theelepel(?:s)?|stuks?|stuk(?:\(s\))?|blik(?:je)?s?|zak(?:je)?s?|teen|tenen|teentje|teentjes|snuf(?:je)?))?$/i.test(s)||/^naar smaak$/i.test(s);
}
function parseBulkAmount(line){
  const s=String(line||'').trim();
  if(/^naar smaak$/i.test(s))return {qty:'naar smaak',unit:''};
  const m=s.match(/^((?:\d+(?:[.,]\d+)?|\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞]|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+))\s*(.*)$/);
  if(!m)return {qty:'',unit:'',warning:'Hoeveelheid niet herkend'};
  return {qty:bulkFractionNumber(m[1]),unit:normalizeBulkUnit(m[2])};
}
function cleanBulkLines(text){
  return String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).map(x=>{
    const md=x.match(/^\[([^\]]+)\]\(https?:\/\/[^)]+\)$/i);if(md)return md[1];
    return x.replace(/\*\*/g,'').replace(/^#{1,6}\s*/,'').trim();
  }).filter(Boolean).filter(x=>!/^\(?bevat\s*:/i.test(x)&&!/^niet inbegrepen in (?:jouw|je) bezorging$/i.test(x));
}
function parseBulkIngredients(text){
  let lines=cleanBulkLines(text).filter(x=>!/^ingrediënten?$/i.test(x)&&!/^bereiding(?:swijze)?$/i.test(x)&&!/^waarschijnlijk al in huis$/i.test(x));
  const out=[];
  for(let i=0;i<lines.length;){
    const line=lines[i],next=lines[i+1],after=lines[i+2];
    // HelloFresh-kopie: hoeveelheid en productnaam kunnen in beide volgordes staan.
    if(looksLikeAmountLine(line)&&next&&!looksLikeAmountLine(next)){
      const a=parseBulkAmount(line);out.push({qty:a.qty,unit:a.unit,ingredient:next,memo:'',warning:false});i+=2;continue;
    }
    if(!looksLikeAmountLine(line)&&next&&looksLikeAmountLine(next)){
      const a=parseBulkAmount(next);
      // Bij gekopieerde sites staat de productnaam soms nogmaals na de hoeveelheid.
      if(after&&after.toLocaleLowerCase('nl')===line.toLocaleLowerCase('nl'))i++;
      out.push({qty:a.qty,unit:a.unit,ingredient:line,memo:'',warning:false});i+=2;continue;
    }
    if(i+1<lines.length&&lines[i+1].toLocaleLowerCase('nl')===line.toLocaleLowerCase('nl')){i++;continue}
    const parsed=parseIngredient(line);out.push({...parsed,warning:!parsed.ingredient});i++;
  }
  const split=[];
  out.filter(x=>x.ingredient||x.qty||x.unit).forEach(x=>{
    if(/^peper\s+en\s+zout$/i.test(String(x.ingredient||'').trim())){
      split.push({...x,ingredient:'Peper'});split.push({...x,ingredient:'Zout'});
    }else split.push(x);
  });
  return split;
}
function parseBulkDirections(text){
  const rawLines=String(text||'').replace(/\r/g,'').split('\n');
  const steps=[];
  let current=[];
  let sawStepMarker=false;
  const cleanLine=value=>String(value||'').replace(/\*\*/g,'').replace(/^\s*[-•]\s+/,'').trim();
  const push=()=>{
    while(current.length&&!current[0])current.shift();
    while(current.length&&!current[current.length-1])current.pop();
    if(current.some(Boolean))steps.push(current.slice());
    current=[];
  };
  for(const rawLine of rawLines){
    const line=cleanLine(rawLine);
    if(/^bereiding(?:swijze)?$/i.test(line))continue;
    if(!line){
      if(current.length&&current[current.length-1]!=='')current.push('');
      continue;
    }
    let marker=line.match(/^stap\s*(\d+)[.):]?\s*(.*)$/i);
    if(!marker)marker=line.match(/^(\d{1,2})[.)]\s*(.*)$/);
    if(!marker&&/^\d{1,2}$/.test(line))marker=[line,line,''];
    if(marker){
      sawStepMarker=true;
      push();
      if((marker[2]||'').trim())current.push((marker[2]||'').trim());
      continue;
    }
    current.push(line);
  }
  push();
  if(!steps.length)return '';
  // Houd de bereiding rustig leesbaar: iedere losse handeling krijgt witruimte.
  return steps.map((lines,i)=>{
    const blocks=[];
    let block=[];
    const flush=()=>{if(block.length){blocks.push(block.join(' '));block=[]}};
    for(const line of lines){
      if(!line){flush();continue}
      // Een geplakte regel of bullet is meestal één aparte handeling.
      flush();
      block.push(line);
      flush();
    }
    flush();
    return `Stap ${i+1}\n\n${blocks.join('\n\n')}`;
  }).join('\n\n');
}
function escapeRegExp(value){return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function stripIngredientAmountsFromDirections(text,ingredients){
  let out=String(text||'');
  const countUnits=new Set(['stuk','stuks','st','x']);
  (ingredients||[]).forEach(item=>{
    const qty=String(item?.qty||'').trim();
    const unit=String(item?.unit||'').trim();
    const ingredient=String(item?.ingredient||'').trim();
    if(!qty||!ingredient||/^naar smaak$/i.test(qty))return;
    const amountPattern='(?:\\d+(?:[.,]\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\\d+\\/\\d+)';
    const unitPattern=unit?escapeRegExp(unit):'';
    const ingredientPattern=escapeRegExp(ingredient).replace(/\\ /g,'\\s+');
    const patterns=[];
    if(unitPattern)patterns.push(`\\b${amountPattern}\\s*${unitPattern}\\s+${ingredientPattern}\\b`);
    if(!unitPattern||countUnits.has(unit.toLowerCase()))patterns.push(`\\b${amountPattern}\\s+${ingredientPattern}\\b`);
    patterns.forEach(pattern=>{out=out.replace(new RegExp(pattern,'gi'),ingredient)});
  });
  return out;
}
function showManualRecipeForm(){
  pushRecipeHistory({hcRecipeKind:'new',hcRecipeId:'new',hcRecipeReturn:recipeModuleView});
  current='new:'+Date.now();edited={id:'custom-'+Date.now(),title:'',servings:'',ingredients:[],directions:'',source:'Handmatig',photo:'',imported:true};displayServings='';hideList();
  detail.innerHTML=`<div class="detail-head"><div><h2>Recept toevoegen</h2><small>Handmatig of door tekst te plakken</small></div><div class="actions"><button class="btn" id="cancelNewRecipe">Terug</button></div></div>
  <div class="panel bulk-recipe-panel">${photoEditor(edited)}<label>Titel<input id="newRecipeTitle" placeholder="Naam van het recept"></label><label>Aantal personen<input id="newRecipeServings" type="number" min="1" inputmode="numeric" placeholder="4"></label><label>Categorie <small class="field-help">Keuken / smaakrichting</small><select id="newRecipeCategory">${RECIPE_CATEGORIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Soort <small class="field-help">Vorm van het gerecht</small><select id="newRecipeType">${RECIPE_TYPES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Hoofdingrediënt<select id="newRecipeMainIngredient">${MAIN_INGREDIENT_OPTIONS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Tijd thuis<select id="newRecipeHomeTime"><option value="">Niet ingesteld</option>${HOME_TIME_OPTIONS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Bron<input id="newRecipeSource" placeholder="Bijv. Picnic, Allerhande, eigen recept"></label><label>Bron / URL (optioneel)<input id="newRecipeSourceUrl" type="url" placeholder="https://…"></label>
  <h3>Ingrediënten</h3><p class="bulk-help">Plak een complete ingrediëntenlijst. Huize Chaos zet ieder ingrediënt op een eigen regel. Dit werkt ook met lijsten waarin productnamen dubbel voorkomen.</p><textarea id="bulkIngredients" placeholder="800 g kipdrumsticks\n3 el sojasaus\n2 tenen knoflook"></textarea><button class="btn" id="processBulkIngredients" type="button">Ingrediënten verwerken</button><div id="bulkIngredientPreview"></div>
  <h3>Bereiding</h3><p class="bulk-help">Plak de volledige bereidingswijze. Stapnummers worden automatisch verwerkt als Stap 1, Stap 2 enzovoort. Tussen losse handelingen blijft witruimte staan. Hoeveelheden die al bij de ingrediënten staan, worden uit de stappen weggelaten.</p><textarea id="bulkDirections" placeholder="Verwarm de oven...\n2\nMeng de ingrediënten..."></textarea><button class="btn" id="processBulkDirections" type="button">Bereiding verwerken</button><div id="bulkDirectionsPreview"></div>
  <div class="actions bulk-save-actions"><button class="btn primary" id="saveNewRecipe" type="button">Recept opslaan</button><button class="btn" id="cancelNewRecipe2" type="button">Annuleren</button></div></div>`;
  const refreshManualPhoto=()=>{const wrap=detail.querySelector('.recipe-photo-editor');if(wrap)wrap.outerHTML=photoEditor(edited);bindRecipePhotoControls(refreshManualPhoto)};bindRecipePhotoControls(refreshManualPhoto);
  const renderPreview=()=>{const box=detail.querySelector('#bulkIngredientPreview');box.innerHTML=edited.ingredients.length?`<div class="bulk-preview-title">Controleer de ingrediënten</div>${edited.ingredients.map((x,i)=>`<div class="edit-row ingredient-edit-row ${x.warning?'bulk-warning':''}"><input data-new-f="qty" data-new-i="${i}" value="${esc(x.qty||'')}" placeholder="Aantal"><input data-new-f="unit" data-new-i="${i}" value="${esc(x.unit||'')}" placeholder="Eenheid"><input data-new-f="ingredient" data-new-i="${i}" value="${esc(x.ingredient||'')}" placeholder="Ingrediënt"><button class="remove-ing" data-new-remove="${i}" type="button">×</button>${x.warning?'<small class="bulk-warning-text">Controleer deze regel</small>':''}</div>`).join('')}`:'';box.querySelectorAll('[data-new-f]').forEach(el=>el.oninput=()=>edited.ingredients[+el.dataset.newI][el.dataset.newF]=el.value);box.querySelectorAll('[data-new-remove]').forEach(b=>b.onclick=()=>{edited.ingredients.splice(+b.dataset.newRemove,1);renderPreview()})};
  detail.querySelector('#processBulkIngredients').onclick=()=>{edited.ingredients=parseBulkIngredients(detail.querySelector('#bulkIngredients').value);renderPreview()};
  detail.querySelector('#processBulkDirections').onclick=()=>{edited.directions=stripIngredientAmountsFromDirections(parseBulkDirections(detail.querySelector('#bulkDirections').value),edited.ingredients);detail.querySelector('#bulkDirectionsPreview').innerHTML=edited.directions?`<div class="bulk-preview-title">Controleer de bereiding</div><textarea id="parsedDirections">${esc(edited.directions)}</textarea>`:'';detail.querySelector('#parsedDirections')?.addEventListener('input',e=>edited.directions=e.target.value)};
  const cancel=()=>backList();detail.querySelector('#cancelNewRecipe').onclick=cancel;detail.querySelector('#cancelNewRecipe2').onclick=cancel;
  detail.querySelector('#saveNewRecipe').onclick=()=>{edited.title=detail.querySelector('#newRecipeTitle').value.trim();edited.servings=detail.querySelector('#newRecipeServings').value.trim();edited.category=detail.querySelector('#newRecipeCategory')?.value||'Overig';edited.type=detail.querySelector('#newRecipeType')?.value||'Anders';edited.mainIngredient=detail.querySelector('#newRecipeMainIngredient')?.value||'Anders';edited.homeTime=detail.querySelector('#newRecipeHomeTime')?.value||'';edited.source=detail.querySelector('#newRecipeSource').value.trim()||'Handmatig';edited.sourceUrl=detail.querySelector('#newRecipeSourceUrl').value.trim();if(!edited.ingredients.length&&detail.querySelector('#bulkIngredients').value.trim())edited.ingredients=parseBulkIngredients(detail.querySelector('#bulkIngredients').value);if(!edited.directions&&detail.querySelector('#bulkDirections').value.trim())edited.directions=parseBulkDirections(detail.querySelector('#bulkDirections').value);edited.directions=stripIngredientAmountsFromDirections(edited.directions,edited.ingredients);if(!edited.title){alert('Vul eerst een titel in.');return}edited.ingredients=edited.ingredients.filter(x=>x.ingredient.trim()).map(({warning,...x})=>x);saveCustom([...custom(),edited]);current=String(edited.id);displayServings=String(edited.servings||'');showView('ingredients')};
}
document.querySelector('#addRecipeManual')?.addEventListener('click',showManualRecipeForm);

// V1.4.88 - Picnic-recept importeren vanaf 1 of 2 screenshots, met verbeterde OCR.
async function recipeImportImageData(file, cropPhoto=false){
  const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  const canvas=document.createElement('canvas');
  let sx=0,sy=0,sw=img.width,sh=img.height;
  if(cropPhoto && img.width/img.height>1.6){sw=Math.round(img.width*.535)}
  else if(cropPhoto && img.height>img.width*1.25){sh=Math.round(img.height*.42)}
  const max=1200,scale=Math.min(1,max/sw,max/sh);canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
  canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.82)
}

async function recipeOcrImageData(file){
  const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  let sx=0,sy=0,sw=img.width,sh=img.height;
  // Bij een brede Picnic-screenshot staat de recepttekst rechts van de grote gerechtfoto.
  if(img.width/img.height>1.8){sx=Math.round(img.width*.52);sw=img.width-sx}
  const targetW=Math.min(2200,Math.max(1500,sw*2));
  const scale=targetW/sw;
  const canvas=document.createElement('canvas');canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  // Rustige grijswaarde + extra contrast geeft Tesseract meer houvast bij screenshots.
  const im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data;
  for(let i=0;i<d.length;i+=4){let g=.299*d[i]+.587*d[i+1]+.114*d[i+2];g=(g-128)*1.35+128;g=Math.max(0,Math.min(255,g));d[i]=d[i+1]=d[i+2]=g}
  ctx.putImageData(im,0,0);return canvas;
}
function cleanPicnicOcrText(text){
  return String(text||'')
    .replace(/\bmiddelnoog\b/gi,'middelhoog')
    .replace(/\bmiddelhoog\s+vuur\s+ul\b/gi,'middelhoog vuur uit')
    .replace(/\bVeri\b/g,'Verhit')
    .replace(/\bSnijg\b/gi,'Snij')
    .replace(/\bnet vuur ager\b/gi,'het vuur lager')
    .replace(/\baat afgedekt\b/gi,'laat afgedekt')
    .replace(/\bot de\b/gi,'tot de');
}
function normalizeOcrLines(text){return String(text||'').replace(/\r/g,'').split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean)}
function looksAmount(s){return /(?:^|\s)(?:\d+(?:[.,]\d+)?|[¼½¾⅓⅔])\s*(?:g|gr|kg|ml|cl|dl|l|el|tl|stuks?|stuk|tenen?|blik(?:je)?s?|zak(?:je)?s?)\b/i.test(s)||/naar smaak/i.test(s)}
function parsePicnicIngredientLine(line){
  let s=String(line||'').replace(/^[•\-–]\s*/,'').trim();
  let m=s.match(/^(.*?)(\d+(?:[.,]\d+)?|[¼½¾⅓⅔])\s*(g|gr|kg|ml|cl|dl|l|el|tl|stuks?|stuk|tenen?|blik(?:je)?s?|zak(?:je)?s?)\s*$/i);
  if(m&&m[1].trim())return {qty:m[2].replace(',','.'),unit:m[3],ingredient:m[1].trim(),memo:''};
  m=s.match(/^(.*?)(naar smaak)\s*$/i);if(m&&m[1].trim())return {qty:'',unit:'',ingredient:m[1].trim(),memo:'naar smaak'};
  return parseIngredient(s)
}
function parsePicnicOcr(texts){
  const lines=texts.flatMap(normalizeOcrLines), all=lines.join('\n');
  let title='';
  const skip=/^(alle recepten|ingrediënten|bereiding|waarschijnlijk al in huis|picnic|\d+\s*min)$/i;
  for(const l of lines){if(skip.test(l)||looksAmount(l)||/^\d+[.)]?$/.test(l)||l.length<8)continue;if(/[.!?]$/.test(l)&&l.length>55)continue;if(l.length>=12&&l.length<=90){title=l;break}}
  const directionLines=[];let inDirections=false;
  for(const l of lines){
    if(/^bereiding$/i.test(l)){inDirections=true;continue}
    if(inDirections||/^\d+[.)]?\s+/.test(l)||/^\d+[.)]?$/.test(l))directionLines.push(l)
  }
  let directions=parseBulkDirections(directionLines.join('\n'));
  const ingredientLines=[];let inIngredients=false;
  for(const l of lines){
    if(/^ingrediënten$/i.test(l)){inIngredients=true;continue}
    if(/^bereiding$/i.test(l)){inIngredients=false;continue}
    if(inIngredients){if(/^(waarschijnlijk al in huis|variatie tip)[:]?$/i.test(l))continue;ingredientLines.push(l)}
  }
  if(!ingredientLines.length){
    for(const l of lines){if(looksAmount(l)&&!/^\d+\s*min$/i.test(l))ingredientLines.push(l)}
  }
  const ingredients=[];let pendingName='';
  for(const l of ingredientLines){
    if(/^(ingrediënten|bereiding|waarschijnlijk al in huis)$/i.test(l))continue;
    if(looksAmount(l)){
      let parsed=parsePicnicIngredientLine(l);
      if(pendingName && (!parsed.ingredient || /^\d/.test(parsed.ingredient))){parsed.ingredient=pendingName;pendingName=''}
      if(parsed.ingredient&&parsed.ingredient.length>1)ingredients.push(parsed)
    } else if(!/^\d+[.)]?$/.test(l)&&l.length<70){
      if(pendingName){ingredients.push({qty:'',unit:'',ingredient:pendingName,memo:''})}
      pendingName=l
    }
  }
  if(pendingName&&!ingredients.some(x=>x.ingredient===pendingName))ingredients.push({qty:'',unit:'',ingredient:pendingName,memo:''});
  const cleanIngredients=ingredients.filter(x=>x.ingredient&&!/^(alle recepten|ingrediënten|bereiding)$/i.test(x.ingredient));
  directions=stripIngredientAmountsFromDirections(directions,cleanIngredients);
  return {title:title||'Picnic recept',servings:'4',ingredients:cleanIngredients,directions,source:'Picnic'}
}
async function importRecipeFromPhotos(files){
  files=[...files].slice(0,2);if(!files.length)return;
  if(!window.Tesseract){alert('De foto-import kon niet worden geladen. Controleer je internetverbinding en probeer opnieuw.');return}
  hideList();
  detail.innerHTML='<div class="panel bulk-recipe-panel"><h2>Recept uit foto\'s halen</h2><p id="photoImportStatus">Foto 1 van '+files.length+' lezen…</p><div class="recipe-import-progress"><span id="photoImportBar"></span></div><p class="field-help">Dit kan op je telefoon even duren. Je krijgt daarna eerst een controlescherm.</p></div>';
  try{
    const texts=[];
    for(let i=0;i<files.length;i++){
      const status=detail.querySelector('#photoImportStatus'),bar=detail.querySelector('#photoImportBar');if(status)status.textContent=`Foto ${i+1} van ${files.length} lezen…`;
      const ocrImage=await recipeOcrImageData(files[i]);
      const result=await Tesseract.recognize(ocrImage,'nld',{logger:m=>{if(m.status==='recognizing text'){const pct=Math.round((m.progress||0)*100);if(status)status.textContent=`Foto ${i+1} van ${files.length} lezen… ${pct}%`;if(bar)bar.style.width=`${Math.round(((i+(m.progress||0))/files.length)*100)}%`}}});
      texts.push(cleanPicnicOcrText(result?.data?.text||''))
    }
    const parsed=parsePicnicOcr(texts),id=crypto.randomUUID();
    let photo='';try{photo=await recipeImportImageData(files[0],true)}catch(_){photo=''}
    edited={id:'custom-'+id,...parsed,photo,category:'Overig',type:'Anders',mainIngredient:'Anders',homeTime:'',sourceUrl:'',imported:true};current='new:'+id;displayServings='4';
    showImportedPhotoRecipeReview();
  }catch(err){console.error(err);detail.innerHTML=`<div class="panel bulk-recipe-panel"><h2>Foto-import niet gelukt</h2><p>De tekst kon niet goed uit de foto worden gelezen.</p><div class="actions"><button class="btn" id="photoImportBack" type="button">Terug</button></div></div>`;detail.querySelector('#photoImportBack').onclick=backList}
}
function showImportedPhotoRecipeReview(){
  detail.innerHTML=`<div class="detail-head"><div><div class="review-label">Uit foto gehaald</div><h2>Controleer het recept</h2><small>Picnic · standaard 4 personen</small></div></div>${editForm(edited,false)}`;
  bindCommonEdit();
  const actions=detail.querySelector('.review-actions');if(actions)actions.innerHTML='<button class="btn primary" id="savePhotoRecipe">Recept opslaan</button><button class="btn" id="cancelPhotoRecipe">Annuleren</button>';
  detail.querySelector('#savePhotoRecipe').onclick=()=>{edited.directions=stripIngredientAmountsFromDirections(edited.directions,edited.ingredients);if(!edited.title.trim()){alert('Vul eerst een titel in.');return}edited.ingredients=(edited.ingredients||[]).filter(x=>String(x.ingredient||'').trim());saveCustom([...custom(),edited]);current=String(edited.id);displayServings=String(edited.servings||'4');showView('ingredients')};
  detail.querySelector('#cancelPhotoRecipe').onclick=backList;
}
function setupPhotoRecipeImport(){const b=document.querySelector('#addRecipeFromPhotos'),input=document.querySelector('#recipePhotoImportInput');if(!b||!input)return;b.onclick=()=>{input.value='';input.click()};input.onchange=()=>{const files=[...(input.files||[])];if(files.length>2){alert('Kies maximaal 2 foto\'s.');return}importRecipeFromPhotos(files)}}
setupPhotoRecipeImport();


// V1.3.116 - Ga/Enter: invoer toepassen en toetsenbord sluiten; textarea houdt nieuwe regels.
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.tagName==='TEXTAREA')return;const input=e.target;if(!(input instanceof HTMLInputElement))return;if(input.type==='search')return;e.preventDefault();input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();});

// V1.4.88 - foto toevoegen/vervangen gebruikt een expliciete bestandskiezer voor betrouwbare werking op mobiel en desktop.
// V1.4.88 - dubbele ingrediënthoeveelheden worden bij nieuwe recepten uit de bereidingsstappen verwijderd.
