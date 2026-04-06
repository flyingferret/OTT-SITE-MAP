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
    }

    this.applyTheme(this.currentTheme);
    this.addControl();
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) return;

    this.currentTheme = themeName;
    localStorage.setItem(this.storageKey, themeName);
    this.mapManager.setBaseImage(this.themes[themeName]);
  }

  addControl() {
    const control = L.control({ position: "topright" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.background = "white";
      div.style.padding = "8px";

      const options = Object.keys(this.themes)
        .map(name => {
          const selected = name === this.currentTheme ? "selected" : "";
          return `<option value="${name}" ${selected}>${name}</option>`;
        })
        .join("");

      div.innerHTML = `
        <label for="theme-select" style="font-size: 12px; display:block; margin-bottom:4px;">Theme</label>
        <select id="theme-select">
          ${options}
        </select>
      `;

      L.DomEvent.disableClickPropagation(div);

      setTimeout(() => {
        const select = div.querySelector("#theme-select");
        select.addEventListener("change", (e) => {
          this.applyTheme(e.target.value);
        });
      }, 0);

      return div;
    };

    control.addTo(this.mapManager.map);
  }
}