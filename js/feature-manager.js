/**
 * feature-manager.js
 * ------------------
 * Handles rendering of map features such as markers and zones.
 *
 * Purpose:
 * - Convert JSON data into visible map elements.
 *
 * Responsibilities:
 * - Add markers (named locations) to layers.
 * - Add polygons (zones) to layers.
 * - Attach popups and tooltips.
 * - Apply hover effects (icon scaling).
 *
 * Why this exists:
 * - Separates "what to draw" (data) from "how to draw it" (logic).
 *
 * Key concepts:
 * - Uses MapManager for icons and map access.
 * - Each feature is created from JSON input.
 *
 * Future ideas:
 * - Add clustering for markers
 * - Add click actions (e.g. open videos, trigger events)
 * - Add feature editing support
 */

export class FeatureManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
  }

  makeHoverIcon(baseIcon, scale = 1.35) {
    const w = baseIcon.options.iconSize[0];
    const h = baseIcon.options.iconSize[1];

    return L.icon({
      iconUrl: baseIcon.options.iconUrl,
      iconSize: [Math.round(w * scale), Math.round(h * scale)],
      iconAnchor: [
        Math.round((baseIcon.options.iconAnchor?.[0] ?? w / 2) * scale),
        Math.round((baseIcon.options.iconAnchor?.[1] ?? h) * scale)
      ],
      popupAnchor: [
        baseIcon.options.popupAnchor?.[0] ?? 0,
        Math.round((baseIcon.options.popupAnchor?.[1] ?? -h) * scale)
      ]
    });
  }

  addMarker(layer, feature) {
    const icon = feature.icon ? this.mapManager.getIcon(feature.icon) : null;
    const marker = L.marker(feature.coords, icon ? { icon } : {})
      .bindPopup(`<b>${feature.name}</b><br>${feature.coords[0]}, ${feature.coords[1]}`)
      .addTo(layer);

    if (icon) {
      const hoverIcon = this.makeHoverIcon(icon);
      marker.on("mouseover", () => marker.setIcon(hoverIcon));
      marker.on("mouseout", () => marker.setIcon(icon));
    }

    return marker;
  }

  addZone(layer, zone) {
    const style = zone.style || {};

    const polygon = L.polygon(zone.coords, {
      color: style.borderColor || "#3388ff",
      fillColor: style.fillColor || "#3388ff",
      weight: style.weight || 2,
      fillOpacity: style.fillOpacity ?? 0.1,
      dashArray: style.dashArray || null
    }).addTo(layer);

    polygon.bindTooltip(zone.name, {
      permanent: true,
      direction: "center",
      className: "zone-label"
    });

    return polygon;
  }
}