/**
 * app.js
 * -------
 * Main entry point of the application.
 *
 * Purpose:
 * - Orchestrates loading data and initialising all components.
 *
 * Responsibilities:
 * - Load JSON data (site, locations, zones, subzones).
 * - Create and initialise MapManager.
 * - Create feature, grid, and build mode managers.
 * - Populate layers with data.
 * - Apply default layer visibility.
 * - Initialise UI controls.
 *
 * Why this exists:
 * - Acts as the "glue" between all modules.
 * - Keeps startup logic in one place.
 *
 * Key concepts:
 * - Data-driven rendering (JSON → map)
 * - Modular architecture (each manager has a clear role)
 *
 * Future ideas:
 * - Add loading screen
 * - Add error handling UI
 * - Add game mode switching
 */
 
import { ICON_DEFS } from "./config.js";
import { MapManager } from "./map-manager.js";
import { FeatureManager } from "./feature-manager.js";
import { GridManager } from "./grid-manager.js";
import { BuildModeManager } from "./build-mode.js";
import { ThemeManager } from "./theme-manager.js";
import { GameModeManager } from "./game-mode-manager.js";

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function main() {
  const siteData = await loadJson("./data/site.json");
  const locations = await loadJson("./data/locations.json");
  const zones = await loadJson("./data/zones.json");
  const subzones = await loadJson("./data/subzones.json");

  const mapManager = new MapManager(siteData.site);
  mapManager.init();
  mapManager.registerIcons(ICON_DEFS);

  const featureManager = new FeatureManager(mapManager);
  const gridManager = new GridManager(mapManager);

  const namedLocations = mapManager.createLayer("Named Locations");
  const siteZones = mapManager.createLayer("Site Zones");
  const gameZones = mapManager.createLayer("Game Zones");
  const gridLayer = mapManager.createLayer("Grid");

  locations.forEach(item => featureManager.addMarker(namedLocations, item));
  zones.forEach(item => featureManager.addZone(siteZones, item));
  
  // subzones.forEach(item => featureManager.addZone(gameZones, item));

  gridManager.addSquareGridInBounds(
    gridLayer,
    siteData.grid.bounds,
    siteData.grid.cellSize
  );

  mapManager.addLayerToMap("Named Locations");
  mapManager.addLayerToMap("Site Zones");
  mapManager.addLayerToMap("Game Zones");

  if (siteData.grid.enabledByDefault) {
    mapManager.addLayerToMap("Grid");
  }
  
  const themeManager = new ThemeManager(
    mapManager,
    siteData.themes || {},
    siteData.defaultTheme || "default"
  );

  themeManager.init();
  mapManager.addLayerControl();

  const buildMode = new BuildModeManager(
    mapManager,
    siteData.buildMode.storageKey,
    siteData.buildMode.enabledByDefault
  );
  buildMode.addToggleControl();
  buildMode.enable();
  
  const gameModeManager = new GameModeManager(mapManager, {
  spawnRadius: 90
  });

  gameModeManager.init(subzones);

  mapManager.addLayerToMap("Game Mode - Zone States");
  mapManager.addLayerToMap("Game Mode - Spawns");
  mapManager.addLayerToMap("Game Mode - Items");
}



main().catch(err => {
  console.error(err);
  alert("Failed to load map data.");
});