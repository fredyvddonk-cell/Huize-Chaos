const STORAGE_KEY='huizeChaosPlannerV130';
const SEED_KEY='huizeChaosCarTasksV131';
const HOUSE_SEED_KEY='huizeChaosHouseTasksV138';
const ROUTINE_KEY='huizeChaosDailyRoutinesV132';
const BIG_STATE_KEY='huizeChaosBigChoreV132';
const DEADLINE_SEED_KEY='huizeChaosOldCarDeadlineV133';
const ROUTINES=['Keukenreset','Vaatwasser','Woonkamer opruimen','Was bijwerken'];
const BIG_CHORES=[];
const WASTE_SCHEDULES=[
  {type:'Papier',firstFriday:'2026-08-21',regular:'Deze week al het oud papier bij het oud papier leggen',lastDay:'Vandaag laatste dag: al het oud papier bij het oud papier leggen'},
  {type:'Restafval',firstFriday:'2026-09-11',regular:'Deze week al het restafval in de restafvalkliko doen',lastDay:'Vandaag laatste dag: al het restafval in de restafvalkliko doen'}
];
const HOUSEHOLD_GROUPS={weekly:'Iedere week',biweekly:'Iedere twee weken',monthly:'Iedere maand',bimonthly:'Iedere twee maanden',quarterly:'Ieder kwartaal',semiannual:'Twee keer per jaar',yearly:'Ieder jaar',once:'Eenmalig'};
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
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
let entries=loadEntries();

const els={date:document.getElementById('todayDate'),wastePanel:document.getElementById('wasteReminderPanel'),wasteTitle:document.getElementById('wasteReminderTitle'),wasteText:document.getElementById('wasteReminderText'),appointments:document.getElementById('appointmentList'),tasks:document.getElementById('taskList'),progress:document.getElementById('taskProgress'),upcoming:document.getElementById('upcomingList'),routines:document.getElementById('routineList'),householdDue:document.getElementById('householdDueList'),householdLibrary:document.getElementById('householdLibrary'),todayPage:document.getElementById('todayPage'),routinesPage:document.getElementById('routinesPage'),householdPage:document.getElementById('householdPage'),modal:document.getElementById('entryModal'),form:document.getElementById('entryForm'),id:document.getElementById('entryId'),type:document.getElementById('entryType'),category:document.getElementById('entryCategory'),title:document.getElementById('entryTitle'),time:document.getElementById('entryTime'),endTime:document.getElementById('entryEndTime'),entryDate:document.getElementById('entryDate'),hasDeadline:document.getElementById('entryHasDeadline'),deadline:document.getElementById('entryDeadline'),urgent:document.getElementById('entryUrgent'),private:document.getElementById('entryPrivate'),school:document.getElementById('entrySchool'),repeat:document.getElementById('entryRepeat'),note:document.getElementById('entryNote'),timeField:document.getElementById('timeField'),endTimeField:document.getElementById('endTimeField'),workQuickField:document.getElementById('workQuickField'),hasDeadlineField:document.getElementById('hasDeadlineField'),deadlineField:document.getElementById('deadlineField'),urgentField:document.getElementById('urgentField'),privateField:document.getElementById('privateField'),schoolField:document.getElementById('schoolField'),repeatField:document.getElementById('repeatField'),modalTitle:document.getElementById('modalTitle'),titleLabel:document.getElementById('titleLabel'),rosterModal:document.getElementById('rosterModal'),rosterForm:document.getElementById('rosterForm'),rosterWeek:document.getElementById('rosterWeek'),rosterDays:document.getElementById('rosterDays')};

