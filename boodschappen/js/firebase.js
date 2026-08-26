import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, deleteDoc, doc, getDoc, getDocsFromServer, onSnapshot, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',
  authDomain: 'huize-chaos.firebaseapp.com',
  projectId: 'huize-chaos',
  storageBucket: 'huize-chaos.firebasestorage.app',
  messagingSenderId: '742691644230',
  appId: '1:742691644230:web:1488577640944cc3d6bb47'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const HOUSEHOLD_ID = 'huize-chaos';
const itemsRef = collection(db, 'households', HOUSEHOLD_ID, 'shoppingItems');
const insightRef = doc(db, 'households', HOUSEHOLD_ID, 'insight', 'shared');
const occasionsRef = doc(db, 'households', HOUSEHOLD_ID, 'insight', 'occasions');
const inventoryRef = doc(db, 'households', HOUSEHOLD_ID, 'insight', 'products');

let role = '';
let user = null;
let cloudReady = false;
let applyingCloud = false;
let syncPending = false;
let syncTimer = 0;
let remoteItems = new Map();
let stopItems = null;
let serverRefreshTimer = 0;
let stopInsight = null;
let stopOccasions = null;
let insightCloudReady = false;
let applyingInsightCloud = false;
let insightSyncTimer = 0;
let inventoryCloudReady = false;
let applyingInventoryCloud = false;
let inventorySyncTimer = 0;
let stopInventory = null;

const gate = document.getElementById('authGate');
const message = document.getElementById('authMessage');
const signInButton = document.getElementById('googleSignIn');
const signOutButton = document.getElementById('googleSignOut');
const accessBox = document.getElementById('accessCodeBox');
const accessUid = document.getElementById('accessUid');
const syncStatus = document.getElementById('syncStatus');
const accountButton = document.getElementById('accountButton');
const accountModal = document.getElementById('accountModal');
const currentAccountName = document.getElementById('currentAccountName');
const closeAccountButton = document.getElementById('closeAccount');
const accountSignOutButton = document.getElementById('accountSignOut');

// Publieke, eenvoudige authstatus voor de niet-module scripts.
window.huizeChaosAuthState = 'checking';

function setSyncStatus(text, state = '') {
  syncStatus.textContent = text;
  syncStatus.className = `sync-status ${state}`.trim();
}

function showSignedOut() {
  window.huizeChaosAuthState = 'signed-out';
  gate.classList.remove('ready');
  message.textContent = 'Meld je aan met Google om de gezamenlijke lijst te openen.';
  signInButton.hidden = false;
  signOutButton.hidden = true;
  accessBox.hidden = true;
  setSyncStatus('Niet aangemeld');
}

function showWaiting(currentUser) {
  window.huizeChaosAuthState = 'waiting-access';
  gate.classList.remove('ready');
  message.textContent = `Je bent aangemeld als ${currentUser.displayName || currentUser.email || 'Google-gebruiker'}, maar hebt nog geen toegang.`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
  accessBox.hidden = false;
  accessUid.textContent = currentUser.uid;
  setSyncStatus('Wacht op toegang');
}

function inventoryProductData(product){
  // Voorraad synchroniseert de productgegevens, maar NIET de boodschappenstatus.
  // `shoppingItems` is de enige bron voor Kopen aan/uit. Zo kunnen de twee
  // synchronisatieroutes elkaar niet meer terugtriggeren.
  const copy = { ...product };
  delete copy.cloudPending;
  delete copy.cloudId;
  delete copy.cloudSource;
  delete copy.cloudAddedBy;
  delete copy.cloudAddedByName;
  delete copy.shopping;
  delete copy.done;
  return copy;
}

function inventoryProducts(){
  return window.getHuizeChaosProducts().filter(product => !product.temporary).map(inventoryProductData);
}

async function syncInventoryNow(){
  if(!inventoryCloudReady || !user || applyingInventoryCloud) return;
  const products = inventoryProducts();
  await setDoc(inventoryRef, {
    products,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid
  }, { merge: false });
}

