const DEFAULT_STORES = ['Picnic','Jumbo','Albert Heijn','Lidl','Aldi','Bakker','Overig'];
const UNITS = ['', 'stuks', 'g', 'kg', 'ml', 'l', 'pakje', 'pak', 'zakje', 'zak', 'fles', 'blik', 'pot', 'doos', 'bakje', 'rol'];
const DEFAULT_CATEGORIES = ['Bakproducten','Broodbeleg (zoet)','Broodbeleg (hartig)','Brood & ontbijtproducten','Diepvries','Dranken','Fruit','Groente','Kruiden','Olie / saus','Zuivel','Bewaarproducten (voorraad)','Snacks & tussendoor','Schoonmaak & huishouden','Huisdier','Persoonlijke verzorging','Keukenbenodigdheden'];

const rawSeed = [
['Bakpoeder','Bakproducten'],['(GV) bloem','Bakproducten'],['Droge gist','Bakproducten'],['Suiker','Bakproducten'],['Vanillesuiker','Bakproducten'],
['Appelstroop','Broodbeleg (zoet)','1','pot'],['Hagelslag','Broodbeleg (zoet)'],['Jam','Broodbeleg (zoet)','1','pot','','aardbeien'],['(GV) pindakaas','Broodbeleg (zoet)'],['Pindakaas','Broodbeleg (zoet)','1','pot'],['Speculoos','Broodbeleg (zoet)'],['Vlokken','Broodbeleg (zoet)'],['Vruchtenhagel','Broodbeleg (zoet)'],
['Boterhamworst','Broodbeleg (hartig)'],['Gelderse worst','Broodbeleg (hartig)'],['Grillworst','Broodbeleg (hartig)'],['(GV) Humus','Broodbeleg (hartig)','','','','wrap/rijstwafel/dip'],['Leverpastei','Broodbeleg (hartig)'],['Palingworst','Broodbeleg (hartig)'],['(GV) Roomkaas','Broodbeleg (hartig)'],['Salami','Broodbeleg (hartig)'],['(GV) Smeerkaas','Broodbeleg (hartig)'],['Smeerkaas','Broodbeleg (hartig)'],
['Brinta','Brood & ontbijtproducten','1'],['(GV) broodjes','Brood & ontbijtproducten'],['Chocopops','Brood & ontbijtproducten','1','','Jumbo'],['Cruesli','Brood & ontbijtproducten','1'],['(GV) granola','Brood & ontbijtproducten','1','pak','','Ontbijt-basis'],['(GV) havermout','Brood & ontbijtproducten','1','zak','','Ontbijt-basis'],['Honey rings','Brood & ontbijtproducten','','','Aldi'],['(GV) knackebrod','Brood & ontbijtproducten','1','pak','','Lunch-basis'],['Knackebrod','Brood & ontbijtproducten','1'],['(GV) Maiswafels','Brood & ontbijtproducten'],['Muesli','Brood & ontbijtproducten','1'],['(GV) pitabroodjes','Brood & ontbijtproducten'],['(GV) wraps','Brood & ontbijtproducten'],
['Gedroogd/diepvries fruit','Diepvries','','','','door yoghurt/oats'],['Roerbakmix','Diepvries','2','pak','','avond'],['Soepgroente','Diepvries','1','zak','','avond'],
['Appelsap','Dranken','1','pak'],['Cola','Dranken','','','Jumbo'],['Fanta lemon','Dranken'],['Ice tea sparkling','Dranken','2','fles'],['Karvan Cevitam Aardbei','Dranken','1','fles'],['Karvan Cevitam Framboos','Dranken','1','fles'],['Karvan Cevitam Grenadine','Dranken','1','fles'],['Koffiebonen','Dranken'],['Sinas','Dranken','1','fles'],['Thee green','Dranken'],['Thee aardbeien','Dranken'],['Thee Munt','Dranken'],['Thee zwart','Dranken'],['Wijn - Rood','Dranken'],['Wijn - Rosé','Dranken'],['Wijn - Wit','Dranken'],
['Appels','Fruit'],['Bananen','Fruit'],['Druiven','Fruit','','','','Witte druiven'],['Fruit','Fruit','2','kg','','appels, bananen, bessen, peren; Ontbijt-basis'],['Kiwi','Fruit'],
['Gemengde sla','Groente','1','zak','','Lunch-basis'],['Paprika','Groente'],
['Ajowan','Kruiden'],['Aleppopeper','Kruiden'],['Amchur (mangopoeder)','Kruiden'],['Anijszaad','Kruiden'],['Ancho chili','Kruiden'],['Asafoetida','Kruiden'],['Basilicum','Kruiden'],['Bieslook','Kruiden'],['Bird’s eye chili','Kruiden'],['Bonenkruid','Kruiden'],['Cayennepeper','Kruiden'],['Chilipoeder','Kruiden'],['Chilivlokken','Kruiden'],['Chipotle','Kruiden'],['Citroenbasilicum','Kruiden'],['Citroenmelisse','Kruiden'],['Citroenpeper','Kruiden'],['Citroentijm','Kruiden'],['Dille','Kruiden'],['Dragon','Kruiden'],['Fenegriek','Kruiden'],['Foelie','Kruiden'],['Galanga','Kruiden'],['Gedroogde citroenschil','Kruiden'],['Gedroogde knoflookvlokken','Kruiden'],['Gedroogde limoenschil','Kruiden'],['Gedroogde sinaasappelschil','Kruiden'],['Gedroogde ui','Kruiden'],['Gember','Kruiden'],['Gochugaru','Kruiden'],['Groene kardemom','Kruiden'],['Groene peperkorrels','Kruiden'],['Guajillo chili','Kruiden'],['Jeneverbes','Kruiden'],['Kaffir-limoenblad','Kruiden'],['Kaneel','Kruiden'],['Kardemom zwart','Kruiden'],['Karwijzaad','Kruiden'],['Kashmiri chili','Kruiden'],['Kervel','Kruiden'],['Knoflookgranulaat','Kruiden'],['Knoflookpoeder','Kruiden'],['Korianderblad','Kruiden'],['Korianderzaad','Kruiden'],['Kruidnagel','Kruiden'],['Komijn','Kruiden'],['Kurkuma','Kruiden'],['Laurierblad','Kruiden'],['Lavas','Kruiden'],['Mahlab','Kruiden'],['Marjolein','Kruiden'],['Mosterdpoeder','Kruiden'],['Mosterdzaad bruin','Kruiden'],['Mosterdzaad geel','Kruiden'],['Mosterdzaad zwart','Kruiden'],['Munt','Kruiden'],['Nigellazaad','Kruiden'],['Nootmuskaat','Kruiden'],['Oregano','Kruiden'],['Paprikapoeder gerookt','Kruiden'],['Paprikapoeder heet','Kruiden'],['Paprikapoeder mild','Kruiden'],['Paprikapoeder zoet','Kruiden'],['Pasilla chili','Kruiden'],['Peterselie','Kruiden'],['Piment','Kruiden'],['Piment d’Espelette','Kruiden'],['Pul biber','Kruiden'],['Roze peperkorrels','Kruiden'],['Rozemarijn','Kruiden'],['Saffraan','Kruiden'],['Salie','Kruiden'],['Selderijblad','Kruiden'],['Selderijzaad','Kruiden'],['Steranijs','Kruiden'],['Sumak','Kruiden'],['Szechuanpeper','Kruiden'],['Thaise basilicum','Kruiden'],['Tijm','Kruiden'],['Uiengranulaat','Kruiden'],['Uienpoeder','Kruiden'],['Urfa biber','Kruiden'],['Venkelzaad','Kruiden'],['Verveine','Kruiden'],['Vietnamese koriander','Kruiden'],['Witte peper','Kruiden'],['Zwarte peper','Kruiden'],['Aardappelkruiden','Kruiden'],['Aardappelwedges kruiden','Kruiden'],['Appeltaartkruiden','Kruiden'],['Baharat','Kruiden'],['Bak- en braadkruiden','Kruiden'],['Bami- of nasikruiden','Kruiden'],['BBQ dry rub','Kruiden'],['BBQ-kruiden','Kruiden'],['Berbere','Kruiden'],['Biryani masala','Kruiden'],['Bouquet garni','Kruiden'],['Brisket rub','Kruiden'],['Bruschetta kruiden','Kruiden'],['Bulgogi kruiden','Kruiden'],['Burritokruiden','Kruiden'],['Cajunkruiden','Kruiden'],['Chaat masala','Kruiden'],['Chai kruiden','Kruiden'],['Chermoula','Kruiden'],['Chicken rub','Kruiden'],['Chili con carne kruiden','Kruiden'],['Chinese vijfkruidenpoeder','Kruiden'],['Couscouskruiden','Kruiden'],['Creoolse kruiden','Kruiden'],['Currypoeder heet','Kruiden'],['Currypoeder mild','Kruiden'],['Dukkah','Kruiden'],['Eikruiden','Kruiden'],['Enchiladakruiden','Kruiden'],['Fajitakruiden','Kruiden'],['Falafelkruiden','Kruiden'],['Fines herbes','Kruiden'],['Franse kruiden','Kruiden'],['Furikake','Kruiden'],['Garam masala','Kruiden'],['Gehaktbalkruiden','Kruiden'],['Gehaktkruiden','Kruiden'],['Gomashio','Kruiden'],['Goulashkruiden','Kruiden'],['Griekse kruiden','Kruiden'],['Groentekruiden','Kruiden'],['Gyroskruiden','Kruiden'],['Hacheekruiden','Kruiden'],['Hamburgerkruiden','Kruiden'],['Harissa kruiden','Kruiden'],['Herbes de Provence','Kruiden'],['Italiaanse kruidenmix','Kruiden'],['Japanse zevenkruidenmix','Kruiden'],['Jerk kruiden','Kruiden'],['Kebabkruiden','Kruiden'],['Kipkruiden','Kruiden'],['Koekkruiden','Kruiden'],['Köftekruiden','Kruiden'],['Koreaanse BBQ-kruiden','Kruiden'],['Kruidenboterkruiden','Kruiden'],['Lebkuchen kruiden','Kruiden'],['Macaronikruiden','Kruiden'],['Madras curry','Kruiden'],['Mediterrane kruiden','Kruiden'],['Mexicaanse kruiden','Kruiden'],['Nanami togarashi','Kruiden'],['Nasi kruiden','Kruiden'],['Old Bay kruidenmix','Kruiden'],['Omeletkruiden','Kruiden'],['Paellakruiden','Kruiden'],['Pastakruiden','Kruiden'],['Patatkruiden','Kruiden'],['Peperkoekkruiden','Kruiden'],['Peri-peri kruiden','Kruiden'],['Pizzakruiden','Kruiden'],['Provençaalse kruiden','Kruiden'],['Pulled pork rub','Kruiden'],['Pumpkin spice','Kruiden'],['Ras el hanout','Kruiden'],['Rendang kruiden','Kruiden'],['Rib rub','Kruiden'],['Rundvleeskruiden','Kruiden'],['Salademix','Kruiden'],['Satékruiden','Kruiden'],['Shawarmakruiden','Kruiden'],['Shichimi togarashi','Kruiden'],['Shoarmakruiden','Kruiden'],['Smokey BBQ rub','Kruiden'],['Soto kruiden','Kruiden'],['Spaghettikruiden','Kruiden'],['Speculaaskruiden','Kruiden'],['Spekkoek kruiden','Kruiden'],['Steak kruiden','Kruiden'],['Steak rub','Kruiden'],['Stoofvleeskruiden','Kruiden'],['Tacokruiden','Kruiden'],['Tajinekruiden','Kruiden'],['Tandoori masala','Kruiden'],['Tex-mex kruidenmix','Kruiden'],['Thaise currykruiden','Kruiden'],['Thaise gele currymix','Kruiden'],['Thaise groene currymix','Kruiden'],['Thaise rode currymix','Kruiden'],['Tikka masala','Kruiden'],['Tom yum kruiden','Kruiden'],['Varkensvleeskruiden','Kruiden'],['Vindaloo kruiden','Kruiden'],['Viskruiden','Kruiden'],['Wildkruiden','Kruiden'],['Wokkruiden','Kruiden'],['Za’atar','Kruiden'],
['Azijn','Olie / saus'],['Curry','Olie / saus','1','fles'],['Frietsaus','Olie / saus','1','fles'],['Ketjap','Olie / saus','','','','avond'],['Mayonaise','Olie / saus'],['Olijfolie extra virgine','Olie / saus'],['Sojasaus','Olie / saus','','','','avond'],['Zonnebloemolie','Olie / saus'],
['Eieren','Zuivel','30','','','avond'],['Halfvolle melk 2 liter','Zuivel','3','fles'],['Halfvolle melk 1 liter','Zuivel','2','pak'],['(GV) Halvarine','Zuivel','','','','Groen'],['Halvarine','Zuivel','1','','','Blauw'],['Jong belegen kaas','Zuivel','1','blok'],['Yoghurt / kwark','Zuivel','2','bak','','500 gram; Ontbijt-basis'],['Yoghurtdrink','Zuivel','3','pak'],
['Augurk','Bewaarproducten (voorraad)','','','','Lunch-basis'],['Bouillonblokjes - Groente','Bewaarproducten (voorraad)'],['Bouillonblokjes - kip','Bewaarproducten (voorraad)'],['Bouillonblokjes - rund','Bewaarproducten (voorraad)'],['Bouillonblokjes - vis','Bewaarproducten (voorraad)'],['Currypasta','Bewaarproducten (voorraad)','1','pot','','avond'],['Frituurolie','Bewaarproducten (voorraad)','8'],['Suikerklontjes','Bewaarproducten (voorraad)','1','pak'],['Tonijn op water','Bewaarproducten (voorraad)','2','blik','','Lunch-basis'],
['Snoepjes','Snacks & tussendoor'],['Tussendoortjes','Snacks & tussendoor','2','pak'],
['Afwasmiddel','Schoonmaak & huishouden','1','fles'],['Allesreiniger','Schoonmaak & huishouden','1','fles'],['Bleek','Schoonmaak & huishouden','1','fles'],['GFT zakken','Schoonmaak & huishouden'],['Glansspoelmiddel','Schoonmaak & huishouden'],['Handzeep','Schoonmaak & huishouden','1','fles'],['Wc papier','Schoonmaak & huishouden','1','pak'],['Pedaalemmerzakken','Schoonmaak & huishouden'],['PMD zakken','Schoonmaak & huishouden'],['Schuursponsjes','Schoonmaak & huishouden'],['Stofzuigerzakken','Schoonmaak & huishouden'],['Vaatwastabletten','Schoonmaak & huishouden','1','doos'],['Vaatwaszout','Schoonmaak & huishouden'],['Vuilniszakken','Schoonmaak & huishouden'],['Waspoeder','Schoonmaak & huishouden','','','Makro'],['Wasverzachter','Schoonmaak & huishouden','','','','Alleen Robijn in aanbieding'],
['Kattenbakvulling','Huisdier'],['Kattenbrokjes','Huisdier'],['Kattensnoepjes','Huisdier'],['Natvoer','Huisdier'],
['Conditioner','Persoonlijke verzorging'],['Deodorant','Persoonlijke verzorging'],['Douchegel','Persoonlijke verzorging'],['Excedrin','Persoonlijke verzorging'],['Inlegkruisjes','Persoonlijke verzorging'],['Maandverband/tampons','Persoonlijke verzorging'],['Paracetamol','Persoonlijke verzorging'],['Pleisters','Persoonlijke verzorging'],['Scheerproducten','Persoonlijke verzorging'],['Shampoo','Persoonlijke verzorging'],['Tandpasta','Persoonlijke verzorging'],
['Aluminiumfolie','Keukenbenodigdheden'],['Bakpapier','Keukenbenodigdheden'],['Boterhamzakjes','Keukenbenodigdheden'],['Diepvrieszakjes','Keukenbenodigdheden'],['Extra plastic bakjes','Keukenbenodigdheden'],['Vershoudfolie','Keukenbenodigdheden'],
['Bitterballen','Diepvries'],['Friet','Diepvries'],['Frikandellen','Diepvries'],['Kroketten','Diepvries'],['(GV) Snacks','Diepvries']
];
const seed = rawSeed.map((r,i)=>({id:i+1,name:r[0],category:r[1],quantity:r[2]||'',unit:r[3]||'',store:r[4]||'',memo:r[5]||'',status:'In huis',shopping:false,done:false}));
let stores = JSON.parse(localStorage.getItem('household-stores') || 'null') || [...DEFAULT_STORES];
let categories = JSON.parse(localStorage.getItem('household-categories') || 'null') || [...DEFAULT_CATEGORIES];
if (!categories.includes('Overig')) categories.push('Overig');
categories = categories.filter(x => x !== 'Overig').concat('Overig');

