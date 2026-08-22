let expandedShoppingGroups = new Set(JSON.parse(localStorage.getItem('household-expanded-shopping') || '[]'));
let shoppingStoreFilter = localStorage.getItem('household-shopping-store-filter') || 'all';


function positionShoppingMenu(details) {
  if (!details || !details.open) return;
  const summary = details.querySelector('summary');
  const popover = details.querySelector('.shopping-item-menu-popover');
  if (!summary || !popover) return;

  const anchor = summary.getBoundingClientRect();
  popover.style.visibility = 'hidden';
  popover.style.display = 'grid';
  const menuRect = popover.getBoundingClientRect();
  const margin = 8;

  let top = anchor.top;
  if (top + menuRect.height > window.innerHeight - margin) {
    top = window.innerHeight - menuRect.height - margin;
  }
  top = Math.max(margin, top);

  let left = anchor.right - menuRect.width;
  left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));

  popover.style.top = `${Math.round(top)}px`;
  popover.style.left = `${Math.round(left)}px`;
  popover.style.right = 'auto';
  popover.style.visibility = 'visible';
}

document.addEventListener('toggle', event => {
  const details = event.target.closest?.('.shopping-item-menu');
  if (!details) return;
  if (details.open) {
    document.querySelectorAll('.shopping-item-menu[open]').forEach(other => {
      if (other !== details) other.removeAttribute('open');
    });
    requestAnimationFrame(() => positionShoppingMenu(details));
  }
}, true);

document.addEventListener('click', event => {
  const active = event.target.closest('.shopping-item-menu');
  document.querySelectorAll('.shopping-item-menu[open]').forEach(menu => {
    if (!active || menu !== active || event.target.closest('.shopping-item-menu-popover button')) {
      menu.removeAttribute('open');
    }
  });
});

window.addEventListener('scroll', () => {
  document.querySelectorAll('.shopping-item-menu[open]').forEach(menu => menu.removeAttribute('open'));
}, true);
window.addEventListener('resize', () => {
  document.querySelectorAll('.shopping-item-menu[open]').forEach(menu => positionShoppingMenu(menu));
});

function saveShoppingExpansion() {
  localStorage.setItem('household-expanded-shopping', JSON.stringify([...expandedShoppingGroups]));
}

function shoppingGroupKey(level, parent, name) {
  return `${group}:${level}:${parent || ''}:${name}`;
}


function shoppingPrioritySort(a, b) {
  const priority = status => status === 'Niet in huis' ? 0 : 1;
  return priority(a.status) - priority(b.status) || sortProducts(a, b);
}

function firstName(value = '') {
  const name = String(value).trim();
  if (!name) return '';
  return name.split(/[\s@]+/)[0];
}

function renderShoppingGroup(title, items, level, parent, row) {
  const key = shoppingGroupKey(level, parent, title);
  const collapsed = !expandedShoppingGroups.has(key);
  const inner = [...items].sort(shoppingPrioritySort).map(item => row(item)).join('');
  return `<section class="shopping-group shopping-level-1 ${collapsed ? 'collapsed' : ''}">
    <button class="shopping-group-head" type="button" onclick="toggleShoppingGroup('${encodeURIComponent(key)}')">
      <span>${esc(title)}</span><span class="chevron">⌄</span>
    </button>
    <div class="shopping-group-body">${inner}</div>
  </section>`;
}

window.toggleShoppingGroup = encodedKey => {
  const key = decodeURIComponent(encodedKey);
  const parts = key.split(':');
  const level = Number(parts[1]);

  if (expandedShoppingGroups.has(key)) {
    expandedShoppingGroups.delete(key);
  } else {
    expandedShoppingGroups.add(key);

  }
  saveShoppingExpansion();
  render();
};

window.toggleAllShopping = () => {
  if (expandedShoppingGroups.size) {
    expandedShoppingGroups.clear();
  } else {
    let arr = products.filter(x => x.shopping);
    if (group === 'store' && shoppingStoreFilter !== 'all') {
      arr = arr.filter(x => (x.store || 'Overig') === shoppingStoreFilter);
    }
    groups(arr, group).forEach(([mainName]) => {
      expandedShoppingGroups.add(shoppingGroupKey(1, '', mainName));
    });
  }
  saveShoppingExpansion();
  render();
};


