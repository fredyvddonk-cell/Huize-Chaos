let expandedStockCategories = new Set(JSON.parse(localStorage.getItem('household-expanded-stock') || '[]'));
// Voorraadfilters zijn tijdelijk. Een Weekcheck of Maandcheck opent altijd
// met alle producten binnen die check, nooit met een oud opgeslagen filter.
// Eén controle per vaste plek; oude checkCycle-gegevens blijven bewaard voor compatibiliteit.
let stockView = 'location';
let stockLocationFilter = localStorage.getItem('household-stock-location-filter') || '';
const STOCK_VIEW_HELP = {
  standard: 'Standaard voorraad', meal: 'Maaltijdvoorraad',
  location: 'Per vaste plek', spices: 'Alle kruiden en specerijen'
};
const CHECK_LABEL = {week:'Weekcheck',month:'Maandcheck',work:'Alleen bij Wat kan ik maken?',rare:'Zelden'};
function stockSpice(p){return String(p.category||'').toLocaleLowerCase('nl').includes('kruiden') || /\b(kruidenmix|rub|specerij)\b/i.test(String(p.name||''));}
function stockLocationName(p){return String(p.stockLocation||'').trim() || 'Nog indelen';}
function stockCheckTime(p){return Number(p.stockCheckedAt)||0;}
function stockCheckLabel(p){const t=stockCheckTime(p);return t?new Date(t).toLocaleDateString('nl-NL'):'Nog niet gecontroleerd';}
window.confirmStockProduct=id=>{
  const p=products.find(item=>String(item.id)===String(id));if(!p)return;
  p.stockCheckedAt=Date.now();
  save();
  // Werk de zichtbare regel meteen bij, zonder de geopende plank of scrollpositie te verliezen.
  const button=[...document.querySelectorAll("[data-stock-check]")].find(el=>el.dataset.stockCheck===String(id));
  if(button){
    button.textContent="✓";
    button.title="Gecontroleerd op "+stockCheckLabel(p);
    button.classList.add("is-checked");
    button.setAttribute("aria-label",`${p.name} gecheckt`);
    const card=button.closest(".stock-item");
    const label=card?.querySelector(".stock-last-check");
    if(label)label.textContent=stockLocationName(p);
  }
  const visible=stockProductsForView(products.filter(x=>!x.temporary && x.name.toLowerCase().includes(String(search?.value||" ").trim().toLowerCase())));
  const progress=document.getElementById("stockProgress");
  if(progress)progress.textContent=`${visible.filter(item=>stockCheckTime(item)).length} van ${visible.length} met controledatum`;
};
window.setStockLocationFilter=value=>{
  stockLocationFilter=String(value||'');localStorage.setItem('household-stock-location-filter',stockLocationFilter);
  expandedStockCategories.clear(); if(stockLocationFilter)expandedStockCategories.add(stockLocationFilter);
  saveStockExpansion();render();
};
function updateStockLocationPicker(){
  const picker=document.getElementById('stockLocationPicker');
  if(!picker)return;
  picker.hidden=stockView!=='location';
  const select=document.getElementById('stockLocationFilter');
  const locations=[...new Set(products.filter(p=>!p.temporary).map(stockLocationName))]
    .sort((a,b)=>a==='Nog indelen'?1:b==='Nog indelen'?-1:a.localeCompare(b,'nl',{numeric:true}));
  if(stockLocationFilter&&!locations.includes(stockLocationFilter))stockLocationFilter='';
  select.innerHTML='<option value="">Alle plekken</option>'+locations.map(loc=>`<option value="${esc(loc)}" ${loc===stockLocationFilter?'selected':''}>${esc(loc)}</option>`).join('');
  document.getElementById('stockProgress').textContent='';
}
function saveStockExpansion() {
  localStorage.setItem('household-expanded-stock', JSON.stringify([...expandedStockCategories]));
}

