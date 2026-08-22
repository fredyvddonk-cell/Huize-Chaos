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


function isoWeekKeyFromDate(date){const d=new Date(date);const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return `${x.getUTCFullYear()}-W${String(Math.ceil((((x-y)/86400000)+1)/7)).padStart(2,'0')}`}
function isoWeekMonday(key){const m=String(key||'').match(/^(\d{4})-W(\d{2})$/);if(!m)return null;const year=Number(m[1]),week=Number(m[2]);const jan4=new Date(Date.UTC(year,0,4));const jan4Day=jan4.getUTCDay()||7;const monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-(jan4Day-1)+(week-1)*7);return monday}
const currentShoppingWeekKey=()=>isoWeekKeyFromDate(new Date());
let selectedShoppingWeek=localStorage.getItem('hc-shopping-selected-week')||currentShoppingWeekKey();
if(!isoWeekMonday(selectedShoppingWeek))selectedShoppingWeek=currentShoppingWeekKey();
function shoppingWeekKey(){return selectedShoppingWeek}
function eventWeekKey(date){return date?isoWeekKeyFromDate(new Date(date+'T12:00:00')):currentShoppingWeekKey()}
function weekLabel(){const [year,week]=shoppingWeekKey().split('-W');return `Week ${Number(week)}${year!==String(new Date().getFullYear())?` · ${year}`:''}`}
function shiftShoppingWeek(delta){const monday=isoWeekMonday(selectedShoppingWeek)||isoWeekMonday(currentShoppingWeekKey());monday.setUTCDate(monday.getUTCDate()+Number(delta||0)*7);selectedShoppingWeek=isoWeekKeyFromDate(monday);localStorage.setItem('hc-shopping-selected-week',selectedShoppingWeek);localStorage.removeItem('hc-shopping-week-offset');render()}
function inferShoppingMeta(name){const n=String(name||'').toLowerCase();const p=products.find(x=>String(x.name||'').toLowerCase()===n)||products.find(x=>n.includes(String(x.name||'').toLowerCase())||String(x.name||'').toLowerCase().includes(n));return {category:p?.category||'Overig',store:p?.store||'Overig',status:p?.status||'Niet in huis'} }
function recipeWeekPlans(){try{return JSON.parse(localStorage.getItem('huize-chaos-recipe-weeks-v1')||'[]')}catch(_){return[]}}
function recipeShoppingRows(){const week=shoppingWeekKey();const stock=products||[];return recipeWeekPlans().filter(p=>p.week===week).flatMap(plan=>(plan.ingredients||[]).filter(i=>!i.done).map((i,index)=>{const m=inferShoppingMeta(i.ingredient);const inHouse=stock.some(x=>x.status==='In huis'&&String(x.name||'').toLowerCase()===String(i.ingredient||'').toLowerCase());return inHouse?null:{...m,name:i.ingredient,qty:[i.qty,i.unit].filter(Boolean).join(' '),sourceName:plan.title,sourceType:'recipe',planId:plan.id,index}}).filter(Boolean))}
function plannedRecipeTitles(){return [...new Set(recipeWeekPlans().filter(p=>p.week===shoppingWeekKey()).map(p=>p.title).filter(Boolean))]}
function occasionShoppingData(){
  const week=shoppingWeekKey();try{return (JSON.parse(localStorage.getItem('huize-chaos-occasions-v1')||'[]')||[]).map(e=>({...e,shopping:(e.shopping||[]).filter(x=>!x.done && ((x.buyWeek||eventWeekKey(e.date))===week))})).filter(e=>e.shopping.length)}catch(_){return []}
}
function occasionShoppingRows(){return occasionShoppingData().flatMap(e=>(e.shopping||[]).map((x,i)=>{const m=inferShoppingMeta(x.text);return {...m,name:x.text,qty:x.qty||'',sourceName:e.name||'Gelegenheid',sourceType:'occasion',eventId:e.id,index:i}}))}
function sourceShoppingHtml(){const rows=[...occasionShoppingRows(),...recipeShoppingRows()];if(!rows.length)return '';const key=group==='store'?'store':'category';const grouped={};rows.forEach(x=>(grouped[x[key]||'Overig']??=[]).push(x));return Object.entries(grouped).map(([title,items])=>`<section class="shopping-group"><div class="shopping-group-head"><span>${esc(title)}</span><span>${items.length}</span></div><div class="shopping-group-body">${items.map(x=>`<div class="item shopping-item"><input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" onchange="${x.sourceType==='occasion'?`markOccasionBought('${String(x.eventId).replace(/'/g,"\\'")}',${x.index},this.checked)`:`markRecipeIngredientBought('${x.planId}',${x.index},this.checked)`}"><div class="main"><div class="name">${esc(x.name)}</div><div class="meta">${[x.qty,x.sourceName].filter(Boolean).map(esc).join(' · ')}</div></div></div>`).join('')}</div></section>`).join('')}
window.markOccasionBought=(eventId,visibleIndex,checked)=>{
  let events=[];try{events=JSON.parse(localStorage.getItem('huize-chaos-occasions-v1')||'[]')||[]}catch(_){}
  const e=events.find(x=>String(x.id)===String(eventId));if(!e)return;const open=(e.shopping||[]).filter(x=>!x.done && ((x.buyWeek||eventWeekKey(e.date))===shoppingWeekKey()));const target=open[visibleIndex];if(!target)return;target.done=Boolean(checked);localStorage.setItem('huize-chaos-occasions-v1',JSON.stringify(events));window.dispatchEvent(new Event('huize-chaos-occasions-changed'));window.syncHuizeChaosOccasions?.(events);render();
};
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
    <div class="item shopping-item ${x.done ? 'done' : ''} ${isUrgent ? 'urgent-item' : ''}">
      <input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" ${x.done ? 'checked' : ''} onchange="markBought(${x.id}, this.checked)">
      <div class="main">
        <div class="name">${esc(x.name)}</div>
        ${[quantityText(x), showLocation ? x.store : '', showLocation ? x.category : ''].filter(Boolean).length ? `<div class="meta">${[quantityText(x), showLocation ? x.store : '', showLocation ? x.category : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
        ${x.cloudSource === 'family' && x.cloudAddedByName ? `<div class="added-by">Toegevoegd door ${esc(firstName(x.cloudAddedByName))}</div>` : ''}
        ${memoHtml(x)}
      </div>
      <details class="shopping-item-menu">
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
