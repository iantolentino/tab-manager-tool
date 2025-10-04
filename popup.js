const STORAGE_KEY = 'tabCollector_sites_v3';
const sitesList = document.getElementById('sitesList');
const emptyState = document.getElementById('emptyState');
const collectBtn = document.getElementById('collectBtn');
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const searchBox = document.getElementById('searchBox');
const togglePinnedBtn = document.getElementById('togglePinnedBtn');
const openAllBtn = document.getElementById('openAllBtn');
const openPinnedBtn = document.getElementById('openPinnedBtn');
const mergeNotice = document.getElementById('mergeNotice');

let showPinnedOnly = false;
let sitesCache = [];

// ---------------- Storage ----------------
function saveSites(list){ chrome.storage.local.set({[STORAGE_KEY]: list}); }
function loadSites(){ return new Promise(r=>chrome.storage.local.get([STORAGE_KEY],res=>r(res[STORAGE_KEY]||[]))); }

// ---------------- Rendering ----------------
function hostname(url){ try{ return new URL(url).hostname; }catch{return url;} }

function renderList(list){
  const query = searchBox.value.toLowerCase();
  const filtered = list.filter(s=>{
    if(showPinnedOnly && !s.pinned) return false;
    if(query && !hostname(s.url).toLowerCase().includes(query)) return false;
    return true;
  });

  sitesList.innerHTML='';
  if(filtered.length===0){ emptyState.style.display='block'; return; }
  emptyState.style.display='none';

  filtered.forEach(item=>{
    const li=document.createElement('li'); 
    li.className='site-item';

    const main=document.createElement('div'); 
    main.className='site-main';

    // favicon = open button
    const fav=document.createElement('img');
    fav.className='favicon';
    fav.src=item.favIconUrl || `https://www.google.com/s2/favicons?domain=${hostname(item.url)}`;
    fav.alt='icon';
    fav.title='Open site';
    fav.onclick=()=>chrome.tabs.create({url:item.url});

    const link=document.createElement('span');
    link.className='site-link';
    link.textContent=hostname(item.url);
    link.title=`${item.title}\n${item.url}`;

    main.appendChild(fav);
    main.appendChild(link);

    // remove button
    const actions=document.createElement('div'); 
    actions.className='site-actions';

    const removeBtn=document.createElement('button'); 
    removeBtn.className='remove-btn';
    removeBtn.innerHTML='&times;';
    removeBtn.title='Remove site';
    removeBtn.onclick=()=>{
      sitesCache=sitesCache.filter(s=>s.url!==item.url);
      saveSites(sitesCache);
      renderList(sitesCache);
    };

    actions.appendChild(removeBtn);

    li.appendChild(main);
    li.appendChild(actions);
    sitesList.appendChild(li);
  });
}

// ---------------- Collect Tabs ----------------
function collectSites(){
  chrome.tabs.query({}, tabs=>{
    const unique=[]; const seen=new Set();
    tabs.forEach(t=>{
      if(!t.url) return;
      if(t.url.startsWith('chrome://')||t.url.startsWith('chrome-extension://')) return;
      if(seen.has(t.url)) return;
      seen.add(t.url);
      unique.push({
        url:t.url,
        title:t.title,
        pinned:!!t.pinned,
        favIconUrl:t.favIconUrl || null
      });
    });
    sitesCache=unique;
    saveSites(unique);
    renderList(unique);
  });
}

// ---------------- Export/Import ----------------
function exportJSON(){
  const blob=new Blob([JSON.stringify(sitesCache,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='sites.json'; a.click(); URL.revokeObjectURL(url);
}

fileInput.addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      if(!Array.isArray(parsed)) return alert('Invalid file');
      const seen=new Set(sitesCache.map(s=>s.url));
      let added=0;
      parsed.forEach(p=>{
        if(p.url && !seen.has(p.url)){ 
          sitesCache.push({
            url:p.url,
            title:p.title||p.url,
            pinned:!!p.pinned,
            favIconUrl:p.favIconUrl||null
          }); 
          seen.add(p.url); 
          added++; 
        }
      });
      saveSites(sitesCache);
      renderList(sitesCache);
      if(added>0){ 
        mergeNotice.textContent=`${added} new site(s) added.`; 
        mergeNotice.classList.remove('hidden'); 
        setTimeout(()=>mergeNotice.classList.add('hidden'),4000); 
      }
    }catch{ alert('Invalid JSON'); }
  };
  reader.readAsText(f);
});

// ---------------- Filters & Actions ----------------
searchBox.addEventListener('input',()=>renderList(sitesCache));
togglePinnedBtn.addEventListener('click',()=>{
  showPinnedOnly=!showPinnedOnly;
  togglePinnedBtn.textContent=showPinnedOnly?'Show All':'Show Pinned Only';
  renderList(sitesCache);
});
openAllBtn.addEventListener('click',()=>{sitesCache.forEach(s=>chrome.tabs.create({url:s.url}));});
openPinnedBtn.addEventListener('click',()=>{sitesCache.filter(s=>s.pinned).forEach(s=>chrome.tabs.create({url:s.url}));});

// ---------------- Init ----------------
collectBtn.addEventListener('click',collectSites);
exportBtn.addEventListener('click',exportJSON);

(async function init(){
  sitesCache=await loadSites();
  renderList(sitesCache);
})();
