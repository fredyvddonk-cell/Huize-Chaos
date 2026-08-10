let expandedStockCategories = new Set(JSON.parse(localStorage.getItem('household-expanded-stock') || '[]'));

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

window.collapseAllStock = () => {
  expandedStockCategories.clear();
  saveStockExpansion();
  render();
};

function renderStock(arr) {
  if (!arr.length) {
    content.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  content.innerHTML = `<div class="stock-tools"><button class="clear" type="button" onclick="collapseAllStock()">Alles inklappen</button></div>` +
    groups(arr, 'category').map(([categoryName, items]) => {
      const collapsed = !expandedStockCategories.has(categoryName);
      return `<section class="stock-category ${collapsed ? 'collapsed' : ''}">
        <button class="shopping-group-head stock-category-head" type="button" onclick="toggleStockCategory('${encodeURIComponent(categoryName)}')">
          <span>${esc(categoryName)}</span><span class="chevron">⌄</span>
        </button>
        <div class="shopping-group-body">${items.map(x => `
          <div class="item stock-item">
            <div class="main" onclick="editProduct(${x.id})" role="button" tabindex="0">
              <div class="name">${esc(x.name)}</div>
              ${meta(x) ? `<div class="meta">${meta(x)}</div>` : ''}
              ${memoHtml(x)}
              <div class="stock-edit-hint">Tik op product om te wijzigen</div>
            </div>
            <div class="stock-actions">
              <button class="small to-hutsel" type="button" onclick="moveStockToHutsel(${x.id})">→ Hutsel Frutsel</button>
              <button class="status ${x.status === 'Voldoende' ? 'good' : x.status === 'Aanvullen' ? 'low' : 'out'}" onclick="cycleStatus(${x.id})">${x.status}</button>
            </div>
          </div>`).join('')}</div>
      </section>`;
    }).join('');
}

window.cycleStatus = id => {
  const x = products.find(x => x.id === id);
  if (!x) return;

  const statuses = ['Voldoende', 'Aanvullen', 'Op'];
  x.status = statuses[(statuses.indexOf(x.status) + 1) % statuses.length];

  if (x.status === 'Voldoende') {
    x.shopping = false;
    x.done = false;
  } else {
    x.shopping = true;
    x.done = false;
  }

  save();
  render();
};

window.moveStockToHutsel = id => {
  const x = products.find(p => p.id === id);
  if (!x) return;
  const choice = prompt(`Wanneer moet "${x.name}" op? Typ Vandaag of Morgen.`, 'Vandaag');
  if (choice === null) return;
  const value = choice.trim().toLowerCase();
  if (value !== 'vandaag' && value !== 'morgen') {
    alert('Kies Vandaag of Morgen.');
    return;
  }
  hutselItems.push({
    id: Date.now(),
    name: x.name,
    note: 'Uit voorraad',
    useDate: value === 'morgen' ? tomorrowKey() : localDateKey()
  });
  // Verplaatsen: uit de gewone voorraad verwijderen. Niet naar boodschappenlijst.
  products = products.filter(p => p.id !== id);
  save();
  saveHutsel();
  render();
};
