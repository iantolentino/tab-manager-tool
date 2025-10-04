# Tab Collector (Chrome Extension)

A minimal Chrome extension to **collect, save, and reopen your open and pinned tabs**.  
Designed to be **modern, minimal, and user-friendly**.

---

## ✨ Features
- Collect all currently open tabs (including pinned).
- Automatically saves sites in local storage (persistent across browser restarts).
- **Duplicate-safe:** importing or collecting ignores duplicates.
- Alerts you how many **new sites** were added after Collect or Import.
- Export and import tab lists as JSON (backup/restore support).
- Responsive grid layout (2–3 columns) for compact browsing.
- Click **favicon** to open the site.
- Remove sites with a simple **× icon**.
- **Search box** to quickly find a saved site.
- **Filter toggle** to show only pinned tabs.
- "Open All" or "Open All Pinned" buttons to restore sessions.
- **Clear List** button to remove all saved sites at once.

---

## 📥 Installation
1. Clone or download this repository.
2. Open **Chrome** and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. The extension will appear in your toolbar.

---

## 🖱 Usage
- **Collect Sites** → Saves all current tabs (open + pinned).  
  - Duplicates are ignored.  
  - Shows how many *new* sites were collected.  
- **Favicon** → Click to open that site in a new tab.  
- **×** → Remove a single site from the list.  
- **Import JSON** → Import a backup file.  
  - Duplicates are ignored.  
  - Shows how many *new* sites were imported.  
- **Export JSON** → Save your current list as a backup.  
- **Search box** → Instantly filter sites by domain.  
- **Show only pinned** → Filter list to pinned tabs only.  
- **Open All** → Open every saved site in new tabs.  
- **Open All Pinned** → Open only pinned sites.  
- **Clear List** → Wipes the entire saved list (with confirmation).  

---

## 🖼 Icons
Provide your own icons in the root folder:  
- `icon-16.png`  
- `icon-48.png`  
- `icon-128.png`  

These will appear in Chrome’s toolbar and extension menu.  
*(Tip: A simple black-and-white favicon works well for minimal design.)*

---

## ⚙ Notes
- All tab data is saved **locally** in your browser.  
- JSON import/export is optional — data persists even if you don’t back it up.  
- Popup uses a **fixed width** and a **scrollable grid** to minimize long scrolling.  