window.toggleStockCategory = encodedName => {
  const name = decodeURIComponent(encodedName);
  if (expandedStockCategories.has(name)) expandedStockCategories.delete(name);
  else expandedStockCategories.add(name);
  saveStockExpansion();
  render();
};

window.toggleAllStock = () => {
  if (expandedStockCategories.size) {
    expandedStockCategories.clear();
  } else {
    const visible=stockProductsForView(products);
    if(stockView==='location')visible.forEach(p=>expandedStockCategories.add(stockLocationName(p)));
    else groups(visible,'category').forEach(([name])=>expandedStockCategories.add(name||'Overig'));
  }
  saveStockExpansion();
  render();
};

window.setStockView = next => {
  if (!['all','standard','meal','location','spices'].includes(next)) return;
  stockView = next;
  expandedStockCategories.clear();
  saveStockExpansion();
  const menu = document.querySelector('.stock-filter-menu');
  if (menu) menu.open = false;
  render();
};

function updateStockViewControls(){
  document.querySelectorAll('[data-stock-view]').forEach(button=>button.classList.toggle('active',button.dataset.stockView===stockView));
  updateStockLocationPicker();
}

function stockBadges(product){ return ''; }

function stockItemHtml(x){
  return `<div class="stock-swipe-shell" data-stock-swipe data-id="${esc(String(x.id))}" data-product-id="${esc(String(x.id))}">
    <div class="stock-swipe-back stock-swipe-delete"><button type="button" class="stock-swipe-delete-button">Verwijderen</button></div>
    <div class="stock-swipe-back stock-swipe-cycle">
      <button type="button" onclick="setStockRole(${JSON.stringify(String(x.id))},'standard')">Standaard</button>
      <button type="button" onclick="setStockRole(${JSON.stringify(String(x.id))},'meal')">Maaltijd</button>
    </div>
    <div class="item stock-item stock-swipe-content">
      <div class="main" data-stock-edit="${esc(String(x.id))}" role="button" tabindex="0">
        <div class="name">${esc(x.name)}</div>
        ${stockBadges(x)}
        ${memoHtml(x)}
        <div class="stock-last-check">${esc(stockLocationName(x))}</div>
      </div>
      <div class="stock-actions stock-actions-compact">
        <button type="button" class="status stock-status-toggle ${x.status === 'In huis' ? 'good' : 'low'}" data-stock-status="${esc(String(x.id))}" aria-label="Voorraadstatus van ${esc(x.name)}: ${esc(x.status)}. Tik om te wijzigen.">${x.status}</button>
        <button type="button" class="stock-confirm ${stockCheckTime(x)?'is-checked':''}" data-stock-check="${esc(String(x.id))}" aria-label="${esc(x.name)} gecontroleerd markeren" title="${esc(stockCheckLabel(x))}">✓</button>
        <label class="stock-buy-check stock-buy-red"><input type="checkbox" data-stock-buy="${esc(String(x.id))}" ${x.shopping ? 'checked' : ''}><span>Kopen</span></label>
        <button type="button" class="stock-remove-quick" data-stock-remove="${esc(String(x.id))}" title="Uit Voorraad halen" aria-label="${esc(x.name)} uit Voorraad halen">×</button>
      </div>
    </div>
  </div>`;
}

window.setStockCheckCycle = (id, cycle) => {
  if (!['week','month','work','rare'].includes(cycle)) return;
  const product = products.find(x => String(x.id) === String(id));
  if (!product) return;
  product.checkCycle = cycle;
  save();
  render();
};

window.setStockRole = (id, role) => {
  if (!['standard','meal'].includes(role)) return;
  const product = products.find(x => String(x.id) === String(id));
  if (!product) return;
  product.stockRole = role;
  save();
  render();
};

