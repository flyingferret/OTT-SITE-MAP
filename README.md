📍 Airsoft Site Interactive Map

An interactive, browser-based map for airsoft sites built using Leaflet.js.
Designed for:

Player briefings
In-game communication (grid references)
Scenario planning
Content integration (videos, objectives, etc.)
🚀 Features
🗺️ Custom map using site image
📍 Named locations with custom icons
🔺 Zones and sub-game areas
🧭 Tactical grid overlay (A1, B2 etc.)
🧰 Build mode (click to get coordinates)
🎯 Hover effects on markers
📱 Mobile-friendly (Leaflet-based)
📁 Project Structure
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── map-manager.js
│   ├── feature-manager.js
│   ├── grid-manager.js
│   └── build-mode.js
├── data/
│   ├── site.json
│   ├── locations.json
│   ├── zones.json
│   └── subzones.json
├── images/
│   └── OTT-Base.png
├── icons/
│   └── *.png
⚙️ How It Works
🧠 Architecture Overview
app.js → loads data + initialises everything
map-manager.js → handles map + layers + icons
feature-manager.js → draws markers + zones
grid-manager.js → draws grid overlay
build-mode.js → dev tools (coords + placement)
/data/*.json → defines everything shown on map

👉 The map is data-driven — edit JSON, not code.

🗺️ Setup
1. Clone / Download

Place files in a web folder (or GitHub Pages repo).

2. Open locally

You can run with:

VS Code Live Server
Python:
python -m http.server
3. Open in browser
http://localhost:8000
🌐 Deploy (GitHub Pages)
Push repo to GitHub
Go to:
Settings → Pages
Select:
Branch: main
Folder: / (root)

👉 Your map will be live at:

https://yourusername.github.io/repo-name/
📍 Adding Locations

Edit:

/data/locations.json

Example:

{
  "name": "Fuel Dump",
  "coords": [2314, 3786],
  "icon": "fuelDump"
}
Icon Reference

Icons are defined in:

/js/config.js

Example:

fuelDump: {
  iconUrl: "icons/FuelDump.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45]
}
🔺 Adding Zones

Edit:

/data/zones.json

Example:

{
  "name": "Safe Zone",
  "coords": [
    [2607, 3908],
    [2665, 3950],
    [2886, 3675]
  ],
  "style": {
    "borderColor": "green",
    "fillColor": "green",
    "fillOpacity": 0.2
  }
}
🧭 Adding Sub-Zones

Edit:

/data/subzones.json

Example:

{
  "name": "Zone 1",
  "coords": [...],
  "style": {
    "borderColor": "white",
    "fillColor": "white",
    "fillOpacity": 0.05,
    "dashArray": "5,5"
  }
}
🧱 Grid Configuration

Edit:

/data/site.json
"grid": {
  "enabledByDefault": true,
  "cellSize": 250,
  "bounds": {
    "top": 3728,
    "left": 2472,
    "right": 4920,
    "bottom": 344
  }
}
Notes
cellSize controls grid density
bounds limits grid to playable area
grid uses square cells automatically
🧰 Build Mode (Dev Tool)

Toggle via button on map.

Features:
Shows live coordinates
Click to copy [y, x]
Drops temporary marker
Use case:

👉 Quickly add new features to JSON

🎨 Styling

Edit:

/css/styles.css

Examples:

grid label size
zone label style
UI elements
🧠 Best Practices
✅ Use consistent naming
fuel-dump.png   ✅
FuelDump.png    ❌
✅ Keep JSON clean
No trailing commas
Use lowercase keys
✅ Use IDs (future-proof)
{
  "id": "fuel-dump",
  "name": "Fuel Dump"
}
✅ Keep icons consistent
Same size base
Transparent background
Same visual style
🔥 Future Improvements

Ideas already supported by this structure:

🎮 Game mode switching (attack/defend)
📡 Live objective updates
🎥 Video links in popups
📍 GPS player tracking (advanced)
🧱 Map editor UI (drag & drop)
🌙 Night mode maps
🧠 AI-assisted planning (👀)
🛠️ Troubleshooting
Map not loading
Check image path in site.json
Icons not showing
Check file path + case sensitivity
JSON not loading
Must run via server (not file://)
Grid broken
Check bounds order (top < bottom)
👊 Credits / Notes
Built with Leaflet.js
Designed for airsoft / milsim environments
Custom icons created for site-specific gameplay
👍 Final note

This project is designed to grow into:
👉 a full interactive mission system + briefing tool

If you want next step, I’d recommend:

👉 adding a “How to add a new feature” quick guide (1-minute version)
👉 or building a basic UI editor (click → name → save to JSON)