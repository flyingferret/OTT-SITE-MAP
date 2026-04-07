/**
 * map-ui-manager.js
 * -----------------
 * Central mobile-first UI manager for the interactive map.
 *
 * Purpose:
 * - Provide a single modern drawer-based interface for map tools.
 *
 * Responsibilities:
 * - Create and manage the floating action button
 * - Render the bottom drawer
 * - Switch between Game / Theme / Build tabs
 * - Connect UI actions to the relevant managers
 *
 * Notes:
 * - This file owns UI only
 * - Game logic stays in GameModeManager
 * - Theme logic stays in ThemeManager
 * - Build logic stays in BuildModeManager
 */

export class MapUiManager {
  constructor(mapManager, options = {}) {
    this.mapManager = mapManager;
    this.gameModeManager = options.gameModeManager || null;
    this.themeManager = options.themeManager || null;
    this.buildModeManager = options.buildModeManager || null;

    this.drawerOpen = false;
    this.activePanel = "game";

    this.fabEl = null;
    this.statusPillEl = null;
    this.drawerEl = null;
  }

  init() {
    this.createFab();
    this.createStatusPill();
    this.createDrawer();
    this.refreshUi();
  }

  createFab() {
    const fab = document.createElement("button");
    fab.className = "map-ui-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Open Map Tools");
    fab.textContent = "🗺️";

    fab.addEventListener("click", () => {
      this.drawerOpen = !this.drawerOpen;
      this.refreshUi();
    });