// V1.3.97 - weekberekening volledig in UTC, zodat gelegenheden in een ander jaar correct aan de boodschappenweek gekoppeld blijven.
function dateOnlyUtc(value){
  if(value instanceof Date)return new Date(Date.UTC(value.getFullYear(),value.getMonth(),value.getDate()));
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m)return new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])));
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
}
function isoWeekKeyFromDate(value){const d=dateOnlyUtc(value);if(!d)return '';const x=new Date(d);x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return `${x.getUTCFullYear()}-W${String(Math.ceil((((x-y)/86400000)+1)/7)).padStart(2,'0')}`}
function isoWeekMonday(key){const m=String(key||'').match(/^(\d{4})-W(\d{2})$/);if(!m)return null;const year=Number(m[1]),week=Number(m[2]);const jan4=new Date(Date.UTC(year,0,4));const jan4Day=jan4.getUTCDay()||7;const monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-(jan4Day-1)+(week-1)*7);return monday}
function weekContainsDate(key,date){const monday=isoWeekMonday(key),d=dateOnlyUtc(date);if(!monday||!d)return false;const sunday=new Date(monday);sunday.setUTCDate(sunday.getUTCDate()+6);return d>=monday&&d<=sunday}
const currentShoppingWeekKey=()=>isoWeekKeyFromDate(new Date());
let selectedShoppingWeek=localStorage.getItem('hc-shopping-selected-week')||currentShoppingWeekKey();
if(!isoWeekMonday(selectedShoppingWeek))selectedShoppingWeek=currentShoppingWeekKey();
function shoppingWeekKey(){return selectedShoppingWeek}
function eventWeekKey(date){return date?isoWeekKeyFromDate(date):currentShoppingWeekKey()}
function weekLabel(){const [year,week]=shoppingWeekKey().split('-W');return `Week ${Number(week)}${year!==String(new Date().getFullYear())?` · ${year}`:''}`}
function shiftShoppingWeek(delta){const monday=isoWeekMonday(selectedShoppingWeek)||isoWeekMonday(currentShoppingWeekKey());monday.setUTCDate(monday.getUTCDate()+Number(delta||0)*7);selectedShoppingWeek=isoWeekKeyFromDate(monday);localStorage.setItem('hc-shopping-selected-week',selectedShoppingWeek);localStorage.removeItem('hc-shopping-week-offset');render()}
function inferShoppingMeta(name){const n=String(name||'').toLowerCase();const p=products.find(x=>String(x.name||'').toLowerCase()===n)||products.find(x=>n.includes(String(x.name||'').toLowerCase())||String(x.name||'').toLowerCase().includes(n));return {category:p?.category||'Overig',store:p?.store||'Overig',status:p?.status||'Niet in huis'} }
function recipeWeekPlans(){try{return JSON.parse(localStorage.getItem('huize-chaos-recipe-weeks-v1')||'[]')}catch(_){return[]}}
function recipeNormFood(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\(gv\)/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(blik|blikje|pot|zak|pak|stuks?|verse|vers|diepvries|gekookte|gesneden)\b/g,' ').replace(/\s+/g,' ').trim().replace(/en$/,'')}
function recipeIngredientMatchesProduct(ingredient,product){const a=recipeNormFood(ingredient),b=recipeNormFood(product?.name);if(!a||!b)return false;const meaningful=w=>w.length>1&&!/^(rood|rode|geel|gele|groen|groene|wit|witte|zwart|zwarte|klein|kleine|groot|grote|heel|halve|half)$/.test(w),aw=a.split(/\s+/).filter(meaningful),bw=b.split(/\s+/).filter(meaningful),subset=(need,have)=>need.length>0&&need.every(w=>have.includes(w));return subset(bw,a.split(/\s+/))||subset(aw,b.split(/\s+/))}
function recipeUnit(u){const x=String(u||'').trim().toLowerCase();return ({gram:'g',gr:'g',kilogram:'kg',milliliter:'ml',liter:'l',stuk:'stuks',potje:'pot',potten:'pot',blikje:'blik',blikjes:'blik',zakje:'zak',zakjes:'zak',pakje:'pak',pakjes:'pak',flesje:'fles',flesjes:'fles'}[x]||x)}
function recipeAmount(q,u){const n=parseFloat(String(q??'').replace(',','.'));if(!Number.isFinite(n))return null;u=recipeUnit(u);if(u==='kg')return {n:n*1000,u:'g'};if(u==='l')return {n:n*1000,u:'ml'};return {n,u}}
function recipeStockCoverage(i){const p=(products||[]).find(x=>x.status==='In huis'&&recipeIngredientMatchesProduct(i.ingredient,x));if(!p)return {enough:false,matched:false,shortage:''};const have=recipeAmount(p.quantity,p.unit),need=recipeAmount(i.qty,i.unit);if(have&&need&&have.u&&have.u===need.u){if(have.n>=need.n)return {enough:true,matched:true,shortage:''};let missing=need.n-have.n,unit=need.u;if(recipeUnit(i.unit)==='kg'){missing/=1000;unit='kg'}else if(recipeUnit(i.unit)==='l'){missing/=1000;unit='l'}else unit=i.unit||need.u;return {enough:false,matched:true,shortage:[String(Number(missing.toFixed(3))).replace('.',','),unit].filter(Boolean).join(' ')}}return {enough:true,matched:true,shortage:''}}
function plannedRecipeTitles(){return [...new Set(recipeWeekPlans().filter(p=>p.week===shoppingWeekKey()).map(p=>p.title).filter(Boolean))]}
function materializeOccasionShopping(e){
  const saved=Array.isArray(e.shopping)?e.shopping:[];
  if(!e.shoppingCreated && !saved.length)return [];
  const rows=[];
  const add=(text,qty='')=>{
    text=String(text||'').trim();if(!text)return;
    const key=text.toLowerCase(),found=rows.find(r=>r.text.toLowerCase()===key);
    if(found){if(qty&&!found.qty)found.qty=qty;return}
    const old=saved.find(r=>String(r.text||'').trim().toLowerCase()===key);
    rows.push({text,qty:old?.qty||qty||'',done:Boolean(old?.done),buyWeek:old?.buyWeekOverride?old.buyWeek:eventWeekKey(e.date),buyWeekOverride:Boolean(old?.buyWeekOverride),store:old?.store||'',category:old?.category||'',unit:old?.unit||''});
  };
  (e.needs||[]).filter(x=>!x.done).forEach(x=>add(x.text,x.qty));
  (e.menu||[]).forEach(x=>{if(x.ingredients?.length)x.ingredients.filter(i=>i.enabled!==false).forEach(i=>add(i.ingredient,[i.qty,i.unit].filter(Boolean).join(' ')));else String(x.needed||'').split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean).forEach(v=>add(v,''))});
  saved.forEach(old=>{if(old.manual&&!rows.some(r=>r.text.toLowerCase()===String(old.text||'').trim().toLowerCase()))rows.push({...old})});
  return rows;
}
function occasionShoppingData(){const week=shoppingWeekKey();try{return (JSON.parse(localStorage.getItem('huize-chaos-occasions-v1')||'[]')||[]).map(e=>({...e,shopping:materializeOccasionShopping(e).filter(x=>!x.done&&(x.buyWeekOverride?x.buyWeek===week:weekContainsDate(week,e.date)))})).filter(e=>e.shopping.length)}catch(_){return []}}
function occasionShoppingRows(){return occasionShoppingData().flatMap(e=>(e.shopping||[]).map((x,i)=>{const m=inferShoppingMeta(x.text);return {...m,category:x.category||m.category,store:x.store||m.store,name:x.text,qty:x.qty||'',sourceName:e.name||'Gelegenheid',sourceType:'occasion',eventId:e.id,index:i}}))}
function recipeShoppingRows(){const week=shoppingWeekKey();return recipeWeekPlans().filter(p=>p.week===week).flatMap(plan=>(plan.ingredients||[]).map((i,index)=>({i,index})).filter(x=>!x.i.done&&!x.i.ordered).map(({i,index})=>{const m=inferShoppingMeta(i.ingredient),coverage=recipeStockCoverage(i);if(coverage.enough)return null;return {...m,category:i.category||m.category,store:i.store||m.store,name:i.ingredient,qty:i.shoppingQty||coverage.shortage||[i.qty,i.unit].filter(Boolean).join(' '),sourceName:plan.title,sourceType:'recipe',planId:plan.id,index}}).filter(Boolean))}
function sourceShoppingHtml(){const rows=[...occasionShoppingRows(),...recipeShoppingRows()];if(!rows.length)return '';const key=group==='store'?'store':'category',grouped={};rows.forEach(x=>(grouped[x[key]||'Overig']??=[]).push(x));return Object.entries(grouped).map(([title,items])=>`<section class="shopping-group"><div class="shopping-group-head"><span>${esc(title)}</span><span>${items.length}</span></div><div class="shopping-group-body">${items.map(x=>`<div class="item shopping-item source-shopping-item" role="button" tabindex="0" onclick="openSourceShoppingEdit('${x.sourceType}','${x.sourceType==='occasion'?String(x.eventId).replace(/'/g,"\\'"):String(x.planId).replace(/'/g,"\\'")}',${x.index})"><input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" onclick="event.stopPropagation()" onchange="${x.sourceType==='occasion'?`markOccasionBought('${String(x.eventId).replace(/'/g,"\\'")}',${x.index},this.checked)`:`markRecipeIngredientBought('${x.planId}',${x.index},this.checked)`}"><div class="main"><div class="name">${esc(x.name)}</div><div class="meta">${[x.qty,x.store,x.sourceName].filter(Boolean).map(esc).join(' · ')}</div></div></div>`).join('')}</div></section>`).join('')}
function ensureSourceEditDialog(){let d=document.getElementById('sourceShoppingEditDialog');if(d)return d;d=document.createElement('dialog');d.id='sourceShoppingEditDialog';d.innerHTML=`<form method="dialog" class="source-shopping-edit"><h2>Boodschap wijzigen</h2><p id="sourceEditName" class="source-edit-name"></p><label>Hoeveelheid<input id="sourceEditQty" autocomplete="off"></label><label>Winkel<input id="sourceEditStore" list="sourceStoreOptions" autocomplete="off"><datalist id="sourceStoreOptions"></datalist></label><label>Categorie<input id="sourceEditCategory" autocomplete="off"></label><p id="sourceEditOrigin" class="meta"></p><div class="actions"><button value="cancel">Annuleren</button><button id="sourceEditSave" value="default" class="primary">Opslaan</button></div></form>`;document.body.appendChild(d);return d}
window.openSourceShoppingEdit=(type,id,index)=>{const d=ensureSourceEditDialog();let row=type==='occasion'?occasionShoppingRows().find(x=>String(x.eventId)===String(id)&&x.index===Number(index)):recipeShoppingRows().find(x=>String(x.planId)===String(id)&&x.index===Number(index));if(!row)return;sourceEditName.textContent=row.name;sourceEditQty.value=row.qty||'';sourceEditStore.value=row.store==='Overig'?'':row.store||'';sourceEditCategory.value=row.category==='Overig'?'':row.category||'';sourceEditOrigin.textContent=`Herkomst: ${row.sourceName}`;sourceStoreOptions.innerHTML=[...new Set((products||[]).map(x=>x.store).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}"></option>`).join('');sourceEditSave.onclick=()=>saveSourceShoppingEdit(type,id,Number(index));d.showModal()}
window.saveSourceShoppingEdit=(type,id,index)=>{const qty=sourceEditQty.value.trim(),store=sourceEditStore.value.trim(),category=sourceEditCategory.value.trim();if(type==='occasion'){let events=[];try{events=JSON.parse(localStorage.getItem('huize-chaos-occasions-v1')||'[]')||[]}catch(_){}const e=events.find(x=>String(x.id)===String(id));if(!e)return;const visible=materializeOccasionShopping(e).filter(x=>!x.done&&(x.buyWeekOverride?x.buyWeek===shoppingWeekKey():weekContainsDate(shoppingWeekKey(),e.date))),target=visible[index];if(!target)return;const key=String(target.text||'').toLowerCase();let actual=(e.shopping||[]).find(x=>String(x.text||'').toLowerCase()===key);if(!actual){actual={...target};(e.shopping??=[]).push(actual)}actual.qty=qty;actual.store=store;actual.category=category;e.shoppingCreated=true;localStorage.setItem('huize-chaos-occasions-v1',JSON.stringify(events));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));window.syncHuizeChaosOccasions?.(events)}else{const plans=recipeWeekPlans(),p=plans.find(x=>String(x.id)===String(id));if(!p||!p.ingredients?.[index])return;p.ingredients[index].shoppingQty=qty;p.ingredients[index].store=store;p.ingredients[index].category=category;localStorage.setItem('huize-chaos-recipe-weeks-v1',JSON.stringify(plans));window.dispatchEvent(new Event('huize-chaos-recipe-weeks-changed'))}render()}
window.markOccasionBought=(eventId,visibleIndex,checked)=>{let events=[];try{events=JSON.parse(localStorage.getItem('huize-chaos-occasions-v1')||'[]')||[]}catch(_){}const e=events.find(x=>String(x.id)===String(eventId));if(!e)return;const visible=materializeOccasionShopping(e).filter(x=>!x.done&&(x.buyWeekOverride?x.buyWeek===shoppingWeekKey():weekContainsDate(shoppingWeekKey(),e.date))),target=visible[visibleIndex];if(!target)return;const key=String(target.text||'').toLowerCase();let actual=(e.shopping||[]).find(x=>String(x.text||'').toLowerCase()===key);if(!actual){actual={...target};(e.shopping??=[]).push(actual)}actual.done=Boolean(checked);e.shoppingCreated=true;localStorage.setItem('huize-chaos-occasions-v1',JSON.stringify(events));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));window.syncHuizeChaosOccasions?.(events);render()}
window.markRecipeIngredientBought=(planId,index,checked)=>{const plans=recipeWeekPlans(),p=plans.find(x=>String(x.id)===String(planId));if(!p||!p.ingredients?.[index])return;p.ingredients[index].done=Boolean(checked);localStorage.setItem('huize-chaos-recipe-weeks-v1',JSON.stringify(plans));render()};
window.addEventListener('huize-chaos-recipe-weeks-changed',()=>{if(typeof page!=='undefined'&&page==='list')render()});
window.addEventListener('huize-chaos-occasions-changed',()=>{if(typeof page!=='undefined'&&page==='list')render()});

