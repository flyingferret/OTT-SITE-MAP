/**
 * game-mode-manager.js
 * --------------------
 * Mobile-first live game-day overlay manager.
 *
 * Features:
 * - Floating action button to open/close game drawer
 * - Bottom drawer UI for mobile
 * - Zone state editing (in/out/reset)
 * - Live spawn placement
 * - Live game item placement
 * - Undo / clear all
 *
 * Notes:
 * - Live data is in memory only for now
 * - Subzones must include stable `id` values in JSON
 */

export class GameModeManager {
  constructor(mapManager, options = {}) {
    this.mapManager = mapManager;

    this.enabled = false;
    this.drawerOpen = false;

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
    this.spawns = [];
    this.items = [];
    this.history = [];

    this.selectedZoneId = null;

    this._mapClickHandler = null;

    this.drawerEl = null;
    this.fabEl = null;
    this.statusPillEl = null;
  }

  init(subzoneFeatures = []) {
    this.registerZones(subzoneFeatures);
    this.createFab();
    this.createStatusPill();
    this.createDrawer();
    this.refreshUi();
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
        this.refreshUi();
      });
    });
  }

  createFab() {
    const fab = document.createElement("button");
    fab.className = "gm-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Open Game Mode");
    fab.textContent = "🎮";

    fab.addEventListener("click", () => {
      this.drawerOpen = !this.drawerOpen;
      this.refreshUi();
    });

    document.body.appendChild(fab);
    this.fabEl = fab;
  }

  createStatusPill() {
    const pill = document.createElement("div");
    pill.className = "gm-status-pill";
    document.body.appendChild(pill);
    this.statusPillEl = pill;
  }

  createDrawer() {
    const drawer = document.createElement("div");
    drawer.className = "gm-drawer";
    drawer.innerHTML = `
      <div class="gm-drawer-sheet">
        <div class="gm-drawer-handle"></div>

        <div class="gm-drawer-header">
          <div class="gm-title-wrap">
            <div class="gm-title">Game Mode</div>
            <div class="gm-subtitle" id="gm-subtitle">Disabled</div>
          </div>
          <button type="button" class="gm-close-btn" id="gm-close-btn">✕</button>
        </div>

        <div class="gm-main-toggle">
          <button type="button" id="gm-enable-btn" class="gm-primary-btn">Enable Game Mode</button>
        </div>

        <div class="gm-section">
          <div class="gm-label">Tool</div>
          <div class="gm-segment" id="gm-tool-segment">
            <button type="button" data-tool="select-zone">Zone</button>
            <button type="button" data-tool="add-spawn">Spawn</button>
            <button type="button" data-tool="add-item">Item</button>
          </div>
        </div>

        <div id="gm-context-panel"></div>

        <div class="gm-section">
          <div class="gm-actions">
            <button type="button" id="gm-undo-btn">Undo</button>
            <button type="button" id="gm-clear-btn">Clear All</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.drawerEl = drawer;

    drawer.querySelector("#gm-close-btn").addEventListener("click", () => {
      this.drawerOpen = false;
      this.refreshUi();
    });

    drawer.querySelector("#gm-enable-btn").addEventListener("click", () => {
      this.enabled = !this.enabled;
      this.refreshMapInteraction();
      this.refreshUi();
    });

    drawer.querySelector("#gm-tool-segment").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tool]");
      if (!btn) return;
      this.currentTool = btn.dataset.tool;
      this.refreshMapInteraction();
      this.refreshUi();
    });

    drawer.querySelector("#gm-undo-btn").addEventListener("click", () => {
      this.undoLast();
      this.refreshUi();
    });

    drawer.querySelector("#gm-clear-btn").addEventListener("click", () => {
      this.clearAll();
      this.refreshUi();
    });
  }

  refreshUi() {
    if (this.drawerEl) {
      this.drawerEl.classList.toggle("open", this.drawerOpen);
    }

    if (this.statusPillEl) {
      const toolLabel = this.prettyToolName(this.currentTool);
      this.statusPillEl.textContent = this.enabled
        ? `🎮 ON · ${toolLabel}`
        : `🎮 OFF`;
    }

    if (!this.drawerEl) return;

    const subtitle = this.drawerEl.querySelector("#gm-subtitle");
    const enableBtn = this.drawerEl.querySelector("#gm-enable-btn");
    const toolButtons = this.drawerEl.querySelectorAll("[data-tool]");
    const contextPanel = this.drawerEl.querySelector("#gm-context-panel");

    subtitle.textContent = this.enabled
      ? `Enabled · ${this.prettyToolName(this.currentTool)}`
      : "Disabled";

    enableBtn.textContent = this.enabled ? "Disable Game Mode" : "Enable Game Mode";
    enableBtn.classList.toggle("is-on", this.enabled);

    toolButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === this.currentTool);
    });

    contextPanel.innerHTML = this.buildContextPanelHtml();
    this.bindContextPanelEvents(contextPanel);
  }

  buildContextPanelHtml() {
    if (this.currentTool === "select-zone") {
      return `
        <div class="gm-section">
          <div class="gm-label">Zone State</div>
          <div class="gm-segment" id="gm-zone-state-segment">
            <button type="button" data-zone-action="in">In Bounds</button>
            <button type="button" data-zone-action="out">Out of Bounds</button>
            <button type="button" data-zone-action="reset">Reset</button>
          </div>
          <div class="gm-helper-text">
            Tap a subzone on the map to apply the selected state.
          </div>
        </div>
      `;
    }

    if (this.currentTool === "add-spawn") {
      return `
        <div class="gm-section">
          <div class="gm-label">Spawn Team</div>
          <div class="gm-segment" id="gm-team-segment">
            <button type="button" data-team="blue">Blue</button>
            <button type="button" data-team="red">Red</button>
            <button type="button" data-team="green">Green</button>
            <button type="button" data-team="yellow">Yellow</button>
          </div>
          <div class="gm-helper-text">
            Tap the map to place a spawn circle.
          </div>
        </div>
      `;
    }

    if (this.currentTool === "add-item") {
      return `
        <div class="gm-section">
          <div class="gm-label">Item Type</div>
          <div class="gm-segment" id="gm-item-segment">
            <button type="button" data-item="backpack">Backpack</button>
            <button type="button" data-item="bomb">Bomb</button>
            <button type="button" data-item="crate">Crate</button>
          </div>
          <div class="gm-helper-text">
            Tap the map to place the selected item.
          </div>
        </div>
      `;
    }

    return "";
  }

  bindContextPanelEvents(contextPanel) {
    const zoneBtns = contextPanel.querySelectorAll("[data-zone-action]");
    zoneBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.zoneAction === this.selectedZoneAction);
      btn.addEventListener("click", () => {
        this.selectedZoneAction = btn.dataset.zoneAction;
        this.refreshUi();
      });
    });

    const teamBtns = contextPanel.querySelectorAll("[data-team]");
    teamBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.team === this.selectedTeam);
      btn.addEventListener("click", () => {
        this.selectedTeam = btn.dataset.team;
        this.refreshUi();
      });
    });

    const itemBtns = contextPanel.querySelectorAll("[data-item]");
    itemBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.item === this.selectedItemType);
      btn.addEventListener("click", () => {
        this.selectedItemType = btn.dataset.item;
        this.refreshUi();
      });
    });
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
      fillOpacity: 0.22,
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

  prettyToolName(tool) {
    const names = {
      "select-zone": "Zone",
      "add-spawn": "Spawn",
      "add-item": "Item"
    };
    return names[tool] || tool;
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

  setEnabled(isEnabled) {
    this.enabled = isEnabled;
    this.refreshMapInteraction();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setZoneAction(action) {
    this.selectedZoneAction = action;
  }

  setTeam(team) {
    this.selectedTeam = team;
  }

  setItemType(type) {
    this.selectedItemType = type;
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