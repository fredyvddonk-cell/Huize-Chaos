// V1.4.191 - compacte, eerlijke synchronisatiestatus naast het versienummer.
(() => {
  const VERSION = 'V1.4.191';
  const VERSION_SELECTORS = ['.module-version', '.version', '.hc-version'];
  const SYNC_SELECTORS = ['#recipeSyncStatus', '#occasionSyncStatus', '#syncStatus', '#sync'];

  function first(selectors){
    for(const selector of selectors){
      const el=document.querySelector(selector);
      if(el)return el;
    }
    return null;
  }

  function hhmm(date=new Date()){
    return new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
  }

  function stateFor(text){
    const value=String(text||'').trim();
    if(/^Gesynchroniseerd$/i.test(value))return {symbol:'✓',time:true,label:'Gesynchroniseerd'};
    if(/Synchroniseren|Verbinden|Laden/i.test(value))return {symbol:'…',time:false,label:value||'Synchroniseren'};
    if(/Syncfout|Synchronisatie niet beschikbaar|Toegangsfout|fout/i.test(value))return {symbol:'!',time:false,label:value||'Synchronisatiefout'};
    if(/Niet aangemeld|Alleen op dit apparaat|Geen verbinding|Wacht op toegang|Geen toegang/i.test(value))return {symbol:'○',time:false,label:value||'Niet verbonden'};
    return {symbol:'○',time:false,label:value||'Niet verbonden'};
  }

  function init(){
    const versionEl=first(VERSION_SELECTORS);
    const syncEl=first(SYNC_SELECTORS);
    if(!versionEl||!syncEl)return;

    versionEl.classList.add('hc-sync-compact');
    syncEl.style.display='none';

    const update=()=>{
      const state=stateFor(syncEl.textContent);
      versionEl.textContent=`${VERSION} · ${state.symbol}${state.time?' '+hhmm():''}`;
      versionEl.title=state.label;
      versionEl.dataset.syncState=state.symbol==='✓'?'ok':state.symbol==='…'?'busy':state.symbol==='!'?'error':'offline';
    };

    new MutationObserver(update).observe(syncEl,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
    update();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
