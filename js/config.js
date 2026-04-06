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

export const ICON_DEFS = {
  bridge: { iconUrl: "icons/Bridge.png", iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] },
  bunker: { iconUrl: "icons/bunker.png", iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] },
  dragonsNest: { iconUrl: "icons/DragonsNest.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  fuelDump: { iconUrl: "icons/FuelDump.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  fob: { iconUrl: "icons/FOB.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  isaacsHut: { iconUrl: "icons/IsaacsHut.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  policeStation: { iconUrl: "icons/PoliceStation.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  firingPoint: { iconUrl: "icons/FiringPoint.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  saloon: { iconUrl: "icons/Saloon.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] },
  tower: { iconUrl: "icons/Tower.png", iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45] }
};