(() => {
const CATS=['Vlees & vis','Maaltijden','Groente & fruit','Ontbijt & lunch','Dranken','Snacks & lekkers','Huishouden','Verzorging','Huisdieren','Niet-boodschappen','Overig'];
const NON_GROCERY_CATS=new Set(['Huishouden','Verzorging','Niet-boodschappen']);
const countsAsGroceries=line=>!NON_GROCERY_CATS.has(line?.category||'');
const isCare=line=>(line?.category||'')==='Verzorging';
const isHousehold=line=>(line?.category||'')==='Huishouden';
const isOutside=line=>(line?.category||'')==='Niet-boodschappen';
const KEYWORDS={
'Vlees & vis':['gehakt','gehaktbal','gehaktballet','kipfilet','kipdij','kipburger','kip ','kipshaslick','shaslick','dijlap','slavink','vlees','rund','vis','kabeljauw','koolvis','zalm','worst','braadworst','steak','schnitzel','hamburger','biefstuk','spek','shoarma'],
'Groente & fruit':['snijboon','snijbonen','tomatenblok','peterselie','broccoli','ijsbergsla','paprika','tomaat','komkommer','sla','gele ui','uien','ui','knoflook','wortel','appelmoes','appel','banaan','druif','kiwi','fruit','groente','avocado','courgette','prei','champignon','aardbei'],
'Ontbijt & lunch':['suikerklont','suiker','zoetje','zoetjes','brood','kaas','beleg','yoghurt','kwark','cruesli','muesli','havermout','melk','jam','hagelslag','smeerkaas','vleeswaar','beschuit','cracker'],
'Maaltijden':['gele rijst','rijst','aardappelschijf','bami & nasi','bami','nasi','eiermie','mie','boemboe','gebakken uitjes','spaghetti','pasta'],
'Dranken':['cola','fanta','sinas','sap','koffie','thee','drank','water','limonade','sprite','pepsi','wijn'],
'Snacks & lekkers':['chips','snoep','koek','chocolade','ijs','snack','toast','drop','winegum','borrel'],
'Huishouden':['wasmiddel','wasverzachter','vaatwas','afwas','wc papier','toiletpapier','keukenrol','vuilniszak','schoonmaak','allesreiniger'],
'Verzorging':['shampoo','deodorant','tandpasta','douchegel','maandverband','tampon','paracetamol'],
'Huisdieren':['katten','kattenbak','kattenvoer','brokjes','natvoer','kattensnoep'],
'Niet-boodschappen':['tijdschrift','magazine','hema ','hema-','boek','puzzelboek','wenskaart','speelgoed','batterij','lamp','kaars','cadeau','servies','mok','glaswerk','textiel','sokken']};
let mode=localStorage.getItem('hc-insight-mode')||'month';
let offset=Number(localStorage.getItem('hc-insight-offset')||0);
let receiptSource='digital';
let readingReceipt=false;
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const receipts=()=>JSON.parse(localStorage.getItem('hc-receipts-v1')||'[]');
const notifyInsightChanged=()=>window.dispatchEvent(new CustomEvent('huize-chaos-insight-changed'));
const saveReceipts=x=>{localStorage.setItem('hc-receipts-v1',JSON.stringify(x));notifyInsightChanged()};

const receiptFileDb=()=>new Promise((resolve,reject)=>{const q=indexedDB.open('huize-chaos-receipts',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files')};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
async function saveReceiptFile(id,file){if(!file)return;const db=await receiptFileDb();await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,String(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
async function getReceiptFile(id){const db=await receiptFileDb();const file=await new Promise((resolve,reject)=>{const q=db.transaction('files').objectStore('files').get(String(id));q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});db.close();return file}
async function openStoredReceipt(id){try{const file=await getReceiptFile(id);if(!file){alert('Het oorspronkelijke bonbestand is bij deze oudere bon niet opgeslagen. Kies de bon bij Bon wijzigen opnieuw; daarna is Bron aanklikbaar.');return}const url=URL.createObjectURL(file);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){console.warn(e);alert('De bon kon niet worden geopend.') }}
function receiptBreakdown(r){const out={boodschappen:0,huishouden:0,verzorging:0,overig:0};(r.lines||[]).forEach(l=>{const v=Number(l.price)||0;if(l.category==='Huishouden')out.huishouden+=v;else if(l.category==='Verzorging')out.verzorging+=v;else if(l.category==='Niet-boodschappen')out.overig+=v;else out.boodschappen+=v});Object.keys(out).forEach(k=>out[k]=+out[k].toFixed(2));return out}
function receiptControl(r){const b=receiptBreakdown(r),k=Number(r.koopzegels)||0,p=Number(r.koopzegelsPaid)||0,calc=+(b.boodschappen+b.huishouden+b.verzorging+b.overig+k-p).toFixed(2),diff=+(Number(r.total)-calc).toFixed(2);return{...b,calc,diff}}

const CAT_MEMORY_KEY='hc-product-categories-v1';
const normalizeProductName=name=>String(name||'').toLowerCase().replace(/^\s*\d+\s+/,'').replace(/[^a-z0-9à-ÿ]+/gi,' ').replace(/\s+/g,' ').trim();
const categoryMemory=()=>{try{return JSON.parse(localStorage.getItem(CAT_MEMORY_KEY)||'{}')}catch(_){return{}}};
const rememberCategory=(name,category)=>{if(!name||!CATS.includes(category))return;const key=normalizeProductName(name);if(!key)return;const mem=categoryMemory();mem[key]=category;localStorage.setItem(CAT_MEMORY_KEY,JSON.stringify(mem));notifyInsightChanged()};
function insightCloudData(){return{receipts:receipts(),budgetWeek:Number(localStorage.getItem('hc-budget-week')||0),budgetMonth:Number(localStorage.getItem('hc-budget-month')||0),careBudgetWeek:Number(localStorage.getItem('hc-budget-care-week')||0),careBudgetMonth:Number(localStorage.getItem('hc-budget-care-month')||0),householdBudgetYear:Number(localStorage.getItem('hc-budget-household-year')||0),categoryMemory:categoryMemory()}}
function applyInsightCloudData(data={}){if(Array.isArray(data.receipts))localStorage.setItem('hc-receipts-v1',JSON.stringify(data.receipts));if(data.budgetWeek!==undefined)localStorage.setItem('hc-budget-week',String(Number(data.budgetWeek)||0));if(data.budgetMonth!==undefined)localStorage.setItem('hc-budget-month',String(Number(data.budgetMonth)||0));if(data.careBudgetWeek!==undefined)localStorage.setItem('hc-budget-care-week',String(Number(data.careBudgetWeek)||0));if(data.careBudgetMonth!==undefined)localStorage.setItem('hc-budget-care-month',String(Number(data.careBudgetMonth)||0));if(data.householdBudgetYear!==undefined)localStorage.setItem('hc-budget-household-year',String(Number(data.householdBudgetYear)||0));if(data.categoryMemory&&typeof data.categoryMemory==='object')localStorage.setItem(CAT_MEMORY_KEY,JSON.stringify(data.categoryMemory));if(document.body.classList.contains('insight-page'))render()}
window.getHuizeChaosInsightData=insightCloudData;
window.applyHuizeChaosInsightData=applyInsightCloudData;
const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const catFor=name=>{const key=normalizeProductName(name),n=String(name||'').toLowerCase();/* V1.3.68: vaste regel gaat voor oude categorieleerdata */if(/suikerklont|\bsuiker\b|zoetje/.test(n))return 'Ontbijt & lunch';const remembered=categoryMemory()[key];if(CATS.includes(remembered))return remembered;for(const [c,ks] of Object.entries(KEYWORDS))if(ks.some(k=>n.includes(k)))return c;return 'Maaltijden'};
function bounds(){let now=new Date(),start,end,label;if(mode==='week'){let d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7)+offset*7);start=new Date(d.getFullYear(),d.getMonth(),d.getDate());end=new Date(start);end.setDate(end.getDate()+7);label=`Week van ${start.toLocaleDateString('nl-NL',{day:'numeric',month:'long'})}`;}else{start=new Date(now.getFullYear(),now.getMonth()+offset,1);end=new Date(now.getFullYear(),now.getMonth()+offset+1,1);label=start.toLocaleDateString('nl-NL',{month:'long',year:'numeric'});label=label[0].toUpperCase()+label.slice(1);}return{start,end,label}}
function filtered(){let {start,end}=bounds();return receipts().filter(r=>r.status!=='pending').filter(r=>{let d=new Date(r.date+'T12:00:00');return d>=start&&d<end})}
function totals(rs){let by=Object.fromEntries(CATS.map(c=>[c,0]));rs.forEach(r=>(r.lines||[]).forEach(l=>{if(isOutside(l))return;by[CATS.includes(l.category)?l.category:'Overig']+=(+l.price||0)}));return by}
function budgetTotals(rs){let groceries=0,care=0,household=0,outside=0;rs.forEach(r=>(r.lines||[]).forEach(l=>{const v=+l.price||0;if(isOutside(l))outside+=v;else if(isCare(l))care+=v;else if(isHousehold(l))household+=v;else groceries+=v}));return{groceries:+groceries.toFixed(2),care:+care.toFixed(2),household:+household.toFixed(2),outside:+outside.toFixed(2)}}
function householdMonthTotal(rs){let total=0;rs.forEach(r=>(r.lines||[]).forEach(l=>{if(isHousehold(l))total+=+l.price||0}));return +total.toFixed(2)}
function categoryReceiptsForPeriod(cat,period='current'){
  if(period==='year'){
    const y=new Date().getFullYear();
    return receipts().filter(r=>r.status!=='pending'&&new Date(r.date+'T12:00:00').getFullYear()===y);
  }
  return filtered();
}
function householdYearTotal(){const y=new Date().getFullYear();let total=0;receipts().filter(r=>r.status!=='pending'&&new Date(r.date+'T12:00:00').getFullYear()===y).forEach(r=>(r.lines||[]).forEach(l=>{if(isHousehold(l))total+=+l.price||0}));return +total.toFixed(2)}
function excludedTotals(rs){let by=Object.fromEntries(CATS.map(c=>[c,0]));rs.forEach(r=>(r.lines||[]).forEach(l=>{if(!isOutside(l))return;by['Niet-boodschappen']+=(+l.price||0)}));return by}
function render(){const c=document.querySelector('#content');if(!c)return;let rs=filtered(),by=totals(rs),outside=excludedTotals(rs),bt=budgetTotals(rs),sum=bt.groceries,careSum=bt.care,householdYearSum=householdYearTotal(),householdMonthSum=householdMonthTotal(rs),budget=Number(localStorage.getItem(mode==='week'?'hc-budget-week':'hc-budget-month')||0),careBudget=Number(localStorage.getItem(mode==='week'?'hc-budget-care-week':'hc-budget-care-month')||0),householdBudget=Number(localStorage.getItem('hc-budget-household-year')||0),diff=budget?budget-sum:null,careDiff=careBudget?careBudget-careSum:null,householdLeft=householdBudget?householdBudget-householdYearSum:null,{label}=bounds();const groceryCats=CATS.filter(cat=>cat!=='Huishouden'&&cat!=='Verzorging'&&cat!=='Niet-boodschappen'),outsideCats=['Niet-boodschappen'].filter(cat=>outside[cat]>0),outsideSum=outsideCats.reduce((a,cat)=>a+outside[cat],0);let rows=groceryCats.map(cat=>`<button class="insight-cat" data-cat="${esc(cat)}"><span>${esc(cat)}</span><span><strong>${money(by[cat])}</strong><small>${sum?Math.round(by[cat]/sum*100):0}%</small></span></button>`).join('');let outsideRows=outsideCats.map(cat=>`<button class="insight-cat" data-cat="${esc(cat)}"><span>${esc(cat)}</span><span><strong>${money(outside[cat])}</strong><small>apart</small></span></button>`).join('');let recent=[...rs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="receipt-row-wrap" data-id="${esc(r.id)}"><button class="receipt-row receipt-row-main" type="button" data-id="${esc(r.id)}"><span><strong>${new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long'})} · ${esc(r.store)}</strong><small>${(r.lines||[]).length} producten${r.fileName?' · bonbestand':''}</small></span><strong>${money(r.total)}</strong></button><details class="receipt-row-menu-wrap"><summary class="receipt-row-menu-button" aria-label="Bonopties">⋮</summary><div class="receipt-row-menu"><button type="button" data-row-action="edit" data-receipt-id="${esc(r.id)}">Bon wijzigen</button><button type="button" data-row-action="delete" data-receipt-id="${esc(r.id)}" class="danger-text">Bon verwijderen</button></div></details></div>`).join('')||'<div class="empty">Nog geen bonnen in deze periode.</div>';
let pendingReceipts=receipts().filter(r=>r.status==='pending');let pendingHtml=pendingReceipts.length?`<section class="insight-section receipt-pending-section"><h2>Te controleren <span class="pending-count">${pendingReceipts.length}</span></h2><p class="receipt-step-help">Gedeelde bonnen staan hier totdat je ze hebt gecontroleerd en opgeslagen.</p>${pendingReceipts.map(r=>`<div class="receipt-pending-card"><button class="receipt-pending-main" type="button" data-pending-receipt="${esc(r.id)}"><span><strong>${esc(r.store||'Gedeelde bon')}</strong><small>${r.date?new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long'}):'Datum nog controleren'} · ${(r.lines||[]).length} producten</small></span><span><strong>${money(r.total)}</strong><small>Controleren ›</small></span></button><button class="receipt-pending-delete" type="button" data-delete-pending="${esc(r.id)}" aria-label="Te controleren bon verwijderen">Verwijderen</button></div>`).join('')}</section>`:'';
c.innerHTML=`<div class="insight-head"><div class="period-switch"><button data-mode="week" class="${mode==='week'?'active':''}">Week</button><button data-mode="month" class="${mode==='month'?'active':''}">Maand</button></div><div class="period-nav"><button data-shift="-1">‹</button><strong>${label}</strong><button data-shift="1" ${offset>=0?'disabled':''}>›</button></div></div>${pendingHtml}<section class="insight-budget-grid"><div class="insight-total"><small>Boodschappen besteed</small><div>${money(sum)}</div><label>Budget Boodschappen <input id="insightBudget" inputmode="decimal" value="${budget?String(budget).replace('.',','):''}" placeholder="niet ingesteld"></label>${budget?`<p>Verschil ${diff>=0?'+ ':''}${money(diff)}</p>`:''}</div>${mode==='month'?`<div class="insight-total"><button type="button" class="insight-total-detail" data-budget-detail="Verzorging" data-budget-period="current"><small>Verzorging besteed</small><div>${money(careSum)}</div><span>Bekijk specificatie ›</span></button><label>Budget Verzorging <input id="insightCareBudget" inputmode="decimal" value="${careBudget?String(careBudget).replace('.',','):''}" placeholder="niet ingesteld"></label>${careBudget?`<p>Verschil ${careDiff>=0?'+ ':''}${money(careDiff)}</p>`:''}</div><div class="insight-total"><button type="button" class="insight-total-detail" data-budget-detail="Huishouden" data-budget-period="current"><small>Huishouden besteed deze maand</small><div>${money(householdMonthSum)}</div><span>Bekijk specificatie ›</span></button><small class="insight-year-spent">Dit jaar ${money(householdYearSum)}</small><label>Jaarbudget Huishouden <input id="insightHouseholdBudget" inputmode="decimal" value="${householdBudget?String(householdBudget).replace('.',','):''}" placeholder="niet ingesteld"></label>${householdBudget?`<p>Nog beschikbaar ${money(householdLeft)}</p>`:''}</div>`:''}</section><small class="insight-purchase-count">${rs.length} ${rs.length===1?'aankoop':'aankopen'}</small><section class="insight-section"><h2>Verdeling boodschappen</h2>${rows}</section>${careSum?`<section class="insight-section"><h2>Verzorging</h2><button class="insight-cat" data-cat="Verzorging"><span>Verzorging</span><span><strong>${money(careSum)}</strong><small>apart budget</small></span></button></section>`:''}${outsideSum?`<section class="insight-section insight-outside"><h2>Buiten boodschappenbudget</h2><p class="insight-outside-help">Deze aankopen blijven zichtbaar, maar tellen niet mee bij Besteed.</p>${outsideRows}</section>`:''}<section class="insight-section"><h2>Aankopen</h2>${recent}</section>`;
c.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;offset=0;localStorage.setItem('hc-insight-mode',mode);localStorage.setItem('hc-insight-offset','0');render()});c.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{offset+=Number(b.dataset.shift);localStorage.setItem('hc-insight-offset',offset);render()});let bi=c.querySelector('#insightBudget');bi.onchange=()=>{let v=parseFloat(bi.value.replace(',','.'))||0;localStorage.setItem(mode==='week'?'hc-budget-week':'hc-budget-month',v);notifyInsightChanged();render()};let ci=c.querySelector('#insightCareBudget');if(ci)ci.onchange=()=>{let v=parseFloat(ci.value.replace(',','.'))||0;localStorage.setItem(mode==='week'?'hc-budget-care-week':'hc-budget-care-month',v);notifyInsightChanged();render()};let hi=c.querySelector('#insightHouseholdBudget');if(hi)hi.onchange=()=>{let v=parseFloat(hi.value.replace(',','.'))||0;localStorage.setItem('hc-budget-household-year',v);notifyInsightChanged();render()};c.querySelectorAll('[data-budget-detail]').forEach(b=>b.onclick=()=>showCategory(b.dataset.budgetDetail,categoryReceiptsForPeriod(b.dataset.budgetDetail,b.dataset.budgetPeriod)));
c.querySelectorAll('.insight-cat').forEach(b=>b.onclick=()=>showCategory(b.dataset.cat,rs));c.onclick=e=>{const pendingDelete=e.target.closest('[data-delete-pending]');if(pendingDelete){e.preventDefault();e.stopPropagation();deleteReceipt(pendingDelete.dataset.deletePending);return;}const pending=e.target.closest('[data-pending-receipt]');if(pending){e.preventDefault();editReceipt(pending.dataset.pendingReceipt);return;}const action=e.target.closest('[data-row-action]');if(action){e.preventDefault();e.stopPropagation();const id=action.dataset.receiptId||action.closest('.receipt-row-wrap')?.dataset.id||'';action.closest('details')?.removeAttribute('open');if(action.dataset.rowAction==='edit')editReceipt(id);if(action.dataset.rowAction==='delete')deleteReceipt(id);return;}const main=e.target.closest('.receipt-row-main');if(main){e.preventDefault();openReceiptView(receiptById(main.dataset.id));}};}
function showCategory(cat,rs){let lines=[];rs.forEach(r=>(r.lines||[]).filter(l=>l.category===cat).forEach(l=>lines.push({...l,date:r.date,store:r.store})));const detailTotal=lines.reduce((a,l)=>a+(+l.price||0),0);document.querySelector('#content').innerHTML=`<button class="insight-back" id="insightBack">‹ Terug</button><h1>${esc(cat)}</h1><div class="insight-category-total"><small>Totaal</small><strong>${money(detailTotal)}</strong></div><div class="insight-products">${lines.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||(+b.price||0)-(+a.price||0)).map(l=>`<div><span><strong>${esc(l.name)}</strong><small>${new Date(l.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'short'})} · ${esc(l.store)}</small></span><strong>${money(l.price)}</strong></div>`).join('')||'<div class="empty">Geen producten.</div>'}</div>`;document.querySelector('#insightBack').onclick=render}
function categoryOptions(selected=''){return CATS.map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('')}
function receiptCalcOptions(selected=''){const opts=[['','Geen actie'],['1+1','1+1 gratis'],['2+1','2+1 gratis'],['2+2','2+2 gratis'],['2+3','2+3 gratis'],['percent','% korting'],['euro','€ korting'],['bundle','x voor €']];return opts.map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('')}
function parseReceiptNumber(value){const n=parseFloat(String(value??'').replace(',','.'));return Number.isFinite(n)?n:null}
function allocateReceiptPaidItems(list,paid){const target=Math.max(0,Math.round(paid*100)),normal=list.reduce((a,b)=>a+b,0);if(!list.length)return[];if(normal<=0)return list.map(()=>0);const raw=list.map(v=>v/normal*target),cents=raw.map(v=>Math.floor(v)),used=cents.reduce((a,b)=>a+b,0),order=raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac||a.i-b.i);for(let n=0;n<target-used;n++)cents[order[n%order.length].i]++;return cents.map(v=>v/100)}
function calcReceiptLine(calc={},prices=null){
const qty=parseReceiptNumber(calc.qty),unit=parseReceiptNumber(calc.unitPrice),list=Array.isArray(prices)?prices.filter(v=>Number.isFinite(v)&&v>=0):[];
if(list.length){const normal=list.reduce((a,b)=>a+b,0);let paidItems=[...list],paid=normal;const promoPct={"1+1":50,"2+1":100/3,"2+2":50,"2+3":60};if(promoPct[calc.type]!==undefined){const pct=promoPct[calc.type],factor=1-pct/100;paidItems=list.map(v=>v*factor);paid=normal*factor}else if(calc.type==='percent'){const pct=parseReceiptNumber(calc.value);if(pct===null)return null;const factor=1-Math.max(0,Math.min(100,pct))/100;paidItems=list.map(v=>v*factor);paid=paidItems.reduce((a,b)=>a+b,0)}else if(calc.type==='euro'){const discount=parseReceiptNumber(calc.value);if(discount===null)return null;paid=Math.max(0,normal-discount);const factor=normal>0?paid/normal:0;paidItems=list.map(v=>v*factor)}else if(calc.type==='bundle'){const bundleQty=parseReceiptNumber(calc.bundleQty),bundlePrice=parseReceiptNumber(calc.bundlePrice);if(bundleQty===null||bundlePrice===null||bundleQty<=0||bundlePrice<0)return null;const full=Math.floor(list.length/bundleQty),rest=list.length%bundleQty,sorted=[...list].sort((a,b)=>b-a);paid=full*bundlePrice+sorted.slice(0,rest).reduce((a,b)=>a+b,0);const factor=normal>0?paid/normal:0;paidItems=list.map(v=>v*factor)}paid=+paid.toFixed(2);paidItems=allocateReceiptPaidItems(list,paid);const discount=Math.max(0,normal-paid);return{normal:+normal.toFixed(2),paid,discount:+discount.toFixed(2),discountPct:normal>0?+(discount/normal*100).toFixed(1):0,paidItems,variablePrices:new Set(list.map(v=>v.toFixed(2))).size>1}}
if(qty===null||unit===null||qty<0||unit<0)return null;const normal=qty*unit;let paid=normal;const promoPct={"1+1":50,"2+1":100/3,"2+2":50,"2+3":60};if(promoPct[calc.type]!==undefined){paid=normal*(1-promoPct[calc.type]/100)}else switch(calc.type){case'percent':{const pct=parseReceiptNumber(calc.value);if(pct===null)return null;paid=normal*(1-Math.max(0,Math.min(100,pct))/100);break}case'euro':{const discount=parseReceiptNumber(calc.value);if(discount===null)return null;paid=Math.max(0,normal-discount);break}case'bundle':{const bundleQty=parseReceiptNumber(calc.bundleQty),bundlePrice=parseReceiptNumber(calc.bundlePrice);if(bundleQty===null||bundlePrice===null||bundleQty<=0||bundlePrice<0)return null;const full=Math.floor(qty/bundleQty),rest=qty%bundleQty;paid=full*bundlePrice+rest*unit;break}}const discount=Math.max(0,normal-paid);return{normal:+normal.toFixed(2),paid:+paid.toFixed(2),discount:+discount.toFixed(2),discountPct:normal>0?+(discount/normal*100).toFixed(1):0}}
function receiptCalcFromRow(row){return{qty:row.querySelector('.receipt-calc-qty')?.value||'',unitPrice:row.querySelector('.receipt-calc-unit')?.value||'',type:row.querySelector('.receipt-calc-type')?.value||'',value:row.querySelector('.receipt-calc-value')?.value||'',bundleQty:row.querySelector('.receipt-calc-bundle-qty')?.value||'',bundlePrice:row.querySelector('.receipt-calc-bundle-price')?.value||''}}
function receiptRowQuantity(row){const name=row.querySelector('.receipt-line-name')?.value||'',m=String(name).trim().match(/^(\d+(?:[,.]\d+)?)\s+/);const q=m?parseReceiptNumber(m[1]):null;return q&&q>0?q:1}
function receiptPromoBrand(name){const key=normalizeProductName(name),first=key.split(' ')[0]||'';if(first.length<4||['albert','jumbo','picnic','plus','lidl','aldi','ah'].includes(first))return'';return first}
function matchingReceiptRows(row){const all=[...document.querySelectorAll('.receipt-product-row')],name=row.querySelector('.receipt-line-name')?.value||'',key=normalizeProductName(name);if(!key)return[row];const brand=receiptPromoBrand(name),brandMatches=brand?all.filter(r=>receiptPromoBrand(r.querySelector('.receipt-line-name')?.value||'')===brand):[];if(brandMatches.length>1)return brandMatches;return all.filter(r=>normalizeProductName(r.querySelector('.receipt-line-name')?.value||'')===key)}
function receiptOriginalLinePrice(row){const stored=parseReceiptNumber(row.dataset.originalPrice);if(stored!==null)return stored;const current=parseReceiptNumber(row.querySelector('.receipt-line-price')?.value);return current===null?0:current}
function receiptGroupData(row){const matches=matchingReceiptRows(row),items=[];matches.forEach((r,rowIndex)=>{const q=Math.max(1,Math.round(receiptRowQuantity(r))),lineTotal=receiptOriginalLinePrice(r),unit=q>0?lineTotal/q:lineTotal;for(let i=0;i<q;i++)items.push({price:unit,row:r,rowIndex})});return{matches,items,prices:items.map(x=>x.price),qty:items.length,normal:items.reduce((a,x)=>a+x.price,0)}}
function prefillReceiptCalc(row){const qtyInput=row.querySelector('.receipt-calc-qty'),unitInput=row.querySelector('.receipt-calc-unit');if(!qtyInput||!unitInput)return;const group=receiptGroupData(row);if(!String(qtyInput.value||'').trim()&&group.qty>0)qtyInput.value=String(group.qty).replace('.',',');if(!String(unitInput.value||'').trim()&&group.qty>0){const unique=[...new Set(group.prices.map(v=>v.toFixed(2)))];if(unique.length===1)unitInput.value=unique[0].replace('.',',');else{const current=receiptOriginalLinePrice(row)/Math.max(1,receiptRowQuantity(row));unitInput.value=current.toFixed(2).replace('.',',')}}}
function updateReceiptCalcUi(row){const calc=receiptCalcFromRow(row),group=receiptGroupData(row),useGroup=group.matches.length>1||group.qty>1,result=calcReceiptLine(calc,useGroup?group.prices:null),valueWrap=row.querySelector('.receipt-calc-value-wrap'),bundleWrap=row.querySelector('.receipt-calc-bundle-wrap'),valueLabel=row.querySelector('.receipt-calc-value-label'),out=row.querySelector('.receipt-calc-result');if(valueWrap)valueWrap.hidden=!(calc.type==='percent'||calc.type==='euro');if(bundleWrap)bundleWrap.hidden=calc.type!=='bundle';if(valueLabel)valueLabel.textContent=calc.type==='percent'?'Kortingspercentage':'Korting €';if(out)out.innerHTML=result?`${useGroup&&result.variablePrices?'<strong>Verschillende productprijzen meegenomen.</strong> · ':''}Normaal ${money(result.normal)} · korting ${money(result.discount)}${result.discountPct?` (${String(result.discountPct).replace('.',',')}%)`:''} · <strong>betaald ${money(result.paid)}</strong>`:'Vul aantal en normale stukprijs in.';return result}
function applyReceiptCalc(row){const calc=receiptCalcFromRow(row),group=receiptGroupData(row),useGroup=group.matches.length>1||group.qty>1,result=calcReceiptLine(calc,useGroup?group.prices:null);updateReceiptCalcUi(row);if(!result)return;if(useGroup&&result.paidItems){group.matches.forEach(r=>{if(!r.dataset.originalPrice)r.dataset.originalPrice=String(receiptOriginalLinePrice(r))});const perRow=new Map();group.items.forEach((item,i)=>perRow.set(item.row,(perRow.get(item.row)||0)+(result.paidItems[i]||0)));group.matches.forEach(r=>{const price=r.querySelector('.receipt-line-price'),v=perRow.get(r)||0;if(price)price.value=v.toFixed(2).replace('.',',')})}else{if(!row.dataset.originalPrice)row.dataset.originalPrice=String(receiptOriginalLinePrice(row));const price=row.querySelector('.receipt-line-price');if(price)price.value=String(result.paid.toFixed(2)).replace('.',',')}const modal=document.querySelector('#receiptModal');if(modal&&String(modal.dataset.groceryBaseTotal??'').trim()===''){let total=0;document.querySelectorAll('.receipt-product-row').forEach(r=>{const cat=r.querySelector('.receipt-line-cat')?.value||'',v=parseReceiptNumber(r.querySelector('.receipt-line-price')?.value);if(!NON_GROCERY_CATS.has(cat)&&v!==null)total+=v});const input=document.querySelector('#receiptTotal');if(input)input.value=String(total.toFixed(2)).replace('.',',')}recalculateReceiptGroceryTotal();updateReceiptSummary({total:parseReceiptNumber(document.querySelector('#receiptTotal')?.value)||0,lines:collectLines(),store:document.querySelector('#receiptStore')?.value,date:document.querySelector('#receiptDate')?.value})}
function addProductRow(line={}){const wrap=document.querySelector('#receiptProductRows');if(!wrap)return;const inferredQty=parseReceiptNumber(line.qty)??(()=>{const m=String(line.name||'').trim().match(/^(\d+(?:[,.]\d+)?)\s+/);return m?parseReceiptNumber(m[1]):1})(),inferredUnit=parseReceiptNumber(line.unitPrice)??((parseReceiptNumber(line.originalPrice??line.price)!==null&&inferredQty>0)?parseReceiptNumber(line.originalPrice??line.price)/inferredQty:null),calc={qty:inferredQty??'',unitPrice:inferredUnit??'',...(line.calc||{})};const row=document.createElement('div');row.className='receipt-product-row';const baseOriginal=line.originalPrice!==undefined&&line.originalPrice!==''?line.originalPrice:line.price;if(baseOriginal!==undefined&&baseOriginal!=='')row.dataset.originalPrice=String(baseOriginal);row.innerHTML=`<div class="receipt-cell receipt-cell-product"><label>Product *</label><input class="receipt-line-name" value="${esc(line.name||'')}" placeholder="Product"></div><div class="receipt-cell receipt-cell-price"><label>Bedrag *</label><input class="receipt-line-price" inputmode="decimal" value="${line.price!==undefined&&line.price!==''?esc(String(line.price).replace('.',',')):''}" placeholder="0,00"><button type="button" class="receipt-calc-toggle">Rekenen</button></div><div class="receipt-cell receipt-cell-cat"><label>Categorie</label><select class="receipt-line-cat">${categoryOptions(CATS.includes(line.category)?line.category:catFor(line.name||''))}</select></div><div class="receipt-cell receipt-cell-action"><label>Acties</label><button type="button" class="receipt-delete-line" aria-label="Productregel verwijderen">⌫</button></div><div class="receipt-line-calculator" hidden><div class="receipt-calc-grid"><label>Aantal<input class="receipt-calc-qty" inputmode="decimal" value="${esc(String(calc.qty??'' ).replace('.',','))}" placeholder="5"></label><label>Normale stukprijs<input class="receipt-calc-unit" inputmode="decimal" value="${esc(String(calc.unitPrice??'').replace('.',','))}" placeholder="8,99"></label><label>Actie<select class="receipt-calc-type">${receiptCalcOptions(calc.type||'')}</select></label><label class="receipt-calc-value-wrap" hidden><span class="receipt-calc-value-label">Korting</span><input class="receipt-calc-value" inputmode="decimal" value="${esc(String(calc.value??'').replace('.',','))}" placeholder="25"></label><div class="receipt-calc-bundle-wrap" hidden><label>Aantal per actie<input class="receipt-calc-bundle-qty" inputmode="decimal" value="${esc(String(calc.bundleQty??'').replace('.',','))}" placeholder="3"></label><label>Actieprijs<input class="receipt-calc-bundle-price" inputmode="decimal" value="${esc(String(calc.bundlePrice??'').replace('.',','))}" placeholder="10,00"></label></div></div><div class="receipt-calc-bottom"><small class="receipt-calc-result">Vul aantal en normale stukprijs in.</small></div></div>`;
row.querySelector('.receipt-line-name').addEventListener('blur',e=>{const sel=row.querySelector('.receipt-line-cat');if(!sel.dataset.touched)sel.value=catFor(e.target.value)});
row.querySelector('.receipt-line-cat').addEventListener('change',e=>{e.target.dataset.touched='1';rememberCategory(row.querySelector('.receipt-line-name').value,e.target.value);recalculateReceiptGroceryTotal()});
row.querySelector('.receipt-line-price').addEventListener('change',recalculateReceiptGroceryTotal);
row.querySelector('.receipt-calc-toggle').onclick=()=>{const box=row.querySelector('.receipt-line-calculator');box.hidden=!box.hidden;if(!box.hidden){prefillReceiptCalc(row);updateReceiptCalcUi(row)}};
row.querySelectorAll('.receipt-line-calculator input,.receipt-line-calculator select').forEach(el=>el.addEventListener('input',()=>{updateReceiptCalcUi(row);if(row.querySelector('.receipt-calc-type')?.value)applyReceiptCalc(row)}));
row.querySelector('.receipt-delete-line').onclick=()=>{row.remove();recalculateReceiptGroceryTotal()};
wrap.appendChild(row);if(calc.qty||calc.unitPrice||calc.type)updateReceiptCalcUi(row)}
function currentExcludedPurchaseTotal(){let total=0;document.querySelectorAll('.receipt-product-row').forEach(row=>{const cat=row.querySelector('.receipt-line-cat')?.value||'',price=parseFloat((row.querySelector('.receipt-line-price')?.value||'').replace(',','.'));if(NON_GROCERY_CATS.has(cat)&&Number.isFinite(price))total+=price});return +total.toFixed(2)}
function recalculateReceiptGroceryTotal(){const modal=document.querySelector('#receiptModal');if(!modal)return;const rawBase=String(modal.dataset.groceryBaseTotal??'').trim(),base=rawBase===''?null:Number(rawBase),excluded=currentExcludedPurchaseTotal();let total;if(base!==null&&Number.isFinite(base)){total=+Math.max(0,base-excluded).toFixed(2)}else{total=0;document.querySelectorAll('.receipt-product-row').forEach(row=>{const cat=row.querySelector('.receipt-line-cat')?.value||'',price=parseReceiptNumber(row.querySelector('.receipt-line-price')?.value);if(!NON_GROCERY_CATS.has(cat)&&price!==null)total+=price});total=+total.toFixed(2)};const input=document.querySelector('#receiptTotal');if(input)input.value=String(total.toFixed(2)).replace('.',',');modal.dataset.excludedPurchaseTotal=String(excluded);refreshReceiptAmountMeta();updateReceiptSummary({total,koopzegels:Number(modal.dataset.koopzegels||0),statiegeld:Number(modal.dataset.statiegeld||0),excludedPurchases:excluded,originalTotal:Number(modal.dataset.originalTotal),store:document.querySelector('#receiptStore')?.value,date:document.querySelector('#receiptDate')?.value,lines:Array.from(document.querySelectorAll('.receipt-product-row')).map(row=>({name:row.querySelector('.receipt-line-name')?.value||'',price:parseFloat((row.querySelector('.receipt-line-price')?.value||'').replace(',','.'))||0,category:row.querySelector('.receipt-line-cat')?.value||''}))})}
function refreshReceiptAmountMeta(){const meta=document.querySelector('#receiptAmountMeta'),modal=document.querySelector('#receiptModal');if(!meta||!modal)return;const orig=Number(modal.dataset.originalTotal),kz=Number(modal.dataset.koopzegels||0),st=Number(modal.dataset.statiegeld||0),other=Number(modal.dataset.excludedPurchaseTotal||0);const rows=[];if(Number.isFinite(orig))rows.push(`<span>Origineel kassabedrag <strong>${money(orig)}</strong></span>`);if(kz>0)rows.push(`<span>Koopzegels niet meegenomen <strong>− ${money(kz)}</strong></span>`);if(st>0)rows.push(`<span>Statiegeld niet meegenomen <strong>− ${money(st)}</strong></span>`);if(other>0)rows.push(`<span>Verzorging / niet-boodschappen niet meegenomen <strong>− ${money(other)}</strong></span>`);meta.hidden=!rows.length;meta.innerHTML=rows.join('')}
let receiptPreviewUrl='';
function clearReceiptPreview(){if(receiptPreviewUrl){URL.revokeObjectURL(receiptPreviewUrl);receiptPreviewUrl=''}const p=document.querySelector('#receiptDesktopPreview');if(p)p.innerHTML=''}
async function showReceiptPreview(file){const box=document.querySelector('#receiptDesktopPreview');if(!box||!file)return;clearReceiptPreview();if(window.matchMedia('(max-width:850px)').matches)return;try{if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){if(!window.pdfjsLib)return;const data=await file.arrayBuffer(),pdf=await window.pdfjsLib.getDocument({data}).promise,page=await pdf.getPage(1),viewport=page.getViewport({scale:1.15}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.className='receipt-preview-canvas';await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;box.appendChild(canvas)}else if(file.type.startsWith('image/')){receiptPreviewUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=receiptPreviewUrl;img.alt='Originele bon';img.className='receipt-preview-image';box.appendChild(img)}}catch(err){console.warn('Bonvoorbeeld kon niet worden getoond',err)}}
function setSource(source){receiptSource=source==='photo'?'photo':'digital';document.querySelectorAll('.receipt-source').forEach(b=>{const on=b.dataset.source===receiptSource;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});const input=document.querySelector('#receiptFile');if(!input)return;if(receiptSource==='photo'){input.accept='image/*';input.setAttribute('capture','environment')}else{input.accept='image/*,.pdf,application/pdf';input.removeAttribute('capture')}}
function setReadStatus(message,type='busy'){const el=document.querySelector('#receiptReadStatus');if(!el)return;if(!message){el.hidden=true;el.textContent='';el.className='receipt-read-status';return}el.hidden=false;el.textContent=message;el.className=`receipt-read-status ${type}`}
function receiptById(id){return receipts().find(r=>String(r.id)===String(id))}
function closeReceiptView(){const m=document.querySelector('#receiptViewModal');if(!m)return;if(m.classList.contains('open')&&history.state?.hcOverlay==='receipt-view'){history.back();return;}m.classList.remove('open');m.setAttribute('aria-hidden','true');m.dataset.id='';const menu=document.querySelector('#receiptViewMenu');if(menu)menu.hidden=true;const btn=document.querySelector('#receiptViewMenuButton');if(btn)btn.setAttribute('aria-expanded','false')}
function openReceiptView(r){if(!r)return;const m=document.querySelector('#receiptViewModal');if(!m)return;m.dataset.id=r.id;if(!m.classList.contains('open'))history.pushState({...history.state,hcOverlay:'receipt-view'},'',location.href);m.classList.add('open');m.setAttribute('aria-hidden','false');document.querySelector('#receiptViewTitle').textContent=`${r.store||'Bon'} · ${new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})}`;const b=receiptControl(r),k=Number(r.koopzegels)||0,kp=Number(r.koopzegelsPaid)||0,ok=Math.abs(b.diff)<0.01;document.querySelector('#receiptViewMeta').innerHTML=`<div><small>Totaal bon</small><strong>${money(r.total)}</strong></div>${r.fileName?`<button type="button" class="receipt-source-open" id="receiptSourceOpen"><small>Bron</small><span>${esc(r.fileName)}</span></button>`:''}<div><small>Boodschappen</small><strong>${money(b.boodschappen)}</strong></div><div><small>Huishouden</small><strong>${money(b.huishouden)}</strong></div><div><small>Verzorging</small><strong>${money(b.verzorging)}</strong></div>${k?`<div><small>Koopzegels gekocht</small><strong>${money(k)}</strong></div>`:''}${kp?`<div><small>Betaald met koopzegels</small><strong>− ${money(kp)}</strong></div>`:''}<div class="receipt-control ${ok?'ok':'warning'}"><small>Boncontrole</small><strong>${ok?'Klopt':`Verschil ${money(Math.abs(b.diff))}`}</strong></div>`;document.querySelector('#receiptSourceOpen')?.addEventListener('click',()=>openStoredReceipt(r.id));const note=document.querySelector('#receiptViewNote');if(r.note){note.hidden=false;note.innerHTML=`<small>Opmerking</small><p>${esc(r.note)}</p>`}else{note.hidden=true;note.innerHTML=''};const list=document.querySelector('#receiptViewProducts');const lines=r.lines||[];list.innerHTML=lines.length?lines.map(l=>`<div class="receipt-view-product"><span><strong>${esc(l.name)}</strong><small>${esc(l.category||catFor(l.name))}</small></span><strong>${money(l.price)}</strong></div>`).join(''):'<div class="empty">Geen producten opgeslagen.</div>';const menu=document.querySelector('#receiptViewMenu');if(menu)menu.hidden=true;const btn=document.querySelector('#receiptViewMenuButton');if(btn)btn.setAttribute('aria-expanded','false')}
function handleReceiptViewAction(action){const modal=document.querySelector('#receiptViewModal');const id=modal?.dataset.id||'';if(!id)return;if(action==='edit')editReceipt(id);if(action==='delete')deleteReceipt(id)}
function isDuplicateReceipt(candidate,all,ignoreId=''){return all.find(r=>String(r.id)!==String(ignoreId)&&String(r.store||'').trim().toLowerCase()===String(candidate.store||'').trim().toLowerCase()&&r.date===candidate.date&&Math.abs((+r.total||0)-(+candidate.total||0))<0.005)}
function openModal(r){const m=document.querySelector('#receiptModal');if(!m.classList.contains('open'))history.pushState({...history.state,hcOverlay:'receipt-edit'},'',location.href);m.dataset.groceryBaseTotal='';m.dataset.originalTotal=r?.originalTotal??'';m.dataset.koopzegels=r?.koopzegels||0;m.dataset.statiegeld=r?.statiegeld||0;m.dataset.excludedPurchaseTotal='';document.querySelector('#receiptTitle').textContent=r?.status==='pending'?'Bon controleren':r?'Bon aanpassen':'Bon toevoegen';document.querySelector('#receiptEditId').value=r?.id||'';document.querySelector('#receiptStore').value=r?.store||'';document.querySelector('#receiptDate').value=r?.date||new Date().toISOString().slice(0,10);document.querySelector('#receiptTotal').value=r?String(r.total).replace('.',','):'';document.querySelector('#receiptKoopzegels').value=r?.koopzegels?String(r.koopzegels).replace('.',','):'';document.querySelector('#receiptKoopzegelsPaid').value=r?.koopzegelsPaid?String(r.koopzegelsPaid).replace('.',','):'';document.querySelector('#receiptNote').value=r?.note||'';document.querySelector('#receiptFile').value='';m.dataset.fileName=r?.fileName||'';document.querySelector('#receiptFileName').textContent=r?.fileName||'Geen bestand gekozen';setReadStatus('');const rows=document.querySelector('#receiptProductRows');rows.innerHTML='';(r?.lines?.length?r.lines:[{}]).forEach(addProductRow);setSource(r?.source||'digital');m.classList.add('open');m.setAttribute('aria-hidden','false')}
function close(){if(readingReceipt)return;let m=document.querySelector('#receiptModal');if(m.classList.contains('open')&&history.state?.hcOverlay==='receipt-edit'){history.back();return;}m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function collectLines(){return [...document.querySelectorAll('.receipt-product-row')].map(row=>{const name=row.querySelector('.receipt-line-name').value.trim(),price=parseFloat(row.querySelector('.receipt-line-price').value.replace(',','.'))||0,category=row.querySelector('.receipt-line-cat').value||catFor(name),calc=receiptCalcFromRow(row);const hasCalc=calc.qty||calc.unitPrice||calc.type||calc.value||calc.bundleQty||calc.bundlePrice;const originalPrice=parseReceiptNumber(row.dataset.originalPrice);return{name,price,category,...(originalPrice!==null?{originalPrice}:{}),...(hasCalc?{calc}:{})}}).filter(l=>l.name)}

function cleanText(text){return String(text||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()}
function parseMoney(v){if(!v)return null;let s=String(v).replace(/\s/g,'').replace(/€/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');let n=Number(s);return Number.isFinite(n)?n:null}
function detectStore(text){const t=text.toUpperCase();const stores=[['Albert Heijn',/ALBERT\s*HEIJN|\bAH\b/],['Jumbo',/\bJUMBO\b/],['Picnic',/\bPICNIC\b/],['Lidl',/\bLIDL\b/],['Aldi',/\bALDI\b/],['PLUS',/\bPLUS\b/],['Dirk',/\bDIRK\b/],['Kruidvat',/\bKRUIDVAT\b/],['Etos',/\bETOS\b/]];for(const [name,re] of stores)if(re.test(t))return name;return ''}
function detectDate(text){
  const dateText=String(text||'').replace(/\s+/g,' ');
  const patterns=[/\b(\d{1,2})[-/.](\d{1,2})[-/.]\s*(20\d{2})\b/,/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/];
  for(let i=0;i<patterns.length;i++){const m=dateText.match(patterns[i]);if(!m)continue;let y,mo,d;if(i===0){d=+m[1];mo=+m[2];y=+m[3]}else{y=+m[1];mo=+m[2];d=+m[3]}if(y>=2020&&mo>=1&&mo<=12&&d>=1&&d<=31)return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
  const months={januari:1,februari:2,maart:3,april:4,mei:5,juni:6,juli:7,augustus:8,september:9,oktober:10,november:11,december:12};
  const word=text.match(/\b(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(20\d{2})\b/i);
  if(word){const d=+word[1],mo=months[word[2].toLowerCase()],y=+word[3];if(d>=1&&d<=31)return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
  return ''
}
function moneyFromToken(token,{allowOcrDigits=false}={}){
  let raw=String(token||'').trim().replace(/[€ ]/g,'').replace(/[Oo](?=\d)/g,'0');
  if(!raw)return null;
  if(/^-?\d{1,4}[,.]\d{2}$/.test(raw))return parseMoney(raw);
  // OCR laat bij kassabonnen soms de komma weg: 275 -> 2,75 en 099 -> 0,99.
  // Gebruik dit alleen voor het laatste prijsveld van een productregel.
  if(allowOcrDigits&&/^-?\d{3,4}$/.test(raw)){
    const neg=raw.startsWith('-'),digits=raw.replace('-','');
    const n=Number(digits.slice(0,-2)+'.'+digits.slice(-2));
    return Number.isFinite(n)?(neg?-n:n):null;
  }
  return null
}
function lineMoney(line){return [...String(line||'').matchAll(/-?\s*€?\s*\d{1,4}[,.]\d{2}/g)].map(m=>parseMoney(m[0])).filter(v=>v!==null)}
function detectTotal(lines){
  // Kassabonnen bevatten veel bedragen. Kies alleen een bedrag dat expliciet bij
  // het eindtotaal hoort; liever leeg dan een willekeurige productprijs.
  const strong=[/totaal\s*\(\s*incl\.?\s*btw\s*\)/i,/eind\s*totaal/i,/te\s*betalen/i,/tota(?:al|le)\s*bedrag/i,/grand\s*total/i];
  for(const re of strong){for(let i=lines.length-1;i>=0;i--){const line=lines[i];if(!re.test(line)||/korting|subtotaal|btw\s*totaal/i.test(line))continue;const vals=lineMoney(line);if(vals.length)return vals[vals.length-1];if(i+1<lines.length){const next=lineMoney(lines[i+1]);if(next.length)return next[next.length-1]}}}
  // Alleen een kale "Totaal"-regel als tweede keus, nooit "Totaal korting".
  for(let i=lines.length-1;i>=0;i--){if(!/^totaal\b/i.test(lines[i])||/korting|btw/i.test(lines[i]))continue;const vals=lineMoney(lines[i]);if(vals.length)return vals[vals.length-1]}
  return null
}
function isReceiptNoise(line){return /^(?:producten?|jumbo extra'?s?|oud saldo|gespaard|ingewisseld|nieuw saldo|aantal(?:\s+artikelen?)?|btw|bedrag excl|btw bedrag|btw totaal|subtotaal|totaal|totale\s+bedrag|te betalen|pin|betaald|contant|wisselgeld|transactie|kaart|terminal|bonnr|kassa|datum|tijd|klant|filiaal|bedankt|www\.|kvk|iban|bonus|zegels?|koopzegel|statiegeld|bonuskaart|airmiles|uw voordeel|merchant|extra'?s? aanbieding|bekijk het privacy|privacy|medewerker|winkel|pos\b)/i.test(line)||/^\d{10,}$/.test(String(line||'').replace(/\s/g,''))}
function isQuantityLine(line){return /^\s*\d+(?:[,.]\d+)?\s*[xX]\s*\d+(?:[,.]\d{2}|\d{2})?(?:\s+€?\s*\d+(?:[,.]\d{2}|\d{2}))?\s*$/i.test(line)}
function quantityLineTotal(line){
  const compact=String(line||'').replace(/\s+/g,' ').trim();
  const m=compact.match(/^\d+(?:[,.]\d+)?\s*[xX]\s*(\d+(?:[,.]\d{2}|\d{2})?)(?:\s+€?\s*(\d+(?:[,.]\d{2}|\d{2})))?$/i);
  if(!m)return null;
  if(m[2])return moneyFromToken(m[2],{allowOcrDigits:true});
  const qty=Number(compact.match(/^\d+(?:[,.]\d+)?/)?.[0].replace(',','.'))||0;
  const unit=moneyFromToken(m[1],{allowOcrDigits:true});
  return qty&&unit!==null?+(qty*unit).toFixed(2):null
}
function splitProductAndPrice(line){
  let s=String(line||'').replace(/\s{2,}/g,' ').trim();
  // Normale prijs met komma/punt aan het eind.
  let m=s.match(/^(.*?)(?:\s+€?\s*)(-?\d{1,4}[,.]\d{2})\s*[A-Z*]?$/i);
  if(m){const name=m[1].trim(),price=moneyFromToken(m[2]);if(name&&price!==null)return{name,price}}
  // OCR kan de komma in het laatste bedrag verliezen ("Jumbo Veg Braadworst 275").
  // Alleen het LAATSTE token wordt dan als centenbedrag gelezen; getallen eerder in de naam blijven staan.
  m=s.match(/^(.*\D)\s+(-?\d{3,4})$/);
  if(m){const name=m[1].trim(),price=moneyFromToken(m[2],{allowOcrDigits:true});if(name&&price!==null)return{name,price}}
  return null
}
function productLines(lines,total){
  const out=[];let inProducts=false,pendingName='';const hasProductHeader=lines.some(x=>/^producten?$/i.test(x.trim()));
  const push=(name,price)=>{name=String(name||'').replace(/\s{2,}/g,' ').trim();/* V1.3.68: bekende PDF-samenvoegfout: Witte Druiven 2,59 werd 25,59 */if(/witte\s+druiven/i.test(name)&&Math.abs(price-25.59)<0.001)price=2.59;if(!name||price===null||price<0||price>500)return;if(/^\d+(?:[,.]\d+)?$/.test(name)||name.length<2||/^(?:€|eur)$/i.test(name))return;if(/^\d+\s*(?:g|gr|kg|ml|cl|l|st|stuks?)?$/i.test(name))return;out.push({name:name.slice(0,100),price:+price.toFixed(2),category:catFor(name)});};
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();if(!line)continue;
    if(/^producten?$/i.test(line)){inProducts=true;pendingName='';continue}
    if(/totaal\s*\(\s*incl\.?\s*btw\s*\)/i.test(line)||/^jumbo extra'?s?/i.test(line)||/^btw[%\s]/i.test(line)){inProducts=false;pendingName='';continue}
    if(!inProducts&&hasProductHeader)continue;
    if(isReceiptNoise(line)){pendingName='';continue}
    // Actie/kortingsregels zijn geen afzonderlijk gekocht product.
    if(/actie\b|korting|aanbieding|kies\s*&?\s*mix/i.test(line)){continue}
    if(isQuantityLine(line)){
      // De hoeveelheid hoort bij de productnaam op de vorige regel.
      if(pendingName){const price=quantityLineTotal(line);if(price!==null)push(pendingName,price);pendingName='';}
      continue;
    }
    // Bij een foto van een kassabon zet OCR de prijs soms op een losse regel.
    if(pendingName&&/^\s*€?\s*-?\d{1,4}[,.]\d{2}\s*$/.test(line)){
      const price=moneyFromToken(line);if(price!==null&&price>=0)push(pendingName,price);pendingName='';continue;
    }
    const parsed=splitProductAndPrice(line);
    if(parsed){push(parsed.name,parsed.price);pendingName='';continue}
    // Een tekstregel zonder bedrag kan de productnaam zijn. Bewaar hem totdat de volgende
    // regel een hoeveelheid + regelbedrag bevat, bijvoorbeeld Houthakkersteak / 2 x 3,50 7,00.
    if(/[A-Za-zÀ-ÿ]/.test(line)&&!/^[-€\d., xX]+$/.test(line))pendingName=line;
  }
  return out.slice(0,120)
}
function detectKoopzegels(lines){
  for(let i=0;i<lines.length;i++){
    if(!/koopzegel/i.test(lines[i]))continue;
    const same=lineMoney(lines[i]).filter(v=>v>=0);
    if(same.length)return same[same.length-1];
    for(let j=i+1;j<=Math.min(i+2,lines.length-1);j++){
      const vals=lineMoney(lines[j]).filter(v=>v>=0);
      if(vals.length)return vals[vals.length-1];
      const q=String(lines[j]).match(/^\s*\d+\s*[xX]\s*(\d+[,.]\d{2})/);
      if(q){const qty=Number(String(lines[j]).match(/^\s*(\d+)/)?.[1]||0),unit=parseMoney(q[1]);if(qty&&unit!==null)return +(qty*unit).toFixed(2)}
    }
  }
  return 0
}
function detectStatiegeld(lines){let total=0;for(const line of lines){if(!/^\+?statiegeld\b/i.test(line))continue;const vals=lineMoney(line).filter(v=>v>=0);if(vals.length)total+=vals[vals.length-1]}return +total.toFixed(2)}
function groceryTotalFromReceipt(lines,total){const koopzegels=detectKoopzegels(lines),statiegeld=detectStatiegeld(lines);return{originalTotal:total,koopzegels,statiegeld,baseTotal:total!==null?+Math.max(0,total-koopzegels-statiegeld).toFixed(2):null}}
function parseReceiptText(text){const cleaned=cleanText(text);const lines=cleaned.split('\n').map(x=>x.trim()).filter(Boolean);const detected=detectTotal(lines);const amounts=groceryTotalFromReceipt(lines,detected),products=productLines(lines,amounts.baseTotal),excluded=products.filter(l=>NON_GROCERY_CATS.has(l.category)).reduce((a,l)=>a+l.price,0),total=amounts.baseTotal!==null?+Math.max(0,amounts.baseTotal-excluded).toFixed(2):null;return{store:detectStore(cleaned),date:detectDate(cleaned),total,baseTotal:amounts.baseTotal,originalTotal:amounts.originalTotal,koopzegels:amounts.koopzegels,statiegeld:amounts.statiegeld,excludedPurchases:+excluded.toFixed(2),lines:products,raw:cleaned}}
async function ocrImage(input,onProgress){if(!window.Tesseract)throw new Error('OCR-module kon niet worden geladen. Controleer je internetverbinding.');const result=await window.Tesseract.recognize(input,'nld+eng',{logger:m=>{if(m.status==='recognizing text'&&onProgress)onProgress(Math.round((m.progress||0)*100))}});return result?.data?.text||''}
async function enhanceReceiptImage(file){
  const bitmap=await createImageBitmap(file),max=2200,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const img=ctx.getImageData(0,0,canvas.width,canvas.height),d=img.data;
  for(let i=0;i<d.length;i+=4){const g=.299*d[i]+.587*d[i+1]+.114*d[i+2];const v=Math.max(0,Math.min(255,(g-128)*1.65+128));d[i]=d[i+1]=d[i+2]=v;}
  ctx.putImageData(img,0,0);if(bitmap.close)bitmap.close();return canvas;
}
function receiptParseScore(p){return (p?.lines?.length||0)*12+(p?.store?5:0)+(p?.date?4:0)+(p?.total!==null?7:0)}
async function cropJumboProductArea(file){
  const bitmap=await createImageBitmap(file);
  // Op een Jumbo-zelfscanbon staat het artikelblok in de bovenste helft.
  // Door alleen dat deel sterk te vergroten krijgt OCR de gekreukte productregels
  // veel beter te pakken en raakt het niet afgeleid door barcode/terminaltekst.
  const sx=0,sy=Math.round(bitmap.height*.08),sw=bitmap.width,sh=Math.round(bitmap.height*.52);
  const scale=Math.min(3.2,3600/sw);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  const img=ctx.getImageData(0,0,canvas.width,canvas.height),d=img.data;
  for(let i=0;i<d.length;i+=4){const g=.299*d[i]+.587*d[i+1]+.114*d[i+2];const v=g>190?255:g<115?0:Math.max(0,Math.min(255,(g-138)*2.45+138));d[i]=d[i+1]=d[i+2]=v}
  ctx.putImageData(img,0,0);if(bitmap.close)bitmap.close();return canvas;
}
function mergeJumboPhotoProducts(best,productText){
  const cleaned=cleanText(productText),lines=cleaned.split('\n').map(x=>x.trim()).filter(Boolean);
  // Alles vanaf KOOPZEGEL hoort niet meer bij het artikelblok.
  const stop=lines.findIndex(x=>/koopzegel/i.test(x));const productPart=stop>=0?lines.slice(0,stop):lines;
  const found=productLines(productPart,null).filter(l=>!/koopzegel|statiegeld|actie\b|korting/i.test(l.name));
  if(found.length>(best.lines||[]).length)best={...best,lines:found,raw:`${best.raw||''}\n${cleaned}`};
  return best;
}
async function parseReceiptImage(file){
  const raw=await ocrImage(file,pc=>setReadStatus(`Bon wordt uitgelezen… ${pc}%`,'busy'));let best=parseReceiptText(raw);
  if((best.lines||[]).length<4||best.total===null){
    try{setReadStatus('Bon wordt extra gecontroleerd…','busy');const canvas=await enhanceReceiptImage(file);const raw2=await ocrImage(canvas,pc=>setReadStatus(`Bon wordt extra gecontroleerd… ${pc}%`,'busy'));const alt=parseReceiptText(raw2);if(receiptParseScore(alt)>receiptParseScore(best))best=alt}catch(err){console.warn('Extra fotoherkenning overgeslagen',err)}
  }
  // Jumbo zelfscanbonnen zijn vaak gekreukt of licht gefotografeerd.
  // Als de algemene OCR te weinig artikelen vindt, lees het artikelgedeelte apart.
  if(detectStore(best.raw||raw)==='Jumbo'&&((best.lines||[]).length<6||best.total===null)){
    try{
      setReadStatus('Jumbo-artikelen worden extra gecontroleerd…','busy');
      const productCanvas=await cropJumboProductArea(file);
      const productRaw=await ocrImage(productCanvas,pc=>setReadStatus(`Jumbo-artikelen worden extra gecontroleerd… ${pc}%`,'busy'));
      best=mergeJumboPhotoProducts(best,productRaw);
    }catch(err){console.warn('Extra Jumbo-artikelherkenning overgeslagen',err)}
  }
  best.__parsedReceipt=true;return best;
}
function pdfItemsToLines(items){const rows=[];for(const item of items){const y=Math.round(item.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<=2);if(!row){row={y,items:[]};rows.push(row)}row.items.push({x:item.transform?.[4]||0,text:item.str||''})}return rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n')}
function groupPdfItems(items,tolerance=3){const rows=[];for(const item of items){const text=String(item.str||'').trim();if(!text)continue;const x=Number(item.transform?.[4]||0),y=Number(item.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<=tolerance);if(!row){row={y,items:[]};rows.push(row)}row.items.push({x,y,text})}return rows.sort((a,b)=>b.y-a.y).map(r=>({...r,items:r.items.sort((a,b)=>a.x-b.x),text:r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()}))}
function picnicPriceFromRow(row){
  const items=(row?.items||[]).filter(i=>i.x>=400);
  return picnicMoneyCandidates(items).map(x=>x.value)[0]??null
}
function picnicMoneyCandidates(items){
  const numeric=[];
  for(const item of items||[]){
    const raw=String(item.text??item.str??'').trim().replace(/[€\s]/g,'').replace(/,/g,'.');
    if(!raw||raw==='.')continue;
    const direct=raw.match(/^([+-]?\d{1,4})\.(\d{2})$/);
    if(direct){numeric.push({x:+(item.x??item.transform?.[4]??0),y:+(item.y??item.transform?.[5]??0),value:Number(`${direct[1]}.${direct[2]}`),direct:true});continue}
    if(/^[+-]?\d{1,4}$/.test(raw))numeric.push({x:+(item.x??item.transform?.[4]??0),y:+(item.y??item.transform?.[5]??0),raw});
  }
  const direct=numeric.filter(n=>n.direct&&Number.isFinite(n.value)).map(n=>({y:n.y,value:n.value}));
  const plain=numeric.filter(n=>!n.direct).sort((a,b)=>b.y-a.y||a.x-b.x),clusters=[];
  for(const n of plain){let c=clusters.find(c=>Math.abs(c.y-n.y)<=5);if(!c){c={y:n.y,items:[]};clusters.push(c)}c.items.push(n);c.y=c.items.reduce((a,x)=>a+x.y,0)/c.items.length}
  const paired=[];
  for(const c of clusters){const its=c.items.sort((a,b)=>a.x-b.x);for(let i=0;i<its.length;i++){const whole=its[i];if(!/^[+-]?\d{1,3}$/.test(whole.raw))continue;const cents=its.slice(i+1).find(x=>/^\d{2}$/.test(x.raw)&&x.x>=whole.x+4);if(!cents)continue;const value=Number(`${whole.raw}.${cents.raw}`);if(Number.isFinite(value)){paired.push({y:c.y,value});break}}}
  return [...direct,...paired].filter(x=>Number.isFinite(x.value)).sort((a,b)=>b.y-a.y)
}
function picnicPricesInRegion(items,highY,lowY){
  const region=(items||[]).map(i=>({x:Number(i.transform?.[4]??i.x??0),y:Number(i.transform?.[5]??i.y??0),text:String(i.str??i.text??'')})).filter(i=>i.x>=400&&i.y<=highY&&i.y>=lowY);
  return picnicMoneyCandidates(region)
}
function picnicProductName(row){if(!row)return'';const text=row.items.filter(i=>i.x>=195&&i.x<400).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();if(!text||!/\p{L}/u.test(text))return'';if(/^(?:gratis|bundelbonus|statiegeld|flessen en blikjes|tasjes|verrekening picnic-tegoed|subtotaal|totaal|btw|voordeel|picnic-tegoed|toegevoegd op|order|je bonnetje|beste |hier is het bonnetje|bezorgadres|fijne dag|vragen\?|klantenservice|mijn profiel)/i.test(text))return'';if(/(?:^|\s)(?:30%\s*korting|bundelbonus|korting|gratis)(?:\s|$)/i.test(text))return'';if(/^\d+(?:[,.]\d+)?\s*(?:gram|g|kg|kilo|ml|cl|l|liter|stuk|stuks|krop|pakken?|fles(?:sen)?|blik(?:jes)?)(?:\s*[•·-]\s*\d+\s*x\s*\d+(?:[,.]\d+)?\s*(?:gram|g|kg|ml|cl|l|stuk|stuks)?)?$/i.test(text))return'';return text}
function isPicnicPdfText(text){return /\bpicnic\b/i.test(text)&&(/je\s*bonnetje/i.test(text)||/service\.picnic\.nl/i.test(text)||/picnic-tegoed/i.test(text))}
function parsePicnicPdfPages(pageItems,rawText){
  const productRows=[],pageStops={};
  for(let p=0;p<pageItems.length;p++){
    const rows=groupPdfItems(pageItems[p],5);
    const hasItemBadges=pageItems[p].some(i=>(i.transform?.[4]||0)<180&&/^\d{1,2}$/.test(String(i.str||'').trim()));
    if(!hasItemBadges)continue;
    let startY=Infinity,stopY=-Infinity;
    if(p===0){const order=rows.find(r=>/\border\b/i.test(r.text));if(order)startY=order.y-1}
    const stop=rows.find(r=>/^(?:statiegeld|subtotaal|totaal)\b/i.test(r.text));if(stop)stopY=stop.y+1;
    pageStops[p]=stopY;
    for(const row of rows){if(row.y>=startY||row.y<=stopY)continue;const name=picnicProductName(row);if(name)productRows.push({page:p,y:row.y,name})}
  }
  const parsed=[];
  for(let i=0;i<productRows.length;i++){
    const cur=productRows[i],next=productRows.slice(i+1).find(x=>x.page===cur.page);
    const lower=Math.max(next?next.y+4:-Infinity,pageStops[cur.page]??-Infinity);
    const candidates=picnicPricesInRegion(pageItems[cur.page],cur.y+8,lower);
    if(!candidates.length)continue;
    // Bij BundelBonus/Gratis staat de werkelijk betaalde prijs lager in het blok.
    // Omdat PDF-coordinaten naar boven oplopen, is dat de kandidaat met de laagste y.
    const price=[...candidates].sort((a,b)=>a.y-b.y)[0].value;
    if(price>=0&&price<500)parsed.push({name:cur.name,price:+price.toFixed(2),category:catFor(cur.name)})
  }
  let total=null;
  for(const items of pageItems){
    const rows=groupPdfItems(items,5);
    const totalRow=rows.find(r=>/^totaal\b/i.test(r.text)&&/betaald|ideal/i.test(r.text));
    if(!totalRow)continue;
    const candidates=picnicPricesInRegion(items,totalRow.y+10,totalRow.y-12);
    if(candidates.length){const nearest=[...candidates].sort((a,b)=>Math.abs(a.y-totalRow.y)-Math.abs(b.y-totalRow.y))[0];total=nearest.value;break}
  }
  const oneLine=rawText.replace(/\s+/g,' ');
  const delivery=oneLine.match(/bezorging\s+van\s+(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(20\d{2})/i);
  let date='';
  if(delivery){const months={januari:1,februari:2,maart:3,april:4,mei:5,juni:6,juli:7,augustus:8,september:9,oktober:10,november:11,december:12},d=+delivery[1],mo=months[delivery[2].toLowerCase()],y=+delivery[3];date=`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`}else date=detectDate(oneLine);
  return{__parsedReceipt:true,store:'Picnic',date,total,originalTotal:total,koopzegels:0,lines:parsed,raw:rawText}
}
function isAlbertHeijnReceipt(text){return /\balbert\s+heijn\b|\bbonuskaart\b/i.test(text)&&/\bsubtotaal\b/i.test(text)}
function parseAlbertHeijnReceipt(rawText){const cleaned=cleanText(rawText),lines=cleaned.split('\n').map(x=>x.trim()).filter(Boolean);let start=lines.findIndex(l=>/aantal\s+omschrijving\s+prijs\s+bedrag/i.test(l));if(start<0)start=lines.findIndex(l=>/bonuskaart/i.test(l));let end=lines.findIndex((l,i)=>i>start&&/^\d+\s+SUBTOTAAL\b|^SUBTOTAAL\b/i.test(l));if(end<0)end=lines.length;const section=lines.slice(Math.max(0,start+1),end);const parsed=[];let statiegeld=0,skipKoopzegelDetail=false;for(const line of section){if(/koopzegels?\s+premium|^koopzegels?\b/i.test(line)){skipKoopzegelDetail=true;continue}if(skipKoopzegelDetail){if(isQuantityLine(line)){continue}skipKoopzegelDetail=false}if(/bonuskaart|airmiles/i.test(line))continue;if(/^\+?statiegeld\b/i.test(line)){const vals=lineMoney(line);if(vals.length)statiegeld+=vals[vals.length-1];continue}let p=splitProductAndPrice(line);if(!p)continue;let name=p.name.replace(/^\s*(\d+)\s+/,'$1 ').trim(),qty=1,unitPrice=null;const qtyMatch=name.match(/^(\d+(?:[,.]\d+)?)\s+/);if(qtyMatch){qty=parseReceiptNumber(qtyMatch[1])||1}const twoPrices=name.match(/^(\d+(?:[,.]\d+)?)\s+(.+?)\s+(\d+[,.]\d{2})$/);if(twoPrices){qty=parseReceiptNumber(twoPrices[1])||qty;unitPrice=parseReceiptNumber(twoPrices[3]);name=`${twoPrices[1]} ${twoPrices[2]}`}if(unitPrice===null&&qty>0)unitPrice=p.price/qty;if(/subtotaal|uw voordeel|koopzegel|merchant|\b9%\b|\b21%\b|bonus\b|betaald|pinnen/i.test(name))continue;parsed.push({name:name.slice(0,100),price:+p.price.toFixed(2),originalPrice:+p.price.toFixed(2),qty:+qty,unitPrice:+unitPrice.toFixed(2),category:catFor(name)})}
let originalTotal=null;for(const line of lines){if(!/^TOTAAL\b/i.test(line)||/korting|btw/i.test(line))continue;const vals=lineMoney(line);if(vals.length===1&&vals[0]>0){originalTotal=vals[0];break}}if(originalTotal===null){const pin=lines.find(l=>/^PINNEN\b/i.test(l));const vals=pin?lineMoney(pin):[];if(vals.length)originalTotal=vals[vals.length-1]}
let koopzegels=0;for(const line of lines){if(!/koopzegels?\s+premium/i.test(line))continue;const vals=lineMoney(line);if(vals.length){koopzegels=vals[vals.length-1];break}}
const baseTotal=originalTotal!==null?+Math.max(0,originalTotal-koopzegels-statiegeld).toFixed(2):null;const excluded=parsed.filter(l=>NON_GROCERY_CATS.has(l.category)).reduce((a,l)=>a+l.price,0);const total=baseTotal!==null?+Math.max(0,baseTotal-excluded).toFixed(2):null;return{__parsedReceipt:true,store:'Albert Heijn',date:detectDate(cleaned),total,baseTotal,originalTotal,koopzegels:+koopzegels.toFixed(2),statiegeld:+statiegeld.toFixed(2),excludedPurchases:+excluded.toFixed(2),lines:parsed,raw:cleaned}}
async function pdfText(file){if(!window.pdfjsLib)throw new Error('PDF-module kon niet worden geladen. Controleer je internetverbinding.');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const data=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data}).promise;let text='';const pageItems=[];const max=Math.min(pdf.numPages,5);for(let p=1;p<=max;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();pageItems.push(content.items);text+=pdfItemsToLines(content.items)+'\n';}if(isPicnicPdfText(text)){const picnic=parsePicnicPdfPages(pageItems,text);if(picnic.lines.length||picnic.total!==null)return picnic}if(isAlbertHeijnReceipt(text))return parseAlbertHeijnReceipt(text);if(cleanText(text).length>=80)return text;let ocr='';for(let p=1;p<=Math.min(pdf.numPages,3);p++){setReadStatus(`PDF-pagina ${p} wordt uitgelezen…`,'busy');const page=await pdf.getPage(p),viewport=page.getViewport({scale:2});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;ocr+=await ocrImage(canvas,pc=>setReadStatus(`PDF-pagina ${p} wordt uitgelezen… ${pc}%`,'busy'))+'\n';}return ocr}
async function extractReceipt(file){if(!file)throw new Error('Geen bestand gekozen.');if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return pdfText(file);if(file.type.startsWith('image/')||/\.(png|jpe?g|webp|bmp)$/i.test(file.name))return parseReceiptImage(file);throw new Error('Dit bestandstype kan nog niet worden uitgelezen. Kies een PDF of afbeelding.')}
function receiptDebugReason(line){
  const t=String(line||'').trim();
  if(!t)return 'leeg';
  if(/^producten?$/i.test(t))return 'kop PRODUCTEN';
  if(/koopzegel/i.test(t))return 'koopzegelregel';
  if(isReceiptNoise(t))return 'ruis / wordt overgeslagen';
  if(/actie\b|korting|aanbieding|kies\s*&?\s*mix/i.test(t))return 'actie/korting / wordt overgeslagen';
  if(isQuantityLine(t))return `hoeveelheidsregel → bedrag ${quantityLineTotal(t)===null?'niet herkend':money(quantityLineTotal(t))}`;
  const p=splitProductAndPrice(t);
  if(p)return `product + prijs → ${p.name} | ${money(p.price)}`;
  if(/^\s*€?\s*-?\d{1,4}[,.]\d{2}\s*$/.test(t))return 'losse prijsregel';
  if(/[A-Za-zÀ-ÿ]/.test(t))return 'tekst / mogelijke productnaam';
  return 'onbekend patroon';
}
function renderReceiptDebug(parsed){
  const box=document.querySelector('#receiptDebug'),stats=document.querySelector('#receiptDebugStats'),rawEl=document.querySelector('#receiptDebugRaw'),linesEl=document.querySelector('#receiptDebugLines');
  if(!box||!stats||!rawEl||!linesEl)return;
  const raw=String(parsed?.raw||'').trim(),rawLines=raw?raw.split('\n').map(x=>x.trim()).filter(Boolean):[];
  box.hidden=false;
  stats.innerHTML=`<strong>Winkel:</strong> ${esc(parsed?.store||'niet herkend')} · <strong>OCR-regels:</strong> ${rawLines.length} · <strong>Productregels:</strong> ${parsed?.lines?.length||0} · <strong>Totaal:</strong> ${parsed?.total===null||parsed?.total===undefined?'niet herkend':money(parsed.total)}`;
  linesEl.textContent=rawLines.map((line,i)=>`${String(i+1).padStart(2,'0')}. [${receiptDebugReason(line)}] ${line}`).join('\n')||'Geen OCR-tekst beschikbaar.';
  rawEl.textContent=raw||'Geen OCR-tekst beschikbaar.';
}
function clearReceiptDebug(){const box=document.querySelector('#receiptDebug');if(box){box.hidden=true;box.open=false}for(const id of ['receiptDebugStats','receiptDebugRaw','receiptDebugLines']){const el=document.querySelector('#'+id);if(el)el.textContent=''}}

function applyParsed(parsed){if(parsed.store)document.querySelector('#receiptStore').value=parsed.store;if(parsed.date)document.querySelector('#receiptDate').value=parsed.date;const modal=document.querySelector('#receiptModal');if(modal){modal.dataset.originalTotal=parsed.originalTotal??'';modal.dataset.koopzegels=parsed.koopzegels||0;modal.dataset.statiegeld=parsed.statiegeld||0;modal.dataset.groceryBaseTotal=parsed.baseTotal??parsed.total??'';modal.dataset.excludedPurchaseTotal=parsed.excludedPurchases||0}if(parsed.lines.length){const rows=document.querySelector('#receiptProductRows');rows.innerHTML='';parsed.lines.forEach(addProductRow)}document.querySelector('#receiptKoopzegels').value=parsed.koopzegels?String(parsed.koopzegels.toFixed(2)).replace('.',','):'';document.querySelector('#receiptKoopzegelsPaid').value=parsed.koopzegelsPaid?String(parsed.koopzegelsPaid.toFixed(2)).replace('.',','):'';if(parsed.total!==null)document.querySelector('#receiptTotal').value=String(parsed.total.toFixed(2)).replace('.',',');refreshReceiptAmountMeta();updateReceiptSummary(parsed)}
function updateReceiptSummary(parsed={}){const box=document.querySelector('#receiptDesktopSummaryInfo')||document.querySelector('#receiptDesktopSummary');if(!box)return;const store=parsed.store||document.querySelector('#receiptStore')?.value||'—',date=parsed.date||document.querySelector('#receiptDate')?.value||'',total=parsed.total!==null&&parsed.total!==undefined?parsed.total:parseFloat((document.querySelector('#receiptTotal')?.value||'').replace(',','.'))||0,kz=Number(parsed.koopzegels||0),st=Number(parsed.statiegeld||0),other=Number(parsed.excludedPurchases||0),count=parsed.lines?.length||document.querySelectorAll('.receipt-product-row').length;box.innerHTML=`<h3>Herkende bon</h3><div><span>Winkel</span><strong>${esc(store)}</strong></div><div><span>Datum</span><strong>${date?new Date(date+'T12:00:00').toLocaleDateString('nl-NL'):'—'}</strong></div><div class="receipt-summary-total"><span>Boodschappenbedrag</span><strong>${money(total)}</strong></div>${kz?`<div><span>Koopzegels niet meegenomen</span><strong>${money(kz)}</strong></div>`:''}${st?`<div><span>Statiegeld niet meegenomen</span><strong>${money(st)}</strong></div>`:''}${other?`<div><span>Verzorging / niet-boodschappen niet meegenomen</span><strong>${money(other)}</strong></div>`:''}<small>${count} ${count===1?'productregel':'productregels'} gevonden</small>`}
function resetReceiptRecognitionFields(){
  document.querySelector('#receiptStore').value='';
  document.querySelector('#receiptDate').value='';
  document.querySelector('#receiptTotal').value='';const meta=document.querySelector('#receiptAmountMeta');if(meta){meta.hidden=true;meta.innerHTML=''};const modal=document.querySelector('#receiptModal');if(modal){delete modal.dataset.originalTotal;delete modal.dataset.koopzegels;delete modal.dataset.statiegeld;delete modal.dataset.groceryBaseTotal;delete modal.dataset.excludedPurchaseTotal}const summary=document.querySelector('#receiptDesktopSummaryInfo')||document.querySelector('#receiptDesktopSummary');if(summary)summary.innerHTML='<h3>Herkende bon</h3><p class="receipt-summary-empty">Kies een bon om de gegevens te controleren.</p>';clearReceiptPreview();clearReceiptDebug();
  const rows=document.querySelector('#receiptProductRows');
  if(rows){rows.innerHTML='';addProductRow({})}
}
async function readReceiptFile(file){if(!file||readingReceipt)return null;readingReceipt=true;let parsed=null;const saveBtn=document.querySelector('#receiptForm button[type="submit"]');if(saveBtn)saveBtn.disabled=true;setReadStatus('Bon wordt uitgelezen…','busy');try{const extracted=await extractReceipt(file);parsed=extracted&&extracted.__parsedReceipt?extracted:parseReceiptText(extracted);applyParsed(parsed);renderReceiptDebug(parsed);const found=[parsed.store&&'winkel',parsed.date&&'datum',parsed.total!==null&&'totaal',parsed.lines.length&&`${parsed.lines.length} productregels`].filter(Boolean);if(found.length)setReadStatus(`Uitgelezen: ${found.join(', ')}. Controleer de gegevens en pas ze zo nodig aan.`,'success');else setReadStatus('De bon is uitgelezen, maar er konden weinig gegevens automatisch worden herkend. Vul de ontbrekende gegevens handmatig aan.','warning');return parsed;}catch(err){console.error('Bon uitlezen mislukt',err);setReadStatus(err?.message||'Bon uitlezen is niet gelukt. Je kunt de gegevens handmatig invullen.','error');return null;}finally{readingReceipt=false;if(saveBtn)saveBtn.disabled=false}}


async function takeSharedReceipt(){
  const url=new URL(window.location.href);
  if(!url.searchParams.has('share-target')||!('caches' in window))return null;
  try{
    const cache=await caches.open('huize-chaos-shared-receipts-v1');
    const key=new URL('__shared-receipt__',url).href;
    const response=await cache.match(key);
    if(!response)return null;
    await cache.delete(key);
    const blob=await response.blob();
    const raw=response.headers.get('X-HC-File-Name')||'gedeelde-bon';
    let name='gedeelde-bon';try{name=decodeURIComponent(raw)}catch(_){name=raw}
    return new File([blob],name,{type:blob.type||response.headers.get('Content-Type')||'application/octet-stream'});
  }catch(err){console.error('Gedeelde bon ophalen mislukt',err);return null}
}
async function openSharedReceipt(){
  const url=new URL(window.location.href);
  if(!url.searchParams.has('share-target'))return;
  const file=await takeSharedReceipt();
  localStorage.setItem('household-page','insight');
  if(window.setHuizeChaosPage)window.setHuizeChaosPage('insight');else window.renderHuizeChaos?.();
  if(file){
    try{
      setReadStatus('Gedeelde bon wordt uitgelezen…','busy');
      const extracted=await extractReceipt(file);
      const parsed=extracted&&extracted.__parsedReceipt?extracted:parseReceiptText(extracted);
      const all=receipts();
      const id=String(Date.now());
      const total=Number.isFinite(Number(parsed.total))?Number(parsed.total):(parsed.lines||[]).reduce((a,l)=>a+(Number(l.price)||0),0);
      const obj={id,store:parsed.store||'',date:parsed.date||new Date().toISOString().slice(0,10),total:+total.toFixed(2),lines:parsed.lines||[],note:'',source:'shared',fileName:file.name||'gedeelde-bon',originalTotal:parsed.originalTotal??null,koopzegels:Number(parsed.koopzegels)||0,statiegeld:Number(parsed.statiegeld)||0,status:'pending'};
      all.push(obj);saveReceipts(all);render();
      const c=document.querySelector('#content');if(c)c.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){console.error('Gedeelde bon bewaren mislukt',err);openModal();setReadStatus('De gedeelde bon kon niet automatisch worden uitgelezen. Controleer hem nu handmatig.','warning')}
  }else{openModal();setReadStatus('Huize Chaos is geopend via Delen, maar het bonbestand kon niet worden opgehaald. Kies het bestand handmatig.','warning')}
  history.replaceState({},'',url.pathname+url.hash);
}

window.renderInsight=render;window.openReceiptModal=()=>openModal();
window.addEventListener('DOMContentLoaded',()=>{let form=document.querySelector('#receiptForm');if(!form)return;document.querySelector('#receiptCancel').onclick=close;document.querySelector('#receiptBack').onclick=close;document.querySelector('#receiptModal').onclick=e=>{if(e.target.id==='receiptModal')close()};document.querySelectorAll('.receipt-source').forEach(b=>b.onclick=()=>setSource(b.dataset.source));document.querySelector('#receiptAddLine').onclick=()=>addProductRow({});['receiptTotal','receiptKoopzegels','receiptKoopzegelsPaid'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',()=>{}));document.querySelector('#receiptFile').onchange=e=>{const file=e.target.files[0];document.querySelector('#receiptFileName').textContent=file?.name||document.querySelector('#receiptModal').dataset.fileName||'Geen bestand gekozen';if(file){resetReceiptRecognitionFields();showReceiptPreview(file);readReceiptFile(file)}};
const viewModal=document.querySelector('#receiptViewModal'),viewMenu=document.querySelector('#receiptViewMenu'),viewMenuButton=document.querySelector('#receiptViewMenuButton');
document.querySelector('#receiptViewBack').onclick=closeReceiptView;viewModal.onclick=e=>{if(e.target.id==='receiptViewModal')closeReceiptView()};viewMenuButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();viewMenu.hidden=!viewMenu.hidden;viewMenuButton.setAttribute('aria-expanded',String(!viewMenu.hidden))});viewMenu.addEventListener('click',e=>{const actionButton=e.target.closest('[data-receipt-action]');if(!actionButton)return;e.preventDefault();e.stopPropagation();const action=actionButton.dataset.receiptAction;viewMenu.hidden=true;viewMenuButton.setAttribute('aria-expanded','false');handleReceiptViewAction(action)});document.addEventListener('click',e=>{if(!e.target.closest('.receipt-view-menu-wrap')&&viewMenu&&!viewMenu.hidden){viewMenu.hidden=true;viewMenuButton.setAttribute('aria-expanded','false')}});
form.onsubmit=async e=>{e.preventDefault();if(readingReceipt)return;let all=receipts(),editingId=document.querySelector('#receiptEditId').value,id=editingId||String(Date.now()),lines=collectLines(),entered=parseFloat(document.querySelector('#receiptTotal').value.replace(',','.')),total=Number.isFinite(entered)?entered:lines.reduce((a,l)=>a+l.price,0),file=document.querySelector('#receiptFile').files[0],old=all.find(r=>String(r.id)===String(id)),obj={id,store:document.querySelector('#receiptStore').value.trim(),date:document.querySelector('#receiptDate').value,total,lines,note:document.querySelector('#receiptNote').value.trim(),source:receiptSource,fileName:file?.name||document.querySelector('#receiptModal').dataset.fileName||old?.fileName||'',originalTotal:Number(document.querySelector('#receiptModal').dataset.originalTotal)||old?.originalTotal||null,koopzegels:parseReceiptNumber(document.querySelector('#receiptKoopzegels')?.value)||Number(document.querySelector('#receiptModal').dataset.koopzegels)||old?.koopzegels||0,koopzegelsPaid:parseReceiptNumber(document.querySelector('#receiptKoopzegelsPaid')?.value)||old?.koopzegelsPaid||0,statiegeld:Number(document.querySelector('#receiptModal').dataset.statiegeld)||old?.statiegeld||0,status:'approved'};const duplicate=isDuplicateReceipt(obj,all,editingId);if(duplicate&&!window.confirm(`Mogelijk is deze bon al toegevoegd:

${duplicate.store} · ${new Date(duplicate.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})} · ${money(duplicate.total)}

Toch opslaan?`))return;let i=all.findIndex(r=>String(r.id)===String(id));if(i>=0)all[i]=obj;else all.push(obj);if(file)await saveReceiptFile(id,file);saveReceipts(all);close();render()};setTimeout(openSharedReceipt,0);});
})();
