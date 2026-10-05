import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDoc, getDocFromServer, getDocsFromServer, getFirestore, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyCk8GcRdAtmlGwfVu21YN_571A8KSQ-TFI',authDomain:'huize-chaos.firebaseapp.com',projectId:'huize-chaos',storageBucket:'huize-chaos.firebasestorage.app',messagingSenderId:'742691644230',appId:'1:742691644230:web:1488577640944cc3d6bb47'};
const app=initializeApp(firebaseConfig,'planner');
const auth=getAuth(app);
const db=getFirestore(app);
const HOUSEHOLD_ID='huize-chaos';
const PLANNER_KEY='huizeChaosPlannerV130';
const HOME_PATCH_KEY='huizeChaosPlannerHomePatchesV164';
const routineRef=doc(db,'households',HOUSEHOLD_ID,'plannerSettings','dailyRoutines');
const sharedRef=collection(db,'households',HOUSEHOLD_ID,'plannerItems');
const syncStatus=document.getElementById('syncStatus');
let user=null,allowed=false,role='',privateRef=null,stopRoutine=null,refreshTimer=0,plannerSyncing=false;

function setStatus(text,state=''){
  if(!syncStatus)return;
  syncStatus.textContent=text;
  syncStatus.className=`sync-status ${state}`.trim();
}
function normalize(data){return {date:String(data?.date||''),done:data?.done&&typeof data.done==='object'?data.done:{}}}
function applyCloud(data){window.applyHuizeChaosHomeRoutineState?.(normalize(data))}
function fail(error){console.error('Startscherm synchronisatie',error);setStatus('Syncfout','error')}
function readJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}}
function firstName(value){return String(value||'').trim().split(/\s+/)[0]||'Gezinslid'}
function homePatches(){const value=readJson(HOME_PATCH_KEY,[]);return Array.isArray(value)?value:[]}
function fromCloud(data,cloudId,scope){return {...data,id:data.localId||cloudId,cloudId,cloudScope:scope,visibility:scope==='private'?'private':'shared',completedPeriods:Array.isArray(data.completedPeriods)?data.completedPeriods:[]}}
function cleanData(item){return {localId:String(item.id),type:item.type==='appointment'?'appointment':item.type==='checklist'?'checklist':'task',date:String(item.date||''),deadline:String(item.deadline||''),urgent:Boolean(item.urgent),category:['school','work','household'].includes(item.category)?item.category:'',title:String(item.title||''),time:String(item.time||''),endTime:String(item.endTime||''),personUid:String(item.personUid||''),personName:String(item.personName||''),participants:Array.isArray(item.participants)?item.participants.map(firstName).filter(Boolean):[],linkedAppointmentId:String(item.linkedAppointmentId||''),note:String(item.note||''),done:Boolean(item.done),repeat:String(item.repeat||'none'),completedPeriods:Array.isArray(item.completedPeriods)?item.completedPeriods:[],manualWeekKey:String(item.manualWeekKey||''),lastCompletedDate:String(item.lastCompletedDate||''),nextDueDate:String(item.nextDueDate||''),checklistTasks:Array.isArray(item.checklistTasks)?item.checklistTasks.map(value=>String(value)).filter(Boolean):[],showBeforeDays:Number(item.showBeforeDays||0),showMoment:String(item.showMoment||'evening'),checklistStates:item.checklistStates&&typeof item.checklistStates==='object'?item.checklistStates:{},skippedOccurrences:Array.isArray(item.skippedOccurrences)?item.skippedOccurrences:[],createdAt:Number(item.createdAt||Date.now()),visibility:item.visibility==='private'?'private':'shared',addedBy:item.addedBy||user?.uid||'',addedByName:firstName(item.addedByName||user?.displayName)}}

function saveLocalPlanner(items){
  localStorage.setItem(PLANNER_KEY,JSON.stringify(items));
  window.dispatchEvent(new Event('huize-chaos-planner-cloud-applied'));
  // renderToday luistert al naar huize-chaos-planner-changed. Tijdens cloud-apply zijn
  // er geen nieuwe patches, dus dit veroorzaakt geen terugschrijf-lus.
  window.dispatchEvent(new Event('huize-chaos-planner-changed'));
}

