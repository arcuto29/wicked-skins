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
  // TradingView caches painted canvases; a resize nudge makes it repaint after we toggle.
  const repaint = () => setTimeout(() => window.dispatchEvent(new Event("resize")), 60);

  function applyLook() {
    if (!layer) return;
    layer.classList.toggle("bd-over", cfg.layer === "over");
    document.documentElement.classList.toggle("bd-over-mode", cfg.layer === "over");
    clipToChart();
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
      const dt = Math.min(0.1, (now - last) / 1000) * cfg.speed;
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
      layer = content = null;
    }
  }

  // Keys that need a rebuild vs. ones we can apply live.
  const REBUILD = new Set(["enabled", "skin", "mediaId", "powerSaver"]);
  function apply(keys) {
    const needsRebuild = keys.some((k) => REBUILD.has(k)) ||
      (keys.includes("media") && cfg.skin === "media");
    needsRebuild ? build() : applyLook();
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(DEFAULTS, (stored) => { cfg = { ...DEFAULTS, ...stored }; build(); });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const k in changes) cfg[k] = changes[k].newValue;
      apply(Object.keys(changes));
    });
  } else {
    // Desktop app: host injects window.__BD_CFG and calls window.__bdUpdate on change.
    cfg = { ...DEFAULTS, ...(window.__BD_CFG || {}) };
    build();
    window.__bdUpdate = (next) => {
      const keys = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cfg[k]));
      cfg = { ...cfg, ...next };
      if (keys.length) apply(keys);
    };
  }
})();
