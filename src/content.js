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
    // Sides: let the wallpaper flow across the panels around the chart (watchlist, toolbars, the grey areas).
    // "off" = only the chart; "glass" = frosted panels; "clear" = fully see-through panels.
    sides: "off",
    leftBar: "off",
    // TradingView's own panels (watchlist, toolbars, menus): off = TradingView's colours | skin = a dark tint of the
    // wallpaper's colour | color = your colour. Text switches light/dark to stay readable.
    panelMode: "off", panelColor: "#10131c",
    // TradingView's own windows (Settings, other dialogs) and dropdown menus: off | glass (frosted, your wallpaper
    // glows through) | color (your colour). dlgAlpha = how solid (0.4 see-through .. 1 solid).
    dlgMode: "off", dlgColor: "#12151f", dlgAlpha: 0.78,
    clipEdit: true,
    clipAudio: "none",        // sound in clips: none | mic (your voice) | computer (what's playing: music, videos) | both
    // Shortcuts (changeable in Adjust > Shortcuts). Stored as "Alt+Shift+KeyF" (modifiers + the key's code).
    toggleKey: "Alt+Shift+KeyW", focusKey: "Alt+Shift+KeyF", recordKey: "Alt+Shift+KeyR", snapKey: "Alt+Shift+KeyS",
    clipLen: 10,              // seconds a shortcut recording lasts (the Clip section's length)
    focus: false, focusHides: "wallpaper",   // Focus mode: hide just the wallpaper, or the wallpaper AND all styling
    // Session timer: a slim countdown to the next market open / close, styled to match your look.
    timerOn: false, timerMarket: "auto", timerPos: "bc",
    // Streamer mode: hides your money on screen and in every recording (labels on the chart, Priism's readouts,
    // TradingView's account / order panels). privacyPeek = un-blur a panel while your mouse is over it.
    privacy: false, privacyPeek: false, privacyKey: "Alt+Shift+KeyP",
    privacyAcct: true, privacyOrder: false,   // which TradingView panels get blurred
    privacyPnl: "hide",    // trade-label P&L in Streamer mode: hide | ticks (money hidden) | points | show
    bracketQty: "",        // colour of the lot-size pill on your brackets
    // Auto trade clips: while a trade is open, keep the last tradeClipLen seconds ready; save a clip when it closes.
    tradeClipOn: false, tradeClipLen: 30,
    clipQuality: "balanced",  // high | balanced | small (small keeps a clip under ~20 MB, e.g. for Discord)           // after a recording: open the crop / trim editor (false = download right away)
    // Chart styling — each part off = TradingView's own. Colour "" = skin colour, "candle" = your up-candle colour.
    gridOn: false, gridColor: "", gridAlpha: 0.35, gridW: 0, gridStyle: "dotted",
    chOn: false, chColor: "", chW: 0, chStyle: "dashed", chGlow: false, chLabels: false,
    plOn: false, plColor: "", plW: 0, plStyle: "dotted",
    sbOn: false, sbColor: "", sbW: 0, sbStyle: "dashed", axOn: false, axColor: "", axW: 0, axStyle: "solid",           // the left drawing-tool rail: off (TradingView's own) | glass | clear
    // UI style: font + accent for TradingView's own panels (watchlist, toolbars, order area, timeframe bar).
    uiFont: "default", uiSize: 0, uiAccent: "",     // font: default|mono|rounded ; size: 0|1 ; accent: "" or #hex
    // Watermark: the Priism Skins logo + your name/handle, for recordings and streams.
    // style: "corner" (clean logo + text in a corner) or "tiled" (faint repeated mark across the chart, hard to crop out)
    wmOn: false, wmPos: "br", wmText: "", wmStyle: "corner", wmOpacity: 0.85, wmDrift: false,
    vignette: 0, calm: false,            // darker edges; dim + slow down while your cursor is on the chart
    // Session skins: a different wallpaper per market session ("" = keep your normal skin)
    sessionOn: false, sessionSkins: { asia: "galaxy", london: "rain", ny: "cybergrid", off: "ocean" },
    // Symbol skins: a wallpaper per ticker, e.g. { "BTCUSDT": "galaxy", "NQ": "media:<id>" }. Switches by itself.
    symbolOn: false, symbolSkins: {},
    // Auto quality: drop resolution / frame rate by itself if the computer starts dropping frames.
    autoQuality: true,
    // Auto-match: pull candle colours, glow and scale tint from your own wallpaper's colours.
    autoMatch: false,
    // P&L readout: a big, legible open-P&L number we draw ourselves (TradingView's own pill is tiny/hard to see
    // on busy wallpapers). style: "color" (green/red) | "rainbow"; pos: "tc"|"tl"|"tr"|"bl"|"br"; size 0..2.
    // style: "color" (your up/down colours) | "rainbow". back: "none"|"glass"|"solid" = a panel behind the number
    // so it's readable on any wallpaper. pnlUp/pnlDown: custom colours ("" = use candle colours).
    pnlShow: false, pnlStyle: "color", pnlPos: "tc", pnlSize: 1, pnlBack: "glass", pnlUp: "", pnlDown: "",
    // Daily goal / loss limit bar + automatic trade journal (both opt-in; estimates from the P&L drawn on the chart).
    goalOn: false, goalTarget: 500, goalLimit: 300, goalPos: "bl", journalOn: false,
    // the ticker in the chart's top-left legend (symbol name, timeframe, exchange)
    tkOn: false, tkColor: "", tkSize: 1, tkFont: "default", tkGlow: false, tkOnly: false,
    goalSound: "off",      // off | soft | loud: a chime at your goal, a warning at 80% of the loss limit, a low tone at the limit
    sessionSound: "off",   // off | soft | loud: a ping 5 minutes before the session opens / closes, two pings when it does
    // Glow on indicators / lines / P&L, and price scale styling
    lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: true,
    scaleSize: 0, scaleFont: "default",
    // Bracket pills: fully recolour the broker's on-chart TP / Stop / entry / P&L boxes — box, text, border, line.
    // Every colour "" = keep as TradingView draws it. bracketBack only strengthens the box when no custom fill set.
    bracketOn: false, bracketSize: 1, bracketBack: "keep",
    bracketFill: "", bracketText: "", bracketProfit: "", bracketLoss: "",
    bracketBorderColor: "", bracketBorderW: 0, bracketLineColor: "", bracketLineW: 0,
    bracketDebug: true,   // records caught pills to window.__bdBracketDebug for troubleshooting (no data leaves)
    // Multi-chart layouts: "span" = one wallpaper across the whole layout, "each" = every chart gets its own copy,
    // "mix" = pick a wallpaper per chart (chartSkins: { "2": "galaxy", "3": "media:<id>" }; chart 1 = your main skin)
    multi: "span", chartSkins: {},
  };

  let cfg = { ...DEFAULTS };
  let layer, raf, running = false;
  let views = [];          // one per wallpaper: { tile, content, dim, vg, n, x, y, w, h, skin?, clock, lum? }

  // ---------- session skins (New York time) ----------
  // Asia 18:00-03:00 · London 03:00-08:00 · New York 08:00-17:00 · After-hours 17:00-18:00 and weekends
  function currentSession(d = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23", weekday: "short" })
      .formatToParts(d).map((p) => [p.type, p.value]));
    const h = +parts.hour, day = parts.weekday;
    if (day === "Sat" || (day === "Sun" && h < 18) || (day === "Fri" && h >= 17)) return "off";
    if (h >= 18 || h < 3) return "asia";
    if (h < 8) return "london";
    if (h < 17) return "ny";
    return "off";
  }
  let session = currentSession();

  // ---------- symbol skins ----------
  // Match the live chart symbol against your map. Tickers vary by platform (BTCUSDT, BINANCE:BTCUSDT, NQ1!),
  // so we match loosely: exact first, then ignoring the exchange prefix, then a contained-word match.
  let curSymbol = "";
  const normSym = (s) => String(s || "").toUpperCase().replace(/^[A-Z0-9]+:/, "").replace(/[^A-Z0-9]/g, "");
  function symbolSkin() {
    const map = cfg.symbolSkins || {}, keys = Object.keys(map);
    if (!curSymbol || !keys.length) return null;
    const cur = normSym(curSymbol);
    let best = map[curSymbol];                                   // exact raw key
    if (!best) for (const k of keys) { if (normSym(k) === cur) { best = map[k]; break; } }
    if (!best) for (const k of keys) { const nk = normSym(k); if (nk && (cur.startsWith(nk) || nk.startsWith(cur))) { best = map[k]; break; } }
    return validSource(best) ? best : null;
  }
  // Does the chosen source ("skin" or "media:<id>") resolve to a real, usable wallpaper?

  // Priority (resolved in mainSource): symbol skin (most specific) > session skin > your normal skin.
  setInterval(() => { const s2 = currentSession(); if (s2 !== session) { session = s2; if (cfg.sessionOn && !(cfg.symbolOn && symbolSkin()) && layer) build(); } }, 30000);
  // ---------- charts on the page (multi-chart layouts) ----------
  // Every visible chart, in reading order (top row left to right, then the next row). Chart 1 is top-left.
  function chartEls() {
    // Advanced Charts panes; if none, fall back to Lightweight Charts container(s) so the wallpaper still places.
    // ".chart-container" is a common class name, so only count it as TradingView's own chart when it holds one.
    let all = [...document.querySelectorAll(".chart-container")].filter((el) => el.querySelector(".chart-markup-table"));
    if (!all.length) all = [...document.querySelectorAll(LW_SEL)];
    return all
      .filter((el) => !all.some((o) => o !== el && o.contains(el)))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 80 && r.height > 60)
      .sort((a, b) => (Math.abs(a.r.top - b.r.top) > 20 ? a.r.top - b.r.top : a.r.left - b.r.left));
  }
  const LW_SEL = "[data-bd-lwroot], .tv-lightweight-charts, [class*='lightweight']";
  let charts = [];
  const tiled = () => cfg.multi !== "span" && charts.length > 1;
  // the area covered by all charts together (watermark, P&L pill, over-chart clipping)
  function chartsBox() {
    if (!charts.length) {
      const el = document.querySelector(".layout__area--center") || document.querySelector(LW_SEL);
      const r = el ? el.getBoundingClientRect() : null;
      return r && r.width > 80 ? r : { left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    }
    const l = Math.min(...charts.map((c) => c.r.left)), t = Math.min(...charts.map((c) => c.r.top));
    const r = Math.max(...charts.map((c) => c.r.right)), b = Math.max(...charts.map((c) => c.r.bottom));
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
  }

  // Charts inside iframes (prop platforms embed TradingView's library in a frame, sometimes one frame per chart):
  // the top page numbers every chart by position, so "Chart 2" means the same thing everywhere.
  // firstNum = the number of this frame's first chart (1 on a normal page).
  const IN_FRAME = window !== window.top;
  let firstNum = 1;
  const chartFrames = new Map();   // (top page only) frame window -> { seen, count }
  function frameRects() {
    const ifr = [...document.querySelectorAll("iframe")], now = Date.now(), out = [];
    for (const [w, info] of chartFrames) {
      const el = ifr.find((f) => f.contentWindow === w);
      if (!el || now - info.seen > 10000) { chartFrames.delete(w); continue; }
      const r = el.getBoundingClientRect();
      if (r.width > 80 && r.height > 60) out.push({ w, r, count: info.count });
    }
    return out.sort((a, b) => (Math.abs(a.r.top - b.r.top) > 20 ? a.r.top - b.r.top : a.r.left - b.r.left));
  }
  function numberFrames() {
    const list = frameRects(); let n = 1;
    const total = list.reduce((a, f) => a + f.count, 0);
    for (const f of list) { try { f.w.postMessage({ __wicked: "chart-index", n, total }, "*"); } catch {} n += f.count; }
  }
  addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object" || !e.source) return;
    if (d.__wicked === "chart-frame" && !IN_FRAME) {
      const prev = chartFrames.get(e.source), count = Math.max(1, Math.min(16, d.count | 0));
      chartFrames.set(e.source, { seen: Date.now(), count });
      if (!prev || prev.count !== count) setTimeout(numberFrames, 50); else numberFrames();
    }
    if (IN_FRAME && e.source === window.top) {
      if (d.__wicked === "chart-index") {
        const n = Math.max(1, Math.min(16, d.n | 0));
        if (n !== firstNum) { firstNum = n; if (layer && cfg.multi === "mix") build(); }
      }
      if (d.__wicked === "show-numbers") showNumbers(+d.n || 0);
    }
  });
  const announceFrame = () => { if (IN_FRAME && owner && !standDown && charts.length) try { window.top.postMessage({ __wicked: "chart-frame", count: charts.length }, "*"); } catch {} };
  setInterval(announceFrame, 3000);
  const chartCount = () => (charts.length || frameRects().reduce((a, f) => a + f.count, 0));

  // What wallpaper does chart n show? A built-in skin id, or "media:<id>" for one of your uploads.
  function mainSource() {
    if (cfg.symbolOn) { const s = symbolSkin(); if (s) return s; }   // symbol match is a full source (skin id or "media:<id>")
    const n = cfg.sessionOn ? ((cfg.sessionSkins || {})[session]) : null;
    if (n && window.WickedSkins[n]) return n;
    return cfg.skin === "media" ? "media:" + cfg.mediaId : cfg.skin;
  }
  function validSource(s) {
    if (typeof s !== "string" || !s) return false;
    if (s.startsWith("media:")) return cfg.media.some((m) => m.id === s.slice(6) && !m.pending);
    return !!window.WickedSkins[s];
  }
  function sourceFor(n) {
    if (cfg.multi === "mix" && n > 1) { const s = (cfg.chartSkins || {})[n]; if (validSource(s)) return s; }
    return mainSource();
  }

  // "Over chart" mode: only cover the charts, not toolbars/watchlist (every chart of a multi-chart layout).
  function clipToChart() {
    if (!layer) return;
    if (cfg.layer !== "over" || tiled()) { layer.style.clipPath = ""; return; }
    const rects = charts.length ? charts.map((c) => c.r) : [chartsBox()];
    layer.style.clipPath = `path("${rects.map((r) => `M${r.left} ${r.top}H${r.right}V${r.bottom}H${r.left}Z`).join(" ")}")`;
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
  const DOTS = "\u2022\u2022\u2022\u2022\u2022";
  const hideMoney = () => !!cfg.privacy && cfg.privacyPnl !== "show";
  const fmtPnl = (v, u) => { if (hideMoney()) return DOTS; const unit = u && u.length === 1 ? u : "", code = u && u.length > 1 ? " " + u : "";
    return `${v >= 0 ? "+" : "\u2212"}${unit}${Math.abs(v).toFixed(2)}${code}`; };
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
      if (label) { const r = chartsBox(); pillEl.style.top = r.top + 8 + "px"; pillEl.style.left = r.right - 80 + "px"; } // pill sits left of the price axis
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
    // Symbol changed: if a per-symbol skin applies, rebuild so the wallpaper switches with the ticker.
    if (q.sym !== curSymbol) {
      const before = mainSource();
      curSymbol = q.sym;
      if (cfg.enabled && cfg.symbolOn && layer && !tiled() && mainSource() !== before) build();
    }
    updateReact(tick);
  }
  new MutationObserver(() => { if (cfg.react === "pnl") updateReact(0); renderPnl(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-ws-pnl"] });
  setInterval(() => { if (cfg.react === "pnl") updateReact(0); renderPnl(); }, 2000);     // clears the glow when the position closes

  // ---------- big P&L readout ----------
  // Our own large, animated open-P&L number, drawn on top of the chart so it's readable on any wallpaper.
  // Reads the same P&L the hook already publishes. Independent of the "Live mood" glow.
  let pnlEl, pnlLastV = null, pnlFlashT = 0;
  function renderPnl() {
    const show = cfg.enabled && cfg.pnlShow;
    const p = show ? readPnl() : null;
    if (!p) { if (pnlEl) { pnlEl.remove(); pnlEl = null; } pnlLastV = null; return; }
    if (!pnlEl) {
      pnlEl = document.createElement("div"); pnlEl.id = "bd-pnl"; pnlEl.dataset.bdOwner = ME.token;
      document.documentElement.appendChild(pnlEl);
    }
    const up = p.v >= 0;
    const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
    const col = cfg.pnlStyle === "rainbow" ? "#fff" : (up ? (hex(cfg.pnlUp) || upColor()) : (hex(cfg.pnlDown) || downColor()));
    pnlEl.textContent = "P&L " + fmtPnl(p.v, p.unit);
    const back = ["glass", "solid"].includes(cfg.pnlBack) ? cfg.pnlBack : "none";
    pnlEl.className = "bd-pnl-" + (cfg.pnlStyle === "rainbow" ? "rainbow" : (up ? "up" : "down")) + (back !== "none" ? " bd-pnl-box bd-pnl-" + back : "");
    const sizeMap = [24, 34, 50], fs = sizeMap[Math.max(0, Math.min(2, +cfg.pnlSize || 1))];
    pnlEl.style.fontSize = fs + "px";
    pnlEl.style.setProperty("--pc", col);
    placePnl();
    // pulse the number when it changes
    if (pnlLastV !== null && p.v !== pnlLastV && performance.now() - pnlFlashT > 250) {
      pnlFlashT = performance.now();
      pnlEl.classList.remove("bd-pnl-bump"); void pnlEl.offsetWidth; pnlEl.classList.add("bd-pnl-bump");
    }
    pnlLastV = p.v;
  }
  function placePnl() {
    if (!pnlEl) return;
    const r = chartsBox(), pad = 16, st = pnlEl.style; st.left = st.right = st.top = st.bottom = st.transform = "";
    const pos = cfg.pnlPos || "tc";
    if (pos === "tc") { st.left = r.left + r.width / 2 + "px"; st.top = r.top + pad + 34 + "px"; st.setProperty("--tf", "translateX(-50%)"); st.transform = "translateX(-50%)"; return; }
    st.setProperty("--tf", "none");
    if (pos[0] === "t") st.top = r.top + pad + 34 + "px"; else st.top = r.bottom - 50 - pad + "px";
    if (pos[1] === "l") st.left = r.left + pad + "px"; else { st.right = (innerWidth - r.right) + 80 + pad + "px"; }
  }
  // ---------- Trading tools: daily goal / loss limit + automatic trade journal ----------
  // Both run off the open-P&L text hook.js already publishes (data-ws-pnl). A "trade" is that P&L appearing and then
  // disappearing. When it disappears, its last value is added to today's total. That total is an ESTIMATE built from
  // what the chart drew, not your broker's statement. Everything stays in this browser (chrome.storage.local);
  // nothing is sent anywhere.
  const HAS_STORE = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  const JOURNAL_MAX = 60;
  const dayKey = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const freshDay = () => ({ date: dayKey(), realized: 0, trades: 0, unit: "", flags: {} });
  let day = freshDay(), openTrade = null, lastNudge = 0, goalEl = null, jShot = null, jShotT = 0;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmtDur = (s) => (s < 90 ? s + "s" : s < 5400 ? Math.round(s / 60) + "m" : (s / 3600).toFixed(1) + "h");
  const fmtAbs = (n, u) => { if (hideMoney()) return DOTS; const unit = u && u.length === 1 ? u : "", code = u && u.length > 1 ? " " + u : "";
    return `${unit}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}${code}`; };
  const readPnlRaw = () => { try { const p = JSON.parse(document.documentElement.getAttribute("data-ws-pnl") || "null"); return p && typeof p.v === "number" ? p : null; } catch { return null; } };
  const curSym = () => { const q = parseTitle(); return q ? q.sym : ""; };
  const persistDay = () => { if (HAS_STORE) try { chrome.storage.local.set({ dayPnl: day }); } catch {} };
  function rollDay() { if (day.date !== dayKey()) { day = freshDay(); persistDay(); } }
  const totalToday = () => Math.round((day.realized + (openTrade ? openTrade.v : 0)) * 100) / 100;
  if (HAS_STORE) chrome.storage.local.get({ dayPnl: null }, (s) => { if (s.dayPnl && s.dayPnl.date === dayKey()) day = { ...freshDay(), ...s.dayPnl }; });

  function tickTrades() {
    if (standDown || (EXT && !owner)) return;
    if (!(cfg.enabled && (cfg.goalOn || cfg.journalOn || cfg.tradeClipOn))) { openTrade = null; jShot = null; tcStop(); return renderGoal(); }
    // A hidden tab doesn't redraw its chart, so its P&L text goes stale. That must never look like a closed trade
    // (otherwise tabbing away mid-trade would record a fake close, then a fake new trade when you come back).
    if (document.hidden) return renderGoal();
    rollDay();
    const now = Date.now(), p = readPnlRaw(), age = p ? now - p.ts : Infinity;
    if (p && age < 3000) {
      if (!openTrade) { openTrade = { since: now, sym: curSym(), v: p.v, unit: p.unit || "", seen: p.ts }; if (cfg.tradeClipOn) tcStart(); }
      else { openTrade.v = p.v; openTrade.seen = p.ts; if (p.unit) openTrade.unit = p.unit; }
      if (cfg.journalOn && now - openTrade.since >= 2500) refreshJournalShot();   // let the entry / stop / target lines settle first
    } else if (openTrade) {
      // The P&L text hasn't been drawn for a while. A quiet market stops the chart redrawing, so ask TradingView for a
      // soft repaint first; only if nothing comes back do we believe the position is really gone.
      if (age >= 6000 && now - lastNudge > 5000) { lastNudge = now; document.dispatchEvent(new CustomEvent("bd-softrepaint")); }
      const sym = curSym(), otherSymbol = sym && openTrade.sym && sym !== openTrade.sym;   // pill hidden because you're on another symbol
      // close only once a repaint was requested at least 2.5s ago and still nothing came back
      if (age >= 8500 && now - lastNudge >= 2500 && !otherSymbol) { const t = openTrade; openTrade = null; closeTrade(t); }
    }
    renderGoal();
  }
  setInterval(tickTrades, 700);

  // ---------- auto trade clips ----------
  // Only records while you're in a trade (nothing runs when you're flat). Two overlapping recorders share one
  // picture of the chart; a fresh one starts every N seconds and the oldest is dropped, so the older of the two always
  // holds the last N..2N seconds. When the trade closes (Priism notices a few seconds later), that one is saved, so the
  // clip ends just after the close.
  let tc = null;
  async function tcStart() {
    if (tc || !(cfg.enabled && cfg.tradeClipOn) || typeof MediaRecorder === "undefined" || (EXT && !owner)) return;
    tc = { starting: true };
    const box = chartsBox(), scale = Math.min(1, 900 / Math.max(1, box.width)), dpr = Math.min(1.5, devicePixelRatio || 1) * scale;
    const W = Math.max(2, Math.round(box.width * dpr)) & ~1, H = Math.max(2, Math.round(box.height * dpr)) & ~1;
    const cap = document.createElement("canvas"); cap.width = W; cap.height = H; const g = cap.getContext("2d");
    let wmImg = null; try { wmImg = await watermarkImage(); } catch {}
    if (!tc || !tc.starting) return;                                  // stopped while we were getting ready
    try { compositeFrame(g, box, dpr, wmImg); } catch { tc = null; return; }
    const fps = 24; let stream; try { stream = cap.captureStream(fps); } catch { tc = null; return; }
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
    const N = Math.max(10, Math.min(120, +cfg.tradeClipLen || 30));
    tc = { cap, g, box, dpr, wmImg, stream, mime, N, recs: [], last: 0, rot: 0, raf: 0 };
    const draw = (t) => { if (!tc || !tc.cap) return; tc.raf = requestAnimationFrame(draw); if (t - tc.last < 1000 / fps - 2) return; tc.last = t; try { compositeFrame(tc.g, tc.box, tc.dpr, tc.wmImg); } catch {} };
    tc.raf = requestAnimationFrame(draw);
    const fresh = () => {
      if (!tc || !tc.cap) return;
      let r; try { r = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: clipBps(W, H, fps, N * 2, cfg.clipQuality) } : undefined); } catch { return; }
      r.chunks = []; r.t0 = Date.now(); r.ondataavailable = (e) => { if (e.data && e.data.size) r.chunks.push(e.data); };
      r.start(1000); tc.recs.push(r);
      while (tc.recs.length > 2) { const old = tc.recs.shift(); try { old.stop(); } catch {} }
    };
    fresh(); tc.rot = setInterval(fresh, N * 1000);
  }
  function tcStop() {
    if (!tc) return; const t = tc; tc = null;
    clearInterval(t.rot); cancelAnimationFrame(t.raf);
    for (const r of t.recs || []) try { r.stop(); } catch {}
    try { t.stream && t.stream.getTracks().forEach((x) => x.stop()); } catch {}
  }
  async function tcFinish(trade, v) {
    if (!tc || !tc.recs || !tc.recs.length) return tcStop();
    const r = tc.recs[0], t = tc; tc = null;
    clearInterval(t.rot);
    for (const x of t.recs) if (x !== r) try { x.stop(); } catch {}
    await new Promise((res) => { r.onstop = res; try { r.requestData(); r.stop(); } catch { res(); } setTimeout(res, 3000); });
    cancelAnimationFrame(t.raf); try { t.stream.getTracks().forEach((x) => x.stop()); } catch {}
    if (!r.chunks.length) return;
    const blob = new Blob(r.chunks, { type: t.mime || "video/webm" }), d = new Date();
    const pnl = hideMoney() ? "" : "-" + (v >= 0 ? "+" : "") + String(v).replace(/[^\d.+-]/g, "");
    saveBlob(blob, `priism-trade-${String(trade.sym || "chart").replace(/[^\w-]+/g, "")}${pnl}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}.webm`);
    flash("Trade clip saved to your downloads");
  }
  window.__bdTradeClip = () => (tc && tc.recs ? { recording: tc.recs.length, ages: tc.recs.map((r) => Math.round((Date.now() - r.t0) / 1000)) } : null);   // diagnostics

  // ---------- Streamer mode ----------
  function applyPrivacy() {
    const h = document.documentElement, on = !!(cfg.enabled && cfg.privacy);
    h.classList.toggle("bd-privacy", on); h.classList.toggle("bd-peek", on && !!cfg.privacyPeek);
    h.classList.toggle("bd-priv-money", on && cfg.privacyPnl !== "show");
    h.classList.toggle("bd-priv-acct", on && cfg.privacyAcct !== false); h.classList.toggle("bd-priv-order", on && !!cfg.privacyOrder);
    pushFx();
    if (pnlEl && pnlEl.textContent) { try { renderPnl(); } catch {} }
    document.dispatchEvent(new CustomEvent("bd-softrepaint"));   // redraw the chart labels masked / unmasked
  }

  // Add a finished trade to today's total. Two TradingView tabs showing the same trade must not count it twice, so
  // the shared storage copy is checked first and only the tab that records it first goes on to write the journal.
  function recordClose(v, sym, unit) {
    return new Promise((resolve) => {
      if (!HAS_STORE) { day.realized = Math.round((day.realized + v) * 100) / 100; day.trades++; return resolve(true); }
      chrome.storage.local.get({ dayPnl: null }, (s) => {
        const d = s.dayPnl && s.dayPnl.date === dayKey() ? { ...freshDay(), ...s.dayPnl } : freshDay(), now = Date.now();
        if (d.last && d.last.sym === sym && d.last.v === v && now - d.last.t < 25000) { day = d; return resolve(false); }
        d.realized = Math.round((d.realized + v) * 100) / 100; d.trades = (d.trades || 0) + 1; d.unit = unit || d.unit; d.last = { sym, v, t: now };
        day = d; chrome.storage.local.set({ dayPnl: d }, () => resolve(true));
      });
    });
  }
  async function closeTrade(t) {
    const secs = Math.max(0, Math.round((t.seen - t.since) / 1000));
    if (secs >= 4 && tc) tcFinish(t, Math.round(t.v * 100) / 100);
    if (secs < 4) { jShot = null; tcStop(); return; }             // a flicker, not a trade
    const v = Math.round(t.v * 100) / 100;
    await sleep(Math.random() * 400);
    const first = await recordClose(v, t.sym, t.unit);
    if (first && cfg.journalOn) await saveJournal(t, v, secs);
    jShot = null; jShotT = 0;
    renderGoal();
  }

  // Journal pictures are taken WHILE the trade is open (first after ~2.5s, then refreshed about every 10s), because that's when your entry,
  // stop and target are on the chart; by the time it closes they're gone.
  async function composeChartCanvas(maxW) {
    const box = chartsBox(), k = Math.min(1.5, devicePixelRatio || 1) * Math.min(1, maxW / Math.max(1, box.width));
    const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(box.width * k)); c.height = Math.max(2, Math.round(box.height * k));
    compositeFrame(c.getContext("2d"), box, k, await watermarkImage());
    return c;
  }
  async function refreshJournalShot() {
    if (!HAS_STORE || Date.now() - jShotT < 10000) return;
    jShotT = Date.now();
    try { jShot = await composeChartCanvas(1100); } catch { jShot = null; }
  }
  async function saveJournal(t, v, secs) {
    let c = jShot;
    if (!c) { try { c = await composeChartCanvas(1100); } catch { c = null; } }
    let img = null;
    if (c) {
      try {
        // a header band above the chart (so nothing on the chart is covered): symbol, P&L, time held
        const head = Math.max(30, Math.round(c.width * 0.042)), out = document.createElement("canvas");
        out.width = c.width; out.height = c.height + head;
        const g = out.getContext("2d"), fs = Math.round(head * 0.42), pad = Math.round(head * 0.4);
        g.fillStyle = "#0b0e16"; g.fillRect(0, 0, out.width, out.height); g.drawImage(c, 0, head);
        g.textBaseline = "middle"; g.font = `800 ${fs}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
        const name = t.sym || "Trade"; g.fillStyle = "#e9ecf5"; g.fillText(name, pad, head / 2);
        g.fillStyle = v >= 0 ? "#00e08a" : "#ff3355"; g.fillText(fmtPnl(v, t.unit), pad * 2 + g.measureText(name).width, head / 2);
        g.fillStyle = "#8f98ad"; g.font = `600 ${Math.round(fs * 0.8)}px system-ui, sans-serif`; g.textAlign = "right";
        g.fillText(new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + " \u00B7 held " + fmtDur(secs), out.width - pad, head / 2);
        img = out.toDataURL("image/jpeg", 0.82);
      } catch { img = null; }
    }
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), sym: t.sym || "", v, unit: t.unit || "", secs, img };
    await new Promise((res) => chrome.storage.local.get({ journal: [] }, (s) => {
      const list = [entry, ...(Array.isArray(s.journal) ? s.journal : [])].slice(0, JOURNAL_MAX);
      chrome.storage.local.set({ journal: list }, res);
    }));
  }

  // The goal / limit bar. Left half of the track = how much of your max loss is used, right half = progress to the goal.
  function checkFlags(total, T, L) {
    const f = day.flags || (day.flags = {}); let changed = false;
    if (L > 0 && total <= -L * 0.8 && !f.w80) { f.w80 = 1; flash("Daily loss limit: 80% used"); sound("warn", cfg.goalSound, "w80"); changed = true; }
    if (L > 0 && total <= -L && !f.lim) { f.lim = 1; flash("Daily loss limit reached"); sound("limit", cfg.goalSound, "lim"); changed = true; }
    if (T > 0 && total >= T && !f.goal) { f.goal = 1; flash("Daily goal reached"); sound("goal", cfg.goalSound, "goal"); changed = true; }
    if (changed) persistDay();
  }
  function renderGoal() {
    const T = Math.max(0, +cfg.goalTarget || 0), L = Math.max(0, +cfg.goalLimit || 0);
    if (!(cfg.enabled && cfg.goalOn && (T || L))) { if (goalEl) { goalEl.remove(); goalEl = null; } return; }
    if (!goalEl) {
      goalEl = document.createElement("div"); goalEl.id = "bd-goal"; goalEl.dataset.bdOwner = ME.token;
      goalEl.title = "Estimated from the P&L text drawn on your chart. Not your broker's statement.";
      goalEl.innerHTML = '<div class="bd-g-top"><span class="bd-g-label"></span><span class="bd-g-val"></span></div><div class="bd-g-track"><i class="bd-g-fill"></i><u class="bd-g-mid"></u></div><div class="bd-g-meta"><span class="bd-g-l"></span><span class="bd-g-r"></span></div>';
      document.documentElement.appendChild(goalEl);
    }
    const total = totalToday(), u = day.unit || (openTrade && openTrade.unit) || "";
    checkFlags(total, T, L);
    const state = L && total <= -L ? "limit" : L && total <= -L * 0.8 ? "warn" : T && total >= T ? "goal" : "";
    goalEl.className = state ? "bd-g-" + state : "";
    if (state) goalEl.style.removeProperty("--gc"); else goalEl.style.setProperty("--gc", total >= 0 ? upColor() : downColor());
    const w = (total >= 0 ? (T ? Math.min(1, total / T) : 0) : (L ? Math.min(1, -total / L) : 0)) * 50, fill = goalEl.querySelector(".bd-g-fill");
    fill.style.width = w + "%"; fill.style.left = (total >= 0 ? 50 : 50 - w) + "%";
    goalEl.querySelector(".bd-g-label").textContent = "TODAY" + (openTrade ? " \u00B7 LIVE" : "") + (day.trades ? ` \u00B7 ${day.trades} trade${day.trades > 1 ? "s" : ""}` : "");
    goalEl.querySelector(".bd-g-val").textContent = fmtPnl(total, u);
    goalEl.querySelector(".bd-g-l").textContent = L ? `limit \u2212${fmtAbs(L, u)}` : "";
    goalEl.querySelector(".bd-g-r").textContent = T ? `goal ${fmtAbs(T, u)}` : "";
    placeGoal();
  }
  function placeGoal() {
    if (!goalEl) return;
    const r = chartsBox(), pad = 16, st = goalEl.style, pos = cfg.goalPos || "bl";
    st.left = st.right = st.top = st.bottom = st.transform = "";
    if (pos === "tc") { st.left = r.left + r.width / 2 + "px"; st.top = r.top + pad + "px"; st.transform = "translateX(-50%)"; }
    else if (pos === "tl") { st.left = r.left + pad + "px"; st.top = r.top + pad + 34 + "px"; }              // below TradingView's legend row
    else { st.left = r.left + pad + "px"; st.bottom = (innerHeight - r.bottom) + 30 + 44 + "px"; }           // above the time axis + logo
  }

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

  // Calm while working: when your cursor is on a chart the wallpaper dims and slows down.
  let calmActive = false;
  const insideChart = (x, y) => (charts.length ? charts.map((c) => c.r) : [chartsBox()])
    .some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  addEventListener("mousemove", (e) => {
    if (!cfg.calm || !layer) { if (calmActive) { calmActive = false; applyLook(); } return; }
    const inside = insideChart(e.clientX, e.clientY);
    if (inside !== calmActive) { calmActive = inside; applyLook(); }
  }, { passive: true });
  document.addEventListener("mouseleave", () => { if (calmActive) { calmActive = false; applyLook(); } });
  const calmFactor = () => (cfg.calm && calmActive ? 0.35 : 1);

  function applyLook() {
    if (!layer) return;
    setTimeout(measureBackdrop, 300);
    layer.classList.toggle("bd-over", cfg.layer === "over");
    layer.classList.toggle("bd-tiled", tiled());
    document.documentElement.classList.toggle("bd-over-mode", cfg.layer === "over");
    clipToChart();
    updateReact(0);
    // Over-chart sits ON TOP of the candles, so it needs its own (lower) strength or it hides them.
    layer.style.opacity = String(cfg.layer === "over" ? cfg.overOpacity : cfg.opacity);
    const f = [];
    if (cfg.blur) f.push(`blur(${cfg.blur}px)`);
    if (cfg.vividness !== 1) f.push(`saturate(${cfg.vividness})`);
    if (cfg.tint) f.push(`hue-rotate(${cfg.tint}deg)`);
    if (cfg.bw) f.push("grayscale(1)");
    for (const v of views) {
      v.dim.style.opacity = String(Math.min(0.95, cfg.dim + (cfg.calm && calmActive ? 0.3 : 0)));
      v.vg.style.background = cfg.vignette > 0 ? `radial-gradient(ellipse at center, transparent ${Math.round(70 - cfg.vignette * 40)}%, rgba(0,0,0,${(0.35 + cfg.vignette * 0.55).toFixed(2)}) 100%)` : "none";
      const content = v.content;
      content.style.filter = f.join(" ");
      if (content.tagName !== "CANVAS") {
        content.style.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[cfg.fit] || "cover";
        content.style.objectPosition = `${cfg.posX}% ${cfg.posY}%`;
      }
      if (content.tagName === "VIDEO") {
        content.playbackRate = Math.max(0.25, Math.min(4, cfg.speed * calmFactor()));
        cfg.paused ? content.pause() : content.play().catch(() => {});
      }
      if (content.tagName === "IFRAME") postLook(content);
    }
  }

  // Files stored in the extension's database play inside an extension iframe (player/player.html).
  function postLook(frame) {
    if (!frame || frame.tagName !== "IFRAME" || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ __wicked: "look", look: { fit: cfg.fit, posX: cfg.posX, posY: cfg.posY, speed: cfg.speed * calmFactor(), paused: cfg.paused } }, "*");
  }

  // One wallpaper element for a source ("aurora", "media:<id>").
  function makeContent(src, view) {
    const m = src.startsWith("media:") ? cfg.media.find((x) => x.id === src.slice(6)) : null;
    let el;
    if (m && m.file && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      el = document.createElement("iframe");
      el.className = "bd-player";
      el.setAttribute("allow", "autoplay");
      el.src = chrome.runtime.getURL(`player/player.html?id=${encodeURIComponent(m.id)}&type=${m.type}`);
      el.addEventListener("load", () => postLook(el));
    } else if (m && m.src) {
      if (m.type === "video") {
        el = document.createElement("video");
        Object.assign(el, { src: m.src, loop: true, muted: true, autoplay: true, playsInline: true });
      } else {
        el = document.createElement("img");
        el.src = m.src; // GIFs animate natively
      }
    } else {
      const def = window.WickedSkins[src] || window.WickedSkins[cfg.skin] || window.WickedSkins.aurora;
      el = document.createElement("canvas");
      view.skin = def.create(el.getContext("2d"));
      view.clock = 0;
    }
    return el;
  }

  // Sides: wallpaper flows across the panels around the chart. "glass" frosts them; "clear" is see-through.
  function applySides() {
    const h = document.documentElement, mode = ["glass", "clear"].includes(cfg.sides) ? cfg.sides : "off";
    const on = cfg.enabled && mode !== "off" && cfg.layer !== "over";
    h.classList.toggle("bd-sides", on);
    h.classList.toggle("bd-sides-glass", on && mode === "glass");
    h.classList.toggle("bd-sides-clear", on && mode === "clear");
    const lm = ["glass", "clear"].includes(cfg.leftBar) ? cfg.leftBar : "off", lon = cfg.enabled && lm !== "off" && cfg.layer !== "over";
    h.classList.toggle("bd-left", lon);
    h.classList.toggle("bd-left-glass", lon && lm === "glass");
    h.classList.toggle("bd-left-clear", lon && lm === "clear");
  }

  // TradingView panels colour: override TradingView's own theme colour variables (every panel uses them), so the
  // watchlist, toolbars, menus and dialogs all take the colour. Text flips light/dark for contrast.
  const PANEL_VARS = ["--color-bg-primary", "--color-background-primary", "--color-pane-bg", "--color-widget-pages-bg", "--color-header-bg",
    "--color-body-bg", "--color-background-page-platform", "--color-legacy-bg-widget", "--color-popup-background", "--color-input-bg",
    "--color-background-dialog-simple", "--color-background-dialog-complicated", "--color-background-special-primary", "--color-screener-header-bg"];
  const PANEL_VARS2 = ["--color-background-secondary", "--color-background-tertiary", "--color-pane-secondary-bg", "--color-body-secondary-bg",
    "--color-bg-highlight", "--color-list-nth-child-bg", "--color-chart-page-bg", "--color-bg-scroll-buttons", "--color-background-primary-neutral-extra-light"];
  const PANEL_HOVER = ["--color-bg-primary-hover", "--color-toolbar-button-background-hover", "--color-popup-menu-item-hover-bg", "--color-row-hover-active-bg",
    "--color-button-hover-bg", "--color-tv-dropdown-item-hover-bg", "--color-popup-element-background-hover", "--color-background-primary-neutral-light",
    "--color-toolbar-opened-element-bg", "--color-background-primary-neutral-normal", "--color-toolbar-divider-background"];
  const PANEL_TEXT = ["--color-text-primary", "--color-default-gray", "--color-text-regular"];
  function panelColour() {
    if (cfg.panelMode === "color" && /^#[0-9a-f]{6}$/i.test(cfg.panelColor || "")) return cfg.panelColor;
    if (cfg.panelMode === "skin") { const a = skinAccent() || cfg.candleUp || "#3a4256"; const r = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
      return "#" + r.map((v, i) => Math.round([11, 13, 19][i] + (v - [11, 13, 19][i]) * 0.14).toString(16).padStart(2, "0")).join(""); }
    return "";
  }
  let panelApplied = null;
  function applyPanels() {
    const h = document.documentElement, col = cfg.enabled ? panelColour() : "";
    if (col === panelApplied) return;            // nothing changed: never restyle the page for nothing (keeps it smooth)
    panelApplied = col;
    h.classList.toggle("bd-panels", !!col && !focusAll());
    // ONE stylesheet holds every override, written in a single update (setting hundreds of properties one by one made
    // the browser restyle TradingView's whole page each time: a multi-second freeze while picking a colour).
    let st = document.getElementById("bd-panels-css");
    if (!col) { if (st) st.textContent = ""; return; }
    if (!st) { st = document.createElement("style"); st.id = "bd-panels-css"; (document.head || h).appendChild(st); }
    const rgb = [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
    const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255, dark = lum < 0.5;
    const shade = (f) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(dark ? v + (255 - v) * f : v * (1 - f)))).toString(16).padStart(2, "0")).join("");
    const text = dark ? "#e6e9f0" : "#14161c";
    const decl = [];
    PANEL_VARS.forEach((n) => decl.push(`${n}:${col}!important`));
    PANEL_VARS2.forEach((n) => decl.push(`${n}:${shade(0.05)}!important`));
    PANEL_HOVER.forEach((n) => decl.push(`${n}:${shade(0.12)}!important`));
    PANEL_TEXT.forEach((n) => decl.push(`${n}:${text}!important`));
    // TradingView's neutral text / icon colours that would vanish on this panel colour (read once per theme, cached)
    for (const [n, L] of panelTextCandidates()) {
      if (dark ? L > 0.55 : L < 0.45) continue;
      const soft = dark ? L > 0.2 : L < 0.8;
      decl.push(`${n}:${dark ? (soft ? "#a9b0bf" : "#e6e9f0") : (soft ? "#4a4f5c" : "#14161c")}!important`);
    }
    decl.push(`--bd-panel:${col}`, `--bd-panel-text:${text}`);
    st.textContent = `html.bd-panels{${decl.join(";")}}`;
  }
  // ---------- TradingView's windows & menus (Settings dialog, other dialogs, dropdown menus) ----------
  // One stylesheet: a tinted (optionally frosted) background on each window, and TradingView's own colour variables
  // re-pointed INSIDE those windows only, so every field, tab and label inside follows, and text stays readable.
  let dlgApplied = null;
  function applyDialogs() {
    const mode = cfg.enabled && ["glass", "color"].includes(cfg.dlgMode) ? cfg.dlgMode : "off";
    const base = mode === "color" && /^#[0-9a-f]{6}$/i.test(cfg.dlgColor || "") ? cfg.dlgColor
      : panelColour() || (() => { const a = skinAccent() || "#3a4256", r = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
        return "#" + r.map((v, i) => Math.round([12, 14, 20][i] + (v - [12, 14, 20][i]) * 0.12).toString(16).padStart(2, "0")).join(""); })();
    const al = Math.max(0.4, Math.min(1, +cfg.dlgAlpha || 0.78));
    const sig = mode + base + al;
    if (sig === dlgApplied) return; dlgApplied = sig;
    let st = document.getElementById("bd-dialogs-css");
    if (mode === "off") { if (st) st.textContent = ""; return; }
    if (!st) { st = document.createElement("style"); st.id = "bd-dialogs-css"; (document.head || document.documentElement).appendChild(st); }
    const rgb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16)), lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255, dark = lum < 0.5;
    const tint = (f, a) => `rgba(${rgb.map((v) => Math.max(0, Math.min(255, Math.round(dark ? v + (255 - v) * f : v * (1 - f))))).join(",")},${a})`;
    const text = dark ? "#e8ebf2" : "#14161c";
    const vars = [];
    [...PANEL_VARS, "--color-background-dialog-fullscreen"].forEach((n) => vars.push(`${n}:transparent!important`));   // the window's own backdrop does the colour
    ["--color-input-bg", "--color-popup-background"].forEach((n) => vars.push(`${n}:${tint(0.06, 0.55)}!important`));
    PANEL_VARS2.forEach((n) => vars.push(`${n}:${tint(0.05, 0.5)}!important`));
    PANEL_HOVER.forEach((n) => vars.push(`${n}:${tint(0.14, 0.7)}!important`));
    PANEL_TEXT.forEach((n) => vars.push(`${n}:${text}!important`));
    for (const [n, L] of panelTextCandidates()) { if (dark ? L > 0.55 : L < 0.45) continue; const soft = dark ? L > 0.2 : L < 0.8;
      vars.push(`${n}:${dark ? (soft ? "#a9b0bf" : "#e8ebf2") : (soft ? "#4a4f5c" : "#14161c")}!important`); }
    const S = '#overlap-manager-root [class^="dialog-"], #overlap-manager-root [class^="menuWrap-"], [data-dialog-name][class^="dialog-"]';
    const frost = mode === "glass" ? "-webkit-backdrop-filter:blur(22px) saturate(1.35)!important;backdrop-filter:blur(22px) saturate(1.35)!important;" : "";
    st.textContent = `${S}{${vars.join(";")};background:${tint(0, mode === "glass" ? al : Math.max(al, 0.9))}!important;${frost}` +
      `border:1px solid ${dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.1)"}!important;box-shadow:0 24px 60px -18px rgba(0,0,0,.75)!important;color:${text}}`;
  }
  // [name, lightness] of TradingView's neutral text colour variables, read once per theme (reading 1900 computed
  // properties is the expensive part, so it never happens while you're picking colours).
  let ptCache = null, ptTheme = "";
  function panelTextCandidates() {
    const h = document.documentElement, theme = /theme-dark/.test(h.className) ? "dark" : "light";
    if (ptCache && ptTheme === theme) return ptCache;
    const st = document.getElementById("bd-panels-css"), keep = st ? st.textContent : ""; if (st) st.textContent = "";   // read TradingView's own values
    const out = [];
    try {
      const cs = getComputedStyle(h), skip = /positive|negative|success|danger|warning|accent|heatmap|fill|border|bg|background|rating|social|twitter|inverse|white|primary-button/i;
      for (let i = 0; i < cs.length && out.length < 400; i++) {
        const n = cs[i]; if (!n.startsWith("--color-") || !/text|content|icon|default-gray|list-item-text/i.test(n) || skip.test(n)) continue;
        const m = cs.getPropertyValue(n).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) continue;
        const hx = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
        out.push([n, (parseInt(hx.slice(0, 2), 16) + parseInt(hx.slice(2, 4), 16) + parseInt(hx.slice(4, 6), 16)) / 765]);
      }
    } catch {}
    if (st) st.textContent = keep;
    ptCache = out; ptTheme = theme; return out;
  }

  // UI style: font / size / accent for TradingView's own HTML panels (watchlist, toolbars, order area, timeframes).
  const UI_FONTS = { mono: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace', rounded: '"SF Pro Rounded", "Nunito", "Varela Round", ui-rounded, system-ui, sans-serif' };
  // ---------- the ticker (TradingView's legend: symbol name · timeframe · exchange) ----------
  // Only the main symbol's line (legendMainSourceWrapper), never indicator names like Vol. One <style>, no per-frame work.
  const TK_SIZES = [14, 17, 21, 26];
  let tkApplied = "";
  function applyTicker() {
    const on = cfg.enabled && cfg.tkOn;
    const col = cfg.tkColor === "candle" ? upColor() : /^#[0-9a-f]{6}$/i.test(cfg.tkColor || "") ? cfg.tkColor : (skinAccent() || upColor());
    const px = TK_SIZES[Math.max(0, Math.min(3, +cfg.tkSize || 0))], font = UI_FONTS[cfg.tkFont] || "";
    const sig = on ? [col, px, font, !!cfg.tkGlow, !!cfg.tkOnly].join("|") : "";
    if (sig === tkApplied) return; tkApplied = sig;
    let st = document.getElementById("bd-ticker-css");
    if (!on) { if (st) st.textContent = ""; return; }
    if (!st) { st = document.createElement("style"); st.id = "bd-ticker-css"; (document.head || document.documentElement).appendChild(st); }
    const glow = cfg.tkGlow ? `text-shadow:0 0 10px ${col}99,0 0 2px ${col}cc!important;` : "";
    const ff = font ? `font-family:${font}!important;` : "";
    // the html:root + legend prefix outranks the legend readability rule in content.css, which would win otherwise
    const P = 'html:root:root:root:root [class*="legend-"] [class*="legendMainSourceWrapper-"]', M = `${P} [class*="mainTitle-"] > [class*="title-"]`,
      side = `${P} [class*="intervalTitle-"] > [class*="title-"], ${P} [class*="exchangeTitle-"] > [class*="title-"]`;
    st.textContent = `${M}{color:${col}!important;font-size:${px}px!important;line-height:1.25!important;font-weight:700!important;${ff}${glow}}` +
      (cfg.tkOnly ? `${P} [class*="intervalTitle-"], ${P} [class*="exchangeTitle-"]{display:none!important}`
        : `${side}{color:${col}!important;opacity:.78;font-size:${Math.round(px * 0.85)}px!important;line-height:1.25!important;font-weight:600!important;${ff}}`);
  }
  function applyUiStyle() {
    const h = document.documentElement;
    const font = ["mono", "rounded"].includes(cfg.uiFont) ? cfg.uiFont : "";
    const accent = /^#[0-9a-f]{6}$/i.test(cfg.uiAccent || "") ? cfg.uiAccent : "";
    const on = cfg.enabled && (font || cfg.uiSize > 0 || accent);
    h.classList.toggle("bd-ui", !!on);
    h.classList.toggle("bd-ui-font", !!font);
    h.classList.toggle("bd-ui-big", on && cfg.uiSize > 0);
    h.style.setProperty("--bd-ui-font", font ? UI_FONTS[font] : "");
    h.style.setProperty("--bd-ui-accent", accent || "");
    h.classList.toggle("bd-ui-accent", !!(on && accent));
  }

  // Pages built on Lightweight Charts (not TradingView's own charts), like nq.vision: the app around the chart has solid
  // backgrounds we can't know about, so a layer behind the whole page would be hidden. Instead the wallpaper goes INSIDE the
  // chart's own container, directly under the chart (whose background lw.js clears). Single chart + "behind" mode only.
  let embeddedHost = null, lastRebuild = 0;
  function lwHost(list = charts) {
    if (document.querySelector(".chart-markup-table")) return null;          // TradingView's own charts: not a LW page
    if (list.length !== 1) return null;
    const el = list[0].el;
    const host = el.classList.contains("tv-lightweight-charts") || (el.hasAttribute("data-bd-lwroot") && el.tagName === "TABLE") ? el.parentElement : el;
    return host && host !== document.body && host !== document.documentElement ? host : null;
  }
  function claimStack(host) {      // the chart wrapper must be positioned so it paints ABOVE the wallpaper (a positioned sibling)
    const mark = (el) => { if (el && getComputedStyle(el).position === "static") { el.style.position = "relative"; el.dataset.bdPos = "1"; } };
    mark(host); host.querySelectorAll(".tv-lightweight-charts").forEach(mark);
  }
  function releaseStack() {
    if (!embeddedHost) return;
    const undo = (el) => { if (el && el.dataset && el.dataset.bdPos) { el.style.position = ""; delete el.dataset.bdPos; } };
    undo(embeddedHost); embeddedHost.querySelectorAll("[data-bd-pos]").forEach(undo);
    embeddedHost = null;
  }

  function build() {
    teardown();
    const was = document.documentElement.classList.contains("bd-on");
    if (!was && document.body) {
      // remember the page's own background so toolbars keep theirs once body goes transparent
      const bg = getComputedStyle(document.body).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") document.documentElement.style.setProperty("--bd-page-bg", bg);
    }
    document.documentElement.classList.toggle("bd-on", cfg.enabled && !focusAll());
    applySides(); applyUiStyle(); applyPanels(); applyDialogs(); applyTicker();
    if (!cfg.enabled) document.documentElement.classList.remove("bd-over-mode");
    if (was !== cfg.enabled) repaint();
    if (!cfg.enabled) return;

    charts = chartEls(); layoutSig = sigOf(charts);
    layer = document.createElement("div");
    layer.id = "bd-layer";
    layer.dataset.bdOwner = ME.token;

    // one wallpaper across the layout, or one per chart
    const nums = tiled() ? charts.map((c, i) => firstNum + i) : [firstNum];
    views = nums.map((n) => {
      const v = { n, tile: document.createElement("div"), dim: document.createElement("div"), vg: document.createElement("div") };
      v.tile.className = "bd-tile";
      v.content = makeContent(sourceFor(n), v);
      v.dim.className = "bd-dim"; v.vg.className = "bd-vignette";
      v.tile.append(v.content, v.dim, v.vg);
      layer.appendChild(v.tile);
      return v;
    });
    reactEl = document.createElement("div");
    reactEl.className = "bd-react";
    layer.appendChild(reactEl);
    pillEl = document.createElement("div");
    pillEl.className = "bd-pill"; pillEl.hidden = true;
    pillEl.style.setProperty("--g", String(0.35 + 0.65 * (+cfg.lineGlow || 0)));
    layer.appendChild(pillEl);
    embeddedHost = cfg.layer !== "over" && !tiled() ? lwHost() : null;
    layer.classList.toggle("bd-embedded", !!embeddedHost);
    if (embeddedHost) { claimStack(embeddedHost); embeddedHost.insertBefore(layer, embeddedHost.firstChild); }
    else document.documentElement.appendChild(layer);
    placeViews();
    resetQuality(); lastMatch = "";
    if (views.some((v) => v.skin)) startLoop();
    applyLook();
    renderPnl();
  }

  // Keep every wallpaper on top of its chart as the layout changes (resize, 1 -> 4 charts, panels opening...).
  const sigOf = (list) => list.map((c) => [c.r.left, c.r.top, c.r.width, c.r.height].map(Math.round).join(",")).join("|") + "@" + innerWidth + "x" + innerHeight;
  let layoutSig = "";
  function placeViews() {
    if (!layer) return;
    views.forEach((v, i) => {
      const hr = embeddedHost && embeddedHost.isConnected ? embeddedHost.getBoundingClientRect() : null;
      const r = hr ? { left: hr.left + embeddedHost.clientLeft, top: hr.top + embeddedHost.clientTop, width: embeddedHost.clientWidth, height: embeddedHost.clientHeight }
        : tiled() && charts[i] ? charts[i].r : { left: 0, top: 0, width: innerWidth, height: innerHeight };
      Object.assign(v, { x: r.left, y: r.top, w: r.width, h: r.height });          // v.x/y stay in viewport coordinates (used for measuring + capture)
      Object.assign(v.tile.style, hr ? { left: "0px", top: "0px", width: r.width + "px", height: r.height + "px" }
        : { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      sizeCanvas(v);
    });
    clipToChart();
    placeWatermark();
    placePnl();
    placeGoal();
    placeTimer();
  }
  function trackLayout() {
    if (!layer || standDown || document.querySelector(".chart-container[data-bd-repaint]")) return;   // mid-redraw: charts hidden for 2 frames
    if (!layer.isConnected || (embeddedHost && !embeddedHost.isConnected)) {          // the app re-drew its page and took our layer with it
      if (Date.now() - lastRebuild > 3000) { lastRebuild = Date.now(); charts = chartEls(); build(); }
      return;
    }
    const next = chartEls(), sig = sigOf(next);
    // a Lightweight chart appeared (or was replaced) after we built: move the wallpaper into it
    if (cfg.layer !== "over" && !(cfg.multi !== "span" && next.length > 1)) {
      const want = lwHost(next);
      if (want && want !== embeddedHost && Date.now() - lastRebuild > 1500) { lastRebuild = Date.now(); charts = next; build(); return; }
    }
    if (sig === layoutSig) return;
    const before = charts.length, wasTiled = tiled();
    charts = next; layoutSig = sig;
    // number of tiles changed (chart added/removed, or 1 <-> many): rebuild; otherwise just move them
    if (before !== charts.length) setTimeout(announceFrame, 0);
    if (wasTiled !== tiled() || (tiled() && before !== charts.length)) build();
    else { placeViews(); updateReact(0); }
    setTimeout(measureBackdrop, 200);
  }
  setInterval(trackLayout, 600);
  addEventListener("resize", () => setTimeout(trackLayout, 50));

  function sizeCanvas(v) {
    if (!v.skin) return;
    // Auto quality steps the resolution down when the computer struggles (res 1 = full, 0 = lowest).
    const base = cfg.powerSaver ? 0.5 : 0.75;
    const scale = Math.max(0.35, base * qlv().res);
    const w = Math.max(2, (v.w * scale) | 0), h = Math.max(2, (v.h * scale) | 0);
    if (v.content.width !== w || v.content.height !== h) {
      v.content.width = w; v.content.height = h; v.skin.resize(w, h);
      // Resizing wipes the canvas. Draw straight away so there is never a blank flash, and a paused wallpaper doesn't stay empty.
      try { v.skin.frame(v.clock || 0, 0); } catch {}
    }
  }

  // ---------- frame rate + auto quality ----------
  // Smooth = 60 fps. Max = your screen's own refresh rate (120 / 144 / 240 Hz...), measured from the browser's frame
  // timing. Auto quality watches how often the browser really manages to draw a frame; if that drops (the computer is
  // struggling) it steps down (lower fps, then lower resolution), and once it has been healthy for a while it tries
  // stepping back up. Quick repeat failures make it wait longer before trying again, so it never flaps.
  let refreshHz = 60;
  const HZ = [30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 180, 240, 360];
  function measureRefresh() {
    const gaps = []; let last = 0;
    const step = (now) => {
      if (document.hidden) { last = 0; return requestAnimationFrame(step); }   // wait until the tab is visible
      if (last) gaps.push(now - last); last = now;
      if (gaps.length < 70) return requestAnimationFrame(step);
      gaps.sort((x, y) => x - y);
      const fast = gaps[Math.floor(gaps.length * 0.25)] || 16.7, hz = 1000 / Math.max(2.5, fast);   // fast frames = what the display can do
      refreshHz = HZ.reduce((best, c) => (Math.abs(c - hz) < Math.abs(best - hz) ? c : best), 60);
      document.documentElement.setAttribute("data-bd-hz", String(refreshHz));
    };
    requestAnimationFrame(step);
  }
  const QL_SMOOTH = [{ res: 1, fps: 60 }, { res: 1, fps: 40 }, { res: 0.8, fps: 30 }, { res: 0.6, fps: 20 }];
  function qlevels() {
    if (cfg.fps !== "max") return QL_SMOOTH;
    const all = [{ res: 1, fps: refreshHz }, { res: 1, fps: 60 }, { res: 0.85, fps: 40 }, { res: 0.7, fps: 30 }, { res: 0.6, fps: 20 }];
    return all.filter((l, i) => i === 0 || l.fps < all[i - 1].fps);
  }
  const qlv = () => { const L = qlevels(); return L[Math.min(qLevel, L.length - 1)]; };
  let qLevel = 0, hAcc = 0, hCount = 0, hStart = 0, hLast = 0, smoothFor = 0, needSmooth = 4, lastUp = 0;
  function resetQuality() { qLevel = 0; hAcc = hCount = hStart = hLast = smoothFor = 0; needSmooth = 4; lastUp = 0; }
  const publishQ = () => document.documentElement.setAttribute("data-bd-q", `${qLevel + 1}/${qlevels().length}@${refreshHz}`);

  // While one of TradingView's big windows is open (Trade / broker login, Settings, Indicators, Alerts…) the wallpaper
  // holds still: TradingView blurs everything behind those windows, and re-blurring a moving wallpaper every frame
  // is what made them feel slow to open. Only fires when TradingView adds/removes a window, so it costs nothing.
  let dlgOpen = false, dlgObs = null, dlgT = 0;
  function checkDialogs() {
    dlgT = 0;
    const root = document.getElementById("overlap-manager-root");
    const open = !!root && [...root.querySelectorAll('[class^="dialog-"], [data-dialog-name]')].some((el) => {
      const r = el.getBoundingClientRect(); return r.width >= 300 && r.height >= 200; });
    if (open !== dlgOpen) { dlgOpen = open; document.documentElement.toggleAttribute("data-bd-dlg", open); }
  }
  function watchDialogs() {
    const root = document.getElementById("overlap-manager-root");
    if (!root || dlgObs) return;
    dlgObs = new MutationObserver(() => { if (!dlgT) dlgT = setTimeout(checkDialogs, 120); });
    dlgObs.observe(root, { childList: true, subtree: true });
    checkDialogs();
  }

  // One animation loop drives every animated wallpaper on the page.
  let fpsN = 0, fpsT = 0;
  function startLoop() {
    running = true;
    watchDialogs(); if (!dlgObs) setTimeout(watchDialogs, 3000);
    let last = performance.now();
    measureRefresh();
    const step = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (document.hidden || cfg.paused || (cfg.focus && cfg.enabled) || dlgOpen) { last = now; hLast = 0; return; }
      const watch = cfg.autoQuality && !cfg.powerSaver && (cfg.fps === "auto" || cfg.fps === "max");
      if (watch) trackHealth(now);
      // Target fps: user setting, power saver, or the current auto-quality cap (whichever is lowest).
      let target = cfg.powerSaver ? 15 : cfg.fps === "auto" ? 60 : cfg.fps === "max" ? refreshHz : +cfg.fps;
      if (watch) target = Math.min(target, qlv().fps);
      const gap = now - last;
      if (gap < 1000 / target - 2) return;
      const dt = Math.min(0.1, gap / 1000) * cfg.speed * calmFactor() * (1 + Math.abs(mood) * cfg.reactStrength * 1.5);
      last = now;
      for (const v of views) if (v.skin) { v.clock += dt; v.skin.frame(v.clock, dt); }
      fpsN++; if (now - fpsT >= 1000) { window.__bdFpsNow = Math.round((fpsN * 1000) / (now - fpsT)); fpsN = 0; fpsT = now; }
    };
    raf = requestAnimationFrame(step);
  }
  // Health = how often the browser actually delivers a frame (measured on every frame, whatever our own cap is).
  function trackHealth(now) {
    if (hLast) { const g = now - hLast; if (g < 250) { hAcc += g; hCount++; } }
    hLast = now;
    if (!hStart) { hStart = now; return; }
    if (now - hStart < 2000 || hCount < 10) return;
    const health = 1000 / (hAcc / hCount), L = qlevels();
    hStart = now; hAcc = hCount = 0;
    if (health < refreshHz * 0.8 && qLevel < L.length - 1) {
      qLevel++; smoothFor = 0; if (now - lastUp < 25000) needSmooth = Math.min(32, needSmooth * 2);   // failed soon after climbing: wait longer next time
      views.forEach(sizeCanvas); publishQ();
    } else if (health > refreshHz * 0.92 && qLevel > 0) {
      if (++smoothFor >= needSmooth) { qLevel--; smoothFor = 0; lastUp = now; views.forEach(sizeCanvas); publishQ(); }
    } else if (health <= refreshHz * 0.92) smoothFor = 0;
  }

  function teardown() {
    releaseStack();
    running = false;
    cancelAnimationFrame(raf);
    if (layer) {
      layer.remove();
      layer = reactEl = pillEl = null;
    }
    if (pnlEl) { pnlEl.remove(); pnlEl = null; pnlLastV = null;
    }
    views = [];
  }

  // "Show chart numbers": big 1, 2, 3... on each chart for a moment, so you know which is which.
  function showNumbers(highlight) {
    if (!IN_FRAME) for (const f of frameRects()) try { f.w.postMessage({ __wicked: "show-numbers", n: highlight }, "*"); } catch {}
    const rects = (charts.length ? charts : chartEls()).map((c) => c.r);
    document.querySelectorAll(".bd-num").forEach((el) => el.remove());
    rects.forEach((r, i) => {
      const el = document.createElement("div"), n = firstNum + i;
      el.className = "bd-num" + (highlight && highlight === n ? " bd-num-on" : "");
      el.textContent = String(n);
      Object.assign(el.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      document.documentElement.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    });
  }
  if (!IN_FRAME && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
      if (!msg || typeof msg.ws !== "string") return;
      if (msg.ws === "layout") reply({ count: chartCount() });
      if (msg.ws === "numbers") { showNumbers(+msg.n || 0); reply({ count: chartCount() }); }
      if (msg.ws === "symbol") { const q = parseTitle(); reply({ symbol: q ? q.sym : "" }); }
      if (msg.ws === "snapshot") {
        if (!owner || standDown) return;   // only the owning frame/instance answers
        captureSnapshot().then(async (r) => {
          if (r.ok) { const url = await blobToDataURL(r.blob); reply({ ok: true, url, mediaMissed: r.mediaMissed, w: r.w, h: r.h }); }
          else reply({ ok: false, reason: r.reason });
        }).catch((e) => reply({ ok: false, reason: String(e && e.message || e) }));
        return true;   // async reply
      }
      if (msg.ws === "clip") {
        if (!owner || standDown) return;
        if (msg.mode === "screen") { reply(startScreenFlow(+msg.seconds || 5, +msg.fps || 30)); return; }   // the user finishes this on the page
        if (wantSys()) { reply(startSoundFlow(+msg.seconds || 5, +msg.fps || 30)); return; }                  // picks the sound on the page first
        captureClip(+msg.seconds || 5, +msg.fps || 30).then((r) => reply(r)).catch((e) => reply({ ok: false, reason: String(e && e.message || e) }));
        return true;   // async reply (takes a few seconds while recording)
      }
    });
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
    // no forced rebuild here: hook.js sees the new attribute, redraws instantly, and rebuilds once only if the colours changed
  }

  // Line glow + price scale styling, also drawn by hook.js
  const FX_KEYS = ["lineGlow", "scaleText", "scaleGlow", "scaleBold", "scaleBg", "scaleBgColor", "scaleLabels", "scaleSize", "scaleFont",
    "bracketOn", "bracketSize", "bracketBack", "bracketFill", "bracketText", "bracketProfit", "bracketLoss",
    "bracketBorderColor", "bracketBorderW", "bracketLineColor", "bracketLineW", "bracketDebug", "privacy", "privacyPnl", "bracketQty",
    "gridOn", "gridColor", "gridAlpha", "gridW", "gridStyle", "chOn", "chColor", "chW", "chStyle", "chGlow", "chLabels", "plOn", "plColor", "plW", "plStyle", "sbOn", "sbColor", "sbW", "sbStyle", "axOn", "axColor", "axW", "axStyle"];
  // ---------- auto contrast: how bright / busy is the wallpaper behind the chart? ----------
  let backdrop = { bg: null, busy: false, prof: [], profs: [] };
  const GW = 32, GH = 18;                      // brightness grid of each wallpaper
  const sampler = document.createElement("canvas"); sampler.width = GW; sampler.height = GH;
  const sctx = sampler.getContext("2d", { willReadFrequently: true });
  function gridOf(source) {
    try {
      sctx.clearRect(0, 0, GW, GH); sctx.drawImage(source, 0, 0, GW, GH);
      const d = sctx.getImageData(0, 0, GW, GH).data, grid = new Array(GW * GH); let sum = 0, sq = 0;
      for (let i = 0; i < d.length; i += 4) {
        const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 * (d[i + 3] / 255);
        grid[i / 4] = l; sum += l; sq += l * l;
      }
      const n = GW * GH, mean = sum / n;
      return { mean, std: Math.sqrt(Math.max(0, sq / n - mean * mean)), grid, palette: paletteFromData(d) };
    } catch { return null; }                    // cross-origin media: the player iframe reports instead
  }

  // ---------- Auto-match: derive a colour palette from the wallpaper ----------
  // Pick the wallpaper's most-present vivid hue as the accent, then an up/down pair that stays readable and
  // clearly different from each other. Returns { up, down, accent } as #hex, or null if the art is too grey.
  function paletteFromData(d) {
    const bins = new Array(24).fill(null).map(() => ({ n: 0, r: 0, g: 0, b: 0, sat: 0 }));
    let colourful = 0, total = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255; if (a < 0.4) continue;
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      total++;
      if (sat < 0.18 || l < 0.08 || l > 0.95) continue;        // skip greys / near-black / near-white
      colourful++;
      let hue = 0;
      if (mx !== mn) { const dd = mx - mn;
        hue = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; hue *= 60; }
      const bi = Math.floor(hue / 15) % 24, wt = sat * (0.4 + 0.6 * (1 - Math.abs(l - 0.5) * 2));
      const bn = bins[bi]; bn.n += wt; bn.r += r * wt; bn.g += g * wt; bn.b += b * wt; bn.sat += sat * wt;
    }
    if (colourful < total * 0.04) return null;                 // mostly grey wallpaper: nothing to match
    const avg = (bi) => { const bn = bins[bi]; return bn.n > 0 ? [bn.r / bn.n, bn.g / bn.n, bn.b / bn.n] : null; };
    const ranked = bins.map((b, i) => ({ i, n: b.n })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    if (!ranked.length) return null;
    const top = ranked[0].i, accent = punch(avg(top));
    // Second colour = the strongest hue cluster that's clearly different from the first (>= ~90° away on the wheel).
    const far = (a, b) => { const d = Math.abs(a - b) * 15; return Math.min(d, 360 - d) >= 90; };
    let second = ranked.find((x) => far(x.i, top));
    const c1 = avg(top), c2 = second ? avg(second.i) : null;
    // Two distinct wallpaper colours → use both (greener one becomes "up"). One dominant colour → derive a
    // complementary pair around it so up/down stay clearly different and readable.
    let upRgb, downRgb;
    if (c2) {
      const greener = (c) => c[1] - (c[0] + c[2]) / 2;          // how green-leaning
      [upRgb, downRgb] = greener(c1) >= greener(c2) ? [c1, c2] : [c2, c1];
      upRgb = punch(upRgb); downRgb = punch(downRgb);
    } else {
      const accHue = top * 15;
      upRgb = punch(hslRgb(nearestNice(accHue, true)));
      downRgb = punch(hslRgb(nearestNice((accHue + 150) % 360, false)));
    }
    return { up: hex(upRgb), down: hex(downRgb), accent: hex(accent) };
  }
  const clampc = (v) => Math.max(0, Math.min(255, Math.round(v)));
  // rgb channels are 0..1 floats
  const hex = (rgb) => "#" + rgb.map((v) => clampc(v * 255).toString(16).padStart(2, "0")).join("");
  // boost saturation + set a readable lightness so candles pop on any art
  function punch(rgb) {
    if (!rgb) return [0, 0.88, 0.64];
    let [r, g, b] = rgb; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; }
    s = Math.min(1, s * 1.5 + 0.35); l = Math.min(0.72, Math.max(0.5, l));
    return hslRgb([h * 360, s, l]);
  }
  // pick an "up" (green-leaning) or "down" (warm-leaning) hue near the accent but in a readable zone
  function nearestNice(hue, up) {
    const s = 0.85, l = 0.6;
    if (up) { const h = hue > 60 && hue < 200 ? hue : 150; return [h, s, l]; }
    const h = hue > 300 || hue < 60 ? hue : 340; return [h, s, l];
  }
  function hslRgb(hsl) {
    let [h, s, l] = hsl; h = ((h % 360) + 360) % 360 / 360;
    const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0), f(8), f(4)];
  }
  // Brightness behind one chart's price scale (its right-hand ~64px), top to bottom in 18 steps.
  function scaleProfile(v, r) {
    const g = v.lum.grid;
    if (!g || g.length !== GW * GH) return v.lum.prof || [];
    const col = (x) => Math.max(0, Math.min(GW - 1, Math.floor(((x - v.x) / v.w) * GW)));
    const row = (y) => Math.max(0, Math.min(GH - 1, Math.floor(((y - v.y) / v.h) * GH)));
    const c0 = col(r.right - 64), c1 = Math.max(c0, col(r.right - 1)), out = [];
    for (let k = 0; k < GH; k++) {
      const y = row(r.top + ((k + 0.5) / GH) * r.height); let s = 0;
      for (let c = c0; c <= c1; c++) s += g[y * GW + c];
      out.push(s / (c1 - c0 + 1));
    }
    return out;
  }
  // When Auto-match is on and a custom wallpaper is showing, set candle colours + scale tint from its palette.
  let lastMatch = "";
  function applyAutoMatch() {
    if (!cfg.autoMatch) { lastMatch = ""; return; }
    const v = views[0];                                            // the main chart's wallpaper
    const src = v && (cfg.multi === "mix" ? sourceFor(v.n) : mainSource());
    const isMedia = typeof src === "string" && src.startsWith("media:");
    const pal = v && v.lum && v.lum.palette;
    if (!isMedia || !pal) return;                                  // only match your own uploads, only when we have colours
    const sig = pal.up + pal.down;
    if (sig === lastMatch) return;                                 // colours haven't meaningfully changed
    lastMatch = sig;
    const next = { candleOn: true, candleUp: pal.up, candleDown: pal.down, candlePreset: "custom",
      lineGlow: Math.max(cfg.lineGlow, 0.25), scaleText: pal.accent, scaleGlow: Math.max(cfg.scaleGlow, 0.25) };
    cfg = { ...cfg, ...next };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) chrome.storage.local.set(next);
    pushCandles(); pushFx();
  }

  // The skin's own colour (for "Skin colour" in chart styling and the panel tint): the wallpaper's strongest hue.
  // Kept STABLE: an animated wallpaper's measured colour drifts a little every reading; we only move to a new
  // accent when the hue really changes (or it appears/disappears), so nothing restyles or repaints for no reason.
  let lastAccent = "";
  function rawAccent() { const v = views[0], p = v && v.lum && v.lum.palette; return (p && p.accent) || ""; }
  function hueOfHex(x) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx === mn) return 0; const d = mx - mn; let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; }
  function skinAccent() { return lastAccent; }
  let accentFor = "";
  function updateBackdrop() {
    // the skin colour is taken ONCE per wallpaper (animated wallpapers shift colour all the time; following that
    // re-coloured lines and panels again and again)
    const srcSig = String(cfg.skin) + "|" + String(cfg.mediaId || "");
    if (srcSig !== accentFor && rawAccent()) { accentFor = srcSig; lastAccent = rawAccent(); pushFx(); applyPanels(); applyDialogs(); applyTicker(); }
    const lit = views.filter((v) => v.lum);
    if (!lit.length) return;
    applyAutoMatch();
    const mean = lit.reduce((a, v) => a + v.lum.mean, 0) / lit.length, std = lit.reduce((a, v) => a + v.lum.std, 0) / lit.length;
    const rects = charts.length ? charts.map((c) => c.r) : [chartsBox()];
    const profs = rects.map((r, i) => {
      const v = tiled() ? views[i] : views[0];
      return v && v.lum ? { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), p: scaleProfile(v, r) } : null;
    }).filter(Boolean);
    setBackdrop({ mean, std, profs });
  }
  function setBackdrop(st) {
    const vis = (cfg.layer === "over" ? cfg.overOpacity : cfg.opacity) * (1 - cfg.dim);   // what actually reaches your eyes
    const mean = st.mean * vis, std = st.std * vis;
    // hysteresis so a moving video near the threshold doesn't flip the text back and forth
    const bg = backdrop.bg === "light" ? (mean < 0.37 ? "dark" : "light") : (mean > 0.47 ? "light" : "dark");
    const busy = backdrop.busy ? std > 0.12 : std > 0.17;
    const profs = st.profs.map((q) => ({ ...q, p: q.p.map((v) => Math.round(v * vis * 100) / 100) }));
    const h = document.documentElement;
    h.classList.toggle("bd-bg-dark", bg === "dark"); h.classList.toggle("bd-bg-light", bg === "light");
    const old = backdrop.profs || [];
    const profMoved = profs.length !== old.length || profs.some((q, i) => q.l !== old[i].l || q.t !== old[i].t || q.r !== old[i].r || q.b !== old[i].b ||
      q.p.length !== old[i].p.length || q.p.some((v, j) => Math.abs(v - old[i].p[j]) > 0.08));
    if (bg !== backdrop.bg || busy !== backdrop.busy || profMoved) { backdrop = { bg, busy, profs, prof: profs[0] ? profs[0].p : [] }; pushFx(); }
  }
  // Reading pixels straight off a GPU canvas stalls the page until the graphics card catches up (a hitch you can
  // feel on some PCs). createImageBitmap shrinks the frame to 32x18 off the main thread first, then we read that.
  let measuring = false;
  async function measureBackdrop() {
    if (!layer || !views.length || !cfg.enabled || document.hidden || measuring) return;
    measuring = true;
    try {
      for (const v of views) {
        if (v.content.tagName === "IFRAME") continue;                        // players post { __wicked: "lum" }
        let src = v.content;
        if (typeof createImageBitmap === "function" && v.content.width > GW) {
          try { src = await createImageBitmap(v.content, { resizeWidth: GW, resizeHeight: GH, resizeQuality: "low" }); } catch { src = v.content; }
        }
        const g = gridOf(src); if (g) v.lum = g;
        if (src !== v.content && src.close) src.close();
      }
      updateBackdrop();
    } finally { measuring = false; }
  }
  setInterval(measureBackdrop, 3000);
  addEventListener("message", (e) => {
    if (!e.data || e.data.__wicked !== "lum") return;
    const v = views.find((x) => x.content.tagName === "IFRAME" && e.source === x.content.contentWindow);
    if (!v) return;
    const grid = Array.isArray(e.data.grid) && e.data.grid.length === GW * GH ? e.data.grid.map(Number) : null;
    const palette = Array.isArray(e.data.rgb) && e.data.rgb.length === GW * GH * 4 ? paletteFromData(e.data.rgb) : null;
    v.lum = { mean: +e.data.mean || 0, std: +e.data.std || 0, grid, palette, prof: Array.isArray(e.data.prof) ? e.data.prof.slice(0, 18).map(Number) : [] };
    updateBackdrop();
  });

  // Tick size of the futures contract on the chart, so Streamer mode can show TradingView's "+8 ticks" as "+2 pts".
  // Read from the symbol in the tab title (NQ1!, MNQZ2025, CME_MINI:ES1!…); 0 = unknown (ticks are kept as ticks).
  const TICKS = { NQ: 0.25, MNQ: 0.25, ES: 0.25, MES: 0.25, YM: 1, MYM: 1, RTY: 0.1, M2K: 0.1, EMD: 0.1, NKD: 5,
    CL: 0.01, MCL: 0.01, QM: 0.025, NG: 0.001, QG: 0.005, RB: 0.0001, HO: 0.0001, GC: 0.1, MGC: 0.1, SI: 0.005, SIL: 0.005, HG: 0.0005, MHG: 0.0005, PL: 0.1, PA: 0.5,
    ZB: 0.03125, UB: 0.03125, ZN: 0.015625, ZF: 0.0078125, ZT: 0.00390625, ZC: 0.25, ZS: 0.25, ZW: 0.25, ZL: 0.01, ZM: 0.1, LE: 0.025, HE: 0.025,
    "6E": 0.00005, M6E: 0.0001, "6B": 0.0001, "6J": 0.0000005, "6A": 0.00005, "6C": 0.00005, "6S": 0.00005, BTC: 5, MBT: 5, ETH: 0.5, MET: 0.5, FDAX: 0.5, FESX: 1 };
  let tickPushed = 0;
  setInterval(() => { if (cfg.enabled && cfg.privacy && cfg.privacyPnl === "points" && !standDown && tickSizeOf() !== tickPushed) pushFx(); }, 3000);   // you switched symbol
  function tickSizeOf() {
    const q = parseTitle(); if (!q || !q.sym) return 0;
    const root = String(q.sym).toUpperCase().replace(/^.*:/, "").replace(/\d+!$/, "").replace(/[FGHJKMNQUVXZ]\d{1,4}$/, "");
    return TICKS[root] || 0;
  }
  function pushFx() {
    const h = document.documentElement;
    if (cfg.enabled) h.setAttribute("data-ws-fx", JSON.stringify({ ...Object.fromEntries(FX_KEYS.map((k) => [k, cfg[k]])), tickSize: (tickPushed = tickSizeOf()), bg: backdrop.bg, busy: backdrop.busy, prof: backdrop.prof || [], profs: backdrop.profs || [], accent: skinAccent() }));
    else h.removeAttribute("data-ws-fx");
    if (pillEl) pillEl.style.setProperty("--g", String(0.35 + 0.65 * (+cfg.lineGlow || 0)));
    // Scale backing = real frosted glass behind the price + time scales
    const mode = cfg.scaleBg === "default" ? "glass" : cfg.scaleBg;
    const glass = cfg.enabled && cfg.layer !== "over" && (mode === "glass" || mode === "color" || (mode === "auto" && backdrop.busy));
    h.classList.toggle("bd-scale-glass", glass);
    let tint = backdrop.bg === "light" && !cfg.scaleText ? "rgba(255,255,255,0.42)" : "rgba(8,11,18,0.42)";
    if (mode === "color" && /^#[0-9a-f]{6}$/i.test(cfg.scaleBgColor || "")) {
      const n = parseInt(cfg.scaleBgColor.slice(1), 16); tint = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0.72)`;
    }
    h.style.setProperty("--bd-scale-tint", tint);
  }

  // Keys that need a rebuild vs. ones we can apply live.
  const REBUILD = new Set(["enabled", "skin", "mediaId", "powerSaver", "sessionOn", "sessionSkins", "multi", "chartSkins", "symbolOn", "symbolSkins", "autoQuality"]);
  // ---------- watermark ----------
  // Sits ON TOP of the chart (so it shows in screenshots/streams) but never takes clicks.
  // Kept clear of the price axis (right) and time axis (bottom).
  let wmEl, wmRO;
  // Brand shown in the watermark. Renaming the product: change BRAND_NAME and the logo below.
  const BRAND_NAME = "Priism Skins";
  const BRAND_LOGO = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="5" y1="28" x2="27" y2="4"><stop offset="0" stop-color="#19d3ff"/><stop offset=".5" stop-color="#2ef2b0"/><stop offset="1" stop-color="#c6ff3d"/></linearGradient></defs><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#0b141b"/><g fill="url(#g)"><rect x="5" y="17" width="6" height="9" rx="1.5"/><rect x="13" y="11" width="6" height="12" rx="1.5"/><rect x="21" y="5" width="6" height="15" rx="1.5"/><rect x="7.25" y="15" width="1.5" height="13" rx=".75"/><rect x="15.25" y="8" width="1.5" height="17" rx=".75"/><rect x="23.25" y="3" width="1.5" height="19" rx=".75"/></g></svg>');
  // The label: your handle if you set one, otherwise the brand name.
  const wmLabel = () => (cfg.wmText && cfg.wmText.trim() ? cfg.wmText.trim().slice(0, 40) : BRAND_NAME);

  function placeWatermark() {
    if (!wmEl || cfg.wmStyle === "tiled") return;                     // tiled covers the whole chart; nothing to place
    const r = chartsBox();                                            // all charts of a multi-chart layout
    const pad = 16, axisR = 72, axisB = 30, st = wmEl.style;
    st.left = st.right = st.top = st.bottom = st.transform = "";
    const p = cfg.wmPos;
    if (p === "center") { st.left = r.left + (r.width - axisR) / 2 + "px"; st.top = r.top + (r.height - axisB) / 2 + "px"; st.transform = "translate(-50%,-50%)"; return; }
    // "Drift" slowly moves the mark along its edge so it's hard to crop or paint out in a repost.
    let dx = 0;
    if (cfg.wmDrift) { const t = Date.now() / 1000; dx = Math.round(Math.sin(t / 7) * Math.max(0, (r.width - axisR) / 2 - 120)); }
    if (p[0] === "t") st.top = r.top + pad + 34 + "px";              // below TradingView's legend row
    else st.top = r.bottom - axisB - pad - wmEl.offsetHeight + "px";
    const cx = r.left + (r.width - axisR) / 2 - wmEl.offsetWidth / 2 + dx;
    if (cfg.wmDrift) st.left = Math.max(r.left + pad, Math.min(r.right - axisR - pad - wmEl.offsetWidth, cx)) + "px";
    else if (p[1] === "l") st.left = r.left + pad + "px";
    else st.left = r.right - axisR - pad - wmEl.offsetWidth + "px";
  }

  // Tiled: a faint diagonal "logo · label" repeated across the chart. Painted once to a canvas and tiled as a
  // background, so it reads as deliberate branding and is very hard to crop or inpaint out of a repost.
  function tilePattern() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = 300, H = 170;
    const c = document.createElement("canvas"); c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.translate(W / 2, H / 2); g.rotate(-Math.PI / 9); g.translate(-W / 2, -H / 2);
    g.font = '700 15px system-ui, -apple-system, "Segoe UI", sans-serif';
    g.textBaseline = "middle"; g.fillStyle = "rgba(255,255,255,0.9)";
    const label = wmLabel();
    g.fillText("◆ " + label, 16, H / 2);                              // ◆ stands in for the logo at small size
    return c.toDataURL("image/png");
  }

  function renderWatermark() {
    const show = cfg.enabled && cfg.wmOn;
    if (!show) { if (wmEl) { wmEl.remove(); wmEl = null; } return; }
    if (!wmEl) {
      wmEl = document.createElement("div");
      wmEl.id = "bd-wm";
      wmEl.dataset.bdOwner = ME.token;
      document.documentElement.appendChild(wmEl);
      const el = document.querySelector(".chart-container");
      if (!wmRO && el) { wmRO = new ResizeObserver(placeWatermark); wmRO.observe(el); addEventListener("resize", placeWatermark); }
    }
    const tiled = cfg.wmStyle === "tiled";
    wmEl.classList.toggle("bd-wm-tiled", tiled);
    wmEl.classList.toggle("bd-wm-center", !tiled && cfg.wmPos === "center");
    wmEl.style.opacity = String(Math.max(0.1, Math.min(1, +cfg.wmOpacity || 0.85)) * (tiled ? 0.22 : 1));
    if (tiled) {
      const r = chartsBox();
      Object.assign(wmEl.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", backgroundImage: `url(${tilePattern()})` });
      wmEl.innerHTML = "";
    } else {
      wmEl.style.backgroundImage = "";
      wmEl.innerHTML = `<img alt="" src="${BRAND_LOGO}"><span></span>`;
      wmEl.querySelector("span").textContent = wmLabel();
      wmEl.querySelector("img").onload = placeWatermark;
    }
    requestAnimationFrame(placeWatermark);
    scheduleDrift();
  }
  // Keep the corner mark drifting smoothly while "Drift" is on.
  let driftRaf = 0;
  function scheduleDrift() {
    cancelAnimationFrame(driftRaf);
    if (!(wmEl && cfg.wmOn && cfg.wmDrift && cfg.wmStyle !== "tiled" && cfg.wmPos !== "center")) return;
    const loop = () => { if (!wmEl) return; placeWatermark(); driftRaf = requestAnimationFrame(loop); };
    driftRaf = requestAnimationFrame(loop);
  }


  function apply(keys) {
    if (standDown || (EXT && !owner)) return;
    if (keys.some((k) => k === "focus" || k === "focusHides" || k === "enabled")) applyFocus();
    if (keys.some((k) => k.startsWith("timer") || k === "enabled" || k === "candleUp")) renderTimer();
    if (keys.some((k) => k.startsWith("privacy") || k === "enabled")) { applyPrivacy(); try { renderGoal(); } catch {} }
    if (keys.some((k) => k.startsWith("tradeClip") || k === "enabled") && !(cfg.enabled && cfg.tradeClipOn)) tcStop();
    const candleKeys = keys.filter((k) => k.startsWith("candle"));
    if (candleKeys.length || keys.includes("enabled")) pushCandles();
    if (keys.some((k) => k.startsWith("wm")) || keys.includes("enabled")) renderWatermark();
    if (keys.some((k) => k === "panelMode" || k === "panelColor" || k === "candleUp")) applyPanels();
    if (keys.some((k) => k.startsWith("tk") || k === "candleUp" || k === "enabled")) applyTicker();
    if (keys.some((k) => k.startsWith("dlg") || k === "panelMode" || k === "panelColor")) applyDialogs();
    if (keys.includes("sides") || keys.includes("leftBar") || keys.includes("enabled") || keys.includes("layer")) applySides();
    if (keys.some((k) => k.startsWith("ui")) || keys.includes("enabled")) applyUiStyle();
    if (keys.some((k) => FX_KEYS.includes(k)) || keys.includes("enabled") || keys.includes("layer")) pushFx();
    if (keys.includes("fps")) { resetQuality(); views.forEach(sizeCanvas); publishQ(); }
    if (keys.includes("autoMatch")) { lastMatch = ""; setTimeout(measureBackdrop, 50); }   // re-derive the palette now
    if (keys.some((k) => k.startsWith("pnl")) || keys.includes("enabled")) renderPnl();
    if (keys.some((k) => k.startsWith("goal") || k === "journalOn") || keys.includes("enabled")) { if (!cfg.journalOn) jShot = null; renderGoal(); tickTrades(); }
    keys = keys.filter((k) => !k.startsWith("candle") && !k.startsWith("wm") && !k.startsWith("ui") && !k.startsWith("pnl") && !k.startsWith("goal") && !k.startsWith("panel") && !k.startsWith("dlg") && !k.startsWith("timer") && !k.startsWith("privacy") && !k.startsWith("tradeClip") && !k.startsWith("tk") && !/Key$/.test(k) && !["focus", "focusHides", "clipLen", "clipMode", "clipFps", "clipQuality", "clipEdit", "clipAudio", "sessionSound"].includes(k) && k !== "journalOn" && !FX_KEYS.includes(k));
    if (!keys.length) return;
    const needsRebuild = keys.some((k) => REBUILD.has(k)) ||
      (keys.includes("media") && (cfg.skin === "media" || cfg.multi === "mix"));
    needsRebuild ? build() : applyLook();
  }

  // ---------- Snapshot: a shareable PNG of the chart with the skin + watermark baked in ----------
  // Composites, at device resolution, onto one canvas: the wallpaper (dimmed, as on screen) + TradingView's own
  // chart canvases + the watermark. Built-in animated skins draw from their own readable canvas; an uploaded
  // image/video wallpaper lives in a sandboxed player frame whose pixels we can't read, so for those the snapshot
  // keeps the chart + watermark and notes the wallpaper couldn't be included. Nothing is uploaded anywhere.
  function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  // Draw ONE composed frame into g, cropped to box, at scale dpr. It re-draws what the page shows, in the same
  // order: page colour, wallpaper (with blur / saturation / hue / B&W, fit mode, opacity), dim, vignette, mood glow,
  // TradingView's own chart canvases (candles, glow, brackets...), then our overlays (P&L readout, goal bar, mood
  // pill, watermark at its real position, so Drift is captured too). wmImg = preloaded watermark image so this stays
  // synchronous for the clip loop. Returns { mediaMissed }: an uploaded image/video wallpaper lives in a sandboxed
  // player frame whose pixels we can't read. (Recording the whole screen captures that too.)
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  function drawFit(g, el, dx, dy, dw, dh) {
    const nw = el.videoWidth || el.naturalWidth || el.width, nh = el.videoHeight || el.naturalHeight || el.height;
    if (!nw || !nh || cfg.fit === "stretch" || el.tagName === "CANVAS") return g.drawImage(el, dx, dy, dw, dh);
    const k = cfg.fit === "fit" ? Math.min(dw / nw, dh / nh) : Math.max(dw / nw, dh / nh), w = nw * k, h = nh * k;
    g.drawImage(el, dx + (dw - w) * (Math.max(0, Math.min(100, +cfg.posX)) / 100), dy + (dh - h) * (Math.max(0, Math.min(100, +cfg.posY)) / 100), w, h);
  }
  function wallFilter(dpr) {
    const f = [];
    if (cfg.blur) f.push(`blur(${cfg.blur * dpr}px)`);
    if (cfg.vividness !== 1) f.push(`saturate(${cfg.vividness})`);
    if (cfg.tint) f.push(`hue-rotate(${cfg.tint}deg)`);
    if (cfg.bw) f.push("grayscale(1)");
    return f.join(" ") || "none";
  }
  function drawMoodGlow(g, x, y, w, h, dpr) {
    if (!reactEl) return;
    const op = parseFloat(reactEl.style.opacity) || 0; if (op <= 0.01) return;
    const col = reactEl.style.getPropertyValue("--bd-react") || upColor(), k = Math.abs(mood) * cfg.reactStrength;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha *= op;
    // soft colour pool from the top or bottom edge, like the page's radial gradient
    const cy = y + (mood >= 0 ? 1.1 : -0.1) * h, gr = g.createRadialGradient(x + w / 2, cy, 0, x + w / 2, cy, Math.max(w, h) * 0.75);
    gr.addColorStop(0, col + "55"); gr.addColorStop(0.6, col + "00");
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    // inset glow around the edges (CSS: inset 0 0 B S colour)
    // CSS draws ONLY the shadow. Canvas draws the shape as well, so the shape is placed far off-canvas and its
    // shadow is offset back into view: what's left is the soft glow, with no hard frame.
    const B = (40 + 160 * k) * dpr, S = (10 + 40 * k) * dpr, OFF = 20000;
    g.shadowColor = col; g.shadowBlur = B; g.shadowOffsetX = -OFF; g.fillStyle = "#000";
    g.beginPath(); g.rect(x - 4 * B + OFF, y - 4 * B, w + 8 * B, h + 8 * B); g.rect(x + S + OFF, y + S, w - 2 * S, h - 2 * S); g.fill("evenodd");
    g.restore();
  }
  function drawWallpaper(g, box, dpr) {
    let mediaMissed = false;
    const filt = wallFilter(dpr), dim = Math.min(0.95, +cfg.dim + (cfg.calm && calmActive ? 0.3 : 0)), over = cfg.layer === "over";
    for (const v of views) {
      const dx = (v.x - box.left) * dpr, dy = (v.y - box.top) * dpr, dw = v.w * dpr, dh = v.h * dpr;
      g.save(); g.beginPath(); g.rect(dx, dy, dw, dh); g.clip();
      try {
        const t = v.content && v.content.tagName;
        if (t === "CANVAS" || t === "VIDEO" || t === "IMG") { g.filter = filt; drawFit(g, v.content, dx, dy, dw, dh); g.filter = "none"; }
        else mediaMissed = true;
      } catch { mediaMissed = true; }
      if (!over && dim > 0) { g.fillStyle = `rgba(0,0,0,${dim})`; g.fillRect(dx, dy, dw, dh); }
      if (cfg.vignette > 0) {       // CSS: radial-gradient(ellipse at center, transparent X%, rgba(0,0,0,a) 100%)
        const inner = (70 - cfg.vignette * 40) / 100, a = 0.35 + cfg.vignette * 0.55;
        g.translate(dx + dw / 2, dy + dh / 2); g.scale(dw / 2 * Math.SQRT2, dh / 2 * Math.SQRT2);
        const vg = g.createRadialGradient(0, 0, 0, 0, 0, 1); vg.addColorStop(inner, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${a})`);
        g.fillStyle = vg; g.fillRect(-1, -1, 2, 2);
      }
      g.restore();
    }
    return mediaMissed;
  }
  function drawChartCanvases(g, box, dpr) {
    for (const c of charts) {
      const canv = c.el.querySelectorAll ? c.el.querySelectorAll("canvas") : [];
      for (const cv of canv) {
        const r = cv.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        try { g.drawImage(cv, (r.left - box.left) * dpr, (r.top - box.top) * dpr, r.width * dpr, r.height * dpr); } catch {}
      }
    }
  }
  function drawPnlOverlay(g, box, dpr) {
    if (!pnlEl || !pnlEl.isConnected) return;
    const r = pnlEl.getBoundingClientRect(); if (r.width < 2) return;
    const x = (r.left - box.left) * dpr, y = (r.top - box.top) * dpr, w = r.width * dpr, h = r.height * dpr;
    const rainbow = pnlEl.classList.contains("bd-pnl-rainbow"), boxed = pnlEl.classList.contains("bd-pnl-box");
    const col = rainbow ? null : (pnlEl.style.getPropertyValue("--pc") || "#fff"), fs = parseFloat(pnlEl.style.fontSize) || 34;
    g.save();
    if (boxed) {
      rr(g, x, y, w, h, 12 * dpr); g.fillStyle = pnlEl.classList.contains("bd-pnl-solid") ? "#0b0e16" : "rgba(8,11,18,.55)"; g.fill();
      g.lineWidth = dpr; g.strokeStyle = rainbow ? "rgba(255,255,255,.35)" : col + "8c"; g.stroke();
    }
    g.font = `900 ${fs * dpr}px ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace`;
    g.textBaseline = "middle"; g.textAlign = "center";
    if (rainbow) {
      const gr = g.createLinearGradient(x, 0, x + w, 0), ph = (performance.now() / 3000) % 1;
      for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsl(${Math.round(((i / 6 + ph) % 1) * 360)} 100% 62%)`);
      g.fillStyle = gr;
    } else { g.shadowColor = col; g.shadowBlur = 12 * dpr; g.fillStyle = col; }
    g.fillText(pnlEl.textContent, x + w / 2, y + h / 2 + dpr);
    g.restore();
  }
  function drawGoalOverlay(g, box, dpr) {
    if (!goalEl || !goalEl.isConnected) return;
    const r = goalEl.getBoundingClientRect(); if (r.width < 2) return;
    const x = (r.left - box.left) * dpr, y = (r.top - box.top) * dpr, w = r.width * dpr, h = r.height * dpr;
    const col = getComputedStyle(goalEl).getPropertyValue("--gc").trim() || "#8a93a6", pad = 13 * dpr;
    g.save();
    rr(g, x, y, w, h, 12 * dpr); g.fillStyle = "rgba(8,11,18,.78)"; g.fill(); g.lineWidth = dpr; g.strokeStyle = col + "8c"; g.stroke();
    g.textBaseline = "alphabetic";
    g.font = `700 ${10 * dpr}px ui-monospace, Menlo, Consolas, monospace`; g.fillStyle = "rgba(223,229,241,.6)"; g.textAlign = "left";
    g.fillText(goalEl.querySelector(".bd-g-label").textContent, x + pad, y + 20 * dpr);
    g.font = `900 ${19 * dpr}px ui-monospace, Menlo, Consolas, monospace`; g.fillStyle = col; g.textAlign = "right";
    g.fillText(goalEl.querySelector(".bd-g-val").textContent, x + w - pad, y + 24 * dpr);
    const tx = x + pad, tw = w - 2 * pad, ty = y + 34 * dpr, th = 6 * dpr;
    rr(g, tx, ty, tw, th, th / 2); g.fillStyle = "rgba(255,255,255,.12)"; g.fill();
    const fill = goalEl.querySelector(".bd-g-fill"), fl = parseFloat(fill.style.left) || 50, fw = hideMoney() ? 0 : parseFloat(fill.style.width) || 0;
    if (fw > 0) { rr(g, tx + tw * fl / 100, ty, Math.max(th, tw * fw / 100), th, th / 2); g.fillStyle = col; g.fill(); }
    g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(tx + tw / 2 - dpr, ty, 2 * dpr, th);
    g.font = `700 ${10 * dpr}px ui-monospace, Menlo, Consolas, monospace`; g.fillStyle = "rgba(223,229,241,.75)";
    g.textAlign = "left"; g.fillText(goalEl.querySelector(".bd-g-l").textContent, tx, y + h - 9 * dpr);
    g.textAlign = "right"; g.fillText(goalEl.querySelector(".bd-g-r").textContent, tx + tw, y + h - 9 * dpr);
    g.restore();
  }
  function drawMoodPill(g, box, dpr) {
    if (!pillEl || pillEl.hidden || !pillEl.textContent) return;
    const r = pillEl.getBoundingClientRect(); if (r.width < 2) return;
    const x = (r.left - box.left) * dpr, y = (r.top - box.top) * dpr, w = r.width * dpr, h = r.height * dpr, col = pillEl.style.color || "#fff";
    g.save(); rr(g, x, y, w, h, h / 2); g.fillStyle = "rgba(0,0,0,.55)"; g.fill(); g.lineWidth = dpr; g.strokeStyle = col; g.stroke();
    g.font = `700 ${12 * dpr}px system-ui, sans-serif`; g.fillStyle = col; g.textBaseline = "middle"; g.textAlign = "center";
    g.shadowColor = col; g.shadowBlur = 6 * dpr; g.fillText(pillEl.textContent, x + w / 2, y + h / 2 + dpr);
    g.restore();
  }
  function drawWatermark(g, box, dpr, wmImg) {
    if (!cfg.wmOn || !wmImg) return;
    const W = g.canvas.width, H = g.canvas.height, op = Math.max(0.1, Math.min(1, +cfg.wmOpacity || 0.85));
    if (cfg.wmStyle === "tiled") {
      g.globalAlpha = op * 0.22;
      for (let y = 0; y < H; y += 170 * dpr) for (let x = 0; x < W; x += 300 * dpr) g.drawImage(wmImg, x, y, 300 * dpr, 170 * dpr);
      g.globalAlpha = 1; return;
    }
    const label = wmLabel(), big = cfg.wmPos === "center", h = (big ? 48 : 22) * dpr, gap = (big ? 14 : 7) * dpr;
    g.font = `600 ${(big ? 34 : 15) * dpr}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const tw = g.measureText(label).width, bw = h + gap + tw;
    // use the real on-page position when we have it, so a drifting mark is captured where it actually is
    let bx, by;
    if (wmEl && wmEl.isConnected) { const r = wmEl.getBoundingClientRect(); bx = (r.left - box.left) * dpr; by = (r.top - box.top) * dpr + (r.height * dpr - h) / 2; }
    else { const pad = 16 * dpr; bx = cfg.wmPos[1] === "l" ? pad : W - bw - 72 * dpr - pad; by = cfg.wmPos[0] === "t" ? pad + 34 * dpr : H - h - 30 * dpr - pad; if (big) { bx = (W - bw) / 2; by = (H - h) / 2; } }
    g.save(); g.globalAlpha = op; g.drawImage(wmImg, bx, by, h, h);
    g.fillStyle = "#fff"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 4 * dpr;
    g.fillText(label, bx + h + gap, by + h / 2); g.restore();
  }
  function compositeFrame(g, box, dpr, wmImg) {
    const W = g.canvas.width, H = g.canvas.height, over = cfg.layer === "over";
    g.clearRect(0, 0, W, H);
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bd-page-bg").trim() || "#0b0e16"; g.fillRect(0, 0, W, H);
    let mediaMissed = false;
    const layerAlpha = Math.max(0, Math.min(1, +(over ? cfg.overOpacity : cfg.opacity)));
    if (!over) {
      g.save(); g.globalAlpha = layerAlpha;
      mediaMissed = drawWallpaper(g, box, dpr); drawMoodGlow(g, 0, 0, W, H, dpr);
      g.restore();
      drawChartCanvases(g, box, dpr);
    } else {                       // "On top": the wallpaper sits over the chart, clipped to the chart panes
      drawChartCanvases(g, box, dpr);
      g.save(); g.globalAlpha = layerAlpha; g.beginPath();
      for (const c of (charts.length ? charts : [{ r: box }])) g.rect((c.r.left - box.left) * dpr, (c.r.top - box.top) * dpr, c.r.width * dpr, c.r.height * dpr);
      g.clip(); mediaMissed = drawWallpaper(g, box, dpr); drawMoodGlow(g, 0, 0, W, H, dpr); g.restore();
    }
    drawMoodPill(g, box, dpr); drawPnlOverlay(g, box, dpr); drawGoalOverlay(g, box, dpr); drawTimerOverlay(g, box, dpr); drawWatermark(g, box, dpr, wmImg);
    return { mediaMissed };
  }
  // preload the right watermark image for compositing (corner logo, or the tiled pattern), or null if wm is off
  async function watermarkImage() {
    if (!cfg.wmOn) return null;
    try { return await loadImage(cfg.wmStyle === "tiled" ? tilePattern() : BRAND_LOGO); } catch { return null; }
  }
  async function captureSnapshot() {
    if (!cfg.enabled) return { ok: false, reason: "Turn Priism Skins on first." };
    const box = chartsBox();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = Math.max(1, Math.round(box.width * dpr)), H = Math.max(1, Math.round(box.height * dpr));
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d");
    const wmImg = await watermarkImage();
    const { mediaMissed } = compositeFrame(g, box, dpr, wmImg);
    // export
    return await new Promise((res) => {
      try { out.toBlob((blob) => { if (!blob) return res({ ok: false, reason: "The browser blocked reading the chart pixels (a cross-origin chart)." });
        res({ ok: true, blob, mediaMissed, w: W, h: H }); }, "image/png"); }
      catch { res({ ok: false, reason: "The browser blocked reading the chart pixels (a cross-origin chart)." }); }
    });
  }
  // ---------- clip editor: crop + trim a finished recording before saving ----------
  // Opens on the chart page when a recording ends (unless "After recording" is set to download right away).
  // Everything happens on this computer: the clip is re-recorded from a hidden canvas, nothing is uploaded.
  // bitrate for a clip: High = crisp, Balanced = good + reasonable size, Small = kept under ~20 MB (Discord-friendly)
  function clipBps(W, H, fps, dur, q) {
    const px = Math.max(1, W * H * (fps || 30));
    const high = Math.min(16e6, Math.max(4e6, px * 0.12)), bal = Math.min(8e6, Math.max(2.5e6, px * 0.06));
    if (q === "high") return Math.round(high);
    if (q === "small") return Math.round(Math.max(600e3, Math.min(bal * 0.5, (20 * 8e6 * 0.92) / Math.max(2, dur))));
    return Math.round(bal);
  }
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.documentElement.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function openClipEditor(blob, name, fps, hasAudio) {
    const host = document.createElement("div"); host.id = "bd-clip-editor";
    host.style.cssText = "position:fixed;inset:0;z-index:2147483646";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      *{box-sizing:border-box;font-family:system-ui,sans-serif}
      .bg{position:absolute;inset:0;background:rgba(4,6,10,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center}
      .card{width:min(980px,94vw);max-height:94vh;background:#0f1117;border:1px solid #262a36;border-radius:14px;padding:14px 16px;color:#e9ebf2;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
      .top{display:flex;align-items:center;justify-content:space-between}.top b{font-size:15px}.top small{color:#8b8fa0;margin-left:8px}
      .stage{position:relative;align-self:center;max-width:100%;line-height:0;background:#000;border-radius:8px;overflow:hidden;user-select:none}
      video{display:block;max-width:100%;max-height:58vh}
      .shade{position:absolute;z-index:1;background:rgba(0,0,0,.62);pointer-events:none}
      .crop{position:absolute;z-index:2;border:2px solid #2ef2b0;box-shadow:0 0 0 1px #000;cursor:move}
      .crop i{position:absolute;width:14px;height:14px;background:#2ef2b0;border:2px solid #04130f;border-radius:3px}
      .crop i[data-h=tl]{left:-8px;top:-8px;cursor:nwse-resize}.crop i[data-h=br]{right:-8px;bottom:-8px;cursor:nwse-resize}
      .crop i[data-h=tr]{right:-8px;top:-8px;cursor:nesw-resize}.crop i[data-h=bl]{left:-8px;bottom:-8px;cursor:nesw-resize}
      .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:#aab0bf}
      .est{margin-left:auto;color:#7fe9d0;font-weight:600}
      .row>span{min-width:62px;color:#8b8fa0}
      button{background:#181b24;border:1px solid #2a2e3a;color:#dfe2ea;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer}
      button.on{background:#2a2f3d;border-color:#e9ebf2;color:#fff}
      button.go{background:linear-gradient(90deg,#19d3ff,#2ef2b0 55%,#c6ff3d);color:#04130f;border:none;font-weight:700}
      button:disabled{opacity:.5;cursor:default}
      .trim{position:relative;flex:1;min-width:240px;height:28px}
      .trim input{position:absolute;inset:0;width:100%;margin:0;background:none;pointer-events:none;-webkit-appearance:none;appearance:none}
      .trim input::-webkit-slider-thumb{pointer-events:auto;-webkit-appearance:none;width:14px;height:24px;border-radius:4px;background:#2ef2b0;border:2px solid #04130f;cursor:ew-resize}
      .trim .bar{position:absolute;left:0;right:0;top:12px;height:4px;background:#262a36;border-radius:2px}
      .trim .sel{position:absolute;top:12px;height:4px;background:#2ef2b0;border-radius:2px}
      .acts{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
      .prog{height:6px;background:#262a36;border-radius:3px;overflow:hidden;display:none}.prog div{height:100%;width:0;background:#2ef2b0}
      .msg{font-size:12px;color:#8b8fa0}
    </style>
    <div class="bg"><div class="card">
      <div class="top"><div><b>Edit your clip</b><small>Drag the box to crop · drag the green handles to trim</small></div><div style="display:flex;gap:8px">${hasAudio ? '<button data-a="snd">\u{1F508} Play sound</button>' : ""}<button data-a="discard">Discard</button></div></div>
      <div class="stage"><video muted playsinline></video><div class="shade s1"></div><div class="shade s2"></div><div class="shade s3"></div><div class="shade s4"></div>
        <div class="crop"><i data-h="tl"></i><i data-h="tr"></i><i data-h="bl"></i><i data-h="br"></i></div></div>
      <div class="row"><span>Crop</span><button data-r="free" class="on">Free</button><button data-r="full">Whole video</button><button data-r="16:9">16:9 (YouTube)</button><button data-r="9:16">9:16 (TikTok / Reels)</button><button data-r="1:1">1:1 (square)</button><button data-r="4:5">4:5</button></div>
      <div class="row"><span>Trim</span><div class="trim"><div class="bar"></div><div class="sel"></div><input type="range" class="t0" min="0" max="1000" value="0"><input type="range" class="t1" min="0" max="1000" value="1000"></div><b class="tl">0.0s – 0.0s</b></div>
      <div class="row"><span>Size</span><button data-s="0" class="on">Original</button><button data-s="1080">1080p</button><button data-s="720">720p</button><button data-s="480">480p</button></div>
      <div class="row"><span>Quality</span><button data-q="high">High</button><button data-q="balanced" class="on">Balanced</button><button data-q="small">Small file (Discord)</button><b class="est"></b></div>
      <div class="prog"><div></div></div>
      <div class="acts"><span class="msg">Cropping or trimming re-saves the clip as it plays, so it takes about as long as the clip.</span><button data-a="orig">Save as is (instant)</button><button data-a="save" class="go">Save edited clip</button></div>
    </div></div>`;
    document.documentElement.appendChild(host);
    const $q = (s) => root.querySelector(s), v = $q("video"), stage = $q(".stage"), box = $q(".crop"), msg = $q(".msg");
    const url = URL.createObjectURL(blob); v.src = url; v.loop = false;
    let dur = 0, t0 = 0, t1 = 0, ratio = "free", crop = { x: 0, y: 0, w: 1, h: 1 }, busy = false;   // crop in 0..1 of the video
    let outSize = 0, quality = (cfg.clipQuality === "high" || cfg.clipQuality === "small") ? cfg.clipQuality : "balanced";
    const pick = (attr, val) => root.querySelectorAll(`[data-${attr}]`).forEach((b) => b.classList.toggle("on", b.dataset[attr] === String(val)));
    const outDims = () => { let W = Math.max(2, Math.round(crop.w * (v.videoWidth || 2))), H = Math.max(2, Math.round(crop.h * (v.videoHeight || 2)));
      // Size = the short side (1080p, 720p...), never upscaled; the long side is capped at 1920
      const k = Math.min(1, outSize ? outSize / Math.min(W, H) : 1, 1920 / Math.max(W, H));
      return [Math.max(2, Math.round(W * k) & ~1), Math.max(2, Math.round(H * k) & ~1)]; };
    const estimate = () => { const [W, H] = outDims(), d = Math.max(0.5, t1 - t0), bps = clipBps(W, H, fps || 30, d, quality);
      root.querySelector(".est").textContent = `≈ ${Math.max(0.1, (bps * d) / 8e6).toFixed(1)} MB · ${W}×${H}`; };
    const untouched = () => crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1 && t0 <= 0.05 && t1 >= dur - 0.05 && !outSize && quality === ((cfg.clipQuality === "high" || cfg.clipQuality === "small") ? cfg.clipQuality : "balanced");
    // Sound: the preview plays muted until you click in the editor (browsers only allow sound after a click); then it
    // runs through an audio graph so the same sound can be both heard and re-recorded when you save an edit.
    let ac = null, asrc = null, pv = null, soundOn = true;
    const audioUp = () => {
      if (!hasAudio || ac) return;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); asrc = ac.createMediaElementSource(v); pv = ac.createGain(); pv.gain.value = soundOn ? 1 : 0;
        asrc.connect(pv); pv.connect(ac.destination); v.muted = false; } catch { ac = null; }
    };
    const close = () => { busy = false; try { v.pause(); } catch {} try { ac && ac.close(); } catch {} URL.revokeObjectURL(url); host.remove(); removeEventListener("keydown", onKey, true); };
    const onKey = (e) => { if (e.key === "Escape" && !busy) { e.stopPropagation(); close(); } };
    addEventListener("keydown", onKey, true);
    // MediaRecorder WebM files don't store their length: seek far ahead once so the browser works it out
    const ready = new Promise((res) => {
      v.addEventListener("loadedmetadata", () => {
        if (isFinite(v.duration) && v.duration > 0) return res();
        v.addEventListener("durationchange", function f() { if (isFinite(v.duration)) { v.removeEventListener("durationchange", f); v.currentTime = 0; res(); } });
        v.currentTime = 1e7;
      }, { once: true });
    });
    ready.then(() => { dur = v.duration; t1 = dur; layout(); trimUi(); estimate(); v.currentTime = 0; v.play().catch(() => {}); });
    root.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { if (busy) return; outSize = +b.dataset.s; pick("s", b.dataset.s); estimate(); });
    root.querySelectorAll("[data-q]").forEach((b) => b.onclick = () => { if (busy) return; quality = b.dataset.q; pick("q", quality); estimate(); });
    pick("q", quality);
    // preview loops inside the trimmed range
    v.addEventListener("timeupdate", () => { if (!busy && dur && (v.currentTime >= t1 - 0.03 || v.currentTime < t0 - 0.2)) { v.currentTime = t0; v.play().catch(() => {}); } });
    const vw = () => v.videoWidth || 1, vh = () => v.videoHeight || 1;
    function fitRatio(r) {
      if (r === "full") return { x: 0, y: 0, w: 1, h: 1 };
      const [a, b] = r.split(":").map(Number), want = a / b, cur = vw() / vh();
      let w = 1, h = 1; if (want < cur) w = (want / cur); else h = (cur / want);
      return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
    }
    function layout() {
      const W = v.clientWidth, H = v.clientHeight, c = crop;
      Object.assign(box.style, { left: c.x * W + "px", top: c.y * H + "px", width: c.w * W + "px", height: c.h * H + "px" });
      const s = [[0, 0, W, c.y * H], [0, (c.y + c.h) * H, W, H - (c.y + c.h) * H], [0, c.y * H, c.x * W, c.h * H], [(c.x + c.w) * W, c.y * H, W - (c.x + c.w) * W, c.h * H]];
      ["s1", "s2", "s3", "s4"].forEach((k, i) => Object.assign($q("." + k).style, { left: s[i][0] + "px", top: s[i][1] + "px", width: Math.max(0, s[i][2]) + "px", height: Math.max(0, s[i][3]) + "px" }));
    }
    addEventListener("resize", layout);
    root.querySelectorAll("[data-r]").forEach((b) => b.onclick = () => {
      ratio = b.dataset.r === "full" ? "free" : b.dataset.r; crop = b.dataset.r === "free" ? crop : fitRatio(b.dataset.r);
      root.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x.dataset.r === (b.dataset.r === "full" ? "free" : b.dataset.r))); layout(); estimate();
    });
    // drag to move / resize (keeps the chosen ratio when one is picked)
    let drag = null;
    box.addEventListener("pointerdown", (e) => { if (busy) return; e.preventDefault(); box.setPointerCapture(e.pointerId);
      drag = { h: e.target.dataset.h || "move", sx: e.clientX, sy: e.clientY, c: { ...crop } }; });
    box.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const W = v.clientWidth, H = v.clientHeight, dx = (e.clientX - drag.sx) / W, dy = (e.clientY - drag.sy) / H, o = drag.c, MIN = 0.06;
      let { x, y, w, h } = o;
      if (drag.h === "move") { x = Math.min(1 - w, Math.max(0, o.x + dx)); y = Math.min(1 - h, Math.max(0, o.y + dy)); }
      else {
        if (drag.h.includes("l")) { x = Math.min(o.x + o.w - MIN, Math.max(0, o.x + dx)); w = o.x + o.w - x; }
        if (drag.h.includes("r")) { w = Math.min(1 - o.x, Math.max(MIN, o.w + dx)); }
        if (drag.h.includes("t")) { y = Math.min(o.y + o.h - MIN, Math.max(0, o.y + dy)); h = o.y + o.h - y; }
        if (drag.h.includes("b")) { h = Math.min(1 - o.y, Math.max(MIN, o.h + dy)); }
        if (ratio !== "free") {                                 // keep the picked shape: height follows width
          const [a, b] = ratio.split(":").map(Number), want = (a / b) * (vh() / vw());
          h = w / want; if (drag.h.includes("t")) y = o.y + o.h - h;
          if (y < 0 || y + h > 1) { h = Math.min(h, drag.h.includes("t") ? o.y + o.h : 1 - y); w = h * want; if (drag.h.includes("l")) x = o.x + o.w - w; y = drag.h.includes("t") ? o.y + o.h - h : y; }
        }
      }
      crop = { x, y, w, h }; layout(); estimate();
    });
    box.addEventListener("pointerup", () => { drag = null; });
    const r0 = $q(".t0"), r1 = $q(".t1");
    function trimUi() {
      const a = +r0.value / 1000, b = +r1.value / 1000;
      if (b - a < 0.02) { if (this === r0) r0.value = +r1.value - 20; else r1.value = +r0.value + 20; }
      t0 = (+r0.value / 1000) * dur; t1 = (+r1.value / 1000) * dur;
      Object.assign($q(".sel").style, { left: (+r0.value / 10) + "%", width: ((+r1.value - +r0.value) / 10) + "%" });
      $q(".tl").textContent = `${t0.toFixed(1)}s – ${t1.toFixed(1)}s  (${(t1 - t0).toFixed(1)}s)`; if (dur) estimate();
    }
    r0.oninput = function () { trimUi.call(this); if (dur) v.currentTime = t0; };
    r1.oninput = function () { trimUi.call(this); if (dur) v.currentTime = Math.max(t0, t1 - 0.5); };
    // The preview is silent until the browser allows sound (your first click in the editor). The first click on the sound
    // button just turns the sound on (it used to start it and mute it again in the same click, so clips seemed silent).
    const sb = root.querySelector("[data-a=snd]");
    let justStarted = false;
    const label = () => { if (sb) sb.textContent = !ac ? "\u{1F508} Play sound" : soundOn ? "\u{1F50A} Sound on" : "\u{1F507} Muted"; };
    const startSound = () => { const was = !!ac; audioUp(); if (ac && ac.state === "suspended") ac.resume().catch(() => {}); justStarted = !was && !!ac; label(); };
    root.addEventListener("pointerdown", startSound, true);
    if (sb) sb.onclick = () => { startSound(); if (!justStarted) { soundOn = !soundOn; if (pv) pv.gain.value = soundOn ? 1 : 0; } justStarted = false; label(); };
    if (hasAudio && navigator.userActivation && navigator.userActivation.isActive) startSound();   // just clicked Stop: sound can start now
    root.querySelector("[data-a=discard]").onclick = () => { if (!busy) close(); };
    root.querySelector("[data-a=orig]").onclick = () => { if (busy) return; saveBlob(blob, name); flash("Clip saved to your downloads"); close(); };
    root.querySelector("[data-a=save]").onclick = async () => {
      if (busy || !dur) return;
      if (untouched()) { saveBlob(blob, name); flash("Clip saved to your downloads"); close(); return; }   // nothing changed: instant
      busy = true; root.querySelectorAll("button").forEach((b) => (b.disabled = true));
      const prog = $q(".prog"), bar = $q(".prog div"); prog.style.display = "block"; msg.textContent = "Saving… keep this tab open";
      try {
        const sx = Math.round(crop.x * vw()), sy = Math.round(crop.y * vh());
        let W = Math.round(crop.w * vw()) & ~1, H = Math.round(crop.h * vh()) & ~1;
        const [OW, OH] = outDims();
        const cv = document.createElement("canvas"); cv.width = OW; cv.height = OH; const g = cv.getContext("2d");
        const stream = cv.captureStream(fps || 30);
        let withSound = false;
        if (hasAudio) { audioUp(); if (ac) { try { await ac.resume(); const d = ac.createMediaStreamDestination(); asrc.connect(d); stream.addTrack(d.stream.getAudioTracks()[0]); withSound = true; } catch {} } }
        const mime = clipMime(withSound);
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: clipBps(OW, OH, fps || 30, Math.max(0.5, t1 - t0), quality) } : undefined);
        const chunks = []; rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
        const done = new Promise((res) => (rec.onstop = res));
        v.pause(); v.currentTime = t0; await new Promise((res) => v.addEventListener("seeked", res, { once: true }));
        g.drawImage(v, sx, sy, W, H, 0, 0, OW, OH);
        rec.start(500); await v.play();
        // Finish reliably: the browser can stop handing out frames a hair before the very end of a clip, a hidden
        // tab pauses frame callbacks, and the video may end early, so we stop on ANY of: reached the end point
        // (within a frame), the video ended or paused, or a hard deadline. A timer also keeps frames coming.
        const frameDur = 1 / (fps || 30), deadline = performance.now() + ((t1 - t0) / Math.max(0.25, v.playbackRate || 1)) * 1000 + 4000;
        await new Promise((res) => {
          let done2 = false, iv = 0;
          const finish = () => { if (done2) return; done2 = true; clearInterval(iv); v.removeEventListener("ended", finish); res(); };
          const draw = () => {
            if (done2) return;
            if (!busy) return finish();
            try { g.drawImage(v, sx, sy, W, H, 0, 0, OW, OH); } catch {}
            const left = Math.max(0, t1 - v.currentTime);
            bar.style.width = Math.min(100, ((v.currentTime - t0) / Math.max(0.01, t1 - t0)) * 100) + "%";
            msg.textContent = `Saving… ${Math.ceil(left)}s left (keep this tab open)`;
            if (v.currentTime >= t1 - frameDur || v.ended || (v.paused && v.currentTime > t0 + 0.1) || performance.now() > deadline) return finish();
          };
          const step = () => { draw(); if (!done2 && v.requestVideoFrameCallback) v.requestVideoFrameCallback(step); };
          v.addEventListener("ended", finish);
          iv = setInterval(draw, 100);                          // backup when frame callbacks pause
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(step); else draw();
        });
        v.pause();
        bar.style.width = "100%"; msg.textContent = "Finishing…";
        try { rec.requestData(); } catch {}
        rec.stop();
        await Promise.race([done, new Promise((r) => setTimeout(r, 3000))]);   // never hang waiting for the recorder
        const out = new Blob(chunks, { type: mime || "video/webm" });
        saveBlob(out, name.replace(/\.webm$/, "") + "-edited.webm");
        flash("Edited clip saved to your downloads");
        close();
      } catch (e) {
        busy = false; root.querySelectorAll("button").forEach((b) => (b.disabled = false)); prog.style.display = "none";
        msg.textContent = "Couldn't save the edit here. Use Save original.";
      }
    };
    return host;
  }

  window.__bdOpenClipEditor = openClipEditor;   // test hook (isolated world only)
  // popup asks for a snapshot; we reply with a data URL it can download/preview (blobs don't cross the messaging port)
  function blobToDataURL(blob) { return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }); }

  // ---------- Live Clip: a short animated WebM of the chart with the live wallpaper moving ----------
  // Re-composes a frame (wallpaper + chart + watermark) ~30x/sec onto a capture canvas and records it with
  // MediaRecorder. Captures the MOTION of a built-in animated skin. Uploaded media (iframe player) still can't be
  // read, so for those the clip shows the chart + watermark moving but not the uploaded wallpaper. A clip is bigger
  // than a PNG, so we cap it (default ~5s) and downscale to keep it shareable.
  let clipRec = null, stopClip = null;
  const MAX_CLIP_SECONDS = 120;
  // ---------- sound in clips ----------
  // Your voice (microphone), the computer's sound (music / videos playing, through Chrome's share picker), or both,
  // mixed into one track. Chrome asks once to use the microphone on this site, and shows its share picker for the
  // computer's sound (Windows: tick "Share system audio"; Mac: Chrome can only take a tab's sound).
  const wantMic = () => cfg.clipAudio === "mic" || cfg.clipAudio === "both";
  const wantSys = () => cfg.clipAudio === "computer" || cfg.clipAudio === "both";
  function clipMime(withAudio) {
    const list = withAudio ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"] : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    return list.find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
  }
  async function clipAudioTrack(display) {
    const srcs = [], stops = [];
    if (display) for (const t of display.getAudioTracks()) if (t.readyState === "live") srcs.push(new MediaStream([t]));
    if (wantMic() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try { const m = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); srcs.push(m); stops.push(() => m.getTracks().forEach((t) => t.stop())); }
      catch (e) { flash(e && e.name === "NotAllowedError" ? "Microphone blocked: allow it for this site to add your voice" : "No microphone found, recording without your voice"); }
    }
    if (!srcs.length) return null;
    if (srcs.length === 1) return { track: srcs[0].getAudioTracks()[0], stop: () => stops.forEach((f) => f()) };
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)(); try { await ac.resume(); } catch {}
      const dest = ac.createMediaStreamDestination();
      for (const s of srcs) ac.createMediaStreamSource(s).connect(dest);
      return { track: dest.stream.getAudioTracks()[0], stop: () => { stops.forEach((f) => f()); try { ac.close(); } catch {} } };
    } catch { return { track: srcs[0].getAudioTracks()[0], stop: () => stops.forEach((f) => f()) }; }
  }
  const displayOpts = (fps, soundOnly) => ({
    video: soundOnly ? true : { frameRate: { ideal: Math.max(10, Math.min(60, +fps || 30)) }, displaySurface: "monitor" },
    audio: wantSys() ? { suppressLocalAudioPlayback: false, echoCancellation: false, noiseSuppression: false, autoGainControl: false } : false,
    systemAudio: wantSys() ? "include" : "exclude", selfBrowserSurface: "include", surfaceSwitching: "include", monitorTypeSurfaces: "include",
  });
  const noSysHint = () => flash("No computer sound was shared. Next time tick \u201cShare system audio\u201d (or pick a tab with \u201cShare tab audio\u201d)");
  // Chart-only clip WITH the computer's sound: Chrome only opens its share picker from a click on the page, so from the
  // panel a small card asks first; from a shortcut (a key press on the page) the picker opens straight away.
  function startSoundFlow(dur, fps) {
    if (screenBusy || clipRec) return { ok: false, reason: "Already recording." };
    const pick = async () => {
      let disp = null;
      try { disp = await navigator.mediaDevices.getDisplayMedia(displayOpts(fps, true)); } catch { disp = null; }
      if (disp) { disp.getVideoTracks().forEach((t) => t.stop()); if (!disp.getAudioTracks().length) noSysHint(); }   // only the sound is used
      captureClip(dur, fps, disp, true).then((r) => { if (r && r.ok === false) flash(r.reason); }).catch(() => {});
    };
    if (navigator.userActivation && navigator.userActivation.isActive) { pick(); return { ok: true, awaiting: true }; }
    cancelScreenAsk();
    const card = document.createElement("div"); card.id = "bd-screenask"; screenAsk = card;
    card.style.cssText = "position:fixed;z-index:2147483647;top:70px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:rgba(10,12,18,.96);color:#fff;font:600 13px system-ui,sans-serif;border:1px solid rgba(46,242,176,.6);box-shadow:0 12px 40px rgba(0,0,0,.6)";
    const txt = document.createElement("span"); txt.textContent = `Priism Skins \u00B7 add your computer's sound to the ${dur}s clip`;
    const go = document.createElement("button"), no = document.createElement("button");
    go.textContent = "Choose sound"; no.textContent = "Record without it";
    go.style.cssText = "all:unset;cursor:pointer;padding:8px 14px;border-radius:9px;background:linear-gradient(90deg,#19d3ff,#2ef2b0);color:#04140f;font:800 13px system-ui,sans-serif";
    no.style.cssText = "all:unset;cursor:pointer;padding:8px 10px;opacity:.75;font:600 13px system-ui,sans-serif";
    card.append(txt, go, no); document.documentElement.appendChild(card);
    go.onclick = () => { cancelScreenAsk(); pick(); };
    no.onclick = () => { cancelScreenAsk(); captureClip(dur, fps, null, true).catch(() => {}); };
    setTimeout(() => { if (screenAsk === card) cancelScreenAsk(); }, 90000);
    return { ok: true, awaiting: true };
  }
  async function captureClip(seconds, fpsWanted, display, soundAsked) {
    if (!cfg.enabled) return { ok: false, reason: "Turn Priism Skins on first." };
    if (clipRec) return { ok: false, reason: "Already recording a clip." };
    if (typeof MediaRecorder === "undefined") return { ok: false, reason: "Your browser can't record clips." };
    const box = chartsBox();
    // downscale so the clip stays small/shareable (cap the long edge ~900px of composite, times a modest dpr)
    const scale = Math.min(1, 900 / Math.max(1, box.width));
    const dpr = Math.min(1.5, (devicePixelRatio || 1)) * scale;
    const W = Math.max(2, Math.round(box.width * dpr)) & ~1, H = Math.max(2, Math.round(box.height * dpr)) & ~1;  // even dims for encoders
    const cap = document.createElement("canvas"); cap.width = W; cap.height = H;
    const g = cap.getContext("2d");
    const wmImg = await watermarkImage();
    // first frame to check we can actually read the pixels (a tainted/cross-origin chart will throw on record)
    const { mediaMissed } = compositeFrame(g, box, dpr, wmImg);
    let stream;
    const capFps = Math.max(10, Math.min(60, +fpsWanted || 30));
    try { stream = cap.captureStream(capFps); } catch { return { ok: false, reason: "Your browser can't record this chart." }; }
    let au = null; try { au = await clipAudioTrack(display || null); } catch {}
    if (au && au.track) stream.addTrack(au.track);
    const mime = clipMime(!!au);
    const stopAudio = () => { try { au && au.stop(); } catch {} try { display && display.getTracks().forEach((t) => t.stop()); } catch {} };
    let rec;
    // Any length from 2s to 2 minutes, at the quality you picked (based on the clip's real size + frame rate).
    const dur = Math.max(2, Math.min(MAX_CLIP_SECONDS, +seconds || 5));
    const bps = clipBps(cap.width, cap.height, capFps, dur, cfg.clipQuality);
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: bps } : undefined); }
    catch { stopAudio(); return { ok: false, reason: "Your browser can't record clips." }; }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    clipRec = rec;
    // Every clip is saved by the page itself the moment it ends. The popup closes when you click away,
    // so it must never be the thing that holds the file.
    const autoSave = true;
    // A small countdown badge on the chart. Click it to stop early. It is not part of the recording.
    const badge = document.createElement("div");
    badge.style.cssText = "position:fixed;z-index:2147483647;top:14px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:rgba(10,12,18,.88);color:#fff;font:600 13px system-ui,sans-serif;border:1px solid rgba(255,80,80,.7);cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.5)";
    badge.title = "Click to stop and save now";
    document.documentElement.appendChild(badge);
    const t0 = performance.now();
    const paint = () => { const left = Math.max(0, Math.ceil(dur - (performance.now() - t0) / 1000)); badge.textContent = `\u25CF Recording ${left}s \u00B7 click to stop`; };
    paint(); const badgeTimer = setInterval(paint, 250);
    return await new Promise((resolve) => {
      let rafId = 0, done = false, stopTimer = 0;
      const stop = () => { clearTimeout(stopTimer); try { rec.state !== "inactive" && rec.stop(); } catch {} };
      badge.onclick = stop; stopClip = stop;
      const cleanup = () => { done = true; cancelAnimationFrame(rafId); clearTimeout(stopTimer); clearInterval(badgeTimer); badge.remove(); clipRec = null; };
      const draw = () => { if (done) return; try { compositeFrame(g, box, dpr, wmImg); } catch {} rafId = requestAnimationFrame(draw); };
      rec.onstop = async () => {
        cleanup();
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        stopAudio();
        if (!chunks.length) return resolve({ ok: false, reason: "The browser blocked recording (a cross-origin chart)." });
        const blob = new Blob(chunks, { type: mime || "video/webm" });
        if (autoSave) {
          const q = parseTitle(), name = `priism-${((q && q.sym) || "chart").replace(/[^\w-]+/g, "")}-${Math.round((performance.now() - t0) / 1000)}s.webm`;
          if (cfg.clipEdit !== false) { openClipEditor(blob, name, cfg.clipFps, !!au); return resolve({ ok: true, saved: true, editing: true, name, mediaMissed, bytes: blob.size, w: W, h: H }); }
          saveBlob(blob, name);
          flash("Clip saved to your downloads");
          return resolve({ ok: true, saved: true, name, mediaMissed, bytes: blob.size, w: W, h: H });
        }
        resolve({ ok: true, url: await blobToDataURL(blob), mediaMissed, bytes: blob.size, w: W, h: H });
      };
      rec.onerror = () => { cleanup(); stopAudio(); resolve({ ok: false, reason: "Recording failed." }); };
      try { rec.start(); draw(); stopTimer = setTimeout(stop, dur * 1000); }
      catch { cleanup(); resolve({ ok: false, reason: "Recording failed." }); }
    });
  }

  // ---------- Whole-screen recording ----------
  // Records exactly what you see (through Chrome's own screen-share picker), so EVERY effect is in it, uploaded
  // wallpapers included. A page may only start a screen capture from a click on the page itself, so asking from the
  // panel shows a small card on the chart; clicking it opens Chrome's picker (pick "Entire screen", a window, or this
  // tab). It saves by itself when it ends, like the chart-only clip. The card is removed before recording starts.
  let screenAsk = null, screenBusy = false;
  function cancelScreenAsk() { if (screenAsk) { screenAsk.remove(); screenAsk = null; } }
  function startScreenFlow(seconds, fps) {
    if (screenBusy || clipRec) return { ok: false, reason: "Already recording." };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return { ok: false, reason: "Your browser can't record the screen on this page." };
    cancelScreenAsk();
    const dur = Math.max(2, Math.min(MAX_CLIP_SECONDS, +seconds || 5));
    const card = document.createElement("div"); card.id = "bd-screenask"; screenAsk = card;
    card.style.cssText = "position:fixed;z-index:2147483647;top:70px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:rgba(10,12,18,.96);color:#fff;font:600 13px system-ui,sans-serif;border:1px solid rgba(46,242,176,.6);box-shadow:0 12px 40px rgba(0,0,0,.6)";
    const txt = document.createElement("span"); txt.textContent = `Priism Skins \u00B7 record the screen for ${dur}s`;
    const go = document.createElement("button"), no = document.createElement("button");
    go.textContent = "Choose what to record"; no.textContent = "Cancel";
    go.style.cssText = "all:unset;cursor:pointer;padding:8px 14px;border-radius:9px;background:linear-gradient(90deg,#19d3ff,#2ef2b0);color:#04140f;font:800 13px system-ui,sans-serif";
    no.style.cssText = "all:unset;cursor:pointer;padding:8px 10px;opacity:.7;font:600 13px system-ui,sans-serif";
    card.append(txt, go, no); document.documentElement.appendChild(card);
    no.onclick = cancelScreenAsk;
    go.onclick = async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia(displayOpts(fps, false));
      } catch (e) {
        txt.textContent = e && e.name === "NotAllowedError" ? "Not started: sharing was cancelled or isn't allowed on this page." : "Couldn't start the screen recording.";
        go.remove(); setTimeout(cancelScreenAsk, 3500); return;
      }
      cancelScreenAsk();                       // keep our card out of the recording
      if (wantSys() && !stream.getAudioTracks().length) noSysHint();
      recordScreenStream(stream, dur);
    };
    if (navigator.userActivation && navigator.userActivation.isActive) { go.onclick(); return { ok: true, awaiting: true }; }   // a shortcut: open the picker now
    setTimeout(() => { if (screenAsk === card) cancelScreenAsk(); }, 90000);
    return { ok: true, awaiting: true };
  }
  async function recordScreenStream(stream, dur) {
    screenBusy = true;
    let au = null; try { au = await clipAudioTrack(stream); } catch {}
    const recStream = new MediaStream([...stream.getVideoTracks(), ...(au && au.track ? [au.track] : [])]);
    const mime = clipMime(!!au);
    const vs = (stream.getVideoTracks()[0] && stream.getVideoTracks()[0].getSettings()) || {};
    const bps = clipBps(vs.width || 1920, vs.height || 1080, vs.frameRate || 30, dur, cfg.clipQuality);
    let rec; try { rec = new MediaRecorder(recStream, mime ? { mimeType: mime, videoBitsPerSecond: bps } : undefined); }
    catch { stream.getTracks().forEach((t) => t.stop()); try { au && au.stop(); } catch {} screenBusy = false; return; }
    const chunks = [], t0 = performance.now(); let timer = 0, finished = false;
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stop = () => { clearTimeout(timer); try { rec.state !== "inactive" && rec.stop(); } catch {} };
    rec.onstop = () => {
      if (finished) return; finished = true; screenBusy = false; clearTimeout(timer);
      stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      try { au && au.stop(); } catch {}
      if (!chunks.length) return;
      const secs = Math.round((performance.now() - t0) / 1000), q = parseTitle();
      const blob = new Blob(chunks, { type: mime || "video/webm" }), name = `priism-screen-${((q && q.sym) || "chart").replace(/[^\w-]+/g, "")}-${secs}s.webm`;
      if (cfg.clipEdit !== false) return void openClipEditor(blob, name, cfg.clipFps, !!au);
      saveBlob(blob, name);
      flash("Screen clip saved to your downloads");
    };
    // "Stop sharing" in Chrome's own bar ends the capture early; we still save what was recorded
    stream.getVideoTracks().forEach((t) => t.addEventListener("ended", stop));
    rec.start(1000); timer = setTimeout(stop, dur * 1000);
  }

  // ---------- Alt+Shift+W: everything on/off, right on the chart ----------
  // ---------- a one-time tip card on the chart (TradingView's light theme; not signed in, in the desktop app) ----------
  function tipCard(id, text, actions) {
    if (document.getElementById("bd-tip") || IN_FRAME) return;
    try { if (localStorage.getItem("bdTip:" + id)) return; } catch {}
    const card = document.createElement("div"); card.id = "bd-tip"; card.dataset.bdOwner = ME.token;
    card.style.cssText = "position:fixed;z-index:2147483646;top:56px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;max-width:min(720px,92vw);padding:11px 14px;border-radius:14px;background:rgba(10,12,18,.96);color:#fff;font:600 13px system-ui,sans-serif;border:1px solid rgba(46,242,176,.55);box-shadow:0 12px 40px rgba(0,0,0,.6)";
    const t = document.createElement("span"); t.textContent = text; t.style.cssText = "flex:1;line-height:1.35"; card.append(t);
    const done = () => { try { localStorage.setItem("bdTip:" + id, String(Date.now())); } catch {} card.remove(); };
    actions.forEach(([label, fn], i) => { const b = document.createElement("button"); b.textContent = label;
      b.style.cssText = i === 0 ? "all:unset;cursor:pointer;padding:8px 14px;border-radius:9px;background:linear-gradient(90deg,#19d3ff,#2ef2b0);color:#04140f;font:800 13px system-ui,sans-serif;white-space:nowrap"
        : "all:unset;cursor:pointer;padding:8px 8px;opacity:.75;font:600 13px system-ui,sans-serif;white-space:nowrap";
      b.onclick = () => { done(); if (fn) fn(); }; card.append(b); });
    document.documentElement.appendChild(card);
  }
  let tipsShown = false;
  function chartTips() {
    if (tipsShown || !cfg.enabled || !owner || standDown || IN_FRAME || !/(^|\.)tradingview\.com$/.test(location.hostname)) return;
    const h = document.documentElement;
    if (h.classList.contains("theme-light")) {
      tipsShown = true;
      return tipCard("theme", "TradingView is in its light theme, which is hard to read over a wallpaper. Priism Skins looks best with TradingView's dark theme.",
        [["Use dark theme", () => document.dispatchEvent(new CustomEvent("bd-theme-dark"))], ["Keep light", null]]);
    }
    if (ME.id === "desktop" && h.classList.contains("is-not-authenticated")) {
      tipsShown = true;
      tipCard("signin", "You're not signed in to TradingView here. Sign in once to get your own layouts, watchlists, alerts and broker in this window.",
        [["Sign in", () => { location.href = "https://www.tradingview.com/accounts/signin/"; }], ["Not now", null]]);
    }
  }
  setTimeout(() => { setInterval(chartTips, 4000); chartTips(); }, 6000);   // after TradingView has settled
  function flash(msg) {
    const t = document.createElement("div"); t.className = "bd-flash"; t.textContent = msg;
    document.documentElement.appendChild(t); setTimeout(() => t.remove(), 1400);
  }
  // ---------- shortcuts (changeable) ----------
  function keyMatch(e, spec) {
    if (!spec) return false;
    const p = String(spec).split("+"), code = p.pop();
    return e.code === code && e.altKey === p.includes("Alt") && e.shiftKey === p.includes("Shift") && e.ctrlKey === p.includes("Ctrl") && e.metaKey === p.includes("Meta");
  }
  const keyLabel = (spec) => String(spec || "").split("+").map((k) => k.replace(/^Key/, "").replace(/^Digit/, "")).join("+");
  const save = (o) => { if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) chrome.storage.local.set(o); else if (window.__bdUpdate) window.__bdUpdate(o); };
  addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const isToggle = keyMatch(e, cfg.toggleKey || "Alt+Shift+KeyW"), isFocus = cfg.enabled && keyMatch(e, cfg.focusKey);
    const isRec = cfg.enabled && keyMatch(e, cfg.recordKey), isSnap = cfg.enabled && keyMatch(e, cfg.snapKey), isPriv = cfg.enabled && keyMatch(e, cfg.privacyKey);
    if (!isToggle && !isFocus && !isRec && !isSnap && !isPriv) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
    e.preventDefault(); e.stopPropagation();
    if (isToggle) { const next = !cfg.enabled; save({ enabled: next }); flash(next ? "Priism Skins on" : "Priism Skins off"); return; }
    if (isPriv) { const next = !cfg.privacy; save({ privacy: next }); flash(next ? "Streamer mode on \u00B7 your numbers are hidden" : "Streamer mode off"); return; }
    if (EXT && !owner) return;                      // only the frame that owns the chart records / snaps
    if (isRec) { doRecord(); return; }
    if (isSnap) { doSnap(); return; }
    const next = !cfg.focus; save({ focus: next });
    flash(next ? `Focus on \u00B7 ${keyLabel(cfg.focusKey)} to bring it back` : "Focus off");
  }, true);

  // Record / snapshot: the shortcuts and the desktop app's panel buttons both land here.
  function doRecord() {
    if (clipRec && stopClip) { stopClip(); return { ok: true, stopped: true }; }   // pressed again: stop and save now
    const secs = Math.max(2, Math.min(120, +cfg.clipLen || 10)), fps = +cfg.clipFps === 60 ? 60 : 30;
    if (cfg.clipMode === "screen") { const r = startScreenFlow(secs, fps); if (r && r.ok === false) flash(r.reason); return r; }
    if (wantSys()) { const r = startSoundFlow(secs, fps); if (r && r.ok === false) flash(r.reason); return r; }
    captureClip(secs, fps).then((r) => { if (r && r.ok === false) flash(r.reason); }).catch(() => {});
    return { ok: true };
  }
  function doSnap() {
    captureSnapshot().then((r) => {
      if (!r.ok) return flash(r.reason || "Couldn't take a snapshot");
      const q = parseTitle(); saveBlob(r.blob, `priism-${((q && q.sym) || "chart").replace(/[^\w-]+/g, "")}.png`); flash("Snapshot saved to your downloads");
    }).catch(() => flash("Couldn't take a snapshot"));
    return { ok: true };
  }
  if (!(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id)) window.__bdAction = (k) => (k === "record" ? doRecord() : k === "snapshot" ? doSnap() : { ok: false });   // desktop app panel

  // ---------- Focus mode ----------
  // Fades the wallpaper away (and pauses it) so only your chart is left; "everything" also drops all styling.
  // Trading info (P&L, goal bar, session timer, brackets) stays, since that's what you're focusing on.
  const focusAll = () => !!(cfg.enabled && cfg.focus && cfg.focusHides === "all");
  function applyFocus() {
    const h = document.documentElement, f = !!(cfg.enabled && cfg.focus);
    h.classList.toggle("bd-focus", f);
    const wantOn = cfg.enabled && !focusAll();
    if (h.classList.contains("bd-on") !== wantOn && cfg.enabled) { h.classList.toggle("bd-on", wantOn); h.classList.toggle("bd-panels", wantOn && !!panelApplied); repaint(); }
  }

  // ---------- session timer ----------
  // Countdown to the next open / close of the market you trade, computed in each exchange's own time zone (so
  // daylight-saving changes are handled). No data is fetched; these are the regular trading hours.
  const MARKETS = {
    cme: { name: "CME futures", main: ["NY"], sessions: [
      { id: "NY", label: "NY session", tz: "America/New_York", days: [1, 2, 3, 4, 5], open: 570, close: 960 },
      { id: "GX", label: "Globex", tz: "America/New_York", days: [0, 1, 2, 3, 4], open: 1080, close: 1020, overnight: true }] },
    nyse: { name: "US stocks", main: ["NY"], sessions: [
      { id: "NY", label: "NY", tz: "America/New_York", days: [1, 2, 3, 4, 5], open: 570, close: 960 }] },
    london: { name: "London", main: ["LDN"], sessions: [
      { id: "LDN", label: "London", tz: "Europe/London", days: [1, 2, 3, 4, 5], open: 480, close: 990 }] },
    tokyo: { name: "Tokyo", main: ["TKY"], sessions: [
      { id: "TKY", label: "Tokyo", tz: "Asia/Tokyo", days: [1, 2, 3, 4, 5], open: 540, close: 900 }] },
    forex: { name: "Forex", main: ["TKY", "LDN", "NY"], sessions: [
      { id: "TKY", label: "Tokyo", tz: "Asia/Tokyo", days: [1, 2, 3, 4, 5], open: 540, close: 1080 },
      { id: "LDN", label: "London", tz: "Europe/London", days: [1, 2, 3, 4, 5], open: 480, close: 1020 },
      { id: "NY", label: "New York", tz: "America/New_York", days: [1, 2, 3, 4, 5], open: 480, close: 1020 }] },
    crypto: { name: "Crypto", daily: true },
  };
  const tzFmt = {};
  function wall(ts, tz) {           // the wall-clock time in a zone: { y, m, d, dow, mins }
    const f = tzFmt[tz] || (tzFmt[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "numeric", minute: "numeric" }));
    const o = {}; for (const p of f.formatToParts(new Date(ts))) o[p.type] = p.value;
    return { y: +o.year, m: +o.month, d: +o.day, dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday), mins: +o.hour * 60 + +o.minute };
  }
  function zoned(y, m, d, mins, tz) {   // a zone's wall time -> real timestamp
    let ts = Date.UTC(y, m - 1, d, Math.floor(mins / 60), mins % 60);
    for (let i = 0; i < 2; i++) { const w = wall(ts, tz); ts -= (Date.UTC(w.y, w.m - 1, w.d, Math.floor(w.mins / 60), w.mins % 60) - Date.UTC(y, m - 1, d, Math.floor(mins / 60), mins % 60)); }
    return ts;
  }
  function sessionTimes(s, now) {        // this week's [open, close] timestamps of a session around now
    const out = [];
    for (let k = -2; k <= 8; k++) {
      const w = wall(now + k * 864e5, s.tz); if (!s.days.includes(w.dow)) continue;
      const o = zoned(w.y, w.m, w.d, s.open, s.tz);
      const c = s.overnight ? (() => { const n = wall(o + 864e5, s.tz); return zoned(n.y, n.m, n.d, s.close, s.tz); })() : zoned(w.y, w.m, w.d, s.close, s.tz);
      out.push([o, c]);
    }
    return out;
  }
  function autoMarket() {
    const q = parseTitle(), sym = String((q && q.sym) || "").toUpperCase();
    if (/USDT|USDC|BTC|ETH|SOL|XRP|DOGE|PERP/.test(sym)) return "crypto";
    if (/\d!$|1!|2!/.test(sym) || /^(NQ|ES|YM|RTY|MNQ|MES|GC|SI|CL|NG|ZB|ZN|6E|MGC|MCL)/.test(sym)) return "cme";
    if (/^(EUR|GBP|AUD|NZD|USD|CHF|CAD|JPY)[A-Z]{3}$/.test(sym)) return "forex";
    return "nyse";
  }
  const dur = (ms) => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h >= 1 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(x).padStart(2, "0")}s`; };
  function timerText(now = Date.now()) {
    const key = cfg.timerMarket === "auto" ? autoMarket() : cfg.timerMarket, M = MARKETS[key] || MARKETS.nyse;
    if (M.daily) { const n = new Date(now), next = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1); return { open: true, name: M.name, text: `Daily close in ${dur(next - now)}` }; }
    const open = [], events = [];
    for (const s of M.sessions) for (const [o, c] of sessionTimes(s, now)) {
      if (now >= o && now < c && !open.includes(s.label)) open.push(s.label);
      if (M.main.includes(s.id)) { if (o > now) events.push([o, s.label + " opens"]); if (c > now) events.push([c, s.label + " closes"]); }
    }
    // fully closed (weekend, CME daily break): the soonest reopening of ANY session matters most
    if (!open.length) for (const s of M.sessions) for (const [o] of sessionTimes(s, now)) if (o > now) events.push([o, s.label + " opens"]);
    events.sort((a, b) => a[0] - b[0]);
    const nx = events[0], head = open.length ? open.join(" + ") + " open" : "Closed";
    if (!nx) return { open: !!open.length, name: M.name, text: head };
    const far = nx[0] - now > 864e5, sess = M.sessions.find((s) => nx[1].startsWith(s.label));
    const when = far ? new Intl.DateTimeFormat("en-US", { timeZone: sess.tz, weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(nx[0])) : `in ${dur(nx[0] - now)}`;
    return { open: !!open.length, name: M.name, text: `${head} \u00B7 ${nx[1]} ${when}` };
  }
  // ---------- trading sounds (src/sounds.js) ----------
  // Only the page that owns the chart plays, and with several TradingView tabs open only one of them: the first to
  // claim the event in this site's storage.
  const soundsPlayed = new Set();
  function sound(kind, level, key) {
    if (!level || level === "off" || !cfg.enabled || !owner || standDown || !window.PriismSounds) return;
    const k = dayKey() + ":" + key;
    if (soundsPlayed.has(k)) return; soundsPlayed.add(k);
    try { if (localStorage.getItem("bdSoundLast") === k) return; localStorage.setItem("bdSoundLast", k); } catch {}
    window.PriismSounds.play(kind, level);
  }
  // Session heads-up: 5 minutes before the market you trade opens or closes, and when it does (same market as the timer).
  setInterval(() => {
    if (!cfg.enabled || !cfg.timerOn || !cfg.sessionSound || cfg.sessionSound === "off" || !owner || standDown || IN_FRAME) return;
    const key = cfg.timerMarket === "auto" ? autoMarket() : cfg.timerMarket, M = MARKETS[key];
    if (!M || M.daily) return;
    const now = Date.now();
    for (const sn of M.sessions) if (M.main.includes(sn.id)) for (const pair of sessionTimes(sn, now)) for (const ev of pair) {
      const until = ev - now;
      if (until > 0 && until <= 300000 && until > 240000) sound("heads", cfg.sessionSound, "h" + ev);
      else if (until <= 0 && until > -60000) sound("bell", cfg.sessionSound, "b" + ev);
    }
  }, 5000);

  let timerEl = null, timerIv = 0;
  function renderTimer() {
    if (!(cfg.enabled && cfg.timerOn)) { if (timerEl) { timerEl.remove(); timerEl = null; } clearInterval(timerIv); timerIv = 0; return; }
    if (!timerEl) {
      timerEl = document.createElement("div"); timerEl.id = "bd-timer"; timerEl.dataset.bdOwner = ME.token;
      timerEl.innerHTML = '<i></i><b></b><span></span>';
      document.documentElement.appendChild(timerEl);
    }
    timerEl.style.setProperty("--tc", upColor());
    tickTimer(); placeTimer();
    if (!timerIv) timerIv = setInterval(() => { if (!document.hidden) tickTimer(); }, 1000);
  }
  function tickTimer() {
    if (!timerEl) return;
    let t; try { t = timerText(); } catch { t = { open: false, name: "", text: "" }; }
    timerEl.classList.toggle("bd-t-open", t.open);
    const b = timerEl.querySelector("b"), sp = timerEl.querySelector("span");
    if (b.textContent !== t.name) b.textContent = t.name;
    if (sp.textContent !== t.text) sp.textContent = t.text;
  }
  function placeTimer() {
    if (!timerEl) return;
    // Along the bottom, just above the time axis: the top of the chart belongs to TradingView's legend (symbol,
    // prices, indicators), which grows as you add things, so anything up there ends up covering it.
    const r = chartsBox(), st = timerEl.style, pos = ["bl", "bc", "br"].includes(cfg.timerPos) ? cfg.timerPos : "bc";
    const bottom = innerHeight - r.bottom + 30 + 12 + (cfg.goalOn && (cfg.goalPos || "bl") === "bl" && pos === "bl" ? 86 : 0);
    st.left = st.right = st.top = st.transform = ""; st.bottom = bottom + "px";
    if (pos === "bl") st.left = r.left + 16 + "px";
    else if (pos === "br") st.right = innerWidth - r.right + 80 + "px";
    else { st.left = r.left + r.width / 2 + "px"; st.transform = "translateX(-50%)"; }
  }
  function drawTimerOverlay(g, box, dpr) {
    if (!timerEl || !timerEl.isConnected) return;
    const r = timerEl.getBoundingClientRect(); if (r.width < 2) return;
    const x = (r.left - box.left) * dpr, y = (r.top - box.top) * dpr, w = r.width * dpr, h = r.height * dpr, col = upColor();
    g.save(); rr(g, x, y, w, h, h / 2); g.fillStyle = "rgba(8,11,18,.78)"; g.fill(); g.lineWidth = dpr; g.strokeStyle = col + "8c"; g.stroke();
    g.beginPath(); g.arc(x + 14 * dpr, y + h / 2, 3.5 * dpr, 0, Math.PI * 2); g.fillStyle = timerEl.classList.contains("bd-t-open") ? col : "#8a93a6"; g.fill();
    g.textBaseline = "middle"; g.textAlign = "left";
    g.font = `800 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`; g.fillStyle = "rgba(223,229,241,.65)";
    const name = timerEl.querySelector("b").textContent; g.fillText(name, x + 24 * dpr, y + h / 2);
    const nw = g.measureText(name).width;
    g.font = `700 ${12 * dpr}px ui-monospace, Menlo, Consolas, monospace`; g.fillStyle = "#eef1f7"; g.fillText(timerEl.querySelector("span").textContent, x + 24 * dpr + nw + 10 * dpr, y + h / 2);
    g.restore();
  }

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
    if (cur && cur.id === ME.id && cur.token !== ME.token) handedFrom = cur.token;   // our own earlier copy (update / reload)
    writeOwner(); owner = true; return true;
  }
  let handedFrom = "";
  // remove anything drawn by another (older) copy, now and later
  const mine = (el) => el.dataset && el.dataset.bdOwner === ME.token;
  // After the extension updates or reloads, this copy's connection to the extension is gone (the panel can't reach
  // it any more) and the background worker injects a fresh copy into the tab — so a dead copy hands over to it.
  const ctxDead = () => !!EXT && !(chrome.runtime && chrome.runtime.id);
  const shouldYield = () => { const cur = readOwner();
    return !!cur && cur.token !== ME.token && Date.now() - cur.ts < 6000 &&
      (verCmp(cur.ver, ME.ver) > 0 || (cur.id === ME.id && ctxDead())); };
  function yieldPage() {
    standDown = true; teardown(); if (wmEl) { wmEl.remove(); wmEl = null; }
    if (timerEl) { timerEl.remove(); timerEl = null; } clearInterval(timerIv); timerIv = 0;
    if (goalEl) { goalEl.remove(); goalEl = null; }
    const tip = document.getElementById("bd-tip"); if (tip && tip.dataset.bdOwner === ME.token) tip.remove();
    if (dlgObs) { dlgObs.disconnect(); dlgObs = null; }
  }
  function sweep() {
    for (const el of document.querySelectorAll("#bd-layer, #bd-wm, #bd-timer, #bd-goal, #bd-pnl")) if (!mine(el)) { el.remove(); if (/^bd-(layer|wm)$/.test(el.id) && el.dataset.bdOwner !== handedFrom) reportDuplicate(); }
  }
  new MutationObserver(() => { if (!owner || standDown) return; if (shouldYield()) return yieldPage(); sweep(); }).observe(document.documentElement, { childList: true });
  setInterval(() => {
    if (!owner || standDown) return;
    if (shouldYield()) return yieldPage();                                       // a newer / live copy took over
    writeOwner();                                                                // heartbeat
  }, 2000);

  // Only switch on in a frame that actually contains a TradingView-style chart (tradingview.com, or a
  // platform's embedded chart iframe). Other frames / pages of an enabled site are left untouched.
  // Advanced Charts (.chart-container) OR Lightweight Charts (.tv-lightweight-charts) — the wallpaper layer and
  // activation work for both; the candle recolour engine for each lives in hook.js / lw.js respectively.
  const CHART_SEL = ".chart-markup-table, .chart-container, [data-bd-lwroot], .tv-lightweight-charts, [class*='lightweight']";
  const bigChart = () => [...document.querySelectorAll(CHART_SEL)].some((el) => { const r = el.getBoundingClientRect(); return r.width >= 400 && r.height >= 250; });
  function whenChart(start) {
    const go = () => { if (!claim()) return; sweep(); start(); setTimeout(announceFrame, 300); };
    if (bigChart()) return go();
    // charts render late and small widgets (mini charts) never qualify; check for a while
    // keep checking (login-gated / single-page apps can show the chart much later), slower after the first 3 minutes
    let iv = setInterval(() => { if (bigChart()) { clearInterval(iv); go(); } }, 500);
    setTimeout(() => { if (!bigChart()) { clearInterval(iv); iv = setInterval(() => { if (bigChart()) { clearInterval(iv); go(); } }, 2000); } }, 180000);
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    whenChart(() => chrome.storage.local.get(DEFAULTS, (stored) => { cfg = { ...DEFAULTS, ...stored }; build(); pushCandles(); pushFx(); renderWatermark(); applyFocus(); renderTimer(); applyPrivacy(); }));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      // today's total is shared between tabs (and reset from the panel); the journal is just stored data
      if (changes.dayPnl) { const nv = changes.dayPnl.newValue; day = nv && nv.date ? { ...freshDay(), ...nv } : freshDay(); renderGoal(); }
      const keys = Object.keys(changes).filter((k) => k !== "dayPnl" && k !== "journal");
      for (const k of keys) cfg[k] = changes[k].newValue;
      if (keys.length) apply(keys);
    });
  } else {
    // Desktop app: host injects window.__BD_CFG and calls window.__bdUpdate on change.
    cfg = { ...DEFAULTS, ...(window.__BD_CFG || {}) };
    build();
    pushCandles();
    pushFx();
    renderWatermark(); applyFocus(); renderTimer(); applyPrivacy();
    window.__bdUpdate = (next) => {
      const keys = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cfg[k]));
      cfg = { ...cfg, ...next };
      if (keys.length) apply(keys);
    };
  }
})();
