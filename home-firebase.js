import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getDocFromServer, getFirestore, onSnapshot, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
const app=initializeApp(firebaseConfig,'planner');
const auth=getAuth(app);
const db=getFirestore(app);
const HOUSEHOLD_ID='huize-chaos';
const routineRef=doc(db,'households',HOUSEHOLD_ID,'plannerSettings','dailyRoutines');
const syncStatus=document.getElementById('syncStatus');
let user=null,allowed=false,stopRoutine=null,refreshTimer=0;

function setStatus(text,state=''){
  if(!syncStatus)return;
  syncStatus.textContent=text;
  syncStatus.className=`sync-status ${state}`.trim();
}
function normalize(data){return {date:String(data?.date||''),done:data?.done&&typeof data.done==='object'?data.done:{}}}
function applyCloud(data){window.applyHuizeChaosHomeRoutineState?.(normalize(data))}
function fail(error){console.error('Startscherm synchronisatie',error);setStatus('Syncfout','error')}

async function connect(currentUser){
  setStatus('Verbinden…');
  const member=await getDoc(doc(db,'households',HOUSEHOLD_ID,'members',currentUser.uid));
  if(!member.exists()){allowed=false;setStatus('Geen toegang','error');return}
  allowed=true;
  if(stopRoutine)stopRoutine();
  stopRoutine=onSnapshot(routineRef,snapshot=>{
    if(snapshot.exists())applyCloud(snapshot.data());
    setStatus('Gesynchroniseerd','online');
  },fail);
  // Bij openen/focus expliciet van de server lezen; zo is ✓ niet alleen cache-contact.
  const verified=await getDocFromServer(routineRef);
  if(verified.exists())applyCloud(verified.data());
  setStatus('Gesynchroniseerd','online');
}

window.saveHuizeChaosHomeRoutineState=async(index,done,date)=>{
  if(!user||!allowed){setStatus('Niet aangemeld');return}
  setStatus('Synchroniseren…');
  try{
    await runTransaction(db,async transaction=>{
      const snapshot=await transaction.get(routineRef);
      const current=normalize(snapshot.exists()?snapshot.data():null);
      const merged=current.date===String(date)?{...current.done}:{};
      merged[String(index)]=Boolean(done);
      transaction.set(routineRef,{date:String(date),done:merged,updatedAt:serverTimestamp()});
    });
    const verified=await getDocFromServer(routineRef);
    if(verified.exists())applyCloud(verified.data());
    setStatus('Gesynchroniseerd','online');
  }catch(error){fail(error)}
};

async function refresh({quiet=false}={}){
  if(!user||!allowed||document.visibilityState==='hidden')return;
  try{
    if(!quiet)setStatus('Synchroniseren…');
    const verified=await getDocFromServer(routineRef);
    if(verified.exists())applyCloud(verified.data());
    if(!quiet)setStatus('Gesynchroniseerd','online');
  }catch(error){fail(error)}
}
function startRefreshTimer(){
  clearInterval(refreshTimer);
  refreshTimer=setInterval(()=>refresh({quiet:true}),4000);
}

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
window.addEventListener('focus',refresh);
startRefreshTimer();
onAuthStateChanged(auth,currentUser=>{
  user=currentUser;allowed=false;
  if(stopRoutine){stopRoutine();stopRoutine=null}
  if(!currentUser){setStatus('Niet aangemeld');return}
  connect(currentUser).catch(fail);
});
