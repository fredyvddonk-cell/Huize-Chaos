let expandedStockCategories = new Set(JSON.parse(localStorage.getItem('household-expanded-stock') || '[]'));
let stockView = localStorage.getItem('household-stock-view') || 'standard';
if (!['standard','meal','hidden','location'].includes(stockView)) stockView = 'standard';

const STOCK_VIEW_HELP = {
  standard: 'Je vaste controlelijst volgens je oude Plan to Eat-indeling. Alleen zout en peper staan bij kruiden.',
  meal: 'Houdbare maaltijdproducten die je in huis hebt. Huize Chaos gebruikt deze automatisch bij recepten; aantallen controleer je zelf.',
  hidden: 'Producten die je niet als gewone voorraad bijhoudt. Ze blijven wel beschikbaar in Beheer en voor recepten.',
  location: 'Je zichtbare voorraad gegroepeerd op vaste plek.'
};
const CHECK_LABEL = {week:'Weekcheck',month:'Maandcheck',work:'Alleen bij Wat kan ik maken?',rare:'Zelden'};

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
    const visible = stockProductsForView(products);
    const groupKey = stockView === 'location' ? 'stockLocation' : 'category';
    groups(visible, groupKey).forEach(([groupName]) => expandedStockCategories.add(groupName || 'Niet ingesteld'));
  }
  saveStockExpansion();
  render();
};

window.setStockView = next => {
  if (!['standard','meal','hidden','location'].includes(next)) return;
  stockView = next;
  localStorage.setItem('household-stock-view', stockView);
  expandedStockCategories.clear();
  saveStockExpansion();
  render();
};

function updateStockViewControls(){
  document.querySelectorAll('[data-stock-view]').forEach(button => button.classList.toggle('active', button.dataset.stockView === stockView));
  const help = document.querySelector('#stockViewHelp');
  if (help) help.textContent = STOCK_VIEW_HELP[stockView] || '';
}

function stockBadges(product){ return ''; }