function scheduleInventorySync(){
  if(applyingInventoryCloud) return;
  clearTimeout(inventorySyncTimer);
  inventorySyncTimer=setTimeout(()=>syncInventoryNow().catch(error=>{
    console.error('Voorraadsynchronisatie mislukt',error);
    setSyncStatus('Syncfout','error');
  }),300);
}

function mergeInventoryFromCloud(remoteProducts){
  const local=window.getHuizeChaosProducts();
  const localById=new Map(local.map(product=>[String(product.id),product]));
  // Voorraadvelden komen uit inventory. Boodschappenstatus + cloud-identiteit
  // blijven lokaal en worden uitsluitend door shoppingItems beheerd.
  const merged=remoteProducts.map(remote=>{
    const current=localById.get(String(remote.id));
    if(!current) return { ...remote, shopping:false, done:false };
    return {
      ...current,
      ...remote,
      shopping:Boolean(current.shopping),
      done:Boolean(current.done),
      cloudId:current.cloudId,
      cloudSource:current.cloudSource,
      cloudAddedBy:current.cloudAddedBy,
      cloudAddedByName:current.cloudAddedByName,
      cloudPending:current.cloudPending
    };
  });
  // Eenmalige/gezinsboodschappen bestaan alleen via shoppingItems.
  local.filter(product=>product.temporary || product.cloudSource==='family').forEach(product=>{
    if(!merged.some(x=>String(x.id)===String(product.id))) merged.push(product);
  });
  applyingInventoryCloud=true;
  window.replaceHuizeChaosProducts(merged);
  applyingInventoryCloud=false;
}

async function startInventorySync(){
  if(!user) return;
  try{
    const snap=await getDoc(inventoryRef);
    if(snap.exists() && Array.isArray(snap.data()?.products)){
      mergeInventoryFromCloud(snap.data().products);
    }else{
      inventoryCloudReady=true;
      await syncInventoryNow();
    }
    inventoryCloudReady=true;
    stopInventory?.();
    stopInventory=onSnapshot(inventoryRef,snapshot=>{
      if(!snapshot.exists() || applyingInventoryCloud) return;
      const data=snapshot.data()||{};
      if(!Array.isArray(data.products)) return;
      mergeInventoryFromCloud(data.products);
      setSyncStatus('Gesynchroniseerd','online');
    },error=>console.error('Voorraad live synchronisatie mislukt',error));
  }catch(error){
    console.error('Voorraadsynchronisatie starten mislukt',error);
  }
}

function cloudData(product) {
  return {
    localId: String(product.id),
    name: String(product.name || ''),
    quantity: String(product.quantity || ''),
    unit: String(product.unit || ''),
    store: String(product.store || ''),
    category: String(product.category || ''),
    memo: String(product.memo || ''),
    done: Boolean(product.done),
    temporary: Boolean(product.temporary),
    source: product.cloudSource || (product.status === 'In huis' ? 'family' : 'stock'),
    addedBy: product.cloudAddedBy || user.uid,
    addedByName: product.cloudAddedByName || user.displayName || 'Gezinslid'
  };
}

function cloudChanged(current, next) {
  return Object.keys(next).some(key => current?.[key] !== next[key]);
}

const syncedFields = ['localId', 'name', 'quantity', 'unit', 'store', 'category', 'memo', 'done', 'temporary', 'source', 'addedBy', 'addedByName'];

function sameRemoteItems(current, next) {
  if (current.size !== next.size) return false;
  for (const [cloudId, nextData] of next) {
    const currentData = current.get(cloudId);
    if (!currentData) return false;
    if (syncedFields.some(field => currentData[field] !== nextData[field])) return false;
  }
  return true;
}

