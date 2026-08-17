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

let role = '';
let user = null;
let cloudReady = false;
let applyingCloud = false;
let syncTimer = 0;
let remoteItems = new Map();
let stopItems = null;
let serverRefreshTimer = 0;

const gate = document.getElementById('authGate');
const message = document.getElementById('authMessage');
const signInButton = document.getElementById('googleSignIn');
const signOutButton = document.getElementById('googleSignOut');
const accessBox = document.getElementById('accessCodeBox');
const accessUid = document.getElementById('accessUid');
const syncStatus = document.getElementById('syncStatus');

function setSyncStatus(text, state = '') {
  syncStatus.textContent = text;
  syncStatus.className = `sync-status ${state}`.trim();
}

function showSignedOut() {
  gate.classList.remove('ready');
  message.textContent = 'Meld je aan met Google om de gezamenlijke lijst te openen.';
  signInButton.hidden = false;
  signOutButton.hidden = true;
  accessBox.hidden = true;
  setSyncStatus('Niet aangemeld');
}

function showWaiting(currentUser) {
  gate.classList.remove('ready');
  message.textContent = `Je bent aangemeld als ${currentUser.displayName || currentUser.email || 'Google-gebruiker'}, maar hebt nog geen toegang.`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
  accessBox.hidden = false;
  accessUid.textContent = currentUser.uid;
  setSyncStatus('Wacht op toegang');
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
    source: product.cloudSource || (product.status === 'Voldoende' ? 'family' : 'stock'),
    addedBy: product.cloudAddedBy || user.uid,
    addedByName: product.cloudAddedByName || user.displayName || 'Gezinslid'
  };
}

function cloudChanged(current, next) {
  return Object.keys(next).some(key => current?.[key] !== next[key]);
}

function applySnapshot(snapshot) {
  const nextRemote = new Map();
  snapshot.forEach(itemDoc => nextRemote.set(itemDoc.id, itemDoc.data()));

  applyingCloud = true;
  let products = [...window.getHuizeChaosProducts()];
  let counter = 0;

  nextRemote.forEach((data, cloudId) => {
    let product = products.find(x => x.cloudId === cloudId);
    if (!product && data.localId) product = products.find(x => String(x.id) === String(data.localId) && x.shopping);
    if (!product) {
      product = { id: Date.now() + counter++, status: 'Voldoende', shopping: true, buyDirectWhenOut: false };
      products.push(product);
    }
    Object.assign(product, {
      cloudId,
      cloudSource: data.source || 'family',
      cloudAddedBy: data.addedBy || '',
      cloudAddedByName: data.addedByName || '',
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
    if (product.cloudSource === 'stock') {
      product.shopping = false;
      product.done = false;
      product.status = 'Voldoende';
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
  if (role === 'owner' && products.some(x => x.shopping && !x.cloudId)) scheduleSync();
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
      product.cloudSource = role === 'owner' && product.status !== 'Voldoende' ? 'stock' : 'family';
      product.cloudAddedBy = user.uid;
      product.cloudAddedByName = user.displayName || 'Gezinslid';
    }
    activeIds.add(product.cloudId);
    const nextData = cloudData(product);
    if (!remoteItems.has(product.cloudId) || cloudChanged(remoteItems.get(product.cloudId), nextData)) {
      await setDoc(doc(itemsRef, product.cloudId), { ...nextData, updatedAt: serverTimestamp() }, { merge: true });
    }
  }

  for (const [cloudId, data] of remoteItems) {
    if (!activeIds.has(cloudId) && (role === 'owner' || data.addedBy === user.uid)) {
      await deleteDoc(doc(itemsRef, cloudId));
    }
  }
  localStorage.setItem('household-products-v2', JSON.stringify(products));
  setSyncStatus('Gesynchroniseerd', 'online');
}

function scheduleSync() {
  if (!cloudReady || applyingCloud) return;
  clearTimeout(syncTimer);
  setSyncStatus('Synchroniseren…');
  syncTimer = setTimeout(() => syncNow().catch(error => {
    console.error(error);
    setSyncStatus('Syncfout', 'error');
  }), 250);
}

window.scheduleCloudSync = scheduleSync;

async function openFor(currentUser) {
  const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', currentUser.uid);
  const member = await getDoc(memberRef);
  if (!member.exists()) {
    showWaiting(currentUser);
    return;
  }
  role = member.data().role === 'owner' ? 'owner' : 'member';
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
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
    } else {
      message.textContent = `Aanmelden is niet gelukt: ${error.message}`;
    }
  }
});

signOutButton.addEventListener('click', () => signOut(auth));
document.getElementById('copyAccessUid').addEventListener('click', async () => {
  await navigator.clipboard.writeText(accessUid.textContent);
  document.getElementById('copyAccessUid').textContent = 'Gekopieerd';
});

getRedirectResult(auth).catch(console.error);
onAuthStateChanged(auth, currentUser => {
  user = currentUser;
  cloudReady = false;
  stopItems?.();
  stopItems = null;
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
