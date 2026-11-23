/* Priism Skins — how an uploaded picture or video fills its chart (Fit: Smart / Cover / Contain / Stretch).
   Used by the wallpaper player (player/player.js, uploads in the extension), by content.js (pictures and videos shown
   right in the page: the desktop app, older uploads; and for snapshots / clips), so they all look the same.

   Smart (the default) is placed for the charts themselves (the area they take in the page), not the whole page under
   TradingView's toolbars and lists. Close to the charts' shape (up to 1.3x wider or taller), it fills the chart like Cover, losing
   at most a thin edge. Further off (a 9:16 phone wallpaper or a square picture on a wide chart, an ultrawide one on a
   tall chart), it's shown whole, sharp and in proportion, and the space around it is filled with the same picture
   blurred, darkened and slightly enlarged: no black bars, nothing stretched, nothing important cut off. The edges of
   the artwork fade into that, so it reads as one picture. Horizontal / Vertical place the artwork, as for Cover.
   Cost: the surround is a small canvas, blurred and darkened once when it's drawn (a picture: once; a video: twice a
   second, only while it plays), then simply enlarged. No CSS filter or mask: those are worked out again on every
   repaint of the chart above them when there's no graphics acceleration (measured: 60 -> 4 fps). The artwork's edges
   fade through plain gradient strips in the surround's own colour. */
