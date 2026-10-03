(function(){
  const current=(location.pathname.split('/').filter(Boolean).pop()||'').toLowerCase();
  const items=[
    ['home','../','Home'],
    ['gezinsplanner','../gezinsplanner/?hcnav=module','Gezinsplanner'],
    ['boodschappen','../boodschappen/?hcnav=module','Voorraad & Boodschappen'],
    ['recepten','../recepten/?hcnav=module','Weekmenu & Recepten'],
    ['auto','../auto/?hcnav=module','Auto'],
    ['aankopen','../aankopen/?hcnav=module','Aankopen'],
    ['notities','../notities/?hcnav=module','Mijn notities'],
    ['gelegenheden','../gelegenheden/?hcnav=module','Feestdagen & gelegenheden']
  ];
  let header=document.querySelector('.fixed-head .top, .hc-module-top, .module-topbar, .topbar');
  if(!header||header.querySelector('.hc-global-module-menu')) return;
  const menu=document.createElement('details');
  menu.className='hc-global-module-menu';
  const summary=document.createElement('summary');
  summary.setAttribute('aria-label','Open modulemenu');
  summary.setAttribute('title','Ga naar een andere module');
  summary.innerHTML='<span aria-hidden="true">☰</span>';
  const panel=document.createElement('nav');
  panel.className='hc-global-module-menu-panel';
  panel.setAttribute('aria-label','Huize Chaos modules');
  items.forEach(([key,href,label])=>{
    const a=document.createElement('a');
    a.href=href; a.textContent=label;
    if((key==='home'&&current==='')||key===current) a.classList.add('active');
    panel.appendChild(a);
  });
  menu.append(summary,panel);
  header.appendChild(menu);
  document.addEventListener('click',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
  panel.addEventListener('click',()=>{menu.open=false;});
})();
