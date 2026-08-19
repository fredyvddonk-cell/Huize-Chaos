(() => {
const CATS=['Vlees & vis','Maaltijden','Groente & fruit','Ontbijt & lunch','Dranken','Snacks & lekkers','Huishouden','Verzorging','Huisdieren','Overig'];
const KEYWORDS={
'Vlees & vis':['gehakt','gehaktbal','gehaktballet','kipfilet','kipdij','kipburger','kip ','kipshaslick','shaslick','dijlap','slavink','vlees','rund','vis','kabeljauw','koolvis','zalm','worst','braadworst','steak','schnitzel','hamburger','biefstuk','spek','shoarma'],
'Groente & fruit':['snijboon','snijbonen','tomatenblok','peterselie','broccoli','ijsbergsla','paprika','tomaat','komkommer','sla','gele ui','uien','ui','knoflook','wortel','appelmoes','appel','banaan','druif','kiwi','fruit','groente','avocado','courgette','prei','champignon','aardbei'],
'Ontbijt & lunch':['brood','kaas','beleg','yoghurt','kwark','cruesli','muesli','havermout','melk','jam','hagelslag','smeerkaas','vleeswaar','beschuit','cracker'],
'Maaltijden':['gele rijst','rijst','aardappelschijf','bami & nasi','bami','nasi','eiermie','mie','boemboe','gebakken uitjes','spaghetti','pasta'],
'Dranken':['cola','fanta','sinas','sap','koffie','thee','drank','water','limonade','sprite','pepsi','wijn'],
'Snacks & lekkers':['chips','snoep','koek','chocolade','ijs','snack','toast','drop','winegum','borrel'],
'Huishouden':['wasmiddel','wasverzachter','vaatwas','afwas','wc papier','toiletpapier','keukenrol','vuilniszak','schoonmaak','allesreiniger'],
'Verzorging':['shampoo','deodorant','tandpasta','douchegel','maandverband','tampon','paracetamol'],
'Huisdieren':['katten','kattenbak','kattenvoer','brokjes','natvoer','kattensnoep']};
let mode=localStorage.getItem('hc-insight-mode')||'month';
let offset=Number(localStorage.getItem('hc-insight-offset')||0);
let receiptSource='digital';
let readingReceipt=false;
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const receipts=()=>JSON.parse(localStorage.getItem('hc-receipts-v1')||'[]');
const saveReceipts=x=>localStorage.setItem('hc-receipts-v1',JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const catFor=name=>{let n=String(name||'').toLowerCase();for(const [c,ks] of Object.entries(KEYWORDS))if(ks.some(k=>n.includes(k)))return c;return 'Maaltijden'};
function bounds(){let now=new Date(),start,end,label;if(mode==='week'){let d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7)+offset*7);start=new Date(d.getFullYear(),d.getMonth(),d.getDate());end=new Date(start);end.setDate(end.getDate()+7);label=`Week van ${start.toLocaleDateString('nl-NL',{day:'numeric',month:'long'})}`;}else{start=new Date(now.getFullYear(),now.getMonth()+offset,1);end=new Date(now.getFullYear(),now.getMonth()+offset+1,1);label=start.toLocaleDateString('nl-NL',{month:'long',year:'numeric'});label=label[0].toUpperCase()+label.slice(1);}return{start,end,label}}
function filtered(){let {start,end}=bounds();return receipts().filter(r=>{let d=new Date(r.date+'T12:00:00');return d>=start&&d<end})}
function totals(rs){let by=Object.fromEntries(CATS.map(c=>[c,0]));rs.forEach(r=>(r.lines||[]).forEach(l=>by[CATS.includes(l.category)?l.category:'Overig']+=(+l.price||0)));return by}
function render(){const c=document.querySelector('#content');if(!c)return;let rs=filtered(),by=totals(rs),sum=rs.reduce((a,r)=>a+(+r.total||0),0),budget=Number(localStorage.getItem(mode==='week'?'hc-budget-week':'hc-budget-month')||0),diff=budget?budget-sum:null,{label}=bounds();let rows=CATS.map(cat=>`<button class="insight-cat" data-cat="${esc(cat)}"><span>${esc(cat)}</span><span><strong>${money(by[cat])}</strong><small>${sum?Math.round(by[cat]/sum*100):0}%</small></span></button>`).join('');let recent=[...rs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="receipt-row-wrap" data-id="${esc(r.id)}"><button class="receipt-row receipt-row-main" type="button" data-id="${esc(r.id)}"><span><strong>${new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long'})} · ${esc(r.store)}</strong><small>${(r.lines||[]).length} producten${r.fileName?' · bonbestand':''}</small></span><strong>${money(r.total)}</strong></button><details class="receipt-row-menu-wrap"><summary class="receipt-row-menu-button" aria-label="Bonopties">⋮</summary><div class="receipt-row-menu"><button type="button" data-row-action="edit" data-receipt-id="${esc(r.id)}">Bon wijzigen</button><button type="button" data-row-action="delete" data-receipt-id="${esc(r.id)}" class="danger-text">Bon verwijderen</button></div></details></div>`).join('')||'<div class="empty">Nog geen bonnen in deze periode.</div>';
c.innerHTML=`<div class="insight-head"><div class="period-switch"><button data-mode="week" class="${mode==='week'?'active':''}">Week</button><button data-mode="month" class="${mode==='month'?'active':''}">Maand</button></div><div class="period-nav"><button data-shift="-1">‹</button><strong>${label}</strong><button data-shift="1" ${offset>=0?'disabled':''}>›</button></div></div><section class="insight-total"><small>Besteed</small><div>${money(sum)}</div><label>Budget <input id="insightBudget" inputmode="decimal" value="${budget?String(budget).replace('.',','):''}" placeholder="niet ingesteld"></label>${budget?`<p>Verschil ${diff>=0?'+ ':''}${money(diff)}</p>`:''}<small>${rs.length} ${rs.length===1?'aankoop':'aankopen'}</small></section><section class="insight-section"><h2>Verdeling</h2>${rows}</section><section class="insight-section"><h2>Aankopen</h2>${recent}</section>`;
c.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;offset=0;localStorage.setItem('hc-insight-mode',mode);localStorage.setItem('hc-insight-offset','0');render()});c.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{offset+=Number(b.dataset.shift);localStorage.setItem('hc-insight-offset',offset);render()});let bi=c.querySelector('#insightBudget');bi.onchange=()=>{let v=parseFloat(bi.value.replace(',','.'))||0;localStorage.setItem(mode==='week'?'hc-budget-week':'hc-budget-month',v);render()};c.querySelectorAll('.insight-cat').forEach(b=>b.onclick=()=>showCategory(b.dataset.cat,rs));c.onclick=e=>{const action=e.target.closest('[data-row-action]');if(action){e.preventDefault();e.stopPropagation();const id=action.dataset.receiptId||action.closest('.receipt-row-wrap')?.dataset.id||'';action.closest('details')?.removeAttribute('open');if(action.dataset.rowAction==='edit')editReceipt(id);if(action.dataset.rowAction==='delete')deleteReceipt(id);return;}const main=e.target.closest('.receipt-row-main');if(main){e.preventDefault();openReceiptView(receiptById(main.dataset.id));}};}
function showCategory(cat,rs){let lines=[];rs.forEach(r=>(r.lines||[]).filter(l=>l.category===cat).forEach(l=>lines.push({...l,date:r.date,store:r.store})));document.querySelector('#content').innerHTML=`<button class="insight-back" id="insightBack">‹ Terug</button><h1>${esc(cat)}</h1><div class="insight-products">${lines.sort((a,b)=>b.price-a.price).map(l=>`<div><span><strong>${esc(l.name)}</strong><small>${new Date(l.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'short'})} · ${esc(l.store)}</small></span><strong>${money(l.price)}</strong></div>`).join('')||'<div class="empty">Geen producten.</div>'}</div>`;document.querySelector('#insightBack').onclick=render}
function categoryOptions(selected=''){return CATS.map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('')}
function addProductRow(line={}){const wrap=document.querySelector('#receiptProductRows');if(!wrap)return;const row=document.createElement('div');row.className='receipt-product-row';row.innerHTML=`<div class="receipt-cell receipt-cell-product"><label>Product *</label><input class="receipt-line-name" value="${esc(line.name||'')}" placeholder="Product"></div><div class="receipt-cell receipt-cell-price"><label>Bedrag *</label><input class="receipt-line-price" inputmode="decimal" value="${line.price!==undefined&&line.price!==''?esc(String(line.price).replace('.',',')):''}" placeholder="0,00"></div><div class="receipt-cell receipt-cell-cat"><label>Categorie</label><select class="receipt-line-cat">${categoryOptions(CATS.includes(line.category)?line.category:catFor(line.name||''))}</select></div><div class="receipt-cell receipt-cell-action"><label>Acties</label><button type="button" class="receipt-delete-line" aria-label="Productregel verwijderen">⌫</button></div>`;
row.querySelector('.receipt-line-name').addEventListener('blur',e=>{const sel=row.querySelector('.receipt-line-cat');if(!sel.dataset.touched)sel.value=catFor(e.target.value)});
row.querySelector('.receipt-line-cat').addEventListener('change',e=>e.target.dataset.touched='1');
row.querySelector('.receipt-delete-line').onclick=()=>row.remove();
wrap.appendChild(row)}
function setSource(source){receiptSource=source==='photo'?'photo':'digital';document.querySelectorAll('.receipt-source').forEach(b=>{const on=b.dataset.source===receiptSource;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});const input=document.querySelector('#receiptFile');if(!input)return;if(receiptSource==='photo'){input.accept='image/*';input.setAttribute('capture','environment')}else{input.accept='image/*,.pdf,application/pdf';input.removeAttribute('capture')}}
function setReadStatus(message,type='busy'){const el=document.querySelector('#receiptReadStatus');if(!el)return;if(!message){el.hidden=true;el.textContent='';el.className='receipt-read-status';return}el.hidden=false;el.textContent=message;el.className=`receipt-read-status ${type}`}
function receiptById(id){return receipts().find(r=>String(r.id)===String(id))}
function closeReceiptView(){const m=document.querySelector('#receiptViewModal');if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');m.dataset.id='';const menu=document.querySelector('#receiptViewMenu');if(menu)menu.hidden=true;const btn=document.querySelector('#receiptViewMenuButton');if(btn)btn.setAttribute('aria-expanded','false')}
function openReceiptView(r){if(!r)return;const m=document.querySelector('#receiptViewModal');if(!m)return;m.dataset.id=r.id;m.classList.add('open');m.setAttribute('aria-hidden','false');document.querySelector('#receiptViewTitle').textContent=`${r.store||'Bon'} · ${new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})}`;document.querySelector('#receiptViewMeta').innerHTML=`<div><small>Totaal</small><strong>${money(r.total)}</strong></div>${r.fileName?`<div><small>Bron</small><span>${esc(r.fileName)}</span></div>`:''}`;const note=document.querySelector('#receiptViewNote');if(r.note){note.hidden=false;note.innerHTML=`<small>Opmerking</small><p>${esc(r.note)}</p>`}else{note.hidden=true;note.innerHTML=''};const list=document.querySelector('#receiptViewProducts');const lines=r.lines||[];list.innerHTML=lines.length?lines.map(l=>`<div class="receipt-view-product"><span><strong>${esc(l.name)}</strong><small>${esc(l.category||catFor(l.name))}</small></span><strong>${money(l.price)}</strong></div>`).join(''):'<div class="empty">Geen producten opgeslagen.</div>';const menu=document.querySelector('#receiptViewMenu');if(menu)menu.hidden=true;const btn=document.querySelector('#receiptViewMenuButton');if(btn)btn.setAttribute('aria-expanded','false')}
function deleteReceipt(id){const targetId=String(id||'');const r=receiptById(targetId);if(!r)return;const label=`${r.store||'Deze bon'} van ${new Date(r.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})}`;if(!window.confirm(`${label} verwijderen?\n\nDe bon en de bijbehorende inzichtgegevens worden verwijderd. De voorraad en boodschappenlijst veranderen niet.`))return;const next=receipts().filter(x=>String(x.id)!==targetId);saveReceipts(next);closeReceiptView();render()}
function editReceipt(id){const targetId=String(id||'');const r=receiptById(targetId);if(!r)return;closeReceiptView();openModal(r)}
function handleReceiptViewAction(action){const modal=document.querySelector('#receiptViewModal');const id=modal?.dataset.id||'';if(!id)return;if(action==='edit')editReceipt(id);if(action==='delete')deleteReceipt(id)}
function isDuplicateReceipt(candidate,all,ignoreId=''){return all.find(r=>String(r.id)!==String(ignoreId)&&String(r.store||'').trim().toLowerCase()===String(candidate.store||'').trim().toLowerCase()&&r.date===candidate.date&&Math.abs((+r.total||0)-(+candidate.total||0))<0.005)}
function openModal(r){const m=document.querySelector('#receiptModal');document.querySelector('#receiptTitle').textContent=r?'Bon aanpassen':'Bon toevoegen';document.querySelector('#receiptEditId').value=r?.id||'';document.querySelector('#receiptStore').value=r?.store||'';document.querySelector('#receiptDate').value=r?.date||new Date().toISOString().slice(0,10);document.querySelector('#receiptTotal').value=r?String(r.total).replace('.',','):'';document.querySelector('#receiptNote').value=r?.note||'';document.querySelector('#receiptFile').value='';m.dataset.fileName=r?.fileName||'';document.querySelector('#receiptFileName').textContent=r?.fileName||'Geen bestand gekozen';setReadStatus('');const rows=document.querySelector('#receiptProductRows');rows.innerHTML='';(r?.lines?.length?r.lines:[{}]).forEach(addProductRow);setSource(r?.source||'digital');m.classList.add('open');m.setAttribute('aria-hidden','false')}
function close(){if(readingReceipt)return;let m=document.querySelector('#receiptModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function collectLines(){return [...document.querySelectorAll('.receipt-product-row')].map(row=>{const name=row.querySelector('.receipt-line-name').value.trim(),price=parseFloat(row.querySelector('.receipt-line-price').value.replace(',','.'))||0,category=row.querySelector('.receipt-line-cat').value||catFor(name);return{name,price,category}}).filter(l=>l.name)}

function cleanText(text){return String(text||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()}
function parseMoney(v){if(!v)return null;let s=String(v).replace(/\s/g,'').replace(/€/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');let n=Number(s);return Number.isFinite(n)?n:null}
function detectStore(text){const t=text.toUpperCase();const stores=[['Albert Heijn',/ALBERT\s*HEIJN|\bAH\b/],['Jumbo',/\bJUMBO\b/],['Picnic',/\bPICNIC\b/],['Lidl',/\bLIDL\b/],['Aldi',/\bALDI\b/],['PLUS',/\bPLUS\b/],['Dirk',/\bDIRK\b/],['Kruidvat',/\bKRUIDVAT\b/],['Etos',/\bETOS\b/]];for(const [name,re] of stores)if(re.test(t))return name;return ''}
function detectDate(text){
  const patterns=[/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/,/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/];
  for(let i=0;i<patterns.length;i++){const m=text.match(patterns[i]);if(!m)continue;let y,mo,d;if(i===0){d=+m[1];mo=+m[2];y=+m[3]}else{y=+m[1];mo=+m[2];d=+m[3]}if(y>=2020&&mo>=1&&mo<=12&&d>=1&&d<=31)return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
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
  const strong=[/totaal\s*\(\s*incl\.?\s*btw\s*\)/i,/eind\s*totaal/i,/te\s*betalen/i,/totaal\s*bedrag/i,/grand\s*total/i];
  for(const re of strong){for(let i=lines.length-1;i>=0;i--){const line=lines[i];if(!re.test(line)||/korting|subtotaal|btw\s*totaal/i.test(line))continue;const vals=lineMoney(line);if(vals.length)return vals[vals.length-1];if(i+1<lines.length){const next=lineMoney(lines[i+1]);if(next.length)return next[next.length-1]}}}
  // Alleen een kale "Totaal"-regel als tweede keus, nooit "Totaal korting".
  for(let i=lines.length-1;i>=0;i--){if(!/^totaal\b/i.test(lines[i])||/korting|btw/i.test(lines[i]))continue;const vals=lineMoney(lines[i]);if(vals.length)return vals[vals.length-1]}
  return null
}
function isReceiptNoise(line){return /^(?:producten?|jumbo extra'?s?|oud saldo|gespaard|ingewisseld|nieuw saldo|aantal|btw|bedrag excl|btw bedrag|btw totaal|subtotaal|totaal|te betalen|pin|betaald|contant|wisselgeld|transactie|kaart|terminal|bonnr|kassa|datum|tijd|klant|filiaal|bedankt|www\.|kvk|iban|bonus|zegels?|extra'?s? aanbieding)/i.test(line)}
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
  const push=(name,price)=>{name=String(name||'').replace(/\s{2,}/g,' ').trim();if(!name||price===null||price<0||price>500)return;if(/^\d+(?:[,.]\d+)?$/.test(name)||name.length<2||/^(?:€|eur)$/i.test(name))return;if(/^\d+\s*(?:g|gr|kg|ml|cl|l|st|stuks?)?$/i.test(name))return;out.push({name:name.slice(0,100),price:+price.toFixed(2),category:catFor(name)});};
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
    const parsed=splitProductAndPrice(line);
    if(parsed){push(parsed.name,parsed.price);pendingName='';continue}
    // Een tekstregel zonder bedrag kan de productnaam zijn. Bewaar hem totdat de volgende
    // regel een hoeveelheid + regelbedrag bevat, bijvoorbeeld Houthakkersteak / 2 x 3,50 7,00.
    if(/[A-Za-zÀ-ÿ]/.test(line)&&!/^[-€\d., xX]+$/.test(line))pendingName=line;
  }
  return out.slice(0,120)
}
function parseReceiptText(text){const cleaned=cleanText(text);const lines=cleaned.split('\n').map(x=>x.trim()).filter(Boolean);const total=detectTotal(lines);return{store:detectStore(cleaned),date:detectDate(cleaned),total,lines:productLines(lines,total),raw:cleaned}}
async function ocrImage(input,onProgress){if(!window.Tesseract)throw new Error('OCR-module kon niet worden geladen. Controleer je internetverbinding.');const result=await window.Tesseract.recognize(input,'nld+eng',{logger:m=>{if(m.status==='recognizing text'&&onProgress)onProgress(Math.round((m.progress||0)*100))}});return result?.data?.text||''}
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
  return{__parsedReceipt:true,store:'Picnic',date,total,lines:parsed,raw:rawText}
}
async function pdfText(file){if(!window.pdfjsLib)throw new Error('PDF-module kon niet worden geladen. Controleer je internetverbinding.');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const data=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data}).promise;let text='';const pageItems=[];const max=Math.min(pdf.numPages,5);for(let p=1;p<=max;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();pageItems.push(content.items);text+=pdfItemsToLines(content.items)+'\n';}if(isPicnicPdfText(text)){const picnic=parsePicnicPdfPages(pageItems,text);if(picnic.lines.length||picnic.total!==null)return picnic}if(cleanText(text).length>=80)return text;let ocr='';for(let p=1;p<=Math.min(pdf.numPages,3);p++){setReadStatus(`PDF-pagina ${p} wordt uitgelezen…`,'busy');const page=await pdf.getPage(p),viewport=page.getViewport({scale:2});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;ocr+=await ocrImage(canvas,pc=>setReadStatus(`PDF-pagina ${p} wordt uitgelezen… ${pc}%`,'busy'))+'\n';}return ocr}
async function extractReceipt(file){if(!file)throw new Error('Geen bestand gekozen.');if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return pdfText(file);if(file.type.startsWith('image/')||/\.(png|jpe?g|webp|bmp)$/i.test(file.name))return ocrImage(file,pc=>setReadStatus(`Bon wordt uitgelezen… ${pc}%`,'busy'));throw new Error('Dit bestandstype kan nog niet worden uitgelezen. Kies een PDF of afbeelding.')}
function applyParsed(parsed){if(parsed.store)document.querySelector('#receiptStore').value=parsed.store;if(parsed.date)document.querySelector('#receiptDate').value=parsed.date;if(parsed.total!==null)document.querySelector('#receiptTotal').value=String(parsed.total.toFixed(2)).replace('.',',');if(parsed.lines.length){const rows=document.querySelector('#receiptProductRows');rows.innerHTML='';parsed.lines.forEach(addProductRow)}}
function resetReceiptRecognitionFields(){
  document.querySelector('#receiptStore').value='';
  document.querySelector('#receiptDate').value='';
  document.querySelector('#receiptTotal').value='';
  const rows=document.querySelector('#receiptProductRows');
  if(rows){rows.innerHTML='';addProductRow({})}
}
async function readReceiptFile(file){if(!file||readingReceipt)return;readingReceipt=true;const saveBtn=document.querySelector('#receiptForm button[type="submit"]');if(saveBtn)saveBtn.disabled=true;setReadStatus('Bon wordt uitgelezen…','busy');try{const extracted=await extractReceipt(file);const parsed=extracted&&extracted.__parsedReceipt?extracted:parseReceiptText(extracted);applyParsed(parsed);const found=[parsed.store&&'winkel',parsed.date&&'datum',parsed.total!==null&&'totaal',parsed.lines.length&&`${parsed.lines.length} productregels`].filter(Boolean);if(found.length)setReadStatus(`Uitgelezen: ${found.join(', ')}. Controleer de gegevens en pas ze zo nodig aan.`,'success');else setReadStatus('De bon is uitgelezen, maar er konden weinig gegevens automatisch worden herkend. Vul de ontbrekende gegevens handmatig aan.','warning');}catch(err){console.error('Bon uitlezen mislukt',err);setReadStatus(err?.message||'Bon uitlezen is niet gelukt. Je kunt de gegevens handmatig invullen.','error')}finally{readingReceipt=false;if(saveBtn)saveBtn.disabled=false}}

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
  if(window.setHuizeChaosPage)window.setHuizeChaosPage('insight');
  else window.renderHuizeChaos?.();
  openModal();
  if(file){
    document.querySelector('#receiptFileName').textContent=file.name;
    document.querySelector('#receiptModal').dataset.fileName=file.name;
    resetReceiptRecognitionFields();
    setReadStatus('Gedeelde bon ontvangen. Bon wordt uitgelezen…','busy');
    await readReceiptFile(file);
  }else{
    setReadStatus('Huize Chaos is geopend via Delen, maar het bonbestand kon niet worden opgehaald. Kies het bestand handmatig.','warning');
  }
  history.replaceState({},'',url.pathname+url.hash);
}

window.renderInsight=render;window.openReceiptModal=()=>openModal();
window.addEventListener('DOMContentLoaded',()=>{let form=document.querySelector('#receiptForm');if(!form)return;document.querySelector('#receiptCancel').onclick=close;document.querySelector('#receiptBack').onclick=close;document.querySelector('#receiptModal').onclick=e=>{if(e.target.id==='receiptModal')close()};document.querySelectorAll('.receipt-source').forEach(b=>b.onclick=()=>setSource(b.dataset.source));document.querySelector('#receiptAddLine').onclick=()=>addProductRow({});document.querySelector('#receiptFile').onchange=e=>{const file=e.target.files[0];document.querySelector('#receiptFileName').textContent=file?.name||document.querySelector('#receiptModal').dataset.fileName||'Geen bestand gekozen';if(file){resetReceiptRecognitionFields();readReceiptFile(file)}};
const viewModal=document.querySelector('#receiptViewModal'),viewMenu=document.querySelector('#receiptViewMenu'),viewMenuButton=document.querySelector('#receiptViewMenuButton');
document.querySelector('#receiptViewBack').onclick=closeReceiptView;viewModal.onclick=e=>{if(e.target.id==='receiptViewModal')closeReceiptView()};viewMenuButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();viewMenu.hidden=!viewMenu.hidden;viewMenuButton.setAttribute('aria-expanded',String(!viewMenu.hidden))});viewMenu.addEventListener('click',e=>{const actionButton=e.target.closest('[data-receipt-action]');if(!actionButton)return;e.preventDefault();e.stopPropagation();const action=actionButton.dataset.receiptAction;viewMenu.hidden=true;viewMenuButton.setAttribute('aria-expanded','false');handleReceiptViewAction(action)});document.addEventListener('click',e=>{if(!e.target.closest('.receipt-view-menu-wrap')&&viewMenu&&!viewMenu.hidden){viewMenu.hidden=true;viewMenuButton.setAttribute('aria-expanded','false')}});
form.onsubmit=e=>{e.preventDefault();if(readingReceipt)return;let all=receipts(),editingId=document.querySelector('#receiptEditId').value,id=editingId||String(Date.now()),lines=collectLines(),entered=parseFloat(document.querySelector('#receiptTotal').value.replace(',','.')),total=Number.isFinite(entered)?entered:lines.reduce((a,l)=>a+l.price,0),file=document.querySelector('#receiptFile').files[0],old=all.find(r=>String(r.id)===String(id)),obj={id,store:document.querySelector('#receiptStore').value.trim(),date:document.querySelector('#receiptDate').value,total,lines,note:document.querySelector('#receiptNote').value.trim(),source:receiptSource,fileName:file?.name||document.querySelector('#receiptModal').dataset.fileName||old?.fileName||''};const duplicate=isDuplicateReceipt(obj,all,editingId);if(duplicate&&!window.confirm(`Mogelijk is deze bon al toegevoegd:

${duplicate.store} · ${new Date(duplicate.date+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})} · ${money(duplicate.total)}

Toch opslaan?`))return;let i=all.findIndex(r=>String(r.id)===String(id));if(i>=0)all[i]=obj;else all.push(obj);saveReceipts(all);close();render()};setTimeout(openSharedReceipt,0);});
})();