    document.body.appendChild(fab);
    this.fabEl = fab;
  }

  createStatusPill() {
    const pill = document.createElement("div");
    pill.className = "map-ui-status-pill";
    document.body.appendChild(pill);
    this.statusPillEl = pill;
  }

  createDrawer() {
    const drawer = document.createElement("div");
    drawer.className = "map-ui-drawer";

    drawer.innerHTML = `
      <div class="map-ui-drawer-sheet">
        <div class="map-ui-drawer-handle"></div>

        <div class="map-ui-drawer-header">
          <div>
            <div class="map-ui-title">Map Tools</div>
            <div class="map-ui-subtitle" id="map-ui-subtitle">Ready</div>
          </div>
          <button type="button" class="map-ui-close-btn" id="map-ui-close-btn">✕</button>
        </div>

        <div class="map-ui-top-tabs" id="map-ui-top-tabs">
          <button type="button" data-panel="game">Game</button>
          <button type="button" data-panel="theme">Theme</button>
          <button type="button" data-panel="build">Build</button>
        </div>

        <div id="map-ui-panel-content"></div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.drawerEl = drawer;

    drawer.querySelector("#map-ui-close-btn").addEventListener("click", () => {
      this.drawerOpen = false;
      this.refreshUi();
    });

    drawer.querySelector("#map-ui-top-tabs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-panel]");
      if (!btn) return;
      this.activePanel = btn.dataset.panel;
      this.refreshUi();
    });
  }

  refreshUi() {
    if (this.drawerEl) {
      this.drawerEl.classList.toggle("open", this.drawerOpen);
    }

    if (!this.drawerEl || !this.statusPillEl) return;

    this.updateStatusPill();

    const subtitle = this.drawerEl.querySelector("#map-ui-subtitle");
    const tabs = this.drawerEl.querySelectorAll("[data-panel]");
    const panelContent = this.drawerEl.querySelector("#map-ui-panel-content");

    subtitle.textContent = this.getSubtitle();

    tabs.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === this.activePanel);
    });

    panelContent.innerHTML = this.buildPanelHtml();
    this.bindPanelEvents(panelContent);
  }

  updateStatusPill() {
    const gameOn = this.gameModeManager?.enabled;
    const buildOn = this.buildModeManager?.isEnabled
      ? this.buildModeManager.isEnabled()
      : this.buildModeManager?.enabled;

    let text = "Map Ready";
    if (gameOn && buildOn) text = "🎮 Game ON · 🛠️ Build ON";
    else if (gameOn) text = "🎮 Game ON";
    else if (buildOn) text = "🛠️ Build ON";

    this.statusPillEl.textContent = text;
  }

  getSubtitle() {
    if (this.activePanel === "game") return "Scenario tools";
    if (this.activePanel === "theme") return "Map appearance";
    if (this.activePanel === "build") return "Developer tools";
    return "Ready";
  }

  buildPanelHtml() {
    if (this.activePanel === "game") return this.buildGamePanelHtml();
    if (this.activePanel === "theme") return this.buildThemePanelHtml();
    if (this.activePanel === "build") return this.buildBuildPanelHtml();
    return "";
  }

  buildGamePanelHtml() {
    if (!this.gameModeManager) {
      return `<div class="map-ui-helper-text">Game mode manager unavailable.</div>`;
    }

    const gm = this.gameModeManager;

    return `
      <div class="map-ui-section">
        <button type="button" id="gm-enable-btn" class="map-ui-primary-btn ${gm.enabled ? "is-on" : ""}">
          ${gm.enabled ? "Disable Game Mode" : "Enable Game Mode"}
        </button>
      </div>

      <div class="map-ui-section">
        <div class="map-ui-label">Tool</div>
        <div class="map-ui-segment" id="gm-tool-segment">
          <button type="button" data-tool="select-zone" class="${gm.currentTool === "select-zone" ? "active" : ""}">Zone</button>
          <button type="button" data-tool="add-spawn" class="${gm.currentTool === "add-spawn" ? "active" : ""}">Spawn</button>
          <button type="button" data-tool="add-item" class="${gm.currentTool === "add-item" ? "active" : ""}">Item</button>
        </div>
      </div>

      ${this.buildGameContextHtml(gm)}

      <div class="map-ui-section">
        <div class="map-ui-actions">
          <button type="button" id="gm-undo-btn">Undo</button>
          <button type="button" id="gm-clear-btn">Clear All</button>
        </div>
      </div>
    `;
  }

  buildGameContextHtml(gm) {
    if (gm.currentTool === "select-zone") {
      return `
        <div class="map-ui-section">
          <div class="map-ui-label">Zone State</div>
          <div class="map-ui-segment">
            <button type="button" data-zone-action="in" class="${gm.selectedZoneAction === "in" ? "active" : ""}">In</button>
            <button type="button" data-zone-action="out" class="${gm.selectedZoneAction === "out" ? "active" : ""}">Out</button>
            <button type="button" data-zone-action="reset" class="${gm.selectedZoneAction === "reset" ? "active" : ""}">Reset</button>
          </div>
          <div class="map-ui-helper-text">Tap a subzone to apply the selected state.</div>
        </div>
      `;
    }

    if (gm.currentTool === "add-spawn") {
      return `
        <div class="map-ui-section">
          <div class="map-ui-label">Spawn Team</div>
          <div class="map-ui-segment map-ui-segment-2">
            <button type="button" data-team="blue" class="${gm.selectedTeam === "blue" ? "active" : ""}">Blue</button>
            <button type="button" data-team="red" class="${gm.selectedTeam === "red" ? "active" : ""}">Red</button>
            <button type="button" data-team="green" class="${gm.selectedTeam === "green" ? "active" : ""}">Green</button>
            <button type="button" data-team="yellow" class="${gm.selectedTeam === "yellow" ? "active" : ""}">Yellow</button>
          </div>
          <div class="map-ui-helper-text">Tap the map to place a spawn circle.</div>
        </div>
      `;
    }

    if (gm.currentTool === "add-item") {
      return `
        <div class="map-ui-section">
          <div class="map-ui-label">Item Type</div>
          <div class="map-ui-segment">
            <button type="button" data-item-type="backpack" class="${gm.selectedItemType === "backpack" ? "active" : ""}">Backpack</button>
            <button type="button" data-item-type="bomb" class="${gm.selectedItemType === "bomb" ? "active" : ""}">Bomb</button>
            <button type="button" data-item-type="crate" class="${gm.selectedItemType === "crate" ? "active" : ""}">Crate</button>
          </div>
          <div class="map-ui-helper-text">Tap the map to place the selected item.</div>
        </div>
      `;
    }

    return "";
  }

  buildThemePanelHtml() {
    if (!this.themeManager) {
      return `<div class="map-ui-helper-text">Theme manager unavailable.</div>`;
    }

    const themes = this.themeManager.getThemeNames
      ? this.themeManager.getThemeNames()
      : Object.keys(this.themeManager.themes || {});

    const currentTheme = this.themeManager.getCurrentTheme
      ? this.themeManager.getCurrentTheme()
      : this.themeManager.currentTheme;

    return `
      <div class="map-ui-section">
        <div class="map-ui-label">Theme</div>
        <div class="map-ui-theme-list">
          ${themes.map((theme) => `
            <button type="button" data-theme="${theme}" class="${theme === currentTheme ? "active" : ""}">
              ${theme}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  buildBuildPanelHtml() {
    if (!this.buildModeManager) {
      return `<div class="map-ui-helper-text">Build mode manager unavailable.</div>`;
    }

    const enabled = this.buildModeManager.isEnabled
      ? this.buildModeManager.isEnabled()
      : this.buildModeManager.enabled;

    return `
      <div class="map-ui-section">
        <button type="button" id="build-toggle-btn" class="map-ui-primary-btn ${enabled ? "is-on" : ""}">
          ${enabled ? "Disable Build Mode" : "Enable Build Mode"}
        </button>
        <div class="map-ui-helper-text">
          Use build mode to inspect coordinates and create draft content.
        </div>
      </div>
    `;
  }

  bindPanelEvents(panelContent) {
    if (this.activePanel === "game") {
      this.bindGameEvents(panelContent);
      return;
    }

    if (this.activePanel === "theme") {
      this.bindThemeEvents(panelContent);
      return;
    }

    if (this.activePanel === "build") {
      this.bindBuildEvents(panelContent);
    }
  }

  bindGameEvents(panelContent) {
    const gm = this.gameModeManager;
    if (!gm) return;

    const enableBtn = panelContent.querySelector("#gm-enable-btn");
    if (enableBtn) {
      enableBtn.addEventListener("click", () => {
        gm.setEnabled ? gm.setEnabled(!gm.enabled) : (gm.enabled = !gm.enabled);
        gm.refreshMapInteraction?.();
        this.refreshUi();
      });
    }

    panelContent.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gm.setTool ? gm.setTool(btn.dataset.tool) : (gm.currentTool = btn.dataset.tool);
        gm.refreshMapInteraction?.();
        this.refreshUi();
      });
    });

    panelContent.querySelectorAll("[data-zone-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gm.setZoneAction ? gm.setZoneAction(btn.dataset.zoneAction) : (gm.selectedZoneAction = btn.dataset.zoneAction);
        this.refreshUi();
      });
    });

    panelContent.querySelectorAll("[data-team]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gm.setTeam ? gm.setTeam(btn.dataset.team) : (gm.selectedTeam = btn.dataset.team);
        this.refreshUi();
      });
    });

    panelContent.querySelectorAll("[data-item-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gm.setItemType ? gm.setItemType(btn.dataset.itemType) : (gm.selectedItemType = btn.dataset.itemType);
        this.refreshUi();
      });
    });

    const undoBtn = panelContent.querySelector("#gm-undo-btn");
    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        gm.undoLast();
        this.refreshUi();
      });
    }

    const clearBtn = panelContent.querySelector("#gm-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        gm.clearAll();
        this.refreshUi();
      });
    }
  }

  bindThemeEvents(panelContent) {
    if (!this.themeManager) return;

    panelContent.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.themeManager.applyTheme(btn.dataset.theme);
        this.refreshUi();
      });
    });
  }

  bindBuildEvents(panelContent) {
    if (!this.buildModeManager) return;

    const toggleBtn = panelContent.querySelector("#build-toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (this.buildModeManager.toggle) {
          this.buildModeManager.toggle();
        } else {
          this.buildModeManager.enabled = !this.buildModeManager.enabled;
        }
        this.refreshUi();
      });
    }
  }
}