/* Runs in the PAGE's JS world at document_start (see manifest "world": "MAIN").
   TradingView paints the chart background inside its canvas, so CSS alone can't
   make it see-through. When Wicked Skins is on, we turn the full-pane background fill
   into a clear. Candles, grid, axes and drawings are untouched.
   Nothing is read or sent anywhere; this only skips one cosmetic fill. */
(function () {
  if (window.__bdHooked) return;
  window.__bdHooked = true;

  const html = document.documentElement;
  let on = html.classList.contains("bd-on");
  new MutationObserver(() => { on = html.classList.contains("bd-on"); })
    .observe(html, { attributes: true, attributeFilter: ["class"] });

  const proto = CanvasRenderingContext2D.prototype;
  const origFill = proto.fillRect;
  const chartCache = new WeakMap();

  function inChart(canvas) {
    let v = chartCache.get(canvas);
    if (v === undefined) {
      v = !!(canvas.closest && canvas.closest(".chart-container, .chart-markup-table"));
      chartCache.set(canvas, v);
    }
    return v;
  }

  // Light TV theme draws dark axis text; on a dark skin that's unreadable. Lighten dark text only.
  const origText = proto.fillText;
  const darkCache = new Map();
  const scratch = document.createElement("canvas").getContext("2d");
  function isDark(style) {
    if (typeof style !== "string") return false;
    let v = darkCache.get(style);
    if (v === undefined) {
      scratch.fillStyle = "#000"; scratch.fillStyle = style;
      const m = scratch.fillStyle.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      const rgb = m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : (scratch.fillStyle.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number);
      v = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] < 110;
      darkCache.set(style, v);
    }
    return v;
  }
  proto.fillText = function (...a) {
    if (on && html.classList.contains("theme-light") && this.canvas && inChart(this.canvas) && isDark(this.fillStyle)) {
      const prev = this.fillStyle;
      this.fillStyle = "#e8eaf0";
      origText.apply(this, a);
      this.fillStyle = prev;
      return;
    }
    return origText.apply(this, a);
  };

  proto.fillRect = function (x, y, w, h) {
    if (on) {
      const c = this.canvas;
      if (c && c.width > 20 && c.height > 20) {
        const s = this.getTransform().a || 1;
        // covers (nearly) the whole canvas => it's the pane background
        if (w * s >= c.width * 0.98 && h * s >= c.height * 0.98 && inChart(c)) {
          return this.clearRect(x, y, w, h);
        }
      }
    }
    return origFill.call(this, x, y, w, h);
  };
})();
