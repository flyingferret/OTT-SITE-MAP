/**
 * theme-manager.js
 * ----------------
 * Handles switching between map image themes.
 *
 * Purpose:
 * - Manage the current map theme and apply the correct base image.
 *
 * Responsibilities:
 * - Track available themes
 * - Load saved theme from localStorage
 * - Apply theme image changes to the map
 *
 * Notes:
 * - UI is handled by MapUiManager
 * - This class handles theme logic only
 */

export class ThemeManager {
  constructor(mapManager, themes = {}, defaultTheme = "default") {
    this.mapManager = mapManager;
    this.themes = themes;
    this.currentTheme = defaultTheme;
    this.storageKey = "mapTheme";
  }

  init() {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    } else if (!this.themes[this.currentTheme]) {
      const firstTheme = Object.keys(this.themes)[0];
      if (firstTheme) {
        this.currentTheme = firstTheme;
      }
    }

    if (this.currentTheme) {
      this.applyTheme(this.currentTheme);
    }
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) return;

    this.currentTheme = themeName;
    localStorage.setItem(this.storageKey, themeName);
    this.mapManager.setBaseImage(this.themes[themeName]);
  }

  getThemeNames() {
    return Object.keys(this.themes || {});
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}