/**
 * game-mode-manager.js
 * --------------------
 * Manages live game-day overlays that are not part of the permanent map data.
 *
 * Purpose:
 * - Allow users to control temporary scenario state directly on the map.
 *
 * Responsibilities:
 * - Toggle game mode on/off
 * - Mark subzones as in bounds / out of bounds / reset
 * - Add team spawn overlays live
 * - Add temporary game items live
 * - Support undo and clear-all actions
 *
 * Notes:
 * - Live data is currently stored in memory only
 * - Intended for game-day control, not permanent site editing
 */

export class GameModeManager {
  constructor(mapManager, options = {}) {
    this.mapManager = mapManager;

    this.enabled = false;
    this.currentTool = "select-zone"; // select-zone | add-spawn | add-item
    this.selectedZoneAction = "in";   // in | out | reset
    this.selectedTeam = "blue";       // blue | red | green | yellow
    this.selectedItemType = "backpack";

    this.spawnRadius = options.spawnRadius ?? 90;
    this.defaultZoneStyle = {
      color: "white",
      fillColor: "white",
      fillOpacity: 0.05,
      weight: 2,
      dashArray: "5,5"
    };

    this.zoneStateStyles = {
      in: {
        color: "limegreen",
        fillColor: "limegreen",
        fillOpacity: 0.18,
        weight: 3,
        dashArray: null
      },
      out: {
        color: "red",
        fillColor: "red",
        fillOpacity: 0.18,
        weight: 3,
        dashArray: null
      },
      reset: this.defaultZoneStyle
    };

    this.teamStyles = {
      blue: { color: "deepskyblue", fillColor: "deepskyblue" },
      red: { color: "red", fillColor: "red" },
      green: { color: "limegreen", fillColor: "limegreen" },
      yellow: { color: "gold", fillColor: "gold" }
    };

    this.zoneLayer = this.mapManager.createLayer("Game Mode - Zone States");
    this.spawnLayer = this.mapManager.createLayer("Game Mode - Spawns");
    this.itemLayer = this.mapManager.createLayer("Game Mode - Items");

    this.zonePolygons = new Map(); // zoneId -> polygon
    this.zoneStates = {};          // zoneId -> in|out|reset
    this.spawns = [];              // live spawn data
    this.items = [];               // live item data
    this.history = [];             // undo stack

    this.selectedZoneId = null;

    this._mapClickHandler = null;
    this._zoneClickHandlersAttached = false;
  }

  init(subzoneFeatures = []) {
    this.addControl();
    this.registerZones(subzoneFeatures);
  }

  registerZones(subzoneFeatures = []) {
    subzoneFeatures.forEach((zone) => {
      if (!zone.id) return;

      const polygon = L.polygon(zone.coords, {
        color: zone.style?.borderColor || this.defaultZoneStyle.color,
        fillColor: zone.style?.fillColor || this.defaultZoneStyle.fillColor,
        fillOpacity: zone.style?.fillOpacity ?? this.defaultZoneStyle.fillOpacity,
        weight: zone.style?.weight || this.defaultZoneStyle.weight,
        dashArray: zone.style?.dashArray || this.defaultZoneStyle.dashArray
      });

      polygon.bindTooltip(zone.name, {
        permanent: true,
        direction: "center",
        className: "zone-label"
      });

      polygon.addTo(this.zoneLayer);
      this.zonePolygons.set(zone.id, polygon);

      polygon.on("click", () => {
        if (!this.enabled) return;
        if (this.currentTool !== "select-zone") return;

        this.selectedZoneId = zone.id;
        this.applyZoneState(zone.id, this.selectedZoneAction, true);
      });
    });
  }

  addControl() {
    const control = L.control({ position: "topright" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.classList.add("game-mode-control");
      div.style.background = "white";
      div.style.padding = "8px";
      div.style.minWidth = "220px";

      div.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px;">Game Mode</div>

        <div style="margin-bottom:8px;">
          <button type="button" id="gm-toggle">${this.enabled ? "Disable" : "Enable"}</button>
        </div>

        <div style="margin-bottom:6px; font-size:12px;">Tool</div>
        <div style="margin-bottom:8px;">
          <select id="gm-tool" style="width:100%;">
            <option value="select-zone">Zone State</option>
            <option value="add-spawn">Add Spawn</option>
            <option value="add-item">Add Item</option>
          </select>
        </div>

        <div style="margin-bottom:6px; font-size:12px;">Zone Action</div>
        <div style="margin-bottom:8px;">
          <select id="gm-zone-action" style="width:100%;">
            <option value="in">In Bounds</option>
            <option value="out">Out of Bounds</option>
            <option value="reset">Reset</option>
          </select>
        </div>

        <div style="margin-bottom:6px; font-size:12px;">Spawn Team</div>
        <div style="margin-bottom:8px;">
          <select id="gm-team" style="width:100%;">
            <option value="blue">Blue Team</option>
            <option value="red">Red Team</option>
            <option value="green">Green Team</option>
            <option value="yellow">Yellow Team</option>
          </select>
        </div>

        <div style="margin-bottom:6px; font-size:12px;">Item Type</div>
        <div style="margin-bottom:8px;">
          <select id="gm-item-type" style="width:100%;">
            <option value="backpack">Backpack</option>
            <option value="bomb">Bomb</option>
            <option value="crate">Crate</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <button type="button" id="gm-undo">Undo Last</button>
          <button type="button" id="gm-clear">Clear All</button>
        </div>

        <div id="gm-status" style="margin-top:8px; font-size:12px; color:#444;">
          Disabled
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);

      setTimeout(() => {
        const toggleBtn = div.querySelector("#gm-toggle");
        const toolSelect = div.querySelector("#gm-tool");
        const zoneActionSelect = div.querySelector("#gm-zone-action");
        const teamSelect = div.querySelector("#gm-team");
        const itemTypeSelect = div.querySelector("#gm-item-type");
        const undoBtn = div.querySelector("#gm-undo");
        const clearBtn = div.querySelector("#gm-clear");
        const statusEl = div.querySelector("#gm-status");

        toolSelect.value = this.currentTool;
        zoneActionSelect.value = this.selectedZoneAction;
        teamSelect.value = this.selectedTeam;
        itemTypeSelect.value = this.selectedItemType;

        const updateStatus = () => {
          statusEl.textContent = this.enabled
            ? `Enabled • Tool: ${this.currentTool}`
            : "Disabled";
          toggleBtn.textContent = this.enabled ? "Disable" : "Enable";
        };

        toggleBtn.onclick = () => {
          this.enabled = !this.enabled;
          this.refreshMapInteraction();
          updateStatus();
        };

        toolSelect.onchange = (e) => {
          this.currentTool = e.target.value;
          updateStatus();
        };

        zoneActionSelect.onchange = (e) => {
          this.selectedZoneAction = e.target.value;
        };

        teamSelect.onchange = (e) => {
          this.selectedTeam = e.target.value;
        };

        itemTypeSelect.onchange = (e) => {
          this.selectedItemType = e.target.value;
        };

        undoBtn.onclick = () => this.undoLast();
        clearBtn.onclick = () => this.clearAll();

        updateStatus();
      }, 0);

      return div;
    };

    control.addTo(this.mapManager.map);
  }