function migrateProduct(x) {
  const product = {...x};

  if (product.quantity === undefined) {
    const oldAmount = String(product.amount || '').trim();
    const match = oldAmount.match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      product.quantity = match[1];
      product.unit = product.unit || match[2] || '';
    } else {
      product.quantity = oldAmount;
      product.unit = product.unit || '';
    }
  }

  product.quantity = String(product.quantity || '');
  product.unit = String(product.unit || '');
  product.memo = String(product.memo || '');
  product.store = String(product.store || '');
  product.category = String(product.category || '');
  const oldStatus = product.status;
  product.status = ({'Voldoende':'In huis','Aanvullen':'Niet in huis','Op':'Niet in huis','Kopen':'Niet in huis'}[oldStatus] || oldStatus || 'In huis');
  if (!['In huis','Niet in huis'].includes(product.status)) product.status = 'In huis';
  product.shopping = Boolean(product.shopping || oldStatus === 'Op' || oldStatus === 'Kopen');
  product.done = Boolean(product.done);
  product.buyDirectWhenOut = Boolean(product.buyDirectWhenOut);
  product.temporary = Boolean(product.temporary);
  product.cloudPending = Boolean(product.cloudPending);

  delete product.amount;
  return product;
}

let products = (JSON.parse(localStorage.getItem('household-products-v2') || 'null') || seed).map(migrateProduct);

