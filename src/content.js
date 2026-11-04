(function () {
  const DEFAULTS = {
    enabled: true,
    skin: "aurora",        // built-in id, or "media"
    mediaId: null,         // id of an item in `media` when skin === "media"
    media: [],             // [{ id, name, type: "image"|"video", src }]
    loadouts: [],
    // Tune
    opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
    fps: "auto", fit: "cover", posX: 50, posY: 50,
    powerSaver: false, paused: false, bw: false,
    layer: "behind",       // "behind" | "over"
    // Candles
    candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
    candleLook: "solid", shiftSpeed: 10, // solid | neon | prism | shift
    // Behaviour: react to the market / your own P&L (entry typed in by the user; never reads the account)
    react: "off",          // "off" | "market" | "pnl"
    reactStrength: 0.6,
    // Watermark: your own text and/or logo on the chart (for screenshots / streams)
    wmOn: false, wmPos: "br",             // watermark: the Wicked Skins logo + name
    vignette: 0, calm: false,            // darker edges; dim + slow down while your cursor is on the chart
    // Glow on indicators / lines / P&L, and price scale styling
    lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: false,
    scaleSize: 0, scaleFont: "default",
  };

  let cfg = { ...DEFAULTS };
  let layer, content, raf, running = false;

  const activeMedia = () => (cfg.skin === "media" ? cfg.media.find((m) => m.id === cfg.mediaId) : null);

  // "Over chart" mode: only cover the chart area, not toolbars/watchlist.
  let ro;
  function clipToChart() {
    if (!layer) return;
    const el = document.querySelector(".chart-container") || document.querySelector(".layout__area--center");
    if (!el) return;
    const r = el.getBoundingClientRect();
    layer.style.clipPath = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
    if (!ro) { ro = new ResizeObserver(clipToChart); ro.observe(el); }
  }
  // ---------- Reacts to: Market / My P&L ----------
  // Price comes from the tab title TradingView already shows, e.g. "BTCUSDT 77,228.95 ▼ −0.29%".
  const TITLE_RE = /^(\S+)\s+([\d,]+(?:\.\d+)?)\s*[▲▼]?\s*([+\-\u2212]?[\d.]+)%/;
  let quote = null, lastPrice = null, mood = 0, reactEl, pillEl, lastPulse = 0;

  function parseTitle() {
    const m = (document.title || "").match(TITLE_RE);
    if (!m) return null;
    return { sym: m[1], price: parseFloat(m[2].replace(/,/g, "")), chg: parseFloat(m[3].replace("\u2212", "-")) };
  }

  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const upColor = () => (cfg.candleOn ? cfg.candleUp : "#00e08a");
  const downColor = () => (cfg.candleOn ? cfg.candleDown : "#ff3355");

  // Position: the open P&L TradingView already shows on your chart's position line(s), read by hook.js.
  // Strength is relative to the biggest swing seen this session, so there's nothing to set up.
  let pnlMaxAbs = 0;
  function readPnl() {
    try {
      const p = JSON.parse(document.documentElement.getAttribute("data-ws-pnl") || "null");
      if (!p || Date.now() - p.ts > 5000) return null;          // no position line drawn recently
      pnlMaxAbs = Math.max(pnlMaxAbs * 0.999, Math.abs(p.v), 1);
      return p;
    } catch { return null; }
  }

  function updateReact(tick) {
    if (!reactEl) return;
    let active = cfg.react !== "off" && (!!quote || cfg.react === "pnl");
    let label = "";
    if (!active) mood = 0;
    else if (cfg.react === "market") { mood = clamp(quote.chg / 2); }          // ±2% day move = full
    else {
      const p = readPnl();
      if (!p) { active = false; mood = 0; }                                       // no open position on the chart
      else {
        mood = clamp(p.v / pnlMaxAbs);
        const unit = p.unit && p.unit.length === 1 ? p.unit : "", code = p.unit && p.unit.length > 1 ? " " + p.unit : "";
        label = `P&L ${p.v >= 0 ? "+" : "\u2212"}${unit}${Math.abs(p.v).toFixed(2)}${code}`;
      }
    }
    const col = mood >= 0 ? upColor() : downColor();
    const k = Math.abs(mood) * cfg.reactStrength;
    reactEl.style.setProperty("--bd-react", col);
    reactEl.style.opacity = String(active ? 0.15 + 0.85 * k : 0);
    reactEl.style.boxShadow = `inset 0 0 ${40 + 160 * k}px ${10 + 40 * k}px ${col}`;
    reactEl.style.background = `radial-gradient(ellipse at 50% ${mood >= 0 ? "110%" : "-10%"}, ${col}55, transparent 60%)`;
    if (active && tick && performance.now() - lastPulse > 1200) {   // fast tickers: max ~1 pulse/1.2s
      lastPulse = performance.now();
      const tcol = tick > 0 ? upColor() : downColor();
      reactEl.style.setProperty("--bd-pulse", tcol);
      reactEl.classList.remove("bd-pulse"); void reactEl.offsetWidth; reactEl.classList.add("bd-pulse");
    }
    if (pillEl) {
      pillEl.hidden = !label;
      pillEl.textContent = label;
      pillEl.style.color = col;
      const el = document.querySelector(".chart-container");
      if (el && label) { const r = el.getBoundingClientRect(); pillEl.style.top = r.top + 8 + "px"; pillEl.style.left = r.right - 80 + "px"; } // pill sits left of the price axis
    }
  }

  function onTitle() {
    const q = parseTitle();
    if (!q) return;
    let tick = 0;
    if (lastPrice !== null && quote && q.sym === quote.sym && q.price !== lastPrice) {
      tick = q.price > lastPrice ? 1 : -1;
    }
    quote = q; lastPrice = q.price;
    updateReact(tick);
  }
  new MutationObserver(() => { if (cfg.react === "pnl") updateReact(0); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-ws-pnl"] });
  setInterval(() => { if (cfg.react === "pnl") updateReact(0); }, 2000);     // clears the glow when the position closes
  const watchTitle = () => {
    const t = document.querySelector("title");
    if (!t) return setTimeout(watchTitle, 1000);
    new MutationObserver(onTitle).observe(t, { childList: true, characterData: true, subtree: true });
    onTitle();
  };
  watchTitle();

  // Redraws are done by hook.js (page world): it uses TradingView's own redraw when available.
  let repaintTimer;
  const repaint = () => { clearTimeout(repaintTimer); repaintTimer = setTimeout(() => document.dispatchEvent(new Event("bd-repaint")), 60); };

  // Calm while working: when your cursor is on the chart the wallpaper dims and slows down.
  let calmActive = false;
  addEventListener("mousemove", (e) => {
    if (!cfg.calm || !layer) { if (calmActive) { calmActive = false; applyLook(); } return; }
    const el = document.querySelector(".chart-container"); if (!el) return;
    const r = el.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside !== calmActive) { calmActive = inside; applyLook(); }
  }, { passive: true });
  document.addEventListener("mouseleave", () => { if (calmActive) { calmActive = false; applyLook(); } });
  const calmFactor = () => (cfg.calm && calmActive ? 0.35 : 1);

  function applyLook() {
    if (!layer) return;
    setTimeout(measureBackdrop, 300);
    layer.classList.toggle("bd-over", cfg.layer === "over");
    document.documentElement.classList.toggle("bd-over-mode", cfg.layer === "over");
    clipToChart();
    updateReact(0);
    // Over-chart sits ON TOP of the candles, so it needs its own (lower) strength or it hides them.
    layer.style.opacity = String(cfg.layer === "over" ? cfg.overOpacity : cfg.opacity);
    layer.querySelector(".bd-dim").style.opacity = String(Math.min(0.95, cfg.dim + (cfg.calm && calmActive ? 0.3 : 0)));
    const vg = layer.querySelector(".bd-vignette");
    if (vg) vg.style.background = cfg.vignette > 0 ? `radial-gradient(ellipse at center, transparent ${Math.round(70 - cfg.vignette * 40)}%, rgba(0,0,0,${(0.35 + cfg.vignette * 0.55).toFixed(2)}) 100%)` : "none";
    if (!content) return;
    const f = [];
    if (cfg.blur) f.push(`blur(${cfg.blur}px)`);
    if (cfg.vividness !== 1) f.push(`saturate(${cfg.vividness})`);
    if (cfg.tint) f.push(`hue-rotate(${cfg.tint}deg)`);
    if (cfg.bw) f.push("grayscale(1)");
    content.style.filter = f.join(" ");
    if (content.tagName !== "CANVAS") {
      content.style.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[cfg.fit] || "cover";
      content.style.objectPosition = `${cfg.posX}% ${cfg.posY}%`;
    }
    if (content.tagName === "VIDEO") {
      content.playbackRate = Math.max(0.25, Math.min(4, cfg.speed * calmFactor()));
      cfg.paused ? content.pause() : content.play().catch(() => {});
    }    if (content.tagName === "IFRAME") postLook();
  }

  // Files stored in the extension's database play inside an extension iframe (player/player.html).
  function postLook() {
    if (!content || content.tagName !== "IFRAME" || !content.contentWindow) return;
    content.contentWindow.postMessage({ __wicked: "look", look: { fit: cfg.fit, posX: cfg.posX, posY: cfg.posY, speed: cfg.speed * calmFactor(), paused: cfg.paused } }, "*");
  }

  function build() {
    teardown();
    const was = document.documentElement.classList.contains("bd-on");
    if (!was && document.body) {
      // remember the page's own background so toolbars keep theirs once body goes transparent
      const bg = getComputedStyle(document.body).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") document.documentElement.style.setProperty("--bd-page-bg", bg);
    }
    document.documentElement.classList.toggle("bd-on", cfg.enabled);
    if (!cfg.enabled) document.documentElement.classList.remove("bd-over-mode");
    if (was !== cfg.enabled) repaint();
    if (!cfg.enabled) return;

    layer = document.createElement("div");
    layer.id = "bd-layer";
    layer.dataset.bdOwner = ME.token;

    const m = activeMedia();
    if (m && m.file && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      content = document.createElement("iframe");
      content.className = "bd-player";
      content.setAttribute("allow", "autoplay");
      content.src = chrome.runtime.getURL(`player/player.html?id=${encodeURIComponent(m.id)}&type=${m.type}`);
      content.addEventListener("load", postLook);
    } else if (m && m.src) {
      if (m.type === "video") {
        content = document.createElement("video");
        Object.assign(content, { src: m.src, loop: true, muted: true, autoplay: true, playsInline: true });
      } else {
        content = document.createElement("img");
        content.src = m.src; // GIFs animate natively
      }
    } else {
      const def = window.WickedSkins[cfg.skin] || window.WickedSkins.aurora;
      content = document.createElement("canvas");
      startCanvas(content, def);
    }
    layer.appendChild(content);
    const dim = document.createElement("div");
    dim.className = "bd-dim";
    layer.appendChild(dim);
    const vg = document.createElement("div");
    vg.className = "bd-vignette";
    layer.appendChild(vg);
    reactEl = document.createElement("div");
    reactEl.className = "bd-react";
    layer.appendChild(reactEl);
    pillEl = document.createElement("div");
    pillEl.className = "bd-pill"; pillEl.hidden = true;
    pillEl.style.setProperty("--g", String(0.35 + 0.65 * (+cfg.lineGlow || 0)));
    layer.appendChild(pillEl);
    document.documentElement.appendChild(layer);
    applyLook();
  }

  function startCanvas(canvas, def) {
    const ctx = canvas.getContext("2d");
    const skin = def.create(ctx);
    const size = () => {
      const scale = cfg.powerSaver ? 0.5 : 0.75; // it's a background; lower res saves GPU
      canvas.width = Math.max(2, (innerWidth * scale) | 0);
      canvas.height = Math.max(2, (innerHeight * scale) | 0);
      skin.resize(canvas.width, canvas.height);
    };
    size();
    addEventListener("resize", size);
    canvas._cleanup = () => removeEventListener("resize", size);

    running = true;
    let last = performance.now(), clock = 0;
    const step = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (document.hidden || cfg.paused) { last = now; return; }
      const target = cfg.powerSaver ? 15 : cfg.fps === "auto" ? 60 : +cfg.fps;
      if (now - last < 1000 / target - 2) return;
      const dt = Math.min(0.1, (now - last) / 1000) * cfg.speed * calmFactor() * (1 + Math.abs(mood) * cfg.reactStrength * 1.5);
      last = now;
      clock += dt;
      skin.frame(clock, dt);
    };
    raf = requestAnimationFrame(step);
  }

  function teardown() {
    running = false;
    cancelAnimationFrame(raf);
    if (layer) {
      const c = layer.querySelector("canvas");
      c && c._cleanup && c._cleanup();
      layer.remove();
      layer = content = reactEl = pillEl = null;
    }
  }

  // Candle colours are drawn by hook.js (page world); hand it the config via an attribute.
  function pushCandles() {
    const h = document.documentElement;
    if (cfg.enabled && cfg.candleOn) h.setAttribute("data-ws-candles", JSON.stringify({ up: cfg.candleUp, down: cfg.candleDown, glow: cfg.candleGlow, look: cfg.candleLook }));
    else h.removeAttribute("data-ws-candles");
    // "Shift" look: colours cycle over time via a GPU hue animation on the chart layer (no redraws needed)
    const shift = cfg.enabled && cfg.candleOn && cfg.candleLook === "shift";
    h.classList.toggle("bd-shift", shift);
    h.style.setProperty("--bd-shift-dur", Math.max(2, Math.min(60, +cfg.shiftSpeed || 10)) + "s");
    repaint();
  }

  // Line glow + price scale styling, also drawn by hook.js
  const FX_KEYS = ["lineGlow", "scaleText", "scaleGlow", "scaleBold", "scaleBg", "scaleBgColor", "scaleLabels", "scaleSize", "scaleFont"];
  // ---------- auto contrast: how bright / busy is the wallpaper behind the chart? ----------
  let backdrop = { bg: null, busy: false, prof: [] };
  const sampler = document.createElement("canvas"); sampler.width = 32; sampler.height = 18;
  const sctx = sampler.getContext("2d", { willReadFrequently: true });
  function statsOf(source) {
    try {
      sctx.clearRect(0, 0, 32, 18); sctx.drawImage(source, 0, 0, 32, 18);
      const d = sctx.getImageData(0, 0, 32, 18).data; let sum = 0, sq = 0, n = 0; const prof = new Array(18).fill(0);
      for (let i = 0; i < d.length; i += 4) {
        const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 * (d[i + 3] / 255); sum += l; sq += l * l; n++;
        const px = (i / 4) % 32, row = Math.floor(i / 4 / 32); if (px >= 27) prof[row] += l / 5;   // right-edge strip
      }
      const mean = sum / n; return { mean, std: Math.sqrt(Math.max(0, sq / n - mean * mean)), prof };
    } catch { return null; }                    // cross-origin media: the player iframe reports instead
  }
  function setBackdrop(st) {
    if (!st) return;
    const vis = (cfg.layer === "over" ? cfg.overOpacity : cfg.opacity) * (1 - cfg.dim);   // what actually reaches your eyes
    const mean = st.mean * vis, std = st.std * vis;
    // hysteresis so a moving video near the threshold doesn't flip the text back and forth
    const bg = backdrop.bg === "light" ? (mean < 0.37 ? "dark" : "light") : (mean > 0.47 ? "light" : "dark");
    const busy = backdrop.busy ? std > 0.12 : std > 0.17;
    const prof = (st.prof || []).map((v) => Math.round(v * vis * 100) / 100);
    const h = document.documentElement;
    h.classList.toggle("bd-bg-dark", bg === "dark"); h.classList.toggle("bd-bg-light", bg === "light");
    const profMoved = prof.length !== (backdrop.prof || []).length || prof.some((v, i) => Math.abs(v - backdrop.prof[i]) > 0.08);
    if (bg !== backdrop.bg || busy !== backdrop.busy || profMoved) { backdrop = { bg, busy, prof }; pushFx(); }
  }
  function measureBackdrop() {
    if (!layer || !content || !cfg.enabled) return;
    if (content.tagName === "IFRAME") return;   // player posts { __wicked: "lum" }
    setBackdrop(statsOf(content));
  }
  setInterval(measureBackdrop, 1500);
  addEventListener("message", (e) => {
    if (!e.data || e.data.__wicked !== "lum" || !content || e.source !== content.contentWindow) return;
    setBackdrop({ mean: +e.data.mean || 0, std: +e.data.std || 0, prof: Array.isArray(e.data.prof) ? e.data.prof.slice(0, 18).map(Number) : [] });
  });

  function pushFx() {
    const h = document.documentElement;
    if (cfg.enabled) h.setAttribute("data-ws-fx", JSON.stringify({ ...Object.fromEntries(FX_KEYS.map((k) => [k, cfg[k]])), bg: backdrop.bg, busy: backdrop.busy, prof: backdrop.prof || [] }));
    else h.removeAttribute("data-ws-fx");
    if (pillEl) pillEl.style.setProperty("--g", String(0.35 + 0.65 * (+cfg.lineGlow || 0)));
  }

  // Keys that need a rebuild vs. ones we can apply live.
  const REBUILD = new Set(["enabled", "skin", "mediaId", "powerSaver"]);
  // ---------- watermark ----------
  // Sits ON TOP of the chart (so it shows in screenshots/streams) but never takes clicks.
  // Kept clear of the price axis (right) and time axis (bottom).
  let wmEl, wmRO;
  function placeWatermark() {
    if (!wmEl) return;
    const el = document.querySelector(".chart-container");
    const r = el ? el.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    const pad = 14, axisR = 72, axisB = 30, st = wmEl.style;
    st.left = st.right = st.top = st.bottom = st.transform = "";
    const p = cfg.wmPos;
    if (p === "center") { st.left = r.left + (r.width - axisR) / 2 + "px"; st.top = r.top + (r.height - axisB) / 2 + "px"; st.transform = "translate(-50%,-50%)"; return; }
    if (p[0] === "t") st.top = r.top + pad + 34 + "px";              // below TradingView's legend row
    else st.top = r.bottom - axisB - pad - wmEl.offsetHeight + "px";
    if (p[1] === "l") st.left = r.left + pad + "px";
    else st.left = r.right - axisR - pad - wmEl.offsetWidth + "px";
  }
  // Brand shown in the watermark. Renaming the product: change BRAND_NAME and the logo below.
  const BRAND_NAME = "Wicked Skins";
  const BRAND_LOGO = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="5" y1="28" x2="27" y2="4"><stop offset="0" stop-color="#19d3ff"/><stop offset=".5" stop-color="#2ef2b0"/><stop offset="1" stop-color="#c6ff3d"/></linearGradient></defs><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#0b141b"/><g fill="url(#g)"><rect x="5" y="17" width="6" height="9" rx="1.5"/><rect x="13" y="11" width="6" height="12" rx="1.5"/><rect x="21" y="5" width="6" height="15" rx="1.5"/><rect x="7.25" y="15" width="1.5" height="13" rx=".75"/><rect x="15.25" y="8" width="1.5" height="17" rx=".75"/><rect x="23.25" y="3" width="1.5" height="19" rx=".75"/></g></svg>');
  function renderWatermark() {
    const show = cfg.enabled && cfg.wmOn;
    if (!show) { if (wmEl) { wmEl.remove(); wmEl = null; } return; }
    if (!wmEl) {
      wmEl = document.createElement("div");
      wmEl.id = "bd-wm";
      wmEl.dataset.bdOwner = ME.token;
      wmEl.innerHTML = `<img alt="" src="${BRAND_LOGO}"><span></span>`;
      wmEl.querySelector("span").textContent = BRAND_NAME;
      wmEl.querySelector("img").onload = placeWatermark;
      document.documentElement.appendChild(wmEl);
      const el = document.querySelector(".chart-container");
      if (!wmRO && el) { wmRO = new ResizeObserver(placeWatermark); wmRO.observe(el); addEventListener("resize", placeWatermark); }
    }
    wmEl.classList.toggle("bd-wm-center", cfg.wmPos === "center");
    requestAnimationFrame(placeWatermark);
  }


  function apply(keys) {
    if (standDown || (EXT && !owner)) return;
    const candleKeys = keys.filter((k) => k.startsWith("candle"));
    if (candleKeys.length || keys.includes("enabled")) pushCandles();
    if (keys.some((k) => k.startsWith("wm")) || keys.includes("enabled")) renderWatermark();
    if (keys.some((k) => FX_KEYS.includes(k)) || keys.includes("enabled")) pushFx();
    keys = keys.filter((k) => !k.startsWith("candle") && !k.startsWith("wm") && !FX_KEYS.includes(k));
    if (!keys.length) return;
    const needsRebuild = keys.some((k) => REBUILD.has(k)) ||
      (keys.includes("media") && cfg.skin === "media");
    needsRebuild ? build() : applyLook();
  }

  // ---------- Alt+Shift+W: everything on/off, right on the chart ----------
  function flash(msg) {
    const t = document.createElement("div"); t.className = "bd-flash"; t.textContent = msg;
    document.documentElement.appendChild(t); setTimeout(() => t.remove(), 1400);
  }
  addEventListener("keydown", (e) => {
    if (!(e.altKey && e.shiftKey && e.code === "KeyW") || e.repeat) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
    e.preventDefault(); e.stopPropagation();
    const next = !cfg.enabled;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) chrome.storage.local.set({ enabled: next });
    else if (window.__bdUpdate) window.__bdUpdate({ enabled: next });
    flash(next ? "Wicked Skins on" : "Wicked Skins off");
  }, true);

  // ---------- one instance per page ----------
  // Two copies of the extension installed, or a stale script left in an open tab after an update, would each draw
  // their own wallpaper + watermark. The newest instance owns the page; others stand down. Older copies that don't
  // know this protocol are detected (their elements aren't marked as ours), cleaned up, and reported to the panel.
  const EXT = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
  const ME = { id: EXT || "desktop", ver: EXT ? chrome.runtime.getManifest().version : "desktop", token: Math.random().toString(36).slice(2) };
  const verCmp = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
  const readOwner = () => { const [id, ver, token, ts] = (document.documentElement.getAttribute("data-bd-owner") || "").split("|"); return id ? { id, ver, token, ts: +ts } : null; };
  const writeOwner = () => document.documentElement.setAttribute("data-bd-owner", [ME.id, ME.ver, ME.token, Date.now()].join("|"));
  let owner = false, standDown = false, dupReported = false;
  function reportDuplicate() {
    if (dupReported || !EXT) return; dupReported = true;
    try { chrome.storage.local.set({ dupSeen: Date.now() }); } catch {}
  }
  function claim() {
    const cur = readOwner();
    const alive = cur && Date.now() - cur.ts < 6000;
    if (alive && cur.token !== ME.token && (cur.id !== ME.id || cur.ver !== ME.ver)) {
      if (cur.id !== ME.id) reportDuplicate();
      if (verCmp(cur.ver, ME.ver) >= 0 && cur.id !== ME.id) return false;     // a same-or-newer copy already owns it
    }
    writeOwner(); owner = true; return true;
  }
  // remove anything drawn by another (older) copy, now and later
  const mine = (el) => el.dataset && el.dataset.bdOwner === ME.token;
  function sweep() {
    for (const el of document.querySelectorAll("#bd-layer, #bd-wm")) if (!mine(el)) { el.remove(); reportDuplicate(); }
  }
  new MutationObserver(() => { if (owner && !standDown) sweep(); }).observe(document.documentElement, { childList: true });
  setInterval(() => {
    if (!owner || standDown) return;
    const cur = readOwner();
    if (cur && cur.token !== ME.token && Date.now() - cur.ts < 6000 && verCmp(cur.ver, ME.ver) > 0) {
      standDown = true; teardown(); if (wmEl) { wmEl.remove(); wmEl = null; }   // a newer copy took over
      return;
    }
    writeOwner();                                                                // heartbeat
  }, 2000);

  // Only switch on in a frame that actually contains a TradingView-style chart (tradingview.com, or a
  // platform's embedded chart iframe). Other frames / pages of an enabled site are left untouched.
  const CHART_SEL = ".chart-markup-table, .chart-container";
  const bigChart = () => [...document.querySelectorAll(CHART_SEL)].some((el) => { const r = el.getBoundingClientRect(); return r.width >= 400 && r.height >= 250; });
  function whenChart(start) {
    const go = () => { if (!claim()) return; sweep(); start(); };
    if (bigChart()) return go();
    // charts render late and small widgets (mini charts) never qualify; check for a while
    const iv = setInterval(() => { if (bigChart()) { clearInterval(iv); go(); } }, 500);
    setTimeout(() => clearInterval(iv), 180000); // charts that load later than 3 min: reload the page
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    whenChart(() => chrome.storage.local.get(DEFAULTS, (stored) => { cfg = { ...DEFAULTS, ...stored }; build(); pushCandles(); pushFx(); renderWatermark(); }));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const k in changes) cfg[k] = changes[k].newValue;
      apply(Object.keys(changes));
    });
  } else {
    // Desktop app: host injects window.__BD_CFG and calls window.__bdUpdate on change.
    cfg = { ...DEFAULTS, ...(window.__BD_CFG || {}) };
    build();
    pushCandles();
    pushFx();
    renderWatermark();
    window.__bdUpdate = (next) => {
      const keys = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cfg[k]));
      cfg = { ...cfg, ...next };
      if (keys.length) apply(keys);
    };
  }
})();
