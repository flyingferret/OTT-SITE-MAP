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
 * Notes:
 * - Fully supports enable/disable without page reload
 */

export class BuildModeManager {
  constructor(mapManager, storageKey = "InBuildMode", defaultEnabled = false) {
    this.mapManager = mapManager;
    this.storageKey = storageKey;

    const saved = localStorage.getItem(storageKey);
    this.enabled = saved === null ? defaultEnabled : saved === "true";

    this.coordBox = null;
    this.mouseMoveHandler = null;
    this.mapClickHandler = null;

    this.markers = [];
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(isEnabled) {
    if (this.enabled === isEnabled) return;

    this.enabled = isEnabled;
    localStorage.setItem(this.storageKey, this.enabled);

    if (this.enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  enable() {
    if (!this.enabled) return;
    if (this.mouseMoveHandler || this.mapClickHandler) return;

    const map = this.mapManager.map;
    const mapEl = document.getElementById("map");

    if (mapEl) {
      mapEl.style.cursor = "crosshair";
    }

    this.coordBox = L.control({ position: "bottomleft" });

    this.coordBox.onAdd = function () {
      this._div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      this._div.style.background = "white";
      this._div.style.padding = "6px 8px";
      this._div.style.fontSize = "12px";
      this._div.innerHTML = "Move mouse...";
      return this._div;
    };

    this.coordBox.addTo(map);

    this.mouseMoveHandler = (e) => {
      if (!this.coordBox?._div) return;

      this.coordBox._div.innerHTML =
        `Y: ${Math.round(e.latlng.lat)} | X: ${Math.round(e.latlng.lng)}`;
    };

    this.mapClickHandler = (e) => {
      const y = Math.round(e.latlng.lat);
      const x = Math.round(e.latlng.lng);
      const coords = `[${y}, ${x}]`;

      navigator.clipboard.writeText(coords).catch(() => {});

      const marker = L.marker([y, x])
        .addTo(map)
        .bindPopup(`Copied: ${coords}`)
        .openPopup();

      this.markers.push(marker);
    };

    map.on("mousemove", this.mouseMoveHandler);
    map.on("click", this.mapClickHandler);
  }

  disable() {
    const map = this.mapManager.map;
    const mapEl = document.getElementById("map");

    if (mapEl) {
      mapEl.style.cursor = "";
    }

    if (this.coordBox) {
      map.removeControl(this.coordBox);
      this.coordBox = null;
    }

    if (this.mouseMoveHandler) {
      map.off("mousemove", this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    if (this.mapClickHandler) {
      map.off("click", this.mapClickHandler);
      this.mapClickHandler = null;
    }

    this.markers.forEach(marker => {
      map.removeLayer(marker);
    });
    this.markers = [];
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      this.mapManager.map.removeLayer(marker);
    });
    this.markers = [];
  }
}