// V1.3.106: voeg de uitgebreide kruidendatabase éénmalig toe aan bestaande voorraden.
// Bestaande producten blijven leidend: status, hoeveelheid, winkel en memo worden nooit overschreven.
(function migrateCompleteHerbDatabase() {
  const migrationKey = 'household-migration-complete-herbs-v1377';
  if (localStorage.getItem(migrationKey) === 'done') return;

  const herbSeed = seed.filter(product => product.category === 'Kruiden');
  const existingNames = new Set(products.map(product => String(product.name || '').trim().toLocaleLowerCase('nl-NL')));
  let nextId = Math.max(0, ...products.map(product => Number(product.id) || 0)) + 1;

  herbSeed.forEach(herb => {
    const key = String(herb.name || '').trim().toLocaleLowerCase('nl-NL');
    if (!key || existingNames.has(key)) return;
    products.push({
      ...herb,
      id: nextId++,
      status: 'In huis',
      shopping: false,
      done: false
    });
    existingNames.add(key);
  });

  localStorage.setItem('household-products-v2', JSON.stringify(products));
  localStorage.setItem(migrationKey, 'done');
})();
const wideDesktop=window.matchMedia('(min-width:851px)').matches;
const requestedPage = new URLSearchParams(location.search).get('page');
let page = ['list','stock','hutsel','insight','manage'].includes(requestedPage) ? requestedPage : (wideDesktop ? (sessionStorage.getItem('hc-household-page-session') || 'list') : (localStorage.getItem('household-page') || 'list'));
let group = localStorage.getItem('household-group') || 'store';

