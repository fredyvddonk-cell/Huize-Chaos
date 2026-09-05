const STORAGE_KEY='huizeChaosPlannerV130';
const SEED_KEY='huizeChaosCarTasksV131';
const HOUSE_SEED_KEY='huizeChaosHouseTasksV138';
const ROUTINE_KEY='huizeChaosDailyRoutinesV132';
const BIG_STATE_KEY='huizeChaosBigChoreV132';
const HOUSEHOLD_TIME_KEY='huizeChaosHouseholdTimeV120';
const STUDY_TIME_KEY='huizeChaosStudyTimeV121';
const STUDY_PERIOD_KEY='huizeChaosStudyPeriodV121';
const DEADLINE_SEED_KEY='huizeChaosOldCarDeadlineV133';
const HOUSEHOLD_SCHEDULE_WEEK_KEY='huizeChaosHouseholdScheduleWeekV160';
const ROUTINES=['Keuken opruimen en aanrecht afnemen','Vaatwasser in- of uitruimen','Woonkamer opruimen','Was bijwerken','Kattenbak controleren en zo nodig verschonen','Toilet kort reinigen: doekje en borstel'];
const BIG_CHORES=[];
const WASTE_SCHEDULES=[
  {type:'Papier',firstFriday:'2026-08-21',regular:'Deze week al het oud papier bij het oud papier leggen',lastDay:'Vandaag laatste dag: al het oud papier bij het oud papier leggen'},
  {type:'Restafval',firstFriday:'2026-09-11',regular:'Deze week al het restafval in de restafvalkliko doen',lastDay:'Vandaag laatste dag: al het restafval in de restafvalkliko doen'}
];
const HOUSEHOLD_GROUPS={weekly:'Iedere week',biweekly:'Iedere twee weken',monthly:'Iedere maand',bimonthly:'Iedere twee maanden',quarterly:'Ieder kwartaal',semiannual:'Twee keer per jaar',yearly:'Ieder jaar',once:'Eenmalig'};
const LONG_HOUSEHOLD_REPEATS=new Set(['biweekly','monthly','bimonthly','quarterly','semiannual','yearly']);
const TASK_LIST_HOUSEHOLD_REPEATS=new Set(['semiannual','yearly']);
const WEEK_SCHEDULE_HOUSEHOLD_REPEATS=new Set(['monthly','bimonthly','quarterly']);
const HOUSEHOLD_WEEK_LIMIT=8;
const HOUSEHOLD_TASKS=[
  ['floor-downstairs','Benedenverdieping stofzuigen en aansluitend dweilen','weekly','Vloeren'],
  ['dust-downstairs','Bereikbare oppervlakken beneden afstoffen','weekly','Benedenverdieping'],
  ['windowsill','Vensterbank afnemen','weekly','Benedenverdieping'],
  ['cat-hair-seats','Kattenharen van banken en stoelen verwijderen waar nodig','weekly','Benedenverdieping'],
  ['kitchen-deep','Aanrecht en achterwand grondig reinigen','weekly','Keuken'],
  ['sink','Spoelbak en kraan reinigen','weekly','Keuken'],
  ['hob','Kookplaat grondig reinigen','weekly','Keuken'],
  ['kitchen-fronts-spots','Zichtbare vlekken van keukenfronten verwijderen','weekly','Keuken'],
  ['bin-check','Pedaalemmer controleren en zo nodig reinigen','weekly','Keuken'],
  ['fridge-food','Koelkast controleren op bedorven producten en restjes','weekly','Keuken'],
  ['microwave-check','Magnetron vanbinnen controleren en zo nodig reinigen','weekly','Keuken'],
  ['bath-sink','Wastafel en kraan reinigen','weekly','Badkamer'],
  ['shower','Douche reinigen','weekly','Badkamer'],
  ['bath-toilet','Toilet in de badkamer reinigen','weekly','Badkamer'],
  ['mirror','Spiegel afnemen','weekly','Badkamer'],
  ['bath-bin','Afvalbak in de badkamer legen','weekly','Badkamer'],
  ['toilet-clean','Overige toilet reinigen','weekly','Toilet'],
  ['plants','Planten controleren en zo nodig water geven','weekly','Overig'],
  ['cat-litter','Kattenbak bijvullen en omgeving reinigen','weekly','Katten'],
  ['waste','Papier, glas en ander afval wegbrengen wanneer nodig','weekly','Overig'],
  ['appliance-alerts','Controleren of de apparatenapps onderhoud aangeven','weekly','Apparaten'],
  ['coffee-alert','Controleren of het koffiezetapparaat een ontkalkingsmelding geeft','weekly','Apparaten'],
  ['floor-upstairs','Bovenverdieping stofzuigen en aansluitend dweilen','biweekly','Vloeren'],
  ['dust-upstairs','Bereikbare oppervlakken boven afstoffen','biweekly','Bovenverdieping'],
  ['bedside','Nachtkastjes en vensterbanken afnemen','biweekly','Bovenverdieping'],
  ['upstairs-handles','Deuren en handgrepen boven plaatselijk afnemen','biweekly','Bovenverdieping'],
  ['bedding','Beddengoed verschonen','biweekly','Slaapkamers'],
  ['under-beds','Onder bereikbare delen van de bedden stofzuigen','biweekly','Slaapkamers'],
  ['cat-hair-upstairs','Kattenharen boven verwijderen waar nodig','biweekly','Slaapkamers'],
  ['floor-whole-house','Hele huis inclusief zolder grondig stofzuigen en aansluitend dweilen','monthly','Vloeren'],
  ['dust-high-low','Hele huis hoog en laag afstoffen','monthly','Hele huis'],
  ['baseboards','Plinten afnemen','monthly','Hele huis'],
  ['doors-spots','Deuren, deurposten en handgrepen afnemen','monthly','Hele huis'],
  ['radiators-dust','Radiatoren en roosters stofvrij maken','monthly','Hele huis'],
  ['living-touches','Afstandsbedieningen en veel aangeraakte oppervlakken reinigen','monthly','Woonkamer'],
  ['kitchen-fronts','Keukenfronten volledig afnemen','monthly','Keuken'],
  ['fridge-outside','Koelkast aan de buitenkant en bij de handgrepen reinigen','monthly','Keuken'],
  ['fridge-shelves','Koelkastplanken plaatselijk reinigen','monthly','Keuken'],
  ['oven-microwave','Magnetron of oven vanbinnen reinigen','monthly','Keuken'],
  ['bin-deep','Pedaalemmer volledig reinigen','monthly','Keuken'],
  ['small-appliances','Kleine apparaten aan de buitenkant afnemen','monthly','Keuken'],
  ['hood-outside','Afzuigkap aan de buitenkant reinigen','monthly','Keuken'],
  ['bath-tiles','Tegelwerk en voegen in badkamer en toilet grondig reinigen','monthly','Badkamer en toilet'],
  ['limescale','Kalkaanslag verwijderen','monthly','Badkamer en toilet'],
  ['shower-screen','Douchewand reinigen','monthly','Badkamer'],
  ['drain','Afvoerputje controleren en reinigen','monthly','Badkamer'],
  ['toilet-brush','Toiletborstel en houder reinigen','monthly','Toilet'],
  ['bath-bins-deep','Afvalbakken badkamer en toilet volledig reinigen','monthly','Badkamer en toilet'],
  ['vent-dust','Ventilatierooster stofvrij maken','monthly','Badkamer'],
  ['inside-windows-check','Binnenzijde ramen beoordelen en zo nodig wassen','monthly','Ramen'],
  ['pantry-check','Koelkast, vriezer en keukenkasten controleren op producten die op moeten','monthly','Keukenvoorraad'],
  ['doors-deep','Deuren en sponningen in het hele huis afnemen','bimonthly','Hele huis'],
  ['radiators-deep','Radiatoren en ventilatieroosters reinigen','bimonthly','Hele huis'],
  ['baseboards-deep','Plinten grondig afnemen','bimonthly','Hele huis'],
  ['hood-filter-check','Afzuigkapfilters controleren en zo nodig reinigen','bimonthly','Keuken'],
  ['inside-windows','Ramen aan de binnenkant wassen als dit nodig is','bimonthly','Ramen'],
  ['bins-deep','Veelgebruikte afvalbakken volledig reinigen','bimonthly','Hele huis'],
  ['cobwebs','Plafonds en hoeken controleren op spinrag','quarterly','Hele huis'],
  ['lights','Lampen en plafondarmaturen afstoffen','quarterly','Hele huis'],
  ['behind-furniture','Achter en onder bereikbare grotere meubels stofzuigen','quarterly','Hele huis'],
  ['fridge-deep','Koelkast volledig uitnemen en reinigen','quarterly','Keuken'],
  ['freezer-stock','Vriezer controleren en inventariseren','quarterly','Keuken'],
  ['mattress-turn','Matrassen keren of draaien als het type dit toestaat','quarterly','Slaapkamers'],
  ['vents-deep','Ventilatieopeningen grondig reinigen','quarterly','Hele huis'],
  ['showerhead','Douchekop ontkalken','quarterly','Badkamer'],
  ['sealant','Kit- en voegranden controleren','quarterly','Badkamer'],
  ['attic-tidy','Zolder nalopen en opruimen','quarterly','Zolder'],
  ['front-garden','Voortuin vegen en opruimen','quarterly','Buiten'],
  ['back-garden','Achtertuin vegen en opruimen','quarterly','Buiten'],
  ['curtains','Gordijnen wassen volgens het wasvoorschrift','semiannual','Raambekleding'],
  ['net-curtains','Vitrage wassen volgens het wasvoorschrift','semiannual','Raambekleding'],
  ['roller-blinds','Rolgordijnen in de slaapkamers afstoffen en plaatselijk reinigen','semiannual','Raambekleding'],
  ['bath-blinds','Lamellen in de badkamer grondig afnemen','semiannual','Raambekleding'],
  ['attic-blinds','Luxaflex in beide ruimtes op zolder grondig afnemen','semiannual','Raambekleding'],
  ['outside-windows','Ramen aan de buitenkant wassen','semiannual','Ramen'],
  ['high-cupboards','Bovenkanten van hoge kasten reinigen','semiannual','Hele huis'],
  ['duvets-pillows','Dekbedden en kussens wassen volgens het wasvoorschrift','semiannual','Slaapkamers'],
  ['mattresses-vacuum','Matrassen grondig stofzuigen','semiannual','Slaapkamers'],
  ['freezer-defrost','Vriezer ontdooien en reinigen wanneer nodig','semiannual','Keuken'],
  ['oven-deep','Oven grondig reinigen','semiannual','Keuken'],
  ['hood-deep','Afzuigkap en filters grondig reinigen','semiannual','Keuken'],
  ['bath-descale','Badkamer en toilet volledig ontkalken','semiannual','Badkamer en toilet'],
  ['chairs-dining','Eetkamerstoelen stofzuigen, inclusief naden en randen','semiannual','Zitmeubels'],
  ['chairs-desk','Bureaustoelen stofzuigen, inclusief naden en randen','semiannual','Zitmeubels'],
  ['leather-sofas','Leren banken onderhouden volgens het juiste onderhoudsadvies','semiannual','Zitmeubels'],
  ['evaluate-list','Huishoudtaken en frequenties evalueren','yearly','Overig'],
  ['unused-items','Ongebruikte spullen per ruimte nalopen','yearly','Opruimen'],
  ['attic-review','Zolder volledig nalopen','yearly','Zolder'],
  ['hard-to-reach','Moeilijk bereikbare plekken achter grote meubels schoonmaken','yearly','Hele huis'],
  ['ventilation-service','Ventilatiesysteem onderhouden volgens het onderhoudsadvies','yearly','Onderhoud'],
  ['heating-service','Cv-ketel of andere installatie laten onderhouden volgens het advies','yearly','Onderhoud'],
  ['fire-safety','Brandveiligheid en vluchtroute controleren','yearly','Veiligheid'],
  ['smoke-choose','Geschikte rookmelders bepalen','none','Eenmalig'],
  ['smoke-buy','Nieuwe rookmelders kopen','none','Eenmalig'],
  ['smoke-install','Rookmelders plaatsen en werking controleren','none','Eenmalig'],
  ['leather-advice','Type leer en onderhoudsadvies van de banken achterhalen','none','Eenmalig'],
  ['leather-product','Geschikt onderhoudsmiddel voor de banken kopen','none','Eenmalig']
];
const HOUSEHOLD_BLOCKS=[
  {id:'weekly-kitchen',title:'Keuken schoonmaken',repeat:'weekly',taskIds:['house-kitchen-deep','house-sink','house-hob','house-kitchen-fronts-spots','house-bin-check','house-fridge-food','house-microwave-check']},
  {id:'weekly-bathroom',title:'Badkamer en toiletten schoonmaken',repeat:'weekly',taskIds:['house-bath-sink','house-shower','house-bath-toilet','house-mirror','house-bath-bin','house-toilet-clean']},
  {id:'weekly-other',title:'Overige wekelijkse taken',repeat:'weekly',taskIds:['house-dust-downstairs','house-windowsill','house-cat-hair-seats','house-plants','house-cat-litter','house-waste','house-appliance-alerts','house-coffee-alert']},
  {id:'biweekly-upstairs',title:'Bovenverdieping bijwerken',repeat:'biweekly',taskIds:['house-floor-upstairs','house-dust-upstairs','house-bedside','house-upstairs-handles','house-bedding','house-under-beds','house-cat-hair-upstairs']}
];
const HOUSEHOLD_OPEN_BLOCKS=new Set();
const localDateKey=(date=new Date())=>{const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
const todayKey=()=>localDateKey();
const currentWeekEndKey=()=>{const date=new Date();date.setDate(date.getDate()+(7-(date.getDay()||7)));return localDateKey(date)};
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
let entries=loadEntries();
const rosterDrafts=new Map();
let activeRosterWeek='';
let fourWeekMonday=null;
let pendingDeleteId='';
let studyTimerInterval=null;
let householdTimerInterval=null;
let plannerHistoryReady=false;

const els={date:document.getElementById('todayDate'),wastePanel:document.getElementById('wasteReminderPanel'),wasteTitle:document.getElementById('wasteReminderTitle'),wasteText:document.getElementById('wasteReminderText'),appointments:document.getElementById('appointmentList'),appointmentSearch:document.getElementById('appointmentSearch'),appointmentSearchStatus:document.getElementById('appointmentSearchStatus'),clearAppointmentSearch:document.getElementById('clearAppointmentSearch'),tasks:document.getElementById('taskList'),progress:document.getElementById('taskProgress'),upcoming:document.getElementById('upcomingList'),routines:document.getElementById('routineList'),householdDue:document.getElementById('householdDueList'),householdLibrary:document.getElementById('householdLibrary'),todayPage:document.getElementById('todayPage'),routinesPage:document.getElementById('routinesPage'),householdPage:document.getElementById('householdPage'),modal:document.getElementById('entryModal'),form:document.getElementById('entryForm'),id:document.getElementById('entryId'),type:document.getElementById('entryType'),category:document.getElementById('entryCategory'),title:document.getElementById('entryTitle'),time:document.getElementById('entryTime'),endTime:document.getElementById('entryEndTime'),entryDate:document.getElementById('entryDate'),participants:document.getElementById('entryParticipants'),schoolTask:document.getElementById('entrySchoolTask'),hasDeadline:document.getElementById('entryHasDeadline'),deadline:document.getElementById('entryDeadline'),urgent:document.getElementById('entryUrgent'),private:document.getElementById('entryPrivate'),school:document.getElementById('entrySchool'),repeat:document.getElementById('entryRepeat'),note:document.getElementById('entryNote'),timeField:document.getElementById('timeField'),endTimeField:document.getElementById('endTimeField'),workQuickField:document.getElementById('workQuickField'),participantsField:document.getElementById('participantsField'),schoolTaskField:document.getElementById('schoolTaskField'),hasDeadlineField:document.getElementById('hasDeadlineField'),deadlineField:document.getElementById('deadlineField'),urgentField:document.getElementById('urgentField'),privateField:document.getElementById('privateField'),schoolField:document.getElementById('schoolField'),repeatField:document.getElementById('repeatField'),modalTitle:document.getElementById('modalTitle'),titleLabel:document.getElementById('titleLabel'),rosterModal:document.getElementById('rosterModal'),rosterForm:document.getElementById('rosterForm'),rosterYear:document.getElementById('rosterYear'),rosterPeriod:document.getElementById('rosterPeriod'),rosterPeriodRange:document.getElementById('rosterPeriodRange'),rosterWeekTabs:document.getElementById('rosterWeekTabs'),rosterDays:document.getElementById('rosterDays')};

const checklistEls={
  section:document.getElementById('recurringChecklistSection'),
  today:document.getElementById('recurringChecklistToday'),
  library:document.getElementById('recurringChecklistLibrary'),
  modal:document.getElementById('checklistModal'),
  form:document.getElementById('checklistForm'),
  id:document.getElementById('checklistId'),
  title:document.getElementById('checklistTitle'),
  startDate:document.getElementById('checklistStartDate'),
  repeat:document.getElementById('checklistRepeat'),
  showBefore:document.getElementById('checklistShowBefore'),
  showMoment:document.getElementById('checklistShowMoment'),
  tasks:document.getElementById('checklistTasks'),
  modalTitle:document.getElementById('checklistModalTitle')
};

seedCarPlanning();
seedHouseholdPlanning();
seedOldCarDeadline();
initializeHouseholdWeekSchedule();
balanceHouseholdWeekSchedule();
els.date.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
renderWasteReminder();
render();
initializePlannerHistory();

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.add)));
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>setType(button.dataset.type)));
document.getElementById('cancelEntry').addEventListener('click',closeModal);
els.modal.addEventListener('click',event=>{if(event.target===els.modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeModal();closeChecklistModal();closeDeleteModal()}});
els.form.addEventListener('submit',saveEntry);
els.hasDeadline.addEventListener('change',()=>{els.deadlineField.hidden=!els.hasDeadline.checked;if(!els.hasDeadline.checked)els.deadline.value='' });
els.school.addEventListener('change',()=>{if(els.school.checked){els.private.checked=true;els.category.value='';document.querySelectorAll('[data-shift]').forEach(item=>item.classList.remove('active'))}els.private.disabled=els.school.checked});
document.querySelectorAll('[data-shift]').forEach(button=>button.addEventListener('click',()=>{els.category.value='work';els.school.checked=false;els.private.disabled=false;els.title.value=button.dataset.shift;els.time.value=button.dataset.start;els.endTime.value=button.dataset.end;document.querySelectorAll('[data-shift]').forEach(item=>item.classList.toggle('active',item===button))}));
document.querySelectorAll('[data-planner-page]').forEach(button=>button.addEventListener('click',()=>showPlannerPage(button.dataset.plannerPage)));
document.addEventListener('click',event=>{const activeMenu=event.target.closest('.item-menu');document.querySelectorAll('.item-menu[open]').forEach(menu=>{if(menu!==activeMenu||event.target.closest('.item-menu-popover button'))menu.removeAttribute('open')})});
document.getElementById('openHouseholdFromTasks').addEventListener('click',()=>showPlannerPage('household'));
document.getElementById('openHouseholdFromTime')?.addEventListener('click',()=>showPlannerPage('household'));
els.wastePanel.addEventListener('click',shareWasteReminder);
els.wastePanel.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();shareWasteReminder()}});
document.getElementById('openChecklistModal')?.addEventListener('click',()=>openChecklistModal());
document.getElementById('cancelChecklist')?.addEventListener('click',()=>closeChecklistModal());
checklistEls.modal?.addEventListener('click',event=>{if(event.target===checklistEls.modal)closeChecklistModal()});
checklistEls.form?.addEventListener('submit',saveRecurringChecklist);
document.getElementById('openRoster').addEventListener('click',openRosterModal);
const fourWeekModal=document.getElementById('fourWeekModal');
document.getElementById('openFourWeek').addEventListener('click',openFourWeekModal);
document.getElementById('closeFourWeek').addEventListener('click',closeFourWeekModal);
document.getElementById('previousFourWeek').addEventListener('click',()=>changeFourWeek(-7));
document.getElementById('resetFourWeek').addEventListener('click',()=>{fourWeekMonday=fourWeeksAheadMonday();renderFourWeek()});
document.getElementById('nextFourWeek').addEventListener('click',()=>changeFourWeek(7));
fourWeekModal.addEventListener('click',event=>{if(event.target===fourWeekModal)closeFourWeekModal()});
const maintenanceModal=document.getElementById('maintenanceModal');
const maintenanceForm=document.getElementById('maintenanceForm');
const maintenanceDevice=document.getElementById('maintenanceDevice');
const maintenanceOtherDeviceField=document.getElementById('maintenanceOtherDeviceField');
const maintenanceOtherDevice=document.getElementById('maintenanceOtherDevice');
const maintenanceAction=document.getElementById('maintenanceAction');
const maintenanceOtherActionField=document.getElementById('maintenanceOtherActionField');
const maintenanceOtherAction=document.getElementById('maintenanceOtherAction');
const deleteModal=document.getElementById('deleteModal');
document.getElementById('openMaintenance').addEventListener('click',openMaintenanceModal);
document.getElementById('cancelMaintenance').addEventListener('click',closeMaintenanceModal);
maintenanceModal.addEventListener('click',event=>{if(event.target===maintenanceModal)closeMaintenanceModal()});
maintenanceDevice.addEventListener('change',updateMaintenanceChoices);
maintenanceForm.addEventListener('submit',saveMaintenanceTask);
document.getElementById('cancelDelete').addEventListener('click',closeDeleteModal);
document.getElementById('confirmDelete').addEventListener('click',confirmDeleteEntry);
deleteModal.addEventListener('click',event=>{if(event.target===deleteModal)closeDeleteModal()});
els.appointmentSearch.addEventListener('input',()=>{els.clearAppointmentSearch.hidden=!els.appointmentSearch.value;render()});
els.clearAppointmentSearch.addEventListener('click',()=>{els.appointmentSearch.value='';els.clearAppointmentSearch.hidden=true;els.appointmentSearch.focus();render()});
document.getElementById('cancelRoster').addEventListener('click',closeRosterModal);
document.getElementById('exportRoster').addEventListener('click',exportRosterCalendar);
els.rosterModal.addEventListener('click',event=>{if(event.target===els.rosterModal)closeRosterModal()});
els.rosterYear.addEventListener('change',changeRosterPeriod);
els.rosterPeriod.addEventListener('change',changeRosterPeriod);
els.rosterForm.addEventListener('submit',saveRoster);

