const STORAGE_KEY='huizeChaosPlannerV130';
const SEED_KEY='huizeChaosCarTasksV131';
const HOUSE_SEED_KEY='huizeChaosHouseTasksV132';
const ROUTINE_KEY='huizeChaosDailyRoutinesV132';
const BIG_STATE_KEY='huizeChaosBigChoreV132';
const DEADLINE_SEED_KEY='huizeChaosOldCarDeadlineV133';
const ROUTINES=['Keukenreset','Vaatwasser','Woonkamer opruimen','Was bijhouden'];
const BIG_CHORES=['Ramen schoonmaken','Koelkast uitgebreid schoonmaken','Keukenkastjes schoonmaken','Deuren schoonmaken','Plinten schoonmaken'];
const localDateKey=(date=new Date())=>{const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
const todayKey=()=>localDateKey();
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
let entries=loadEntries();

const els={date:document.getElementById('todayDate'),appointments:document.getElementById('appointmentList'),tasks:document.getElementById('taskList'),progress:document.getElementById('taskProgress'),upcoming:document.getElementById('upcomingList'),routines:document.getElementById('routineList'),todayPage:document.getElementById('todayPage'),routinesPage:document.getElementById('routinesPage'),modal:document.getElementById('entryModal'),form:document.getElementById('entryForm'),id:document.getElementById('entryId'),type:document.getElementById('entryType'),title:document.getElementById('entryTitle'),time:document.getElementById('entryTime'),entryDate:document.getElementById('entryDate'),hasDeadline:document.getElementById('entryHasDeadline'),deadline:document.getElementById('entryDeadline'),urgent:document.getElementById('entryUrgent'),private:document.getElementById('entryPrivate'),repeat:document.getElementById('entryRepeat'),note:document.getElementById('entryNote'),timeField:document.getElementById('timeField'),hasDeadlineField:document.getElementById('hasDeadlineField'),deadlineField:document.getElementById('deadlineField'),urgentField:document.getElementById('urgentField'),privateField:document.getElementById('privateField'),repeatField:document.getElementById('repeatField'),modalTitle:document.getElementById('modalTitle'),titleLabel:document.getElementById('titleLabel')};

seedCarPlanning();
seedHouseholdPlanning();
seedOldCarDeadline();
els.date.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
render();

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.add)));
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>setType(button.dataset.type)));
document.getElementById('cancelEntry').addEventListener('click',closeModal);
els.modal.addEventListener('click',event=>{if(event.target===els.modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
els.form.addEventListener('submit',saveEntry);
els.hasDeadline.addEventListener('change',()=>{els.deadlineField.hidden=!els.hasDeadline.checked;if(!els.hasDeadline.checked)els.deadline.value='' });
document.querySelectorAll('[data-planner-page]').forEach(button=>button.addEventListener('click',()=>showPlannerPage(button.dataset.plannerPage)));

function loadEntries(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));window.schedulePlannerCloudSync?.()}
function seedCarPlanning(){
  if(localStorage.getItem(SEED_KEY))return;
  const planned=[
    {id:'car-pickup-2026',type:'appointment',date:'2026-08-21',title:'Auto ophalen',time:'13:00',note:'',done:false,repeat:'none',completedPeriods:[],createdAt:1786900000000},
    {id:'car-tidy-weekly',type:'task',date:todayKey(),title:'Auto opruimen',time:'',note:'Wekelijkse autoverzorging',done:false,repeat:'weekly',completedPeriods:[],createdAt:1786900000001},
    {id:'car-wash-monthly',type:'task',date:todayKey(),title:'Auto wassen',time:'',note:'Maandelijkse autoverzorging',done:false,repeat:'monthly',completedPeriods:[],createdAt:1786900000002},
    {id:'car-care-seasonal',type:'task',date:todayKey(),title:'Extra onderhoud auto',time:'',note:'Seizoenscontrole en extra verzorging',done:false,repeat:'seasonal',completedPeriods:[],createdAt:1786900000003}
  ];
  planned.forEach(item=>{if(!entries.some(entry=>entry.id===item.id||(entry.title===item.title&&entry.date===item.date)))entries.push(item)});
  persist();localStorage.setItem(SEED_KEY,'1');
}
function seedHouseholdPlanning(){
  if(localStorage.getItem(HOUSE_SEED_KEY))return;
  const planned=['Stofzuigen','Dweilen','Badkamer schoonmaken','Toilet schoonmaken','Beddengoed verschonen'].map((title,index)=>({id:`house-weekly-${index}`,type:'task',date:todayKey(),title,time:'',note:'Huishoudtaak zonder vaste dag',done:false,repeat:'weekly',completedPeriods:[],createdAt:1786900000100+index}));
  planned.forEach(item=>{if(!entries.some(entry=>entry.id===item.id||entry.title===item.title))entries.push(item)});
  persist();localStorage.setItem(HOUSE_SEED_KEY,'1');
}
function seedOldCarDeadline(){
  if(localStorage.getItem(DEADLINE_SEED_KEY))return;
  if(!entries.some(entry=>entry.id==='old-car-empty'))entries.push({id:'old-car-empty',type:'task',date:todayKey(),deadline:'2026-08-20',title:'Oude auto helemaal leegmaken',time:'',note:'Klaar vóór het ophalen van de auto',done:false,repeat:'none',completedPeriods:[],createdAt:1786900000150});
  persist();localStorage.setItem(DEADLINE_SEED_KEY,'1');
}
function showPlannerPage(page){
  els.todayPage.hidden=page!=='today';els.routinesPage.hidden=page!=='routines';
  document.querySelectorAll('[data-planner-page]').forEach(button=>button.classList.toggle('active',button.dataset.plannerPage===page));
  if(page==='routines')renderRoutines();
}
function tomorrowKey(){const date=new Date();date.setDate(date.getDate()+1);return localDateKey(date)}
function getBigState(){
  let state;try{state=JSON.parse(localStorage.getItem(BIG_STATE_KEY))}catch{state=null}
  if(!state)state={index:0,snoozeUntil:''};
  localStorage.setItem(BIG_STATE_KEY,JSON.stringify(state));return state;
}
function saveBigState(state){localStorage.setItem(BIG_STATE_KEY,JSON.stringify(state));window.schedulePlannerBigStateSync?.(state)}
function currentBigChore(){const state=getBigState();if(state.index>=BIG_CHORES.length||state.snoozeUntil>todayKey())return null;return {id:'big-chore-current',type:'task',date:todayKey(),title:BIG_CHORES[state.index],time:'',note:'Periodieke grote klus',done:false,repeat:'none',createdAt:1786900000200,_big:true}}
function upcomingBigChore(){const state=getBigState();if(state.index>=BIG_CHORES.length||state.snoozeUntil<=todayKey())return null;return {id:'big-chore-current',type:'task',date:state.snoozeUntil,title:BIG_CHORES[state.index],time:'',note:'Periodieke grote klus · doorgeschoven',done:false,repeat:'none',createdAt:1786900000200,_bigUpcoming:true}}
function getRoutineState(){
  let state;try{state=JSON.parse(localStorage.getItem(ROUTINE_KEY))}catch{state=null}
  if(!state||state.date!==todayKey())state={date:todayKey(),done:{}};
  localStorage.setItem(ROUTINE_KEY,JSON.stringify(state));return state;
}
function renderRoutines(){const state=getRoutineState();els.routines.innerHTML=ROUTINES.map((title,index)=>`<article class="planner-item${state.done[index]?' done':''}"><input class="check" type="checkbox" data-routine="${index}" aria-label="Routine afronden" ${state.done[index]?'checked':''}><div class="item-copy"><strong>${escapeHtml(title)}</strong></div></article>`).join('');document.querySelectorAll('[data-routine]').forEach(input=>input.addEventListener('change',()=>{const current=getRoutineState();current.done[input.dataset.routine]=input.checked;localStorage.setItem(ROUTINE_KEY,JSON.stringify(current));renderRoutines()}))}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function periodKey(repeat,date=new Date()){
  if(repeat==='monthly')return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  if(repeat==='seasonal')return `${date.getFullYear()}-S${Math.floor(date.getMonth()/3)+1}`;
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const week1=new Date(d.getFullYear(),0,4);return `${d.getFullYear()}-W${String(1+Math.round(((d-week1)/86400000-3+(week1.getDay()+6)%7)/7)).padStart(2,'0')}`;
}
function isTaskDone(item){return item.repeat&&item.repeat!=='none'?(item.completedPeriods||[]).includes(periodKey(item.repeat)):Boolean(item.done)}
function todayEntries(type){return entries.filter(item=>{if(item.type!==type)return false;if(type==='appointment')return item.date===todayKey();if(item.date>todayKey())return false;if(item.repeat&&item.repeat!=='none')return true;return item.date===todayKey()||!isTaskDone(item)})}
function deadlineInfo(item){
  if(!item.deadline)return '';
  const today=new Date(`${todayKey()}T12:00:00`);const deadline=new Date(`${item.deadline}T12:00:00`);const days=Math.round((deadline-today)/86400000);
  if(days<0)return `<span class="deadline-badge late">${Math.abs(days)} ${Math.abs(days)===1?'dag':'dagen'} te laat</span>`;
  if(days===0)return '<span class="deadline-badge today">Vandaag deadline</span>';
  if(days===1)return '<span class="deadline-badge soon">Morgen deadline</span>';
  return `<span class="deadline-badge">Nog ${days} dagen</span>`;
}

function render(){
  const appointments=todayEntries('appointment').sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const tasks=todayEntries('task').sort((a,b)=>Number(isTaskDone(a))-Number(isTaskDone(b))||Number(Boolean(b.urgent))-Number(Boolean(a.urgent))||(a.deadline||'9999-12-31').localeCompare(b.deadline||'9999-12-31')||a.createdAt-b.createdAt);const big=currentBigChore();if(big)tasks.push(big);
  const upcoming=entries.filter(item=>item.date>todayKey());const bigUpcoming=upcomingBigChore();if(bigUpcoming)upcoming.push(bigUpcoming);upcoming.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'));upcoming.splice(8);
  els.appointments.innerHTML=appointments.length?appointments.map(renderAppointment).join(''):'<div class="empty">Geen afspraken voor vandaag</div>';
  els.tasks.innerHTML=tasks.length?tasks.map(renderTask).join(''):'<div class="empty">Nog geen taken voor vandaag</div>';
  els.upcoming.innerHTML=upcoming.length?upcoming.map(renderUpcoming).join(''):'<div class="empty">Geen geplande items</div>';
  const done=tasks.filter(isTaskDone).length;els.progress.textContent=tasks.length?`${done} van ${tasks.length} afgerond`:'';
  bindItemActions();
}
function privacyBadge(item){return item.visibility==='private'?'<span class="private-badge">Privé</span>':''}
function renderAppointment(item){return `<article class="planner-item"><span class="time-badge">${escapeHtml(item.time||'—')}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${privacyBadge(item)}</div>${actionButtons(item.id)}</article>`}
function repeatLabel(value){return ({weekly:'Deze week',monthly:'Deze maand',seasonal:'Dit seizoen'})[value]||''}
function renderTask(item){const done=isTaskDone(item);return `<article class="planner-item${done?' done':''}"><input class="check" type="checkbox" data-check="${item.id}" aria-label="Taak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${item.urgent?'<span class="urgent-badge">Urgent</span>':''}${privacyBadge(item)}${deadlineInfo(item)}${item.repeat&&item.repeat!=='none'?`<span class="repeat-badge">${repeatLabel(item.repeat)}</span>`:''}</div>${item._big?bigActionButtons():actionButtons(item.id,true)}</article>`}
function renderUpcoming(item){const date=new Date(`${item.date}T12:00:00`);const label=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(date);return `<article class="planner-item"><span class="upcoming-date">${escapeHtml(label)}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.time?`${item.time} uur${item.note?' · '+item.note:''}`:item.note||'')}</small>${privacyBadge(item)}${item.type==='task'?deadlineInfo(item):''}</div>${item._bigUpcoming?'':actionButtons(item.id)}</article>`}
function actionButtons(id,snooze=false){return `<div class="item-actions">${snooze?`<button class="icon-button snooze-button" type="button" data-snooze="${id}" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button>`:''}<button class="icon-button" type="button" data-edit="${id}" aria-label="Wijzigen">✎</button><button class="icon-button delete" type="button" data-delete="${id}" aria-label="Verwijderen">×</button></div>`}
function bigActionButtons(){return `<div class="item-actions"><button class="icon-button snooze-button" type="button" data-big-snooze="1" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button></div>`}
function bindItemActions(){
  document.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{if(input.dataset.check==='big-chore-current'){const state=getBigState();state.index+=1;state.snoozeUntil='';saveBigState(state);render();return}const item=entries.find(entry=>entry.id===input.dataset.check);if(!item)return;if(item.repeat&&item.repeat!=='none'){item.completedPeriods=item.completedPeriods||[];const key=periodKey(item.repeat);if(input.checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!input.checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}else item.done=input.checked;persist();render()}));
  document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>editEntry(button.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Dit item verwijderen?'))return;entries=entries.filter(item=>item.id!==button.dataset.delete);persist();render()}));
  document.querySelectorAll('[data-snooze]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.snooze);if(!item)return;const tomorrow=tomorrowKey();if(item.deadline&&tomorrow>item.deadline){alert('Deze taak kan niet voorbij de deadline worden doorgeschoven.');return}if(item.urgent&&!confirm('Deze taak is urgent. Toch doorschuiven naar morgen?'))return;item.date=tomorrow;persist();render()}));
  document.querySelectorAll('[data-big-snooze]').forEach(button=>button.addEventListener('click',()=>{const state=getBigState();state.snoozeUntil=tomorrowKey();saveBigState(state);render()}));
}
function setType(type){els.type.value=type;document.querySelectorAll('[data-type]').forEach(button=>button.classList.toggle('active',button.dataset.type===type));const task=type==='task';els.timeField.hidden=task;els.hasDeadlineField.hidden=!task;els.deadlineField.hidden=!task||!els.hasDeadline.checked;els.urgentField.hidden=!task;els.repeatField.hidden=!task;els.modalTitle.textContent=`${task?'Taak':'Afspraak'} ${els.id.value?'wijzigen':'toevoegen'}`;els.titleLabel.textContent=task?'Wat moet er gebeuren? *':'Welke afspraak? *'}
function openModal(type,item=null){els.form.reset();els.id.value=item?.id||'';els.title.value=item?.title||'';els.time.value=item?.time||'';els.entryDate.value=item?.date||todayKey();els.hasDeadline.checked=Boolean(item?.deadline);els.deadline.value=item?.deadline||'';els.urgent.checked=Boolean(item?.urgent);els.private.checked=item?.visibility==='private';els.repeat.value=item?.repeat||'none';els.note.value=item?.note||'';setType(type);els.modal.classList.add('open');els.modal.setAttribute('aria-hidden','false');setTimeout(()=>els.title.focus(),0)}
function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true')}
function editEntry(id){const item=entries.find(entry=>entry.id===id);if(item)openModal(item.type,item)}
function saveEntry(event){event.preventDefault();const title=els.title.value.trim();if(!title)return;const deadline=els.type.value==='task'&&els.hasDeadline.checked?els.deadline.value:'';if(els.type.value==='task'&&els.hasDeadline.checked&&!deadline){alert('Kies een deadline.');return}if(deadline&&deadline<els.entryDate.value){alert('De deadline kan niet vóór de startdatum liggen.');return}const existing=entries.find(item=>item.id===els.id.value);const visibility=window.huizeChaosPlannerRole==='owner'&&els.private.checked?'private':'shared';const value={id:existing?.id||uid(),cloudId:existing?.cloudId||'',cloudScope:existing?.cloudScope||'',type:els.type.value,date:els.entryDate.value,deadline,urgent:els.type.value==='task'&&els.urgent.checked,visibility,title,time:els.type.value==='appointment'?els.time.value:'',note:els.note.value.trim(),done:existing?.done||false,repeat:els.type.value==='task'?els.repeat.value:'none',completedPeriods:existing?.completedPeriods||[],createdAt:existing?.createdAt||Date.now()};if(existing)entries=entries.map(item=>item.id===existing.id?value:item);else entries.push(value);persist();closeModal();render()}

window.getHuizeChaosPlannerEntries=()=>entries;
window.replaceHuizeChaosPlannerEntries=next=>{entries=next;localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));render()};
window.applyHuizeChaosPlannerRole=role=>{window.huizeChaosPlannerRole=role;els.privateField.hidden=role!=='owner';if(role!=='owner')els.private.checked=false};
window.applyHuizeChaosBigState=state=>{localStorage.setItem(BIG_STATE_KEY,JSON.stringify(state));render()};
