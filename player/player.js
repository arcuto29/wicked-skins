/* Plays a wallpaper stored in the extension's IndexedDB. Embedded by content.js as an
   iframe behind the chart. Look settings (fit, position, speed, pause) arrive via postMessage. */
(async function () {
  const q = new URLSearchParams(location.search);
  const id = q.get("id"), type = q.get("type");
  let el, look = {};

  function apply() {
    if (!el) return;
    el.style.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[look.fit] || "cover";
    el.style.objectPosition = `${look.posX ?? 50}% ${look.posY ?? 50}%`;
    if (el.tagName === "VIDEO") {
      el.playbackRate = Math.max(0.25, Math.min(4, look.speed || 1));
      look.paused ? el.pause() : el.play().catch(() => {});
    }
  }

  addEventListener("message", (e) => {
    if (!e.data || e.data.__wicked !== "look") return;
    look = e.data.look || {};
    apply();
  });

  try {
    const blob = await WickedMediaDB.get(id);
    if (!blob) throw new Error("missing");
    el = document.createElement(type === "video" ? "video" : "img");
    el.id = "m";
    if (type === "video") Object.assign(el, { loop: true, muted: true, autoplay: true, playsInline: true });
    el.src = URL.createObjectURL(blob);
    document.body.appendChild(el);
    apply();
    parent.postMessage({ __wicked: "player-ready", id }, "*");
    // brightness report for the page's auto-contrast (we're same-origin with our own blob, so we can read pixels)
    const c = document.createElement("canvas"); c.width = 32; c.height = 18;
    const g = c.getContext("2d", { willReadFrequently: true });
    setInterval(() => {
      try {
        g.clearRect(0, 0, 32, 18); g.drawImage(el, 0, 0, 32, 18);
        const d = g.getImageData(0, 0, 32, 18).data; let sum = 0, sq = 0, n = 0; const prof = new Array(18).fill(0), grid = [];
        for (let i = 0; i < d.length; i += 4) {
          const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; sum += l; sq += l * l; n++;
          grid.push(Math.round(l * 1000) / 1000);
          if ((i / 4) % 32 >= 27) prof[Math.floor(i / 4 / 32)] += l / 5;
        }
        const mean = sum / n;
        // grid = 32x18 brightness map; rgb = same pixels (r,g,b,a bytes) so the page can derive an Auto-match palette.
        parent.postMessage({ __wicked: "lum", mean, std: Math.sqrt(Math.max(0, sq / n - mean * mean)), prof, grid, rgb: Array.from(d) }, "*");
      } catch {}
    }, 1500);
  } catch (err) {
    parent.postMessage({ __wicked: "player-error", id, msg: String(err) }, "*");
  }
})();