function stockItemHtml(x){
  return `<div class="stock-swipe-shell" data-stock-swipe data-id="${esc(String(x.id))}">
    <div class="stock-swipe-back stock-swipe-delete"><button type="button" class="stock-swipe-delete-button">Verwijderen</button></div>
    <div class="stock-swipe-back stock-swipe-cycle">
      <button type="button" onclick="setStockRole(${JSON.stringify(String(x.id))},'standard')">Standaard</button>
      <button type="button" onclick="setStockRole(${JSON.stringify(String(x.id))},'meal')">Maaltijd</button>
      <button type="button" onclick="setStockRole(${JSON.stringify(String(x.id))},'hidden')">Niet in voorraad</button>
    </div>
    <div class="item stock-item stock-swipe-content">
      <div class="main" data-stock-edit="${esc(String(x.id))}" role="button" tabindex="0">
        <div class="name">${esc(x.name)}</div>
        ${stockBadges(x)}
        ${memoHtml(x)}
      </div>
      <div class="stock-actions stock-actions-compact">
        <button class="status stock-status-toggle ${x.status === 'In huis' ? 'good' : 'low'}" onclick="cycleStatus(${JSON.stringify(String(x.id))})">${x.status}</button>
        <label class="stock-buy-check stock-buy-red"><input type="checkbox" data-stock-buy="${esc(String(x.id))}" ${x.shopping ? 'checked' : ''}><span>Kopen</span></label>
        <button class="to-hutsel stock-hutsel-link" type="button" data-stock-hutsel="${esc(String(x.id))}" onclick="event.preventDefault();event.stopPropagation();window.sendStockToHutsel && window.sendStockToHutsel(${JSON.stringify(String(x.id))})">→ Hutsel</button>
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
  if (!['standard','meal','hidden'].includes(role)) return;
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
        if (id) window.requestProductDelete?.(id, 'product');
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
  const all=(arr||[]);
  if(stockView==='standard') return all.filter(p=>p.stockRole==='standard');
  if(stockView==='meal') return all.filter(p=>p.stockRole==='meal'&&p.status==='In huis');
  if(stockView==='hidden') return all.filter(p=>p.stockRole==='hidden');
  return all.filter(p=>p.stockRole!=='hidden');
}

function renderStock(arr) {
  updateStockViewControls();
  const visible = stockProductsForView(arr);
  if (!visible.length) {
    content.innerHTML = `<div class="empty">${stockView==='meal'?'Geen houdbare maaltijdproducten op In huis.':stockView==='hidden'?'Geen producten bij Niet in voorraad.':'Geen producten gevonden.'}</div>`;
    return;
  }

  let rows='';
  if(stockView==='standard'){
    // V1.4.103: de actuele productcategorie is leidend. De oude PTE-indeling
    // bepaalt alleen welke producten standaardvoorraad zijn, niet waar een
    // handmatig verplaatst product wordt weergegeven.
    const preferredOrder=[...STANDARD_STOCK_LAYOUT.map(([category])=>category),...(categories||[])];
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
      const collapsed=!expandedStockCategories.has(category);
      return `<section class="stock-category ${collapsed?'collapsed':''}">
        <div class="shopping-group-head stock-category-head">
          <button class="stock-category-toggle" type="button" onclick="toggleStockCategory('${encodeURIComponent(category)}')"><span>${esc(category)}</span><span>${collapsed?'⌄':'⌃'}</span></button>
        </div>
        <div class="shopping-group-body">${items.map(stockItemHtml).join('')}</div>
      </section>`;
    }).join('');
  }else{
    const groupKey=stockView==='location'?'stockLocation':'category';
    rows=groups(visible,groupKey).map(([rawName,items])=>{
      const categoryName=rawName||(stockView==='location'?'Locatie nog instellen':'Overig');
      const collapsed=!expandedStockCategories.has(categoryName);
      return `<section class="stock-category ${collapsed?'collapsed':''}">
        <div class="shopping-group-head stock-category-head ${stockView==='location'?'stock-location-head':''}">
          <button class="stock-category-toggle" type="button" onclick="toggleStockCategory('${encodeURIComponent(categoryName)}')"><span>${esc(categoryName)}</span><span>${collapsed?'⌄':'⌃'}</span></button>
        </div>
        <div class="shopping-group-body">${items.sort(sortProducts).map(stockItemHtml).join('')}</div>
      </section>`;
    }).join('');
  }
  const intro=stockView==='meal'?`<div class="stock-meal-intro"><strong>Eerst opmaken</strong><span>Alles hieronder staat als houdbare maaltijdvoorraad op <b>In huis</b>. Bij recepten telt aanwezigheid mee; jij controleert zelf of er genoeg is.</span></div>`:'';
  content.innerHTML = `${intro}<div class="stock-tools"><button class="clear" type="button" onclick="toggleAllStock()">${expandedStockCategories.size?'Alles inklappen':'Alles uitklappen'}</button></div>${rows}`;
  bindStockSwipeActions();
}

window.openStockCategoryAdd = encodedCategory => {
  openModal(null);
  const name = decodeURIComponent(encodedCategory);
  if (['month','location'].includes(stockView)) {
    $('#stockLocation').value = name === 'Locatie nog instellen' ? '' : name;
    if (stockView === 'month') $('#checkCycle').value = 'month';
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
  document.querySelectorAll('[data-stock-view]').forEach(button => {
    button.addEventListener('click', () => setStockView(button.dataset.stockView));
  });
  // V1.4.107: Kopen in Voorraad via event-delegatie. Dit blijft werken na elke render.
  document.addEventListener('change', event => {
    const input=event.target.closest?.('input[data-stock-buy]');
    if(!input)return;
    event.stopPropagation();
    window.toggleStockBuy(input.dataset.stockBuy,input.checked);
  });
  updateStockViewControls();
});