function renderShopping(allProducts) {
  const wl=document.getElementById('shoppingWeekLabel');if(wl)wl.textContent=weekLabel();
  const arr = allProducts.filter(x => x.shopping);
  const done = arr.filter(x => x.done).length;
  const occasionCount=occasionShoppingRows().length + recipeShoppingRows().length;

  $('#count').textContent = `${arr.length + occasionCount} boodschappen · ${done} afgevinkt`;
  const collapseBtn = $('#collapseShoppingBtn');
  if (collapseBtn) collapseBtn.textContent = expandedShoppingGroups.size ? 'Alles inklappen' : 'Alles uitklappen';
  $('#processDoneBar').classList.toggle('visible', done > 0);
  $('#clearDone').textContent = done ? `✓ Boodschappen verwerken (${done})` : '✓ Boodschappen verwerken';

  document.querySelectorAll('[data-group]').forEach(button => {
    button.classList.toggle('active', button.dataset.group === group);
  });

  if (!arr.length && !occasionCount) {
    content.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  const stores = groups(arr, 'store');
  const chips = document.getElementById('storeChips');
  if (chips) {
    chips.innerHTML = `<button class="store-chip ${shoppingStoreFilter === 'all' ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('all')">Alle (${arr.length})</button>` +
      stores.map(([storeName, items]) => `<button class="store-chip ${shoppingStoreFilter === storeName ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('${encodeURIComponent(storeName)}')">${esc(storeName)} (${items.length})</button>`).join('');
  }

  const row = (x, showLocation = false) => {
    const isUrgent = x.status === 'Niet in huis' && x.buyDirectWhenOut;
    return `
    <div class="item shopping-item ${x.done ? 'done' : ''} ${isUrgent ? 'urgent-item' : ''}" role="button" tabindex="0" onclick="editProduct(${x.id})">
      <input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" ${x.done ? 'checked' : ''} onclick="event.stopPropagation()" onchange="markBought(${x.id}, this.checked)">
      <div class="main">
        <div class="name">${esc(x.name)}</div>
        ${[quantityText(x), showLocation ? x.store : '', showLocation ? x.category : ''].filter(Boolean).length ? `<div class="meta">${[quantityText(x), showLocation ? x.store : '', showLocation ? x.category : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
        ${x.cloudSource === 'family' && x.cloudAddedByName ? `<div class="added-by">Toegevoegd door ${esc(firstName(x.cloudAddedByName))}</div>` : ''}
        ${memoHtml(x)}
      </div>
      <details class="shopping-item-menu" onclick="event.stopPropagation()">
        <summary aria-label="Acties voor ${esc(x.name)}" title="Acties">⋮</summary>
        <div class="shopping-item-menu-popover">
          <button type="button" onclick="editProduct(${x.id})">Wijzigen</button>
          <button class="delete" type="button" onclick="removeFromShopping(${x.id})">Verwijderen</button>
        </div>
      </details>
    </div>`;
  };

  let html = '';
  let visibleItems = arr;
  if (group === 'store' && shoppingStoreFilter !== 'all') {
    visibleItems = arr.filter(x => (x.store || 'Overig') === shoppingStoreFilter);
  }
  if (visibleItems.length) {
    html = groups(visibleItems, group).map(([groupName, items]) => renderShoppingGroup(groupName, items, 1, '', row)).join('');
  }

  const sourcePrintable=[...occasionShoppingRows(),...recipeShoppingRows()].map(x=>({name:x.name,category:x.category||'Overig',quantity:x.qty||'',unit:'',memo:x.sourceName||'',status:x.status||'Niet in huis'})); const printable = [...arr.filter(x => !x.done),...sourcePrintable];
  const printCategories = groups(printable, 'category').map(([categoryName, items]) => {
    let weight = 2;
    const rows = [...items].sort(shoppingPrioritySort).map(x => {
        const isUrgent = x.status === 'Niet in huis' && x.buyDirectWhenOut;
        const details = [quantityText(x), x.memo].filter(Boolean).map(esc).join(' · ');
        weight += 1 + (details ? .55 : 0) + (String(x.name).length > 28 ? .4 : 0) + (details.length > 36 ? .35 : 0);
        return `<div class="print-item ${isUrgent ? 'urgent-item' : ''}">
          <span class="print-check" aria-hidden="true"></span>
          <div><div class="print-name">${esc(x.name)}</div>${details ? `<div class="print-meta">${details}</div>` : ''}</div>
        </div>`;
      }).join('');
    return {
      weight,
      html: `<section class="print-category"><h2>${esc(categoryName)}</h2>${rows}</section>`
    };
  });

  const totalWeight = printCategories.reduce((sum, category) => sum + category.weight, 0);
  let splitAt = printCategories.length;
  let runningWeight = 0;
  let smallestDifference = Infinity;
  for (let index = 1; index < printCategories.length; index += 1) {
    runningWeight += printCategories[index - 1].weight;
    const difference = Math.abs(totalWeight / 2 - runningWeight);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      splitAt = index;
    }
  }
  const leftPrintColumn = printCategories.slice(0, splitAt).map(category => category.html).join('');
  const rightPrintColumn = printCategories.slice(splitAt).map(category => category.html).join('');
  const printHtml = `<div class="print-column">${leftPrintColumn}</div><div class="print-column">${rightPrintColumn}</div>`;

  const recipeHeads=plannedRecipeTitles(); const headsHtml=recipeHeads.length?`<div class="print-week-recipes"><h1>Week ${Number(shoppingWeekKey().slice(-2))}</h1><ul>${recipeHeads.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''; content.innerHTML = `<div class="screen-shopping">${sourceShoppingHtml()}${html}</div>${headsHtml}<div class="print-shopping">${printHtml}</div>`;
}


window.setShoppingStoreFilter = encodedStore => {
  const store = encodedStore === 'all' ? 'all' : decodeURIComponent(encodedStore);
  shoppingStoreFilter = store;
  localStorage.setItem('household-shopping-store-filter', store);
  render();
};

window.markBought = (id, checked) => {
  const x = products.find(x => x.id === id);
  if (!x) return;
  x.done = Boolean(checked);
  save();
  render();
};

window.removeFromShopping = id => {
  requestProductDelete(id, 'shopping');
};

function bindShoppingEvents() {
  document.querySelectorAll('[data-group]').forEach(button => {
    button.onclick = () => {
      group = button.dataset.group;
      localStorage.setItem('household-group', group);
      render();
    };
  });

  $('#collapseShoppingBtn').onclick = toggleAllShopping; const wl=$('#shoppingWeekLabel');if(wl)wl.textContent=weekLabel();$('#prevShoppingWeek').onclick=()=>shiftShoppingWeek(-1);$('#nextShoppingWeek').onclick=()=>shiftShoppingWeek(1);
  $('#printList').onclick = () => window.print();
  document.addEventListener('click', event => {
    document.querySelectorAll('.shopping-item-menu[open]').forEach(menu => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  document.addEventListener('toggle', event => {
    if (!event.target.matches?.('.shopping-item-menu') || !event.target.open) return;
    document.querySelectorAll('.shopping-item-menu[open]').forEach(menu => {
      if (menu !== event.target) menu.removeAttribute('open');
    });
  }, true);

  $('#clearDone').onclick = () => {
    products = products.filter(x => {
      if (x.shopping && x.done && x.temporary) return false;
      if (x.shopping && x.done) {
        x.status = 'In huis';
        x.shopping = false;
        x.done = false;
        if (x.cloudSource === 'family') x.cloudSource = 'stock';
      }
      return true;
    });
    save();
    render();
  };
}
