import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
const app=initializeApp(firebaseConfig,'planner');
const auth=getAuth(app);
const db=getFirestore(app);
const provider=new GoogleAuthProvider();
const HOUSEHOLD_ID='huize-chaos';
const sharedRef=collection(db,'households',HOUSEHOLD_ID,'plannerItems');
const bigStateRef=doc(db,'households',HOUSEHOLD_ID,'plannerSettings','bigChore');

const gate=document.getElementById('authGate');
const message=document.getElementById('authMessage');
const signInButton=document.getElementById('googleSignIn');
const signOutButton=document.getElementById('googleSignOut');
const accessBox=document.getElementById('accessCodeBox');
const accessUid=document.getElementById('accessUid');
const syncStatus=document.getElementById('syncStatus');

let user=null;
let role='';
let privateRef=null;
let sharedItems=new Map();
let privateItems=new Map();
let sharedReady=false;
let privateReady=false;
let cloudReady=false;
let applyingCloud=false;
let syncing=false;
let syncTimer=0;
let stopListeners=[];
const LEGACY_HOUSEHOLD_IDS=new Set(['house-weekly-0','house-weekly-1','house-weekly-2','house-weekly-3','house-weekly-4']);
const firstName=value=>String(value||'').trim().split(/\s+/)[0]||'Gezinslid';

function setStatus(text,state=''){syncStatus.textContent=text;syncStatus.className=`sync-status ${state}`.trim()}
function stopAll(){stopListeners.forEach(stop=>stop());stopListeners=[]}
function showSignedOut(){gate.classList.remove('ready');message.textContent='Meld je aan met Google om de gezamenlijke gezinsplanner te openen.';signInButton.hidden=false;signOutButton.hidden=true;accessBox.hidden=true;setStatus('Niet aangemeld')}
function showWaiting(currentUser){gate.classList.remove('ready');message.textContent=`Je bent aangemeld als ${currentUser.displayName||currentUser.email||'Google-gebruiker'}, maar hebt nog geen toegang.`;signInButton.hidden=true;signOutButton.hidden=false;accessBox.hidden=false;accessUid.textContent=currentUser.uid;setStatus('Wacht op toegang')}
  function cleanData(item){return {localId:String(item.id),type:item.type==='appointment'?'appointment':'task',date:String(item.date||''),deadline:String(item.deadline||''),urgent:Boolean(item.urgent),category:['school','work','household'].includes(item.category)?item.category:'',title:String(item.title||''),time:String(item.time||''),endTime:String(item.endTime||''),personUid:String(item.personUid||''),personName:String(item.personName||''),note:String(item.note||''),done:Boolean(item.done),repeat:String(item.repeat||'none'),completedPeriods:Array.isArray(item.completedPeriods)?item.completedPeriods:[],createdAt:Number(item.createdAt||Date.now()),visibility:item.visibility==='private'?'private':'shared',addedBy:item.addedBy||user.uid,addedByName:firstName(item.addedByName||user.displayName)} }
function fromCloud(data,cloudId,scope){return {...data,id:data.localId||cloudId,cloudId,cloudScope:scope,visibility:scope==='private'?'private':'shared',completedPeriods:Array.isArray(data.completedPeriods)?data.completedPeriods:[]} }

function applyCombined(){
  if(!sharedReady||!privateReady)return;
  if(syncing)return;
  const local=window.getHuizeChaosPlannerEntries();
  const legacyRemote=[...sharedItems.values()].some(data=>LEGACY_HOUSEHOLD_IDS.has(data.localId));
  const remote=[...sharedItems].map(([id,data])=>fromCloud(data,id,'shared')).filter(item=>!LEGACY_HOUSEHOLD_IDS.has(item.id));
  if(role==='owner')remote.push(...[...privateItems].map(([id,data])=>fromCloud(data,id,'private')));
  const unsaved=local.filter(item=>!item.cloudId&&(role==='owner'||(cloudReady&&item.visibility!=='private')));
  if(!remote.length&&unsaved.length){cloudReady=true;setStatus('Synchroniseren…');scheduleSync();return}
  applyingCloud=true;
  window.replaceHuizeChaosPlannerEntries([...remote,...unsaved.filter(item=>!remote.some(saved=>saved.id===item.id))]);
  applyingCloud=false;
  cloudReady=true;
  setStatus('Gesynchroniseerd','online');
  if(unsaved.length||legacyRemote)scheduleSync();
}

