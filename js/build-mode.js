/**
 * build-mode.js
 * --------------
 * Provides tools for map editing and coordinate discovery.
 *
 * Purpose:
 * - Enable a "developer mode" for placing and testing map features.
 *
 * Responsibilities:
 * - Toggle build mode on/off (persisted in localStorage).
 * - Display live mouse coordinates.
 * - Allow clicking map to copy coordinates.
 * - Provide visual feedback (temporary markers).
 *
 * Why this exists:
 * - Makes it easy to add new features without guessing coordinates.
 * - Supports ongoing map development and updates.
 *
 * Key concepts:
 * - Build mode is optional and hidden from normal users.
 * - Uses browser storage to remember state.
 *
 * Future ideas:
 * - Add polygon drawing tools
 * - Export features directly to JSON
 * - Drag-and-drop marker placement
 */
export class BuildModeManager {
  constructor(mapManager, storageKey = "InBuildMode", defaultEnabled = false) {
    this.mapManager = mapManager;
    this.storageKey = storageKey;
    this.enabled = localStorage.getItem(storageKey) === "true" || defaultEnabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(this.storageKey, this.enabled);
    location.reload();
  }

  addToggleControl() {
    const control = L.control({ position: "topright" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.background = "white";
      div.style.padding = "5px";
      div.innerHTML = `<button>${this.enabled ? "Build Mode: ON" : "Build Mode: OFF"}</button>`;

      L.DomEvent.disableClickPropagation(div);
      div.onclick = () => this.toggle();
      return div;
    };

    control.addTo(this.mapManager.map);
  }

  enable() {
    if (!this.enabled) return;

    document.getElementById("map").style.cursor = "crosshair";

    const coordBox = L.control({ position: "bottomleft" });
    coordBox.onAdd = function () {
      this._div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      this._div.style.background = "white";
      this._div.style.padding = "5px";
      this._div.innerHTML = "Move mouse...";
      return this._div;
    };
    coordBox.addTo(this.mapManager.map);

    this.mapManager.map.on("mousemove", (e) => {
      coordBox._div.innerHTML = `Y: ${Math.round(e.latlng.lat)} | X: ${Math.round(e.latlng.lng)}`;
    });

    this.mapManager.map.on("click", (e) => {
      const y = Math.round(e.latlng.lat);
      const x = Math.round(e.latlng.lng);
      const coords = `[${y}, ${x}]`;

      navigator.clipboard.writeText(coords).catch(() => {});
      L.marker([y, x]).addTo(this.mapManager.map)
        .bindPopup(`Copied: ${coords}`)
        .openPopup();
    });
  }
}