function bindStockSwipeActions(){
  document.querySelectorAll('[data-stock-swipe]').forEach(shell => {
    const card = shell.querySelector('.stock-swipe-content');
    const main = shell.querySelector('[data-stock-edit]');
    if (!card || shell.dataset.swipeBound === '1') return;
    shell.dataset.swipeBound = '1';

    let pointerId = null;
    let startX = 0, startY = 0, dx = 0, dy = 0;
    let tracking = false, gesture = '';
    let suppressClickUntil = 0;
    const id = String(shell.dataset.id || '');

    const resetPosition = () => {
      card.style.transform = '';
      shell.classList.remove('swipe-delete-open','swipe-cycle-open','stock-swiping','swipe-delete-armed');
      dx = 0; dy = 0; gesture = ''; tracking = false; pointerId = null;
    };

    const closeOtherSwipes = () => {
      document.querySelectorAll('[data-stock-swipe].swipe-cycle-open,[data-stock-swipe].swipe-delete-open').forEach(other => {
        if (other === shell) return;
        other.classList.remove('swipe-cycle-open','swipe-delete-open');
        const otherCard = other.querySelector('.stock-swipe-content');
        if (otherCard) otherCard.style.transform = '';
      });
    };

    card.addEventListener('pointerdown', e => {
      // Swipen is alleen voor touch/pen. Op desktop moet een gewone muisklik
      // direct beschikbaar blijven om het voorraadproduct te openen.
      if (!e.isPrimary || e.pointerType === 'mouse') return;
      if (e.target.closest('button,input,label,select,textarea,a')) return;
      closeOtherSwipes();
      pointerId = e.pointerId;
      startX = e.clientX; startY = e.clientY; dx = 0; dy = 0;
      tracking = true; gesture = '';
      shell.classList.add('stock-swiping');
      try { card.setPointerCapture(pointerId); } catch (_) {}
    });

    card.addEventListener('pointermove', e => {
      if (!tracking || e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;

      if (!gesture) {
        if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.1) {
          // Verticaal: laat de browser gewoon scrollen en behandel dit niet als swipe.
          resetPosition();
          return;
        }
        gesture = 'horizontal';
      }

      if (gesture !== 'horizontal') return;
      const limited = Math.max(-280, Math.min(125, dx));
      card.style.transform = `translateX(${limited}px)`;
      shell.classList.toggle('swipe-delete-armed', dx > 85);
      if (e.cancelable) e.preventDefault();
    });

    const finishPointer = e => {
      if (!tracking || e.pointerId !== pointerId) return;
      const finalDx = dx;
      const wasHorizontal = gesture === 'horizontal';
      shell.classList.remove('stock-swiping');
      tracking = false;
      try { card.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;

      if (wasHorizontal && finalDx > 65) {
        suppressClickUntil = Date.now() + 700;
        card.style.transform = 'translateX(132px)';
        shell.classList.add('swipe-delete-open');
        shell.classList.remove('swipe-cycle-open','swipe-delete-armed');
        dx = 0; dy = 0; gesture = '';
        return;
      }

      if (wasHorizontal && finalDx < -65) {
        suppressClickUntil = Date.now() + 700;
        card.style.transform = 'translateX(-270px)';
        shell.classList.add('swipe-cycle-open');
        shell.classList.remove('swipe-delete-open','swipe-delete-armed');
        dx = 0; dy = 0; gesture = '';
        return;
      }

      if (wasHorizontal) suppressClickUntil = Date.now() + 400;
      resetPosition();
    };

    card.addEventListener('pointerup', finishPointer);
    card.addEventListener('pointercancel', resetPosition);

    const deleteButton = shell.querySelector('.stock-swipe-delete-button');
    if (deleteButton) {
      deleteButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        resetPosition();
        if (id) window.removeFromStock?.(id);
      });
    }

    if (main) {
      main.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (Date.now() < suppressClickUntil) return;
        if (shell.classList.contains('swipe-cycle-open') || shell.classList.contains('swipe-delete-open')) {
          resetPosition();
          return;
        }
        const editId = String(main.dataset.stockEdit || '');
        if (editId) editProduct(editId);
      });
      main.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const editId = String(main.dataset.stockEdit || '');
          if (editId) editProduct(editId);
        }
      });
    }
  });
}