async function syncNow(){
  if(!cloudReady||!user||applyingCloud)return;
  syncing=true;
  const entries=window.getHuizeChaosPlannerEntries();
  const activeShared=new Set();
  const activePrivate=new Set();
  const batch=writeBatch(db);
  for(const item of entries){
    const scope=role==='owner'&&item.visibility==='private'?'private':'shared';
    if(!item.cloudId)item.cloudId=crypto.randomUUID();
    const target=scope==='private'?privateRef:sharedRef;
    const active=scope==='private'?activePrivate:activeShared;
    active.add(item.cloudId);
    batch.set(doc(target,item.cloudId),{...cleanData({...item,visibility:scope}),updatedAt:serverTimestamp()},{merge:true});
    item.cloudScope=scope;
  }
  for(const id of sharedItems.keys())if(!activeShared.has(id))batch.delete(doc(sharedRef,id));
  if(role==='owner')for(const id of privateItems.keys())if(!activePrivate.has(id))batch.delete(doc(privateRef,id));
  await batch.commit();
  localStorage.setItem('huizeChaosPlannerV130',JSON.stringify(entries));
  syncing=false;
  applyCombined();
  setStatus('Gesynchroniseerd','online');
}
function scheduleSync(){if(!cloudReady||applyingCloud)return;clearTimeout(syncTimer);setStatus('Synchroniseren…');syncTimer=setTimeout(()=>syncNow().catch(error=>{syncing=false;console.error(error);setStatus('Syncfout','error')}),250)}
window.schedulePlannerCloudSync=scheduleSync;
window.schedulePlannerBigStateSync=state=>{if(!cloudReady||!user)return;setDoc(bigStateRef,{...state,updatedAt:serverTimestamp()},{merge:true}).catch(error=>{console.error(error);setStatus('Syncfout','error')})};

async function openFor(currentUser){
  const member=await getDoc(doc(db,'households',HOUSEHOLD_ID,'members',currentUser.uid));
  if(!member.exists()){showWaiting(currentUser);return}
  role=member.data().role==='owner'?'owner':'member';
  window.huizeChaosPlannerUserUid=currentUser.uid;window.huizeChaosPlannerUserName=currentUser.displayName||currentUser.email||'Gezinslid';
  window.applyHuizeChaosPlannerRole(role);
  privateRef=collection(db,'households',HOUSEHOLD_ID,'members',currentUser.uid,'privatePlannerItems');
  gate.classList.add('ready');signOutButton.hidden=false;setStatus('Verbinden…');
  stopAll();sharedReady=false;privateReady=role!=='owner';
  stopListeners.push(onSnapshot(sharedRef,snapshot=>{sharedItems=new Map();snapshot.forEach(item=>sharedItems.set(item.id,item.data()));sharedReady=true;applyCombined()},syncError));
  if(role==='owner')stopListeners.push(onSnapshot(privateRef,snapshot=>{privateItems=new Map();snapshot.forEach(item=>privateItems.set(item.id,item.data()));privateReady=true;applyCombined()},syncError));
  stopListeners.push(onSnapshot(bigStateRef,snapshot=>{if(snapshot.exists())window.applyHuizeChaosBigState(snapshot.data())},syncError));
}
function syncError(error){console.error(error);setStatus('Geen verbinding','error')}

signInButton.addEventListener('click',async()=>{try{await signInWithPopup(auth,provider)}catch(error){if(error.code==='auth/popup-blocked'||error.code==='auth/cancelled-popup-request')await signInWithRedirect(auth,provider);else message.textContent=`Aanmelden is niet gelukt: ${error.message}`}});
signOutButton.addEventListener('click',()=>signOut(auth));
document.getElementById('copyAccessUid').addEventListener('click',async()=>{await navigator.clipboard.writeText(accessUid.textContent);document.getElementById('copyAccessUid').textContent='Gekopieerd'});
getRedirectResult(auth).catch(console.error);
onAuthStateChanged(auth,currentUser=>{user=currentUser;cloudReady=false;stopAll();if(!currentUser){role='';showSignedOut();return}openFor(currentUser).catch(error=>{console.error(error);message.textContent='Toegang controleren is niet gelukt. Controleer de Firebase-instellingen.';setStatus('Toegangsfout','error')})});