function applySnapshot(snapshot) {
  const nextRemote = new Map();
  snapshot.forEach(itemDoc => nextRemote.set(itemDoc.id, itemDoc.data()));

  if (cloudReady && sameRemoteItems(remoteItems, nextRemote)) {
    remoteItems = nextRemote;
    const localProducts = window.getHuizeChaosProducts();
    if (syncPending || localProducts.some(product => product.shopping && (!product.cloudId || product.cloudPending))) {
      scheduleSync();
    } else {
      setSyncStatus('Gesynchroniseerd', 'online');
    }
    return;
  }

  applyingCloud = true;
  let products = [...window.getHuizeChaosProducts()];
  let counter = 0;

  nextRemote.forEach((data, cloudId) => {
    let product = products.find(x => x.cloudId === cloudId);
    // Alleen eigen voorraadregels mogen via een lokaal nummer worden gekoppeld.
    // Gezinsleden gebruiken op ieder toestel andere lokale nummers; koppelen daarop
    // kan hun boodschap onbedoeld laten verdwijnen in een bestaand product.
    if (!product && data.localId && data.source === 'stock') {
      product = products.find(x => String(x.id) === String(data.localId) && x.shopping);
    }
    if (!product) {
      product = { id: Date.now() + counter++, status: 'In huis', shopping: true, buyDirectWhenOut: false };
      products.push(product);
    }
    Object.assign(product, {
      cloudId,
      cloudSource: data.source || 'family',
      cloudAddedBy: data.addedBy || '',
      cloudAddedByName: data.addedByName || '',
      cloudPending: false,
      name: data.name || '',
      quantity: data.quantity || '',
      unit: data.unit || '',
      store: data.store || '',
      category: data.category || '',
      memo: data.memo || '',
      done: Boolean(data.done),
      temporary: Boolean(data.temporary),
      shopping: true
    });
  });

  products = products.filter(product => {
    if (!product.cloudId || nextRemote.has(product.cloudId)) return true;
    if (product.cloudPending) return true;
    if (product.cloudSource === 'stock') {
      product.shopping = false;
      product.done = false;
      product.status = 'In huis';
      delete product.cloudId;
      return true;
    }
    return false;
  });

  remoteItems = nextRemote;
  cloudReady = true;
  window.replaceHuizeChaosProducts(products);
  applyingCloud = false;
  setSyncStatus('Gesynchroniseerd', 'online');
  if (syncPending || products.some(x => x.shopping && !x.cloudId)) scheduleSync();
}

async function refreshItemsFromServer() {
  if (!user || !role || document.visibilityState === 'hidden') return;
  const snapshot = await getDocsFromServer(itemsRef);
  applySnapshot(snapshot);
}

function startServerRefresh() {
  clearInterval(serverRefreshTimer);
  serverRefreshTimer = setInterval(() => {
    refreshItemsFromServer().catch(error => console.error('Servercontrole boodschappen mislukt', error));
  }, 15000);
}

async function syncNow() {
  if (!cloudReady || !user || applyingCloud) return;
  const products = window.getHuizeChaosProducts();
  const activeIds = new Set();

  for (const product of products.filter(x => x.shopping)) {
    if (!product.cloudId) {
      product.cloudId = crypto.randomUUID();
      product.cloudSource = product.temporary ? 'family' : 'stock';
      product.cloudAddedBy = user.uid;
      product.cloudAddedByName = user.displayName || 'Gezinslid';
      product.cloudPending = true;
      localStorage.setItem('household-products-v2', JSON.stringify(products));
    }
    activeIds.add(product.cloudId);
    const nextData = cloudData(product);
    if (product.cloudPending || !remoteItems.has(product.cloudId) || cloudChanged(remoteItems.get(product.cloudId), nextData)) {
      await setDoc(doc(itemsRef, product.cloudId), { ...nextData, updatedAt: serverTimestamp() }, { merge: true });
      product.cloudPending = false;
      remoteItems.set(product.cloudId, nextData);
    }
  }

  for (const [cloudId, data] of remoteItems) {
    if (!activeIds.has(cloudId) && (role === 'owner' || data.addedBy === user.uid)) {
      await deleteDoc(doc(itemsRef, cloudId));
    }
  }
  localStorage.setItem('household-products-v2', JSON.stringify(products));
  syncPending = false;
  setSyncStatus('Gesynchroniseerd', 'online');
}