function stockProductsForView(arr){
  const all=(arr||[]).filter(p=>!p.stockExcluded);
  const query=typeof search!=='undefined'&&String(search?.value||'').trim();
  // Zoeken blijft altijd wereldwijd, ongeacht de gekozen vaste plek.
  if(query)return all;
  if(stockView==='spices')return all.filter(stockSpice);
  let visible=all;
  if(stockView==='location'&&stockLocationFilter)visible=visible.filter(p=>stockLocationName(p)===stockLocationFilter);
  if(stockView==='standard')visible=visible.filter(p=>p.stockRole==='standard');
  if(stockView==='meal')visible=visible.filter(p=>p.stockRole==='meal');
  return visible;
}

function stockUndoHtml(){
  const id=window.lastStockRemovedId;
  const product=id&&products.find(x=>String(x.id)===String(id)&&x.stockExcluded);
  return product?`<div class="stock-undo-message">${esc(product.name)} uit Voorraad gehaald <button type="button" onclick="restoreToStock(${JSON.stringify(String(product.id))})">Herstellen</button></div>`:'';
}
function renderStock(arr) {
  updateStockViewControls();
  const visible = stockProductsForView(arr);
  if (!visible.length) {
    const emptyText='Geen producten voor deze selectie.';
    content.innerHTML = `${stockUndoHtml()}<div class="empty">${emptyText}</div>`;
    return;
  }

  let rows='';
  const standardGrouping = stockView !== 'location';
  if(standardGrouping){
    // V1.4.103: de actuele productcategorie is leidend. De oude PTE-indeling
    // bepaalt alleen welke producten standaardvoorraad zijn, niet waar een
    // handmatig verplaatst product wordt weergegeven.
    const preferredOrder=stockView==='spices'?[]:[...STANDARD_STOCK_LAYOUT.map(([category])=>category),...(categories||[])];
    const order=[...new Set(preferredOrder)];
    const grouped=new Map();
    visible.forEach(product=>{
      const category=String(product.category||'Overig').trim()||'Overig';
      if(!grouped.has(category)) grouped.set(category,[]);
      grouped.get(category).push(product);
    });
    const categoryNames=[...grouped.keys()].sort((a,b)=>{
      const ai=order.indexOf(a),bi=order.indexOf(b);
      if(ai<0&&bi<0)return a.localeCompare(b,'nl',{sensitivity:'base'});
      if(ai<0)return 1;if(bi<0)return -1;return ai-bi;
    });
    rows=categoryNames.map(category=>{
      const items=grouped.get(category).sort(sortProducts);
      const collapsed=stockView==='spices'?false:!expandedStockCategories.has(category);
      return `<section class="stock-category ${collapsed?'collapsed':''}">
        <div class="shopping-group-head stock-category-head">
          <button class="stock-category-toggle" type="button" onclick="toggleStockCategory('${encodeURIComponent(category)}')"><span>${esc(category)}</span><span>${collapsed?'⌄':'⌃'}</span></button>
        </div>
        <div class="shopping-group-body">${items.map(stockItemHtml).join('')}</div>
      </section>`;
    }).join('');
  }else{
    const grouped=new Map();
    visible.forEach(p=>{const key=stockLocationName(p);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(p)});
    rows=[...grouped.entries()].sort((a,b)=>a[0]==='Nog indelen'?1:b[0]==='Nog indelen'?-1:a[0].localeCompare(b[0],'nl',{numeric:true})).map(([categoryName,items])=>{
      const collapsed=stockLocationFilter ? false : !expandedStockCategories.has(categoryName);
      return `<section class="stock-category ${collapsed?'collapsed':''}">
        <div class="shopping-group-head stock-category-head ${stockView==='location'?'stock-location-head':''}">
          <button class="stock-category-toggle" type="button" onclick="toggleStockCategory('${encodeURIComponent(categoryName)}')"><span>${esc(categoryName)}</span><span>${collapsed?'⌄':'⌃'}</span></button>
        </div>
        <div class="shopping-group-body">${items.sort((a,b)=>String(a.name).localeCompare(String(b.name),'nl',{sensitivity:'base'})).map(stockItemHtml).join('')}</div>
      </section>`;
    }).join('');
  }
  const intro=(stockView==='meal')?`<div class="stock-meal-intro"><strong>Eerst opmaken</strong><span>Hier blijft je volledige houdbare maaltijdvoorraad zichtbaar. <b>In huis</b> telt mee bij recepten; <b>Niet in huis</b> blijft hier staan zodat je het later eenvoudig weer op In huis kunt zetten.</span></div>`:'';
  const checked=visible.filter(p=>stockCheckTime(p)).length;
  const progress=document.getElementById('stockProgress');if(progress)progress.textContent=`${checked} van ${visible.length} met controledatum`;
  content.innerHTML = `${stockUndoHtml()}${intro}<div class="stock-tools"><button class="clear" type="button" onclick="toggleAllStock()">${expandedStockCategories.size?'Alles inklappen':'Alles uitklappen'}</button></div>${rows}`;
  bindStockSwipeActions();
}