const $ = selector => document.querySelector(selector);
let content;
let search;
let pendingProductDelete = null;

function save() {
  localStorage.setItem('household-products-v2', JSON.stringify(products));
  localStorage.setItem('household-stores', JSON.stringify(stores));
  localStorage.setItem('household-categories', JSON.stringify(categories));
  const status = document.getElementById('syncStatus');
  if (status) {
    status.textContent = 'Wacht op synchronisatie…';
    status.className = 'sync-status';
  }
  window.dispatchEvent(new Event('huize-chaos-products-changed'));
  window.scheduleCloudSync?.();
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}

function sortProducts(a, b) {
  return a.name.localeCompare(b.name, 'nl', {sensitivity:'base'});
}

function quantityText(x) {
  return [x.quantity, x.unit].filter(Boolean).join(' ');
}

function meta(x) {
  return [quantityText(x), x.store]
    .filter(Boolean)
    .map(esc)
    .join(' · ');
}

function memoHtml(x) {
  return x.memo ? `<div class="memo">${esc(x.memo)}</div>` : '';
}

function groups(items, key) {
  const grouped = {};
  items.forEach(x => {
    const name = x[key] || 'Overig';
    (grouped[name] ??= []).push(x);
  });

  let keys = Object.keys(grouped);
  if (key === 'store') {
    keys.sort((a,b) =>
      (stores.indexOf(a) < 0 ? 999 : stores.indexOf(a)) -
      (stores.indexOf(b) < 0 ? 999 : stores.indexOf(b)) ||
      a.localeCompare(b, 'nl')
    );
  } else {
    keys.sort((a,b) => {
      if (a === 'Overig') return 1;
      if (b === 'Overig') return -1;
      const ai = categories.indexOf(a);
      const bi = categories.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b,'nl');
    });
  }

  return keys.map(keyName => [keyName, grouped[keyName].sort(sortProducts)]);
}

