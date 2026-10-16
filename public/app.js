import { CATEGORIES,DIRECTORY,STREAMS,regionName,categoryName } from './catalog.js';

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const icons={
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12c5 4 13 4 18 0M10 13h4"/>',
  cap:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v7"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H8c-5 0-3-7 0-5l4 5Zm0 0h4c5 0 3-7 0-5l-4 5Z"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 7h6M9 11h6M9 15h3"/>',
  heart:'<path d="M20.8 4.7c-2.5-2.5-6.2-1.8-8.8 1-2.6-2.8-6.3-3.5-8.8-1C-1 9 6.5 16 12 21c5.5-5 13-12 8.8-16.3Z"/>',
  scale:'<path d="M12 3v18M5 21h14M4 7h16M5 7l-4 8h8L5 7Zm14 0-4 8h8l-4-8Z"/>',
  flask:'<path d="M9 3h6M10 3v7l-6 9c-.6 1 0 2 1 2h14c1 0 1.6-1 1-2l-6-9V3M8 15h8"/>',
  trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM12 15v6M8 21h8M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4"/>',
  tag:'<path d="m3 3 8 .2L21 13l-8 8L3.2 11 3 3Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  rocket:'<path d="M12 15c7-4 9-9 9-12-3 0-8 2-12 9l3 3ZM8 12H4l-1 6 6-1m3-1v4l-6 1 1-6m-3 5-2 2"/><circle cx="16" cy="8" r="1.5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7"/><circle cx="12" cy="12" r="1"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10ZM10 21h4"/>',
  settings:'<path d="m9 3-1 3-3 1-2 4 2 3v4l4 2 3-1 3 1 4-2v-4l2-3-2-4-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  external:'<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/>',
  search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  refresh:'<path d="M20 8a9 9 0 1 0 1 7M20 3v5h-5"/>',
  sliders:'<path d="M3 6h4m4 0h10M3 12h10m4 0h4M3 18h3m4 0h11M7 3v6m6 0v6M6 15v6"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  edit:'<path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  paper:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h8M8 11h8M8 15h4M8 18h8"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.paper}</svg>`;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
let storageFailed=false;
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{if(!storageFailed){storageFailed=true;toast('Browser storage is unavailable. Changes will last for this visit.');}}}
const defaultPrefs={keywords:['Handshake','Luel','FAFSA','tax refund'],region:'all',autoRefresh:true,notifications:false};
const rawPrefs=read('ledger:prefs',{});
const prefs={...defaultPrefs,...rawPrefs};
prefs.keywords=Array.isArray(rawPrefs.keywords)?rawPrefs.keywords.filter(x=>typeof x==='string').map(x=>x.slice(0,60)).slice(0,20):defaultPrefs.keywords;
prefs.region=['all','US','KE','varies'].includes(prefs.region)?prefs.region:'all';
function safeItem(item){try{const u=new URL(item.url);return ['http:','https:'].includes(u.protocol)&&typeof item.title==='string'&&typeof item.id==='string'&&CATEGORIES.some(c=>c.id===item.category);}catch{return false;}}
const rawSaved=read('ledger:saved',[]);
const saved=new Map((Array.isArray(rawSaved)?rawSaved:[]).filter(safeItem).slice(0,1000).map(i=>[i.id,i]));
const state={view:'news',category:'all',query:'',region:prefs.region,age:'30',sort:'newest',official:false,limit:13,items:[],data:null,loading:true,error:null};
let toastTimer,filterTimer,loadingRequest=false;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4000);}
function renderIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
function nav(){
  const links=[['news','paper','Daily briefing'],['alerts','bell','On your radar'],['saved','bookmark','Saved opportunities'],['sources','globe','Source directory']];
  $('#main-nav').innerHTML=links.map(([view,ic,label])=>`<button class="nav-button ${state.view===view||view==='sources'&&state.view==='directory'?'active':''}" data-view="${view}" ${state.view===view?'aria-current="page"':''}>${icon(ic)}${label}${view==='saved'?`<span class="nav-count">${saved.size}</span>`:view==='alerts'&&matches().length?`<span class="nav-count">${matches().length}</span>`:''}</button>`).join('');
  $('#category-nav').innerHTML=CATEGORIES.filter(c=>c.id!=='all').map(c=>`<button class="nav-button ${state.category===c.id?'active':''}" data-category="${c.id}" ${state.category===c.id?'aria-current="true"':''}>${icon(c.icon)}${esc(c.name)}</button>`).join('');
  const quick=['all','ai-work','scholarships','grants','tax-refunds'];
  if(!quick.includes(state.category))quick.push(state.category);
  $('#quick-filters').innerHTML=quick.map(id=>{const c=CATEGORIES.find(c=>c.id===id);return `<button class="filter-chip ${id===state.category?'active':''}" data-category="${id}" aria-pressed="${id===state.category}">${esc(c.short)}</button>`;}).join('');
  const tab=['sources','directory'].includes(state.view)?'directory':state.view==='saved'?'saved':'news';
  $$('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
}
function matches(){return state.items.filter(item=>prefs.keywords.some(k=>(item.title+' '+(item.summary||'')+' '+item.source).toLowerCase().includes(k.toLowerCase())));}
function displayDate(item){if(item.type==='directory')return 'Program directory';if(!item.publishedAt)return 'Publication date unavailable';const d=new Date(item.publishedAt);return Number.isFinite(d.getTime())?d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined}):'Publication date unavailable';}
function filterItems(){
  let items=['directory','sources'].includes(state.view)?DIRECTORY:state.view==='saved'?[...saved.values()]:state.view==='alerts'?matches():state.items;
  const query=state.query.toLowerCase().trim();
  items=items.filter(i=>(state.category==='all'||i.category===state.category)&&(state.region==='all'||i.region===state.region)&&(!state.official||i.official)&&
    (!query||(i.title+' '+(i.summary||'')+' '+i.source+' '+categoryName(i.category)).toLowerCase().includes(query))&&
    (i.type==='directory'||state.age==='all'||!i.publishedAt||Date.now()-Date.parse(i.publishedAt)<=Number(state.age)*86400000));
  return [...items].sort((a,b)=>state.sort==='az'?a.title.localeCompare(b.title):
    (state.sort==='oldest'?1:-1)*(Date.parse(a.publishedAt||a.discoveredAt||0)-Date.parse(b.publishedAt||b.discoveredAt||0))||a.title.localeCompare(b.title));
}
function renderCard(item,index){
  const category=CATEGORIES.find(c=>c.id===item.category),isSaved=saved.has(item.id),dir=item.type==='directory';
  const featured=index===0&&state.view==='news'&&state.category==='all'&&!state.query;
  const summary=item.summary&&item.summary.toLowerCase()!==item.title.toLowerCase()?item.summary:dir?'Open the official website for current programs, requirements, and availability.':'Read the source for the complete announcement, requirements, and next steps.';
  return `<article class="op-card ${featured?'card-featured ':''}${dir?'directory-card':''}"><div class="card-top"><span class="category-tag cat-${esc(item.category)}">${icon(category.icon)}${esc(category.short)}</span><button class="save-button ${isSaved?'saved':''}" data-save="${esc(item.id)}" aria-label="${isSaved?'Remove saved item':'Save opportunity'}: ${esc(item.title)}" aria-pressed="${isSaved}">${icon('bookmark')}</button></div>${item.official?`<span class="official-label">${icon('check')} Official domain${dir?' · program directory':''}</span>`:''}<h3><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3><p>${esc(summary)}</p><div class="card-metadata"><span title="Country focus, not a personal eligibility check">${icon('pin')}${esc(regionName(item.region))}</span><span>·</span><span title="${esc(item.publishedAt||'No publication date supplied')}">${icon(dir?'globe':'clock')}${esc(displayDate(item))}</span>${item.type==='discovery'?'<span>· Web discovery</span>':''}</div><div class="card-bottom"><span class="card-source" title="${esc(item.source)}"><span class="source-dot"></span><span>${esc(item.source)}</span></span><a class="card-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${dir?'Visit source':item.type==='discovery'?'View opportunity':'Read story'} ${icon('external')}</a></div></article>`;
}
function emptyHtml(){
  if(state.view==='saved'&&!saved.size)return `<div class="empty-state"><span>${icon('bookmark')}</span><h3>Make room for possibility.</h3><p>Save a story or a program using its bookmark button. You can return to your collection here.</p><button class="outline-button" data-view="directory">Explore programs ${icon('arrow')}</button></div>`;
  if(state.view==='alerts'&&!prefs.keywords.length)return `<div class="empty-state"><span>${icon('radar')}</span><h3>Give your radar a direction.</h3><p>Add a few watched keywords to gather relevant discoveries in one place.</p><button class="outline-button" data-action="settings">Add keywords ${icon('arrow')}</button></div>`;
  if(state.view==='news'&&!state.items.length)return `<div class="empty-state"><span>${icon('paper')}</span><h3>Your next discovery is still out there.</h3><p>${state.error?'The live scan is unavailable in this environment. The source directory is ready to explore; try the scan again after deployment.':'No recent headlines were returned by the discovery streams. Browse the source directory or refresh the briefing later.'}</p><button class="outline-button" data-view="directory">Explore ${DIRECTORY.length} source links ${icon('arrow')}</button><button class="outline-button" data-retry>Try live scan ${icon('refresh')}</button></div>`;
  return `<div class="empty-state"><span>${icon('search')}</span><h3>No matches just yet.</h3><p>${state.view==='alerts'?'No discovered stories match your watched keywords and current filters. Your radar will check again as the briefing updates.':'Try another search term or broaden your category, country, or date filters.'}</p><button class="outline-button" data-reset>Clear search & filters ${icon('refresh')}</button>${state.view==='alerts'?'<button class="outline-button" data-action="settings">Edit keywords</button>':''}</div>`;
}
function render(){
  nav();const items=filterItems();
  const titles={news:['THE LATEST DISCOVERIES','Your opportunity briefing'],directory:['THE PRIMARY SOURCE COLLECTION','Explore the possibilities'],sources:['THE PRIMARY SOURCE COLLECTION','The source directory'],saved:['YOUR PERSONAL COLLECTION','Worth coming back to'],alerts:['MATCHING YOUR WATCHED KEYWORDS','On your radar']};
  const [kicker,title]=titles[state.view]||titles.news;
  $('#section-kicker').textContent=kicker;
  $('#feed-heading').innerHTML=esc(state.category==='all'?title:categoryName(state.category))+'<span class="heading-dot">.</span>';
  $('#results-badge').textContent=state.loading&&state.view==='news'?'Scanning':`${items.length} ${items.length===1?'item':'items'}`;
  $('#news-count').textContent=state.items.length;$('#saved-count').textContent=saved.size;$('#stat-saved').textContent=saved.size;
  $('#directory-count').textContent=DIRECTORY.length;$('#stat-sources').textContent=DIRECTORY.length;$('#stat-streams').textContent=STREAMS.length;
  const dir=['directory','sources'].includes(state.view);
  $('#collection-note').textContent=dir?'Ongoing program links, not live vacancies. Check each website for current availability and eligibility.':state.view==='alerts'?'Discovered stories that contain at least one of your watched keywords.':'Source-linked headlines and web discoveries. Country labels describe topic focus; undated pages remain visible.';
  $('#age-filter').disabled=dir;
  $('#feed').setAttribute('aria-busy',String(state.loading&&state.view==='news'));
  $('#feed').innerHTML=state.loading&&!state.items.length&&['news','alerts'].includes(state.view)?'<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>':items.length?items.slice(0,state.limit).map(renderCard).join(''):emptyHtml();
  $('#load-more').hidden=items.length<=state.limit;
  $('#filter-active').hidden=state.region==='all'&&state.age==='30'&&state.sort==='newest'&&!state.official;
  $('#notification-dot').hidden=matches().length===0;
  $('#watch-chips').innerHTML=prefs.keywords.length?prefs.keywords.map(k=>`<button data-keyword="${esc(k)}" title="Search for ${esc(k)}">${esc(k)}</button>`).join(''):'<span>Add your first keyword</span>';
  renderStatus();
}
function renderStatus(){
  const data=state.data,config=data?.configuration||{};
  const ok=data?.streams?.successful||0,total=data?.streams?.total||STREAMS.length;
  $('#hero-status').innerHTML=`<span class="pulse"></span>${esc(state.loading?'Scanning discovery streams':state.error||!ok?'Source directory ready':data?.stale?'Showing previous briefing':`${state.items.length} links in your briefing`)}`;
  $('#health-feeds').textContent=state.loading?'Scanning…':data?`${ok} / ${total} available`:'Not connected';
  $('#health-web').textContent=data?.deepSearch?`${data.deepSearch.successful} queries · daily`:config.deepSearch?'Ready for daily run':'Optional setup';
  $('#health-email').textContent=config.emailDigest?'Configured · daily':'Optional setup';
  $('#alert-mode').textContent=config.emailDigest?'Daily email configured':prefs.notifications&&'Notification' in window&&Notification.permission==='granted'?'Browser alerts enabled':'Watch keywords in this browser';
  $('#health-note').textContent=config.deepSearch?'The daily web sweep is configured. Availability and delivery depend on the connected services.':'RSS works without a key. Add a search key and shared cache in Vercel for the daily web sweep.';
  $('#small-status').style.background=ok&&!state.error?'#abc284':'#c7a76b';
  const banner=$('#scan-banner');banner.hidden=true;
  let message='';
  if(!state.loading){
    if(state.error)message=state.error;
    else if(data?.stale)message='The latest scan could not reach its sources. Previous results are shown with their original dates.';
    else if(data&&!ok)message='The live scan reached no available feeds. The program directory remains available.';
    else if(data?.streams?.errors?.length)message=`${data.streams.errors.length} discovery streams are currently unavailable. Available results are shown.`;
    if(data?.cacheWarning)message+=(message?' ':'')+data.cacheWarning+'.';
  }
  if(message){banner.textContent=message+' ';const b=document.createElement('button');b.textContent='Explore sources';b.dataset.view='sources';banner.append(b);banner.hidden=false;}
  const at=data?.generatedAt;
  $('#last-update').textContent=state.loading?'Checking live sources…':at?`${data.stale||state.error?'Previous scan':'Scanned'} ${new Date(at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · refreshes use a 30-minute server cache`:'Live briefing not connected. Source directory available.';
}
function setView(view){state.view=view;state.limit=13;closeMenu();render();}
function syncFilters(){ $('#region-filter').value=state.region;$('#age-filter').value=state.age;$('#sort-filter').value=state.sort;$('#official-filter').checked=state.official;}
function reset(){state.query='';state.category='all';state.region='all';state.age='30';state.sort='newest';state.official=false;state.limit=13;$('#search').value='';syncFilters();render();}
function closeMenu(){$('.sidebar').classList.remove('open');$('#mobile-backdrop').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}
function settings(){
  $('#watch-input').value=prefs.keywords.join(', ');$('#default-region').value=prefs.region;$('#auto-refresh').checked=prefs.autoRefresh;
  const btn=$('#enable-notifications');btn.disabled=false;
  btn.textContent=prefs.notifications?'Disable':'Enable';
  if(!('Notification' in window)){btn.textContent='Unavailable';btn.disabled=true;}
  else if(Notification.permission==='denied'){btn.textContent='Blocked';btn.disabled=true;}
  $('#settings-dialog').showModal();closeMenu();
}
function notify(newItems){
  if(!prefs.notifications||!('Notification'in window)||Notification.permission!=='granted')return;
  const matching=newItems.filter(i=>prefs.keywords.some(k=>(i.title+' '+i.summary+' '+i.source).toLowerCase().includes(k.toLowerCase()))&&(prefs.region==='all'||i.region===prefs.region));
  if(!matching.length)return;
  try{const n=new Notification(`${matching.length} new opportunity ${matching.length===1?'match':'matches'}`,{body:matching[0].title,icon:'/assets/favicon.svg',tag:'ledger-new-matches'});n.onclick=()=>{window.focus();setView('alerts');n.close();};}catch{/* Some mobile browsers require a service worker; the radar still works. */}
}
async function load(){
  if(loadingRequest)return;
  loadingRequest=true;
  state.loading=true;$('#refresh-button').disabled=true;$('#refresh-button').classList.add('spinning');renderStatus();
  try{
    const r=await fetch('/api/opportunities',{signal:AbortSignal.timeout(55000)});if(!r.ok)throw new Error('Could not reach live discovery');
    const data=await r.json();if(!Array.isArray(data.items))throw new Error('Invalid discovery response');
    const previous=new Set(state.items.map(i=>i.id));const wasLoaded=Boolean(state.data);
    state.items=data.items.filter(safeItem);state.data=data;state.error=null;
    if(wasLoaded)notify(state.items.filter(i=>!previous.has(i.id)));
    try{sessionStorage.setItem('ledger:last-feed',JSON.stringify({...data,items:state.items.slice(0,250)}));}catch{/* Optional browser cache. */}
  }catch{
    state.error='Live headlines are unavailable right now. Your saved collection and source directory are still available.';
  }finally{loadingRequest=false;state.loading=false;$('#refresh-button').disabled=false;$('#refresh-button').classList.remove('spinning');render();}
}

