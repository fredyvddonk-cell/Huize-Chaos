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
  const printCategories = groups(printable, 'category').map(([categoryName, items]) => {
    let weight = 2;
    const rows = [...items].sort(shoppingPrioritySort).map(x => {
        const isUrgent = x.status === 'Op' && x.buyDirectWhenOut;
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
