const collectBtn=document.getElementById('collectBtn');
const importBtn=document.getElementById('importBtn');
const exportBtn=document.getElementById('exportBtn');
const openAllBtn=document.getElementById('openAllBtn');
const openPinnedBtn=document.getElementById('openPinnedBtn');
const filterPinned=document.getElementById('filterPinned');
const searchBox=document.getElementById('searchBox');
const fileInput=document.getElementById('fileInput');
const sitesList=document.getElementById('sitesList');
const emptyState=document.getElementById('emptyState');

// 🔹 New button
const clearBtn=document.createElement('button');
clearBtn.textContent="Clear List";
clearBtn.style.marginTop="6px";
document.querySelector(".controls").appendChild(clearBtn);

let sitesCache=[]; 
let showPinnedOnly=false;

function hostname(url){
  try { return new URL(url).hostname; } catch { return url; }
}

function saveSites(list){ chrome.storage.local.set({sites:list}); }

function renderList(list){
  const query=searchBox.value.toLowerCase();
  const filtered=list.filter(s=>{
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

    const fav=document.createElement('img');
    fav.className='favicon';
    fav.src=item.favIconUrl || `https://www.google.com/s2/favicons?domain=${hostname(item.url)}`;
    fav.alt='icon';
    fav.title='Open site';
    fav.onclick=()=>chrome.tabs.create({url:item.url});

    const link=document.createElement('span');
    link.className='site-link';
    link.textContent=hostname(item.url);
    link.title=item.url;

    main.appendChild(fav);
    main.appendChild(link);

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

// --- load stored sites
chrome.storage.local.get('sites', data=>{
  sitesCache=data.sites||[];
  renderList(sitesCache);
});

// --- collect tabs
collectBtn.onclick=()=>{
  chrome.tabs.query({},tabs=>{
    const newSites=tabs.map(t=>({
      url:t.url,
      title:t.title,
      pinned:!!t.pinned,
      favIconUrl:t.favIconUrl||null
    }));
    const before=sitesCache.length;
    sitesCache=[...new Map([...sitesCache,...newSites].map(i=>[i.url,i])).values()];
    const added=sitesCache.length-before;
    saveSites(sitesCache);
    renderList(sitesCache);
    if(added>0) alert(`${added} new site(s) collected.`);
  });
};

// --- import
importBtn.onclick=()=>fileInput.click();
fileInput.onchange=e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const imported=JSON.parse(reader.result);
      const before=sitesCache.length;
      sitesCache=[...new Map([...sitesCache,...imported].map(i=>[i.url,i])).values()];
      const added=sitesCache.length-before;
      saveSites(sitesCache);
      renderList(sitesCache);
      alert(added>0 ? `${added} new site(s) imported.` : "No new sites (all were duplicates).");
    }catch{alert('Invalid JSON');}
  };
  reader.readAsText(file);
};

// --- export
exportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(sitesCache,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='sites.json';a.click();
  URL.revokeObjectURL(url);
};

// --- open all
openAllBtn.onclick=()=>sitesCache.forEach(s=>chrome.tabs.create({url:s.url}));
openPinnedBtn.onclick=()=>sitesCache.filter(s=>s.pinned).forEach(s=>chrome.tabs.create({url:s.url}));

filterPinned.onchange=()=>{showPinnedOnly=filterPinned.checked;renderList(sitesCache);};
searchBox.oninput=()=>renderList(sitesCache);

// --- clear list
clearBtn.onclick=()=>{
  if(confirm("Are you sure you want to clear the entire list?")){
    sitesCache=[];
    saveSites(sitesCache);
    renderList(sitesCache);
  }
};
