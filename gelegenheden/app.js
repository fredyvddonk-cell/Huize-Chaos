const KEY='huize-chaos-occasions-v1';
let activeEventId='';
let events=JSON.parse(localStorage.getItem(KEY)||'[]');
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const nlDate=s=>{if(!s)return 'Geen datum';const d=new Date(`${s}T12:00:00`);return Number.isNaN(d.getTime())?s:new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(d)};
function normalizeEvent(e){e.items=e.items||[];e.needs=e.needs||[];e.prep=e.prep||[];e.evaluation=e.evaluation||'';return e}
events=events.map(normalizeEvent);
function save(){localStorage.setItem(KEY,JSON.stringify(events));render()}
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
  if(!e){e={id,items:[],needs:[],prep:[],evaluation:''};events.push(e)}
  normalizeEvent(e);
  e.name=$('#eventName').value.trim();
  e.date=$('#eventDate').value;
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
      <div class="section-title"><div><h3>Wat heb ik nodig?</h3><p>Maak vooraf een lijst met wat je voor deze gelegenheid nodig hebt.</p></div></div>
      <div id="needsList" class="check-list">${(e.needs||[]).map((x,i)=>needHtml(x,i)).join('')||'<p class="meta empty-line">Nog niets op de lijst.</p>'}</div>
      <div class="quick-add needs-add"><input id="newNeed" placeholder="Bijv. chips, servetten of kaarsjes"><input id="newNeedQty" placeholder="Aantal / hoeveelheid"><button class="primary" onclick="addNeed('${id}')">+ Toevoegen</button></div>
    </section>

    <section class="occasion-section">
      <div class="section-title"><div><h3>Voorbereiden</h3><p>Zet klaar wat er gedaan moet worden. Een datum is optioneel.</p></div></div>
      <div id="prepList" class="check-list">${prepSorted(e).map(({x,i})=>prepHtml(x,i)).join('')||'<p class="meta empty-line">Nog geen voorbereidingen toegevoegd.</p>'}</div>
      <div class="quick-add prep-add"><input id="newPrep" placeholder="Bijv. soep maken of tafel dekken"><label class="compact-date"><span>Datum (optioneel)</span><input id="newPrepDate" type="date"></label><button class="primary" onclick="addPrep('${id}')">+ Toevoegen</button></div>
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
function needHtml(x,i){return `<div class="check-row ${x.done?'done':''}"><input class="row-check" type="checkbox" ${x.done?'checked':''} onchange="updateNeed(${i},'done',this.checked)"><input class="grow" value="${esc(x.text||'')}" aria-label="Benodigd" onchange="updateNeed(${i},'text',this.value)"><input class="qty" value="${esc(x.qty||'')}" placeholder="Aantal / hoeveelheid" aria-label="Aantal" onchange="updateNeed(${i},'qty',this.value)"><button class="del danger" onclick="deleteNeed(${i})" aria-label="Verwijderen">×</button></div>`}
function prepSorted(e){return (e.prep||[]).map((x,i)=>({x,i})).sort((a,b)=>{if(a.x.done!==b.x.done)return a.x.done?1:-1;if(!a.x.date&&!b.x.date)return 0;if(!a.x.date)return 1;if(!b.x.date)return -1;return a.x.date.localeCompare(b.x.date)})}
function prepHtml(x,i){return `<div class="check-row prep-row ${x.done?'done':''}"><input class="row-check" type="checkbox" ${x.done?'checked':''} onchange="updatePrep(${i},'done',this.checked)"><input class="grow" value="${esc(x.text||'')}" aria-label="Voorbereiding" onchange="updatePrep(${i},'text',this.value)"><input class="date" type="date" value="${esc(x.date||'')}" aria-label="Datum" onchange="updatePrep(${i},'date',this.value)"><button class="del danger" onclick="deletePrep(${i})" aria-label="Verwijderen">×</button></div>`}
function itemHtml(x,i){
  const excess=x.result==='Te veel'?`<input class="excess" value="${esc(x.excessQty||'')}" placeholder="Aantal over" aria-label="Aantal over" onchange="updateItem(${i},'excessQty',this.value)">`:'';
  return `<div class="item-wrap"><div class="item"><input class="product" value="${esc(x.product)}" onchange="updateItem(${i},'product',this.value)"><select onchange="updateItem(${i},'category',this.value)">${['Eten','Hapjes','Dranken','Overig'].map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('')}</select><input value="${esc(x.qty||'')}" placeholder="Aantal" onchange="updateItem(${i},'qty',this.value)"><input value="${esc(x.cost||'')}" inputmode="decimal" placeholder="Kosten" onchange="updateItem(${i},'cost',this.value)"><select onchange="updateItemResult(${i},this.value)"><option value="">—</option>${['Te veel','Precies goed','Te weinig'].map(c=>`<option ${x.result===c?'selected':''}>${c}</option>`).join('')}</select><button class="del danger" onclick="deleteItem(${i})">×</button></div>${excess?`<div class="excess-row"><label>Aantal over${excess}</label></div>`:''}</div>`
}
function current(){return events.find(x=>x.id===activeEventId)}
window.addNeed=id=>{const e=events.find(x=>x.id===id);const text=$('#newNeed').value.trim();if(!e||!text)return;normalizeEvent(e);e.needs.push({text,qty:$('#newNeedQty').value.trim(),done:false});save();openDetail(id)};
window.updateNeed=(i,k,v)=>{const e=current();if(!e)return;e.needs[i][k]=v;save();openDetail(e.id)};
window.deleteNeed=i=>{const e=current();if(!e)return;e.needs.splice(i,1);save();openDetail(e.id)};
window.addPrep=id=>{const e=events.find(x=>x.id===id);const text=$('#newPrep').value.trim();if(!e||!text)return;normalizeEvent(e);e.prep.push({text,date:$('#newPrepDate').value,done:false});save();openDetail(id)};
window.updatePrep=(i,k,v)=>{const e=current();if(!e)return;e.prep[i][k]=v;save();openDetail(e.id)};
window.deletePrep=i=>{const e=current();if(!e)return;e.prep.splice(i,1);save();openDetail(e.id)};
window.addItem=id=>{const e=events.find(x=>x.id===id);const product=$('#newProduct').value.trim();if(!product)return;const result=$('#newResult').value;e.items.push({product,category:$('#newCategory').value,qty:$('#newQty').value,cost:$('#newCost').value.replace(',','.'),result,excessQty:result==='Te veel'?$('#newExcessQty').value:''});save();openDetail(id)};
window.updateItem=(i,k,v)=>{const e=current();if(!e)return;e.items[i][k]=k==='cost'?v.replace(',','.'):v;save();openDetail(e.id)};
window.updateItemResult=(i,v)=>{const e=current();if(!e)return;e.items[i].result=v;if(v!=='Te veel')e.items[i].excessQty='';save();openDetail(e.id)};
window.deleteItem=i=>{const e=current();if(!e)return;e.items.splice(i,1);save();openDetail(e.id)};
window.saveEvaluation=id=>{const e=events.find(x=>x.id===id);e.evaluation=$('#evaluation').value;save();openDetail(id)};
window.editEvent=id=>{const e=events.find(x=>x.id===id);$('#detailDialog').close();openForm(e)};
window.deleteEvent=id=>{if(!confirm('Deze gelegenheid verwijderen?'))return;events=events.filter(x=>x.id!==id);save();$('#detailDialog').close()};
render();
