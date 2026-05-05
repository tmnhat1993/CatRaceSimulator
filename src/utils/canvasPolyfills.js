export function ensureCanvasPolyfills() {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      this.moveTo(x + radius, y);
      this.lineTo(x + w - radius, y);
      this.arcTo(x + w, y, x + w, y + radius, radius);
      this.lineTo(x + w, y + h - radius);
      this.arcTo(x + w, y + h, x + w - radius, y + h, radius);
      this.lineTo(x + radius, y + h);
      this.arcTo(x, y + h, x, y + h - radius, radius);
      this.lineTo(x, y + radius);
      this.arcTo(x, y, x + radius, y, radius);
      this.closePath();
    };
  }
}
