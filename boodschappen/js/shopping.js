let expandedShoppingGroups = new Set(JSON.parse(localStorage.getItem('household-expanded-shopping') || '[]'));
let shoppingStoreFilter = localStorage.getItem('household-shopping-store-filter') || 'all';

function saveShoppingExpansion() {
  localStorage.setItem('household-expanded-shopping', JSON.stringify([...expandedShoppingGroups]));
}

function shoppingGroupKey(level, parent, name) {
  return `${group}:${level}:${parent || ''}:${name}`;
}


function shoppingPrioritySort(a, b) {
  const priority = status => status === 'Op' ? 0 : status === 'Aanvullen' ? 1 : 2;
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
  const secondaryKey = group === 'store' ? 'category' : 'store';
  const inner = level === 1
    ? groups(items, secondaryKey).map(([subName, subItems]) => renderShoppingGroup(subName, subItems, 2, title, row)).join('')
    : [...items].sort(shoppingPrioritySort).map(row).join('');
  return `<section class="shopping-group shopping-level-${level} ${collapsed ? 'collapsed' : ''}">
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

    // Bij het openen van een hoofdgroep meteen alle subgroepen openen.
    if (level === 1) {
      const parentName = parts.slice(3).join(':');
      const arr = products.filter(x => x.shopping && !(x.status === 'Op' && x.buyDirectWhenOut));
      const mainItems = arr.filter(x => (x[group] || 'Overig') === parentName);
      const secondaryKey = group === 'store' ? 'category' : 'store';
      groups(mainItems, secondaryKey).forEach(([subName]) => {
        expandedShoppingGroups.add(shoppingGroupKey(2, parentName, subName));
      });
    }
  }
  saveShoppingExpansion();
  render();
};

window.toggleAllShopping = () => {
  if (expandedShoppingGroups.size) {
    expandedShoppingGroups.clear();
  } else {
    let arr = products.filter(x => x.shopping && !(x.status === 'Op' && x.buyDirectWhenOut));
    if (group === 'store' && shoppingStoreFilter !== 'all') {
      arr = arr.filter(x => (x.store || 'Overig') === shoppingStoreFilter);
    }
    const secondaryKey = group === 'store' ? 'category' : 'store';
    groups(arr, group).forEach(([mainName, mainItems]) => {
      expandedShoppingGroups.add(shoppingGroupKey(1, '', mainName));
      groups(mainItems, secondaryKey).forEach(([subName]) => {
        expandedShoppingGroups.add(shoppingGroupKey(2, mainName, subName));
      });
    });
  }
  saveShoppingExpansion();
  render();
};

function renderShopping(allProducts) {
  const arr = allProducts.filter(x => x.shopping);
  const done = arr.filter(x => x.done).length;

  $('#count').textContent = `${arr.length} boodschappen · ${done} afgevinkt`;
  const collapseBtn = $('#collapseShoppingBtn');
  if (collapseBtn) collapseBtn.textContent = expandedShoppingGroups.size ? 'Alles inklappen' : 'Alles uitklappen';
  $('#processDoneBar').classList.toggle('visible', done > 0);
  $('#clearDone').textContent = done ? `✓ Boodschappen verwerken (${done})` : '✓ Boodschappen verwerken';

  document.querySelectorAll('[data-group]').forEach(button => {
    button.classList.toggle('active', button.dataset.group === group);
  });

  if (!arr.length) {
    content.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  const urgent = arr.filter(x => x.status === 'Op' && x.buyDirectWhenOut);
  const normal = arr.filter(x => !(x.status === 'Op' && x.buyDirectWhenOut));
  const stores = groups(arr, 'store');
  const chips = document.getElementById('storeChips');
  if (chips) {
    chips.innerHTML = `<button class="store-chip ${shoppingStoreFilter === 'all' ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('all')">Alle (${arr.length})</button>` +
      stores.map(([storeName, items]) => `<button class="store-chip ${shoppingStoreFilter === storeName ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('${encodeURIComponent(storeName)}')">${esc(storeName)} (${items.length})</button>`).join('');
  }

  const row = x => `
    <div class="item shopping-item ${x.done ? 'done' : ''}">
      <input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" ${x.done ? 'checked' : ''} onchange="markBought(${x.id}, this.checked)">
      <div class="main">
        <div class="name">${esc(x.name)}</div>
        ${meta(x) ? `<div class="meta">${meta(x)}</div>` : ''}
        ${x.cloudSource === 'family' && x.cloudAddedByName ? `<div class="added-by">Toegevoegd door ${esc(firstName(x.cloudAddedByName))}</div>` : ''}
        ${memoHtml(x)}
      </div>
      <div class="shopping-row-actions">
        <button class="small shopping-edit" type="button" onclick="editProduct(${x.id})">Wijzig</button>
        <button class="small shopping-remove" type="button" onclick="removeFromShopping(${x.id})">Verwijder</button>
      </div>
    </div>`;

  let html = '';
  if (urgent.length) {
    html += `<div class="urgent-block"><h2 class="section urgent-title">Direct nodig</h2>${urgent.sort(sortProducts).map(row).join('')}</div>`;
  }
  if (normal.length) {
    let visibleNormal = normal;
    if (group === 'store' && shoppingStoreFilter !== 'all') {
      visibleNormal = normal.filter(x => (x.store || 'Overig') === shoppingStoreFilter);
    }
    if (visibleNormal.length) {
      html += groups(visibleNormal, group).map(([groupName, items]) => renderShoppingGroup(groupName, items, 1, '', row)).join('');
    }
  }
  content.innerHTML = html;
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
  const x = products.find(x => x.id === id);
  if (!x) return;
  if (x.temporary) {
    products = products.filter(product => product.id !== id);
    save();
    render();
    return;
  }
  x.shopping = false;
  x.done = false;
  save();
  render();
};

function bindShoppingEvents() {
  document.querySelectorAll('[data-group]').forEach(button => {
    button.onclick = () => {
      group = button.dataset.group;
      localStorage.setItem('household-group', group);
      render();
    };
  });

  $('#collapseShoppingBtn').onclick = toggleAllShopping;
  $('#printList').onclick = () => window.print();

  $('#clearDone').onclick = () => {
    products = products.filter(x => {
      if (x.shopping && x.done && x.temporary) return false;
      if (x.shopping && x.done) {
        x.status = 'Voldoende';
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
