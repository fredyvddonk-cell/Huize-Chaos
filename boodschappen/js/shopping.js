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
    let arr = products.filter(x => x.shopping && !(x.status === 'Op' && x.buyDirectWhenOut));
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

  const stores = groups(arr, 'store');
  const chips = document.getElementById('storeChips');
  if (chips) {
    chips.innerHTML = `<button class="store-chip ${shoppingStoreFilter === 'all' ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('all')">Alle (${arr.length})</button>` +
      stores.map(([storeName, items]) => `<button class="store-chip ${shoppingStoreFilter === storeName ? 'active' : ''}" type="button" onclick="setShoppingStoreFilter('${encodeURIComponent(storeName)}')">${esc(storeName)} (${items.length})</button>`).join('');
  }

  const row = (x, showLocation = false) => {
    const isUrgent = x.status === 'Op' && x.buyDirectWhenOut;
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

  const printable = arr.filter(x => !x.done);
  const printHtml = groups(printable, 'category').map(([categoryName, items]) => `
    <section class="print-category">
      <h2>${esc(categoryName)}</h2>
      ${[...items].sort(shoppingPrioritySort).map(x => {
        const isUrgent = x.status === 'Op' && x.buyDirectWhenOut;
        const details = [quantityText(x), x.memo].filter(Boolean).map(esc).join(' · ');
        return `<div class="print-item ${isUrgent ? 'urgent-item' : ''}">
          <span class="print-check" aria-hidden="true"></span>
          <div><div class="print-name">${esc(x.name)}</div>${details ? `<div class="print-meta">${details}</div>` : ''}</div>
        </div>`;
      }).join('')}
    </section>`).join('');

  content.innerHTML = `<div class="screen-shopping">${html}</div><div class="print-shopping">${printHtml}</div>`;
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

  $('#collapseShoppingBtn').onclick = toggleAllShopping;
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