(function (root) {
  if (root.PriismSmartFit) return;
  const EXTEND_AT = 1.3;                                       // shape difference above which Smart shows it whole
  const clamp01 = (v) => Math.max(0, Math.min(1, (+v || 0) / 100));
  // where the artwork goes in a W x H box: { x, y, w, h, extend } (extend = Smart showing it whole)
  function box(nw, nh, W, H, fit, posX, posY) {
    if (!(nw > 0 && nh > 0 && W > 0 && H > 0)) return { x: 0, y: 0, w: W, h: H, extend: false };
    if (fit === "stretch") return { x: 0, y: 0, w: W, h: H, extend: false };
    const r = nw / nh, R = W / H, off = Math.max(r / R, R / r);
    const extend = fit === "auto" ? off > EXTEND_AT : false;
    const contain = fit === "fit" || extend;
    const k = contain ? Math.min(W / nw, H / nh) : Math.max(W / nw, H / nh), w = nw * k, h = nh * k;
    return { x: (W - w) * clamp01(posX ?? 50), y: (H - h) * clamp01(posY ?? 50), w, h, extend };
  }
  // the surround: the picture covering a small canvas (drawn blurred / darkened by CSS, or by drawSurround below)
  const SW = 160, SH = 90;
  function paintSmall(g, src, nw, nh, cw, ch) {
    const k = Math.max(cw / nw, ch / nh), w = nw * k, h = nh * k;
    g.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  // Live: one controller per wallpaper element. host = the element's parent (the player page / a chart tile).
  // look() -> { fit, posX, posY }. Returns { update(), destroy() }.
  function attach(host, el, look) {
    const doc = host.ownerDocument, win = doc.defaultView;
    const bg = doc.createElement("canvas"); bg.width = SW; bg.height = SH; bg.className = "bd-surround";
    bg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:none;pointer-events:none;object-fit:fill;";
    host.insertBefore(bg, el);
    // the fades over the artwork's edges (inside the page), in the surround's colour
    const strip = () => { const d = doc.createElement("div"); d.className = "bd-fade"; d.style.cssText = "position:absolute;display:none;pointer-events:none;"; host.insertBefore(d, el.nextSibling); return d; };
    const fades = { l: strip(), r: strip(), t: strip(), b: strip() };
    const bgG = bg.getContext("2d"), sm = doc.createElement("canvas"); sm.width = SW; sm.height = SH; const smG = sm.getContext("2d");
    const dot = doc.createElement("canvas"); dot.width = dot.height = 1; const dotG = dot.getContext("2d", { willReadFrequently: true });
    let on = false, painted = false, timer = 0, dead = false, tone = "11,14,20";
    const size = () => ({ nw: el.videoWidth || el.naturalWidth || 0, nh: el.videoHeight || el.naturalHeight || 0 });
    const paint = () => { const { nw, nh } = size(); if (!nw || !nh) return;
      try { smG.clearRect(0, 0, SW, SH); paintSmall(smG, el, nw, nh, SW, SH);
        bgG.save(); bgG.clearRect(0, 0, SW, SH); bgG.filter = "blur(5px) brightness(0.5) saturate(1.15)"; bgG.drawImage(sm, -10, -10, SW + 20, SH + 20); bgG.restore();
        dotG.drawImage(bg, 0, 0, 1, 1); const p = dotG.getImageData(0, 0, 1, 1).data; tone = `${p[0]},${p[1]},${p[2]}`; painted = true; } catch {} };
    function update() {
      if (dead) return;
      const L = look() || {}, W = host.clientWidth, H = host.clientHeight, { nw, nh } = size(), st = el.style;
      if (!nw || !nh || (L.fit || "auto") !== "auto") {
        // Cover / Contain / Stretch: the browser's own fitting over the whole wallpaper, exactly as before
        on = false; bg.style.display = "none"; clearInterval(timer); timer = 0;
        st.left = st.top = st.width = st.height = st.inset = ""; for (const f of Object.values(fades)) f.style.display = "none";
        st.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[L.fit] || "cover";
        st.objectPosition = `${L.posX ?? 50}% ${L.posY ?? 50}%`;
        return;
      }
      // Smart: placed for the charts themselves (area: where they are in this wallpaper, CSS px), not for the whole
      // page behind TradingView's toolbars and lists; the surround fills whatever the artwork doesn't reach
      const A = L.area && L.area.w > 20 && L.area.h > 20 ? L.area : { x: 0, y: 0, w: W, h: H };
      const b = box(nw, nh, A.w, A.h, "auto", L.posX, L.posY);
      const x = Math.round(A.x + b.x), y = Math.round(A.y + b.y), w = Math.round(b.w), h = Math.round(b.h);
      Object.assign(st, { inset: "auto", left: x + "px", top: y + "px", width: w + "px", height: h + "px", objectFit: "fill", objectPosition: "50% 50%" });
      const covers = x <= 0 && y <= 0 && x + w >= W && y + h >= H;
      on = !covers; bg.style.display = covers ? "none" : "block";
      if (on && !painted) paint();
      // its edges inside the charts' area fade into the surround (edges along the area's own edges stay crisp: the
      // scales and toolbars are there anyway)
      const c = tone, fx = Math.max(12, Math.round(w * 0.09)), fy = Math.max(12, Math.round(h * 0.09));
      const put = (f, show, css) => { f.style.display = show && on ? "block" : "none"; if (show && on) Object.assign(f.style, css); };
      const ax = Math.round(A.x), ay = Math.round(A.y), aw = Math.round(A.w), ah = Math.round(A.h);
      put(fades.l, x > ax + 1, { left: x + "px", top: y + "px", width: fx + "px", height: h + "px", background: `linear-gradient(to right, rgb(${c}), rgba(${c},0))` });
      put(fades.r, x + w < ax + aw - 1, { left: x + w - fx + "px", top: y + "px", width: fx + "px", height: h + "px", background: `linear-gradient(to left, rgb(${c}), rgba(${c},0))` });
      put(fades.t, y > ay + 1, { left: x + "px", top: y + "px", width: w + "px", height: fy + "px", background: `linear-gradient(to bottom, rgb(${c}), rgba(${c},0))` });
      put(fades.b, y + h < ay + ah - 1, { left: x + "px", top: y + h - fy + "px", width: w + "px", height: fy + "px", background: `linear-gradient(to top, rgb(${c}), rgba(${c},0))` });
      if (on && el.tagName === "VIDEO" && !timer) timer = setInterval(() => { if (!el.paused && !doc.hidden) paint(); }, 500);
      if (!on && timer) { clearInterval(timer); timer = 0; }
    }
    const onSize = () => update();
    win.addEventListener("resize", onSize);
    let ro = null; try { ro = new win.ResizeObserver(onSize); ro.observe(host); } catch {}
    el.addEventListener(el.tagName === "VIDEO" ? "loadeddata" : "load", () => { painted = false; update(); paint(); });
    update();
    return { update, destroy() { dead = true; clearInterval(timer); win.removeEventListener("resize", onSize); if (ro) ro.disconnect(); bg.remove(); for (const f of Object.values(fades)) f.remove(); }, get extended() { return on; } };
  }
  // Snapshots / clips (a canvas): the same picture as on screen. src = an image / video / bitmap of nw x nh.
  let small = null;
  function drawSurround(g, src, nw, nh, dx, dy, dw, dh) {
    if (!small) { small = (typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(SW, SH) : Object.assign(document.createElement("canvas"), { width: SW, height: SH })); }
    const sg = small.getContext("2d"); sg.clearRect(0, 0, SW, SH); paintSmall(sg, src, nw, nh, SW, SH);
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    try { g.filter = "blur(18px) brightness(0.5) saturate(1.15)"; } catch {}
    const ex = dw * 0.06, ey = dh * 0.06; g.drawImage(small, dx - ex, dy - ey, dw + ex * 2, dh + ey * 2);
    g.restore();
  }
  root.PriismSmartFit = { EXTEND_AT, box, attach, drawSurround };
})(typeof window !== "undefined" ? window : globalThis);
