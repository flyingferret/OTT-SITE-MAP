/**
 * grid-manager.js
 * ----------------
 * Responsible for generating and rendering the tactical grid overlay.
 *
 * Purpose:
 * - Draw square grid lines and coordinate labels on the map.
 *
 * Responsibilities:
 * - Generate grid within defined bounds.
 * - Ensure grid cells remain square regardless of map dimensions.
 * - Draw vertical and horizontal lines.
 * - Add column (1,2,3...) and row (A,B,C...) labels.
 *
 * Why this exists:
 * - Keeps grid logic separate from general map and feature logic.
 * - Makes grid easy to enable/disable or modify.
 *
 * Key concepts:
 * - Uses fixed cell size (not fixed rows/columns).
 * - Grid is limited to a specific playable area.
 *
 * Future ideas:
 * - Highlight grid squares on hover
 * - Click-to-copy grid reference (e.g. "F6")
 * - Multiple grid types (coarse/fine)
 */
export class GridManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
  }

  addSquareGridInBounds(layer, gridBounds, cellSize) {
    const top = Math.min(gridBounds.top, gridBounds.bottom);
    const bottom = Math.max(gridBounds.top, gridBounds.bottom);
    const left = Math.min(gridBounds.left, gridBounds.right);
    const right = Math.max(gridBounds.left, gridBounds.right);

    const cols = Math.ceil((right - left) / cellSize);
    const rows = Math.ceil((bottom - top) / cellSize);

    for (let c = 0; c <= cols; c++) {
      let x = left + (c * cellSize);
      if (x > right) x = right;

      L.polyline([[top, x], [bottom, x]], {
        color: "white",
        weight: 1,
        opacity: 0.6
      }).addTo(layer);
    }

    for (let r = 0; r <= rows; r++) {
      let y = top + (r * cellSize);
      if (y > bottom) y = bottom;

      L.polyline([[y, left], [y, right]], {
        color: "white",
        weight: 1,
        opacity: 0.6
      }).addTo(layer);
    }

    for (let c = 0; c < cols; c++) {
      let x = left + (c * cellSize) + (cellSize / 2);

      L.marker([top + cellSize * 0.25, x], {
        interactive: false,
        icon: L.divIcon({
          className: "grid-label",
          html: `<div>${c + 1}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(layer);
    }

    for (let r = 0; r < rows; r++) {
      let y = top + (r * cellSize) + (cellSize / 2);
      const letter = String.fromCharCode(65 + r);

      L.marker([y, left + cellSize * 0.25], {
        interactive: false,
        icon: L.divIcon({
          className: "grid-label",
          html: `<div>${letter}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(layer);
    }
  }
}