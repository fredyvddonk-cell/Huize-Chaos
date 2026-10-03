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

  const menu=document.createElement('div');
  menu.className='hc-global-module-menu';

  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='hc-global-module-menu-trigger';
  trigger.setAttribute('aria-label','Open modulemenu');
  trigger.setAttribute('title','Ga naar een andere module');
  trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML='<span aria-hidden="true">☰</span>';
  menu.appendChild(trigger);
  header.appendChild(menu);

  const backdrop=document.createElement('div');
  backdrop.className='hc-global-module-menu-backdrop';
  backdrop.hidden=true;

  const panel=document.createElement('nav');
  panel.className='hc-global-module-menu-panel';
  panel.setAttribute('aria-label','Huize Chaos modules');
  panel.hidden=true;
  items.forEach(([key,href,label])=>{
    const a=document.createElement('a');
    a.href=href;
    a.textContent=label;
    if((key==='home'&&current==='')||key===current) a.classList.add('active');
    panel.appendChild(a);
  });

  // Body-level overlay avoids stacking-context conflicts with search fields and sticky headers.
  document.body.append(backdrop,panel);

  let open=false;
  function positionPanel(){
    if(!open||panel.hidden) return;
    const r=trigger.getBoundingClientRect();
    const gap=8;
    const side=12;
    const width=Math.min(292,window.innerWidth-side*2);
    panel.style.width=width+'px';
    panel.style.right=side+'px';
    panel.style.left='auto';
    const maxTop=Math.max(side,window.innerHeight-panel.offsetHeight-side);
    panel.style.top=Math.max(side,Math.min(r.bottom+gap,maxTop))+'px';
  }
  function setOpen(next){
    open=!!next;
    trigger.setAttribute('aria-expanded',String(open));
    trigger.classList.toggle('active',open);
    backdrop.hidden=!open;
    panel.hidden=!open;
    document.body.classList.toggle('hc-module-menu-open',open);
    if(open) requestAnimationFrame(positionPanel);
  }

  trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOpen(!open)});
  backdrop.addEventListener('click',()=>setOpen(false));
  panel.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)setOpen(false)});
  window.addEventListener('resize',positionPanel);
  window.addEventListener('scroll',positionPanel,{passive:true});
})();
