/**
 * map-manager.js
 * --------------
 * Core map controller responsible for initialising and managing the Leaflet map.
 *
 * Purpose:
 * - Handles map setup and global map behaviour.
 *
 * Responsibilities:
 * - Initialise the Leaflet map instance.
 * - Apply image overlay (site map).
 * - Configure zoom, bounds, and constraints.
 * - Create and manage map layers.
 * - Register and store icons for reuse.
 * - Add layer controls (toggle UI).
 *
 * Why this exists:
 * - Centralises all map-related setup.
 * - Prevents map logic from being scattered across the app.
 *
 * Key concepts:
 * - Layers are created and stored here.
 * - Icons are registered once and reused everywhere.
 *
 * Future ideas:
 * - Add map state saving (zoom/position)
 * - Add theme switching (day/night maps)
 */

export class MapManager {
  constructor(siteConfig) {
    this.siteConfig = siteConfig;
    this.map = null;
    this.bounds = [[0, 0], [siteConfig.height, siteConfig.width]];
    this.layers = {};
    this.icons = {};
  }

  init() {
    this.map = L.map("map", {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomSnap: 0.25
    });

    L.imageOverlay(this.siteConfig.image, this.bounds).addTo(this.map);
    this.map.fitBounds(this.bounds);

    const pad = this.siteConfig.maxBoundsPadding || 200;
    this.map.setMaxBounds([
      [-pad, -pad],
      [this.siteConfig.height + pad, this.siteConfig.width + pad]
    ]);
  }

  createLayer(name) {
    this.layers[name] = L.layerGroup();
    return this.layers[name];
  }

  addLayerToMap(name) {
    if (this.layers[name]) {
      this.layers[name].addTo(this.map);
    }
  }

  addLayerControl() {
    const overlays = {};
    for (const [name, layer] of Object.entries(this.layers)) {
      overlays[name] = layer;
    }
    L.control.layers(null, overlays).addTo(this.map);
  }

  registerIcons(iconDefs) {
    for (const [key, def] of Object.entries(iconDefs)) {
      this.icons[key] = L.icon(def);
    }
  }

  getIcon(name) {
    return this.icons[name] || null;
  }
}