function scheduleSync() {
  // Lokale wijzigingen mogen de aanmeldstatus niet overschrijven.
  if (!user) {
    syncPending = false;
    return;
  }
  syncPending = true;
  if (!cloudReady || applyingCloud) {
    setSyncStatus('Wacht op synchronisatie…');
    return;
  }
  clearTimeout(syncTimer);
  setSyncStatus('Synchroniseren…');
  syncTimer = setTimeout(() => syncNow().catch(error => {
    console.error(error);
    setSyncStatus('Syncfout', 'error');
    setTimeout(() => scheduleSync(), 5000);
  }), 250);
}


function hasMeaningfulInsightData(data) {
  return Boolean((data?.receipts?.length) || Number(data?.budgetWeek) || Number(data?.budgetMonth) || Object.keys(data?.categoryMemory || {}).length);
}

async function syncInsightNow() {
  if (!user || !role || !insightCloudReady || applyingInsightCloud || !window.getHuizeChaosInsightData) return;
  const data = window.getHuizeChaosInsightData();
  await setDoc(insightRef, { ...data, updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true });
}

function scheduleInsightSync() {
  if (!insightCloudReady || applyingInsightCloud) return;
  clearTimeout(insightSyncTimer);
  insightSyncTimer = setTimeout(() => syncInsightNow().catch(error => {
    console.error('Synchronisatie Inzicht mislukt', error);
    setSyncStatus('Syncfout', 'error');
  }), 300);
}

async function startInsightSync() {
  stopInsight?.();
  insightCloudReady = false;
  const first = await getDoc(insightRef);
  const local = window.getHuizeChaosInsightData?.() || {};
  if (first.exists()) {
    applyingInsightCloud = true;
    window.applyHuizeChaosInsightData?.(first.data());
    applyingInsightCloud = false;
  } else if (hasMeaningfulInsightData(local)) {
    // Veilige eerste migratie: alleen een toestel met bestaande Inzicht-data mag
    // de nog lege cloud vullen. Een lege laptop kan de telefoon dus niet wissen.
    await setDoc(insightRef, { ...local, updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: false });
  }
  insightCloudReady = true;
  stopInsight = onSnapshot(insightRef, snapshot => {
    if (!snapshot.exists()) return;
    applyingInsightCloud = true;
    window.applyHuizeChaosInsightData?.(snapshot.data());
    applyingInsightCloud = false;
  }, error => console.error('Inzicht live synchronisatie mislukt', error));
}

window.addEventListener('huize-chaos-insight-changed', scheduleInsightSync);

window.syncHuizeChaosOccasions=async events=>{
  if(!user||!Array.isArray(events))return;
  try{await setDoc(occasionsRef,{events,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:false})}catch(error){console.error('Gelegenheden synchroniseren mislukt',error)}
};

async function startOccasionsSync(){
  stopOccasions?.();
  const first=await getDoc(occasionsRef);
  if(first.exists()&&Array.isArray(first.data()?.events)){
    localStorage.setItem('huize-chaos-occasions-v1',JSON.stringify(first.data().events));
    window.dispatchEvent(new Event('huize-chaos-occasions-changed'));
  }
  stopOccasions=onSnapshot(occasionsRef,snapshot=>{
    if(!snapshot.exists()||!Array.isArray(snapshot.data()?.events))return;
    localStorage.setItem('huize-chaos-occasions-v1',JSON.stringify(snapshot.data().events));
    window.dispatchEvent(new Event('huize-chaos-occasions-changed'));
  },error=>console.error('Gelegenheden live synchronisatie mislukt',error));
}

window.scheduleCloudSync = scheduleSync;
window.addEventListener('huize-chaos-products-changed', scheduleSync);
window.addEventListener('huize-chaos-products-changed', scheduleInventorySync);

