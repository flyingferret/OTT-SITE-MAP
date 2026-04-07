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
 * - Create feature, grid, theme, game mode, build mode, and UI managers.
 * - Populate layers with data.
 * - Apply default layer visibility.
 * - Initialise UI controls.
 */

import { ICON_DEFS } from "./config.js";
import { MapManager } from "./map-manager.js";
import { FeatureManager } from "./feature-manager.js";
import { GridManager } from "./grid-manager.js";
import { BuildModeManager } from "./build-mode.js";
import { ThemeManager } from "./theme-manager.js";
import { GameModeManager } from "./game-mode-manager.js";
import { MapUiManager } from "./map-ui-manager.js";

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Invalid JSON in ${path}: ${err.message}`);
  }
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
  const gridLayer = mapManager.createLayer("Grid");

  locations.forEach(item => featureManager.addMarker(namedLocations, item));
  zones.forEach(item => featureManager.addZone(siteZones, item));

  gridManager.addSquareGridInBounds(
    gridLayer,
    siteData.grid.bounds,
    siteData.grid.cellSize
  );

  mapManager.addLayerToMap("Named Locations");
  mapManager.addLayerToMap("Site Zones");

  if (siteData.grid.enabledByDefault) {
    mapManager.addLayerToMap("Grid");
  }

  const themeManager = new ThemeManager(
    mapManager,
    siteData.themes || {},
    siteData.defaultTheme || "default"
  );
  themeManager.init();

  const buildMode = new BuildModeManager(
    mapManager,
    siteData.buildMode.storageKey,
    siteData.buildMode.enabledByDefault
  );
  buildMode.enable();

  const gameModeManager = new GameModeManager(mapManager, {
    spawnRadius: 90
  });
  gameModeManager.init(subzones);

  mapManager.addLayerToMap("Game Mode - Zone States");
  mapManager.addLayerToMap("Game Mode - Spawns");
  mapManager.addLayerToMap("Game Mode - Items");

  mapManager.addLayerControl();

  const mapUiManager = new MapUiManager(mapManager, {
    gameModeManager,
    themeManager,
    buildModeManager: buildMode
  });
  mapUiManager.init();
}

main().catch(err => {
  console.error(err);

  alert(
    `Error loading map:\n\n${err.message}\n\nCheck console for details.`
  );
});