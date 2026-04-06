/**
 * config.js
 * ----------
 * Central configuration for the map application.
 *
 * Purpose:
 * - Defines reusable static configuration data.
 * - Currently used to store icon definitions.
 *
 * Responsibilities:
 * - Map icon keys (e.g. "bridge", "fob") to Leaflet icon settings.
 * - Acts as a single source of truth for visual assets.
 *
 * Why this exists:
 * - Keeps hardcoded values out of logic files.
 * - Makes it easy to update icons without touching map code.
 *
 * Future ideas:
 * - Add colour schemes
 * - Add game mode configs
 * - Add UI settings (default layers, zoom levels)
 */


/**
 * Helper to create consistent Leaflet icons
 */
 
const isMobile = window.innerWidth < 768;

function createIcon(path, size = 40) {
  const finalSize = isMobile ? size * 1.2 : size;

  return L.icon({
    iconUrl: path,
    iconSize: [finalSize , finalSize],
    iconAnchor: [finalSize / 2, finalSize /2],
    popupAnchor: [0, -finalSize]
  });
}

// Export icon definitions
export const ICON_DEFS = {
  bridge: createIcon("icons/Bridge.png", 45),
  bunker: createIcon("icons/bunker.png", 40),
  dragonsNest: createIcon("icons/DragonsNest.png", 50),
  fuelDump: createIcon("icons/FuelDump.png", 50),
  firingPoint: createIcon("icons/FiringPoint.png", 50),
  fob: createIcon("icons/FOB.png", 55),
  policeStation: createIcon("icons/PoliceStation.png", 50),
  caravan: createIcon("icons/Caravan.png", 45),
  tower: createIcon("icons/Tower.png", 50),
  saloon: createIcon("icons/Saloon.png", 50),
  cp: createIcon("icons/cp.png", 55),
  isaacsHut: createIcon("icons/IsaacsHut.png", 50)
};

