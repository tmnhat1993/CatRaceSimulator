import CatRace from "./game/CatRace.js";
import { ensureCanvasPolyfills } from "./utils/canvasPolyfills.js";

window.addEventListener("DOMContentLoaded", () => {
  ensureCanvasPolyfills();
  new CatRace();
});
