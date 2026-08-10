let expandedShoppingGroups = new Set(JSON.parse(localStorage.getItem('household-expanded-shopping') || '[]'));

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

window.collapseAllShopping = () => {
  expandedShoppingGroups.clear();
  saveShoppingExpansion();
  render();
};

function renderShopping(allProducts) {
  const arr = allProducts.filter(x => x.shopping);
  const done = arr.filter(x => x.done).length;

  $('#count').textContent = `${arr.length} boodschappen · ${done} afgevinkt`;
  $('#clearDone').style.display = done ? 'inline-block' : 'none';
  $('#clearDone').textContent = done ? `Afgevinkte verwerken (${done})` : 'Afgevinkte verwerken';

  document.querySelectorAll('[data-group]').forEach(button => {
    button.classList.toggle('active', button.dataset.group === group);
  });

  if (!arr.length) {
    content.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  const urgent = arr.filter(x => x.status === 'Op' && x.buyDirectWhenOut);
  const normal = arr.filter(x => !(x.status === 'Op' && x.buyDirectWhenOut));
  const row = x => `
    <div class="item shopping-item ${x.done ? 'done' : ''}">
      <input class="check" type="checkbox" aria-label="${esc(x.name)} gekocht" ${x.done ? 'checked' : ''} onchange="markBought(${x.id}, this.checked)">
      <div class="main">
        <div class="name">${esc(x.name)}</div>
        ${meta(x) ? `<div class="meta">${meta(x)}</div>` : ''}
        ${memoHtml(x)}
      </div>
      <button class="small shopping-remove" type="button" onclick="removeFromShopping(${x.id})">Verwijder</button>
    </div>`;

  let html = '';
  if (urgent.length) {
    html += `<div class="urgent-block"><h2 class="section urgent-title">Direct nodig</h2>${urgent.sort(sortProducts).map(row).join('')}</div>`;
  }
  if (normal.length) {
    html += groups(normal, group).map(([groupName, items]) => renderShoppingGroup(groupName, items, 1, '', row)).join('');
  }
  content.innerHTML = html;
}

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

  $('#collapseShoppingBtn').onclick = collapseAllShopping;
  $('#printList').onclick = () => window.print();

  $('#clearDone').onclick = () => {
    products.forEach(x => {
      if (x.shopping && x.done) {
        x.status = 'Voldoende';
        x.shopping = false;
        x.done = false;
      }
    });
    save();
    render();
  };
}