async function openFor(currentUser) {
  const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', currentUser.uid);
  const member = await getDoc(memberRef);
  if (!member.exists()) {
    showWaiting(currentUser);
    return;
  }
  role = member.data().role === 'owner' ? 'owner' : 'member';
  window.huizeChaosAuthState = 'signed-in';
  gate.classList.add('ready');
  signOutButton.hidden = false;
  window.applyHuizeChaosRole(role);
  setSyncStatus('Verbinden…');
  stopItems?.();
  stopItems = onSnapshot(itemsRef, applySnapshot, error => {
    console.error(error);
    setSyncStatus('Geen verbinding', 'error');
  });
  startServerRefresh();
  await startInsightSync();
  await startOccasionsSync();
  await startInventorySync();
  refreshItemsFromServer().catch(error => {
    console.error(error);
    setSyncStatus('Geen verbinding', 'error');
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshItemsFromServer().catch(error => console.error('Servercontrole boodschappen mislukt', error));
  }
});
window.addEventListener('focus', () => {
  refreshItemsFromServer().catch(error => console.error('Servercontrole boodschappen mislukt', error));
});

signInButton.addEventListener('click', async () => {
  signInButton.disabled = true;
  message.textContent = 'Aanmelden met Google…';
  setSyncStatus('Aanmelden…');
  window.huizeChaosAuthState = 'signing-in';
  try {
    const mobileOrInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(pointer: coarse)').matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Redirect is op mobiele browsers/PWA's betrouwbaarder dan een popup.
    if (mobileOrInstalled) {
      await signInWithRedirect(auth, provider);
      return;
    }

    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectError) {
        console.error(redirectError);
        showSignedOut();
        message.textContent = `Aanmelden is niet gelukt: ${redirectError.message}`;
      }
    } else {
      console.error(error);
      showSignedOut();
      message.textContent = `Aanmelden is niet gelukt: ${error.message}`;
    }
  } finally {
    signInButton.disabled = false;
  }
});

signOutButton.addEventListener('click', () => signOut(auth));
accountButton.addEventListener('click', () => {
  if (!user) return;
  currentAccountName.textContent = user.displayName || user.email || 'Google-account';
  accountModal.classList.add('open');
  accountModal.setAttribute('aria-hidden', 'false');
});

function closeAccountModal() {
  accountModal.classList.remove('open');
  accountModal.setAttribute('aria-hidden', 'true');
}

closeAccountButton.addEventListener('click', closeAccountModal);
accountModal.addEventListener('click', event => {
  if (event.target === accountModal) closeAccountModal();
});
accountSignOutButton.addEventListener('click', async () => {
  accountSignOutButton.disabled = true;
  accountSignOutButton.textContent = 'Afmelden…';
  try {
    await signOut(auth);
    closeAccountModal();
  } finally {
    accountSignOutButton.disabled = false;
    accountSignOutButton.textContent = 'Afmelden';
  }
});
document.getElementById('copyAccessUid').addEventListener('click', async () => {
  await navigator.clipboard.writeText(accessUid.textContent);
  document.getElementById('copyAccessUid').textContent = 'Gekopieerd';
});

getRedirectResult(auth).catch(error => {
  console.error(error);
  showSignedOut();
  message.textContent = `Aanmelden is niet gelukt: ${error.message}`;
});
onAuthStateChanged(auth, currentUser => {
  window.huizeChaosAuthState = 'checking';
  user = currentUser;
  cloudReady = false;
  stopItems?.();
  stopItems = null;
  stopInsight?.();
  stopInsight = null;
  stopOccasions?.();
  stopOccasions = null;
  stopInventory?.();
  stopInventory = null;
  inventoryCloudReady = false;
  insightCloudReady = false;
  clearInterval(serverRefreshTimer);
  if (!currentUser) {
    role = '';
    showSignedOut();
    return;
  }
  openFor(currentUser).catch(error => {
    console.error(error);
    message.textContent = 'Toegang controleren is niet gelukt. Controleer de Firebase-instellingen.';
    setSyncStatus('Toegangsfout', 'error');
  });
});
