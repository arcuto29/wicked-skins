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
    if (e.data && e.data.__wicked === "rec-start" && e.ports && e.ports[0]) return void recStart(e.data, e.ports[0]);
    if (!e.data || e.data.__wicked !== "look") return;
    look = e.data.look || {};
    apply();
  });

  // Chart-only clips: Priism draws each frame itself, but can't read this protected frame's pixels. While a clip
  // records, send the picture to Priism (the extension) through a private channel: the chart page can't listen in,
  // and only a request carrying the extension's own secret (in its storage, which pages can't read) is answered.
  let recBusy = false;
  async function recStart(msg, port) {
    let ok = false;
    try { const s = await chrome.storage.local.get("recToken"); ok = !!s.recToken && s.recToken === msg.token; } catch {}
    if (!ok) { try { port.close(); } catch {} return; }
    const fps = Math.max(5, Math.min(60, +msg.fps || 30)), maxW = Math.max(160, Math.min(1920, +msg.maxW || 1280));
    let stopped = false; const until = Date.now() + 135000;   // never longer than the longest clip
    port.onmessage = (ev) => { if (ev.data && ev.data.stop) { stopped = true; try { port.close(); } catch {} } };
    const tick = async () => {
      if (stopped || Date.now() > until) { try { port.close(); } catch {} return; }
      if (!recBusy && el) {
        recBusy = true;
        try {
          const nw = el.videoWidth || el.naturalWidth, nh = el.videoHeight || el.naturalHeight;
          if (nw && nh) { const k = Math.min(1, maxW / nw), bmp = await createImageBitmap(el, { resizeWidth: Math.max(2, Math.round(nw * k)), resizeHeight: Math.max(2, Math.round(nh * k)), resizeQuality: "medium" });
            port.postMessage({ bmp, nw, nh }, [bmp]); }
        } catch {} finally { recBusy = false; }
      }
      setTimeout(tick, 1000 / fps);
    };
    tick();
  }

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
    // the video frame lives on the graphics card; shrink it off the main thread (createImageBitmap) before reading,
    // so measuring never stalls the page
    let busy = false, lastGrid = "", same = 0;
    // a still picture never changes: once two samples in a row are the same, stop (animated GIF / WebP / APNG differ,
    // so they keep being sampled; a paused video isn't sampled at all)
    const iv = setInterval(async () => {
      if (busy || document.hidden || (el.tagName === "VIDEO" && el.paused)) return; busy = true;
      try {
        let src = el, bmp = null;
        if (typeof createImageBitmap === "function") { try { bmp = await createImageBitmap(el, { resizeWidth: 32, resizeHeight: 18, resizeQuality: "low" }); src = bmp; } catch { src = el; } }
        g.clearRect(0, 0, 32, 18); g.drawImage(src, 0, 0, 32, 18); if (bmp && bmp.close) bmp.close();
        const d = g.getImageData(0, 0, 32, 18).data; let sum = 0, sq = 0, n = 0; const prof = new Array(18).fill(0), grid = [];
        for (let i = 0; i < d.length; i += 4) {
          const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; sum += l; sq += l * l; n++;
          grid.push(Math.round(l * 1000) / 1000);
          if ((i / 4) % 32 >= 27) prof[Math.floor(i / 4 / 32)] += l / 5;
        }
        const mean = sum / n;
        if (el.tagName === "IMG") { const k = grid.join(","); if (k === lastGrid) { if (++same >= 1) clearInterval(iv); return; } lastGrid = k; same = 0; }
        // grid = 32x18 brightness map; rgb = same pixels (r,g,b,a bytes) so the page can derive an Auto-match palette.
        parent.postMessage({ __wicked: "lum", mean, std: Math.sqrt(Math.max(0, sq / n - mean * mean)), prof, grid, rgb: Array.from(d) }, "*");
      } catch {} finally { busy = false; }
    }, 3000);
  } catch (err) {
    parent.postMessage({ __wicked: "player-error", id, msg: String(err) }, "*");
  }
})();
