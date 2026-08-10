let hutselItems = JSON.parse(localStorage.getItem('household-hutsel-v1') || '[]');

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function tomorrowKey() {
  const d = new Date(); d.setDate(d.getDate()+1); return localDateKey(d);
}
function saveHutsel() {
  localStorage.setItem('household-hutsel-v1', JSON.stringify(hutselItems));
}
function normalizeHutselDates() {
  const today = localDateKey();
  let changed = false;
  hutselItems.forEach(x => {
    // Alles waarvan de geplande dag verstreken is, hoort nu bij Vandaag.
    if (!x.useDate || x.useDate < today) { x.useDate = today; changed = true; }
  });
  if (changed) saveHutsel();
}
function openHutselModal(item=null) {
  $('#hutselEditId').value = item?.id || '';
  $('#hutselName').value = item?.name || '';
  $('#hutselNote').value = item?.note || '';
  const day = item?.useDate === tomorrowKey() ? 'tomorrow' : 'today';
  document.querySelector(`input[name="hutselDay"][value="${day}"]`).checked = true;
  $('#hutselModal').classList.add('open');
  setTimeout(()=>$('#hutselName').focus(),50);
}
function closeHutselModal(){ $('#hutselModal').classList.remove('open'); }

window.sendStockToHutsel = id => {
  const product = products.find(x => x.id === id);
  if (!product) return;

  const quantity = [product.quantity, product.unit].filter(Boolean).join(' ');
  $('#hutselEditId').value = '';
  $('#hutselName').value = product.name || '';
  $('#hutselNote').value = quantity || product.memo || '';
  document.querySelector('input[name="hutselDay"][value="today"]').checked = true;
  $('#hutselModal').classList.add('open');
  setTimeout(() => {
    const tomorrow = document.querySelector('input[name="hutselDay"][value="tomorrow"]');
    if (tomorrow) tomorrow.focus();
  }, 50);
};



function renderHutsel() {
  normalizeHutselDates();
  const q = search.value.trim().toLowerCase();
  const arr = hutselItems.filter(x => x.name.toLowerCase().includes(q) || (x.note||'').toLowerCase().includes(q));
  const today=localDateKey(), tomorrow=tomorrowKey();
  const section=(title,items,cls)=>`
    <section class="hutsel-section ${cls}">
      <h2 class="section">${title} <span class="hutsel-count">${items.length}</span></h2>
      ${items.length ? items.map(x=>`
        <div class="item hutsel-item">
          <button class="hutsel-done" type="button" onclick="finishHutsel(${x.id})" aria-label="${esc(x.name)} opgebruikt">✓</button>
          <div class="main" onclick="editHutsel(${x.id})" role="button">
            <div class="name">${esc(x.name)}</div>
            ${x.note ? `<div class="meta">${esc(x.note)}</div>`:''}
          </div>
          <button class="small" type="button" onclick="editHutsel(${x.id})">Wijzig</button>
        </div>`).join('') : `<div class="hutsel-empty">Niets voor ${title.toLowerCase()}.</div>`}
    </section>`;
  const t=arr.filter(x=>x.useDate===today);
  const tm=arr.filter(x=>x.useDate===tomorrow);
  content.innerHTML=`<div class="hutsel-intro"><strong>Wat moet eerst op?</strong><span>Restjes blijven los van je boodschappenlijst.</span></div>${section('Vandaag',t,'today')}${section('Morgen',tm,'tomorrow')}${freezerHtml(q)}`;
}
window.finishHutsel=id=>{
  hutselItems=hutselItems.filter(x=>x.id!==id);
  saveHutsel(); render();
};
window.editHutsel=id=>openHutselModal(hutselItems.find(x=>x.id===id));

function bindHutselEvents(){
  $('#hutselForm').onsubmit=e=>{
    e.preventDefault();
    const name=$('#hutselName').value.trim();
    if(!name)return;
    const id=Number($('#hutselEditId').value);
    const day=document.querySelector('input[name="hutselDay"]:checked').value;
    const data={name,note:$('#hutselNote').value.trim(),useDate:day==='tomorrow'?tomorrowKey():localDateKey()};
    if(id) Object.assign(hutselItems.find(x=>x.id===id),data);
    else hutselItems.push({id:Date.now(),...data});
    saveHutsel(); closeHutselModal(); render();
  };
  $('#hutselCancel').onclick=closeHutselModal;
  $('#hutselModal').onclick=e=>{if(e.target.id==='hutselModal')closeHutselModal();};
}