seedCarPlanning();
seedHouseholdPlanning();
seedOldCarDeadline();
els.date.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
renderWasteReminder();
render();

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.add)));
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>setType(button.dataset.type)));
document.getElementById('cancelEntry').addEventListener('click',closeModal);
els.modal.addEventListener('click',event=>{if(event.target===els.modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
els.form.addEventListener('submit',saveEntry);
els.hasDeadline.addEventListener('change',()=>{els.deadlineField.hidden=!els.hasDeadline.checked;if(!els.hasDeadline.checked)els.deadline.value='' });
els.school.addEventListener('change',()=>{if(els.school.checked){els.private.checked=true;els.category.value='';document.querySelectorAll('[data-shift]').forEach(item=>item.classList.remove('active'))}els.private.disabled=els.school.checked});
document.querySelectorAll('[data-shift]').forEach(button=>button.addEventListener('click',()=>{els.category.value='work';els.school.checked=false;els.private.disabled=false;els.title.value=button.dataset.shift;els.time.value=button.dataset.start;els.endTime.value=button.dataset.end;document.querySelectorAll('[data-shift]').forEach(item=>item.classList.toggle('active',item===button))}));
document.querySelectorAll('[data-planner-page]').forEach(button=>button.addEventListener('click',()=>showPlannerPage(button.dataset.plannerPage)));
document.getElementById('openRoster').addEventListener('click',openRosterModal);
document.getElementById('cancelRoster').addEventListener('click',closeRosterModal);
document.getElementById('exportRoster').addEventListener('click',exportRosterCalendar);
els.rosterModal.addEventListener('click',event=>{if(event.target===els.rosterModal)closeRosterModal()});
els.rosterWeek.addEventListener('change',renderRosterDays);
els.rosterForm.addEventListener('submit',saveRoster);

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
function showPlannerPage(page){
  els.todayPage.hidden=page!=='today';els.routinesPage.hidden=page!=='routines';els.householdPage.hidden=page!=='household';
  document.querySelectorAll('[data-planner-page]').forEach(button=>button.classList.toggle('active',button.dataset.plannerPage===page));
  if(page==='routines')renderRoutines();
  if(page==='household')renderHousehold();
}
function tomorrowKey(){const date=new Date();date.setDate(date.getDate()+1);return localDateKey(date)}
function wasteReminderForDate(date=new Date()){
  const day=date.getDay();if(day===0||day===5||day===6)return null;
  const friday=new Date(date);friday.setHours(12,0,0,0);friday.setDate(date.getDate()+(5-day));
  return WASTE_SCHEDULES.find(schedule=>{const first=new Date(`${schedule.firstFriday}T12:00:00`);const days=Math.round((friday-first)/86400000);return days>=0&&days%28===0})||null;
}
function renderWasteReminder(){const schedule=wasteReminderForDate();els.wastePanel.hidden=!schedule;if(!schedule)return;els.wasteTitle.textContent=`${schedule.type} wordt vrijdag opgehaald`;els.wasteText.textContent=new Date().getDay()===4?schedule.lastDay:schedule.regular}
const SHIFTS={day:{title:'Dagdienst',start:'07:00',end:'13:30'},longday:{title:'Lange dagdienst',start:'07:00',end:'15:30'},shortday:{title:'Korte dagdienst',start:'07:00',end:'11:00'},evening:{title:'Avonddienst',start:'15:15',end:'22:45'},shortevening:{title:'Korte avonddienst',start:'16:30',end:'21:30'},free:{title:'Vrij',start:'',end:''}};
function isoWeekValue(date=new Date()){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return `${d.getUTCFullYear()}-W${String(Math.ceil((((d-start)/86400000)+1)/7)).padStart(2,'0')}`}
function mondayFromWeek(value){const [year,week]=value.split('-W').map(Number);const jan4=new Date(year,0,4,12);const monday=new Date(jan4);monday.setDate(jan4.getDate()-(jan4.getDay()||7)+1+(week-1)*7);return monday}
function rosterOwnerMatches(item){const current=window.huizeChaosPlannerUserUid||'';return item.personUid===current||(!item.personUid&&window.huizeChaosPlannerRole==='owner')}
function shiftKey(item){if(!item)return '';for(const [key,shift] of Object.entries(SHIFTS))if(item.title===shift.title&&item.time===shift.start&&item.endTime===shift.end)return key;return 'custom'}
function openRosterModal(){els.rosterWeek.value=isoWeekValue();renderRosterDays();els.rosterModal.classList.add('open');els.rosterModal.setAttribute('aria-hidden','false')}
function closeRosterModal(){els.rosterModal.classList.remove('open');els.rosterModal.setAttribute('aria-hidden','true')}
function renderRosterDays(){
  if(!els.rosterWeek.value)return;const monday=mondayFromWeek(els.rosterWeek.value);const names=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
  els.rosterDays.innerHTML=names.map((name,index)=>{const date=new Date(monday);date.setDate(monday.getDate()+index);const key=localDateKey(date);const item=entries.find(entry=>entry.category==='work'&&entry.date===key&&rosterOwnerMatches(entry));const selected=shiftKey(item);const options=[['','Geen invoer'],['day','Dag 07.00–13.30'],['longday','Lang 07.00–15.30'],['shortday','Kort 07.00–11.00'],['evening','Avond 15.15–22.45'],['shortevening','Kort avond 16.30–21.30'],['free','Vrij'],['custom','Andere tijd']].map(([value,label])=>`<option value="${value}" ${selected===value?'selected':''}>${label}</option>`).join('');return `<div class="roster-row" data-roster-date="${key}"><div><strong>${name}</strong><small>${new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(date)}</small></div><select aria-label="Dienst op ${name}">${options}</select><div class="custom-times" ${selected==='custom'?'':'hidden'}><input type="time" class="roster-start" value="${escapeHtml(item?.time||'')}" aria-label="Begintijd ${name}"><input type="time" class="roster-end" value="${escapeHtml(item?.endTime||'')}" aria-label="Eindtijd ${name}"></div></div>`}).join('');
  els.rosterDays.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{select.closest('.roster-row').querySelector('.custom-times').hidden=select.value!=='custom'}));
}
function collectRosterChoices(){return [...els.rosterDays.querySelectorAll('.roster-row')].map(row=>{const choice=row.querySelector('select').value;if(!choice)return null;const shift=choice==='custom'?{title:'Andere dienst',start:row.querySelector('.roster-start').value,end:row.querySelector('.roster-end').value}:SHIFTS[choice];return {date:row.dataset.rosterDate,...shift}}).filter(Boolean)}
function saveRoster(event){event.preventDefault();const currentUid=window.huizeChaosPlannerUserUid||'';const currentName=window.huizeChaosPlannerUserName||'Gezinslid';const choices=collectRosterChoices();els.rosterDays.querySelectorAll('.roster-row').forEach(row=>{entries=entries.filter(item=>!(item.category==='work'&&item.date===row.dataset.rosterDate&&rosterOwnerMatches(item)))});choices.forEach(shift=>entries.push({id:uid(),cloudId:'',cloudScope:'',type:'appointment',date:shift.date,deadline:'',urgent:false,category:'work',visibility:'shared',title:shift.title,time:shift.start,endTime:shift.end,personUid:currentUid,personName:currentName,note:'',done:false,repeat:'none',completedPeriods:[],createdAt:Date.now()}));persist();closeRosterModal();render()}
function icsEscape(value=''){return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function icsDate(date,time){return `${date.replaceAll('-','')}T${time.replace(':','')}00`}
function calendarText(items){const events=items.filter(item=>item.type==='appointment'&&item.time).map(item=>['BEGIN:VEVENT',`UID:${item.id}@huize-chaos`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=Europe/Amsterdam:${icsDate(item.date,item.time)}`,item.endTime?`DTEND;TZID=Europe/Amsterdam:${icsDate(item.date,item.endTime)}`:'DURATION:PT1H',`SUMMARY:${icsEscape(item.title)}`,item.note?`DESCRIPTION:${icsEscape(item.note)}`:'', 'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(item.title)} begint over 1 uur`,'END:VALARM','END:VEVENT'].filter(Boolean).join('\r\n')).join('\r\n');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Huize Chaos//Gezinsplanner//NL','CALSCALE:GREGORIAN','METHOD:PUBLISH',events,'END:VCALENDAR'].join('\r\n')}
function downloadCalendar(items,name){const blob=new Blob([calendarText(items)],{type:'text/calendar;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
function exportRosterCalendar(){const choices=collectRosterChoices().filter(item=>item.start).map(item=>({id:uid(),type:'appointment',...item,time:item.start,endTime:item.end,note:'Werkrooster'}));if(!choices.length){alert('Kies eerst minimaal één dienst met een begintijd.');return}downloadCalendar(choices,`werkrooster-${els.rosterWeek.value}.ics`)}
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
function todayEntries(type){return entries.filter(item=>{if(item.type!==type||item.category==='household')return false;if(type==='appointment')return item.date===todayKey();if(item.date>todayKey())return false;if(item.repeat&&item.repeat!=='none')return true;return item.date===todayKey()||!isTaskDone(item)})}
function householdItems(){return entries.filter(item=>item.type==='task'&&item.category==='household')}
function renderHousehold(){
  const items=householdItems();const byId=new Map(items.map(item=>[item.id,item]));const blockIds=new Set(HOUSEHOLD_BLOCKS.flatMap(block=>block.taskIds));
  const floor=byId.get('house-floor-downstairs');const cards=[];
  if(floor)cards.push(renderHouseholdTask(floor,true));
  HOUSEHOLD_BLOCKS.forEach(block=>{const children=block.taskIds.map(id=>byId.get(id)).filter(Boolean);if(children.length)cards.push(renderHouseholdBlock(block,children))});
  const extra=items.find(item=>!blockIds.has(item.id)&&item.id!=='house-floor-downstairs'&&!isTaskDone(item));
  if(extra)cards.push(`<div class="extra-chore-label">Eén extra klus voor nu</div>${renderHouseholdTask(extra)}`);
  els.householdDue.innerHTML=cards.length?cards.join(''):'<div class="empty">Alle huishoudtaken voor deze periode zijn gedaan</div>';
  els.householdLibrary.innerHTML=Object.entries(HOUSEHOLD_GROUPS).map(([key,label])=>{const repeat=key==='once'?'none':key;const group=items.filter(item=>(item.repeat||'none')===repeat);if(!group.length)return '';return `<details><summary>${escapeHtml(label)} <span>${group.length}</span></summary><div class="library-list">${group.map(item=>`<div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note||'')}</small></div>`).join('')}</div></details>`}).join('');
  bindHouseholdActions();
}
function renderHouseholdTask(item,keepVisible=false){const done=isTaskDone(item);return `<article class="planner-item${done?' done':''}${keepVisible?' household-main':''}"><input class="check" type="checkbox" data-house-check="${item.id}" aria-label="Huishoudtaak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note||'')}</small><span class="repeat-badge">${escapeHtml(repeatLabel(item.repeat))}</span></div></article>`}
function renderHouseholdBlock(block,children){const done=children.every(isTaskDone);const completed=children.filter(isTaskDone).length;return `<article class="planner-item household-block${done?' done':''}"><input class="check" type="checkbox" data-house-block="${block.id}" aria-label="Huishoudblok afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(block.title)}</strong><small>${completed} van ${children.length} gedaan</small><span class="repeat-badge">${escapeHtml(repeatLabel(block.repeat))}</span><details class="block-details" data-block-details="${block.id}" ${HOUSEHOLD_OPEN_BLOCKS.has(block.id)?'open':''}><summary>Bekijk wat erbij hoort</summary><div class="subtask-list">${children.map(item=>`<label class="subtask${isTaskDone(item)?' done':''}"><input type="checkbox" data-house-subtask="${item.id}" ${isTaskDone(item)?'checked':''}><span>${escapeHtml(item.title)}</span></label>`).join('')}</div></details></div></article>`}
function completeHousehold(item){item.completedPeriods=item.completedPeriods||[];if(item.repeat==='none')item.done=true;else{const key=periodKey(item.repeat);if(!item.completedPeriods.includes(key))item.completedPeriods.push(key)}if(item.id==='house-floor-whole-house'){['house-floor-downstairs','house-floor-upstairs'].forEach(id=>{const floor=entries.find(entry=>entry.id===id);if(!floor)return;floor.completedPeriods=floor.completedPeriods||[];const key=periodKey(floor.repeat);if(!floor.completedPeriods.includes(key))floor.completedPeriods.push(key)})}persist();renderHousehold()}
function setHouseholdCompletion(item,checked){item.completedPeriods=item.completedPeriods||[];if(item.repeat==='none')item.done=checked;else{const key=periodKey(item.repeat);if(checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}}
function bindHouseholdActions(){
  document.querySelectorAll('[data-block-details]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)HOUSEHOLD_OPEN_BLOCKS.add(details.dataset.blockDetails);else HOUSEHOLD_OPEN_BLOCKS.delete(details.dataset.blockDetails)}));
  document.querySelectorAll('[data-house-check]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.houseCheck);if(!item)return;if(input.checked&&item.id==='house-floor-whole-house'){completeHousehold(item);return}setHouseholdCompletion(item,input.checked);persist();renderHousehold()}));
  document.querySelectorAll('[data-house-subtask]').forEach(input=>input.addEventListener('change',()=>{const item=entries.find(entry=>entry.id===input.dataset.houseSubtask);if(!item)return;setHouseholdCompletion(item,input.checked);persist();renderHousehold()}));
  document.querySelectorAll('[data-house-block]').forEach(input=>input.addEventListener('change',()=>{const block=HOUSEHOLD_BLOCKS.find(item=>item.id===input.dataset.houseBlock);if(!block)return;block.taskIds.map(id=>entries.find(entry=>entry.id===id)).filter(Boolean).forEach(item=>setHouseholdCompletion(item,input.checked));persist();renderHousehold()}));
}
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
function schoolBadge(item){return item.category==='school'?'<span class="school-badge">School</span>':''}
function firstName(value=''){return String(value).trim().split(/\s+/)[0]||''}
function addedByLine(item){const name=firstName(item.addedByName);return name?`<small class="added-by">Toegevoegd door ${escapeHtml(name)}</small>`:''}
function appointmentTime(item){return item.time?`${item.time}${item.endTime?'–'+item.endTime:''}`:'—'}
function renderAppointment(item){return `<article class="planner-item"><span class="time-badge">${escapeHtml(appointmentTime(item))}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${addedByLine(item)}${item.category==='work'?`<span class="work-badge">Werk${item.personName?' · '+escapeHtml(item.personName):''}</span>`:''}${schoolBadge(item)}${privacyBadge(item)}</div>${actionButtons(item.id,false,Boolean(item.time))}</article>`}
function repeatLabel(value){return ({weekly:'Deze week',biweekly:'Deze twee weken',monthly:'Deze maand',bimonthly:'Deze twee maanden',quarterly:'Dit kwartaal',seasonal:'Dit seizoen',semiannual:'Dit halfjaar',yearly:'Dit jaar',none:'Eenmalig'})[value]||''}
function renderTask(item){const done=isTaskDone(item);return `<article class="planner-item${done?' done':''}"><input class="check" type="checkbox" data-check="${item.id}" aria-label="Taak afronden" ${done?'checked':''}><div class="item-copy"><strong>${escapeHtml(item.title)}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}${addedByLine(item)}${item.urgent?'<span class="urgent-badge">Urgent</span>':''}${schoolBadge(item)}${privacyBadge(item)}${deadlineInfo(item)}${item.repeat&&item.repeat!=='none'?`<span class="repeat-badge">${repeatLabel(item.repeat)}</span>`:''}</div>${item._big?bigActionButtons():actionButtons(item.id,true)}</article>`}
function renderUpcoming(item){const date=new Date(`${item.date}T12:00:00`);const label=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(date);const details=item.time?`${appointmentTime(item)} uur${item.note?' · '+item.note:''}`:item.note||'';return `<article class="planner-item"><span class="upcoming-date">${escapeHtml(label)}</span><div class="item-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(details)}</small>${item.category==='work'?`<span class="work-badge">Werk${item.personName?' · '+escapeHtml(item.personName):''}</span>`:''}${schoolBadge(item)}${privacyBadge(item)}${item.type==='task'?deadlineInfo(item):''}</div>${item._bigUpcoming?'':actionButtons(item.id,false,item.type==='appointment'&&Boolean(item.time))}</article>`}
function actionButtons(id,snooze=false,calendar=false){return `<div class="item-actions">${snooze?`<button class="icon-button snooze-button" type="button" data-snooze="${id}" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button>`:''}${calendar?`<button class="icon-button calendar-button" type="button" data-calendar="${id}" aria-label="In telefoonagenda zetten" title="In telefoonagenda zetten">▣</button>`:''}<button class="icon-button" type="button" data-edit="${id}" aria-label="Wijzigen">✎</button><button class="icon-button delete" type="button" data-delete="${id}" aria-label="Verwijderen">×</button></div>`}
function bigActionButtons(){return `<div class="item-actions"><button class="icon-button snooze-button" type="button" data-big-snooze="1" aria-label="Doorschuiven naar morgen" title="Doorschuiven naar morgen">↪</button></div>`}
function bindItemActions(){
  document.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{if(input.dataset.check==='big-chore-current'){const state=getBigState();state.index+=1;state.snoozeUntil='';saveBigState(state);render();return}const item=entries.find(entry=>entry.id===input.dataset.check);if(!item)return;if(item.repeat&&item.repeat!=='none'){item.completedPeriods=item.completedPeriods||[];const key=periodKey(item.repeat);if(input.checked&&!item.completedPeriods.includes(key))item.completedPeriods.push(key);if(!input.checked)item.completedPeriods=item.completedPeriods.filter(value=>value!==key)}else item.done=input.checked;persist();render()}));
  document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>editEntry(button.dataset.edit)));
  document.querySelectorAll('[data-calendar]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.calendar);if(item)downloadCalendar([item],`${item.title.toLowerCase().replace(/[^a-z0-9]+/gi,'-')||'afspraak'}.ics`)}));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Dit item verwijderen?'))return;entries=entries.filter(item=>item.id!==button.dataset.delete);persist();render()}));
  document.querySelectorAll('[data-snooze]').forEach(button=>button.addEventListener('click',()=>{const item=entries.find(entry=>entry.id===button.dataset.snooze);if(!item)return;const tomorrow=tomorrowKey();if(item.deadline&&tomorrow>item.deadline){alert('Deze taak kan niet voorbij de deadline worden doorgeschoven.');return}if(item.urgent&&!confirm('Deze taak is urgent. Toch doorschuiven naar morgen?'))return;item.date=tomorrow;persist();render()}));
  document.querySelectorAll('[data-big-snooze]').forEach(button=>button.addEventListener('click',()=>{const state=getBigState();state.snoozeUntil=tomorrowKey();saveBigState(state);render()}));
}
function setType(type){els.type.value=type;document.querySelectorAll('[data-type]').forEach(button=>button.classList.toggle('active',button.dataset.type===type));const task=type==='task';els.timeField.hidden=task;els.endTimeField.hidden=task;els.workQuickField.hidden=task;els.hasDeadlineField.hidden=!task;els.deadlineField.hidden=!task||!els.hasDeadline.checked;els.urgentField.hidden=!task;els.repeatField.hidden=!task;els.modalTitle.textContent=`${task?'Taak':'Afspraak'} ${els.id.value?'wijzigen':'toevoegen'}`;els.titleLabel.textContent=task?'Wat moet er gebeuren? *':'Welke afspraak? *'}
function openModal(type,item=null){els.form.reset();els.id.value=item?.id||'';els.category.value=item?.category||'';els.title.value=item?.title||'';els.time.value=item?.time||'';els.endTime.value=item?.endTime||'';els.entryDate.value=item?.date||todayKey();els.hasDeadline.checked=Boolean(item?.deadline);els.deadline.value=item?.deadline||'';els.urgent.checked=Boolean(item?.urgent);els.school.checked=item?.category==='school';els.private.checked=item?.visibility==='private'||els.school.checked;els.private.disabled=els.school.checked;els.repeat.value=item?.repeat||'none';els.note.value=item?.note||'';document.querySelectorAll('[data-shift]').forEach(button=>button.classList.toggle('active',item?.category==='work'&&button.dataset.start===item?.time&&button.dataset.end===item?.endTime));setType(type);els.modal.classList.add('open');els.modal.setAttribute('aria-hidden','false');setTimeout(()=>els.title.focus(),0)}
function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true')}
function editEntry(id){const item=entries.find(entry=>entry.id===id);if(item)openModal(item.type,item)}
function saveEntry(event){event.preventDefault();const title=els.title.value.trim();if(!title)return;const deadline=els.type.value==='task'&&els.hasDeadline.checked?els.deadline.value:'';if(els.type.value==='task'&&els.hasDeadline.checked&&!deadline){alert('Kies een deadline.');return}if(deadline&&deadline<els.entryDate.value){alert('De deadline kan niet vóór de startdatum liggen.');return}const existing=entries.find(item=>item.id===els.id.value);const school=window.huizeChaosPlannerRole==='owner'&&els.school.checked;const category=school?'school':els.type.value==='appointment'&&els.category.value==='work'?'work':'';const visibility=window.huizeChaosPlannerRole==='owner'&&(els.private.checked||school)?'private':'shared';const value={id:existing?.id||uid(),cloudId:existing?.cloudId||'',cloudScope:existing?.cloudScope||'',type:els.type.value,date:els.entryDate.value,deadline,urgent:els.type.value==='task'&&els.urgent.checked,category,visibility,title,time:els.type.value==='appointment'?els.time.value:'',endTime:els.type.value==='appointment'?els.endTime.value:'',personUid:category==='work'?(existing?.personUid||window.huizeChaosPlannerUserUid||''):'',personName:category==='work'?(existing?.personName||window.huizeChaosPlannerUserName||'Gezinslid'):'',note:els.note.value.trim(),done:existing?.done||false,repeat:els.type.value==='task'?els.repeat.value:'none',completedPeriods:existing?.completedPeriods||[],createdAt:existing?.createdAt||Date.now()};if(existing)entries=entries.map(item=>item.id===existing.id?value:item);else entries.push(value);persist();closeModal();render()}

window.getHuizeChaosPlannerEntries=()=>entries;
window.replaceHuizeChaosPlannerEntries=next=>{const obsoleteIds=new Set(['house-weekly-0','house-weekly-1','house-weekly-2','house-weekly-3','house-weekly-4']);entries=next.filter(item=>!obsoleteIds.has(item.id));localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));render()};
window.applyHuizeChaosPlannerRole=role=>{window.huizeChaosPlannerRole=role;els.privateField.hidden=role!=='owner';els.schoolField.hidden=role!=='owner';if(role!=='owner'){els.private.checked=false;els.school.checked=false}};
window.applyHuizeChaosBigState=state=>{localStorage.setItem(BIG_STATE_KEY,JSON.stringify(state));render()};