function normalizePlannerEntries(items){return items.map(item=>{const normalized=item.note==='Onderhoudsmelding van apparaat'?{...item,category:''}:item;return normalized.title==='School informeren dat hij wel naar school gaat'?{...normalized,title:'School informeren over de ziekenhuisafspraak'}:normalized})}
function loadEntries(){try{return normalizePlannerEntries(JSON.parse(localStorage.getItem(STORAGE_KEY))||[])}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));window.schedulePlannerCloudSync?.()}
function mondayForDate(value){const date=new Date(value);date.setHours(12,0,0,0);date.setDate(date.getDate()-(date.getDay()||7)+1);return date}
function fourWeeksAheadMonday(){const target=new Date();target.setDate(target.getDate()+28);return mondayForDate(target)}
function openFourWeekModal(){fourWeekMonday=fourWeeksAheadMonday();renderFourWeek();openPlannerOverlay('four-week',fourWeekModal)}
function closeFourWeekModal(direct=false){closePlannerOverlay('four-week',fourWeekModal,direct)}
function changeFourWeek(days){fourWeekMonday.setDate(fourWeekMonday.getDate()+days);renderFourWeek()}
function renderFourWeek(){const end=new Date(fourWeekMonday);end.setDate(end.getDate()+6);document.getElementById('fourWeekRange').textContent=`${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long'}).format(fourWeekMonday)} t/m ${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(end)}`;document.getElementById('fourWeekDays').innerHTML=Array.from({length:7},(_,index)=>{const date=new Date(fourWeekMonday);date.setDate(date.getDate()+index);const key=localDateKey(date);const planned=entries.filter(item=>(item.type==='appointment'&&item.date===key)||(item.type==='task'&&!isTaskDone(item)&&(item.deadline||item.date)===key)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));const rows=planned.map(item=>`<li><strong>${escapeHtml(item.type==='task'?'Taak':item.time?appointmentTime(item):'Tijd onbekend')}</strong><span>${escapeHtml(item.title)}${item.category==='work'&&item.title!=='School'?' · Werk':''}</span></li>`).join('');return `<section class="availability-day"><div><strong>${new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'short'}).format(date)}</strong><button type="button" data-plan-date="${key}">Plan afspraak</button></div>${rows?`<ul>${rows}</ul>`:''}</section>`}).join('');document.querySelectorAll('[data-plan-date]').forEach(button=>button.addEventListener('click',()=>{const date=button.dataset.planDate;closeFourWeekModal(true);history.replaceState({...history.state,hcPlannerPage:currentPlannerPage(),hcPlannerOverlay:''},'',location.href);openModal('appointment');els.entryDate.value=date}))}
function openMaintenanceModal(){maintenanceForm.reset();maintenanceOtherDeviceField.hidden=true;maintenanceOtherDevice.required=false;maintenanceOtherActionField.hidden=true;maintenanceOtherAction.required=false;maintenanceAction.disabled=true;maintenanceAction.innerHTML='<option value="">Kies eerst een apparaat</option>';document.getElementById('maintenanceDeadline').value=currentWeekEndKey();openPlannerOverlay('maintenance',maintenanceModal)}
function closeMaintenanceModal(direct=false){closePlannerOverlay('maintenance',maintenanceModal,direct)}
function updateMaintenanceChoices(){const other=maintenanceDevice.value==='Ander apparaat';maintenanceOtherDeviceField.hidden=!other;maintenanceOtherDevice.required=other;if(!other)maintenanceOtherDevice.value='';maintenanceOtherActionField.hidden=!other;maintenanceOtherAction.required=other;if(!other)maintenanceOtherAction.value='';const choices=maintenanceDevice.value==='Vaatwasser'?[['filter reinigen','Reiniging filter'],['glansspoelmiddel bijvullen','Glansspoelmiddel'],['zout bijvullen','Zout']]:maintenanceDevice.value==='Koffiezetapparaat'?[['ontkalken','Ontkalken']]:[];maintenanceAction.disabled=!choices.length;maintenanceAction.required=Boolean(choices.length);maintenanceAction.innerHTML=choices.length?'<option value="">Kies het onderhoud</option>'+choices.map(([value,label])=>`<option value="${value}">${label}</option>`).join(''):'<option value="">Zelf omschrijven</option>'}
function saveMaintenanceTask(event){event.preventDefault();const other=maintenanceDevice.value==='Ander apparaat';const device=other?maintenanceOtherDevice.value.trim():maintenanceDevice.value;const action=other?maintenanceOtherAction.value.trim():maintenanceAction.value;const deadline=document.getElementById('maintenanceDeadline').value;if(!device||!action)return;entries.push({id:uid(),cloudId:'',cloudScope:'',type:'task',date:todayKey(),deadline,urgent:false,category:'',visibility:'shared',title:`${device}: ${action}`,time:'',endTime:'',personUid:'',personName:'',participants:[],note:'Onderhoudsmelding van apparaat',done:false,repeat:'none',completedPeriods:[],createdAt:Date.now()});persist();closeMaintenanceModal();render()}
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
  const obsoleteIds=new Set(['house-weekly-0','house-weekly-1','house-weekly-2','house-weekly-3','house-weekly-4']);
  entries=entries.filter(item=>!obsoleteIds.has(item.id));
  const planned=HOUSEHOLD_TASKS.map(([key,title,repeat,room],index)=>({id:`house-${key}`,type:'task',category:'household',visibility:'shared',date:todayKey(),title,time:'',note:room,done:false,repeat,completedPeriods:[],createdAt:1786901000000+index}));
  planned.forEach(item=>{if(!entries.some(entry=>entry.id===item.id||entry.title===item.title))entries.push(item)});
  persist();localStorage.setItem(HOUSE_SEED_KEY,'1');
}
function seedOldCarDeadline(){
  if(localStorage.getItem(DEADLINE_SEED_KEY))return;
  if(!entries.some(entry=>entry.id==='old-car-empty'))entries.push({id:'old-car-empty',type:'task',date:todayKey(),deadline:'2026-08-20',title:'Oude auto helemaal leegmaken',time:'',note:'Klaar vóór het ophalen van de auto',done:false,repeat:'none',completedPeriods:[],createdAt:1786900000150});
  persist();localStorage.setItem(DEADLINE_SEED_KEY,'1');
}
function currentPlannerPage(){
  if(!els.householdPage.hidden)return 'household';
  if(!els.routinesPage.hidden)return 'routines';
  return 'today';
}
function renderPlannerPage(page,scroll=true){
  const safe=['today','routines','household'].includes(page)?page:'today';
  els.todayPage.hidden=safe!=='today';els.routinesPage.hidden=safe!=='routines';els.householdPage.hidden=safe!=='household';
  document.querySelectorAll('[data-planner-page]').forEach(button=>button.classList.toggle('active',button.dataset.plannerPage===safe));
  if(safe==='routines')renderRoutines();
  if(safe==='household'){renderHousehold();if(scroll)window.scrollTo({top:0,behavior:'smooth'})}
}
function showPlannerPage(page,fromHistory=false){
  const safe=['today','routines','household'].includes(page)?page:'today';
  const previous=currentPlannerPage();
  renderPlannerPage(safe,!fromHistory);
  if(plannerHistoryReady&&!fromHistory&&safe!==previous){history.pushState({...history.state,hcPlannerPage:safe,hcPlannerOverlay:''},'',location.href)}
}
function initializePlannerHistory(){
  const initial=['today','routines','household'].includes(history.state?.hcPlannerPage)?history.state.hcPlannerPage:'today';
  history.replaceState({...history.state,hcPlannerPage:initial,hcPlannerOverlay:''},'',location.href);
  plannerHistoryReady=true;
  renderPlannerPage(initial,false);
}
function openPlannerOverlay(name,element){
  if(!element||element.classList.contains('open'))return;
  history.pushState({...history.state,hcPlannerPage:currentPlannerPage(),hcPlannerOverlay:name},'',location.href);
  element.classList.add('open');element.setAttribute('aria-hidden','false');
  // V1.4.0 - laat een geopend formulier eerst als overzicht zien, zonder toetsenbord.
  element.setAttribute('tabindex','-1');try{element.focus({preventScroll:true})}catch(_){element.focus()}
}
function closePlannerOverlay(name,element,direct=false){
  if(!element)return;
  if(!direct&&element.classList.contains('open')&&history.state?.hcPlannerOverlay===name){history.back();return}
  element.classList.remove('open');element.setAttribute('aria-hidden','true');
}
function closeAllPlannerOverlaysDirect(){
  [['entry','entryModal'],['maintenance','maintenanceModal'],['four-week','fourWeekModal'],['roster','rosterModal'],['delete','deleteModal']].forEach(([,id])=>{const el=document.getElementById(id);if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true')}});
  pendingDeleteId='';
}
window.addEventListener('popstate',event=>{
  closeAllPlannerOverlaysDirect();
  const page=event.state?.hcPlannerPage;
  if(page)renderPlannerPage(page,false);
});
function tomorrowKey(){const date=new Date();date.setDate(date.getDate()+1);return localDateKey(date)}
function wasteReminderForDate(date=new Date()){
  const day=date.getDay();if(day===0||day===5||day===6)return null;
  const friday=new Date(date);friday.setHours(12,0,0,0);friday.setDate(date.getDate()+(5-day));
  return WASTE_SCHEDULES.find(schedule=>{const first=new Date(`${schedule.firstFriday}T12:00:00`);const days=Math.round((friday-first)/86400000);return days>=0&&days%28===0})||null;
}
function renderWasteReminder(){const schedule=wasteReminderForDate();els.wastePanel.hidden=!schedule;if(!schedule)return;els.wasteTitle.textContent=`${schedule.type} wordt vrijdag opgehaald`;els.wasteText.textContent=new Date().getDay()===4?schedule.lastDay:schedule.regular}
async function shareWasteReminder(){const schedule=wasteReminderForDate();if(!schedule)return;const now=new Date();const friday=new Date(now);friday.setHours(12,0,0,0);friday.setDate(now.getDate()+(5-now.getDay()));const date=new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long'}).format(friday);const instruction=now.getDay()===4?schedule.lastDay:schedule.regular;const title=`${schedule.type} wordt opgehaald`;const lines=[`Vrijdag ${date}`,instruction];const text=[title,...lines].join('\n');await shareWithCard(title,lines,text,`afval-${schedule.type.toLowerCase()}.png`)}
const SHIFTS={day:{title:'Dagdienst',start:'07:00',end:'13:30'},longday:{title:'Lange dagdienst',start:'07:00',end:'15:30'},shortday:{title:'Korte dagdienst',start:'07:00',end:'11:00'},evening:{title:'Avonddienst',start:'15:15',end:'22:45'},shortevening:{title:'Korte avonddienst',start:'16:30',end:'21:30'},school:{title:'School',start:'09:00',end:'15:30'},free:{title:'Vrij',start:'',end:''}};
function isoWeekValue(date=new Date()){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return `${d.getUTCFullYear()}-W${String(Math.ceil((((d-start)/86400000)+1)/7)).padStart(2,'0')}`}
function mondayFromWeek(value){const [year,week]=value.split('-W').map(Number);const jan4=new Date(year,0,4,12);const monday=new Date(jan4);monday.setDate(jan4.getDate()-(jan4.getDay()||7)+1+(week-1)*7);return monday}
function rosterOwnerMatches(item){const current=window.huizeChaosPlannerUserUid||'';return item.personUid===current||(!item.personUid&&window.huizeChaosPlannerRole==='owner')}
function shiftKey(item){if(!item)return '';for(const [key,shift] of Object.entries(SHIFTS))if(item.title===shift.title&&item.time===shift.start&&item.endTime===shift.end)return key;return 'custom'}
const ROSTER_PERIOD_ANCHOR=new Date('2026-09-14T12:00:00');
function rosterPeriodStart(year,period){const index=(Number(year)-2026)*13+(Number(period)-10);const date=new Date(ROSTER_PERIOD_ANCHOR);date.setDate(date.getDate()+index*28);return date}
function rosterPeriodForDate(date=new Date()){const clean=new Date(date);clean.setHours(12,0,0,0);const index=Math.floor((clean-ROSTER_PERIOD_ANCHOR)/(28*86400000));const ordinal=9+index;return {year:2026+Math.floor(ordinal/13),period:((ordinal%13)+13)%13+1}}
function setRosterPeriodOptions(){const currentYear=new Date().getFullYear();els.rosterYear.innerHTML=[currentYear,currentYear+1].map(year=>`<option value="${year}">${year}</option>`).join('');els.rosterPeriod.innerHTML=Array.from({length:13},(_,index)=>`<option value="${index+1}">Periode ${index+1}</option>`).join('')}
function openRosterModal(){rosterDrafts.clear();setRosterPeriodOptions();const current=rosterPeriodForDate();els.rosterYear.value=String(Math.max(new Date().getFullYear(),Math.min(new Date().getFullYear()+1,current.year)));els.rosterPeriod.value=String(current.period);renderRosterPeriod(0);openPlannerOverlay('roster',els.rosterModal)}
function closeRosterModal(direct=false){rosterDrafts.clear();activeRosterWeek='';closePlannerOverlay('roster',els.rosterModal,direct)}
function changeRosterPeriod(){stashRosterWeek();renderRosterPeriod(0)}
function renderRosterPeriod(weekIndex=0){const start=rosterPeriodStart(els.rosterYear.value,els.rosterPeriod.value);const end=new Date(start);end.setDate(end.getDate()+27);els.rosterPeriodRange.textContent=`${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(start)} t/m ${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(end)}`;els.rosterWeekTabs.innerHTML=Array.from({length:4},(_,index)=>{const monday=new Date(start);monday.setDate(start.getDate()+index*7);const week=isoWeekValue(monday);return `<button type="button" data-roster-week="${week}" class="${index===weekIndex?'active':''}">Week ${week.slice(-2)}</button>`}).join('');els.rosterWeekTabs.querySelectorAll('[data-roster-week]').forEach(button=>button.addEventListener('click',()=>{stashRosterWeek();activeRosterWeek=button.dataset.rosterWeek;els.rosterWeekTabs.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));renderRosterDays()}));activeRosterWeek=els.rosterWeekTabs.querySelectorAll('button')[weekIndex].dataset.rosterWeek;renderRosterDays()}
function renderRosterDays(){
  if(!activeRosterWeek)return;const monday=mondayFromWeek(activeRosterWeek);const names=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
  els.rosterDays.innerHTML=names.map((name,index)=>{const date=new Date(monday);date.setDate(monday.getDate()+index);const key=localDateKey(date);const saved=entries.find(entry=>entry.category==='work'&&entry.date===key&&rosterOwnerMatches(entry));const item=rosterDrafts.has(key)?rosterDrafts.get(key):saved;const selected=shiftKey(item);const schoolOption=key<='2026-10-31'||selected==='school'?[['school','School 09.00–15.30']]:[];const options=[['','Geen invoer'],['day','Dag 07.00–13.30'],['longday','Lang 07.00–15.30'],['shortday','Kort 07.00–11.00'],['evening','Avond 15.15–22.45'],['shortevening','Kort avond 16.30–21.30'],...schoolOption,['free','Vrij'],['custom','Andere tijd']].map(([value,label])=>`<option value="${value}" ${selected===value?'selected':''}>${label}</option>`).join('');return `<div class="roster-row" data-roster-date="${key}"><div><strong>${name}</strong><small>${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(date)}</small></div><select aria-label="Dienst op ${name}">${options}</select><div class="custom-times" ${selected==='custom'?'':'hidden'}><input type="time" class="roster-start" value="${escapeHtml(item?.time||'')}" aria-label="Begintijd ${name}"><input type="time" class="roster-end" value="${escapeHtml(item?.endTime||'')}" aria-label="Eindtijd ${name}"></div></div>`}).join('');
  els.rosterDays.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{select.closest('.roster-row').querySelector('.custom-times').hidden=select.value!=='custom'}));
  updateRosterDraftStatus();
}
function rosterChoiceFromRow(row){const choice=row.querySelector('select').value;if(!choice)return null;const shift=choice==='custom'?{title:'Andere dienst',start:row.querySelector('.roster-start').value,end:row.querySelector('.roster-end').value}:SHIFTS[choice];return {date:row.dataset.rosterDate,...shift}}
function collectRosterChoices(){return [...els.rosterDays.querySelectorAll('.roster-row')].map(rosterChoiceFromRow).filter(Boolean)}
function stashRosterWeek(){if(!activeRosterWeek||!els.rosterDays.children.length)return;els.rosterDays.querySelectorAll('.roster-row').forEach(row=>rosterDrafts.set(row.dataset.rosterDate,rosterChoiceFromRow(row)));updateRosterDraftStatus()}
function updateRosterDraftStatus(){const choices=[...rosterDrafts.values()].filter(Boolean);const weeks=new Set(choices.map(item=>isoWeekValue(new Date(`${item.date}T12:00:00`))));document.getElementById('rosterDraftStatus').textContent=choices.length?`${choices.length} ${choices.length===1?'dag':'dagen'} ingevuld in ${weeks.size} ${weeks.size===1?'week':'weken'}`:'Nog geen diensten tijdelijk ingevuld'}
function saveRoster(event){event.preventDefault();stashRosterWeek();const currentUid=window.huizeChaosPlannerUserUid||'';const currentName=window.huizeChaosPlannerUserName||'Gezinslid';const affectedDates=new Set(rosterDrafts.keys());entries=entries.filter(item=>!(item.category==='work'&&affectedDates.has(item.date)&&rosterOwnerMatches(item)));[...rosterDrafts.values()].filter(Boolean).forEach(shift=>entries.push({id:uid(),cloudId:'',cloudScope:'',type:'appointment',date:shift.date,deadline:'',urgent:false,category:'work',visibility:'shared',title:shift.title,time:shift.start,endTime:shift.end,personUid:currentUid,personName:currentName,note:'',done:false,repeat:'none',completedPeriods:[],createdAt:Date.now()}));persist();closeRosterModal();render()}
function icsEscape(value=''){return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function icsDate(date,time){return `${date.replaceAll('-','')}T${time.replace(':','')}00`}
function calendarText(items){const events=items.filter(item=>item.type==='appointment'&&item.time).map(item=>['BEGIN:VEVENT',`UID:${item.id}@huize-chaos`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=Europe/Amsterdam:${icsDate(item.date,item.time)}`,item.endTime?`DTEND;TZID=Europe/Amsterdam:${icsDate(item.date,item.endTime)}`:'DURATION:PT1H',`SUMMARY:${icsEscape(item.title)}`,item.note?`DESCRIPTION:${icsEscape(item.note)}`:'', 'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(item.title)} begint over 1 uur`,'END:VALARM','END:VEVENT'].filter(Boolean).join('\r\n')).join('\r\n');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Huize Chaos//Gezinsplanner//NL','CALSCALE:GREGORIAN','METHOD:PUBLISH',events,'END:VCALENDAR'].join('\r\n')}
function downloadCalendar(items,name){const blob=new Blob([calendarText(items)],{type:'text/calendar;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
function exportRosterCalendar(){stashRosterWeek();const choices=[...rosterDrafts.values()].filter(item=>item?.start).map(item=>({id:uid(),type:'appointment',...item,time:item.start,endTime:item.end,note:'Werkrooster'}));if(!choices.length){alert('Kies eerst minimaal één dienst met een begintijd.');return}downloadCalendar(choices,'werkrooster.ics')}
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
  if(repeat==='biweekly'){const week=periodKey('weekly',date);const number=Number(week.slice(-2));return `${week.slice(0,4)}-B${Math.ceil(number/2)}`}
  if(repeat==='monthly')return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  if(repeat==='bimonthly')return `${date.getFullYear()}-B${Math.floor(date.getMonth()/2)+1}`;
  if(repeat==='quarterly'||repeat==='seasonal')return `${date.getFullYear()}-K${Math.floor(date.getMonth()/3)+1}`;
  if(repeat==='semiannual')return `${date.getFullYear()}-H${Math.floor(date.getMonth()/6)+1}`;
  if(repeat==='yearly')return String(date.getFullYear());
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const week1=new Date(d.getFullYear(),0,4);return `${d.getFullYear()}-W${String(1+Math.round(((d-week1)/86400000-3+(week1.getDay()+6)%7)/7)).padStart(2,'0')}`;
}
function isTaskDone(item){return item.repeat&&item.repeat!=='none'?(item.completedPeriods||[]).includes(periodKey(item.repeat)):Boolean(item.done)}
function currentWeekStartKey(){const date=new Date();const day=date.getDay()||7;date.setDate(date.getDate()-day+1);return localDateKey(date)}
function householdRepeatWeeks(repeat){return ({biweekly:2,monthly:4,bimonthly:8,quarterly:13,semiannual:26,yearly:52})[repeat]||1}
function addWeeksKey(value,weeks){const date=new Date(`${value}T12:00:00`);date.setDate(date.getDate()+weeks*7);return localDateKey(date)}
function nextHouseholdDueDate(repeat){return addWeeksKey(currentWeekStartKey(),householdRepeatWeeks(repeat))}
function householdTaskWeight(item){const title=String(item.title||'').toLowerCase();if(/volledig|grondig|ramen|oven|koelkast|vriezer|achter en onder|hele huis/.test(title))return 3;if(/wassen|reinigen|afnemen|ontkalken|inventariseren/.test(title))return 2;return 1}
function initializeHouseholdWeekSchedule(){let changed=false;const start=currentWeekStartKey(),globalLoads=Array(13).fill(0);WEEK_SCHEDULE_HOUSEHOLD_REPEATS.forEach(repeat=>{const cycle=householdRepeatWeeks(repeat),group=entries.filter(item=>item.type==='task'&&item.category==='household'&&item.repeat===repeat&&!item.nextDueDate);const open=group.filter(item=>!isTaskDone(item));group.filter(isTaskDone).forEach(item=>{item.nextDueDate=addWeeksKey(start,cycle);item.lastCompletedDate=item.lastCompletedDate||todayKey();changed=true});const capacities=Array.from({length:cycle},(_,slot)=>Math.ceil((slot+1)*open.length/cycle)-Math.ceil(slot*open.length/cycle));const loads=Array(cycle).fill(0);open.sort((a,b)=>householdTaskWeight(b)-householdTaskWeight(a)||a.createdAt-b.createdAt).forEach(item=>{let best=-1;for(let slot=0;slot<cycle;slot+=1){if(capacities[slot]<=0)continue;if(best<0||loads[slot]+globalLoads[slot]<loads[best]+globalLoads[best])best=slot}if(best<0)best=0;item.nextDueDate=addWeeksKey(start,best);capacities[best]-=1;loads[best]+=householdTaskWeight(item);globalLoads[best]+=householdTaskWeight(item);changed=true})});if(changed)persist()}
function balanceHouseholdWeekSchedule(){const week=currentWeekStartKey();if(localStorage.getItem(HOUSEHOLD_SCHEDULE_WEEK_KEY)===week)return;const weekEnd=currentWeekEndKey(),nextWeek=addWeeksKey(week,1);const due=entries.filter(item=>item.type==='task'&&item.category==='household'&&WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)&&item.nextDueDate&&item.nextDueDate<=weekEnd).sort((a,b)=>a.nextDueDate.localeCompare(b.nextDueDate)||a.createdAt-b.createdAt);due.slice(HOUSEHOLD_WEEK_LIMIT).forEach(item=>{item.nextDueDate=nextWeek});localStorage.setItem(HOUSEHOLD_SCHEDULE_WEEK_KEY,week);if(due.length>HOUSEHOLD_WEEK_LIMIT)persist()}
function householdTaskAddedThisWeek(item){return Boolean(item.manualWeekKey)}
function householdTaskDueFromCompletion(item){return Boolean(item.nextDueDate&&item.nextDueDate<=currentWeekEndKey())}
function scheduledHouseholdItems(){return householdItems().filter(item=>WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)&&householdTaskDueFromCompletion(item)).sort((a,b)=>Number(Boolean(b.manualWeekKey))-Number(Boolean(a.manualWeekKey))||a.nextDueDate.localeCompare(b.nextDueDate)||a.createdAt-b.createdAt).slice(0,HOUSEHOLD_WEEK_LIMIT)}
function householdTaskActive(item){return householdTaskAddedThisWeek(item)||(WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)&&householdTaskDueFromCompletion(item))}
function householdScheduleLabel(item){if(!item.nextDueDate)return '';const planned=periodKey('weekly',new Date(`${item.nextDueDate}T12:00:00`)),current=periodKey('weekly'),next=periodKey('weekly',new Date(`${addWeeksKey(currentWeekStartKey(),1)}T12:00:00`));if(planned===current)return 'Gepland: deze week';if(planned===next)return 'Gepland: volgende week';return `Gepland: week ${planned.slice(-2)}${planned.slice(0,4)!==current.slice(0,4)?` · ${planned.slice(0,4)}`:''}`}
function todayHouseholdItems(){return householdItems().filter(item=>TASK_LIST_HOUSEHOLD_REPEATS.has(item.repeat)&&(householdTaskDueFromCompletion(item)||(householdTaskAddedThisWeek(item)&&!isTaskDone(item))))}
function todayEntries(type){return entries.filter(item=>{if(item.type!==type||item.category==='household')return false;if(type==='appointment')return item.date===todayKey();if(item.date>todayKey())return false;if(item.repeat&&item.repeat!=='none')return true;return item.date===todayKey()||!isTaskDone(item)})}
function householdItems(){return entries.filter(item=>item.type==='task'&&item.category==='household')}
function householdTimeState(){
  let state={date:todayKey(),seconds:1800,running:false,finished:false};
  try{const saved=JSON.parse(localStorage.getItem(HOUSEHOLD_TIME_KEY)||'null');if(saved&&saved.date===todayKey())state={...state,...saved}}catch{}
  if(state.running&&state.startedAt){state.seconds=Math.max(0,state.seconds-Math.floor((Date.now()-state.startedAt)/1000));state.startedAt=Date.now();if(state.seconds===0){state.running=false;state.finished=true}}
  return state;
}
function saveHouseholdTime(state){localStorage.setItem(HOUSEHOLD_TIME_KEY,JSON.stringify(state))}
function householdTimeElements(){return {timer:document.getElementById('householdTimer'),text:document.getElementById('householdTimeText'),start:document.getElementById('startHouseholdTimer'),pause:document.getElementById('pauseHouseholdTimer'),reset:document.getElementById('resetHouseholdTimer'),extra:document.getElementById('householdExtraActions')}}
function renderHouseholdTime(){
  const el=householdTimeElements();if(!el.timer)return;const state=householdTimeState();saveHouseholdTime(state);
  const m=Math.floor(state.seconds/60),sec=state.seconds%60;el.timer.textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  el.timer.classList.toggle('running',state.running);el.timer.setAttribute('aria-label',state.running?'Huishoudtimer pauzeren':'Huishoudtimer starten');
  const due=householdItems().filter(item=>!isTaskDone(item)).length;
  el.text.textContent=state.finished?'30 minuten gedaan. Voor vandaag is dit voldoende. Meer mag, maar hoeft niet.':`Iedere dag 30 minuten. ${due?`${due} huishoudtaken staan nog open in je bestaande planner.`:'Alle geplande huishoudtaken zijn afgerond.'}`;
  el.start.hidden=state.running||state.finished;el.start.textContent=state.seconds<1800?'Verder':'Start 30 minuten';el.pause.hidden=!state.running;el.reset.hidden=!(state.running||state.seconds<1800)&&!state.finished;el.extra.hidden=!state.finished;
  clearInterval(householdTimerInterval);if(state.running)householdTimerInterval=setInterval(tickHouseholdTime,1000);
}
function tickHouseholdTime(){const state=householdTimeState();saveHouseholdTime(state);const el=householdTimeElements();const m=Math.floor(state.seconds/60),sec=state.seconds%60;el.timer.textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;if(!state.running)renderHouseholdTime()}
function startHouseholdTime(){const state=householdTimeState();state.running=true;state.finished=false;state.startedAt=Date.now();saveHouseholdTime(state);renderHouseholdTime()}
function pauseHouseholdTime(){const state=householdTimeState();state.running=false;delete state.startedAt;saveHouseholdTime(state);renderHouseholdTime()}
function finishHouseholdTime(){const state=householdTimeState();state.running=false;state.finished=true;state.seconds=0;delete state.startedAt;saveHouseholdTime(state);renderHouseholdTime()}
function addHouseholdTime(minutes){const state=householdTimeState();state.seconds=minutes*60;state.running=true;state.finished=false;state.startedAt=Date.now();saveHouseholdTime(state);renderHouseholdTime()}
document.getElementById('startHouseholdTimer')?.addEventListener('click',startHouseholdTime);
document.getElementById('pauseHouseholdTimer')?.addEventListener('click',pauseHouseholdTime);
document.getElementById('resetHouseholdTimer')?.addEventListener('click',finishHouseholdTime);
document.getElementById('householdTimer')?.addEventListener('click',()=>householdTimeState().running?pauseHouseholdTime():startHouseholdTime());
document.querySelectorAll('[data-household-extra]').forEach(button=>button.addEventListener('click',()=>addHouseholdTime(Number(button.dataset.householdExtra))));

function studyPeriod(){let state={endDate:'2026-11-15',ended:false};try{state={...state,...JSON.parse(localStorage.getItem(STUDY_PERIOD_KEY)||'{}')}}catch{}return state}
function saveStudyPeriod(state){localStorage.setItem(STUDY_PERIOD_KEY,JSON.stringify(state))}
function studyState(){let state={date:todayKey(),elapsed:0,running:false,phase:'minimum'};try{const x=JSON.parse(localStorage.getItem(STUDY_TIME_KEY)||'null');if(x&&x.date===todayKey())state={...state,...x}}catch{}if(state.running&&state.startedAt){state.elapsed+=Math.floor((Date.now()-state.startedAt)/1000);state.startedAt=Date.now()}return state}
function saveStudyState(state){localStorage.setItem(STUDY_TIME_KEY,JSON.stringify(state))}
function studyEls(){return {timer:document.getElementById('studyTimer'),text:document.getElementById('studyTimeText'),start:document.getElementById('startStudyTimer'),pause:document.getElementById('pauseStudyTimer'),finish:document.getElementById('finishStudyTimer'),extra:document.getElementById('studyExtraActions'),period:document.getElementById('studyPeriodText')}}
function renderStudy(){const e=studyEls();if(!e.timer)return;const p=studyPeriod(),st=studyState();saveStudyState(st);const min=Math.floor(st.elapsed/60),sec=st.elapsed%60;e.timer.textContent=st.elapsed<3600?`${String(Math.floor((3600-st.elapsed)/60)).padStart(2,'0')}:${String((3600-st.elapsed)%60).padStart(2,'0')}`:`${Math.floor(st.elapsed/3600)}u ${String(Math.floor((st.elapsed%3600)/60)).padStart(2,'0')}m`;e.timer.classList.toggle('running',st.running);e.timer.setAttribute('aria-label',st.running?'Studietimer pauzeren':'Studietimer starten');e.text.textContent=p.ended?'Studieperiode afgerond.':st.elapsed>=5400?'Streefdoel gehaald. Je kunt stoppen of lekker doorgaan zolang het goed gaat.':st.elapsed>=3600?'Minimum gehaald. Nog 30 minuten tot je streefdoel.':`Iedere dag minimaal 60 minuten. Streefdoel: 90 minuten.`;e.start.hidden=st.running||p.ended;e.start.textContent=st.elapsed?'Verder studeren':'Start 60 minuten';e.pause.hidden=!st.running;e.finish.hidden=p.ended||(!st.running&&!st.elapsed);e.extra.hidden=p.ended||st.elapsed<3600||st.elapsed>=5400;e.period.textContent=p.ended?'Studieperiode beëindigd.':`Studieperiode t/m ${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(new Date(p.endDate+'T12:00:00'))}.`;clearInterval(studyTimerInterval);if(st.running)studyTimerInterval=setInterval(tickStudy,1000)}
function tickStudy(){const st=studyState();saveStudyState(st);renderStudy()}
function startStudy(){const st=studyState();st.running=true;st.startedAt=Date.now();saveStudyState(st);renderStudy()}
function pauseStudy(){const st=studyState();st.running=false;delete st.startedAt;saveStudyState(st);renderStudy()}
function finishStudy(){pauseStudy()}
function continueStudy(){startStudy()}
document.getElementById('startStudyTimer')?.addEventListener('click',startStudy);document.getElementById('pauseStudyTimer')?.addEventListener('click',pauseStudy);document.getElementById('finishStudyTimer')?.addEventListener('click',finishStudy);document.getElementById('continueStudy30')?.addEventListener('click',continueStudy);
document.getElementById('studyTimer')?.addEventListener('click',()=>{if(studyPeriod().ended)return;studyState().running?pauseStudy():startStudy()});
document.getElementById('finishStudyPeriod')?.addEventListener('click',()=>{if(confirm('Zijn alle examens, T-opdrachten en IOP’s klaar? Dan wordt het dagelijkse studieblok beëindigd.')){const p=studyPeriod();p.ended=true;saveStudyPeriod(p);renderStudy()}});
document.getElementById('extendStudyPeriod')?.addEventListener('click',()=>{const p=studyPeriod(),v=prompt('Nieuwe einddatum (JJJJ-MM-DD):',p.endDate);if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)){p.endDate=v;p.ended=false;saveStudyPeriod(p);renderStudy()}});