let freezerMeals = JSON.parse(localStorage.getItem('household-freezer-meals-v1') || '[]');
function saveFreezerMeals(){localStorage.setItem('household-freezer-meals-v1',JSON.stringify(freezerMeals));}
function openFreezerModal(item=null){
  $('#freezerModalTitle').textContent=item?'Diepvriesmaaltijd wijzigen':'Diepvriesmaaltijd toevoegen';
  $('#freezerEditId').value=item?.id||'';
  $('#freezerName').value=item?.name||'';
  $('#freezerPortions').value=item?.portions||1;
  $('#freezerDate').value=item?.frozenDate||localDateKey();
  $('#freezerNote').value=item?.note||'';
  $('#freezerModal').classList.add('open');
  setTimeout(()=>$('#freezerName').focus(),50);
}
function closeFreezerModal(){$('#freezerModal').classList.remove('open');}
function freezerHtml(q=''){
  const arr=freezerMeals.filter(x=>x.name.toLowerCase().includes(q)||(x.note||'').toLowerCase().includes(q));
  return `<section class="hutsel-section freezer-section">
    <div class="freezer-heading"><h2 class="section">Diepvries <span class="hutsel-count">${arr.reduce((n,x)=>n+Number(x.portions||0),0)} porties</span></h2><button class="small freezer-add" type="button" onclick="openFreezerModal()">+ Maaltijd</button></div>
    ${arr.length?arr.sort((a,b)=>a.name.localeCompare(b.name,'nl')).map(x=>`
      <div class="item hutsel-item">
        <button class="freezer-take" type="button" onclick="decrementFreezerMeal(${x.id})">−1</button>
        <div class="main" onclick="editFreezerMeal(${x.id})" role="button"><div class="name">${esc(x.name)}</div><div class="meta">${x.portions} ${Number(x.portions)===1?'portie':'porties'}${x.frozenDate?' · '+esc(x.frozenDate):''}${x.note?' · '+esc(x.note):''}</div></div>
        <button class="small" type="button" onclick="editFreezerMeal(${x.id})">Wijzig</button>
      </div>`).join(''):'<div class="hutsel-empty">Nog geen maaltijden in de diepvries.</div>'}
  </section>`;
}
window.openFreezerModal=openFreezerModal;
window.editFreezerMeal=id=>openFreezerModal(freezerMeals.find(x=>x.id===id));
window.decrementFreezerMeal=id=>{
  const x=freezerMeals.find(x=>x.id===id); if(!x)return;
  x.portions=Math.max(0,Number(x.portions||0)-1);
  if(x.portions===0) freezerMeals=freezerMeals.filter(m=>m.id!==id);
  saveFreezerMeals();render();
};
window.takeFreezerMeal=id=>{
  const x=freezerMeals.find(x=>x.id===id); if(!x)return;
  const choice=prompt('Wanneer wil je deze portie gebruiken? Typ Vandaag of Morgen.','Morgen');
  if(choice===null)return;
  const v=choice.trim().toLowerCase();
  if(v!=='vandaag'&&v!=='morgen'){alert('Kies Vandaag of Morgen.');return;}
  hutselItems.push({id:Date.now(),name:x.name,note:'1 portie uit diepvries',useDate:v==='morgen'?tomorrowKey():localDateKey()});
  x.portions=Number(x.portions||1)-1;
  if(x.portions<=0) freezerMeals=freezerMeals.filter(m=>m.id!==id);
  saveFreezerMeals();saveHutsel();render();
};
function bindFreezerEvents(){
  $('#freezerForm').onsubmit=e=>{
    e.preventDefault(); const name=$('#freezerName').value.trim();if(!name)return;
    const id=Number($('#freezerEditId').value);
    const data={name,portions:Math.max(1,Number($('#freezerPortions').value)||1),frozenDate:$('#freezerDate').value,note:$('#freezerNote').value.trim()};
    if(id)Object.assign(freezerMeals.find(x=>x.id===id),data);else freezerMeals.push({id:Date.now(),...data});
    saveFreezerMeals();closeFreezerModal();render();
  };
  $('#freezerCancel').onclick=closeFreezerModal;
  $('#freezerModal').onclick=e=>{if(e.target.id==='freezerModal')closeFreezerModal();};
}