  refreshMapInteraction() {
    if (this._mapClickHandler) {
      this.mapManager.map.off("click", this._mapClickHandler);
      this._mapClickHandler = null;
    }

    if (!this.enabled) return;

    this._mapClickHandler = (e) => {
      const coords = [Math.round(e.latlng.lat), Math.round(e.latlng.lng)];

      if (this.currentTool === "add-spawn") {
        this.addSpawn(coords, this.selectedTeam);
      } else if (this.currentTool === "add-item") {
        this.addItem(coords, this.selectedItemType);
      }
    };

    this.mapManager.map.on("click", this._mapClickHandler);
  }

  applyZoneState(zoneId, state, recordHistory = false) {
    const polygon = this.zonePolygons.get(zoneId);
    if (!polygon) return;

    const prevState = this.zoneStates[zoneId] || "reset";
    const nextStyle = this.zoneStateStyles[state] || this.defaultZoneStyle;

    polygon.setStyle(nextStyle);
    this.zoneStates[zoneId] = state;

    if (recordHistory) {
      this.history.push({
        type: "zone-state",
        zoneId,
        prevState,
        nextState: state
      });
    }
  }

  addSpawn(coords, team) {
    const style = this.teamStyles[team] || this.teamStyles.blue;

    const circle = L.circle(coords, {
      radius: this.spawnRadius,
      color: style.color,
      fillColor: style.fillColor,
      fillOpacity: 0.2,
      weight: 2,
      interactive: false
    }).addTo(this.spawnLayer);

    const spawn = {
      id: `spawn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coords,
      team,
      circle
    };

    this.spawns.push(spawn);
    this.history.push({
      type: "spawn-add",
      spawnId: spawn.id
    });
  }

  createItemIcon(type) {
    const iconMap = {
      backpack: "icons/game-items/backpack-green.png",
      bomb: "icons/game-items/bomb.png",
      crate: "icons/game-items/crate.png"
    };

    const path = iconMap[type] || iconMap.backpack;
    const size = 42;

    return L.icon({
      iconUrl: path,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  }

  addItem(coords, type) {
    const marker = L.marker(coords, {
      icon: this.createItemIcon(type)
    })
      .bindPopup(`<b>${this.prettyItemName(type)}</b>`)
      .addTo(this.itemLayer);

    const item = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coords,
      type,
      marker
    };

    this.items.push(item);
    this.history.push({
      type: "item-add",
      itemId: item.id
    });
  }

  prettyItemName(type) {
    const names = {
      backpack: "Backpack",
      bomb: "Bomb",
      crate: "Crate"
    };
    return names[type] || type;
  }

  undoLast() {
    const last = this.history.pop();
    if (!last) return;

    if (last.type === "zone-state") {
      this.applyZoneState(last.zoneId, last.prevState, false);
      return;
    }

    if (last.type === "spawn-add") {
      const idx = this.spawns.findIndex(s => s.id === last.spawnId);
      if (idx >= 0) {
        this.spawnLayer.removeLayer(this.spawns[idx].circle);
        this.spawns.splice(idx, 1);
      }
      return;
    }

    if (last.type === "item-add") {
      const idx = this.items.findIndex(i => i.id === last.itemId);
      if (idx >= 0) {
        this.itemLayer.removeLayer(this.items[idx].marker);
        this.items.splice(idx, 1);
      }
    }
  }

  clearAll() {
    Object.keys(this.zoneStates).forEach(zoneId => {
      this.applyZoneState(zoneId, "reset", false);
    });

    this.zoneStates = {};
    this.selectedZoneId = null;

    this.spawns.forEach(spawn => {
      this.spawnLayer.removeLayer(spawn.circle);
    });
    this.spawns = [];

    this.items.forEach(item => {
      this.itemLayer.removeLayer(item.marker);
    });
    this.items = [];

    this.history = [];
  }
}