function renderHousehold(){
  renderHouseholdTime();
  const items=householdItems();const byId=new Map(items.map(item=>[item.id,item]));const blockIds=new Set(HOUSEHOLD_BLOCKS.flatMap(block=>block.taskIds));
  const floor=byId.get('house-floor-downstairs');const weekly=[];const biweekly=[];
  if(floor)weekly.push(renderHouseholdTask(floor,true));
  HOUSEHOLD_BLOCKS.forEach(block=>{const children=block.taskIds.map(id=>byId.get(id)).filter(item=>item&&!householdTaskAddedThisWeek(item)&&(!item.nextDueDate||householdTaskDueFromCompletion(item)));if(!children.length)return;(block.repeat==='biweekly'?biweekly:weekly).push(renderHouseholdBlock(block,children))});
  const selected=scheduledHouseholdItems().filter(item=>!blockIds.has(item.id));
  selected.forEach(item=>weekly.push(renderHouseholdTask(item)));
  const extra=items.find(item=>!blockIds.has(item.id)&&item.id!=='house-floor-downstairs'&&!TASK_LIST_HOUSEHOLD_REPEATS.has(item.repeat)&&!WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)&&!isTaskDone(item)&&!selected.includes(item));
  const cards=[];if(weekly.length)cards.push(`<h3 class="house-section-title">Deze week</h3>${weekly.join('')}`);if(biweekly.length)cards.push(`<h3 class="house-section-title">Iedere twee weken</h3>${biweekly.join('')}`);if(extra)cards.push(`<h3 class="house-section-title">Eén extra klus</h3>${renderHouseholdTask(extra)}`);
  els.householdDue.innerHTML=cards.length?cards.join(''):'<div class="empty">Alle huishoudtaken voor deze periode zijn gedaan</div>';
  els.householdLibrary.innerHTML=Object.entries(HOUSEHOLD_GROUPS).map(([key,label])=>{const repeat=key==='once'?'none':key;const group=items.filter(item=>(item.repeat||'none')===repeat);if(!group.length)return '';return `<details><summary>${escapeHtml(label)} <span>${group.length}</span></summary><div class="library-list">${group.map(item=>{const addable=TASK_LIST_HOUSEHOLD_REPEATS.has(item.repeat)||WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat),active=householdTaskActive(item),schedule=householdScheduleLabel(item);return `<div class="library-task-row"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note||'')}</small>${schedule?`<small>${escapeHtml(schedule)}</small>`:''}</div>${addable?`<button type="button" class="library-add-button${active?' added':''}" data-house-add="${escapeHtml(item.id)}" aria-label="${active?'Al ingepland':'Eenmalig aan deze week toevoegen'}" ${active?'disabled':''}>${active?'✓':'+'}</button>`:''}</div>`}).join('')}</div></details>`}).join('');
  bindHouseholdActions();
}
function renderHouseholdTask(item,keepVisible=false){const due=WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)&&householdTaskDueFromCompletion(item),done=due?false:isTaskDone(item),postponable=due;return `<article class="planner-item compact-house-task${done?' done':''}${keepVisible?' household-main':''}"><input class="check" type="checkbox" data-house-check="${item.id}" aria-label="Huishoudtaak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${keepVisible?'':`<small>${escapeHtml(repeatLabel(item.repeat))}</small>`}</div>${postponable?`<button type="button" class="house-postpone" data-house-postpone="${escapeHtml(item.id)}">Volgende week</button>`:''}</article>`}
function renderHouseholdBlock(block,children){const done=children.every(isTaskDone);const completed=children.filter(isTaskDone).length;return `<article class="planner-item household-block${done?' done':''}"><input class="check" type="checkbox" data-house-block="${block.id}" aria-label="Huishoudblok afronden" ${done?'checked':''}><div class="item-copy"><div class="block-title-row"><strong>${escapeHtml(block.title)}</strong><small class="block-progress">${completed}/${children.length}</small></div><details class="block-details" data-block-details="${block.id}" ${HOUSEHOLD_OPEN_BLOCKS.has(block.id)?'open':''}><summary>Onderdelen</summary><div class="subtask-list">${children.map(item=>`<label class="subtask${isTaskDone(item)?' done':''}"><input type="checkbox" data-house-subtask="${item.id}" ${isTaskDone(item)?'checked':''}><span>${escapeHtml(item.title)}</span></label>`).join('')}</div></details></div></article>`}
function completeHousehold(item){item.completedPeriods=item.completedPeriods||[];if(item.repeat==='none')item.done=true;else{const key=periodKey(item.repeat);if(!item.completedPeriods.includes(key))item.completedPeriods.push(key)}if(item.id==='house-floor-whole-house'){['house-floor-downstairs','house-floor-upstairs'].forEach(id=>{const floor=entries.find(entry=>entry.id===id);if(!floor)return;floor.completedPeriods=floor.completedPeriods||[];const key=periodKey(floor.repeat);if(!floor.completedPeriods.includes(key))floor.completedPeriods.push(key)})}persist();renderHousehold()}
function setHouseholdCompletion(item,checked){item.completedPeriods=item.completedPeriods||[];if(item.repeat==='none')item.done=checked;else{const key=periodKey(item.repeat);if(checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}if(LONG_HOUSEHOLD_REPEATS.has(item.repeat)){if(checked){item.lastCompletedDate=todayKey();item.nextDueDate=nextHouseholdDueDate(item.repeat);item.manualWeekKey=''}else{item.lastCompletedDate='';item.nextDueDate='';item.manualWeekKey=periodKey('weekly')}}}
function bindHouseholdActions(){
  document.querySelectorAll('[data-block-details]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)HOUSEHOLD_OPEN_BLOCKS.add(details.dataset.blockDetails);else HOUSEHOLD_OPEN_BLOCKS.delete(details.dataset.blockDetails)}));
  document.querySelectorAll('[data-house-check]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.houseCheck);if(!item)return;if(input.checked&&item.id==='house-floor-whole-house'){completeHousehold(item);return}setHouseholdCompletion(item,input.checked);persist();renderHousehold()}));
  document.querySelectorAll('[data-house-subtask]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.houseSubtask);if(!item)return;setHouseholdCompletion(item,input.checked);persist();renderHousehold()}));
  document.querySelectorAll('[data-house-block]').forEach(input=>input.addEventListener('change',()=>{const block=HOUSEHOLD_BLOCKS.find(item=>item.id===input.dataset.houseBlock);if(!block)return;block.taskIds.map(id=>entries.find(entry=>entry.id===id)).filter(Boolean).forEach(item=>setHouseholdCompletion(item,input.checked));persist();renderHousehold()}));
  document.querySelectorAll('[data-house-postpone]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.housePostpone);if(!item)return;item.nextDueDate=addWeeksKey(currentWeekStartKey(),1);item.manualWeekKey='';persist();renderHousehold()}));
  document.querySelectorAll('[data-house-add]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.houseAdd);if(!item)return;if(TASK_LIST_HOUSEHOLD_REPEATS.has(item.repeat)){if(isTaskDone(item))setHouseholdCompletion(item,false);item.manualWeekKey=periodKey('weekly')}else if(WEEK_SCHEDULE_HOUSEHOLD_REPEATS.has(item.repeat)){if(scheduledHouseholdItems().length>=HOUSEHOLD_WEEK_LIMIT){alert('Er staan al 8 extra huishoudtaken voor deze week. Rond eerst een taak af of kies deze taak volgende week.');return}item.manualWeekKey=periodKey('weekly');item.nextDueDate=currentWeekStartKey()}else return;persist();render();renderHousehold()}));
}
function checklistItems(){return entries.filter(item=>item.type==='checklist')}
function checklistRepeatLabel(value){return ({daily:'Iedere dag',weekly:'Iedere week',biweekly:'Iedere 2 weken',fourweekly:'Iedere 4 weken',monthly:'Iedere maand',quarterly:'Ieder kwartaal',yearly:'Ieder jaar'})[value]||value}
function checklistMomentLabel(value){return ({morning:'ochtend',afternoon:'middag',evening:'avond'})[value]||'avond'}
function checklistMomentHour(value){return ({morning:6,afternoon:12,evening:18})[value]??18}
function checklistDate(value){return new Date(`${value}T12:00:00`)}
function daysInMonth(year,month){return new Date(year,month+1,0).getDate()}
function addChecklistMonths(date,months){const base=new Date(date);const day=base.getDate();const targetMonth=base.getMonth()+months;const year=base.getFullYear()+Math.floor(targetMonth/12);const month=((targetMonth%12)+12)%12;return new Date(year,month,Math.min(day,daysInMonth(year,month)),12)}
function addChecklistOccurrence(date,repeat){const next=new Date(date);if(repeat==='daily')next.setDate(next.getDate()+1);else if(repeat==='weekly')next.setDate(next.getDate()+7);else if(repeat==='biweekly')next.setDate(next.getDate()+14);else if(repeat==='fourweekly')next.setDate(next.getDate()+28);else if(repeat==='monthly')return addChecklistMonths(next,1);else if(repeat==='quarterly')return addChecklistMonths(next,3);else if(repeat==='yearly')return addChecklistMonths(next,12);else next.setDate(next.getDate()+7);return next}
function checklistOccurrencePair(item,targetKey=todayKey()){
  const target=checklistDate(targetKey);let current=checklistDate(item.date);if(Number.isNaN(current.getTime()))return {previous:null,next:null};
  if(current>target)return {previous:null,next:localDateKey(current)};
  let previous=current;let guard=0;
  while(guard++<5000){const upcoming=addChecklistOccurrence(previous,item.repeat);if(upcoming>target)return {previous:localDateKey(previous),next:localDateKey(upcoming)};previous=upcoming}
  return {previous:localDateKey(previous),next:null};
}
function checklistState(item,occurrence){item.checklistStates=item.checklistStates&&typeof item.checklistStates==='object'?item.checklistStates:{};const raw=item.checklistStates[occurrence]||{};return {checked:Array.isArray(raw.checked)?raw.checked:[],completed:Boolean(raw.completed)}}
function checklistSkipped(item,occurrence){return Array.isArray(item.skippedOccurrences)&&item.skippedOccurrences.includes(occurrence)}
function checklistOccurrenceDone(item,occurrence){return !occurrence||checklistSkipped(item,occurrence)||checklistState(item,occurrence).completed}
function daysBetween(a,b){return Math.round((checklistDate(b)-checklistDate(a))/86400000)}
function visibleChecklistOccurrence(item){
  const today=todayKey();const pair=checklistOccurrencePair(item,today);
  if(pair.previous&&!checklistOccurrenceDone(item,pair.previous))return pair.previous;
  const next=pair.next||(pair.previous&&item.repeat==='daily'?localDateKey(addChecklistOccurrence(checklistDate(pair.previous),item.repeat)):null);if(!next)return null;
  const showBefore=Math.max(0,Number(item.showBeforeDays||0));const until=daysBetween(today,next);if(until<0||until>showBefore)return null;
  if(until===showBefore&&showBefore>0&&new Date().getHours()<checklistMomentHour(item.showMoment))return null;
  if(until===0&&showBefore===0&&new Date().getHours()<checklistMomentHour(item.showMoment))return null;
  return checklistOccurrenceDone(item,next)?null:next;
}
function checklistDateLabel(value){const label=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(checklistDate(value));return label.charAt(0).toUpperCase()+label.slice(1)}
function checklistIntro(occurrence){const difference=daysBetween(todayKey(),occurrence);if(difference<0)return `Nog niet afgerond · gepland voor ${checklistDateLabel(occurrence)}`;if(difference===0)return 'Vandaag is deze checklist aan de beurt.';if(difference===1)return 'Morgen is deze checklist aan de beurt.';return `Over ${difference} dagen is deze checklist aan de beurt.`}
function renderRecurringChecklistCard(item,occurrence){const state=checklistState(item,occurrence);const tasks=Array.isArray(item.checklistTasks)?item.checklistTasks:[];const checked=new Set(state.checked.map(Number));return `<article class="hc-checklist-card" data-checklist-card="${escapeHtml(item.id)}"><header><span>HUIZE CHAOS</span><h3>${escapeHtml(item.title)}</h3></header><div class="hc-checklist-body"><strong class="hc-checklist-date">${escapeHtml(checklistDateLabel(occurrence))}</strong><p>${escapeHtml(checklistIntro(occurrence))}</p>${tasks.length?`<div class="hc-checklist-tasks">${tasks.map((task,index)=>`<label class="hc-checklist-task${checked.has(index)?' done':''}"><input type="checkbox" data-checklist-check="${escapeHtml(item.id)}" data-occurrence="${occurrence}" data-task-index="${index}" ${checked.has(index)?'checked':''}><span>${escapeHtml(task)}</span></label>`).join('')}</div>`:''}<div class="hc-checklist-actions">${tasks.length?'':`<button type="button" class="primary" data-checklist-complete="${escapeHtml(item.id)}" data-occurrence="${occurrence}">Afronden</button>`}<button type="button" class="secondary" data-checklist-edit="${escapeHtml(item.id)}">Wijzigen</button><button type="button" class="secondary" data-checklist-skip="${escapeHtml(item.id)}" data-occurrence="${occurrence}">Deze keer overslaan</button></div></div><footer><i></i><span>Een beetje orde in de chaos.</span></footer></article>`}
function renderRecurringChecklistLibrary(){
  if(!checklistEls.library)return;const items=checklistItems().sort((a,b)=>a.title.localeCompare(b.title,'nl'));
  checklistEls.library.innerHTML=items.length?items.map(item=>`<article class="checklist-library-item"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(checklistRepeatLabel(item.repeat))} · vanaf ${escapeHtml(checklistDateLabel(item.date))} · ${Number(item.showBeforeDays||0)===0?'op de dag zelf':`${Number(item.showBeforeDays)} ${Number(item.showBeforeDays)===1?'dag':'dagen'} ervoor`} (${escapeHtml(checklistMomentLabel(item.showMoment))})</small><small>${Array.isArray(item.checklistTasks)?item.checklistTasks.length:0} taken</small></div><div class="item-actions"><button class="icon-button" type="button" data-checklist-edit="${escapeHtml(item.id)}" aria-label="Checklist wijzigen">✎</button><button class="icon-button delete" type="button" data-checklist-delete="${escapeHtml(item.id)}" aria-label="Checklist verwijderen">×</button></div></article>`).join(''):'<div class="empty">Nog geen terugkerende checklists</div>';
}
function renderRecurringChecklists(){
  if(!checklistEls.today)return;const due=checklistItems().map(item=>({item,occurrence:visibleChecklistOccurrence(item)})).filter(row=>row.occurrence).sort((a,b)=>a.occurrence.localeCompare(b.occurrence));
  checklistEls.section.hidden=!due.length;checklistEls.today.innerHTML=due.map(row=>renderRecurringChecklistCard(row.item,row.occurrence)).join('');renderRecurringChecklistLibrary();bindRecurringChecklistActions();
}
function bindRecurringChecklistActions(){
  document.querySelectorAll('[data-checklist-check]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.checklistCheck&&entry.type==='checklist');if(!item)return;const occurrence=input.dataset.occurrence;const state=checklistState(item,occurrence);const index=Number(input.dataset.taskIndex);const checked=new Set(state.checked.map(Number));input.checked?checked.add(index):checked.delete(index);const total=Array.isArray(item.checklistTasks)?item.checklistTasks.length:0;item.checklistStates[occurrence]={checked:[...checked].sort((a,b)=>a-b),completed:total>0&&checked.size>=total};persist();renderRecurringChecklists()}));
  document.querySelectorAll('[data-checklist-edit]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.checklistEdit&&entry.type==='checklist');if(item)openChecklistModal(item)}));
  document.querySelectorAll('[data-checklist-delete]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.checklistDelete&&entry.type==='checklist');if(!item)return;if(confirm(`Checklist ‘${item.title}’ verwijderen?`)){entries=entries.filter(entry=>entry.id!==item.id);persist();render()}}));
  document.querySelectorAll('[data-checklist-skip]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.checklistSkip&&entry.type==='checklist');if(!item)return;const occurrence=button.dataset.occurrence;if(confirm(`‘${item.title}’ deze keer overslaan?`)){item.skippedOccurrences=[...new Set([...(item.skippedOccurrences||[]),occurrence])];persist();render()}}));
  document.querySelectorAll('[data-checklist-complete]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.checklistComplete&&entry.type==='checklist');if(!item)return;const occurrence=button.dataset.occurrence;item.checklistStates=item.checklistStates&&typeof item.checklistStates==='object'?item.checklistStates:{};item.checklistStates[occurrence]={checked:[],completed:true};persist();render()}));
}
function openChecklistModal(item=null){
  if(!checklistEls.modal)return;checklistEls.form.reset();checklistEls.id.value=item?.id||'';checklistEls.title.value=item?.title||'';checklistEls.startDate.value=item?.date||todayKey();checklistEls.repeat.value=item?.repeat||'fourweekly';checklistEls.showBefore.value=String(item?.showBeforeDays??1);checklistEls.showMoment.value=item?.showMoment||'evening';checklistEls.tasks.value=Array.isArray(item?.checklistTasks)?item.checklistTasks.join('\n'):'';checklistEls.modalTitle.textContent=item?'Terugkerende checklist wijzigen':'Terugkerende checklist toevoegen';openPlannerOverlay('checklist',checklistEls.modal)
}
function closeChecklistModal(direct=false){if(checklistEls.modal)closePlannerOverlay('checklist',checklistEls.modal,direct)}
function saveRecurringChecklist(event){event.preventDefault();const title=checklistEls.title.value.trim();const tasks=checklistEls.tasks.value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);if(!title)return;const existing=entries.find(entry=>entry.id===checklistEls.id.value&&entry.type==='checklist');const value={id:existing?.id||uid(),cloudId:existing?.cloudId||'',cloudScope:existing?.cloudScope||'',type:'checklist',date:checklistEls.startDate.value,deadline:'',urgent:false,category:'',visibility:'shared',title,time:'',endTime:'',personUid:'',personName:'',participants:[],note:'',done:false,repeat:checklistEls.repeat.value,completedPeriods:[],checklistTasks:tasks,showBeforeDays:Number(checklistEls.showBefore.value||0),showMoment:checklistEls.showMoment.value,checklistStates:existing?.checklistStates||{},skippedOccurrences:existing?.skippedOccurrences||[],createdAt:existing?.createdAt||Date.now()};if(existing)entries=entries.map(entry=>entry.id===existing.id?value:entry);else entries.push(value);persist();closeChecklistModal();render();showPlannerPage('routines')}

function deadlineInfo(item){
  if(!item.deadline)return '';
  const today=new Date(`${todayKey()}T12:00:00`);const deadline=new Date(`${item.deadline}T12:00:00`);const days=Math.round((deadline-today)/86400000);
  if(days<0)return `<span class="deadline-badge late">${Math.abs(days)} ${Math.abs(days)===1?'dag':'dagen'} te laat</span>`;
  if(days===0)return '<span class="deadline-badge today">Vandaag deadline</span>';
  if(days===1)return '<span class="deadline-badge soon">Morgen deadline</span>';
  return `<span class="deadline-badge">Nog ${days} dagen</span>`;
}

function render(){renderHouseholdTime();renderStudy();renderRecurringChecklists();
  const appointments=todayEntries('appointment').sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const tasks=[...todayEntries('task'),...todayHouseholdItems().map(item=>({...item,note:'',completedPeriods:householdTaskDueFromCompletion(item)?[]:item.completedPeriods}))].sort((a,b)=>Number(isTaskDone(a))-Number(isTaskDone(b))||Number(Boolean(b.urgent))-Number(Boolean(a.urgent))||(a.deadline||'9999-12-31').localeCompare(b.deadline||'9999-12-31')||a.createdAt-b.createdAt);const big=currentBigChore();if(big)tasks.push(big);
  const futureEntries=entries.filter(item=>(item.type==='appointment'||item.type==='task')&&item.date>todayKey()).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'));
  const weekEndKey=currentWeekEndKey();
  const upcoming=futureEntries.filter(item=>item.category!=='work'||item.date<=weekEndKey);const bigUpcoming=upcomingBigChore();if(bigUpcoming)upcoming.push(bigUpcoming);upcoming.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'));upcoming.splice(8);
  const query=els.appointmentSearch.value.trim().toLocaleLowerCase('nl-NL');
  if(query){const found=entries.filter(item=>item.type==='appointment'&&[item.title,item.note,...participantNames(item)].join(' ').toLocaleLowerCase('nl-NL').includes(query)).sort(appointmentSearchSort).slice(0,30);els.appointmentSearchStatus.textContent=`${found.length} ${found.length===1?'afspraak':'afspraken'} gevonden`;els.appointments.innerHTML=found.length?found.map(renderUpcoming).join(''):'<div class="empty">Geen afspraak gevonden</div>'}else{els.appointmentSearchStatus.textContent='';els.appointments.innerHTML=appointments.length?appointments.map(renderAppointment).join(''):'<div class="empty">Geen afspraken voor vandaag</div>'}
  els.tasks.innerHTML=tasks.length?tasks.map(renderTask).join(''):'<div class="empty">Nog geen taken voor vandaag</div>';
  els.upcoming.innerHTML=upcoming.length?upcoming.map(renderUpcoming).join(''):'<div class="empty">Geen geplande items</div>';
  const done=tasks.filter(isTaskDone).length;els.progress.textContent=tasks.length?`${done} van ${tasks.length} afgerond`:'';
  bindItemActions();
}
function appointmentSearchSort(a,b){const aFuture=a.date>=todayKey(),bFuture=b.date>=todayKey();if(aFuture!==bFuture)return aFuture?-1:1;return aFuture?a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'):b.date.localeCompare(a.date)||(a.time||'99:99').localeCompare(b.time||'99:99')}
function privacyBadge(item){return item.visibility==='private'?'<span class="private-badge">Privé</span>':''}
function schoolBadge(item){return item.category==='school'?'<span class="school-badge">School</span>':''}
function firstName(value=''){return String(value).trim().split(/\s+/)[0]||''}
function addedByLine(item){const name=firstName(item.addedByName),current=firstName(window.huizeChaosPlannerUserName);return name&&name.toLocaleLowerCase('nl-NL')!==current.toLocaleLowerCase('nl-NL')?`<small class="added-by">Toegevoegd door ${escapeHtml(name)}</small>`:''}
function appointmentTime(item){return item.time?`${item.time}${item.endTime?'–'+item.endTime:''}`:'—'}
function participantNames(item){if(Array.isArray(item.participants)&&item.participants.length)return item.participants;if(item.personName)return [firstName(item.personName)];if(item.addedByName)return [firstName(item.addedByName)];return []}
function participantsLine(item){const names=participantNames(item);return names.length?`<small class="participants">Voor: ${escapeHtml(names.join(' + '))}</small>`:''}
function renderAppointment(item){const work=item.category==='work';return `<article class="planner-item"><span class="time-badge">${escapeHtml(appointmentTime(item))}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${!work?participantsLine(item):''}${addedByLine(item)}${work?`<span class="work-badge">${item.title==='School'?'School':'Werk'}</span>`:''}${schoolBadge(item)}${privacyBadge(item)}</div>${actionButtons(item.id,false,Boolean(item.time),true)}</article>`}
function repeatLabel(value){return ({weekly:'Deze week',biweekly:'Deze twee weken',monthly:'Deze maand',bimonthly:'Deze twee maanden',quarterly:'Dit kwartaal',seasonal:'Dit seizoen',semiannual:'Dit halfjaar',yearly:'Dit jaar',none:'Eenmalig'})[value]||''}
function renderTask(item){const done=isTaskDone(item);return `<article class="planner-item compact-task-card${done?' done':''}"><input class="check" type="checkbox" data-check="${item.id}" aria-label="Taak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${addedByLine(item)}<div class="task-statuses">${item.urgent?'<span class="urgent-badge">Urgent</span>':''}${schoolBadge(item)}${privacyBadge(item)}${deadlineInfo(item)}${item.repeat&&item.repeat!=='none'?`<span class="repeat-badge">${repeatLabel(item.repeat)}</span>`:''}</div></div>${item._big?bigActionButtons():taskActionMenu(item.id)}</article>`}
function renderUpcoming(item){const date=new Date(`${item.date}T12:00:00`);const label=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(date);const details=item.time?`${appointmentTime(item)} uur${item.note?' · '+item.note:''}`:item.note||'';const work=item.category==='work';return `<article class="planner-item"><span class="upcoming-date">${escapeHtml(label)}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(details)}</small>${item.type==='appointment'&&!work?participantsLine(item):''}${work?`<span class="work-badge">${item.title==='School'?'School':'Werk'}</span>`:''}${schoolBadge(item)}${privacyBadge(item)}${item.type==='task'?deadlineInfo(item):''}</div>${item._bigUpcoming?'':actionButtons(item.id,false,item.type==='appointment'&&Boolean(item.time),item.type==='appointment')}</article>`}
function actionButtons(id,snooze=false,calendar=false,share=false){return `<div class="item-actions">${snooze?`<button class="icon-button snooze-button" type="button" data-snooze="${id}" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button>`:''}${share?`<button class="icon-button" type="button" data-share-appointment="${id}" aria-label="Afspraak delen" title="Afspraak delen">↗</button>`:''}${calendar?`<button class="icon-button calendar-button" type="button" data-calendar="${id}" aria-label="In telefoonagenda zetten" title="In telefoonagenda zetten">▣</button>`:''}<button class="icon-button" type="button" data-edit="${id}" aria-label="Wijzigen">✎</button><button class="icon-button delete" type="button" data-delete="${id}" aria-label="Verwijderen">×</button></div>`}
function taskActionMenu(id){return `<details class="item-menu"><summary aria-label="Taakacties" title="Taakacties">⋮</summary><div class="item-menu-popover"><button type="button" data-snooze="${id}">Doorschuiven</button><button type="button" data-edit="${id}">Wijzigen</button><button type="button" data-delete="${id}" class="delete">Verwijderen</button></div></details>`}
function bigActionButtons(){return `<div class="item-actions"><button class="icon-button snooze-button" type="button" data-big-snooze="1" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button></div>`}
function bindItemActions(){
  document.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{if(input.dataset.check==='big-chore-current'){const state=getBigState();state.index+=1;state.snoozeUntil='';saveBigState(state);render();return}const item=entries.find(entry=>entry.id===input.dataset.check);if(!item)return;if(item.category==='household'&&TASK_LIST_HOUSEHOLD_REPEATS.has(item.repeat)){setHouseholdCompletion(item,input.checked);persist();render();renderHousehold();return}if(item.repeat&&item.repeat!=='none'){item.completedPeriods=item.completedPeriods||[];const key=periodKey(item.repeat);if(input.checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!input.checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}else item.done=input.checked;persist();render()}));
  document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>editEntry(button.dataset.edit)));
  document.querySelectorAll('[data-share-appointment]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.shareAppointment);if(item)shareAppointment(item)}));
  document.querySelectorAll('[data-calendar]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.calendar);if(item)downloadCalendar([item],`${item.title.toLowerCase().replace(/[^a-z0-9]+/gi,'-')||'afspraak'}.ics`)}));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>openDeleteModal(button.dataset.delete)));
  document.querySelectorAll('[data-snooze]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.snooze);if(!item)return;const tomorrow=tomorrowKey();if(item.deadline&&tomorrow>item.deadline){alert('Deze taak kan niet voorbij de deadline worden doorgeschoven.');return}if(item.urgent&&!confirm('Deze taak is urgent. Toch doorschuiven naar morgen?'))return;item.date=tomorrow;persist();render()}));
  document.querySelectorAll('[data-big-snooze]').forEach(button=>button.addEventListener('click',()=>{const state=getBigState();state.snoozeUntil=tomorrowKey();saveBigState(state);render()}));
}
async function shareAppointment(item){const date=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${item.date}T12:00:00`));const names=participantNames(item);const lines=[date,item.time?`${appointmentTime(item)} uur`:'',names.length?`Voor: ${names.join(' en ')}`:'',item.note||''].filter(Boolean);const text=[item.title,...lines].join('\n');await shareWithCard(item.title,lines,text,`${item.title.toLowerCase().replace(/[^a-z0-9]+/gi,'-')||'afspraak'}.png`)}
function openDeleteModal(id){const item=entries.find(entry=>entry.id===id);if(!item)return;pendingDeleteId=id;document.getElementById('deleteTitle').textContent=`${item.type==='appointment'?'Afspraak':'Taak'} verwijderen?`;document.getElementById('deleteText').textContent=`Weet je zeker dat je ‘${item.title}’ wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`;document.getElementById('deleteLinkedText').hidden=!(item.type==='appointment'&&entries.some(entry=>entry.linkedAppointmentId===id));openPlannerOverlay('delete',deleteModal);setTimeout(()=>document.getElementById('cancelDelete').focus(),0)}
function closeDeleteModal(direct=false){pendingDeleteId='';closePlannerOverlay('delete',deleteModal,direct)}
function confirmDeleteEntry(){if(!pendingDeleteId)return;const id=pendingDeleteId;const appointment=entries.find(item=>item.id===id&&item.type==='appointment');entries=entries.filter(item=>item.id!==id).map(item=>item.linkedAppointmentId===id?{...item,title:'School informeren dat de ziekenhuisafspraak niet doorgaat',date:todayKey(),deadline:todayKey(),urgent:true,done:false,completedPeriods:[],linkedAppointmentId:'',note:appointment?`Ziekenhuisafspraak op ${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long'}).format(new Date(`${appointment.date}T12:00:00`))} gaat niet door`:'Ziekenhuisafspraak gaat niet door'}:item);persist();closeDeleteModal();render()}
async function shareWithCard(title,lines,text,fileName){try{const file=await createShareCard(title,lines,fileName);if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title,text});return}}catch(error){if(error.name==='AbortError')return}if(navigator.share){try{await navigator.share({title,text});return}catch(error){if(error.name==='AbortError')return}}window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener')}
function createShareCard(title,lines,fileName){return new Promise((resolve,reject)=>{const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const context=canvas.getContext('2d');if(!context){reject(new Error('Canvas niet beschikbaar'));return}context.fillStyle='#f7f3fb';context.fillRect(0,0,1080,1080);roundedRect(context,60,60,960,960,48);context.fillStyle='#ffffff';context.fill();roundedRect(context,60,60,960,245,48);context.fillStyle='#957ac1';context.fill();context.fillStyle='#ffffff';context.font='700 38px system-ui, sans-serif';context.fillText('HUIZE CHAOS',110,135);context.font='700 58px system-ui, sans-serif';const titleLines=wrapCanvasText(context,title,850);titleLines.slice(0,2).forEach((line,index)=>context.fillText(line,110,205+index*65));context.fillStyle='#2d2d37';context.font='600 43px system-ui, sans-serif';let y=365;lines.forEach(line=>{wrapCanvasText(context,line,850).slice(0,3).forEach(part=>{context.fillText(part,110,y);y+=58});y+=22});context.fillStyle='#3fa7a3';context.fillRect(110,940,170,10);context.fillStyle='#74707a';context.font='500 28px system-ui, sans-serif';context.fillText('Een beetje orde in de chaos.',110,985);canvas.toBlob(blob=>blob?resolve(new File([blob],fileName,{type:'image/png'})):reject(new Error('Afbeelding maken mislukt')),'image/png')})}
function roundedRect(context,x,y,width,height,radius){context.beginPath();context.moveTo(x+radius,y);context.lineTo(x+width-radius,y);context.quadraticCurveTo(x+width,y,x+width,y+radius);context.lineTo(x+width,y+height-radius);context.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);context.lineTo(x+radius,y+height);context.quadraticCurveTo(x,y+height,x,y+height-radius);context.lineTo(x,y+radius);context.quadraticCurveTo(x,y,x+radius,y);context.closePath()}
function wrapCanvasText(context,text,maxWidth){const words=String(text).split(/\s+/);const lines=[];let line='';words.forEach(word=>{const test=line?`${line} ${word}`:word;if(context.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});if(line)lines.push(line);return lines}
function setType(type){els.type.value=type;document.querySelectorAll('[data-type]').forEach(button=>button.classList.toggle('active',button.dataset.type===type));const task=type==='task';els.timeField.hidden=task;els.endTimeField.hidden=task;els.workQuickField.hidden=task;els.participantsField.hidden=task;els.schoolTaskField.hidden=task;els.hasDeadlineField.hidden=!task;els.deadlineField.hidden=!task||!els.hasDeadline.checked;els.urgentField.hidden=!task;els.repeatField.hidden=!task;els.modalTitle.textContent=`${task?'Taak':'Afspraak'} ${els.id.value?'wijzigen':'toevoegen'}`;els.titleLabel.textContent=task?'Wat moet er gebeuren? *':'Welke afspraak? *'}
function openModal(type,item=null){els.form.reset();els.id.value=item?.id||'';els.category.value=item?.category||'';els.title.value=item?.title||'';els.time.value=item?.time||'';els.endTime.value=item?.endTime||'';els.entryDate.value=item?.date||todayKey();els.participants.value=Array.isArray(item?.participants)&&item.participants.length?item.participants.join(', '):firstName(window.huizeChaosPlannerUserName||'');els.schoolTask.checked=Boolean(item&&entries.some(entry=>entry.linkedAppointmentId===item.id));els.hasDeadline.checked=Boolean(item?.deadline);els.deadline.value=item?.deadline||'';els.urgent.checked=Boolean(item?.urgent);els.school.checked=item?.category==='school';els.private.checked=item?.visibility==='private'||els.school.checked;els.private.disabled=els.school.checked;els.repeat.value=item?.repeat||'none';els.note.value=item?.note||'';document.querySelectorAll('[data-shift]').forEach(button=>button.classList.toggle('active',item?.category==='work'&&button.dataset.start===item?.time&&button.dataset.end===item?.endTime));setType(type);openPlannerOverlay('entry',els.modal)}
function closeModal(direct=false){closePlannerOverlay('entry',els.modal,direct)}
function editEntry(id){const item=entries.find(entry=>entry.id===id);if(item)openModal(item.type,item)}
function parseParticipants(value){return [...new Set(String(value||'').split(',').map(firstName).filter(Boolean))]}
function minutes(value){if(!value)return null;const [hour,minute]=value.split(':').map(Number);return hour*60+minute}
function appointmentsOverlap(candidate,other){if(candidate.date!==other.date||!candidate.time||!other.time)return false;const startA=minutes(candidate.time),endA=minutes(candidate.endTime)??startA+60,startB=minutes(other.time),endB=minutes(other.endTime)??startB+60;return startA<endB&&startB<endA}
function sharedParticipant(a,b){const namesA=new Set(participantNames(a).map(name=>firstName(name).toLocaleLowerCase('nl-NL')));return participantNames(b).some(name=>namesA.has(firstName(name).toLocaleLowerCase('nl-NL')))}
function conflictWarning(candidate){const conflicts=entries.filter(item=>item.type==='appointment'&&item.id!==candidate.id&&appointmentsOverlap(candidate,item)&&sharedParticipant(candidate,item));if(!conflicts.length)return true;const lines=conflicts.slice(0,3).map(item=>`${item.title} (${appointmentTime(item)})`).join('\n');return confirm(`Mogelijk conflict voor ${participantNames(candidate).join(' en ')} met:\n${lines}\n\nToch opslaan?`)}
function syncSchoolTask(appointment,enabled){const existing=entries.find(item=>item.linkedAppointmentId===appointment.id);if(!enabled){if(existing)entries=entries.filter(item=>item.id!==existing.id);return}const task={id:existing?.id||uid(),cloudId:existing?.cloudId||'',cloudScope:existing?.cloudScope||'',type:'task',date:todayKey(),deadline:appointment.date,urgent:true,category:'',visibility:appointment.visibility,title:'School informeren over de ziekenhuisafspraak',time:'',endTime:'',personUid:'',personName:'',participants:appointment.participants,note:`Ziekenhuisafspraak op ${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'long'}).format(new Date(`${appointment.date}T12:00:00`))}`,done:existing?.done||false,repeat:'none',completedPeriods:[],linkedAppointmentId:appointment.id,createdAt:existing?.createdAt||Date.now()};if(existing)entries=entries.map(item=>item.id===existing.id?task:item);else entries.push(task)}
function saveEntry(event){event.preventDefault();const title=els.title.value.trim();if(!title)return;const deadline=els.type.value==='task'&&els.hasDeadline.checked?els.deadline.value:'';if(els.type.value==='task'&&els.hasDeadline.checked&&!deadline){alert('Kies een deadline.');return}if(deadline&&deadline<els.entryDate.value){alert('De deadline kan niet vóór de startdatum liggen.');return}const existing=entries.find(item=>item.id===els.id.value);const school=window.huizeChaosPlannerRole==='owner'&&els.school.checked;const category=school?'school':els.type.value==='appointment'&&els.category.value==='work'?'work':'';const visibility=window.huizeChaosPlannerRole==='owner'&&(els.private.checked||school)?'private':'shared';const participants=els.type.value==='appointment'?parseParticipants(els.participants.value):existing?.participants||[];if(els.type.value==='appointment'&&!participants.length){alert('Vul minimaal één persoon in bij Voor wie?');return}const value={id:existing?.id||uid(),cloudId:existing?.cloudId||'',cloudScope:existing?.cloudScope||'',type:els.type.value,date:els.entryDate.value,deadline,urgent:els.type.value==='task'&&els.urgent.checked,category,visibility,title,time:els.type.value==='appointment'?els.time.value:'',endTime:els.type.value==='appointment'?els.endTime.value:'',personUid:category==='work'?(existing?.personUid||window.huizeChaosPlannerUserUid||''):'',personName:category==='work'?(existing?.personName||window.huizeChaosPlannerUserName||'Gezinslid'):'',participants,note:els.note.value.trim(),done:existing?.done||false,repeat:els.type.value==='task'?els.repeat.value:'none',completedPeriods:existing?.completedPeriods||[],createdAt:existing?.createdAt||Date.now()};if(value.type==='appointment'&&!conflictWarning(value))return;if(existing)entries=entries.map(item=>item.id===existing.id?value:item);else entries.push(value);if(value.type==='appointment')syncSchoolTask(value,els.schoolTask.checked);persist();closeModal();render()}

window.getHuizeChaosPlannerEntries=()=>entries;
window.replaceHuizeChaosPlannerEntries=next=>{const obsoleteIds=new Set(['house-weekly-0','house-weekly-1','house-weekly-2','house-weekly-3','house-weekly-4']);entries=normalizePlannerEntries(next.filter(item=>!obsoleteIds.has(item.id)));localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));initializeHouseholdWeekSchedule();balanceHouseholdWeekSchedule();render()};
window.applyHuizeChaosPlannerRole=role=>{window.huizeChaosPlannerRole=role;els.privateField.hidden=role!=='owner';els.schoolField.hidden=role!=='owner';if(role!=='owner'){els.private.checked=false;els.school.checked=false}};
window.applyHuizeChaosBigState=state=>{localStorage.setItem(BIG_STATE_KEY,JSON.stringify(state));render()};
