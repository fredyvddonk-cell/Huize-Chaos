const STORAGE_KEY='huizeChaosPlannerV130';
const todayKey=()=>{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
let entries=loadEntries();

const els={
  date:document.getElementById('todayDate'),appointments:document.getElementById('appointmentList'),tasks:document.getElementById('taskList'),progress:document.getElementById('taskProgress'),modal:document.getElementById('entryModal'),form:document.getElementById('entryForm'),id:document.getElementById('entryId'),type:document.getElementById('entryType'),title:document.getElementById('entryTitle'),time:document.getElementById('entryTime'),note:document.getElementById('entryNote'),timeField:document.getElementById('timeField'),modalTitle:document.getElementById('modalTitle'),titleLabel:document.getElementById('titleLabel')
};

els.date.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
render();

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.add)));
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>setType(button.dataset.type)));
document.getElementById('cancelEntry').addEventListener('click',closeModal);
els.modal.addEventListener('click',event=>{if(event.target===els.modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
els.form.addEventListener('submit',saveEntry);

function loadEntries(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []}
}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries))}
function escapeHtml(value=''){return value.replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function todayEntries(type){return entries.filter(item=>item.date===todayKey()&&item.type===type)}

function render(){
  const appointments=todayEntries('appointment').sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const tasks=todayEntries('task').sort((a,b)=>Number(a.done)-Number(b.done)||a.createdAt-b.createdAt);
  els.appointments.innerHTML=appointments.length?appointments.map(renderAppointment).join(''):'<div class="empty">Geen afspraken voor vandaag</div>';
  els.tasks.innerHTML=tasks.length?tasks.map(renderTask).join(''):'<div class="empty">Nog geen taken voor vandaag</div>';
  const done=tasks.filter(item=>item.done).length;
  els.progress.textContent=tasks.length?`${done} van ${tasks.length} afgerond`:'';
  bindItemActions();
}

function renderAppointment(item){
  return `<article class="planner-item"><span class="time-badge">${escapeHtml(item.time||'—')}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}</div>${actionButtons(item.id)}</article>`;
}
function renderTask(item){
  return `<article class="planner-item${item.done?' done':''}"><input class="check" type="checkbox" data-check="${item.id}" aria-label="Taak afronden" ${item.done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}</div>${actionButtons(item.id)}</article>`;
}
function actionButtons(id){return `<div class="item-actions"><button class="icon-button" type="button" data-edit="${id}" aria-label="Wijzigen">✎</button><button class="icon-button delete" type="button" data-delete="${id}" aria-label="Verwijderen">×</button></div>`}

function bindItemActions(){
  document.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.check);if(item){item.done=input.checked;persist();render()}}));
  document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>editEntry(button.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Dit item verwijderen?'))return;entries=entries.filter(item=>item.id!==button.dataset.delete);persist();render()}));
}

function setType(type){
  els.type.value=type;
  document.querySelectorAll('[data-type]').forEach(button=>button.classList.toggle('active',button.dataset.type===type));
  els.timeField.hidden=type!=='appointment';
  els.modalTitle.textContent=`${type==='task'?'Taak':'Afspraak'} ${els.id.value?'wijzigen':'toevoegen'}`;
  els.titleLabel.textContent=type==='task'?'Wat moet er gebeuren? *':'Welke afspraak? *';
}
function openModal(type,item=null){
  els.form.reset();els.id.value=item?.id||'';els.title.value=item?.title||'';els.time.value=item?.time||'';els.note.value=item?.note||'';setType(type);els.modal.classList.add('open');els.modal.setAttribute('aria-hidden','false');setTimeout(()=>els.title.focus(),0);
}
function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true')}
function editEntry(id){const item=entries.find(entry=>entry.id===id);if(item)openModal(item.type,item)}
function saveEntry(event){
  event.preventDefault();
  const title=els.title.value.trim();if(!title)return;
  const existing=entries.find(item=>item.id===els.id.value);
  const value={id:existing?.id||uid(),type:els.type.value,date:todayKey(),title,time:els.type.value==='appointment'?els.time.value:'',note:els.note.value.trim(),done:existing?.done||false,createdAt:existing?.createdAt||Date.now()};
  if(existing)entries=entries.map(item=>item.id===existing.id?value:item);else entries.push(value);
  persist();closeModal();render();
}