function drawGrouped(arr, key, row) {
  if (!arr.length) {
    content.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  content.innerHTML = groups(arr, key)
    .map(([groupName, items]) => `<h2 class="section">${esc(groupName)}</h2>${items.map(row).join('')}`)
    .join('');
}

function refreshCats() {
  $('#categories').innerHTML = categories.map(x => `<option value="${esc(x)}">`).join('');
}

function openModal(x = null, prefillName = '') {
  $('#store').innerHTML = '<option value="">Geen</option>' + stores.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('#modalTitle').textContent = x ? 'Product wijzigen' : 'Product toevoegen';
  $('#editId').value = x?.id || '';
  $('#productName').value = x?.name || prefillName || '';
  $('#quantity').value = x?.quantity || '';
  $('#unit').value = x?.unit || '';
  $('#store').value = x?.store || '';
  $('#category').value = x?.category || '';
  $('#memo').value = x?.memo || '';
  $('#buyDirectWhenOut').checked = Boolean(x?.buyDirectWhenOut);
  const fixedProductOption = $('#fixedProductOption');
  const showFixedProductChoice = page === 'list';
  fixedProductOption.hidden = !showFixedProductChoice;
  $('#fixedProduct').checked = showFixedProductChoice ? Boolean(x && !x.temporary) : true;
  $('#modal').classList.add('open');
  setTimeout(() => $('#productName').focus(), 50);
  const categoryInput = $('#category');
  categoryInput.onfocus = () => categoryInput.select();
  categoryInput.onclick = () => categoryInput.select();
  $('#clearCategory').onclick = () => {
    categoryInput.value = '';
    categoryInput.focus();
  };
}

function closeModal() {
  $('#modal').classList.remove('open');
}

function accordion(title, key, inner) {
  return `<section class="accordion ${openManageSection === key ? 'open' : ''}">
    <button class="accordion-head" type="button" onclick="toggleManageSection('${key}')">
      <span>${title}</span><span class="chevron">⌄</span>
    </button>
    <div class="accordion-body">${inner}</div>
  </section>`;
}

let openManageSection = localStorage.getItem('household-manage-section') || '';
window.toggleManageSection = key => {
  openManageSection = openManageSection === key ? '' : key;
  localStorage.setItem('household-manage-section', openManageSection);
  render();
};

function categoryRows() {
  return categories.map((c,i)=>`<div class="manage-row category-order" draggable="${c !== 'Overig'}" data-category="${esc(c)}">
    <button class="drag-handle" type="button" aria-label="Sleep ${esc(c)}" title="Slepen">☰</button>
    <span>${esc(c)}</span>
    ${c !== 'Overig' ? `<button onclick="moveCategory(${i},-1)" ${i===0?'disabled':''} aria-label="Omhoog">↑</button><button onclick="moveCategory(${i},1)" ${i===categories.length-2?'disabled':''} aria-label="Omlaag">↓</button>` : ''}
    <button onclick="renameCategory('${encodeURIComponent(c)}')">Wijzig</button>
    <button onclick="deleteCategory('${encodeURIComponent(c)}')">Verwijder</button>
  </div>`).join('');
}

window.moveCategory = (index, direction) => {
  if (categories[index] === 'Overig') return;
  const overigIndex = categories.indexOf('Overig');
  const target = index + direction;
  if (target < 0 || target >= categories.length || target === overigIndex) return;
  [categories[index], categories[target]] = [categories[target], categories[index]];
  save(); render();
};

function bindCategoryDrag() {
  document.querySelectorAll('.category-order[draggable="true"]').forEach(row => {
    row.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', row.dataset.category); row.classList.add('dragging'); });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', e => e.preventDefault());
    row.addEventListener('drop', e => {
      e.preventDefault();
      const from = e.dataTransfer.getData('text/plain');
      const to = row.dataset.category;
      if (!from || !to || from === to || to === 'Overig') return;
      const fi = categories.indexOf(from), ti = categories.indexOf(to);
      if (fi < 0 || ti < 0) return;
      categories.splice(fi,1);
      categories.splice(categories.indexOf(to),0,from);
      if (categories.includes('Overig')) categories = categories.filter(x=>x!=='Overig').concat('Overig');
      save(); render();
    });
  });
}

