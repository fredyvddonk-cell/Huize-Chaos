const KEY='huizeChaosAutoV1';let data={reservations:[],kilometers:[],fuel:[]};let cloudReady=false;

const FIXED_ROUTES={
  'Werk':{label:'Werk · Vivent',km:17.0},
  'JBZ':{label:'JBZ',km:22.8},
  'WKZ':{label:'WKZ',km:115.1},
  'UMCG':{label:'UMCG',km:466.2}
};
function updateFixedKm(){
  const route=$('kRoute')?.value;
  if(route && FIXED_ROUTES[route]){
    $('kKm').value=FIXED_ROUTES[route].km;
    $('kKm').readOnly=true;
    $('kNote').value=FIXED_ROUTES[route].label;
  }else{
    $('kKm').readOnly=false;
  }
}

const $=id=>document.getElementById(id), today=()=>new Date().toISOString().slice(0,10), euro=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)||0);
function uid(){return crypto.randomUUID()} function load(){try{data={...data,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{};['reservations','kilometers','fuel'].forEach(k=>data[k]=Array.isArray(data[k])?data[k]:[])}
function save(){localStorage.setItem(KEY,JSON.stringify(data));window.scheduleAutoCloudSync?.();render()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function item(html,id,type,care=''){return `<div class="item ${care}"><div class="grow">${html}</div><button class="delete" data-del="${type}" data-id="${id}">Verwijder</button></div>`}
function render(){data.reservations.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));$('reserveList').innerHTML=data.reservations.map(x=>item(`<b>${esc(x.date)} · ${esc(x.start)}–${esc(x.end)}</b><small>${esc(x.who)}${x.reason?' · '+esc(x.reason):''}</small>`,x.id,'reservations')).join('')||'<p>Nog geen reserveringen.</p>';
 data.kilometers.sort((a,b)=>b.date.localeCompare(a.date));let month=today().slice(0,7),m=data.kilometers.filter(x=>x.date.startsWith(month)).reduce((s,x)=>s+Number(x.km),0);$('kmSummary').textContent=`Deze maand geregistreerd: ${m.toFixed(1).replace('.0','')} km`;$('kmList').innerHTML=data.kilometers.map(x=>item(`<b>${esc(x.date)} · ${esc(x.type)} · ${Number(x.km).toFixed(1).replace('.0','')} km</b><small>${esc(x.note)}</small>`,x.id,'kilometers',x.type==='Ziekenhuis/zorg'?'care':'')).join('')||'<p>Nog geen ritten.</p>';
 data.fuel.sort((a,b)=>Number(b.odo)-Number(a.odo));let fm=data.fuel.filter(x=>x.date.startsWith(month)),amt=fm.reduce((s,x)=>s+Number(x.amount),0);$('fuelSummary').textContent=`Deze maand: ${fm.length} tankbeurt${fm.length===1?'':'en'} · ${euro(amt)}`;$('fuelList').innerHTML=data.fuel.map((x,i)=>{let older=data.fuel[i+1],dist=older?Number(x.odo)-Number(older.odo):null;return item(`<b>${esc(x.date)} · ${Number(x.odo).toLocaleString('nl-NL')} km · ${euro(x.amount)}</b><small>${Number(x.liters).toFixed(2)} liter${x.full?' · volgetankt':''}${dist!=null&&dist>=0?' · '+dist.toLocaleString('nl-NL')+' km sinds vorige tankbeurt':''}</small>`,x.id,'fuel')}).join('')||'<p>Nog geen tankbeurten.</p>'}
function conflict(date,start,end,id=''){return data.reservations.find(x=>x.id!==id&&x.date===date&&start<x.end&&end>x.start)}
function showAutoTab(tab,fromHistory=false){const safe=['reserve','km','fuel'].includes(tab)?tab:'reserve';document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===safe));document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==safe);if(!fromHistory&&history.state?.hcAutoTab!==safe)history.pushState({...history.state,hcAutoTab:safe},'',location.href)}
history.replaceState({...history.state,hcAutoTab:'reserve'},'',location.href);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showAutoTab(b.dataset.tab));
window.addEventListener('popstate',e=>{if(e.state?.hcAutoTab)showAutoTab(e.state.hcAutoTab,true)});
$('reserveForm').onsubmit=e=>{e.preventDefault();let x={id:uid(),date:$('rDate').value,start:$('rStart').value,end:$('rEnd').value,who:$('rWho').value.trim(),reason:$('rReason').value.trim()};let c=conflict(x.date,x.start,x.end);if(x.end<=x.start){$('conflict').textContent='De eindtijd moet na de begintijd liggen.';$('conflict').hidden=false;return}if(c){$('conflict').textContent=`De auto is dan al gereserveerd door ${c.who} (${c.start}–${c.end}).`;$('conflict').hidden=false;return}$('conflict').hidden=true;data.reservations.push(x);save();window.syncAutoReservationToPlanner?.(x);e.target.reset();$('rDate').value=today()};
$('kmForm').onsubmit=e=>{e.preventDefault();let route=$('kRoute').value;let type=route==='Werk'?'Werk':'Ziekenhuis/zorg';data.kilometers.push({id:uid(),date:$('kDate').value,type:type,route:route,note:$('kNote').value.trim(),km:Number($('kKm').value)});save();e.target.reset();$('kDate').value=today();$('kRoute').value='Werk';updateFixedKm()};
$('fuelForm').onsubmit=e=>{e.preventDefault();data.fuel.push({id:uid(),date:$('fDate').value,odo:Number($('fOdo').value),liters:Number($('fLiters').value),amount:Number($('fAmount').value),full:$('fFull').checked});save();e.target.reset();$('fDate').value=today()};
document.body.addEventListener('click',e=>{let b=e.target.closest('[data-del]');if(!b)return;let type=b.dataset.del,id=b.dataset.id;if(type==='reservations')window.removeAutoReservationFromPlanner?.(id);data[type]=data[type].filter(x=>x.id!==id);save()});
$('kRoute').onchange=updateFixedKm;$('printCare').onclick=()=>window.print();window.getHuizeChaosAutoData=()=>data;window.replaceHuizeChaosAutoData=next=>{data={reservations:next.reservations||[],kilometers:next.kilometers||[],fuel:next.fuel||[]};localStorage.setItem(KEY,JSON.stringify(data));render()};window.openAutoApp=()=>{$('app').hidden=false};load();['rDate','kDate','fDate'].forEach(id=>$(id).value=today());$('kRoute').value='Werk';updateFixedKm();render();