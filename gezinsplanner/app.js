const STORAGE_KEY='huizeChaosPlannerV130';
const SEED_KEY='huizeChaosCarTasksV131';
const localDateKey=(date=new Date())=>{const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
const todayKey=()=>localDateKey();
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
let entries=loadEntries();

const els={date:document.getElementById('todayDate'),appointments:document.getElementById('appointmentList'),tasks:document.getElementById('taskList'),progress:document.getElementById('taskProgress'),upcoming:document.getElementById('upcomingList'),modal:document.getElementById('entryModal'),form:document.getElementById('entryForm'),id:document.getElementById('entryId'),type:document.getElementById('entryType'),title:document.getElementById('entryTitle'),time:document.getElementById('entryTime'),entryDate:document.getElementById('entryDate'),repeat:document.getElementById('entryRepeat'),note:document.getElementById('entryNote'),timeField:document.getElementById('timeField'),repeatField:document.getElementById('repeatField'),modalTitle:document.getElementById('modalTitle'),titleLabel:document.getElementById('titleLabel')};

seedCarPlanning();
els.date.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
render();

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.add)));
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>setType(button.dataset.type)));
document.getElementById('cancelEntry').addEventListener('click',closeModal);
els.modal.addEventListener('click',event=>{if(event.target===els.modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
els.form.addEventListener('submit',saveEntry);

function loadEntries(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries))}
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
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function periodKey(repeat,date=new Date()){
  if(repeat==='monthly')return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  if(repeat==='seasonal')return `${date.getFullYear()}-S${Math.floor(date.getMonth()/3)+1}`;
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const week1=new Date(d.getFullYear(),0,4);return `${d.getFullYear()}-W${String(1+Math.round(((d-week1)/86400000-3+(week1.getDay()+6)%7)/7)).padStart(2,'0')}`;
}
function isTaskDone(item){return item.repeat&&item.repeat!=='none'?(item.completedPeriods||[]).includes(periodKey(item.repeat)):Boolean(item.done)}
function todayEntries(type){return entries.filter(item=>item.type===type&&(item.date===todayKey()||(type==='task'&&item.repeat&&item.repeat!=='none')))}

function render(){
  const appointments=todayEntries('appointment').sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const tasks=todayEntries('task').sort((a,b)=>Number(isTaskDone(a))-Number(isTaskDone(b))||a.createdAt-b.createdAt);
  const upcoming=entries.filter(item=>item.date>todayKey()).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')).slice(0,8);
  els.appointments.innerHTML=appointments.length?appointments.map(renderAppointment).join(''):'<div class="empty">Geen afspraken voor vandaag</div>';
  els.tasks.innerHTML=tasks.length?tasks.map(renderTask).join(''):'<div class="empty">Nog geen taken voor vandaag</div>';
  els.upcoming.innerHTML=upcoming.length?upcoming.map(renderUpcoming).join(''):'<div class="empty">Geen geplande items</div>';
  const done=tasks.filter(isTaskDone).length;els.progress.textContent=tasks.length?`${done} van ${tasks.length} afgerond`:'';
  bindItemActions();
}
function renderAppointment(item){return `<article class="planner-item"><span class="time-badge">${escapeHtml(item.time||'—')}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}</div>${actionButtons(item.id)}</article>`}
function repeatLabel(value){return ({weekly:'Deze week',monthly:'Deze maand',seasonal:'Dit seizoen'})[value]||''}
function renderTask(item){const done=isTaskDone(item);return `<article class="planner-item${done?' done':''}"><input class="check" type="checkbox" data-check="${item.id}" aria-label="Taak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${item.repeat&&item.repeat!=='none'?`<span class="repeat-badge">${repeatLabel(item.repeat)}</span>`:''}</div>${actionButtons(item.id)}</article>`}
function renderUpcoming(item){const date=new Date(`${item.date}T12:00:00`);const label=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(date);return `<article class="planner-item"><span class="upcoming-date">${escapeHtml(label)}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.time?`${item.time} uur${item.note?' · '+item.note:''}`:item.note||'')}</small></div>${actionButtons(item.id)}</article>`}
function actionButtons(id){return `<div class="item-actions"><button class="icon-button" type="button" data-edit="${id}" aria-label="Wijzigen">✎</button><button class="icon-button delete" type="button" data-delete="${id}" aria-label="Verwijderen">×</button></div>`}
function bindItemActions(){
  document.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.check);if(!item)return;if(item.repeat&&item.repeat!=='none'){item.completedPeriods=item.completedPeriods||[];const key=periodKey(item.repeat);if(input.checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!input.checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}else item.done=input.checked;persist();render()}));
  document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>editEntry(button.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Dit item verwijderen?'))return;entries=entries.filter(item=>item.id!==button.dataset.delete);persist();render()}));
}
function setType(type){els.type.value=type;document.querySelectorAll('[data-type]').forEach(button=>button.classList.toggle('active',button.dataset.type===type));els.timeField.hidden=type!=='appointment';els.repeatField.hidden=type!=='task';els.modalTitle.textContent=`${type==='task'?'Taak':'Afspraak'} ${els.id.value?'wijzigen':'toevoegen'}`;els.titleLabel.textContent=type==='task'?'Wat moet er gebeuren? *':'Welke afspraak? *'}
function openModal(type,item=null){els.form.reset();els.id.value=item?.id||'';els.title.value=item?.title||'';els.time.value=item?.time||'';els.entryDate.value=item?.date||todayKey();els.repeat.value=item?.repeat||'none';els.note.value=item?.note||'';setType(type);els.modal.classList.add('open');els.modal.setAttribute('aria-hidden','false');setTimeout(()=>els.title.focus(),0)}
function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true')}
function editEntry(id){const item=entries.find(entry=>entry.id===id);if(item)openModal(item.type,item)}
function saveEntry(event){event.preventDefault();const title=els.title.value.trim();if(!title)return;const existing=entries.find(item=>item.id===els.id.value);const value={id:existing?.id||uid(),type:els.type.value,date:els.entryDate.value,title,time:els.type.value==='appointment'?els.time.value:'',note:els.note.value.trim(),done:existing?.done||false,repeat:els.type.value==='task'?els.repeat.value:'none',completedPeriods:existing?.completedPeriods||[],createdAt:existing?.createdAt||Date.now()};if(existing)entries=entries.map(item=>item.id===existing.id?value:item);else entries.push(value);persist();closeModal();render()}