function renderManage(arr) {
  const hasSearch = Boolean(search.value.trim());
  if (hasSearch) openManageSection = 'products';
  const productsHtml = arr.length ? arr.sort(sortProducts).map(x => `
    <div class="item"><div class="main"><div class="name">${esc(x.name)}</div>${meta(x) ? `<div class="meta">${meta(x)}</div>` : ''}${memoHtml(x)}</div>
    <div class="actions"><button class="small" onclick="editProduct(${x.id})">Wijzig</button><button class="small" onclick="removeProduct(${x.id})">Verwijder</button></div></div>`).join('') : `<div class="empty">${hasSearch ? 'Geen producten gevonden.' : 'Nog geen producten.'}</div>`;

  const cats = `<div class="manage-add"><input id="newCategory" placeholder="Nieuwe categorie"><button onclick="addCategory()">+</button></div><p class="manage-help">Sleep met ☰ of gebruik ↑ en ↓ om de volgorde te wijzigen. Overig blijft onderaan.</p>${categoryRows()}`;
  const shops = `<div class="manage-add"><input id="newStore" placeholder="Nieuwe winkel"><button onclick="addStore()">+</button></div>${stores.map(c=>`<div class="manage-row"><span>${esc(c)}</span><button onclick="renameStore('${encodeURIComponent(c)}')">Wijzig</button><button onclick="deleteStore('${encodeURIComponent(c)}')">Verwijder</button></div>`).join('')}`;

  content.innerHTML = accordion('Producten','products',productsHtml) + accordion('Categorieën','categories',cats) + accordion('Winkels','stores',shops);
  bindCategoryDrag();
}
window.addCategory=()=>{const v=$('#newCategory').value.trim();if(v&&!categories.includes(v)){categories.push(v);save();refreshCats();render();}};
window.addStore=()=>{const v=$('#newStore').value.trim();if(v&&!stores.includes(v)){stores.splice(Math.max(0,stores.length-1),0,v);save();render();}};
window.renameCategory=e=>{const old=decodeURIComponent(e),v=prompt('Nieuwe naam voor categorie:',old)?.trim();if(!v||v===old)return;products.forEach(x=>{if(x.category===old)x.category=v});categories=categories.map(x=>x===old?v:x);save();refreshCats();render();};
window.deleteCategory=e=>{const old=decodeURIComponent(e);if(old==='Overig'){alert('Overig blijft beschikbaar.');return;}if(confirm(`Categorie ${old} verwijderen? Producten gaan naar Overig.`)){products.forEach(x=>{if(x.category===old)x.category='Overig'});categories=categories.filter(x=>x!==old);if(!categories.includes('Overig'))categories.push('Overig');save();refreshCats();render();}};
window.renameStore=e=>{const old=decodeURIComponent(e),v=prompt('Nieuwe naam voor winkel:',old)?.trim();if(!v||v===old)return;products.forEach(x=>{if(x.store===old)x.store=v});stores=stores.map(x=>x===old?v:x);save();render();};
window.deleteStore=e=>{const old=decodeURIComponent(e);if(old==='Overig'){alert('Overig blijft beschikbaar.');return;}if(confirm(`Winkel ${old} verwijderen? Producten gaan naar Overig.`)){products.forEach(x=>{if(x.store===old)x.store='Overig'});stores=stores.filter(x=>x!==old);if(!stores.includes('Overig'))stores.push('Overig');save();render();}};
function render() {
  document.querySelectorAll('.tab').forEach(button => {
    button.classList.toggle('active', button.dataset.page === page);
  });

  $('#title').textContent = page === 'list' ? 'Boodschappen' : page === 'stock' ? 'Voorraad' : page === 'hutsel' ? 'Hutsel Frutsel' : page === 'insight' ? 'Inzicht' : 'Beheer';
  search.placeholder = page === 'list' ? 'Zoek boodschap...' : 'Zoek product...';
  document.body.classList.toggle('shopping-page', page === 'list');
  document.body.classList.toggle('search-page', page === 'list' || page === 'stock' || page === 'manage');
  document.body.classList.toggle('insight-page', page === 'insight');
  $('#listControls').style.display = page === 'list' ? 'block' : 'none';
  $('#add').textContent = page === 'insight' ? '+ Bon toevoegen' : '+ Toevoegen';

  const query = page === 'list' || page === 'stock' || page === 'manage' ? search.value.trim().toLowerCase() : '';
  const arr = products.filter(x =>
    x.name.toLowerCase().includes(query) &&
    ((page !== 'stock' && page !== 'manage') || !x.temporary)
  );

  if (page === 'list') renderShopping(arr);
  else if (page === 'stock') renderStock(arr);
  else if (page === 'hutsel') renderHutsel();
  else if (page === 'insight') window.renderInsight ? window.renderInsight() : (content.innerHTML = '');
  else renderManage(arr);
}

