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

  buildPopupHtml(feature) {
    const description = feature.description
      ? `<p class="popup-description">${feature.description}</p>`
      : "";

    const images = feature.images || [];
    let galleryHtml = "";

    if (images.length > 0) {
      galleryHtml = `
        <div class="popup-gallery" data-location-id="${feature.id || feature.name}">
          <img 
            src="${images[0]}" 
            alt="${feature.name}" 
            class="popup-image"
            data-images='${JSON.stringify(images)}'
            data-index="0"
          />
          ${
            images.length > 1
              ? `
                <div class="popup-gallery-controls">
                  <button type="button" class="popup-prev">◀</button>
                  <span class="popup-counter">1 / ${images.length}</span>
                  <button type="button" class="popup-next">▶</button>
                </div>
              `
              : ""
          }
        </div>
      `;
    }

    return `
      <div class="popup-content">
        <h3 class="popup-title">${feature.name}</h3>
        ${galleryHtml}
        ${description}
      </div>
    `;
  }

  addMarker(layer, feature) {
    const icon = feature.icon ? this.mapManager.getIcon(feature.icon) : null;

    const marker = L.marker(feature.coords, icon ? { icon } : {})
      .bindPopup(this.buildPopupHtml(feature), {
        maxWidth: 320
      })
      .addTo(layer);

    if (icon) {
      const hoverIcon = this.makeHoverIcon(icon);
      marker.on("mouseover", () => marker.setIcon(hoverIcon));
      marker.on("mouseout", () => marker.setIcon(icon));
    }

    marker.on("popupopen", (e) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      const gallery = popupEl.querySelector(".popup-gallery");
      if (!gallery) return;

      const img = gallery.querySelector(".popup-image");
      const prevBtn = gallery.querySelector(".popup-prev");
      const nextBtn = gallery.querySelector(".popup-next");
      const counter = gallery.querySelector(".popup-counter");

      if (!img) return;

      const images = JSON.parse(img.dataset.images || "[]");
      let currentIndex = parseInt(img.dataset.index || "0", 10);

      const updateImage = () => {
        img.src = images[currentIndex];
        img.dataset.index = String(currentIndex);
        if (counter) {
          counter.textContent = `${currentIndex + 1} / ${images.length}`;
        }
      };

      if (prevBtn) {
        prevBtn.onclick = () => {
          currentIndex = (currentIndex - 1 + images.length) % images.length;
          updateImage();
        };
      }

      if (nextBtn) {
        nextBtn.onclick = () => {
          currentIndex = (currentIndex + 1) % images.length;
          updateImage();
        };
      }
    });

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