document.addEventListener('click',event=>{
  const target=event.target.closest('button,[data-close]');if(!target)return;
  if(target.dataset.view){setView(target.dataset.view);return;}
  if(target.dataset.tab){setView(target.dataset.tab);return;}
  if(target.dataset.category){state.category=target.dataset.category;state.limit=13;closeMenu();render();return;}
  if(target.dataset.save){
    const id=target.dataset.save,item=[...state.items,...DIRECTORY,...saved.values()].find(i=>i.id===id);if(!item)return;
    if(saved.has(id)){saved.delete(id);toast('Removed from your saved collection.');}else{saved.set(id,item);toast('Saved to your collection.');}
    persist('ledger:saved',[...saved.values()]);render();return;
  }
  if(target.dataset.keyword){state.query=target.dataset.keyword;$('#search').value=state.query;state.category='all';setView('news');return;}
  if(target.hasAttribute('data-close')){target.closest('dialog').close();return;}
  if(target.hasAttribute('data-reset')){reset();return;}
  if(target.hasAttribute('data-retry')){load();return;}
  if(target.dataset.action==='settings'){settings();return;}
  if(target.dataset.action==='alerts'){setView('alerts');return;}
  if(target.dataset.action==='about'){$('#about-dialog').showModal();return;}
});
$('#search-form').addEventListener('submit',event=>{event.preventDefault();clearTimeout(filterTimer);state.query=$('#search').value.slice(0,200);state.limit=13;render();});
$('#search').addEventListener('input',()=>{clearTimeout(filterTimer);filterTimer=setTimeout(()=>{state.query=$('#search').value.slice(0,200);state.limit=13;render();},180);});
$('#refresh-button').addEventListener('click',load);
$('#filter-toggle').addEventListener('click',()=>{const el=$('#advanced-filters');el.hidden=!el.hidden;$('#filter-toggle').setAttribute('aria-expanded',String(!el.hidden));});
for(const [id,key] of [['region-filter','region'],['age-filter','age'],['sort-filter','sort']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;state.limit=13;render();});
$('#official-filter').addEventListener('change',e=>{state.official=e.target.checked;render();});
$('#clear-filters').addEventListener('click',reset);
$('#load-more').addEventListener('click',()=>{const shown=state.limit;state.limit+=12;render();$('#feed').children[shown]?.querySelector('a')?.focus();});
$('#menu-toggle').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('open');$('#mobile-backdrop').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));});
$('#mobile-backdrop').addEventListener('click',closeMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('dialog[open]')){event.preventDefault();$('#search').focus();}});
$('#preferences-form').addEventListener('submit',event=>{event.preventDefault();prefs.keywords=[...new Set($('#watch-input').value.split(',').map(x=>x.trim().slice(0,60)).filter(Boolean))].slice(0,20);prefs.region=$('#default-region').value;prefs.autoRefresh=$('#auto-refresh').checked;persist('ledger:prefs',prefs);state.region=prefs.region;syncFilters();$('#settings-dialog').close();render();toast('Preferences saved in this browser.');});
$('#enable-notifications').addEventListener('click',async()=>{
  if(prefs.notifications){prefs.notifications=false;persist('ledger:prefs',prefs);$('#enable-notifications').textContent='Enable';renderStatus();return;}
  if(!('Notification'in window))return;
  try{const permission=await Notification.requestPermission();if(permission==='granted'){prefs.notifications=true;persist('ledger:prefs',prefs);$('#enable-notifications').textContent='Disable';toast('Browser alerts enabled while this page is open.');renderStatus();}else{toast('Notifications were not enabled. Your radar remains available.');if(permission==='denied'){$('#enable-notifications').textContent='Blocked';$('#enable-notifications').disabled=true;}}}catch{toast('This browser could not enable notifications.');}
});
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
$('#today').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
$('#today').dateTime=new Date().toISOString().slice(0,10);
syncFilters();renderIcons();
try{const last=JSON.parse(sessionStorage.getItem('ledger:last-feed'));if(last?.items){state.items=last.items.filter(safeItem);state.data=last;}}catch{/* First visit. */}
render();load();
setInterval(()=>{if(prefs.autoRefresh&&!document.hidden&&!state.loading)load();},10*60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&prefs.autoRefresh&&!state.loading&&(!state.data||Date.now()-Date.parse(state.data.generatedAt)>30*60*1000))load();});
