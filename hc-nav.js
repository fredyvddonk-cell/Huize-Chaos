(function(){
  if(document.getElementById('hcGlobalNavButton')) return;
  const current=(location.pathname.split('/').filter(Boolean).pop()||'').toLowerCase();
  const base=current&&current!=='index.html'?'../':'../';
  const style=document.createElement('style');
  style.textContent=`
    .hc-global-nav-btn{position:fixed;right:12px;top:calc(env(safe-area-inset-top) + 10px);z-index:850;width:42px;height:42px;border:1px solid #d9cde5;border-radius:12px;background:#fbf8fd;color:#7353a5;display:grid;place-items:center;box-shadow:0 2px 10px rgba(78,57,95,.08);padding:8px}
    .hc-global-nav-btn span{display:block;width:20px;height:2px;border-radius:2px;background:#7353a5;margin:2px auto}
    .hc-global-nav-backdrop{position:fixed;inset:0;background:rgba(36,28,43,.35);z-index:860}
    .hc-global-nav-backdrop[hidden]{display:none}
    .hc-global-nav{position:fixed;z-index:870;top:0;right:0;height:100dvh;width:min(360px,88vw);background:#f7f1fb;box-shadow:-12px 0 38px rgba(46,35,56,.2);transform:translateX(105%);transition:transform .2s ease;padding:calc(env(safe-area-inset-top) + 14px) 14px calc(env(safe-area-inset-bottom) + 14px);overflow:auto}
    .hc-global-nav.open{transform:translateX(0)}
    .hc-global-nav-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
    .hc-global-nav-head strong{font-size:20px;color:#7353a5}.hc-global-nav-head button{border:0;background:#e9ddf3;color:#7353a5;width:38px;height:38px;border-radius:11px;font-size:24px}
    .hc-global-nav-list{display:grid;gap:6px}.hc-global-nav-list a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border-radius:12px;background:#fff;border:1px solid #e4d9ec;color:#2d2d37;text-decoration:none;font-weight:700}.hc-global-nav-list a.active{background:#eadff4;color:#654099;border-color:#cdb8df}.hc-global-nav-list a span:last-child{color:#957ac1;font-size:20px}
    @media(max-width:430px){.hc-global-nav-btn{width:39px;height:39px;right:10px;top:calc(env(safe-area-inset-top) + 8px)}}
    /* V1.4.128: één vaste Huize Chaos-lijn op alle modules */
    body{background:#f5f0f9!important}
    .hc-module-top,.module-topbar,.topbar{background:transparent!important;border-bottom:1px solid #ded3e8!important;box-shadow:none!important}
    .hc-module-top,.module-topbar,.topbar{min-height:62px!important;padding-right:64px!important}
    .hc-module-top img:first-child,.module-app-icon,.hc-app-icon{border-radius:12px!important}
    .hc-module-top .hc-brand img:last-child,.module-wordmark,.topbar .brand img:last-child{max-height:29px!important;width:auto!important}
    .hc-version,.module-version,.version{color:#8a7c94!important;font-weight:650!important}
    .title-icon{display:none!important}
    button,.button{font-family:inherit}
    .hc-global-nav-list a{min-height:47px}

  `;
  document.head.appendChild(style);
  const button=document.createElement('button');button.id='hcGlobalNavButton';button.className='hc-global-nav-btn';button.type='button';button.setAttribute('aria-label','Huize Chaos menu openen');button.innerHTML='<span></span><span></span><span></span>';document.body.appendChild(button);
  const backdrop=document.createElement('div');backdrop.className='hc-global-nav-backdrop';backdrop.hidden=true;document.body.appendChild(backdrop);
  const nav=document.createElement('aside');nav.className='hc-global-nav';nav.setAttribute('aria-hidden','true');nav.innerHTML=`<div class="hc-global-nav-head"><strong>Huize Chaos</strong><button type="button" aria-label="Menu sluiten">×</button></div><nav class="hc-global-nav-list">
    <a href="../"><span>Home</span><span>›</span></a>
    <a href="../gezinsplanner/?hcnav=menu"><span>Gezinsplanner</span><span>›</span></a>
    <a href="../boodschappen/?hcnav=menu"><span>Voorraad & Boodschappen</span><span>›</span></a>
    <a href="../recepten/?hcnav=menu"><span>Weekmenu & Recepten</span><span>›</span></a>
    <a href="../auto/?hcnav=menu"><span>Auto</span><span>›</span></a>
    <a href="../aankopen/?hcnav=menu"><span>Aankopen</span><span>›</span></a>
    <a href="../notities/?hcnav=menu"><span>Mijn notities</span><span>›</span></a>
    <a href="../gelegenheden/?hcnav=menu"><span>Feestdagen & gelegenheden</span><span>›</span></a>
  </nav>`;document.body.appendChild(nav);
  const section=location.pathname.split('/').filter(Boolean).slice(-2,-1)[0]||'';
  nav.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href').includes(`/${section}/`))a.classList.add('active')});
  const setOpen=open=>{nav.classList.toggle('open',open);nav.setAttribute('aria-hidden',String(!open));backdrop.hidden=!open;document.body.style.overflow=open?'hidden':''};
  button.addEventListener('click',()=>setOpen(true));nav.querySelector('button').addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
})();
