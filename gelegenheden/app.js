import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, serverTimestamp, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
const firebaseApp=initializeApp(firebaseConfig);const auth=getAuth(firebaseApp),db=getFirestore(firebaseApp);const occasionRef=doc(db,'households','huize-chaos','insight','occasions');
const plannerItemRef=id=>doc(db,'households','huize-chaos','plannerItems',`occasion-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`);
let occasionUser=null,cloudReady=false,applyingCloud=false,syncTimer=0,stopCloud=null;
const occasionSyncStatus=document.querySelector('#occasionSyncStatus');
function setOccasionSyncStatus(t){if(occasionSyncStatus)occasionSyncStatus.textContent=t}

const KEY='huize-chaos-occasions-v1';
let activeEventId='';
let events=JSON.parse(localStorage.getItem(KEY)||'[]');
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const nlDate=s=>{if(!s)return 'Geen datum';const d=new Date(`${s}T12:00:00`);return Number.isNaN(d.getTime())?s:new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(d)};
function parseQtyNumber(value){
  let s=String(value??'').trim().replace(',','.');if(!s)return null;
  const unicode={'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
  if(unicode[s]!=null)return unicode[s];
  const mixed=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(mixed)return Number(mixed[1])+Number(mixed[2])/Number(mixed[3]);
  const frac=s.match(/^(\d+)\/(\d+)$/);if(frac)return Number(frac[1])/Number(frac[2]);
  const n=Number(s);return Number.isFinite(n)?n:null;
}
function formatScaledNumber(n,unit='',ingredient=''){
  if(!Number.isFinite(n))return '';const u=String(unit||'').toLowerCase(),food=String(ingredient||'').toLowerCase();
  let v=n;if(['el','tl'].includes(u))v=Math.round(v*16)/16;
  else if(['g','gr','gram','ml'].includes(u))v=Math.round(v);
  else if(/^(stuks?|stuk|blik(?:je)?|zak(?:je)?|teen|tenen)$/.test(u))v=Math.round(v);
  else if(!u&&/(limoen|citroen)/.test(food))v=Math.round(v*2)/2;
  else v=Math.round(v*100)/100;
  const whole=Math.floor(v),f=Math.round((v-whole)*16)/16;
  const fm={0.25:'¼',0.5:'½',0.75:'¾'};
  if(fm[f]&&Math.abs(v-(whole+f))<1e-8)return whole?`${whole} ${fm[f]}`:fm[f];
  return String(Number(v.toFixed(4))).replace('.',',');
}
function scaledQty(qty,factor,unit,ingredient){const n=parseQtyNumber(qty);return n==null?String(qty||''):formatScaledNumber(n*factor,unit,ingredient)}
function normalizeEvent(e){e.items=e.items||[];e.needs=e.needs||[];e.prep=e.prep||[];e.menu=(e.menu||[]).map(m=>{
  const base=String(m.recipeBaseServings||m.recipeServings||'');
  const selected=String(m.servings||m.recipeServings||'');
  return {...m,recipeBaseServings:base,servings:selected,ingredients:(m.ingredients||[]).map(i=>({...i,baseQty:i.baseQty??i.qty??'',enabled:i.enabled!==false}))};
});e.shopping=e.shopping||[];if(typeof e.shoppingCreated!=='boolean')e.shoppingCreated=e.shopping.length>0;e.evaluation=e.evaluation||'';return e}
events=events.map(normalizeEvent);
function save(){localStorage.setItem(KEY,JSON.stringify(events));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));render();scheduleCloudSync()}
function scheduleCloudSync(){if(!cloudReady||applyingCloud||!occasionUser)return;clearTimeout(syncTimer);setOccasionSyncStatus('Synchroniseren…');syncTimer=setTimeout(syncCloud,250)}
async function syncOccasionToPlanner(e){
  if(!occasionUser||!e?.id)return;
  const ref=plannerItemRef(e.id);
  if(!e.date){await deleteDoc(ref).catch(()=>{});return}
  const people=e.people?`${e.people} personen`:'';
  const note=[people,e.note,'Beheer via Feestdagen & gelegenheden'].filter(Boolean).join(' · ');
  await setDoc(ref,{
    localId:`occasion-${e.id}`,
    type:'appointment',date:String(e.date||''),deadline:'',urgent:false,category:'',
    title:String(e.name||'Gelegenheid'),time:'',endTime:'',personUid:'',personName:'',participants:[],
    linkedAppointmentId:'',note,done:false,repeat:'none',completedPeriods:[],createdAt:Number(e.createdAt||Date.now()),
    visibility:'shared',addedBy:occasionUser.uid,addedByName:(occasionUser.displayName||occasionUser.email||'Huize Chaos').split(/\s+/)[0],
    occasionId:String(e.id),source:'occasion',updatedAt:serverTimestamp()
  },{merge:true});
}
async function syncAllOccasionsToPlanner(){if(!occasionUser)return;await Promise.all(events.map(syncOccasionToPlanner))}
async function syncCloud(){if(!occasionUser)return;await setDoc(occasionRef,{events,updatedAt:serverTimestamp(),updatedBy:occasionUser.uid},{merge:false});await syncAllOccasionsToPlanner();setOccasionSyncStatus('Gesynchroniseerd')}
function initCloud(){onAuthStateChanged(auth,async u=>{occasionUser=u;if(!u){setOccasionSyncStatus('Alleen op dit apparaat');return}try{const snap=await getDoc(occasionRef);if(snap.exists()&&Array.isArray(snap.data().events)){applyingCloud=true;events=snap.data().events.map(normalizeEvent);localStorage.setItem(KEY,JSON.stringify(events));applyingCloud=false;render()}cloudReady=true;await syncCloud();stopCloud?.();stopCloud=onSnapshot(occasionRef,snap=>{if(!snap.exists()||applyingCloud)return;const d=snap.data();if(!Array.isArray(d.events))return;applyingCloud=true;events=d.events.map(normalizeEvent);localStorage.setItem(KEY,JSON.stringify(events));applyingCloud=false;render();if(activeEventId&&events.some(e=>e.id===activeEventId))openDetail(activeEventId)},()=>{})}catch(err){console.warn('Synchronisatie gelegenheden niet beschikbaar',err);setOccasionSyncStatus('Alleen op dit apparaat')}})}
function catTotals(e){return ['Eten','Hapjes','Dranken','Overig'].map(c=>[c,(e.items||[]).filter(x=>x.category===c).reduce((a,x)=>a+(+x.cost||0),0)])}
function render(){
  const list=$('#list');
  if(!events.length){list.innerHTML='<div class="empty"><h2>Nog geen gelegenheden</h2><p>Voeg een feestdag, verjaardag of andere gelegenheid toe.</p></div>';return}
  list.innerHTML=[...events].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(e=>{
    const total=(e.items||[]).reduce((a,x)=>a+(+x.cost||0),0);
    const openNeeds=(e.needs||[]).filter(x=>!x.done).length;
    const openPrep=(e.prep||[]).filter(x=>!x.done).length;
    return `<article class="event"><div class="event-head"><div><h2>${esc(e.name)}</h2><div class="meta">${esc(e.date?nlDate(e.date):'Geen datum')} · ${e.people?esc(e.people)+' personen':'Aantal personen niet ingevuld'}</div></div><button onclick="openDetail('${e.id}')">Bekijken</button></div><div class="totals">${catTotals(e).filter(x=>x[1]).map(([c,n])=>`<span class="chip">${c}: <strong>${money(n)}</strong></span>`).join('')}<span class="chip">Totaal: <strong>${money(total)}</strong></span>${openNeeds?`<span class="chip accent">${openNeeds} nog nodig</span>`:''}${openPrep?`<span class="chip accent">${openPrep} voor te bereiden</span>`:''}</div></article>`
  }).join('')
}
function openForm(e={}){
  $('#formTitle').textContent=e.id?'Gelegenheid wijzigen':'Nieuwe gelegenheid';
  $('#eventId').value=e.id||'';
  $('#eventName').value=e.name||'';
  $('#eventDate').value=e.date||'';
  $('#eventPeople').value=e.people||'';
  $('#eventNote').value=e.note||'';
  $('#eventDialog').showModal()
}
$('#addEvent').onclick=()=>openForm();
$('#cancelEvent').onclick=()=>$('#eventDialog').close();
$('#eventForm').onsubmit=ev=>{
  ev.preventDefault();
  const id=$('#eventId').value||String(Date.now());
  let e=events.find(x=>x.id===id);
  if(!e){e={id,items:[],needs:[],prep:[],menu:[],shopping:[],evaluation:'',createdAt:Date.now()};events.push(e)}
  normalizeEvent(e);
  e.name=$('#eventName').value.trim();
  e.date=$('#eventDate').value;
  refreshEventShoppingIfCreated(e);
  e.people=$('#eventPeople').value;
  e.note=$('#eventNote').value.trim();
  save();$('#eventDialog').close();openDetail(id)
};
window.openDetail=id=>{
  activeEventId=id;
  const e=events.find(x=>x.id===id);if(!e)return;normalizeEvent(e);
  const sums=catTotals(e);
  $('#detail').innerHTML=`
    <div class="detail-top"><div><small>Feestdagen & gelegenheden</small><h2>${esc(e.name)}</h2><div class="meta">${esc(e.date?nlDate(e.date):'Geen datum')} · ${e.people?esc(e.people)+' personen':''}</div>${e.note?`<p>${esc(e.note)}</p>`:''}</div><button class="close" onclick="detailDialog.close()">×</button></div>
    <div class="summary">${sums.map(([c,n])=>`<div class="sum"><small>${c}</small><strong>${money(n)}</strong></div>`).join('')}</div>

    <section class="occasion-section">
      <div class="section-title"><div><h3>Menu</h3><p>Voeg een recept toe of maak een los menuonderdeel.</p></div></div>
      <div class="menu-list">${(e.menu||[]).map((x,i)=>menuHtml(x,i)).join('')||'<p class="meta empty-line">Nog geen gerechten toegevoegd.</p>'}</div>
      <div class="menu-actions"><button class="primary" onclick="showRecipeSearch('${id}')">Zoeken in recepten</button><button onclick="toggleLooseMenu()">+ Los gerecht</button></div>
      <div id="recipeSearchBox"></div>
      <div id="looseMenuBox" class="quick-add menu-add" hidden><select id="newMenuType"><option>Hapje</option><option>Voorgerecht</option><option>Hoofdgerecht</option><option>Bijgerecht</option><option>Dessert</option><option>Drank</option><option>Overig</option></select><input id="newMenuDish" placeholder="Gerecht of onderdeel"><input id="newMenuNeeded" placeholder="Benodigdheden (optioneel)"><button class="primary" onclick="addMenu('${id}')">+ Toevoegen</button></div>
    </section>

    <section class="occasion-section">
      <div class="section-title"><div><h3>Wat heb ik nodig?</h3><p>Maak vooraf een lijst met wat je voor deze gelegenheid nodig hebt.</p></div></div>
      <div id="needsList" class="check-list">${(e.needs||[]).map((x,i)=>needHtml(x,i)).join('')||'<p class="meta empty-line">Nog niets op de lijst.</p>'}</div>
      <div class="quick-add needs-add"><input id="newNeed" placeholder="Bijv. chips, servetten of kaarsjes"><input id="newNeedQty" placeholder="Aantal / hoeveelheid"><button class="primary" onclick="addNeed('${id}')">+ Toevoegen</button></div>
    </section>

    <section class="occasion-section">
      <div class="section-title"><div><h3>Voorbereiden</h3><p>Zet klaar wat er gedaan moet worden. Datum en tijd zijn optioneel.</p></div></div>
      <div id="prepList" class="check-list">${prepSorted(e).map(({x,i})=>prepHtml(x,i)).join('')||'<p class="meta empty-line">Nog geen voorbereidingen toegevoegd.</p>'}</div>
      <div class="quick-add prep-add"><input id="newPrep" placeholder="Bijv. soep maken of tafel dekken"><label class="compact-date"><span>Datum (optioneel)</span><input id="newPrepDate" type="date"></label><label class="compact-date"><span>Tijd (optioneel)</span><input id="newPrepTime" type="time"></label><button class="primary" onclick="addPrep('${id}')">+ Toevoegen</button></div>
    </section>

    <section class="occasion-section shopping-section">
      <div class="section-title"><div><h3>Boodschappen</h3><p>Maak de lijst vanuit je benodigdheden en menu. De boodschappen verschijnen daarna bij Menu → Boodschappen.</p></div><button class="primary" onclick="createShopping('${id}')">Naar Boodschappen</button></div>
      ${(e.shopping||[]).length?`<p class="meta">${e.shopping.filter(x=>!x.done).length} boodschappen gepland. Wil je iets vanwege een aanbieding eerder kopen, zet het dan op deze week.</p><div class="early-buy-list">${e.shopping.filter(x=>!x.done).map((x,i)=>`<div class="early-buy-row"><span>${esc(x.text)} ${x.qty?`<small>${esc(x.qty)}</small>`:''}</span><button onclick="buyNow(${i})">Nu kopen</button></div>`).join('')}</div>`:'<p class="meta empty-line">Nog geen boodschappen doorgestuurd.</p>'}
    </section>

    <section class="occasion-section">
      <div class="section-title"><div><h3>Gekochte producten</h3><p>Leg achteraf vast hoeveel je kocht en of de hoeveelheid goed was.</p></div></div>
      <div id="items">${(e.items||[]).map((x,i)=>itemHtml(x,i)).join('')||'<p class="meta empty-line">Nog geen producten toegevoegd.</p>'}</div>
      <div class="add-row"><strong>Product toevoegen</strong><div class="add-grid"><input id="newProduct" placeholder="Product"><select id="newCategory"><option>Eten</option><option>Hapjes</option><option>Dranken</option><option>Overig</option></select><input id="newQty" placeholder="Aantal"><input id="newCost" inputmode="decimal" placeholder="Kosten €"><select id="newResult"><option value="">Evaluatie</option><option>Te veel</option><option>Precies goed</option><option>Te weinig</option></select><input id="newExcessQty" class="excess-add" placeholder="Aantal over" hidden></div><div class="actions"><button class="primary" onclick="addItem('${id}')">+ Toevoegen</button></div></div>
    </section>

    <div class="evaluation"><label>Algemene evaluatie<textarea id="evaluation" rows="3" placeholder="Wat wil je de volgende keer anders doen?">${esc(e.evaluation||'')}</textarea></label><button onclick="saveEvaluation('${id}')">Evaluatie opslaan</button></div>
    <div class="actions"><button onclick="editEvent('${id}')">Gelegenheid wijzigen</button><button class="danger" onclick="deleteEvent('${id}')">Verwijderen</button><button class="primary" onclick="detailDialog.close()">Klaar</button></div>`;
  const result=$('#newResult');
  if(result)result.onchange=()=>{const excess=$('#newExcessQty');excess.hidden=result.value!=='Te veel';if(excess.hidden)excess.value=''};
  $('#detailDialog').showModal()
};
function menuHtml(x,i){const linked=x.recipeId&&x.ingredients?.length;return `<div class="menu-card"><div class="menu-card-head"><div><span class="menu-type">${esc(x.type||'Overig')}</span>${x.recipeId?`<button class="menu-recipe-open" type="button" onclick="openMenuRecipe(${i})"><strong>${esc(x.dish||'')}</strong><small>Gekoppeld recept · tik voor bereiding ›</small></button>`:`<strong>${esc(x.dish||'')}</strong>`}</div><button class="del danger" onclick="deleteMenu(${i})">×</button></div>${linked?`<div class="menu-servings"><label>Aantal personen<input id="menuServings${i}" type="number" min="1" inputmode="numeric" value="${esc(x.servings||x.recipeServings||'')}"></label><button type="button" onclick="setMenuServings(${i},document.getElementById('menuServings${i}').value)">Toepassen</button><small>Ingrediënten en boodschappen passen meteen mee aan.</small></div><div class="menu-ingredients"><div class="meta">Kies wat je voor deze gelegenheid wilt gebruiken:</div>${x.ingredients.map((ing,j)=>`<label class="menu-ingredient"><input type="checkbox" ${ing.enabled!==false?'checked':''} onchange="toggleMenuIngredient(${i},${j},this.checked)"><span>${esc([ing.qty,ing.unit,ing.ingredient].filter(Boolean).join(' '))}</span></label>`).join('')}</div>`:x.needed?`<div class="menu-needed">${esc(x.needed)}</div>`:''}</div>`}
function recipeLibrary(){const base=window.HUIZE_CHAOS_RECIPES||[];let custom=[];try{custom=JSON.parse(localStorage.getItem('hc-recipe-custom-v1')||'[]')}catch(_){}const edits=new Map();base.forEach(r=>{try{const e=JSON.parse(localStorage.getItem('hc_recipe_'+r.id)||'null');if(e)edits.set(String(r.id),e)}catch(_){}});return [...base.map(r=>edits.get(String(r.id))||r),...custom]}
window.toggleLooseMenu=()=>{const box=$('#looseMenuBox');box.hidden=!box.hidden};
window.showRecipeSearch=id=>{const box=$('#recipeSearchBox');box.innerHTML=`<div class="recipe-search"><input id="occasionRecipeQuery" placeholder="Zoek recept…" autocomplete="off"><div id="occasionRecipeResults" class="recipe-results"></div></div>`;const input=$('#occasionRecipeQuery');const draw=()=>{const q=input.value.trim().toLowerCase();const a=recipeLibrary().filter(r=>!q||(r.title||'').toLowerCase().includes(q)).slice(0,30);$('#occasionRecipeResults').innerHTML=a.map(r=>`<button onclick="addRecipeToOccasion('${id}','${esc(String(r.id))}')"><span><strong>${esc(r.title)}</strong><small>${esc(r.servings||'')} ${r.servings?'personen':''}</small></span><span>Toevoegen</span></button>`).join('')||'<p class="meta">Geen recepten gevonden.</p>'};input.oninput=draw;draw();input.focus()};
window.addRecipeToOccasion=(id,recipeId)=>{const e=events.find(x=>x.id===id),r=recipeLibrary().find(x=>String(x.id)===String(recipeId));if(!e||!r)return;normalizeEvent(e);const base=Number(r.servings)||Number(e.people)||1,target=Number(e.people)||base,factor=target/base;e.menu.push({type:'Hapje',dish:r.title,recipeId:String(r.id),recipeServings:String(r.servings||''),recipeBaseServings:String(base),servings:String(target),ingredients:(r.ingredients||[]).map(x=>({baseQty:x.qty||'',qty:scaledQty(x.qty||'',factor,x.unit,x.ingredient),unit:x.unit||'',ingredient:x.ingredient||'',memo:x.memo||'',enabled:true}))});refreshEventShoppingIfCreated(e);save();openDetail(id)};
window.openMenuRecipe=i=>{const e=current(),m=e?.menu?.[i];if(!m?.recipeId)return;window.location.href=`../recepten/?recipe=${encodeURIComponent(m.recipeId)}&view=directions&event=${encodeURIComponent(e.id)}&servings=${encodeURIComponent(m.servings||m.recipeServings||'')}`};
window.setMenuServings=(i,value)=>{const e=current(),m=e?.menu?.[i];if(!m?.recipeId)return;const target=Math.max(1,Number(value)||1),base=Math.max(1,Number(m.recipeBaseServings||m.recipeServings)||target),factor=target/base;m.servings=String(target);m.ingredients=(m.ingredients||[]).map(ing=>({...ing,baseQty:ing.baseQty??ing.qty??'',qty:scaledQty(ing.baseQty??ing.qty??'',factor,ing.unit,ing.ingredient)}));refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
window.toggleMenuIngredient=(i,j,v)=>{const e=current();if(!e?.menu?.[i]?.ingredients?.[j])return;e.menu[i].ingredients[j].enabled=v;refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
function shoppingHtml(x,i){return `<div class="check-row ${x.done?'done':''}"><input class="row-check" type="checkbox" ${x.done?'checked':''} onchange="updateShopping(${i},'done',this.checked)"><input class="grow" value="${esc(x.text||'')}" onchange="updateShopping(${i},'text',this.value)"><input class="qty" value="${esc(x.qty||'')}" placeholder="Aantal / hoeveelheid" onchange="updateShopping(${i},'qty',this.value)"><button class="del danger" onclick="deleteShopping(${i})">×</button></div>`}
function needHtml(x,i){return `<div class="check-row ${x.done?'done':''}"><input class="row-check" type="checkbox" ${x.done?'checked':''} onchange="updateNeed(${i},'done',this.checked)"><input class="grow" value="${esc(x.text||'')}" aria-label="Benodigd" onchange="updateNeed(${i},'text',this.value)"><input class="qty" value="${esc(x.qty||'')}" placeholder="Aantal / hoeveelheid" aria-label="Aantal" onchange="updateNeed(${i},'qty',this.value)"><button class="del danger" onclick="deleteNeed(${i})" aria-label="Verwijderen">×</button></div>`}
function prepSorted(e){return (e.prep||[]).map((x,i)=>({x,i})).sort((a,b)=>{if(a.x.done!==b.x.done)return a.x.done?1:-1;if(!a.x.date&&!b.x.date)return 0;if(!a.x.date)return 1;if(!b.x.date)return -1;return a.x.date.localeCompare(b.x.date)})}
function prepHtml(x,i){return `<div class="check-row prep-row ${x.done?'done':''}"><input class="row-check" type="checkbox" ${x.done?'checked':''} onchange="updatePrep(${i},'done',this.checked)"><input class="grow" value="${esc(x.text||'')}" aria-label="Voorbereiding" onchange="updatePrep(${i},'text',this.value)"><input class="date" type="date" value="${esc(x.date||'')}" aria-label="Datum" onchange="updatePrep(${i},'date',this.value)"><input class="time" type="time" value="${esc(x.time||'')}" aria-label="Tijd" onchange="updatePrep(${i},'time',this.value)"><button class="del danger" onclick="deletePrep(${i})" aria-label="Verwijderen">×</button></div>`}
function itemHtml(x,i){
  const excess=x.result==='Te veel'?`<input class="excess" value="${esc(x.excessQty||'')}" placeholder="Aantal over" aria-label="Aantal over" onchange="updateItem(${i},'excessQty',this.value)">`:'';
  return `<div class="item-wrap"><div class="item"><input class="product" value="${esc(x.product)}" onchange="updateItem(${i},'product',this.value)"><select onchange="updateItem(${i},'category',this.value)">${['Eten','Hapjes','Dranken','Overig'].map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('')}</select><input value="${esc(x.qty||'')}" placeholder="Aantal" onchange="updateItem(${i},'qty',this.value)"><input value="${esc(x.cost||'')}" inputmode="decimal" placeholder="Kosten" onchange="updateItem(${i},'cost',this.value)"><select onchange="updateItemResult(${i},this.value)"><option value="">—</option>${['Te veel','Precies goed','Te weinig'].map(c=>`<option ${x.result===c?'selected':''}>${c}</option>`).join('')}</select><button class="del danger" onclick="deleteItem(${i})">×</button></div>${excess?`<div class="excess-row"><label>Aantal over${excess}</label></div>`:''}</div>`
}
function current(){return events.find(x=>x.id===activeEventId)}
window.addMenu=id=>{const e=events.find(x=>x.id===id);const dish=$('#newMenuDish').value.trim();if(!e||!dish)return;normalizeEvent(e);e.menu.push({type:$('#newMenuType').value,dish,needed:$('#newMenuNeeded').value.trim()});refreshEventShoppingIfCreated(e);save();openDetail(id)};
window.updateMenu=(i,k,v)=>{const e=current();if(!e)return;e.menu[i][k]=v;refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
window.deleteMenu=i=>{const e=current();if(!e)return;e.menu.splice(i,1);refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
// V1.3.94 - datum van een gelegenheid zonder lokale tijdzone naar ISO-week omzetten.
function eventWeekKey(date){let d;if(date){const m=String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);d=m?new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]))):new Date(date)}else{const n=new Date();d=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()))}if(Number.isNaN(d.getTime()))return '';const x=new Date(d);x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return `${x.getUTCFullYear()}-W${String(Math.ceil((((x-y)/86400000)+1)/7)).padStart(2,'0')}`}
function currentWeekKey(){return eventWeekKey('')}
function buildEventShopping(e){
  normalizeEvent(e);
  const old=e.shopping||[],rows=[];
  const add=(text,qty='')=>{
    text=String(text||'').trim();if(!text)return;
    const key=text.toLowerCase();
    const found=rows.find(r=>r.text.toLowerCase()===key);
    if(found){if(qty&&!found.qty)found.qty=qty;return}
    const previous=old.find(r=>String(r.text||'').trim().toLowerCase()===key);
    rows.push({text,qty:qty||previous?.qty||'',done:Boolean(previous?.done),buyWeek:previous?.buyWeekOverride?previous.buyWeek:eventWeekKey(e.date),buyWeekOverride:Boolean(previous?.buyWeekOverride),store:previous?.store||'',category:previous?.category||'',unit:previous?.unit||''});
  };
  (e.needs||[]).filter(x=>!x.done).forEach(x=>add(x.text,x.qty));
  (e.menu||[]).forEach(x=>{
    if(x.ingredients?.length)x.ingredients.filter(i=>i.enabled!==false).forEach(i=>add(i.ingredient,[i.qty,i.unit].filter(Boolean).join(' ')));
    else String(x.needed||'').split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean).forEach(v=>add(v,''));
  });
  e.shopping=rows;
  return rows;
}
function refreshEventShoppingIfCreated(e){if(e?.shoppingCreated)buildEventShopping(e)}
window.createShopping=id=>{const e=events.find(x=>x.id===id);if(!e)return;normalizeEvent(e);e.shoppingCreated=true;buildEventShopping(e);save();window.location.href='../boodschappen/?page=list'};
window.buyNow=i=>{const e=current();if(!e||!e.shopping[i])return;e.shopping[i].buyWeek=currentWeekKey();e.shopping[i].buyWeekOverride=true;save();openDetail(e.id)};
window.updateShopping=(i,k,v)=>{const e=current();if(!e)return;e.shopping[i][k]=v;save();openDetail(e.id)};
window.deleteShopping=i=>{const e=current();if(!e)return;e.shopping.splice(i,1);save();openDetail(e.id)};
window.clearShopping=id=>{const e=events.find(x=>x.id===id);if(!e||!confirm('Boodschappenlijst leegmaken?'))return;e.shopping=[];e.shoppingCreated=false;save();openDetail(id)};
window.addNeed=id=>{const e=events.find(x=>x.id===id);const text=$('#newNeed').value.trim();if(!e||!text)return;normalizeEvent(e);e.needs.push({text,qty:$('#newNeedQty').value.trim(),done:false});refreshEventShoppingIfCreated(e);save();openDetail(id)};
window.updateNeed=(i,k,v)=>{const e=current();if(!e)return;e.needs[i][k]=v;refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
window.deleteNeed=i=>{const e=current();if(!e)return;e.needs.splice(i,1);refreshEventShoppingIfCreated(e);save();openDetail(e.id)};
window.addPrep=id=>{const e=events.find(x=>x.id===id);const text=$('#newPrep').value.trim();if(!e||!text)return;normalizeEvent(e);e.prep.push({text,date:$('#newPrepDate').value,time:$('#newPrepTime').value,done:false});save();openDetail(id)};
window.updatePrep=(i,k,v)=>{const e=current();if(!e)return;e.prep[i][k]=v;save();openDetail(e.id)};
window.deletePrep=i=>{const e=current();if(!e)return;e.prep.splice(i,1);save();openDetail(e.id)};
window.addItem=id=>{const e=events.find(x=>x.id===id);const product=$('#newProduct').value.trim();if(!product)return;const result=$('#newResult').value;e.items.push({product,category:$('#newCategory').value,qty:$('#newQty').value,cost:$('#newCost').value.replace(',','.'),result,excessQty:result==='Te veel'?$('#newExcessQty').value:''});save();openDetail(id)};
window.updateItem=(i,k,v)=>{const e=current();if(!e)return;e.items[i][k]=k==='cost'?v.replace(',','.'):v;save();openDetail(e.id)};
window.updateItemResult=(i,v)=>{const e=current();if(!e)return;e.items[i].result=v;if(v!=='Te veel')e.items[i].excessQty='';save();openDetail(e.id)};
window.deleteItem=i=>{const e=current();if(!e)return;e.items.splice(i,1);save();openDetail(e.id)};
window.saveEvaluation=id=>{const e=events.find(x=>x.id===id);e.evaluation=$('#evaluation').value;save();openDetail(id)};
window.editEvent=id=>{const e=events.find(x=>x.id===id);$('#detailDialog').close();openForm(e)};
window.deleteEvent=id=>{if(!confirm('Deze gelegenheid verwijderen?'))return;events=events.filter(x=>x.id!==id);if(occasionUser)deleteDoc(plannerItemRef(id)).catch(()=>{});save();$('#detailDialog').close()};
render();initCloud();
const requestedEvent=new URLSearchParams(location.search).get('event');if(requestedEvent&&events.some(e=>String(e.id)===String(requestedEvent)))setTimeout(()=>openDetail(requestedEvent),0);
