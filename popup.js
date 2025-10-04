// popup.js
const collectBtn = document.getElementById('collectBtn');
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const sitesList = document.getElementById('sitesList');
const emptyState = document.getElementById('emptyState');
const themeToggle = document.getElementById('themeToggle');

const STORAGE_KEY = 'tabCollector_sites_v1';
const THEME_KEY = 'tabCollector_theme_v1';

// --- Storage helpers (chrome.storage.local) ---
function saveToStorage(list){
  const payload = {};
  payload[STORAGE_KEY] = list;
  chrome.storage.local.set(payload);
}
function loadFromStorage(){
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], result => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

function saveTheme(theme){
  chrome.storage.local.set({[THEME_KEY]: theme});
}
function loadTheme(){
  return new Promise(resolve => {
    chrome.storage.local.get([THEME_KEY], res => resolve(res[THEME_KEY] || 'light'));
  });
}

// --- UI rendering ---
function createFaviconChar(url){
  try{
    const h = new URL(url).hostname.replace('www.','');
    return h[0].toUpperCase();
  }catch(e){
    return '?';
  }
}

function renderList(list){
  sitesList.innerHTML = '';
  if(!list || list.length === 0){
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach(item => {
    const li = document.createElement('li');
    li.className = 'site-item';

    const main = document.createElement('div');
    main.className = 'site-main';

    const fav = document.createElement('div');
    fav.className = 'favicon';
    fav.textContent = createFaviconChar(item.url);

    const link = document.createElement('a');
    link.className = 'site-link';
    link.href = '#';
    link.textContent = item.title || item.name || item.url;
    link.title = item.url;
    link.onclick = (e) => {
      e.preventDefault();
      // open in new tab
      chrome.tabs.create({url: item.url});
    };

    main.appendChild(fav);
    main.appendChild(link);

    const actions = document.createElement('div');
    actions.className = 'site-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'open-btn';
    openBtn.textContent = 'Open';
    openBtn.onclick = () => chrome.tabs.create({url: item.url});

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = async () => {
      const current = await loadFromStorage();
      const filtered = current.filter(s => s.url !== item.url);
      saveToStorage(filtered);
      renderList(filtered);
    };

    actions.appendChild(openBtn);
    actions.appendChild(removeBtn);

    li.appendChild(main);
    li.appendChild(actions);
    sitesList.appendChild(li);
  });
}

// --- Collect tabs (open + pinned across all windows) ---
function collectSites(){
  // Query all tabs in all windows
  chrome.tabs.query({}, (tabs) => {
    const unique = [];
    const seen = new Set();
    // prefer pinned info (we keep it in object)
    tabs.forEach(t => {
      if(!t.url) return;
      // skip chrome internal pages (optional)
      if(t.url.startsWith('chrome://') || t.url.startsWith('chrome-extension://')) {
        // still allow if you want; we exclude for a cleaner list
        return;
      }
      // de-duplicate by url (simple)
      const key = t.url;
      if(seen.has(key)) return;
      seen.add(key);
      unique.push({
        title: t.title || t.url,
        url: t.url,
        pinned: !!t.pinned,
        favIconUrl: t.favIconUrl || ''
      });
    });

    // Save automatically
    saveToStorage(unique);
    renderList(unique);
  });
}

// --- Export JSON (download) ---
async function exportJSON(){
  const list = await loadFromStorage();
  const blob = new Blob([JSON.stringify(list, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dt = new Date().toISOString().slice(0,19).replace(/:/g,'-');
  a.download = `tab-collector-${dt}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Import JSON from file ---
fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const parsed = JSON.parse(reader.result);
      if(Array.isArray(parsed)){
        // Optional: validate items have url
        const cleaned = parsed.filter(p => p && (p.url || p.name || p.title)).map(p => {
          return { title: p.title || p.name || p.url, url: p.url || '', pinned: !!p.pinned, favIconUrl: p.favIconUrl || '' };
        });
        saveToStorage(cleaned);
        renderList(cleaned);
      } else {
        alert('Invalid JSON format: expected an array of sites.');
      }
    } catch(err){
      alert('Failed to parse JSON.');
    }
    // clear input so same file can be re-selected later
    e.target.value = '';
  };
  reader.readAsText(f);
});

// Event bindings
collectBtn.addEventListener('click', collectSites);
exportBtn.addEventListener('click', exportJSON);

// Theme handling
themeToggle.addEventListener('change', async () => {
  const theme = themeToggle.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  saveTheme(theme);
});

// Initialize UI
(async function init(){
  // load saved list
  const saved = await loadFromStorage();
  renderList(saved);

  // load theme
  const theme = await loadTheme();
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  themeToggle.checked = theme === 'dark';
})();
