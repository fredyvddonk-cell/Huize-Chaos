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
  const header=document.querySelector('.fixed-head .top, .hc-module-top, .module-topbar, .topbar');
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
    a.href=href;
    a.textContent=label;
    if((key==='home'&&current==='')||key===current) a.classList.add('active');
    panel.appendChild(a);
  });

  const backdrop=document.createElement('div');
  backdrop.className='hc-global-module-menu-backdrop';
  backdrop.hidden=true;
  document.body.appendChild(backdrop);

  menu.append(summary,panel);
  header.appendChild(menu);

  function positionPanel(){
    if(!menu.open)return;
    const r=summary.getBoundingClientRect();
    const gap=8;
    panel.style.top=Math.min(window.innerHeight-12,r.bottom+gap)+'px';
    panel.style.right=Math.max(12,window.innerWidth-r.right)+'px';
  }
  function setOpen(open){
    if(menu.open!==open) menu.open=open;
    backdrop.hidden=!open;
    document.body.classList.toggle('hc-module-menu-open',open);
    if(open) requestAnimationFrame(positionPanel);
  }

  menu.addEventListener('toggle',()=>setOpen(menu.open));
  backdrop.addEventListener('click',()=>setOpen(false));
  panel.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open)setOpen(false)});
  window.addEventListener('resize',positionPanel);
  window.addEventListener('scroll',positionPanel,{passive:true});
})();