window.setHuizeChaosPage = nextPage => { page = nextPage; localStorage.setItem('household-page', page); sessionStorage.setItem('hc-household-page-session', page); render(); };
window.renderHuizeChaos = () => render();
window.getHuizeChaosProducts = () => products;
window.replaceHuizeChaosProducts = nextProducts => {
  products = nextProducts.map(migrateProduct);
  localStorage.setItem('household-products-v2', JSON.stringify(products));
  render();
};

window.applyHuizeChaosRole = role => {
  document.body.dataset.role = role || '';
  if (role === 'member') {
    page = 'list';
    localStorage.setItem('household-page', page); sessionStorage.setItem('hc-household-page-session', page);
  }
  render();
};

window.requestProductDelete = (id, mode = 'product') => {
  const product = products.find(x => x.id === id);
  if (!product) return;
  pendingProductDelete = { id, mode };
  const fromShopping = mode === 'shopping';
  $('#deleteTitle').textContent = fromShopping ? 'Boodschap verwijderen' : 'Product definitief verwijderen';
  $('#deleteProductName').textContent = product.name;
  $('#deleteMessage').textContent = fromShopping
    ? product.temporary
      ? 'Dit is een eenmalige boodschap. Het product wordt volledig verwijderd.'
      : 'Het product wordt alleen van de boodschappenlijst verwijderd. Het blijft bewaard in Voorraad en Beheer.'
    : 'Dit product wordt definitief verwijderd uit Voorraad en Beheer. Dit kan niet ongedaan worden gemaakt.';
  $('#confirmDelete').textContent = fromShopping && !product.temporary ? 'Van lijst verwijderen' : 'Verwijderen';
  $('#deleteModal').classList.add('open');
  $('#deleteModal').setAttribute('aria-hidden', 'false');
};

