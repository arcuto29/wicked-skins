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
    // Behaviour: react to the market / your own P&L (entry typed in by the user; never reads the account)
    react: "off",          // "off" | "market" | "pnl"
    reactStrength: 0.6,
    pnlSide: "long",       // "long" | "short"
    pnlEntry: 0,
    pnlSymbol: "",         // optional: only react on this symbol (e.g. "BTCUSDT")
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

  function pnlPct(q) {
    const entry = +cfg.pnlEntry;
    if (!entry || !q) return null;
    if (cfg.pnlSymbol && cfg.pnlSymbol.trim().toUpperCase() !== q.sym.toUpperCase()) return null;
    return ((q.price - entry) / entry) * 100 * (cfg.pnlSide === "short" ? -1 : 1);
  }

  function updateReact(tick) {
    if (!reactEl) return;
    let active = cfg.react !== "off" && !!quote;
    let label = "";
    if (!active) mood = 0;
    else if (cfg.react === "market") { mood = clamp(quote.chg / 2); }          // ±2% day move = full
    else {
      const p = pnlPct(quote);
      if (p === null) { active = false; mood = 0; }                              // no entry / other symbol
      else { mood = clamp(p / 1); label = `P&L ${p >= 0 ? "+" : ""}${p.toFixed(2)}%`; } // ±1% = full
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
      if (el && label) { const r = el.getBoundingClientRect(); pillEl.style.top = r.top + 8 + "px"; pillEl.style.left = r.right - 80 + "px"; // left of the price axis }
    }
  }

  function onTitle() {
    const q = parseTitle();
    if (!q) return;
    let tick = 0;
    if (lastPrice !== null && quote && q.sym === quote.sym && q.price !== lastPrice) {
      tick = cfg.react === "pnl" && cfg.pnlSide === "short" ? (q.price < lastPrice ? 1 : -1) : (q.price > lastPrice ? 1 : -1);
    }
    quote = q; lastPrice = q.price;
    updateReact(tick);
  }
  const watchTitle = () => {
    const t = document.querySelector("title");
    if (!t) return setTimeout(watchTitle, 1000);
    new MutationObserver(onTitle).observe(t, { childList: true, characterData: true, subtree: true });
    onTitle();
  };
  watchTitle();

  // TradingView caches its candle layer and ignores window "resize" or 1px nudges.
  // Hiding the chart for two frames makes it rebuild every canvas (tested live).
  // Debounced so dragging a slider redraws once at the end, not on every tick.
  let repaintTimer;
  const repaint = () => {
    clearTimeout(repaintTimer);
    repaintTimer = setTimeout(() => {
      document.querySelectorAll(".chart-container").forEach((el) => {
        const prev = el.style.display;
        el.style.display = "none";
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.display = prev; }));
      });
    }, 150);
  };

  function applyLook() {
    if (!layer) return;
    layer.classList.toggle("bd-over", cfg.layer === "over");
    document.documentElement.classList.toggle("bd-over-mode", cfg.layer === "over");
    clipToChart();
    updateReact(0);
    // Over-chart sits ON TOP of the candles, so it needs its own (lower) strength or it hides them.
    layer.style.opacity = String(cfg.layer === "over" ? cfg.overOpacity : cfg.opacity);
    layer.querySelector(".bd-dim").style.opacity = String(cfg.dim);
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
      content.playbackRate = Math.max(0.25, Math.min(4, cfg.speed));
      cfg.paused ? content.pause() : content.play().catch(() => {});
    }
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

    const m = activeMedia();
    if (m) {
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
    reactEl = document.createElement("div");
    reactEl.className = "bd-react";
    layer.appendChild(reactEl);
    pillEl = document.createElement("div");
    pillEl.className = "bd-pill"; pillEl.hidden = true;
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
      const dt = Math.min(0.1, (now - last) / 1000) * cfg.speed * (1 + Math.abs(mood) * cfg.reactStrength * 1.5);
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
    if (cfg.candleOn) h.setAttribute("data-bd-candles", JSON.stringify({ up: cfg.candleUp, down: cfg.candleDown, glow: cfg.candleGlow }));
    else h.removeAttribute("data-bd-candles");
    repaint();
  }

  // Keys that need a rebuild vs. ones we can apply live.
  const REBUILD = new Set(["enabled", "skin", "mediaId", "powerSaver"]);
  function apply(keys) {
    const candleKeys = keys.filter((k) => k.startsWith("candle"));
    if (candleKeys.length) pushCandles();
    keys = keys.filter((k) => !k.startsWith("candle"));
    if (!keys.length) return;
    const needsRebuild = keys.some((k) => REBUILD.has(k)) ||
      (keys.includes("media") && cfg.skin === "media");
    needsRebuild ? build() : applyLook();
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(DEFAULTS, (stored) => { cfg = { ...DEFAULTS, ...stored }; build(); pushCandles(); });
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
    window.__bdUpdate = (next) => {
      const keys = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cfg[k]));
      cfg = { ...cfg, ...next };
      if (keys.length) apply(keys);
    };
  }
})();