window.openStockCategoryAdd = encodedCategory => {
  openModal(null);
  const name = decodeURIComponent(encodedCategory);
  if (stockView === 'location') {
    $('#stockLocation').value = name === 'Locatie nog instellen' ? '' : name;
    $('#checkCycle').value = 'week';
  } else {
    $('#category').value = name;
  }
};

window.setCategoryStockStatus = (encodedCategory, status) => {
  const category = decodeURIComponent(encodedCategory);
  if (!['Kruiden', 'Bewaarproducten (voorraad)'].includes(category)) return;
  if (!['In huis', 'Niet in huis'].includes(status)) return;
  if (!confirm(`Alle producten in ${category} op “${status}” zetten?`)) return;
  products.forEach(product => {
    if (product.category === category) {
      product.status = status;
      product.done = false;
    }
  });
  save();
  render();
};

window.cycleStatus = id => {
  const x = products.find(x => String(x.id) === String(id));
  if (!x) return;
  const statuses = ['In huis', 'Niet in huis'];
  x.status = statuses[(statuses.indexOf(x.status) + 1) % statuses.length];
  x.done = false;
  x.stockCheckedAt = Date.now();
  save();
  render();
};

window.toggleStockBuy = (id, checked) => {
  const x = products.find(x => String(x.id) === String(id));
  if (!x) return;
  x.shopping = Boolean(checked);
  x.done = false;
  save();
  render();
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('stockLocationFilter')?.addEventListener('change',event=>setStockLocationFilter(event.target.value));
  document.querySelectorAll('[data-stock-view]').forEach(button => {
    button.addEventListener('click', () => setStockView(button.dataset.stockView));
  });
  document.addEventListener('click', event => {
    const button=event.target.closest?.('button[data-stock-check]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    window.confirmStockProduct(button.dataset.stockCheck);
  });
  // V1.4.113: voorraadstatus en Kopen via event-delegatie. Zo blijven beide acties
  // los van elkaar werken, ook op mobiel en na een her-render van de voorraadlijst.
  document.addEventListener('click', event => {
    const button=event.target.closest?.('button[data-stock-status]');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    window.cycleStatus(button.dataset.stockStatus);
  });
  document.addEventListener('change', event => {
    const input=event.target.closest?.('input[data-stock-buy]');
    if(!input)return;
    event.stopPropagation();
    window.toggleStockBuy(input.dataset.stockBuy,input.checked);
  });
  document.addEventListener('click', event => {
    const button=event.target.closest?.('button[data-stock-remove]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    window.removeFromStock?.(button.dataset.stockRemove);
  });
  updateStockViewControls();
});