function closeProductDelete() {
  pendingProductDelete = null;
  $('#deleteModal').classList.remove('open');
  $('#deleteModal').setAttribute('aria-hidden', 'true');
}

window.removeProduct = id => requestProductDelete(id, 'product');

window.editProduct = id => openModal(products.find(x => x.id === id));

function initApp() {
  content = $('#content');
  search = $('#search');

  $('#store').innerHTML = '<option value="">Geen</option>' + stores.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('#unit').innerHTML = '<option value="">Geen eenheid</option>' + UNITS.filter(Boolean).map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');

  $('#form').onsubmit = event => {
    event.preventDefault();

    const id = Number($('#editId').value);
    const name = $('#productName').value.trim();
    if (!name) return;

    const data = {
      name,
      quantity: $('#quantity').value.trim(),
      unit: $('#unit').value,
      store: $('#store').value,
      category: $('#category').value.trim(),
      memo: $('#memo').value.trim(),
      buyDirectWhenOut: $('#buyDirectWhenOut').checked,
      temporary: page === 'list' && !$('#fixedProduct').checked
    };

    if (id) {
      Object.assign(products.find(x => x.id === id), data);
    } else {
      products.push({
        id: Date.now(),
        ...data,
        status: 'In huis',
        shopping: page === 'list',
        done: false,
        buyDirectWhenOut: data.buyDirectWhenOut
      });
    }

    save();
    refreshCats();
    closeModal();
    render();
  };

  $('#add').onclick = () => {
    if (page === 'hutsel') { openHutselModal(); return; }
    if (page === 'insight') { if (window.openReceiptModal) window.openReceiptModal(); return; }
    const prefillName = search.value.trim();
    openModal(null, prefillName);
  };
  $('#cancel').onclick = closeModal;
  $('#modal').onclick = event => {
    if (event.target.id === 'modal') closeModal();
  };
  $('#cancelDelete').onclick = closeProductDelete;
  $('#deleteModal').onclick = event => {
    if (event.target.id === 'deleteModal') closeProductDelete();
  };
  $('#confirmDelete').onclick = () => {
    if (!pendingProductDelete) return;
    const { id, mode } = pendingProductDelete;
    const product = products.find(x => x.id === id);
    if (!product) return closeProductDelete();
    if (mode === 'shopping' && !product.temporary) {
      product.shopping = false;
      product.done = false;
    } else {
      products = products.filter(x => x.id !== id);
    }
    closeProductDelete();
    save();
    refreshCats();
    render();
  };
  const updateSearchClear = () => {
    $('#clearSearch').classList.toggle('visible', Boolean(search.value));
  };
  search.oninput = () => {
    updateSearchClear();
    render();
  };
  $('#clearSearch').onclick = () => {
    search.value = '';
    updateSearchClear();
    search.focus();
    render();
  };
  updateSearchClear();

  document.querySelectorAll('.tab').forEach(button => {
    button.onclick = () => {
      page = button.dataset.page;
      if (page === 'hutsel') {
        search.value = '';
        updateSearchClear();
      }
      localStorage.setItem('household-page', page); sessionStorage.setItem('hc-household-page-session', page);
      render();
    };
  });

  bindShoppingEvents();
  bindHutselEvents();
  bindFreezerEvents();
  refreshCats();
  save();
  render();
}

window.addEventListener('DOMContentLoaded', initApp);