async function refreshPlannerFromServer(){
  if(!user||!allowed)return;
  const sharedSnap=await getDocsFromServer(sharedRef);
  let remote=[];
  sharedSnap.forEach(s=>remote.push(fromCloud(s.data(),s.id,'shared')));
  if(role==='owner'&&privateRef){
    const privateSnap=await getDocsFromServer(privateRef);
    privateSnap.forEach(s=>remote.push(fromCloud(s.data(),s.id,'private')));
  }
  // Een lokale afvinkactie mag niet kort terug in beeld komen terwijl de server-write loopt.
  const patches=homePatches();
  if(patches.length){
    const byId=new Map(patches.map(p=>[String(p.id),p.item]));
    remote=remote.map(item=>{const patch=byId.get(String(item.id));return patch?{...item,...patch,id:item.id,cloudId:item.cloudId,cloudScope:item.cloudScope}:item});
  }
  const local=readJson(PLANNER_KEY,[]);
  const unsaved=Array.isArray(local)?local.filter(item=>!item.cloudId):[];
  const ids=new Set(remote.map(item=>String(item.id)));
  unsaved.forEach(item=>{if(!ids.has(String(item.id)))remote.push(item)});
  saveLocalPlanner(remote);
}

async function syncHomePatches(){
  if(plannerSyncing||!user||!allowed)return;
  const patches=homePatches();
  if(!patches.length)return;
  plannerSyncing=true;
  setStatus('Synchroniseren…');
  try{
    const local=readJson(PLANNER_KEY,[]);
    for(const patch of patches){
      const item={...(patch.item||{})};
      if(!item.id)continue;
      const scope=role==='owner'&&item.visibility==='private'?'private':'shared';
      const target=scope==='private'?privateRef:sharedRef;
      if(!target)continue;
      if(!item.cloudId)item.cloudId=crypto.randomUUID();
      item.cloudScope=scope;
      await setDoc(doc(target,item.cloudId),{...cleanData({...item,visibility:scope}),updatedAt:serverTimestamp()},{merge:true});
      if(Array.isArray(local)){
        const found=local.find(row=>String(row.id)===String(item.id));
        if(found){found.cloudId=item.cloudId;found.cloudScope=scope}
      }
    }
    if(Array.isArray(local))localStorage.setItem(PLANNER_KEY,JSON.stringify(local));
    localStorage.removeItem(HOME_PATCH_KEY);
    await refreshPlannerFromServer();
    setStatus('Gesynchroniseerd','online');
  }finally{plannerSyncing=false}
}

async function connect(currentUser){
  setStatus('Verbinden…');
  const member=await getDoc(doc(db,'households',HOUSEHOLD_ID,'members',currentUser.uid));
  if(!member.exists()){allowed=false;setStatus('Geen toegang','error');return}
  allowed=true;
  role=member.data().role==='owner'?'owner':'member';
  privateRef=role==='owner'?collection(db,'households',HOUSEHOLD_ID,'members',currentUser.uid,'privatePlannerItems'):null;
  if(stopRoutine)stopRoutine();
  stopRoutine=onSnapshot(routineRef,snapshot=>{
    if(snapshot.exists())applyCloud(snapshot.data());
    setStatus('Gesynchroniseerd','online');
  },fail);
  const verified=await getDocFromServer(routineRef);
  if(verified.exists())applyCloud(verified.data());
  await syncHomePatches();
  await refreshPlannerFromServer();
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
    await syncHomePatches();
    const verified=await getDocFromServer(routineRef);
    if(verified.exists())applyCloud(verified.data());
    await refreshPlannerFromServer();
    if(!quiet)setStatus('Gesynchroniseerd','online');
  }catch(error){fail(error)}
}
function startRefreshTimer(){
  clearInterval(refreshTimer);
  refreshTimer=setInterval(()=>refresh({quiet:true}),4000);
}

window.addEventListener('huize-chaos-planner-changed',()=>{
  if(homePatches().length)syncHomePatches().catch(fail);
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
window.addEventListener('focus',refresh);
startRefreshTimer();
onAuthStateChanged(auth,currentUser=>{
  user=currentUser;allowed=false;role='';privateRef=null;
  if(stopRoutine){stopRoutine();stopRoutine=null}
  if(!currentUser){setStatus('Niet aangemeld');return}
  connect(currentUser).catch(fail);
});
