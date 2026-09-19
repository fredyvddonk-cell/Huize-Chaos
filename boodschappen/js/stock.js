let expandedStockCategories = new Set(JSON.parse(localStorage.getItem('household-expanded-stock') || '[]'));
let stockView = localStorage.getItem('household-stock-view') || 'all';
if (!['all','week','month','work','rare'].includes(stockView)) stockView = 'all';

const STOCK_VIEW_HELP = {
  all: 'Volledige voorraad. Alles blijft beschikbaar voor receptsuggesties.',
  week: 'Alleen producten die je standaard wilt nalopen voor je gewone boodschappen.',
  month: 'Houdbare voorraad per vaste plek. Loop één kast tegelijk langs.',
  work: 'Tijdelijke werkvoorraad: meenemen bij “Wat kan ik maken?”, maar niet standaard aanvullen.',
  rare: 'Producten die je maar af en toe hoeft te controleren, zoals veel kruiden en bakproducten.'
};
const CHECK_LABEL = {week:'Weekcheck',month:'Maandcheck',work:'Werkvoorraad',rare:'Zelden'};

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
    const visible = stockView === 'all' ? products : products.filter(p => p.checkCycle === stockView);
    const groupKey = stockView === 'month' ? 'stockLocation' : 'category';
    groups(visible, groupKey).forEach(([groupName]) => expandedStockCategories.add(groupName || 'Niet ingesteld'));
  }
  saveStockExpansion();
  render();
};

window.setStockView = next => {
  if (!['all','week','month','work','rare'].includes(next)) return;
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

function stockBadges(product){
  const bits=[];
  if (product.stockLocation) bits.push(`<span class="stock-mini-badge">${esc(product.stockLocation)}</span>`);
  if (stockView === 'all' && product.checkCycle) bits.push(`<span class="stock-mini-badge">${CHECK_LABEL[product.checkCycle] || esc(product.checkCycle)}</span>`);
  return bits.length ? `<div class="stock-item-badges">${bits.join('')}</div>` : '';
}

function stockItemHtml(x){
  return `<div class="item stock-item">
    <div class="main" onclick="editProduct(${x.id})" role="button" tabindex="0">
      <div class="name">${esc(x.name)}</div>
      ${meta(x) ? `<div class="meta">${meta(x)}</div>` : ''}
      ${stockBadges(x)}
      ${memoHtml(x)}
    </div>
    <div class="stock-actions stock-actions-compact">
      <button class="status stock-status-toggle ${x.status === 'In huis' ? 'good' : 'low'}" onclick="cycleStatus(${x.id})">${x.status}</button>
      <label class="stock-buy-check stock-buy-red"><input type="checkbox" ${x.shopping ? 'checked' : ''} onchange="toggleStockBuy(${x.id}, this.checked)"><span>Kopen</span></label>
      <button class="to-hutsel stock-hutsel-link" type="button" onclick="sendStockToHutsel(${x.id})">→ Hutsel</button>
    </div>
  </div>`;
}

function renderStock(arr) {
  updateStockViewControls();
  const visible = stockView === 'all' ? arr : arr.filter(x => x.checkCycle === stockView);
  if (!visible.length) {
    content.innerHTML = `<div class="empty">${stockView === 'all' ? 'Geen producten gevonden.' : 'Geen producten in deze controlelijst.'}</div>`;
    return;
  }

  const groupKey = stockView === 'month' ? 'stockLocation' : 'category';
  const rows = groups(visible, groupKey).map(([rawName, items]) => {
    const categoryName = rawName || (stockView === 'month' ? 'Locatie nog instellen' : 'Overig');
    const collapsed = !expandedStockCategories.has(categoryName);
    const canBulk = stockView === 'all' && ['Kruiden', 'Bewaarproducten (voorraad)'].includes(categoryName);
    const bulkStatus = canBulk ? `<div class="stock-bulk-status"><button type="button" class="clear" onclick="event.stopPropagation();setCategoryStockStatus('${encodeURIComponent(categoryName)}','In huis')">Alles in huis</button><button type="button" class="clear" onclick="event.stopPropagation();setCategoryStockStatus('${encodeURIComponent(categoryName)}','Niet in huis')">Alles niet in huis</button></div>` : '';
    const addButton = stockView === 'all' ? `<button class="stock-category-add" type="button" onclick="openStockCategoryAdd('${encodeURIComponent(categoryName)}')" aria-label="Product toevoegen aan ${esc(categoryName)}" title="Product toevoegen">+</button>` : '';
    return `<section class="stock-category ${collapsed ? 'collapsed' : ''}">
      <div class="shopping-group-head stock-category-head ${stockView === 'month' ? 'stock-location-head' : ''}">
        <button class="stock-category-toggle" type="button" onclick="toggleStockCategory('${encodeURIComponent(categoryName)}')" aria-label="${esc(categoryName)} ${collapsed ? 'uitklappen' : 'inklappen'}">
          <span>${esc(categoryName)} <small>(${items.length})</small></span><span class="chevron">⌄</span>
        </button>${addButton}
      </div>
      <div class="shopping-group-body">${bulkStatus}${items.map(stockItemHtml).join('')}</div>
    </section>`;
  }).join('');

  content.innerHTML = `<div class="stock-tools"><button class="clear" type="button" onclick="toggleAllStock()">${expandedStockCategories.size ? 'Alles inklappen' : 'Alles uitklappen'}</button></div>${rows}`;
}

window.openStockCategoryAdd = encodedCategory => {
  openModal(null);
  const name = decodeURIComponent(encodedCategory);
  if (stockView === 'month') {
    $('#stockLocation').value = name === 'Locatie nog instellen' ? '' : name;
    $('#checkCycle').value = 'month';
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
  const x = products.find(x => x.id === id);
  if (!x) return;
  const statuses = ['In huis', 'Niet in huis'];
  x.status = statuses[(statuses.indexOf(x.status) + 1) % statuses.length];
  x.done = false;
  save();
  render();
};

window.toggleStockBuy = (id, checked) => {
  const x = products.find(x => x.id === id);
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
  updateStockViewControls();
});
