(function () {
  // One copy per extension instance per page. The background re-injects us after an update (old copies can't talk to
  // the panel any more); if this copy of the extension is already running here, don't start a second one.
  if (window.__bdContentAlive) return;
  window.__bdContentAlive = true;
  const DEFAULTS = {
    enabled: true,
    skin: "aurora",        // built-in id, or "media"
    mediaId: null,         // id of an item in `media` when skin === "media"
    media: [],             // [{ id, name, type: "image"|"video", src }]
    loadouts: [],
    // Tune
    opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
    fps: "auto", fit: "cover", posX: 50, posY: 50,
    res: "standard",       // wallpaper sharpness: standard (light) | sharp (your screen's size) | ultra (every pixel, up to 4K)
    powerSaver: false, paused: false, bw: false,
    layer: "behind",       // "behind" | "over"
    // Candles
    candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
    candleLook: "solid", candleClosedLook: "", shiftSpeed: 10, // solid | neon | prism | shift
    // Candle parts (Candles > Candle parts): wick / border colours, hollow bodies, widths
    candleWick: "same", candleWickUp: "#9aa4b8", candleWickDown: "#9aa4b8", candleBorder: "none", candleBorderUp: "#ffffff", candleBorderDown: "#ffffff", candleBorderW: 1, candleHollow: "none", candleWickW: 0, candleBodyW: 1, candleFxCore: "off", candleFxEdge: "off", candleFxAmt: 0.65,
    chartColors: "auto",   // several charts: "same" | "wallpaper" (each matches its own) | "custom" (chartCustom) | "auto" (wallpaper once Match is used)
    chartStyle: {},        // Style each chart: { 2: { candleUp, candleLook, indMode... }, ... } (only what differs from yours)
    skinOpts: {},          // each built-in wallpaper's own settings + recolour: { twinkle: { amount: 1.4, rc: { c: [...], s: 0.8 } } }
    // Behaviour: react to the market / your own P&L (entry typed in by the user; never reads the account)
    react: "off",          // "off" | "market" (day's move) | "momentum" (last 10 minutes) | "pnl" | "music"
    reactStrength: 0.6,
    moodLook: "glow",      // glow | horizon | frame
    moodRange: 1,          // Day's move: full glow at this % (Recent move: a quarter of it)
    moodPulse: "soft",     // pulse on each price tick / beat: off | soft | strong
    // Music (Glow follows: Music): what moves (g glow, w wallpaper, f chart frame, i interface skin), how it feels
    // (punchy: quick kicks | smooth: longer swells) and how easily a beat counts (low | normal | high)
    musicParts: "gwfi", musicFeel: "punchy", musicSens: "normal",
    // Pattern skins. Chart frame: a patterned band along each chart's edges (where Live mood glows). Colours: accent |
    // candles | gradient (frameColor → frameColor2) | rainbow | custom | mood (the Live mood colour, lit by it)
    frameOn: false, framePattern: "carbon", frameMode: "accent", frameColor: "#7c6cff", frameColor2: "#ff4df0", frameW: 8, frameAlpha: 0.5,
    frameSize: 1, frameRound: true, frameEdge: true, frameMove: false,
    // Live candle atmosphere (Chart › Candle FX): drawn behind the chart, at the live candle. atmoFx: off | smoke | vapor
    // | mist; atmoTrail: Afterimage; atmoAura: a soft light round the live candle. Colour: candle | wallpaper | custom.
    atmoFx: "off", atmoTrail: false, atmoAura: false, atmoColor: "candle", atmoCustom: "#7df9ff", atmoOpacity: 0.15, atmoLen: 4, atmoFade: 450,
    // Zone lights (Chart › Lines, zones & labels): any of near (Proximity glow), ripple (Contact ripple), flow (Liquid
    // border), dir (Directional light), fusion (Zone fusion)
    zoneFx: [],
    // Picture: Smart dim off | soft | strong (shades only the bright parts of the wallpaper, behind each chart's price
    // area; adds to Dim). Vignette centred on the screen, or on the live price (vignetteAt: screen | live)
    smartDim: "off", vignetteAt: "screen",
    // ...and over TradingView's bars (top bar, drawing toolbar, right panels, bottom bar): faint, never in the way of a
    // click, so every tool stays clear. barWhere: any of t l r b
    barPatOn: false, barPattern: "zebra", barMode: "rainbow", barColor: "#7c6cff", barColor2: "#ff4df0", barAlpha: 0.25, barSize: 1, barWhere: "tlrb",
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
    toggleKey: "Alt+Shift+KeyW", focusKey: "Alt+Shift+KeyF", recordKey: "Alt+Shift+KeyV", snapKey: "Alt+Shift+KeyS",
    lensKey: "Alt+Shift+KeyZ", lensZoom: 2.5, lensSize: "m",
    // Trade panel (TradingView tab): Buy / Sell buttons + the order ticket. Colours: candles (your up / down) | custom
    zoneReact: "off",      // Chart › Lines, zones & labels › Price in a zone: off | glow | strong (a zone price is in lights up)
    pnStyle: "flat", pnRound: false, pnWindows: true,   // Bars & panels › Panel style: flat | glass | neon | outline | aurora, rounded corners, also on windows & menus
    tpOn: false, tpColors: "candles", tpBuy: "#2962ff", tpSell: "#f23645", tpShape: "rounded", tpStyle: "solid", tpPanel: "keep",   // Magnifier: its shortcut, how much it zooms, how big the lens is
    clipLen: 10,              // seconds a shortcut recording lasts (the Clip section's length)
    focus: false, focusHides: "wallpaper",   // Focus mode: hide just the wallpaper, or the wallpaper AND all styling
    // Session timer: a slim countdown to the next market open / close, styled to match your look.
    timerOn: false, timerMarket: "auto", timerPos: "bc",
    timerShow: "full",      // full = "NY session open · closes in 1h 20m" | next = just "closes in 1h 20m" (no open / closed status)
    timerFormat: "in",      // in = a countdown ("in 1h 20m") | at = the time it happens ("at 4:00 PM", your time)
    timerClosed: "show",    // show | hide: hide the timer while the market is closed
    timerStyle: "pill",     // pill | glass (a card: big countdown + how far into the session you are) | minimal (glowing text only)
    // Streamer mode: hides your money on screen and in every recording (labels on the chart, Priism's readouts,
    // TradingView's account / order panels). privacyPeek = un-blur a panel while your mouse is over it.
    privacy: false, privacyPeek: false, privacyKey: "Alt+Shift+KeyP",
    privacyAcct: true, privacyOrder: false,   // which TradingView panels get blurred
    privacyPnl: "hide",    // trade-label P&L in Streamer mode: hide | ticks (money hidden) | points | show
    bracketQty: "",        // colour of the lot-size pill on your brackets
    // Auto trade clips: while a trade is open, keep the last tradeClipLen seconds ready; save a clip when it closes.
    tradeClipOn: false, tradeClipLen: 30,
    invite: null, pass: "", deviceId: "",             // invite only: { code, ok, status, checked } (see src/invite.js)
    clipQuality: "balanced",  // high | balanced | small (small keeps a clip under ~20 MB, e.g. for Discord)           // after a recording: open the crop / trim editor (false = download right away)
    // Chart styling — each part off = TradingView's own. Colour "" = skin colour, "candle" = your up-candle colour.
    // Indicator colours: own (TradingView's / the platform's) | rainbow | candles | wallpaper | custom (+ indColor)
    indMode: "own", indColor: "", indCustom: {}, markMode: "own", markColor: "#ffd166",
    drawOn: false,            // your own drawings (rectangles, zones you draw) follow the indicator colours too
    zoneFill: 0.12,           // how see-through recoloured zones are (4%..45%): soft keeps the price readable
    zoneShape: "square", zoneBorder: "line", zoneStyle: "flat",   // zoneStyle: flat | fade | shine | glass | hollow   // zone boxes: square | rounded | pill ; border: line | dashed | double | glow | none
    zoneDim: false,           // also soften zones that keep their own colours
    indGrad: [],              // your own Gradient colours (2-3); empty = the built-in gradients
    wallMatch: null,          // { src, colors }: the wallpaper colours Match everything measured (sharper than the chart's own sample)
    // Chart text: text indicators draw ON the chart (labels, levels, values, prints). own | readable | custom | candle,
    // outline 0 off / 1 soft / 2 strong, size 0 normal / 1 large / 2 XL
    txtMode: "own", txtColor: "", txtOutline: 0, txtSize: 0,
    gridOn: false, gridColor: "", gridAlpha: 0.35, gridW: 0, gridStyle: "dotted",
    chOn: false, chColor: "", chW: 0, chStyle: "dashed", chGlow: false, chGlowColor: "", chLabels: false,
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
    goalGuard: false,      // max-loss reminder: a calm "Done for today" card the moment today's loss reaches your max loss
    // the ticker in the chart's top-left legend (symbol name, timeframe, exchange)
    tkOn: false, tkColor: "", tkSize: 1, tkFont: "default", tkGlow: false, tkOnly: false,
    // the legend: indicator names / values and O H L C at the top left. lgColor "" = readable white/black for the
    // wallpaper, "candle" or "#hex"; lgVals own = coloured values keep their colour, all = everything takes lgColor;
    // lgBack none | shade | glass = a backing behind each legend row (an outline on platforms with their own legend)
    lgOn: false, lgColor: "", lgVals: "own", lgBack: "none",
    welcomePending: 0,     // set on first install: show the welcome card on the chart once
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
    bracketDebug: false,  // records caught pills to window.__bdBracketDebug for troubleshooting (Diagnose turns it on; no data leaves)
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
    if (!all.length && TDV) all = [...document.querySelectorAll("[data-bd-tdvpane]")];   // Tradovate: where its WebGL charts are (see tdvPanes)
    return all
      .filter((el) => !all.some((o) => o !== el && o.contains(el)))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 80 && r.height > 60)
      .sort((a, b) => (Math.abs(a.r.top - b.r.top) > 20 ? a.r.top - b.r.top : a.r.left - b.r.left));
  }
  const LW_SEL = "[data-bd-lwroot], .tv-lightweight-charts, [class*='lightweight']";
  let charts = [];
  // Tradovate: always one wallpaper per chart, under that chart only (its panels and lists stay as they are)
  const tiled = () => (TDV && charts.length >= 1) || (charts.length > 1 && (cfg.multi !== "span" || lwMulti()));
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
  // Tradovate draws its charts with WebGL into one canvas as big as the window (no chart elements to find). hook.js
  // publishes where each chart's background is cleared (<html data-bd-tdv-panes>, CSS px) and makes those clears
  // see-through while Priism is on; here an invisible box marks each of them, so the usual per-chart wallpaper tiles
  // go exactly under the charts.
  const TDV = !IN_FRAME && /(^|\.)tradovate\.com$/.test(location.hostname);
  function tdvPanes() {
    let list = []; try { list = JSON.parse(document.documentElement.getAttribute("data-bd-tdv-panes") || "[]"); } catch {}
    const have = [...document.querySelectorAll("[data-bd-tdvpane]")];
    list.forEach(([x, y, w, h], i) => { let el = have[i];
      if (!el) { el = document.createElement("div"); el.setAttribute("data-bd-tdvpane", ""); el.setAttribute("aria-hidden", "true"); document.documentElement.appendChild(el); }
      el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;pointer-events:none;visibility:hidden`; });
    have.slice(list.length).forEach((el) => el.remove());
    try { if (layer) trackLayout(); } catch {}        // (before the layer exists: nothing to move yet)
  }
  if (TDV) { document.documentElement.classList.add("bd-tdv"); tdvPanes();
    new MutationObserver(tdvPanes).observe(document.documentElement, { attributes: true, attributeFilter: ["data-bd-tdv-panes"] }); }
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
  let overOrder = false, holdOn = false, holdOff = 0;   // trade focus (see syncHold)

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

  // ---------- Music: the glow and the wallpaper move with the music you're playing ----------
  // You choose the tab (or, on Windows / ChromeOS, the whole screen) playing your music in the browser's own picker,
  // with "Share audio" ticked. Priism only measures how loud the bass and the whole mix are, a few dozen times a second:
  // nothing is recorded, played back or sent anywhere, and the picture of what you shared is dropped straight away.
  let music = null, musicAsk = null;
  const musicWanted = () => cfg.enabled && cfg.react === "music" && !!layer;
  function syncMusic() { if (!musicWanted()) { stopMusic(); cancelMusicAsk(); return; } if (!music && !musicAsk) showMusicAsk(); }
  function cancelMusicAsk() { if (musicAsk) { musicAsk.remove(); musicAsk = null; } }
  function showMusicAsk(again) {
    if (window.top !== window && !layer) return;
    const card = document.createElement("div"); card.id = "bd-musicask"; musicAsk = card;
    card.className = "bd-ui-card"; card.style.cssText = "top:70px";
    const txt = document.createElement("span"); txt.textContent = again ? "Priism Skins \u00B7 the music stopped. Listen again?" : "Priism Skins \u00B7 move with your music";
    const go = document.createElement("button"), no = document.createElement("button");
    go.textContent = "Choose the music tab"; no.textContent = "Not now"; go.className = "bd-ui-btn pri"; no.className = "bd-ui-btn";
    card.append(txt, go, no); document.documentElement.appendChild(card);
    no.onclick = cancelMusicAsk;
    go.onclick = async () => {
      let stream;
      try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, systemAudio: "include", selfBrowserSurface: "exclude", preferCurrentTab: false }); }
      catch (e) { txt.textContent = "Not started: sharing was cancelled or isn't allowed here."; go.remove(); setTimeout(cancelMusicAsk, 3500); return; }
      stream.getVideoTracks().forEach((t) => t.stop());            // only the sound is used
      if (!stream.getAudioTracks().length) { txt.textContent = "No sound came through: pick the tab playing your music and tick \u201cShare tab audio\u201d."; go.textContent = "Try again"; return; }
      cancelMusicAsk(); startMusic(stream);
    };
  }
  // Music: the sound of the tab you shared is analysed here (nothing is recorded or sent). Every screen frame:
  //  - three bands (bass 40-160 Hz, mids 300-2000 Hz, highs 4-11 kHz), unsmoothed, with an auto level so quiet and
  //    loud songs both move fully;
  //  - beats = sudden rises in the bass (spectral flux) above the song's own recent average (Sensitivity), at most one
  //    every ~170 ms; hats / snares = the same in the highs;
  //  - envelopes that jump up instantly on a beat and fall back over ~160 ms (Punchy) or ~380 ms (Smooth).
  // What moves (Music › Moves): the glow, the wallpaper (a brighter, slightly zoomed kick), the chart frame and the
  // interface skin.
  const MUSIC_SENS = { low: 2.2, normal: 1.5, high: 1.05 };
  const musicParts = () => String(cfg.musicParts == null ? "gwfi" : cfg.musicParts);
  function startMusic(stream) {
    stopMusic();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" }), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
      an.fftSize = 1024; an.smoothingTimeConstant = 0; an.minDecibels = -85; an.maxDecibels = -20; src.connect(an);   // not connected to the speakers: no echo
      const bins = new Uint8Array(an.frequencyBinCount), prev = new Uint8Array(an.frequencyBinCount), hz = ac.sampleRate / an.fftSize;
      const rng = (a, b) => [Math.max(1, Math.round(a / hz)), Math.max(Math.round(a / hz) + 1, Math.round(b / hz))];
      const B = rng(40, 160), M = rng(300, 2000), H = rng(4000, 11000);
      const mean = (r) => { let x = 0; for (let i = r[0]; i <= r[1]; i++) x += bins[i]; return x / ((r[1] - r[0] + 1) * 255); };
      const flux = (r) => { let x = 0; for (let i = r[0]; i <= r[1]; i++) { const d = bins[i] - prev[i]; if (d > 0) x += d; } return x / ((r[1] - r[0] + 1) * 255); };
      const hist = (n) => ({ a: new Float32Array(n), i: 0, n: 0 }), push = (h, v) => { h.a[h.i] = v; h.i = (h.i + 1) % h.a.length; h.n = Math.min(h.a.length, h.n + 1); };
      const thr = (h, k, floor) => { if (h.n < 8) return 1; let m = 0; for (let i = 0; i < h.n; i++) m += h.a[i]; m /= h.n; let v = 0; for (let i = 0; i < h.n; i++) v += (h.a[i] - m) ** 2; return Math.max(floor, m + k * Math.sqrt(v / h.n)); };
      const fb = hist(48), fh = hist(48);   // ~0.8 s of flux at 60 fps
      music = { stream, ac, level: 0, kick: 0, hat: 0, bass: 0, mid: 0, high: 0, peak: 0.25, last: 0, lastHat: 0, t: performance.now(), raf: 0, timer: 0 };
      const step = () => {
        if (!music) return;
        const now = performance.now(), dt = Math.min(0.1, (now - music.t) / 1000); music.t = now;
        an.getByteFrequencyData(bins);
        const bass = mean(B), mid = mean(M), high = mean(H), fB = flux(B), fH = flux(H); prev.set(bins);
        const sens = MUSIC_SENS[cfg.musicSens] || MUSIC_SENS.normal;
        // auto level: the loudest the bass has been lately (falls back over a few seconds)
        music.peak = Math.max(bass, music.peak * Math.exp(-dt / 4), 0.08);
        const norm = Math.min(1, bass / music.peak);
        const beat = fB > thr(fb, sens, 0.025) && bass > 0.1 && now - music.last > 170; push(fb, fB);
        const hat = fH > thr(fh, sens + 0.3, 0.03) && high > 0.06 && now - music.lastHat > 90; push(fh, fH);
        const tau = cfg.musicFeel === "smooth" ? 0.38 : 0.16;
        if (beat) music.last = now;
        if (hat) music.lastHat = now;
        music.kick = beat ? 1 : music.kick * Math.exp(-dt / tau);
        music.hat = hat ? 1 : music.hat * Math.exp(-dt / 0.09);
        music.bass = bass; music.mid = mid; music.high = high;
        // the overall level: the bass's shape plus the kick on top, never jittery (follows quickly, falls back softly)
        const target = Math.min(1, norm * 0.55 + music.kick * 0.6);
        music.level += (target - music.level) * (target > music.level ? 0.8 : Math.min(1, dt / (tau * 0.9)));
        updateReact(beat ? 1 : 0);
        musicFx();
      };
      const loop = () => { if (!music) return; step(); music.raf = requestAnimationFrame(loop); };
      music.raf = requestAnimationFrame(loop);
      music.timer = setInterval(() => { if (music && document.hidden) step(); }, 50);   // a hidden tab gets no frames: keep the analysis running
      document.documentElement.classList.add("bd-musicon");
      stream.getAudioTracks().forEach((t) => t.addEventListener("ended", () => { stopMusic(); if (musicWanted()) showMusicAsk(true); }));
    } catch { stopMusic(); }
  }
  // Everything else that moves with the music (the glow itself is in updateReact)
  function musicFx(reset) {
    const parts = reset ? "" : musicParts(), on = !!music && !reset, S = Math.max(0, Math.min(1, +cfg.reactStrength || 0.6));
    const kick = on ? music.kick : 0, L = on ? music.level : 0, hat = on ? music.hat : 0;
    window.PriismBeat = { on, kick, level: L, hat };   // effects over your wallpaper (Bokeh, Sparkles...) swell with it
    const base = Math.max(0, Math.min(0.95, +cfg.dim + (cfg.calm && calmActive ? 0.3 : 0)));
    for (const v of views) {
      // wallpaper: a brighter, slightly bigger kick on every beat
      const w = on && parts.includes("w");
      if (v.dim) v.dim.style.opacity = String(w ? Math.max(0, base - Math.min(0.2, (kick * 0.15 + L * 0.04) * (0.4 + S))) : base);   // never a full flash
      const sc = w ? 1 + kick * 0.016 * (0.3 + S) : 1, ts = sc === 1 ? "" : `scale(${sc.toFixed(4)})`;
      if (v.content && v.content.__mz !== ts) { v.content.__mz = ts; v.content.style.transform = ts; }
      // chart frame: brighter with the level, a flash on the kick, a glint on hats / snares
      const f = v.frame;
      if (f && !f.hidden) {
        const fm = on && parts.includes("f"), a = Math.max(0.05, Math.min(1, +cfg.frameAlpha || 0.5));
        if (fm) { f.style.opacity = String(Math.min(1, a * (0.35 + 0.65 * L) + kick * 0.25 * S)); const fl = `brightness(${(1 + kick * 0.7 * S + hat * 0.25 * S).toFixed(3)})`; if (f.__mf !== fl) { f.__mf = fl; f.style.filter = fl; } }
        else if (f.__mf) { f.__mf = ""; f.style.filter = ""; if (cfg.frameMode !== "mood") f.style.opacity = String(a); }
      }
    }
    // interface skin: the texture swells with the music (dimmer between beats, full on the beat)
    if (barBox) { const im = on && parts.includes("i"), o = im ? String(Math.min(1, 0.4 + L * 0.5 + kick * 0.35 + hat * 0.1).toFixed(3)) : "";
      if (barBox.__mo !== o) { barBox.__mo = o; barBox.style.opacity = o; } }
  }
  // tests only (localStorage bdTest=1): listen to a built-in kick drum instead of a shared tab (headless browsers can't share)
  window.addEventListener("message", (e) => { if (e.source !== window || !e.data || e.data.__bdTest !== "music") return;
    try { if (localStorage.getItem("bdTest") !== "1") return; } catch { return; }
    const ac = new AudioContext(), dst = ac.createMediaStreamDestination();
    setInterval(() => { const t = ac.currentTime + 0.02, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
      { const h = document.documentElement, k = (h.dataset.bdKicks || "").split(",").filter(Boolean).slice(-30); k.push(String(Math.round(performance.now() + 20))); h.dataset.bdKicks = k.join(","); }   // when each test kick sounds
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(dst); o.start(t); o.stop(t + 0.32); }, 500);
    cancelMusicAsk(); startMusic(dst.stream); });
  function stopMusic() {
    if (!music) return;
    clearInterval(music.timer); cancelAnimationFrame(music.raf);
    document.documentElement.classList.remove("bd-musicon");
    try { music.stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { music.ac.close(); } catch {}
    music = null; mood = 0; musicFx(true); updateReact(0); applyLook();
  }
  // Recent move: prices seen in the last ~15 minutes (from the tab title or the chart's price tag)
  const priceHist = [];
  let histSym = "";
  function notePrice(p, sym) { const now = Date.now(); if (!isFinite(p) || p <= 0) return; let L = priceHist[priceHist.length - 1];
    // another symbol (or a jump no real minute makes): start the history over
    if (sym !== histSym || (L && Math.abs(p - L.p) / L.p > 0.03)) { priceHist.length = 0; histSym = sym; L = null; }
    if (!L || L.p !== p || now - L.t > 20000) priceHist.push({ t: now, p }); while (priceHist.length && now - priceHist[0].t > 15 * 60000) priceHist.shift(); if (priceHist.length > 2000) priceHist.splice(0, 500); }
  let moodSide = 1;   // which colour the glow shows: it only flips once the move clearly changes side (no flicker at 0)
  const moodEls = () => views.length ? views.map((v) => v.mood).filter(Boolean) : reactEl ? [reactEl] : [];
  function updateReact(tick) {
    if (!reactEl) return;
    let active = cfg.react !== "off" && (!!quote || cfg.react === "pnl" || cfg.react === "music");
    let label = "";
    const range = Math.max(0.1, Math.min(5, +cfg.moodRange || 1));
    if (quote && isFinite(quote.price)) notePrice(quote.price, quote.sym || "");
    if (!active) mood = 0;
    else if (cfg.react === "music") { active = !!music; mood = music ? music.level : 0; }   // 0..1 with the music's energy
    else if (cfg.react === "market") { mood = clamp(quote.chg / range); }      // full glow at your Sensitivity (1% day move)
    else if (cfg.react === "momentum") {                                        // the last 10 minutes
      const now = Date.now(), old = priceHist.find((q) => now - q.t <= 10 * 60000) || priceHist[0];
      mood = old && quote && old.p ? clamp(((quote.price - old.p) / old.p) * 100 / (range / 4)) : 0;
    } else {
      const p = readPnl();
      if (!p) { active = false; mood = 0; }                                       // no open position on the chart
      else {
        mood = clamp(p.v / pnlMaxAbs);
        const unit = p.unit && p.unit.length === 1 ? p.unit : "", code = p.unit && p.unit.length > 1 ? " " + p.unit : "";
        label = `P&L ${p.v >= 0 ? "+" : "\u2212"}${unit}${Math.abs(p.v).toFixed(2)}${code}`;
      }
    }
    const isMusic = cfg.react === "music";
    if (isMusic) moodSide = 1; else if (mood > 0.06) moodSide = 1; else if (mood < -0.06) moodSide = -1;
    const col = isMusic ? (skinAccent() || upColor()) : moodSide > 0 ? upColor() : downColor();
    const k = Math.abs(mood) * cfg.reactStrength;
    // music changes ~30 times a second: only the opacity moves then (cheap); the glow's shape is set once
    const ks = isMusic ? cfg.reactStrength : k, M = window.PriismMood;
    const look = M && M.LOOKS.includes(cfg.moodLook) ? cfg.moodLook : "glow", css = M ? M.css(look, /^#[0-9a-f]{6}$/i.test(col) ? col : "#00e08a", ks, moodSide) : null;
    const op = !active ? 0 : isMusic ? (musicParts().includes("g") ? 0.04 + 0.96 * k : 0) : css ? css.op * Math.min(1, 0.25 + k * 1.2) : 0.15 + 0.85 * k;
    const pulseOn = cfg.moodPulse !== "off", strong = cfg.moodPulse === "strong";
    // Lite (Power saver / Auto easing off / the safety floor): no pulses; restarting one forces a page layout
    const fire = active && tick && pulseOn && !liteNow() && !holdOn && performance.now() - lastPulse > (isMusic ? 150 : 1200);   // fast tickers: max ~1 pulse/1.2s; beats: ~2.5/s at most
    if (fire) lastPulse = performance.now();
    const tcol = isMusic ? col : tick > 0 ? upColor() : downColor();
    for (const el of moodEls()) {
      el.classList.toggle("bd-music", isMusic); el.dataset.look = look;
      el.style.setProperty("--bd-react", col);
      el.style.opacity = String(op);
      if (css) { if (el.__sh !== css.shadow) { el.__sh = css.shadow; el.style.boxShadow = css.shadow; } if (el.__bg !== css.bg) { el.__bg = css.bg; el.style.background = css.bg; } }
      if (fire) { el.style.setProperty("--bd-pulse", tcol); el.style.setProperty("--bd-pulse-op", strong ? "0.9" : "0.45"); el.style.setProperty("--bd-pulse-s", strong ? "90px 30px" : "60px 10px");
        el.classList.remove("bd-pulse"); void el.offsetWidth; el.classList.add("bd-pulse"); }
    }
    // the chart frame in "Live mood" colours: it takes the glow's colour and lights up with it
    if (cfg.frameOn && cfg.frameMode === "mood") for (const v of views) if (v.frame && !v.frame.hidden) {
      v.frame.style.setProperty("--bd-mood-col", col);
      const a = Math.max(0.05, Math.min(1, +cfg.frameAlpha || 0.5)); v.frame.style.opacity = String(active ? a * Math.min(1, 0.35 + op * 0.9) : a * 0.35);
    }
    if (pillEl) {
      pillEl.hidden = !label;
      pillEl.textContent = label;
      pillEl.style.color = col;
      if (label) { const r = chartsBox(); pillEl.style.top = r.top + 8 + "px"; pillEl.style.left = r.right - 80 + "px"; } // pill sits left of the price axis
    }
  }

  // Lightweight Charts platforms (nq.vision…) don't put the price in the tab title. lw.js reads the last-price tag
  // from the chart instead; the day move is measured from the first price seen today on this site.
  setInterval(() => {
    if (!cfg.enabled || parseTitle()) return;
    let q; try { q = JSON.parse(document.documentElement.getAttribute("data-bd-lwquote") || "null"); } catch { q = null; }
    if (!q || !isFinite(q.p) || Date.now() - q.ts > 15000) return;
    const k = "bdLwOpen:" + dayKey(); let open = NaN;
    try { open = +localStorage.getItem(k); if (!open) { open = q.p; localStorage.setItem(k, String(q.p)); } } catch { open = open || q.p; }
    const tick = lastPrice !== null && q.p !== lastPrice ? (q.p > lastPrice ? 1 : -1) : 0;
    quote = { sym: "chart", price: q.p, chg: open ? ((q.p - open) / open) * 100 : 0 }; lastPrice = q.p;
    updateReact(tick);
  }, 1000);
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
  setInterval(() => { if (cfg.react === "pnl") updateReact(0); renderPnl(); }, 2000);
  setInterval(() => { if (cfg.enabled && cfg.react === "momentum") updateReact(0); }, 5000);   // Recent move: older prices age out     // clears the glow when the position closes

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
  // ...and the moment a new P&L is drawn, so the daily bar and the max-loss reminder never lag behind your chart
  new MutationObserver(() => { if (cfg.enabled && cfg.goalOn) tickTrades(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-ws-pnl"] });

  // ---------- auto trade clips ----------
  // Only records while you're in a trade (nothing runs when you're flat). Two overlapping recorders share one
  // picture of the chart; a fresh one starts every N seconds and the oldest is dropped, so the older of the two always
  // holds the last N..2N seconds. When the trade closes (Priism notices a few seconds later), that one is saved, so the
  // clip ends just after the close.
  let tc = null;
  async function tcStart() {
    if (tc || !(cfg.enabled && cfg.tradeClipOn) || typeof MediaRecorder === "undefined" || (EXT && !owner)) return;
    tc = { starting: true };
    // runs for the whole trade, so a little lighter than a clip you record yourself: up to 1280 px on the long side
    const box = chartsBox(), dpr = Math.min(Math.min(2, devicePixelRatio || 1), 1280 / Math.max(1, Math.max(box.width, box.height)));
    const W = Math.max(2, Math.round(box.width * dpr)) & ~1, H = Math.max(2, Math.round(box.height * dpr)) & ~1;
    const cap = document.createElement("canvas"); cap.width = W; cap.height = H; const g = cap.getContext("2d");
    let wmImg = null; try { wmImg = await watermarkImage(); } catch {}
    if (!tc || !tc.starting) return;                                  // stopped while we were getting ready
    try { compositeFrame(g, box, dpr, wmImg); } catch { tc = null; return; }
    const fps = 24; let stream; try { stream = cap.captureStream(fps); } catch { tc = null; return; }
    const mime = clipMime(false);
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
    saveBlob(blob, `priism-trade-${String(trade.sym || "chart").replace(/[^\w-]+/g, "")}${pnl}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}.${clipExt(t.mime)}`);
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
    if (!(cfg.enabled && cfg.goalOn && (T || L))) { if (goalEl) { goalEl.remove(); goalEl = null; } applyGuard(); return; }
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
    applyGuard();
  }
  // ---------- max-loss reminder ----------
  // Opt-in (Trading → Daily goal & limit). The moment today's loss (closed trades + your open position, read from the
  // P&L your chart draws) reaches your max loss, a calm "Done for today" card appears on the chart. Purely visual:
  // nothing on TradingView is blocked. "Got it" hides it for the rest of today (in every tab); it comes back tomorrow.
  let guardEl = null;
  const guardOn = () => !!(cfg.enabled && cfg.goalOn && cfg.goalGuard && +cfg.goalLimit > 0 && day.flags && day.flags.lim && !day.guardOff && !IN_FRAME && owner && !standDown);
  function applyGuard() {
    if (!guardOn()) { if (guardEl) { guardEl.remove(); guardEl = null; } return; }
    if (!guardEl) {
      guardEl = document.createElement("div"); guardEl.id = "bd-guard"; guardEl.dataset.bdOwner = ME.token;
      guardEl.innerHTML = '<i></i><b>Done for today</b><p></p><button type="button">Got it</button>';
      document.documentElement.appendChild(guardEl);
      guardEl.querySelector("button").onclick = () => { day.guardOff = Date.now(); persistDay(); applyGuard(); };
    }
    const L = Math.max(0, +cfg.goalLimit || 0), u = day.unit || (openTrade && openTrade.unit) || "";
    guardEl.querySelector("p").textContent = `You reached your max loss of ${fmtAbs(L, u)}. Step away and come back fresh tomorrow.`;
    placeGuard();
  }
  function placeGuard() {
    if (!guardEl) return;
    // near the top of the chart, clear of TradingView's legend; it never covers the order panel
    const r = chartsBox(), st = guardEl.style;
    st.left = r.left + r.width / 2 + "px"; st.top = r.top + 64 + "px";
  }
  function placeGoal() {
    placeGuard();
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
    applyFrame(); applyBars();
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
      v.vg.__css = vgCss(v); v.vg.style.background = v.vg.__css;
      const content = v.content;
      content.style.filter = f.join(" ");
      if (content.tagName !== "CANVAS") {
        content.style.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[cfg.fit] || "cover";
        content.style.objectPosition = `${cfg.posX}% ${cfg.posY}%`;
      }
      if (content.tagName === "VIDEO") {
        content.playbackRate = Math.max(0.25, Math.min(4, cfg.speed * calmFactor()));
        stillNow() ? content.pause() : content.play().catch(() => {});
      }
      if (content.tagName === "IFRAME") postLook(content);
    }
  }
  // Your own video wallpapers hold still exactly when the built-in ones do (see startLoop): Pause, the tab in the
  // background, Focus, one of TradingView's big windows open, trade focus (at the order ticket / in a trade). They
  // kept playing before: a 4K video went on decoding while you clicked Buy.
  // With Power saver, or when trading is slowed down at Auto quality's lowest level, they also hold still while you use
  // the chart and play again ~0.4 s after, like the built-in ones.
  const stillNow = () => !!(cfg.paused || document.hidden || (cfg.focus && cfg.enabled) || dlgOpen || holdOn
    || ((cfg.powerSaver || heavyNow()) && performance.now() - inputAt < 400));
  let stillWas = null;
  function syncStill() {   // called when one of those changes
    const st = stillNow(); if (st === stillWas) return; stillWas = st;
    for (const v of views) { const c = v.content; if (!c) continue;
      if (c.tagName === "VIDEO") { st ? c.pause() : c.play().catch(() => {}); } else if (c.tagName === "IFRAME") postLook(c); }
  }
  document.addEventListener("visibilitychange", syncStill);

  // Files stored in the extension's database play inside an extension iframe (player/player.html).
  function postLook(frame) {
    if (!frame || frame.tagName !== "IFRAME" || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ __wicked: "look", look: { fit: cfg.fit, posX: cfg.posX, posY: cfg.posY, speed: cfg.speed * calmFactor(), paused: stillNow() } }, "*");
  }

  // ---------- built-in wallpapers drawn off TradingView's main thread ----------
  // Each animated wallpaper canvas is handed to one background worker (OffscreenCanvas), which runs the same skins.js
  // code there. The page only sends "draw frame t" messages, so TradingView keeps its main thread for the chart.
  // Timing, pausing and auto quality stay here unchanged. If a page or browser doesn't allow it, it falls back to
  // drawing on the main thread exactly as before.
  let wallWorker = null, workerBroken = !!window.__bdNoWorker, workerSeq = 0;
  const WORKER_MAIN = `
    const document = { createElement: () => new OffscreenCanvas(2, 2) };
    (__SKINS__)(self, document);
    const V = new Map();
    onmessage = (e) => {
      const m = e.data, v = V.get(m.id);
      try {
        if (m.type === "add") V.set(m.id, { c: m.canvas, skin: m.skin, s: self.PriismMakeSkin(m.skin, m.canvas.getContext("2d"), m.opts) });
        else if (!v) return;
        else if (m.type === "opts") { v.s = self.PriismMakeSkin(v.skin, v.c.getContext("2d"), m.opts); v.s.resize(v.c.width, v.c.height); v.s.frame(m.t || 0, 0); }
        else if (m.type === "resize") { v.c.width = m.w; v.c.height = m.h; v.s.resize(m.w, m.h); v.s.frame(m.t || 0, 0); postMessage({ type: "sized", id: m.id, n: m.n }); }
        else if (m.type === "frame") v.s.frame(m.t, m.dt);
        else if (m.type === "remove") V.delete(m.id);
      } catch (err) {}
      if (m.type === "frame") postMessage({ type: "done", id: m.id });
    };
    postMessage({ type: "ready" });`;
  function getWorker() {
    if (workerBroken || wallWorker) return wallWorker;
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" || !window.__priismSkinsSrc || !HTMLCanvasElement.prototype.transferControlToOffscreen) { workerBroken = true; return null; }
    try {
      const url = URL.createObjectURL(new Blob([WORKER_MAIN.replace("__SKINS__", window.__priismSkinsSrc)], { type: "text/javascript" }));
      const w = new Worker(url); URL.revokeObjectURL(url);
      w.ready = false; w.views = new Map();
      w.onmessage = (e) => { const m = e.data; if (m.type === "ready") w.ready = true; else if (m.type === "done") { const p = w.views.get(m.id); if (p) p.busy = false; }
        else if (m.type === "sized") { const p = w.views.get(m.id); if (p && m.n === p.n && p.onSized) { const f = p.onSized; p.onSized = null; f(); } } };
      // blocked (page rules) or crashed before it started: draw on the main thread instead, from now on
      w.onerror = () => { if (wallWorker === w) { workerBroken = true; wallWorker = null; try { w.terminate(); } catch {} if (layer) build(); } };
      wallWorker = w;
    } catch { workerBroken = true; wallWorker = null; }
    return wallWorker;
  }
  // A stand-in for a skin with the same resize / frame calls, which forwards them to the worker.
  function workerSkin(canvas, skinId, opts) {
    const w = getWorker(); if (!w) return null;
    let off; try { off = canvas.transferControlToOffscreen(); } catch { return null; }
    const id = ++workerSeq, p = { busy: false, dt: 0, lastT: 0, sent: 0, skipped: 0 };
    w.views.set(id, p);
    w.postMessage({ type: "add", id, skin: skinId, opts, canvas: off }, [off]);
    return {
      offThread: true,
      resize(W, H) { p.w = W; p.h = H; p.n = (p.n || 0) + 1; p.pending = true; w.postMessage({ type: "resize", id, w: W, h: H, t: p.lastT, n: p.n }); },
      // resolves once the worker has drawn the wallpaper at its latest size (a painted wallpaper takes a moment)
      whenSized() { if (!p.pending) return Promise.resolve(); return new Promise((r) => { p.onSized = () => { p.pending = false; r(); }; }); },
      // if the worker is still drawing the last frame, don't queue another: the time carries over to the next one
      frame(t, dt) { p.lastT = t; if (p.busy) { p.dt += dt; p.skipped++; return; } p.busy = true; p.sent++; w.postMessage({ type: "frame", id, t, dt: dt + p.dt }); p.dt = 0; },
      // how many frames we had to skip since last asked, because the worker was still drawing (0 = keeping up, 1 = never)
      load() { const n = p.sent + p.skipped, r = n ? p.skipped / n : 0; p.sent = p.skipped = 0; return r; },
      remove() { w.views.delete(id); w.postMessage({ type: "remove", id }); },
      // your settings for this wallpaper changed: the worker rebuilds it in place (same canvas, no flash)
      setOpts(o) { w.postMessage({ type: "opts", id, opts: o, t: p.lastT }); },
    };
  }

  // your settings for a built-in wallpaper (its own options + Recolour), as plain data (it's sent to the worker)
  function skinOptsFor(id) { const o = cfg.skinOpts && cfg.skinOpts[id]; return o && typeof o === "object" ? JSON.parse(JSON.stringify(o)) : null; }
  // Effects (rain, storm, snow...) over a wallpaper: their own see-through canvas above it, drawn like a wallpaper
  // (in the worker when possible). The setting is saved with the wallpaper: skinOpts[<skin id> or "media:<id>"].fx
  const fxIds = () => Object.keys(window.PriismEffects || {});
  function fxFor(src) { const o = cfg.skinOpts && cfg.skinOpts[src], f = o && o.fx;
    return f && fxIds().includes(f.k) ? JSON.parse(JSON.stringify(f)) : null; }
  // an effect that swells with your music needs to hear it: it runs here (not in the drawing worker) while Music is on
  const fxWithMusic = (f) => !!(f && cfg.react === "music" && window.PriismEffects[f.k] && window.PriismEffects[f.k].music);
  function setFx(v, src) {
    const f = fxFor(src), sig = JSON.stringify(f) + (fxWithMusic(f) ? "|m" : "");
    if (v.fxSig === sig && (v.fx || !f)) return;
    v.fxSig = sig;
    if (v.fx && v.fx.remove) try { v.fx.remove(); } catch {}
    if (v.fxEl) v.fxEl.remove();
    v.fx = v.fxEl = null; v.fcw = v.fch = 0;
    if (!f || !window.PriismEffects) return;
    const el = document.createElement("canvas"); el.className = "bd-fx";
    v.fx = (!fxWithMusic(f) && workerSkin(el, "fx:" + f.k, f)) || window.PriismMakeSkin("fx:" + f.k, el.getContext("2d"), f);
    v.fxEl = el; v.fxClock = 0;
    if (v.tile && v.content) v.content.after(el);
    if (v.w) sizeFx(v);
    if (layer && !running) startLoop();
  }
  function sizeFx(v) {
    if (!v.fx) return;
    const base = resBase(v), scale = Math.max(0.35, base * qlv().res);
    const w = Math.max(2, (v.w * scale) | 0), h = Math.max(2, (v.h * scale) | 0);
    if (v.fcw === w && v.fch === h) return; v.fcw = w; v.fch = h;
    if (!v.fx.offThread) { v.fxEl.width = w; v.fxEl.height = h; }
    v.fx.resize(w, h);
  }
  // skinOpts changed: rebuild only the wallpapers whose settings changed, in place
  function updateSkinOpts() {
    for (const v of views) setFx(v, v.src);
    for (const v of views) {
      if (!v.skin || !v.skinId) continue;
      const o = skinOptsFor(v.skinId), sig = JSON.stringify(o || null); if (sig === v.optsSig) continue;
      v.optsSig = sig;
      if (v.skin.setOpts) v.skin.setOpts(o);
      else { const el = v.content; v.skin = window.PriismMakeSkin(v.skinId, el.getContext("2d"), o); v.skin.resize(el.width, el.height); v.skin.frame(v.clock || 0, 0); }
    }
    accentFor = "";                                                // re-read the wallpaper's colours (Recolour changes them)
    setTimeout(measureBackdrop, 400);
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
      const id = window.WickedSkins[src] ? src : window.WickedSkins[cfg.skin] ? cfg.skin : "aurora";
      el = document.createElement("canvas"); el.dataset.bdSkin = id;   // (which wallpaper: for Diagnose / tests)
      const o = skinOptsFor(id);
      view.skinId = id; view.optsSig = JSON.stringify(o || null);
      view.skin = workerSkin(el, id, o) || window.PriismMakeSkin(id, el.getContext("2d"), o);
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
  // ---------- platforms on Lightweight Charts (nq.vision…): the app's own panels and font ----------
  // TradingView's panel colours come from its theme variables; another app has its own CSS we can't know. So we find the
  // app's solid surfaces (sidebars, headers, cards: opaque backgrounds of a decent size, outside the chart) once, mark
  // them, and give them the panel colour. Re-checked only when the page adds elements, at most every 2 s.
  const isLwPage = () => document.documentElement.getAttribute("data-bd-lw") === "on" && !document.querySelector(".chart-markup-table");
  let surfT = 0, surfObs = null;
  const surfSeen = new WeakSet();   // elements already looked at: getComputedStyle once per element, not every rescan
  function markSurfaces() {
    surfT = 0;
    const roots = [...document.querySelectorAll("[data-bd-lwroot], .tv-lightweight-charts")];   // every chart, not just the first
    let n = 0;
    for (const el of document.body ? document.body.querySelectorAll("div, aside, header, nav, section, main, footer, ul, li, table, td, th, button, input, select") : []) {
      if (++n > 6000) break;
      if (surfSeen.has(el)) continue; surfSeen.add(el);
      // never Priism's own layers (in a layout each chart's wallpaper, with its dim, is a .bd-emb box inside that chart: it
      // was taken for the app's panel and painted the panel colour, a tint over the wallpaper) nor any chart's insides
      if (el.hasAttribute("data-bd-surf") || el.closest("#bd-layer, .bd-emb, .bd-num, #bd-lens, #bd-timer, #bd-goal, #bd-pnl, #bd-wm, #bd-tip") || roots.some((r) => r.contains(el))) continue;
      const bg = getComputedStyle(el).backgroundColor, m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && +m[4] < 0.5)) continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < 600) continue;
      const L = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
      el.setAttribute("data-bd-surf", L < 0.5 ? "d" : "l");    // dark or light surface (its text colour is left alone)
    }
  }
  // The platform's ticker, timeframe buttons and watchlist symbols are its own HTML too. Short text-only elements are
  // recognised by their text: "1m" / "15m" / "4H" / "1D" = a timeframe; "NQ", "MNQZ5", "ES1!" = a symbol. The symbol just
  // above the chart is the ticker; the others (watchlist) take the accent colour.
  const TF_RE = /^(\d{1,3}\s?(s|m|min|h|hr|d|w|mo)|[DWM]|1Y)$/i, SYM_RE = /^[A-Z][A-Z0-9.\-]{0,9}!?$/;
  const COMBO_RE = /^[A-Z][A-Z0-9.\-]{0,9}!?\s*[\u00b7\u2022|,\-]\s*(\d{1,3}\s?(s|m|min|h|hr|d|w|mo)|[DWM])$/i;   // "NQ1! · 1m"
  const NOT_SYM = new Set(["BUY", "SELL", "USD", "OK", "ON", "OFF", "LIVE", "PNL", "LONG", "SHORT", "MARKET", "LIMIT", "STOP", "CLOSE", "OPEN", "HIGH", "LOW", "VOL", "AUTO", "LOG", "ALL", "TP", "SL", "QTY", "AM", "PM", "UTC", "ET", "EST", "NEW", "BETA", "PRO", "FAQ", "ID", "X"]);
  // Text the platform draws OVER the chart (its legend: symbol, timeframe, indicator names and values) was made for its
  // own dark-grey chart background; over a wallpaper, dark text there is unreadable. That text gets a soft dark halo,
  // and text that's too dark is lightened (coloured indicator values keep their colour).
  const SYM_START = /^([A-Z][A-Z0-9.\-]{0,9}!?)(?=$|[\s\u00b7\u2022|,:])/;
  const lumOf = (css) => { const m = String(css).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 : 1; };
  const satOf = (css) => { const m = String(css).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/); if (!m) return 0;
    const v = [+m[1], +m[2], +m[3]]; return (Math.max(...v) - Math.min(...v)) / 255; };   // chroma: dark blue-greys count as neutral
  function markTickers() {
    const root = document.querySelector("[data-bd-lwroot], .tv-lightweight-charts"), cr = root ? root.getBoundingClientRect() : null;
    let main = null, best = Infinity, n = 0;
    for (const el of document.body ? document.body.querySelectorAll("span, div, button, a, b, strong, td, li, p, h1, h2, h3, h4, label") : []) {
      if (++n > 8000) break;
      if (el.childElementCount || el.closest("[data-bd-lwroot] table, .tv-lightweight-charts table, #bd-layer, #bd-timer, #bd-goal, #bd-pnl, #bd-wm, #bd-tip")) continue;
      const t = (el.textContent || "").trim();
      const r = (t && t.length <= 80 && cr) ? el.getBoundingClientRect() : null;
      const over = !!r && r.width > 0 && r.left >= cr.left - 2 && r.right <= cr.right + 2 && r.top >= cr.top - 2 && r.bottom <= cr.bottom + 2;   // sits on the chart
      // decide from the text's OWN colour: read with our lightening switched off, or the next check sees the lightened
      // colour, un-lightens it, then lightens it again (the legend text flickered between dark and light every ~2 s)
      if (over) { el.dataset.bdHalo = "1"; if (el.dataset.bdLighten) delete el.dataset.bdLighten; if (el.dataset.bdLg) delete el.dataset.bdLg;
        const own = getComputedStyle(el).color;
        if (lumOf(own) < 0.45) el.dataset.bdLighten = "1";
        el.dataset.bdLg = satOf(own) < 0.2 ? "n" : "c"; }               // n = neutral text (names), c = coloured (indicator values)
      else if (el.dataset.bdHalo) { delete el.dataset.bdHalo; delete el.dataset.bdLighten; delete el.dataset.bdLg; }
      if (!t || t.length > 40) { if (el.dataset.bdTk) delete el.dataset.bdTk; continue; }
      const symStart = SYM_START.exec(t), sym = symStart && !NOT_SYM.has(symStart[1].replace(/!$/, "")) && symStart[1].length >= 2;
      // a symbol-like start in the legend ("NQ1! · 1 · CME", but also "EMA 20 …") can only be the ticker, never "list"
      let kind = TF_RE.test(t) ? "tf" : (t.length <= 12 && SYM_RE.test(t) && /[A-Z]/.test(t) && !NOT_SYM.has(t.replace(/!$/, "")) && t.length >= 2) || COMBO_RE.test(t) ? "list" : over && sym ? "legend" : "";
      if (over && kind === "list") kind = "legend";       // nothing on the chart itself is the watchlist ("VWAP", "EMA")
      if (!kind) { if (el.dataset.bdTk) delete el.dataset.bdTk; continue; }
      if ((kind === "list" || kind === "legend") && cr && r) {             // the ticker: a symbol just above the chart, or in the legend at its top
        const dy = cr.top - r.bottom;
        if (r.width && dy > -cr.height * 0.25 && dy < 120 && r.left < cr.right && r.right > cr.left - 40) { const d = Math.abs(dy) + Math.abs(r.left - cr.left) * 0.2 + (over ? 0 : 5); if (d < best) { best = d; main = el; } }
      }
      el.dataset.bdTk = kind;
    }
    if (main) main.dataset.bdTk = "main";
  }
  // one observer for the platform's page: re-mark panels / tickers after it changes (at most every 2 s)
  let tkT = 0;
  function appWanted() { return isLwPage() && cfg.enabled; }   // legend readability is always on there
  function watchApp() {
    if (!appWanted()) { if (surfObs) { surfObs.disconnect(); surfObs = null; } return; }
    if (surfObs || !document.body) return;
    surfObs = new MutationObserver(() => {
      if (panelCol && !surfT) surfT = setTimeout(markSurfaces, 2000);
      if (!tkT) tkT = setTimeout(() => { tkT = 0; markTickers(); }, 2000);
    });
    surfObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function applyAppPanels(col) {
    const h = document.documentElement, on = !!col && isLwPage();
    h.classList.toggle("bd-app-panels", on);
    if (!on) { watchApp(); return; }
    markSurfaces();
    watchApp();
    const rgb = [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16)), up = (f) => `rgb(${rgb.map((v) => Math.round(v + (255 - v) * f)).join(",")})`;
    let st = document.getElementById("bd-app-css");
    if (!st) { st = document.createElement("style"); st.id = "bd-app-css"; (document.head || h).appendChild(st); }
    // dark surfaces take the colour; light ones (inputs, cards on a light app) a light version of it, so their dark text stays readable
    st.textContent = `html.bd-app-panels [data-bd-surf="d"]{background-color:${col}!important;border-color:${up(0.12)}!important}` +
      `html.bd-app-panels [data-bd-surf="l"]{background-color:${up(0.86)}!important}`;
  }
  let panelApplied = null, panelCol = "";   // what was applied (colour + glass, to skip repeats) / the panel colour itself
  function applyPanels() {
    const h = document.documentElement, glass = cfg.enabled && cfg.pnStyle === "glass";
    // Glass needs a colour to make see-through: TradingView's own dark / light panel colour if Panels is TradingView's
    const col = cfg.enabled ? (panelColour() || (glass ? (h.classList.contains("theme-light") ? "#ffffff" : "#10131c") : "") ) : "";
    applyPanelDeco();
    if (col + glass === panelApplied) return;    // nothing changed: never restyle the page for nothing (keeps it smooth)
    panelApplied = col + glass; panelCol = col;
    applyAppPanels(col);
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
    const decl = [], see = (hex, a) => glass ? `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})` : hex;   // Glass: the panel colours see-through
    PANEL_VARS.forEach((n) => decl.push(`${n}:${see(col, 0.55)}!important`));
    PANEL_VARS2.forEach((n) => decl.push(`${n}:${see(shade(0.05), 0.45)}!important`));
    PANEL_HOVER.forEach((n) => decl.push(`${n}:${see(shade(0.12), 0.6)}!important`));
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
  // ---------- Trade panel: TradingView's Buy / Sell buttons on the chart, the order ticket's Buy / Sell switch and its
  // big order button, and the panel behind them. Only how they look (colours, shape, glass / outline / neon); every
  // click still goes to TradingView exactly as before.
  function applyTradePanel() {
    const h = document.documentElement, on = !!(cfg.enabled && cfg.tpOn && window.PriismTradeLook);
    h.classList.toggle("bd-tp", on);
    let st = document.getElementById("bd-tp-css");
    if (!on) { if (st) st.remove(); return; }
    const buy = cfg.tpColors === "custom" ? cfg.tpBuy : upColor(), sell = cfg.tpColors === "custom" ? cfg.tpSell : downColor();
    const L = window.PriismTradeLook({ buy, sell, shape: cfg.tpShape, style: cfg.tpStyle });
    const decl = (o) => Object.entries(o).filter(([k]) => !(k === "backdrop-filter" && liteNow())).map(([k, v]) => `${k}: ${v} !important;` + (k === "backdrop-filter" ? ` -webkit-backdrop-filter: ${v} !important;` : "")).join(" ");   // (Lite: no blur behind panels)
    const B = '[data-name="buy-order-button"], [data-name="place-and-modify-button"][class*="blue-"], [data-name="place-and-modify-button"][class*="green-"]';
    const S = '[data-name="sell-order-button"], [data-name="place-and-modify-button"][class*="red-"]';
    const scope = (sel) => sel.split(",").map((x) => "html.bd-tp " + x.trim()).join(", ");
    const tint = (c, x) => { const n = parseInt(String(c).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${x})`; };
    const dark = !h.classList.contains("theme-light");
    let css = `${scope(B)} { ${decl(L.buy)} } ${scope(S)} { ${decl(L.sell)} }
      ${scope(B + ", " + S)} { transition: filter .15s; } ${scope(B + ", " + S).split(", ").map((x) => x + ":hover").join(", ")} { filter: brightness(1.12); }
      html.bd-tp [data-name="buy-order-button"] *, html.bd-tp [data-name="sell-order-button"] *, html.bd-tp [data-name="place-and-modify-button"] * { color: inherit !important; }
      html.bd-tp [data-name="side-control-buy"][class*="active-"] { background: ${tint(buy, 0.22)} !important; color: ${buy} !important; }
      html.bd-tp [data-name="side-control-sell"][class*="active-"] { background: ${tint(sell, 0.22)} !important; color: ${sell} !important; }
      html.bd-tp [data-name="side-control-buy"], html.bd-tp [data-name="side-control-sell"] { border-radius: 0 !important; }
      html.bd-tp [data-name="side-control-sell"] { border-radius: ${L.rad} 0 0 ${L.rad} !important; } html.bd-tp [data-name="side-control-buy"] { border-radius: 0 ${L.rad} ${L.rad} 0 !important; }`;
    // on TradingView's light theme the order ticket is pale: its text in a deep shade of your colours (not white), so
    // it stays readable in every style
    if (!dark) { const deep = (c) => { const n = parseInt(String(c).slice(1), 16); return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.45)).join(",")})`; };
      css += `
      html.bd-tp [data-name="side-control-buy"][class*="active-"], html.bd-tp [data-name="side-control-buy"][class*="active-"] * { color: ${deep(buy)} !important; }
      html.bd-tp [data-name="side-control-sell"][class*="active-"], html.bd-tp [data-name="side-control-sell"][class*="active-"] * { color: ${deep(sell)} !important; }`;
      if ((cfg.tpStyle || "solid") !== "solid") css += `
      html.bd-tp [data-name="place-and-modify-button"][class*="blue-"], html.bd-tp [data-name="place-and-modify-button"][class*="green-"] { color: ${deep(buy)} !important; text-shadow: none !important; background: ${tint(buy, 0.3)} !important; }
      html.bd-tp [data-name="place-and-modify-button"][class*="red-"] { color: ${deep(sell)} !important; text-shadow: none !important; background: ${tint(sell, 0.3)} !important; }`; }
    if (cfg.tpPanel === "glass") css += `
      html.bd-tp [class*="layout__area--tradingpanel"], html.bd-tp [data-name="order-panel"] { background: ${dark ? "rgba(10,13,20,.58)" : "rgba(255,255,255,.62)"} !important;
        ${liteNow() ? "" : "-webkit-backdrop-filter: blur(18px) saturate(1.2) !important; backdrop-filter: blur(18px) saturate(1.2) !important;"} }`;
    if (!st) { st = document.createElement("style"); st.id = "bd-tp-css"; st.dataset.bdOwner = ME.token; (document.head || document.documentElement).appendChild(st); }
    if (st.textContent !== css) st.textContent = css;
  }
  // Panel style (Bars & panels): the watchlist / right panels, the order ticket and the bottom panel (Account Manager)
  // as frosted Glass (the panel colours above go see-through and the wallpaper blurs behind), with a Neon edge or a
  // fine Outline in your accent, and Rounded corners. Only how they look.
  const PANEL_AREAS = ['[class*="layout__area--right"]', '[class*="layout__area--tradingpanel"]', '[class*="layout__area--bottom"]'];
  // TradingView's Settings window, other dialogs and dropdown menus (the same windows Windows & menus styles)
  const WINDOWS = ['#overlap-manager-root [class^="dialog-"]', '#overlap-manager-root [class^="menuWrap-"]', '[data-dialog-name][class^="dialog-"]'];
  function applyPanelDeco() {
    const h = document.documentElement, s = cfg.enabled ? cfg.pnStyle || "flat" : "flat", round = cfg.enabled && !!cfg.pnRound;
    let st = document.getElementById("bd-pndeco-css");
    if (s === "flat" && !round) { if (st) st.remove(); return; }
    const acc = /^#[0-9a-f]{6}$/i.test(cfg.uiAccent || "") ? cfg.uiAccent : skinAccent() || upColor(), n = parseInt(acc.slice(1), 16), a = (x) => `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${x})`;
    const areas = [...PANEL_AREAS, ...(cfg.pnWindows !== false ? WINDOWS : [])], sel = areas.map((x) => "html.bd-on " + x).join(", ");
    const d = [];
    if (s === "glass" && !liteNow()) d.push("-webkit-backdrop-filter: blur(16px) saturate(1.2) !important", "backdrop-filter: blur(16px) saturate(1.2) !important");
    if (s === "neon") d.push(`box-shadow: inset 0 0 0 1px ${a(0.85)}, inset 0 0 16px -2px ${a(0.55)}, 0 0 14px -4px ${a(0.6)} !important`);
    if (s === "outline") d.push(`box-shadow: inset 0 0 0 1px ${a(0.55)} !important`);
    if (round) d.push("border-radius: 12px !important", "overflow: hidden !important");
    let css = `${sel} { ${d.join("; ")} }`;
    // Aurora edge: a thin ring of slowly turning colours (your accent, cyan, violet, pink) around each panel / window
    if (s === "aurora") {
      css += `
      ${areas.map((x) => "html.bd-on " + x + "::after").join(", ")} { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 2147483000; border-radius: inherit; padding: 1.5px;
        background: conic-gradient(from var(--bd-pn-a, 0deg), ${acc}, #4dd8ff, #7c6cff, #ff4df0, ${acc}); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor; mask-composite: exclude; opacity: .85; animation: bd-pn-spin ${liteNow() ? "0s" : "14s"} linear infinite; filter: drop-shadow(0 0 6px ${a(0.5)}); }`;
    }
    if (!st) { st = document.createElement("style"); st.id = "bd-pndeco-css"; st.dataset.bdOwner = ME.token; (document.head || h).appendChild(st); }
    if (st.textContent !== css) st.textContent = css;
  }
  // TradingView's light / dark theme switch: the order ticket's text follows it
  { let was = document.documentElement.classList.contains("theme-light");
    new MutationObserver(() => { const now = document.documentElement.classList.contains("theme-light"); if (now !== was) { was = now; if (cfg.tpOn) applyTradePanel(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); }
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
    const frost = mode === "glass" && !liteNow() ? "-webkit-backdrop-filter:blur(22px) saturate(1.35)!important;backdrop-filter:blur(22px) saturate(1.35)!important;" : "";
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
  // ---------- fonts: Priism's bundled fonts (src/fonts), loaded into this page only when one is picked ----------
  // Loaded from Priism's own files as data (FontFace from bytes), so the page's rules for outside fonts don't matter.
  const fontRow = (id) => (window.PriismFonts || []).find((f) => f[0] === id);
  const fontStack = (id) => { const f = fontRow(id); return f ? f[3] : ""; };
  const fontLoaded = new Map();   // file -> Promise
  let fontTick = 0;
  async function fontBytes(file) {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) return (await fetch(chrome.runtime.getURL(`src/fonts/${file}.woff2`))).arrayBuffer();
    const b64 = window.PriismFontBridge ? window.PriismFontBridge.get(file) : window.PriismNative && window.PriismNative.font ? window.PriismNative.font(file) : "";   // desktop app / Android
    if (!b64) throw new Error("no font");
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer;
  }
  function loadFont(id) {
    const f = fontRow(id); if (!f || !f[2] || typeof FontFace === "undefined") return null;
    const file = f[2];
    if (!fontLoaded.has(file)) fontLoaded.set(file, fontBytes(file).then((buf) => { const face = new FontFace(`Priism ${file}`, buf, { weight: "100 900" }); document.fonts.add(face); return face.load(); })
      .then(() => true, () => false));
    return fontLoaded.get(file);
  }
  // the fonts you picked: load any that aren't here yet, then redraw what uses them (the canvas needs a nudge)
  function ensureFonts() {
    const waits = [cfg.scaleFont, cfg.tkFont, cfg.uiFont].map(loadFont).filter(Boolean);
    if (!waits.length) return;
    Promise.all(waits).then((r) => { if (!r.some(Boolean)) return; fontTick++; pushFx(); tkApplied = ""; applyTicker(); applyUiStyle(); });
  }
  // ---------- the ticker (TradingView's legend: symbol name · timeframe · exchange) ----------
  // Only the main symbol's line (legendMainSourceWrapper), never indicator names like Vol. One <style>, no per-frame work.
  const TK_SIZES = [14, 17, 21, 26];
  let tkApplied = "";
  function applyTicker() {
    const on = cfg.enabled && cfg.tkOn;
    const col = cfg.tkColor === "candle" ? upColor() : /^#[0-9a-f]{6}$/i.test(cfg.tkColor || "") ? cfg.tkColor : (skinAccent() || upColor());
    const px = TK_SIZES[Math.max(0, Math.min(3, +cfg.tkSize || 0))], font = fontStack(cfg.tkFont);
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
    if (isLwPage()) { markTickers(); watchApp(); }
    // stronger than the legend readability rule in content.css (which would otherwise win)
    const LWM = 'html.bd-on.bd-lwpage:not(.bd-x):not(.bd-x) [data-bd-tk="main"][data-bd-tk]', LWT = 'html.bd-on.bd-lwpage:not(.bd-x):not(.bd-x) [data-bd-tk="tf"][data-bd-tk]';
    st.textContent = `${M}, ${LWM}{color:${col}!important;font-size:${px}px!important;line-height:1.25!important;font-weight:700!important;${ff}${glow}}` +
      `${LWT}{color:${col}!important;${ff}${cfg.tkGlow ? `text-shadow:0 0 8px ${col}88!important;` : ""}}` +
      (cfg.tkOnly ? `${P} [class*="intervalTitle-"], ${P} [class*="exchangeTitle-"]{display:none!important}`
        : `${side}{color:${col}!important;opacity:.78;font-size:${Math.round(px * 0.85)}px!important;line-height:1.25!important;font-weight:600!important;${ff}}`);
  }
  // ---------- the legend (indicator names and values, O H L C) ----------
  // TradingView / the charting library: its legend rows ([class*="item-"] in [class*="legend-"]), never the Buy / Sell
  // buttons that sit in the legend too. Platforms with their own legend (nq.vision): the text markTickers() found on
  // the chart. The ticker's own styling (applyTicker) stays stronger. One <style>, no per-frame work.
  let lgApplied = "";
  function applyLegend() {
    const on = cfg.enabled && cfg.lgOn;
    const custom = cfg.lgColor === "candle" ? upColor() : /^#[0-9a-f]{6}$/i.test(cfg.lgColor || "") ? cfg.lgColor : "";
    const back = ["shade", "glass"].includes(cfg.lgBack) ? cfg.lgBack : "none", all = cfg.lgVals === "all";
    const sig = on ? [custom, back, all].join("|") : "";
    if (sig === lgApplied) return; lgApplied = sig;
    let st = document.getElementById("bd-legend-css");
    if (!on) { if (st) st.textContent = ""; return; }
    if (!st) { st = document.createElement("style"); st.id = "bd-legend-css"; (document.head || document.documentElement).appendChild(st); }
    if (isLwPage()) { markTickers(); watchApp(); }
    // light text gets a dark backing / outline, dark text a light one
    const lightText = custom ? lumOf(`rgb(${[1, 3, 5].map((i) => parseInt(custom.slice(i, i + 2), 16)).join(",")})`) >= 0.5 : null;
    const vars = (light) => `--bd-lg-text:${custom || (light ? "#e9ebf2" : "#14161f")};--bd-lg-back:${light ? "8,10,16" : "250,251,253"}`;
    const H = "html.bd-on:not(.bd-over-mode)";
    let css = custom ? `${H}{${vars(lightText)}}` : `${H}.bd-bg-dark{${vars(true)}}${H}.bd-bg-light{${vars(false)}}${H}:not(.bd-bg-dark):not(.bd-bg-light){${vars(true)}}`;
    const L = 'html:root:root:root.bd-on [class*="legend-"] [class*="item-"]';
    const names = `${L} [class*="title"], ${L} [class*="title"] *, ${L} [class*="valueTitle"]`;
    css += `${names}${all ? `, ${L} [class*="valueValue"]` : ""}{color:var(--bd-lg-text)!important}`;
    const LW = 'html.bd-on.bd-lwpage:not(.bd-x) [data-bd-halo]';
    css += `${all ? `${LW}[data-bd-lg]` : `${LW}[data-bd-lg="n"]`}{color:var(--bd-lg-text)!important}`;
    if (back !== "none") {
      const a = back === "glass" ? (liteNow() ? 0.6 : 0.45) : 0.72, blur = back === "glass" && !liteNow() ? "-webkit-backdrop-filter:blur(10px) saturate(1.3);backdrop-filter:blur(10px) saturate(1.3);" : "";
      // a small box that hugs each legend line (its rows are as wide as the chart, which made one big band before)
      css += `${L}[class*="series-"], ${L}[class*="study-"]{width:max-content!important;max-width:calc(100% - 8px)!important;box-sizing:border-box!important;padding:0 6px!important;margin:1px 0!important;background:rgba(var(--bd-lg-back),${a})!important;${blur}border-radius:6px!important}`;
      css += `${LW}{text-shadow:0 0 2px rgba(var(--bd-lg-back),1),0 0 5px rgba(var(--bd-lg-back),.95),0 0 9px rgba(var(--bd-lg-back),.8)!important}`;
    }
    st.textContent = css;
  }
  function applyUiStyle() {
    const h = document.documentElement;
    const font = fontStack(cfg.uiFont) ? cfg.uiFont : "";
    const accent = /^#[0-9a-f]{6}$/i.test(cfg.uiAccent || "") ? cfg.uiAccent : "";
    const on = cfg.enabled && (font || cfg.uiSize > 0 || accent);
    h.classList.toggle("bd-ui", !!on);
    h.classList.toggle("bd-ui-font", !!font);
    h.classList.toggle("bd-ui-big", on && cfg.uiSize > 0);
    h.style.setProperty("--bd-ui-font", font ? fontStack(font) : "");
    h.style.setProperty("--bd-ui-accent", accent || "");
    h.classList.toggle("bd-ui-accent", !!(on && accent));
    h.classList.toggle("bd-lwpage", isLwPage());
    if (isLwPage() && (accent || cfg.tkOn)) { markTickers(); watchApp(); }
  }
  // lw.js marks the page once it finds a Lightweight Charts chart (can be after we start): apply the app styling then
  new MutationObserver(() => { if (isLwPage() && !document.documentElement.classList.contains("bd-lwpage")) { applyUiStyle(); if (panelCol) applyAppPanels(panelCol); tkApplied = ""; applyTicker(); lgApplied = ""; applyLegend(); markTickers(); watchApp(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-bd-lw"] });

  // Pages built on Lightweight Charts (not TradingView's own charts), like nq.vision: the app around the chart has solid
  // backgrounds we can't know about, so a layer behind the whole page would be hidden. Instead the wallpaper goes INSIDE the
  // chart's own container, directly under the chart (whose background lw.js clears). Single chart + "behind" mode only.
  let embeddedHost = null, lastRebuild = 0;
  function lwHost(list = charts) {
    if (TDV) return null;
    if (document.querySelector(".chart-markup-table")) return null;          // TradingView's own charts: not a LW page
    if (list.length !== 1) return null;
    const el = list[0].el;
    const host = el.classList.contains("tv-lightweight-charts") || (el.hasAttribute("data-bd-lwroot") && el.tagName === "TABLE") ? el.parentElement : el;
    return host && host !== document.body && host !== document.documentElement ? host : null;
  }
  // Several Lightweight charts (nq.vision's 2- and 3-chart layouts): the same idea per chart. Each chart's own container
  // gets its wallpaper, under the chart. The page's own (solid) backgrounds would hide a layer behind the page.
  let embHosts = [];
  function lwHosts(list = charts) {
    if (TDV) return null;
    if (document.querySelector(".chart-markup-table") || list.length < 2) return null;
    const hosts = list.map((c) => { const el = c.el;
      const h = el.classList.contains("tv-lightweight-charts") || (el.hasAttribute("data-bd-lwroot") && el.tagName === "TABLE") ? el.parentElement : el;
      return h && h !== document.body && h !== document.documentElement ? h : null; });
    return hosts.every(Boolean) && new Set(hosts).size === hosts.length ? hosts : null;
  }
  const lwMulti = (list = charts) => cfg.layer !== "over" && !!lwHosts(list);
  function claimStack(host) {      // the chart wrapper must be positioned so it paints ABOVE the wallpaper (a positioned sibling)
    const mark = (el) => { if (el && getComputedStyle(el).position === "static") { el.style.position = "relative"; el.dataset.bdPos = "1"; } };
    mark(host); host.querySelectorAll(".tv-lightweight-charts").forEach(mark);
  }
  function releaseStack() {
    const undo = (el) => { if (el && el.dataset && el.dataset.bdPos) { el.style.position = ""; delete el.dataset.bdPos; } };
    for (const h of [embeddedHost, ...embHosts.map((e) => e.host)]) if (h) { undo(h); h.querySelectorAll("[data-bd-pos]").forEach(undo); }
    for (const e of embHosts) e.box.remove();
    embeddedHost = null; embHosts = [];
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
    applySides(); applyUiStyle(); applyPanels(); applyDialogs(); applyTicker(); applyLegend(); applyTradePanel(); ensureFonts();
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
      v.src = sourceFor(n);
      v.content = makeContent(v.src, v);
      v.dim.className = "bd-dim"; v.vg.className = "bd-vignette";
      v.tile.append(v.content, v.dim, v.vg);
      setFx(v, v.src);
      layer.appendChild(v.tile);
      return v;
    });
    // Live mood: one glow per chart (inside each chart's wallpaper tile), so every chart in a layout glows on its own
    for (const v of views) { v.frame = document.createElement("div"); v.frame.className = "bd-frame"; v.frame.hidden = true; v.tile.appendChild(v.frame); }   // Pattern skins: the chart frame
    for (const v of views) { v.mood = document.createElement("div"); v.mood.className = "bd-react"; v.tile.appendChild(v.mood); }
    reactEl = views[0] ? views[0].mood : document.createElement("div");
    pillEl = document.createElement("div");
    pillEl.className = "bd-pill"; pillEl.hidden = true;
    pillEl.style.setProperty("--g", String(0.35 + 0.65 * (+cfg.lineGlow || 0)));
    layer.appendChild(pillEl);
    embeddedHost = cfg.layer !== "over" && !tiled() ? lwHost() : null;
    layer.classList.toggle("bd-embedded", !!embeddedHost);
    // several Lightweight charts: move each chart's wallpaper into that chart (the layer keeps the glow / pill)
    const hosts = cfg.layer !== "over" && tiled() ? lwHosts() : null;
    if (hosts && hosts.length === views.length) {
      embHosts = hosts.map((host, i) => { const box = document.createElement("div"); box.className = "bd-emb"; box.dataset.bdOwner = ME.token;
        claimStack(host); box.appendChild(views[i].tile); host.insertBefore(box, host.firstChild); views[i].host = host; return { host, box }; });
      layer.classList.add("bd-embmulti");
    }
    if (embeddedHost) { claimStack(embeddedHost); embeddedHost.insertBefore(layer, embeddedHost.firstChild); }
    else document.documentElement.appendChild(layer);
    placeViews(); watchCharts();
    try { applyAtmo(); } catch {}
    resetQuality(); lastMatch = "";
    if (views.some((v) => v.skin || v.fx)) startLoop();
    applyLook(); syncMusic();
    renderPnl();
  }

  // ---------- Live candle atmosphere, zone lights and clarity (drawn by PriismAtmo, skins.js) ----------
  // Two canvases in each wallpaper tile, above the wallpaper and its dim, under the chart: Smart dim (redrawn only
  // when something changes) and the live layer (smoke, trails, aura, zone
  // lights; animated while something moves). hook.js / lw.js tell us where the live candle and the zones are
  // (<html data-ws-live>), after every chart paint. Never in "On top" mode (it would cover the candles).
  const ATMO_KEYS = new Set(["zoneFx", "smartDim", "vignette", "vignetteAt", "enabled", "layer", "powerSaver", "autoQuality", "dim", "opacity", "overOpacity", "skin", "mediaId"]);
  const reduceMQ = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)"); } catch { return { matches: false }; } })();
  const ZFX = ["near", "ripple", "flow", "dir", "fusion"];
  const zoneFxList = () => (Array.isArray(cfg.zoneFx) ? cfg.zoneFx.filter((k) => ZFX.includes(k)) : []);
  const atmoBehind = () => cfg.enabled && cfg.layer !== "over" && !!window.PriismAtmo;
  // power saver turns the moving effects off (Smart dim is still: it stays)
  const atmoLiveOn = () => atmoBehind() && !cfg.powerSaver && !heavyNow() && (cfg.atmoFx !== "off" || !!cfg.atmoTrail || !!cfg.atmoAura || zoneFxList().length > 0);
  const clarOn = () => atmoBehind() && ["soft", "strong"].includes(cfg.smartDim);
  // Vignette centred on the live price (Picture › Vignette › Centre): needs to know where the live candle is
  const vgLive = () => cfg.enabled && cfg.vignetteAt === "live" && +cfg.vignette > 0;
  // what hook.js / lw.js should track (sent with the candle settings)
  const spotWanted = () => ({ live: atmoLiveOn() || vgLive(), zones: atmoLiveOn() && zoneFxList().length > 0 });
  let atmoData = [], atmoEng = null, atmoRaf = 0, atmoT = 0, atmoStaticSig = "", atmoStaticT = 0;
  function atmoCanvases(v) {
    if (!v.tile) return;
    for (const k of ["atmoS", "atmoL"]) {
      if (!v[k] || v[k].parentNode !== v.tile) { const c = document.createElement("canvas"); c.className = "bd-atmo"; c.dataset.bdOwner = ME.token; v[k] = c; }
      const c = v[k], dpr = Math.min(1.5, devicePixelRatio || 1) * (liteNow() ? 0.67 : 1), W = Math.max(1, Math.round(v.w * dpr)), H = Math.max(1, Math.round(v.h * dpr));
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; c.__dpr = dpr; if (k === "atmoS") atmoStaticSig = ""; }
    }
    // after the vignette, before the chart frame / mood glow
    if (v.atmoS.previousSibling !== v.vg) v.vg.after(v.atmoS);
    if (v.atmoL.previousSibling !== v.atmoS) v.atmoS.after(v.atmoL);
  }
  const atmoCtx = (v, k) => { const c = v[k], g = c.getContext("2d"), d = c.__dpr || 1; g.setTransform(d, 0, 0, d, -v.x * d, -v.y * d); return g; };
  function atmoOpts() {
    const col = cfg.atmoColor === "custom" && /^#[0-9a-f]{6}$/i.test(cfg.atmoCustom || "") ? cfg.atmoCustom : cfg.atmoColor === "wallpaper" ? skinAccent() || null : null;
    const z = zoneFxList();
    return { fx: ["smoke", "vapor", "mist"].includes(cfg.atmoFx) ? cfg.atmoFx : "off", trail: !!cfg.atmoTrail, aura: !!cfg.atmoAura, color: col,
      op: Math.max(0.03, Math.min(0.6, +cfg.atmoOpacity || 0.15)), len: Math.max(2, Math.min(10, +cfg.atmoLen || 4)), fade: Math.max(200, Math.min(2000, +cfg.atmoFade || 450)),
      zfx: Object.fromEntries(ZFX.map((k) => [k, z.includes(k)])), reduce: !!reduceMQ.matches, lite: liteNow() };
  }
  // the charts' price areas inside one tile (the published canvases; or the chart boxes without their scales)
  function atmoRects(v) {
    const inT = (r) => r.l + r.w > v.x && r.l < v.x + v.w && r.t + r.h > v.y && r.t < v.y + v.h;
    const fromData = atmoData.map((p) => ({ l: p.l, t: p.t, w: p.w, h: p.h })).filter(inT);
    if (fromData.length) return fromData;
    const list = charts.length ? charts.map((c) => c.r) : [{ left: v.x, top: v.y, width: v.w, height: v.h }];
    return list.map((r) => ({ l: r.left, t: r.top, w: Math.max(0, r.width - 64), h: Math.max(0, r.height - 28) })).filter((r) => r.w > 40 && r.h > 40 && inT(r));
  }
  function atmoStatic(force) {
    const on = clarOn();
    for (const v of views) {
      if (!on) { if (v.atmoS) { v.atmoS.hidden = true; } continue; }
      atmoCanvases(v); v.atmoS.hidden = false;
    }
    if (!on) { atmoStaticSig = ""; return; }
    const vis = (cfg.layer === "over" ? cfg.overOpacity : cfg.opacity) * (1 - Math.min(0.95, +cfg.dim || 0));
    const sig = [cfg.smartDim, vis.toFixed(2), views.map((v) => [v.x, v.y, v.w, v.h].map(Math.round).join(",") + ":" + (v.lum && v.lum.grid ? Math.round(v.lum.mean * 400) + "," + Math.round(v.lum.std * 400) : "-")).join("|"),
      atmoData.map((p) => [p.l, p.t, p.w, p.h].map(Math.round).join(",")).join("|"), skinAccent() || ""].join(";");
    if (!force && sig === atmoStaticSig) return;
    atmoStaticSig = sig;
    const o = { contrast: cfg.smartDim };
    for (const v of views) {
      const g = atmoCtx(v, "atmoS"); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, v.atmoS.width, v.atmoS.height); g.restore();
      try { window.PriismAtmo.clarity(g, { x: v.x, y: v.y, w: v.w, h: v.h, grid: v.lum && v.lum.grid, vis }, atmoRects(v), atmoData, o); } catch {}
    }
  }
  function atmoKick() { if (!atmoRaf && atmoLiveOn() && !document.hidden) { atmoT = 0; atmoRaf = requestAnimationFrame(atmoTick); } }
  function atmoTick(now) {
    atmoRaf = 0;
    const on = atmoLiveOn();
    for (const v of views) if (v.atmoL) v.atmoL.hidden = !on;
    if (!on) { if (atmoEng) atmoEng.reset(); return; }
    const o = atmoOpts(), step = 1000 / (o.lite ? 15 : 30);
    if (atmoT && now - atmoT < step - 2) { atmoRaf = requestAnimationFrame(atmoTick); return; }
    if (holdOn) { atmoT = 0; return; }   // trade focus: the last frame stays on screen; syncHold restarts it
    const dt = atmoT ? (now - atmoT) / 1000 : 0.016; atmoT = now;
    if (!atmoEng) atmoEng = window.PriismAtmo.engine();
    let busy = false;
    for (const v of views) {
      atmoCanvases(v);
      const g = atmoCtx(v, "atmoL"); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, v.atmoL.width, v.atmoL.height); g.restore();
      const panes = atmoData.filter((p) => p.l + p.w > v.x && p.l < v.x + v.w && p.t + p.h > v.y && p.t < v.y + v.h);
      try { if (panes.length && atmoEng.frame(g, panes, o, now, dt)) busy = true; } catch {}
    }
    if (busy && !document.hidden) atmoRaf = requestAnimationFrame(atmoTick);
  }
  function applyAtmo() {
    if (!atmoLiveOn()) { cancelAnimationFrame(atmoRaf); atmoRaf = 0; for (const v of views) if (v.atmoL) { v.atmoL.hidden = true; } if (atmoEng) atmoEng.reset(); }
    else { for (const v of views) atmoCanvases(v); atmoKick(); }
    atmoStatic(true); placeVignette();
  }
  // the chart told us where its live candle / zones are now
  new MutationObserver(() => {
    try { const a = JSON.parse(document.documentElement.getAttribute("data-ws-live") || "[]"); atmoData = Array.isArray(a) ? a.slice(0, 12) : []; } catch { atmoData = []; }
    if (layer) { atmoKick(); placeVignette(); if (clarOn() && performance.now() - atmoStaticT > 250) { atmoStaticT = performance.now(); atmoStatic(); } }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-ws-live"] });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) atmoKick(); });
  try { reduceMQ.addEventListener("change", () => { applyAtmo(); }); } catch {}
  // Vignette › Centre › Live price: the vignette's centre is the live candle of the chart in that tile (or the middle
  // when it isn't on screen). Same look as before, only its centre moves; updated when the live candle moves.
  function vgCentre(v) {
    if (!vgLive()) return null;
    const p = atmoData.find((q) => q.live && q.live.x >= v.x && q.live.x <= v.x + v.w && q.live.y0 >= v.y && q.live.y0 <= v.y + v.h);
    if (!p || !v.w || !v.h) return null;
    return [Math.max(0, Math.min(100, ((p.live.x - v.x) / v.w) * 100)), Math.max(0, Math.min(100, (((p.live.y0 + p.live.y1) / 2 - v.y) / v.h) * 100))];
  }
  function vgCss(v) {
    if (!(cfg.vignette > 0)) return "none";
    const c = vgCentre(v), at = c ? `${c[0].toFixed(1)}% ${c[1].toFixed(1)}%` : "center";
    return `radial-gradient(ellipse at ${at}, transparent ${Math.round(70 - cfg.vignette * 40)}%, rgba(0,0,0,${(0.35 + cfg.vignette * 0.55).toFixed(2)}) 100%)`;
  }
  function placeVignette() { for (const v of views) if (v.vg) { const css = vgCss(v); if (v.vg.__css !== css) { v.vg.__css = css; v.vg.style.background = css; } } }

  // ---------- Pattern skins ----------
  // Chart frame: a band along each chart's edges, in a pattern (PriismPatterns) and colours of your choice. It sits in
  // the wallpaper layer (behind the chart: candles and scales draw over it), cut to a ring by a clip path so the
  // corners can be round inside and out.
  const patPaint = (mode, c1, c2, round) => { const P = window.PriismPatterns; if (!P) return "none";
    return P.paint({ mode, color: c1, color2: c2, up: upColor(), down: downColor(), accent: skinAccent() || upColor(), round }); };
  function frameRect(v) {            // the frame's box, in the tile's own coordinates
    if (v.host || embeddedHost || tiled()) return { l: 0, t: 0, w: v.w, h: v.h };
    const b = chartsBox(); return { l: b.left - v.x, t: b.top - v.y, w: b.width, h: b.height };
  }
  const frameW = () => Math.max(2, Math.min(32, +cfg.frameW || 8)), frameR = () => (cfg.frameRound ? 12 : 0);
  function placeFrames() {
    for (const v of views) { const f = v.frame; if (!f || f.hidden) continue;
      const r = frameRect(v), W = frameW(), R = frameR(), key = [r.l, r.t, r.w, r.h, W, R].map(Math.round).join(",");
      if (f.__key === key) continue; f.__key = key;
      Object.assign(f.style, { left: r.l + "px", top: r.t + "px", width: r.w + "px", height: r.h + "px" });
      const ring = (x, y, w, h, q) => { q = Math.max(0, Math.min(q, w / 2, h / 2));
        return `M${x + q},${y}H${x + w - q}A${q},${q} 0 0 1 ${x + w},${y + q}V${y + h - q}A${q},${q} 0 0 1 ${x + w - q},${y + h}H${x + q}A${q},${q} 0 0 1 ${x},${y + h - q}V${y + q}A${q},${q} 0 0 1 ${x + q},${y}Z`; };
      f.style.clipPath = r.w > 2 * W && r.h > 2 * W ? `path(evenodd, "${ring(0, 0, r.w, r.h, R)} ${ring(W, W, r.w - 2 * W, r.h - 2 * W, Math.max(0, R - W))}")` : "none";
    }
  }
  function applyFrame() {
    const P = window.PriismPatterns, on = !!(cfg.enabled && cfg.frameOn && P);
    if (on) P.image(cfg.framePattern);   // load its tile now, so snapshots and clips can draw it straight away
    for (const v of views) { const f = v.frame; if (!f) continue;
      f.hidden = !on; if (!on) continue;
      const m = P.mask(cfg.framePattern, cfg.frameSize), W = frameW(), R = frameR();
      f.style.setProperty("--bd-fbg", patPaint(cfg.frameMode, cfg.frameColor, cfg.frameColor2, true));
      f.style.setProperty("--bd-fpat", m.image); f.style.setProperty("--bd-fps", m.size);
      f.style.setProperty("--bd-ftw", (m.w || 0) * 4 + "px"); f.style.setProperty("--bd-fth", (m.h || 0) * 4 + "px");
      f.style.setProperty("--bd-fw", W + "px"); f.style.setProperty("--bd-fr", R + "px");
      f.classList.toggle("bd-fedge", !!cfg.frameEdge); f.classList.toggle("bd-fsolid", cfg.framePattern === "solid");
      f.classList.toggle("bd-fmove", !!cfg.frameMove && !liteNow() && cfg.framePattern !== "solid");
      f.classList.toggle("bd-aurora", (cfg.frameMode === "aurora" || cfg.frameMode === "holo") && !liteNow());
      if (cfg.frameMode !== "mood") f.style.opacity = String(Math.max(0.05, Math.min(1, +cfg.frameAlpha || 0.5)));
      f.__key = "";
    }
    placeFrames();
    if (cfg.frameMode === "mood") updateReact(0);
  }
  // Bars: one faint patterned sheet over each of TradingView's bars, pointer-events none (clicks go straight through),
  // blended so it only tints: icons, text and buttons stay clear. Only on TradingView (its layout areas).
  const BAR_AREAS = { t: ".layout__area--top", l: ".layout__area--left", r: ".layout__area--right", b: ".layout__area--bottom" };
  let barBox = null;
  function applyBars() {
    const P = window.PriismPatterns, on = !!(cfg.enabled && cfg.barPatOn && P && document.querySelector(".layout__area--center"));
    if (!on) { if (barBox) { barBox.remove(); barBox = null; } return; }
    if (!barBox || !barBox.isConnected) { barBox = document.createElement("div"); barBox.id = "bd-barpat"; barBox.dataset.bdOwner = ME.token; document.documentElement.appendChild(barBox); }
    const m = P.mask(cfg.barPattern, cfg.barSize);
    barBox.style.setProperty("--bd-bbg", patPaint(cfg.barMode, cfg.barColor, cfg.barColor2, false));
    barBox.style.setProperty("--bd-bpat", m.image); barBox.style.setProperty("--bd-bps", m.size);
    barBox.style.setProperty("--bd-ba", String(Math.max(0.02, Math.min(0.8, +cfg.barAlpha || 0.25))));
    barBox.classList.toggle("bd-bsolid", cfg.barPattern === "solid");
    barBox.classList.toggle("bd-aurora", (cfg.barMode === "aurora" || cfg.barMode === "holo") && !liteNow());
    barBox.__sig = ""; placeBars();
  }
  function placeBars() {
    if (!barBox) return;
    const where = String(cfg.barWhere || "tlrb"), parts = [];
    for (const [k, sel] of Object.entries(BAR_AREAS)) { if (!where.includes(k)) continue;
      const el = document.querySelector(sel), r = el && el.getBoundingClientRect();
      if (r && r.width >= 4 && r.height >= 4) parts.push([k, r]); }
    const sig = parts.map(([k, r]) => k + [r.left, r.top, r.width, r.height].map(Math.round).join(",")).join("|");
    if (sig === barBox.__sig) return; barBox.__sig = sig;
    barBox.textContent = "";
    for (const [k, r] of parts) { const d = document.createElement("div"); d.dataset.part = k;
      Object.assign(d.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); barBox.appendChild(d); }
  }
  addEventListener("resize", () => setTimeout(placeBars, 60));
  setInterval(() => { if (barBox) placeBars(); }, 800);   // side panels open / close without a resize event

  // Keep every wallpaper on top of its chart as the layout changes (resize, 1 -> 4 charts, panels opening...).
  const sigOf = (list) => list.map((c) => [c.r.left, c.r.top, c.r.width, c.r.height].map(Math.round).join(",")).join("|") + "@" + innerWidth + "x" + innerHeight;
  let layoutSig = "";
  function placeViews() {
    if (!layer) return;
    views.forEach((v, i) => {
      const H = v.host || embeddedHost;
      const hr = H && H.isConnected ? H.getBoundingClientRect() : null;
      const r = hr ? { left: hr.left + H.clientLeft, top: hr.top + H.clientTop, width: H.clientWidth, height: H.clientHeight }
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
    placeFrames(); placeBars();
    try { pushChartColors(); } catch {}                     // each chart's box moved: tell hook.js where they are now
    try { if (atmoLiveOn() || clarOn()) { atmoStatic(); atmoKick(); } } catch {}
  }
  function trackLayout() {
    if (!layer || standDown || document.querySelector(".chart-container[data-bd-repaint]")) return;   // mid-redraw: charts hidden for 2 frames
    if (!layer.isConnected || (embeddedHost && !embeddedHost.isConnected) || embHosts.some((e) => !e.host.isConnected || !e.box.isConnected)) {   // the app re-drew its page and took our layer with it
      if (Date.now() - lastRebuild > 3000) { lastRebuild = Date.now(); charts = chartEls(); build(); }
      return;
    }
    const next = chartEls(), sig = sigOf(next);
    // a Lightweight chart appeared (or was replaced) after we built: move the wallpaper into it
    if (cfg.layer !== "over" && !(cfg.multi !== "span" && next.length > 1)) {
      const want = lwHost(next);
      if (want && want !== embeddedHost && Date.now() - lastRebuild > 1500) { lastRebuild = Date.now(); charts = next; build(); return; }
    }
    if (cfg.layer !== "over" && next.length > 1) {      // several charts: each wallpaper must sit in its own chart's container
      const want = lwHosts(next), have = embHosts.map((e) => e.host);
      if (want && (want.length !== have.length || want.some((h, i) => h !== have[i])) && Date.now() - lastRebuild > 1500) { lastRebuild = Date.now(); charts = next; build(); return; }
    }
    if (sig === layoutSig) return;
    const before = charts.length, wasTiled = tiled();
    if (next.length !== charts.length || next.some((c, i) => !charts[i] || charts[i].el !== c.el)) { charts = next; watchCharts(); }
    charts = next; layoutSig = sig;
    // number of tiles changed (chart added/removed, or 1 <-> many): rebuild; otherwise just move them
    if (before !== charts.length) setTimeout(announceFrame, 0);
    if (wasTiled !== tiled() || (tiled() && before !== charts.length)) build();
    else { placeViews(); updateReact(0); }
    setTimeout(measureBackdrop, 200);
  }
  setInterval(trackLayout, 600);
  addEventListener("resize", () => setTimeout(trackLayout, 50));
  // Charts that change size without the window changing (dragging the divider between charts in a multi-chart
  // layout, opening a side panel): follow them on the very next frame. Checking every 0.6 s left a wallpaper behind
  // its chart while you dragged, and the platform's own background showed in the gap.
  let chartRO = null, roRaf = 0;
  function watchCharts() {
    if (typeof ResizeObserver !== "function") return;
    if (!chartRO) chartRO = new ResizeObserver(() => { if (!roRaf) roRaf = requestAnimationFrame(() => { roRaf = 0; trackLayout(); }); });
    chartRO.disconnect();
    for (const c of charts) chartRO.observe(c.el);
    const area = document.querySelector(".layout__area--center"); if (area) chartRO.observe(area);   // charts added / removed
  }

  // How many pixels a built-in wallpaper / effect is drawn with, per CSS pixel. Standard 0.75 (light), Sharp 1 (your
  // screen's size), Ultra: every real pixel (a 4K / Retina screen gets 4K), never more than 3840 x 2160 per wallpaper.
  // while a snapshot or clip is being made, wallpapers and effects are drawn with every real pixel (up to 2x), so the
  // picture is as sharp as the chart in it
  let captureHi = 0;
  async function withSharpWallpaper(fn) {
    captureHi++; views.forEach(sizeCanvas);
    // a frame or two at the new size; a wallpaper drawn in the worker is waited for until it has redrawn at that size
    // (painted wallpapers take a moment to set up), at most 1.5 s
    const sized = views.map((v) => v.skin && v.skin.whenSized ? v.skin.whenSized() : null).filter(Boolean);
    await Promise.race([Promise.all([...sized, new Promise((r) => setTimeout(r, 160))]), new Promise((r) => setTimeout(r, 1500))]);
    try { return await fn(); } finally { captureHi = Math.max(0, captureHi - 1); if (!captureHi) setTimeout(() => views.forEach(sizeCanvas), 50); }
  }
  function resBase(v) {
    if (captureHi) return Math.max(1, Math.min(2, (typeof devicePixelRatio === "number" && devicePixelRatio) || 1));
    if (cfg.powerSaver) return 0.5;
    if (guard >= 1) return Math.min(cfg.res === "standard" ? 0.75 : 1, 0.75);   // trading slowed down: the wallpaper at Standard
    if (cfg.res === "sharp") return 1;
    if (cfg.res === "ultra") { const dpr = Math.max(1, Math.min(3, (typeof devicePixelRatio === "number" && devicePixelRatio) || 1)), px = Math.max(1, (v.w || 1) * (v.h || 1));
      return Math.max(1, Math.min(dpr, Math.sqrt((3840 * 2160) / px))); }
    return 0.75;
  }
  function sizeCanvas(v) {
    sizeFx(v);
    if (!v.skin) return;
    // Auto quality steps the resolution down when the computer struggles (res 1 = full, 0 = lowest).
    const base = resBase(v);
    const scale = Math.max(0.35, base * qlv().res);
    const w = Math.max(2, (v.w * scale) | 0), h = Math.max(2, (v.h * scale) | 0);
    if (v.skin.offThread) { if (v.cw !== w || v.ch !== h) { v.cw = w; v.ch = h; v.skin.resize(w, h); } return; }   // sized in the worker
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
  // A computer with few cores or little memory starts a step or two lower (no stutter while it finds its level); it
  // still climbs to full quality on its own if it turns out to have room.
  const cores = +navigator.hardwareConcurrency || 8, memGB = +navigator.deviceMemory || 8;
  const startLevel = cores <= 2 || memGB <= 2 ? 2 : cores <= 4 || memGB <= 4 ? 1 : 0;
  let qLevel = startLevel, hAcc = 0, hCount = 0, hStart = 0, hLast = 0, smoothFor = 0, needSmooth = 4, lastUp = 0;
  function resetQuality() { qLevel = startLevel; hAcc = hCount = hStart = hLast = smoothFor = 0; needSmooth = 4; lastUp = 0; }
  // the background worker that draws wallpapers: how often it couldn't keep up (frames skipped) since last asked
  const workerLoad = () => { let m = 0; for (const v of views) { if (v.skin && v.skin.load) m = Math.max(m, v.skin.load()); if (v.fx && v.fx.load) m = Math.max(m, v.fx.load()); } return m; };   // effects count too
  // Lite glow: on a slow computer (auto quality in its lower half) or with Power saver, every glow on the chart is drawn
  // with a smaller blur. Glow blur is what costs the most there: it was the difference between a smooth and a choppy
  // chart on a slow PC. Looks nearly the same, just a tighter glow.
  // Trading comes first: Auto quality also watches how quickly the page answers your input (clicks, drags, the crosshair)
  // and how long the main thread is blocked, not only the wallpaper's frame rate, so effects that slow the chart itself
  // (glow, zones, candle FX) are eased too. With Max picked, a safety floor still switches to Lite while trading would
  // feel slow (and back once it's quick again). Nothing about orders or the platform is touched; only Priism's drawing.
  let guard = 0;                     // 0 = fine; 1 = Lite (safety floor while Max is picked); 2 = Lite and the atmosphere paused
  let pressureBad = false, pressureGood = true, stepAt = 0, inputAt = 0;
  const liteNow = () => !!(cfg.powerSaver || (cfg.autoQuality && qLevel >= 2) || guard >= 1);
  // the heaviest level: also pause the moving layer drawn on the page itself (the live-candle atmosphere)
  const heavyNow = () => !!(guard >= 2 || (cfg.autoQuality && qLevel >= qlevels().length - 1 && pressureBad));
  let liteWas = null;
  const publishQ = () => { document.documentElement.setAttribute("data-bd-q", `${qLevel + 1}/${qlevels().length}@${refreshHz}`);
    if (liteNow() !== liteWas) { liteWas = liteNow(); document.documentElement.classList.toggle("bd-lite", liteWas); pushCandles(); pushFx();
      try { applyAtmo(); applyFrame(); applyBars(); applyPanels(); applySides(); applyUiStyle(); applyDialogs(); applyTicker(); applyLegend(); applyTradePanel(); } catch {} } };
  // input delay (a capture listener runs before any page handler: now minus the event's time) and long tasks, per 2 s
  { const lag = [], LT = { ms: 0 }; let winT = performance.now(), badRuns = 0, goodRuns = 0;
    let stillT = 0;
    const note = (e) => { inputAt = performance.now(); if (cfg.enabled && lag.length < 400) lag.push(inputAt - e.timeStamp);
      if (cfg.powerSaver || heavyNow()) { syncStill(); clearTimeout(stillT); stillT = setTimeout(syncStill, 450); } };   // (video wallpapers: see stillNow)
    for (const t of ["pointerdown", "pointermove", "keydown", "wheel"]) addEventListener(t, note, { capture: true, passive: true });
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) LT.ms += e.duration - 50; }).observe({ type: "longtask" }); } catch {}
    (function check() { setTimeout(check, 2000);
      const now = performance.now(), span = now - winT; winT = now;
      if (!cfg.enabled || document.hidden || !views.length) { lag.length = 0; LT.ms = 0; return; }
      lag.sort((a, b) => a - b); const p95 = lag.length >= 5 ? lag[Math.floor(lag.length * 0.95)] : 0, blocked = LT.ms / Math.max(1, span); lag.length = 0; LT.ms = 0;
      pressureBad = p95 > 50 || blocked > 0.2; pressureGood = p95 < 20 && blocked < 0.05;
      document.documentElement.setAttribute("data-bd-press", `lag${Math.round(p95)}ms blocked${Math.round(blocked * 100)}%`);   // for Diagnose / tests
      if (pressureBad) { badRuns++; goodRuns = 0; } else if (pressureGood) { goodRuns++; badRuns = 0; } else { badRuns = 0; goodRuns = 0; }
      if (cfg.autoQuality && !cfg.powerSaver) {          // Auto: step down (also with a still wallpaper, where the frame watcher doesn't run)
        guard = 0; const L = qlevels();
        if (pressureBad && qLevel < L.length - 1 && now - stepAt > 2500) { qLevel++; stepAt = now; smoothFor = 0; views.forEach(sizeCanvas); publishQ(); }
        else if (pressureBad && qLevel >= L.length - 1) publishQ();
      } else if (!cfg.powerSaver) {                      // Max: the safety floor
        const was = guard;
        if (badRuns >= 2) guard = Math.min(2, guard + 1), badRuns = 0;
        else if (goodRuns >= 8 && guard > 0) guard--, goodRuns = 0;   // ~16 s of quick answers before easing back
        if (guard !== was) { views.forEach(sizeCanvas); publishQ(); }
      } else guard = 0;
    })(); }

  // Trade focus (part of Auto quality, and Power saver): while the mouse is over the order ticket / Buy & Sell buttons /
  // positions panel, or while you're in a position, everything that moves on its own holds still (the wallpaper, the
  // live-candle atmosphere, zone animation, endless CSS loops, reaction pulses), so nothing competes with your click.
  // The look stays exactly as it is: holding still costs nothing to switch, so it can't add work right before a click.
  // In a position = the open P&L hook.js / lw.js read off the chart's position line (data-ws-pnl) was drawn recently.
  // Moves again ~0.6 s after you leave the panel / the position closes. Never cancels or changes an event.
  const ORDER_SEL = '[data-name="order-panel"], [class*="layout__area--tradingpanel"], [class*="layout__area--bottom"], [data-name="buy-order-button"], [data-name="sell-order-button"], [data-name="place-and-modify-button"], [data-name*="buy-sell"], [class*="buySellButtons"], [class*="order-panel"], [class*="orderPanel"], [class*="OrderEntry"], [class*="order-entry"], [class*="orderEntry"], [class*="dom-ladder"], [class*="DomLadder"]';
  const ORDER_TEXT = /^(?:buy|sell|close|flatten|reverse|cancel(?: all)?|cxl|join (?:bid|ask)|(?:buy|sell) (?:mkt|market|bid|ask|limit|stop))(?:\s*[\d.,]+)?$/i;
  const orderMemo = new WeakMap();
  // (the answer per element is remembered: pointerover only fires when the element under the mouse changes)
  const isOrderEl = (t) => {
    if (!t || t.nodeType !== 1) return false;
    const m = orderMemo.get(t); if (m !== undefined) return m;
    let hit = false;
    try { hit = !!t.closest(ORDER_SEL); } catch {}
    for (let el = t, i = 0; !hit && el && el.nodeType === 1 && i < 6; el = el.parentElement, i++)
      if (el.childElementCount <= 3) { const s = (el.textContent || "").trim(); hit = s.length <= 24 && ORDER_TEXT.test(s.replace(/\s+/g, " ")); }
    orderMemo.set(t, hit);
    return hit;
  };
  addEventListener("pointerover", (e) => { overOrder = !!cfg.enabled && isOrderEl(e.target); if (overOrder) syncHold(); }, { capture: true, passive: true });
  addEventListener("pointerout", (e) => { if (!e.relatedTarget) overOrder = false; }, { capture: true, passive: true });
  const holdWanted = () => !!(cfg.enabled && (cfg.autoQuality || cfg.powerSaver) &&
    (overOrder || (() => { const p = readPnlRaw(); return !!p && Date.now() - p.ts < 8000; })()));
  function syncHold() {
    const want = holdWanted(), now = performance.now();
    if (want) holdOff = now + 600;
    const next = want || now < holdOff;
    if (next === holdOn) return;
    holdOn = next; document.documentElement.toggleAttribute("data-bd-hold", holdOn);
    if (!holdOn) try { atmoKick(); } catch {}
    syncStill();
  }
  setInterval(syncHold, 250);

  // While one of TradingView's big windows is open (Trade / broker login, Settings, Indicators, Alerts…) the wallpaper
  // holds still: TradingView blurs everything behind those windows, and re-blurring a moving wallpaper every frame
  // is what made them feel slow to open. Only fires when TradingView adds/removes a window, so it costs nothing.
  let dlgOpen = false, dlgObs = null, dlgT = 0;
  function checkDialogs() {
    dlgT = 0;
    const root = document.getElementById("overlap-manager-root");
    const open = !!root && [...root.querySelectorAll('[class^="dialog-"], [data-dialog-name]')].some((el) => {
      const r = el.getBoundingClientRect(); return r.width >= 300 && r.height >= 200; });
    if (open !== dlgOpen) { dlgOpen = open; document.documentElement.toggleAttribute("data-bd-dlg", open); syncStill(); }
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
    let last = performance.now(), due = last;
    measureRefresh();
    const step = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (document.hidden || window.__bdBackground || cfg.paused || (cfg.focus && cfg.enabled) || dlgOpen || holdOn) { last = now; due = now; hLast = 0; return; }   // holdOn: trade focus   // __bdBackground: a desktop-app tab you're not looking at
      const watch = cfg.autoQuality && !cfg.powerSaver && (cfg.fps === "auto" || cfg.fps === "max");
      if (watch) trackHealth(now);
      // Target fps: user setting, power saver, or the current auto-quality cap (whichever is lowest).
      let target = cfg.powerSaver ? 15 : cfg.fps === "auto" ? 60 : cfg.fps === "max" ? refreshHz : +cfg.fps;
      if (watch) target = Math.min(target, qlv().fps);
      if (guard >= 1) target = Math.min(target, guard >= 2 ? 20 : 30);   // the safety floor (see liteNow)
      // Power saver, or trading slowed down at the lowest level: the wallpaper holds still while you use the chart
      // (clicks, drags, the crosshair) and moves again ~0.4 s after
      if ((cfg.powerSaver || heavyNow()) && now - inputAt < 400) { last = now; due = now; return; }
      const gap = now - last;
      // Paced on a running schedule: a frame may come up to half a refresh early, so over a second the rate is the one
      // asked for on any display. (Skipping whole refreshes until the full interval had passed gave 48 fps instead of
      // 60 on a 144 Hz screen, 37 on 75 Hz, 30 instead of 40 on 60 Hz.)
      const iv = 1000 / target, per = 1000 / (refreshHz || 60);
      if (now < due - per / 2) return;
      due = now - due > iv ? now + iv : due + iv;   // (fell behind: start the schedule again from now)
      const dt = Math.min(0.1, gap / 1000) * cfg.speed * calmFactor() * (1 + Math.abs(mood) * cfg.reactStrength * 1.5);
      last = now;
      for (const v of views) { if (v.skin) { v.clock += dt; v.skin.frame(v.clock, dt); } if (v.fx) { v.fxClock += dt; v.fx.frame(v.fxClock, dt); } }
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
    const health = 1000 / (hAcc / hCount), L = qlevels(), busy = workerLoad();
    hStart = now; hAcc = hCount = 0;
    // struggling = the page drops frames, OR the wallpaper's worker can't keep up (the page itself can look fine then,
    // but the wallpaper stutters and a CPU core sits at 100%)
    const bad = health < refreshHz * 0.8 || busy > 0.25 || pressureBad, good = health > refreshHz * 0.92 && busy < 0.08 && pressureGood;
    document.documentElement.setAttribute("data-bd-health", `${Math.round(health)}fps busy${Math.round(busy * 100)}%`);   // for Diagnose / tests
    if (bad && qLevel < L.length - 1 && now - stepAt > 2500) {
      qLevel++; stepAt = now; smoothFor = 0; if (now - lastUp < 25000) needSmooth = Math.min(32, needSmooth * 2);   // failed soon after climbing: wait longer next time
      views.forEach(sizeCanvas); publishQ();
    } else if (good && qLevel > 0) {
      if (++smoothFor >= needSmooth) { qLevel--; smoothFor = 0; lastUp = now; views.forEach(sizeCanvas); publishQ(); }
    } else if (!good) smoothFor = 0;
  }

  function teardown() {
    if (chartRO) chartRO.disconnect();
    releaseStack();
    for (const v of views) { if (v.skin && v.skin.remove) try { v.skin.remove(); } catch {} if (v.fx && v.fx.remove) try { v.fx.remove(); } catch {} }
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
      // Tradovate: a chart-only capture can't include its WebGL chart, so the panel takes the whole page / screen there
      if (TDV && (msg.ws === "snapshot" || msg.ws === "capinfo" || (msg.ws === "clip" && msg.mode !== "screen"))) return;
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
  // the candle settings hook.js / lw.js draw with, for a config (yours, or one chart's own: Style each chart)
  function candlesJSON(c) {
    if (!(c.enabled && c.candleOn)) return null;
    const laser = c.candleFxEdge === "laser";   // 0.1.84-0.1.85's Laser edge light is Borders › Light now (settings not migrated yet)
    const parts = { wick: c.candleWick, wickUp: c.candleWickUp, wickDown: c.candleWickDown, border: laser && (!c.candleBorder || c.candleBorder === "none") ? "light" : c.candleBorder, borderUp: c.candleBorderUp,
      borderDown: c.candleBorderDown, borderW: c.candleBorderW, hollow: c.candleHollow, wickW: c.candleWickW, bodyW: c.candleBodyW };
    return JSON.stringify({ up: c.candleUp, down: c.candleDown, glow: c.candleGlow, look: c.candleLook, closed: c.candleClosedLook || "", parts, lite: liteNow(),
      fx: { core: c.candleFxCore, edge: laser ? "off" : c.candleFxEdge, amt: c.candleFxAmt }, spot: spotWanted() });
  }
  function pushCandles() {
    const h = document.documentElement;
    const j = candlesJSON(cfg);
    if (j) h.setAttribute("data-ws-candles", j); else h.removeAttribute("data-ws-candles");
    // "Shift" look: colours cycle over time via a GPU hue animation on the chart layer (no redraws needed)
    const shift = cfg.enabled && cfg.candleOn && cfg.candleLook === "shift";
    h.classList.toggle("bd-shift", shift);
    h.style.setProperty("--bd-shift-dur", Math.max(2, Math.min(60, +cfg.shiftSpeed || 10)) + "s");
    // no forced rebuild here: hook.js sees the new attribute, redraws instantly, and rebuilds once only if the colours changed
  }

  // Line glow + price scale styling, also drawn by hook.js
  const FX_KEYS = ["lineGlow", "markMode", "markColor", "scaleText", "scaleGlow", "scaleBold", "scaleBg", "scaleBgColor", "scaleLabels", "scaleSize", "scaleFont",
    "bracketOn", "bracketSize", "bracketBack", "bracketFill", "bracketText", "bracketProfit", "bracketLoss",
    "bracketBorderColor", "bracketBorderW", "bracketLineColor", "bracketLineW", "bracketDebug", "privacy", "privacyPnl", "bracketQty",
    "indMode", "indColor", "indCustom", "drawOn", "zoneFill", "zoneDim", "zoneShape", "zoneBorder", "zoneStyle", "zoneReact", "indGrad", "txtMode", "txtColor", "txtOutline", "txtSize", "gridOn", "gridColor", "gridAlpha", "gridW", "gridStyle", "chOn", "chColor", "chW", "chStyle", "chGlow", "chGlowColor", "chLabels", "plOn", "plColor", "plW", "plStyle", "sbOn", "sbColor", "sbW", "sbStyle", "axOn", "axColor", "axW", "axStyle"];
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
  // The wallpaper's colours (strongest hue + an up / down pair): shared with the panel's "Match everything", in skins.js
  const paletteFromData = (d) => window.PriismPalette.fromData(d);
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
  // the wallpaper's own colours (up to 5), taken once per wallpaper like the accent: indicators / zones use them
  let lastColors = [];
  // the colours indicators / zones use for "Wallpaper": the ones Match everything measured for THIS wallpaper (the
  // same reading the candles came from), else the chart's own sample
  function wallColorsNow() { const m = cfg.wallMatch, sig = String(cfg.skin) + "|" + String(cfg.mediaId || "");
    return m && m.src === sig && Array.isArray(m.colors) && m.colors.length >= 2 ? m.colors.slice(0, 5) : lastColors; }
  function rawColors() { const v = views[0], p = v && v.lum && v.lum.palette; return (p && Array.isArray(p.colors) && p.colors.length ? p.colors : []).slice(0, 5); }
  function hueOfHex(x) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx === mn) return 0; const d = mx - mn; let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; }
  function skinAccent() { return lastAccent; }
  let accentFor = "";
  // ---------- each chart in a layout matches ITS OWN wallpaper ----------
  // With different wallpapers on your charts (Multiple charts › Mix) and Match everything (or Auto-match) in use,
  // charts 2, 3, 4... get candles, indicator / zone colours and a skin accent from their own wallpaper. Each chart's
  // colours are read once per wallpaper (animated wallpapers shift colour all the time) and lifted so candles stay
  // readable on a dark wallpaper. Chart 1 keeps your usual colours. hook.js / lw.js apply them per chart.
  const lumHexC = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const mixHexC = (a, b, f) => "#" + [1, 3, 5].map((i) => { const x = parseInt(a.slice(i, i + 2), 16), y = parseInt(b.slice(i, i + 2), 16); return Math.round(x + (y - x) * f).toString(16).padStart(2, "0"); }).join("");
  const liftC = (x, bright) => { if (bright || !/^#[0-9a-f]{6}$/i.test(x || "")) return x; let f = 0, y = x; while (lumHexC(y) < 0.42 && f < 0.7) { f += 0.05; y = mixHexC(x, "#ffffff", f); } return y; };
  let chartsSig = "";
  function pushChartColors() {
    const h = document.documentElement;
    const mode = cfg.chartColors === "auto" || !cfg.chartColors ? (cfg.matchOnPick || cfg.wallMatch ? "wallpaper" : "same") : cfg.chartColors;
    const want = cfg.enabled && views.length > 1 && (mode === "custom" || (mode === "wallpaper" && new Set(views.map((v) => v.src)).size > 1));
    let out = null;
    if (want && mode === "custom") {                                                         // Style each chart: each its own settings
      out = views.map((v, i) => { const box = { l: Math.round(v.x || 0), t: Math.round(v.y || 0), r: Math.round((v.x || 0) + (v.w || 0)), b: Math.round((v.y || 0) + (v.h || 0)) };
        const ov = i && (cfg.chartStyle || {})[i + 1]; if (!ov || !Object.keys(ov).length) return box;
        const eff = { ...cfg, ...ov }, p = v.lum && v.lum.palette && v.src !== views[0].src ? (v.matchSrc === v.src && v.matchPal) || v.lum.palette : null;
        if (p && !v.matchPal) { v.matchPal = p; v.matchSrc = v.src; }
        return { ...box, cand: candlesJSON(eff), fx: fxJSON(eff, tickPushed, p) }; });
      if (!out.some((q, i) => i && q.fx)) out = null;
    } else if (want) {
      out = views.map((v, i) => {
        const box = { l: Math.round(v.x || 0), t: Math.round(v.y || 0), r: Math.round((v.x || 0) + (v.w || 0)), b: Math.round((v.y || 0) + (v.h || 0)) };
        if (!i || v.src === views[0].src) return box;                                        // chart 1 / same wallpaper: your colours
        if (!v.matchPal || v.matchSrc !== v.src) { const p = v.lum && v.lum.palette; if (p && p.up && p.down) { v.matchPal = p; v.matchSrc = v.src; v.matchBright = v.lum.mean > 0.55; } }
        const p = v.matchSrc === v.src ? v.matchPal : null; if (!p) return box;
        const ac = /^#[0-9a-f]{6}$/i.test(p.accent || "") ? p.accent : "", text = ac ? (v.matchBright ? mixHexC(ac, "#000000", 0.62) : mixHexC(ac, "#ffffff", 0.5)) : "";
        return { ...box, up: liftC(p.up, v.matchBright), down: liftC(p.down, v.matchBright), accent: ac, text, colors: (p.colors || []).slice(0, 5) };
      });
      if (!out.some((q, i) => i && q.up)) out = null;
    }
    // the legend text (indicator names / values) of each chart in a light tint of ITS wallpaper's colour: a CSS variable
    // set on that chart's own box (the legend CSS reads it), so it never touches the other charts
    charts.forEach((c, i) => {
      let el = c.el; for (let k = 0; k < 3 && el.parentElement && el.parentElement !== document.body && !charts.some((o) => o !== c && el.parentElement.contains(o.el)); k++) el = el.parentElement;
      const q = out && out[i], tint = q && q.text ? q.text : "";
      if (tint && cfg.lgOn) { el.style.setProperty("--bd-lg-text", tint); el.dataset.bdLgTint = "1"; }
      else if (el.dataset.bdLgTint) { el.style.removeProperty("--bd-lg-text"); delete el.dataset.bdLgTint; }
    });
    const sig = out ? JSON.stringify(out) : "";
    if (sig === chartsSig) return; chartsSig = sig;
    if (out) h.setAttribute("data-ws-charts", sig); else h.removeAttribute("data-ws-charts");
  }
  function updateBackdrop() {
    try { pushChartColors(); } catch {}
    // the skin colour is taken ONCE per wallpaper (animated wallpapers shift colour all the time; following that
    // re-coloured lines and panels again and again)
    const srcSig = String(cfg.skin) + "|" + String(cfg.mediaId || "");
    if (srcSig !== accentFor && rawAccent()) { accentFor = srcSig; lastAccent = rawAccent(); lastColors = rawColors(); pushFx(); applyPanels(); applyDialogs(); applyTicker(); applyFrame(); applyBars(); }
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
    try { atmoStatic(); } catch {}                           // Smart contrast follows the wallpaper's brightness
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
  // The indicators drawn on this chart (by colour, with a name where the platform gives one), for the panel's
  // "Each indicator" list. Only the copy drawing the page reports, and only when the list changed.
  let indSeenSig = "";
  setInterval(() => {
    if (!EXT || !owner || standDown || document.hidden || !cfg.enabled) return;
    const v = document.documentElement.getAttribute("data-bd-indseen") || "";
    if (!v || v === indSeenSig) return;
    indSeenSig = v;
    try { chrome.storage.local.set({ indSeen: { host: (IN_FRAME ? (document.referrer ? new URL(document.referrer).hostname : "") : "") || location.hostname, t: Date.now(), items: JSON.parse(v) } }); } catch {}
  }, 3000);
  // the chart styling hook.js / lw.js draw with, for a config (yours, or one chart's own); pal = that chart's wallpaper colours
  function fxJSON(c, tick, pal) {
    return JSON.stringify({ ...Object.fromEntries(FX_KEYS.map((k) => [k, c[k]])), tickSize: tick, bg: backdrop.bg, busy: backdrop.busy, prof: backdrop.prof || [], profs: backdrop.profs || [],
      accent: (pal && pal.accent) || skinAccent(), wallColors: pal && pal.colors && pal.colors.length >= 2 ? pal.colors.slice(0, 5) : wallColorsNow(), scaleFamily: fontStack(c.scaleFont), fontTick, lite: liteNow() });
  }
  function pushFx() {
    const h = document.documentElement;
    if (cfg.enabled) h.setAttribute("data-ws-fx", fxJSON(cfg, (tickPushed = tickSizeOf())));
    else h.removeAttribute("data-ws-fx");
    if (cfg.chartColors === "custom") try { pushChartColors(); } catch {}   // charts styled on their own follow too
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
    if (keys.some((k) => k === "panelMode" || k === "panelColor" || k === "candleUp" || k.startsWith("pn") || k === "uiAccent")) applyPanels();
    if (keys.some((k) => k.startsWith("tk") || k === "candleUp" || k === "enabled")) applyTicker();
    if (keys.includes("wallMatch")) pushFx();
    if (keys.some((k) => k.startsWith("lg") || k === "candleUp" || k === "enabled")) applyLegend();
    if (keys.some((k) => k.startsWith("dlg") || k === "panelMode" || k === "panelColor")) applyDialogs();
    if (keys.includes("sides") || keys.includes("leftBar") || keys.includes("enabled") || keys.includes("layer")) applySides();
    if (keys.some((k) => k.startsWith("ui")) || keys.includes("enabled")) applyUiStyle();
    if (keys.some((k) => k.startsWith("tp") || k === "candleUp" || k === "candleDown" || k === "candleOn" || k === "enabled")) applyTradePanel();
    if (keys.some((k) => k.startsWith("frame") || k === "candleUp" || k === "candleDown" || k === "candleOn" || k === "powerSaver")) applyFrame();
    if (keys.some((k) => k.startsWith("barPat") || k === "powerSaver" || k === "barMode" || k === "barColor" || k === "barColor2" || k === "barAlpha" || k === "barSize" || k === "barWhere" || k === "candleUp" || k === "candleDown" || k === "candleOn")) applyBars();
    if (keys.some((k) => FX_KEYS.includes(k)) || keys.includes("enabled") || keys.includes("layer")) pushFx();
    if (keys.some((k) => k.startsWith("atmo") || k === "zoneFx" || k === "vignette" || k === "vignetteAt" || k === "layer" || k === "powerSaver")) pushCandles();   // what the chart should track
    if (keys.some((k) => k.startsWith("atmo") || ATMO_KEYS.has(k))) applyAtmo();
    if (keys.includes("fps")) { resetQuality(); views.forEach(sizeCanvas); publishQ(); }
    if (keys.includes("res")) views.forEach(sizeCanvas);
    if (keys.includes("enabled") && !cfg.enabled) lensOn(false);
    if (keys.includes("react")) for (const v of views) setFx(v, v.src);   // effects that swell with music run next to it
    if (keys.includes("autoMatch")) { lastMatch = ""; setTimeout(measureBackdrop, 50); }   // re-derive the palette now
    if (keys.some((k) => k === "scaleFont" || k === "tkFont" || k === "uiFont")) ensureFonts();
    if (keys.includes("react") || keys.includes("enabled")) syncMusic();
    if (keys.some((k) => k === "chartColors" || k === "chartStyle" || k === "wallMatch" || k === "matchOnPick" || k.startsWith("candle") || FX_KEYS.includes(k))) pushChartColors();
    if (keys.includes("powerSaver") || keys.includes("autoQuality")) { liteWas = liteNow(); pushCandles(); pushFx(); }   // lite glow on / off
    if (keys.some((k) => k.startsWith("pnl")) || keys.includes("enabled")) renderPnl();
    if (keys.some((k) => k.startsWith("goal") || k === "journalOn") || keys.includes("enabled")) { if (!cfg.journalOn) jShot = null; renderGoal(); tickTrades(); }
    // a wallpaper's own settings / Recolour: rebuilt in place (unless the whole layer is rebuilt anyway)
    const optsChanged = keys.includes("skinOpts"); keys = keys.filter((k) => k !== "skinOpts");
    if (optsChanged && !keys.some((k) => REBUILD.has(k))) updateSkinOpts();
    keys = keys.filter((k) => !k.startsWith("atmo") && k !== "smartDim" && k !== "vignetteAt" && k !== "zoneFx" && !k.startsWith("candle") && !k.startsWith("wm") && !k.startsWith("ui") && !k.startsWith("pnl") && !k.startsWith("goal") && !k.startsWith("panel") && !k.startsWith("dlg") && !k.startsWith("timer") && !k.startsWith("privacy") && !k.startsWith("tradeClip") && !k.startsWith("tk") && !k.startsWith("tp") && !k.startsWith("pn") && !k.startsWith("frame") && !k.startsWith("bar") && !/Key$/.test(k) && !["focus", "focusHides", "clipLen", "clipMode", "clipFps", "clipQuality", "clipEdit", "clipAudio", "sessionSound", "welcomePending"].includes(k) && k !== "journalOn" && !FX_KEYS.includes(k));
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
  // clips and snapshots: the chart frame (Pattern skins), as on the page
  function drawFrame(g, box, dpr) {
    const P = window.PriismPatterns; if (!P || !(cfg.enabled && cfg.frameOn)) return;
    for (const v of views) { const f = v.frame; if (!f || f.hidden) continue;
      const r = frameRect(v);
      try { P.band(g, (v.x + r.l - box.left) * dpr, (v.y + r.t - box.top) * dpr, r.w * dpr, r.h * dpr, frameW(), { mode: cfg.frameMode, color: cfg.frameColor, color2: cfg.frameColor2,
        up: upColor(), down: downColor(), accent: skinAccent() || upColor(), mood: (f.style.getPropertyValue("--bd-mood-col") || "").trim(), round: true, pattern: cfg.framePattern,
        scale: cfg.frameSize, alpha: parseFloat(f.style.opacity) || 0.5, radius: frameR(), edge: !!cfg.frameEdge, dpr }); } catch {}
    }
  }
  // clips and snapshots: the same Live mood look, drawn on each chart (matches the CSS on the page)
  function drawMoodGlow(g, box, dpr) {
    if (!reactEl) return;
    const op = parseFloat(reactEl.style.opacity) || 0; if (op <= 0.01) return;
    const col = reactEl.style.getPropertyValue("--bd-react") || upColor(), isMusic = cfg.react === "music";
    const k = isMusic ? +cfg.reactStrength || 0.6 : Math.abs(mood) * cfg.reactStrength, look = reactEl.dataset.look || "glow", up = moodSide >= 0;
    const hex = (a) => col + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
    for (const v of views.length ? views : [{ x: box.left, y: box.top, w: box.width, h: box.height }]) {
      const x = (v.x - box.left) * dpr, y = (v.y - box.top) * dpr, w = v.w * dpr, h = v.h * dpr;
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha *= op;
      if (look === "horizon") {
        const cy = y + (up ? 1.06 : -0.06) * h; g.translate(x + w / 2, cy); g.scale(1.3 * w / 2, (0.45 + 0.35 * k) * h);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, hex(0.42)); gr.addColorStop(0.45, hex(0.14)); gr.addColorStop(0.78, hex(0));
        g.fillStyle = gr; g.fillRect(-1, -1, 2, 2);
      } else if (look === "frame") {
        g.strokeStyle = hex(0.9); g.lineWidth = 1.5 * dpr; g.shadowColor = hex(0.55); g.shadowBlur = (10 + 22 * k) * dpr;
        g.strokeRect(x + 0.75 * dpr, y + 0.75 * dpr, w - 1.5 * dpr, h - 1.5 * dpr);
      } else {
        const cy = y + (up ? 1.06 : -0.06) * h, gr = g.createRadialGradient(x + w / 2, cy, 0, x + w / 2, cy, Math.max(w, h) * 0.7);
        gr.addColorStop(0, hex(0.25)); gr.addColorStop(1, hex(0)); g.fillStyle = gr; g.fillRect(x, y, w, h);
        // inset glow around the edges (CSS: inset 0 0 B S colour). The shape is drawn far off-canvas and only its
        // shadow is offset back into view, so there is a soft glow and no hard frame.
        const B = (40 + 110 * k) * dpr, S = (2 + 10 * k) * dpr, OFF = 20000;
        g.shadowColor = hex(0.6); g.shadowBlur = B; g.shadowOffsetX = -OFF; g.fillStyle = "#000";
        g.beginPath(); g.rect(x - 4 * B + OFF, y - 4 * B, w + 8 * B, h + 8 * B); g.rect(x + S + OFF, y + S, w - 2 * S, h - 2 * S); g.fill("evenodd");
      }
      g.restore();
    }
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
        else if (v.recFrame) { g.filter = filt; drawFit(g, v.recFrame, dx, dy, dw, dh); g.filter = "none"; }   // an uploaded wallpaper's frame (wallFeed)
        else mediaMissed = true;
        if (v.fxEl) g.drawImage(v.fxEl, dx, dy, dw, dh);           // the effect over it (rain, snow...)
      } catch { mediaMissed = true; }
      if (!over && dim > 0) { g.fillStyle = `rgba(0,0,0,${dim})`; g.fillRect(dx, dy, dw, dh); }
      if (!over) for (const k of ["atmoS", "atmoL"]) { const ac = v[k]; if (ac && !ac.hidden && ac.isConnected) try { g.drawImage(ac, dx, dy, dw, dh); } catch {} }   // clarity, smoke and zone lights
      if (cfg.vignette > 0) {       // CSS: radial-gradient(ellipse at center, transparent X%, rgba(0,0,0,a) 100%)
        const inner = (70 - cfg.vignette * 40) / 100, a = 0.35 + cfg.vignette * 0.55;
        const vc = vgCentre(v), fx = vc ? vc[0] / 100 : 0.5, fy = vc ? vc[1] / 100 : 0.5;   // centred on the live price (Vignette › Centre)
        g.translate(dx + dw * fx, dy + dh * fy); g.scale(dw * Math.max(fx, 1 - fx) * Math.SQRT2, dh * Math.max(fy, 1 - fy) * Math.SQRT2);
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
      mediaMissed = drawWallpaper(g, box, dpr); drawFrame(g, box, dpr); drawMoodGlow(g, box, dpr);
      g.restore();
      drawChartCanvases(g, box, dpr);
    } else {                       // "On top": the wallpaper sits over the chart, clipped to the chart panes
      drawChartCanvases(g, box, dpr);
      g.save(); g.globalAlpha = layerAlpha; g.beginPath();
      for (const c of (charts.length ? charts : [{ r: box }])) g.rect((c.r.left - box.left) * dpr, (c.r.top - box.top) * dpr, c.r.width * dpr, c.r.height * dpr);
      g.clip(); mediaMissed = drawWallpaper(g, box, dpr); drawFrame(g, box, dpr); drawMoodGlow(g, box, dpr); g.restore();
    }
    drawMoodPill(g, box, dpr); drawPnlOverlay(g, box, dpr); drawGoalOverlay(g, box, dpr); drawTimerOverlay(g, box, dpr); drawWatermark(g, box, dpr, wmImg);
    return { mediaMissed };
  }
  // preload the right watermark image for compositing (corner logo, or the tiled pattern), or null if wm is off
  async function watermarkImage() {
    if (!cfg.wmOn) return null;
    try { return await loadImage(cfg.wmStyle === "tiled" ? tilePattern() : BRAND_LOGO); } catch { return null; }
  }
  const captureSnapshot = () => withSharpWallpaper(captureSnapshot0);
  async function captureSnapshot0() {
    if (!cfg.enabled) return { ok: false, reason: "Turn Priism Skins on first." };
    const box = chartsBox();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = Math.max(1, Math.round(box.width * dpr)), H = Math.max(1, Math.round(box.height * dpr));
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d");
    const wmImg = await watermarkImage();
    const stopWallFeed = await startWallFeed(10, Math.max(W, 1280));   // an uploaded wallpaper's current frame
    let mediaMissed; try { ({ mediaMissed } = compositeFrame(g, box, dpr, wmImg)); } finally { stopWallFeed(); }
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
    // charts are thin lines and small text: they need more bits than video of people (1080p30: ~8.7 Mbps Balanced, ~15.5 High)
    const high = Math.min(45e6, Math.max(8e6, px * 0.25)), bal = Math.min(20e6, Math.max(5e6, px * 0.14));
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
      /* clean black, like the panel: white for the main action, the accent only for the crop / trim handles */
      *{font-family:ui-sans-serif,"Inter","Segoe UI",system-ui,sans-serif}
      .bg{background:rgba(0,0,0,.84)}
      .card{background:#0b0b0d;border-color:rgba(255,255,255,.1);border-radius:18px;padding:16px 18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.95)}
      .top b{font-size:15.5px;font-weight:700}.top small,.row>span,.msg{color:#8e8e96}.row{color:#b9b9c2}
      .stage{border-radius:12px}
      button{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#e8e8ee;border-radius:10px;padding:7px 12px;font-weight:600;transition:background .15s,border-color .15s}
      button:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.22)}
      button.on{background:#1d1d20;border-color:rgba(255,255,255,.5);color:#fff}
      button.go{background:#fff;color:#000;border:none;font-weight:700}button.go:hover{background:#e9e9ee}
      .trim .bar,.prog{background:#232326}
      .est{color:#c8c8d0}
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
      // Size = the short side (1080p, 720p...), never upscaled; the long side is capped at 1920 (3840 = 4K with Ultra sharpness)
      const k = Math.min(1, outSize ? outSize / Math.min(W, H) : 1, (cfg.res === "ultra" ? 3840 : 1920) / Math.max(W, H));
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
        saveBlob(out, name.replace(/\.(webm|mp4)$/, "") + "-edited." + clipExt(mime));
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
  // MP4 first: it plays everywhere (phones, Windows, Mac, every editing app and social site). H.264 + AAC is the most
  // compatible; then H.264 + Opus; WebM only on a browser that can't record MP4.
  function clipMime(withAudio) {
    const list = withAudio
      ? ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,opus", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["video/mp4;codecs=avc1", "video/mp4;codecs=avc1.640028", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    return list.find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
  }
  const clipExt = (mime) => (/mp4/.test(mime || "") ? "mp4" : "webm");
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
    card.className = "bd-ui-card"; card.style.cssText = "top:70px";
    const txt = document.createElement("span"); txt.textContent = `Priism Skins \u00B7 add your computer's sound to the ${dur}s clip`;
    const go = document.createElement("button"), no = document.createElement("button");
    go.textContent = "Choose sound"; no.textContent = "Record without it";
    go.className = "bd-ui-btn pri";
    no.className = "bd-ui-btn";
    card.append(txt, go, no); document.documentElement.appendChild(card);
    go.onclick = () => { cancelScreenAsk(); pick(); };
    no.onclick = () => { cancelScreenAsk(); captureClip(dur, fps, null, true).catch(() => {}); };
    setTimeout(() => { if (screenAsk === card) cancelScreenAsk(); }, 90000);
    return { ok: true, awaiting: true };
  }
  // Uploaded wallpapers play in a protected frame (player.html) whose pixels the page can't read. For a chart-only
  // clip, that frame sends its picture to us over a private channel (MessageChannel, posted straight to the frame, so
  // the chart page never sees it), unlocked with a secret kept in the extension's storage.
  async function recToken() {
    try { const s = await chrome.storage.local.get("recToken"); if (s.recToken) return s.recToken;
      const t = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)); await chrome.storage.local.set({ recToken: t }); return t; } catch { return ""; }
  }
  async function startWallFeed(fps, maxW) {
    const players = views.filter((v) => v.content && v.content.tagName === "IFRAME" && v.content.contentWindow);
    if (!players.length || typeof MessageChannel === "undefined" || !(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)) return () => {};
    const token = await recToken(); if (!token) return () => {};
    const origin = new URL(chrome.runtime.getURL("/")).origin, ports = [];
    for (const v of players) {
      const ch = new MessageChannel(); ports.push([v, ch.port1]);
      ch.port1.onmessage = (e) => { const b = e.data && e.data.bmp; if (!b) return; if (v.recFrame && v.recFrame.close) try { v.recFrame.close(); } catch {} v.recFrame = b; };
      try { v.content.contentWindow.postMessage({ __wicked: "rec-start", token, fps, maxW }, origin, [ch.port2]); } catch {}
    }
    // give the first frame a moment to arrive, so the clip doesn't start without the wallpaper
    for (let i = 0; i < 20 && players.some((v) => !v.recFrame); i++) await new Promise((r) => setTimeout(r, 50));
    return () => { for (const [v, port] of ports) { try { port.postMessage({ stop: true }); port.close(); } catch {} if (v.recFrame && v.recFrame.close) try { v.recFrame.close(); } catch {} v.recFrame = null; } };
  }
  const captureClip = (...a) => withSharpWallpaper(() => captureClip0(...a));
  async function captureClip0(seconds, fpsWanted, display, soundAsked) {
    if (!cfg.enabled) return { ok: false, reason: "Turn Priism Skins on first." };
    if (clipRec) return { ok: false, reason: "Already recording a clip." };
    if (typeof MediaRecorder === "undefined") return { ok: false, reason: "Your browser can't record clips." };
    const box = chartsBox();
    // full resolution: your screen's real pixels (up to 2x), the long side capped by Quality: Small 1280, Balanced 1920,
    // High 2560 (3840 with Sharpness › Ultra 4K)
    const cap0 = cfg.clipQuality === "small" ? 1280 : cfg.clipQuality === "high" ? (cfg.res === "ultra" ? 3840 : 2560) : (cfg.res === "ultra" ? 3840 : 1920);
    const dpr0 = Math.min(2, devicePixelRatio || 1), dpr = Math.min(dpr0, cap0 / Math.max(1, Math.max(box.width, box.height)));
    const W = Math.max(2, Math.round(box.width * dpr)) & ~1, H = Math.max(2, Math.round(box.height * dpr)) & ~1;  // even dims for encoders
    const cap = document.createElement("canvas"); cap.width = W; cap.height = H;
    const g = cap.getContext("2d");
    const wmImg = await watermarkImage();
    const capFps = Math.max(10, Math.min(60, +fpsWanted || 30));
    const stopWallFeed = await startWallFeed(capFps, Math.max(W, 640));
    // first frame to check we can actually read the pixels (a tainted/cross-origin chart will throw on record)
    const { mediaMissed } = compositeFrame(g, box, dpr, wmImg);
    let stream;
    try { stream = cap.captureStream(capFps); } catch { stopWallFeed(); return { ok: false, reason: "Your browser can't record this chart." }; }
    let au = null; try { au = await clipAudioTrack(display || null); } catch {}
    if (au && au.track) stream.addTrack(au.track);
    const mime = clipMime(!!au);
    const stopAudio = () => { try { au && au.stop(); } catch {} try { display && display.getTracks().forEach((t) => t.stop()); } catch {} };
    let rec;
    // Any length from 2s to 2 minutes, at the quality you picked (based on the clip's real size + frame rate).
    const dur = Math.max(2, Math.min(MAX_CLIP_SECONDS, +seconds || 5));
    const bps = clipBps(cap.width, cap.height, capFps, dur, cfg.clipQuality);
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: bps } : undefined); }
    catch { stopAudio(); stopWallFeed(); return { ok: false, reason: "Your browser can't record clips." }; }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    clipRec = rec;
    // Every clip is saved by the page itself the moment it ends. The popup closes when you click away,
    // so it must never be the thing that holds the file.
    const autoSave = true;
    // A small countdown badge on the chart. Click it to stop early. It is not part of the recording.
    const badge = document.createElement("div");
    badge.className = "bd-ui-rec";
    badge.title = "Click to stop and save now";
    document.documentElement.appendChild(badge);
    const t0 = performance.now();
    const paint = () => { const left = Math.max(0, Math.ceil(dur - (performance.now() - t0) / 1000)); badge.textContent = `Recording ${left}s \u00B7 click to stop`; };
    paint(); const badgeTimer = setInterval(paint, 250);
    return await new Promise((resolve) => {
      let rafId = 0, done = false, stopTimer = 0;
      const stop = () => { clearTimeout(stopTimer); try { rec.state !== "inactive" && rec.stop(); } catch {} };
      badge.onclick = stop; stopClip = stop;
      const cleanup = () => { done = true; cancelAnimationFrame(rafId); clearTimeout(stopTimer); clearInterval(badgeTimer); badge.remove(); clipRec = null; stopWallFeed(); };
      const draw = () => { if (done) return; try { compositeFrame(g, box, dpr, wmImg); } catch {} rafId = requestAnimationFrame(draw); };
      rec.onstop = async () => {
        cleanup();
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        stopAudio();
        if (!chunks.length) return resolve({ ok: false, reason: "The browser blocked recording (a cross-origin chart)." });
        const blob = new Blob(chunks, { type: mime || "video/webm" });
        if (autoSave) {
          const q = parseTitle(), name = `priism-${((q && q.sym) || "chart").replace(/[^\w-]+/g, "")}-${Math.round((performance.now() - t0) / 1000)}s.${clipExt(mime)}`;
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
  async function waitForFreshScreen(stream) {
    const t = stream.getVideoTracks()[0];
    await sleep(900);                                            // the picker fades out over ~0.3–0.6 s
    try {                                                        // and wait for one new frame after that, if we can see frames
      if (t) {
        const v = document.createElement("video"); v.muted = true; v.srcObject = new MediaStream([t]);
        await v.play().catch(() => {});
        if (v.requestVideoFrameCallback) await Promise.race([new Promise((r) => v.requestVideoFrameCallback(() => r())), sleep(500)]);
        v.pause(); v.srcObject = null;
      }
    } catch {}
  }
  function startScreenFlow(seconds, fps) {
    if (screenBusy || clipRec) return { ok: false, reason: "Already recording." };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return { ok: false, reason: "Your browser can't record the screen on this page." };
    cancelScreenAsk();
    const dur = Math.max(2, Math.min(MAX_CLIP_SECONDS, +seconds || 5));
    const card = document.createElement("div"); card.id = "bd-screenask"; screenAsk = card;
    card.className = "bd-ui-card"; card.style.cssText = "top:70px";
    const txt = document.createElement("span"); txt.textContent = `Priism Skins \u00B7 record the screen for ${dur}s`;
    const go = document.createElement("button"), no = document.createElement("button");
    go.textContent = "Choose what to record"; no.textContent = "Cancel";
    go.className = "bd-ui-btn pri";
    no.className = "bd-ui-btn";
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
    // The first frames of a new screen share still show Chrome's "Choose what to share" window closing (and the
    // screen as it was a moment ago). Start recording only once the picker is gone and a fresh frame has arrived.
    await waitForFreshScreen(stream);
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
      const blob = new Blob(chunks, { type: mime || "video/webm" }), name = `priism-screen-${((q && q.sym) || "chart").replace(/[^\w-]+/g, "")}-${secs}s.${clipExt(mime)}`;
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
    card.className = "bd-ui-card"; card.style.cssText = "top:56px;z-index:2147483646;max-width:min(720px,92vw);padding:11px 14px";
    const t = document.createElement("span"); t.textContent = text; t.style.cssText = "flex:1;line-height:1.35"; card.append(t);
    const done = () => { try { localStorage.setItem("bdTip:" + id, String(Date.now())); } catch {} card.remove(); };
    actions.forEach(([label, fn], i) => { const b = document.createElement("button"); b.textContent = label;
      b.className = i === 0 ? "bd-ui-btn pri" : "bd-ui-btn";
      b.onclick = () => { done(); if (fn) fn(); }; card.append(b); });
    document.documentElement.appendChild(card);
  }
  let tipsShown = false;
  function chartTips() {
    if (tipsShown || !cfg.enabled || !owner || standDown || IN_FRAME || !/(^|\.)tradingview\.com$/.test(location.hostname)) return;
    const h = document.documentElement;
    if (EXT && cfg.welcomePending && Date.now() - cfg.welcomePending < 864e5) {
      tipsShown = true;
      try { chrome.storage.local.set({ welcomePending: 0 }); } catch {}
      return tipCard("welcome", "Priism Skins is on! To change your look: click the puzzle icon in Chrome's toolbar, pin Priism Skins, then click it. One tap on a look changes the whole chart.",
        [["Got it", null]]);
    }
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
  function flash(msg, ms) {
    const t = document.createElement("div"); t.className = "bd-flash"; t.textContent = msg; if (ms) t.style.animationDuration = ms + "ms";
    document.documentElement.appendChild(t); setTimeout(() => t.remove(), ms || 1400);
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
    if (isToggle) { if (plan() === "none") { flash("Priism needs an invite code or licence key: open the Priism panel to enter it", 3500); return; }
      const next = !cfg.enabled; save({ enabled: next }); flash(next ? "Priism Skins on" : "Priism Skins off"); return; }
    if (isPriv) { const next = !cfg.privacy; save({ privacy: next }); flash(next ? "Streamer mode on \u00B7 your numbers are hidden" : "Streamer mode off"); return; }
    if (EXT && !owner) return;                      // only the frame that owns the chart records / snaps
    if (isRec) { doRecord(); return; }
    if (isSnap) { doSnap(); return; }
    const next = !cfg.focus; save({ focus: next });
    flash(next ? `Focus on \u00B7 ${keyLabel(cfg.focusKey)} to bring it back` : "Focus off");
  }, true);

  // ---------- Magnifier: a round zoom lens over the chart, under your cursor (Settings › Magnifier) ----------
  // Visual only: it redraws the wallpaper and TradingView's own chart canvases around the cursor, bigger. Clicks go
  // straight through it, so you can place a drawing or an order exactly where the lens shows.
  let lens = null;
  function lensOn(want) {
    if (!want) { if (lens) { cancelAnimationFrame(lens.raf); removeEventListener("pointermove", lens.move, true); lens.el.remove(); lens = null; } return; }
    if (lens) return;
    const el = document.createElement("div"); el.id = "bd-lens"; el.dataset.bdOwner = ME.token; el.hidden = true;
    const cv = document.createElement("canvas"); el.appendChild(cv); document.documentElement.appendChild(el);
    lens = { el, cv, g: cv.getContext("2d"), x: -1, y: -1, raf: 0, last: 0, dirty: true };
    lens.move = (e) => { lens.x = e.clientX; lens.y = e.clientY; lens.dirty = true; };
    addEventListener("pointermove", lens.move, true);
    const loop = (now) => {
      if (!lens) return; lens.raf = requestAnimationFrame(loop);
      if (!lens.dirty && now - lens.last < 120) return;                       // the chart itself moves too: a few times a second
      lens.dirty = false; lens.last = now;
      const S = { s: 160, m: 220, l: 300 }[cfg.lensSize] || 220, Z = Math.max(1.5, Math.min(6, +cfg.lensZoom || 2.5)), dpr = Math.min(2, devicePixelRatio || 1);
      const inside = charts.some((c) => lens.x >= c.r.left && lens.x <= c.r.right && lens.y >= c.r.top && lens.y <= c.r.bottom);
      lens.el.hidden = !inside; if (!inside) return;
      if (lens.cv.width !== Math.round(S * dpr)) { lens.cv.width = lens.cv.height = Math.round(S * dpr); lens.el.style.width = lens.el.style.height = S + "px"; }
      lens.el.style.transform = `translate(${Math.round(lens.x - S / 2)}px, ${Math.round(lens.y - S / 2)}px)`;
      const w = S / Z, box = { left: lens.x - w / 2, top: lens.y - w / 2, width: w, height: w, right: lens.x + w / 2, bottom: lens.y + w / 2 }, k = dpr * Z, g = lens.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingQuality = "high";
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bd-page-bg").trim() || "#0b0e16"; g.fillRect(0, 0, lens.cv.width, lens.cv.height);
      try { if (cfg.layer !== "over") { g.save(); g.globalAlpha = Math.max(0, Math.min(1, +cfg.opacity)); drawWallpaper(g, box, k); g.restore(); } drawChartCanvases(g, box, k); } catch {}
      const c = lens.cv.width / 2; g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = Math.max(1, dpr);   // a small cross at the exact point
      g.beginPath(); g.moveTo(c - 7 * dpr, c); g.lineTo(c - 2 * dpr, c); g.moveTo(c + 2 * dpr, c); g.lineTo(c + 7 * dpr, c); g.moveTo(c, c - 7 * dpr); g.lineTo(c, c - 2 * dpr); g.moveTo(c, c + 2 * dpr); g.lineTo(c, c + 7 * dpr); g.stroke();
      lens.el.style.setProperty("--bd-lens", /^#[0-9a-f]{6}$/i.test(cfg.uiAccent || "") ? cfg.uiAccent : skinAccent() || upColor());
    };
    lens.raf = requestAnimationFrame(loop);
  }
  addEventListener("keydown", (e) => {
    if (e.repeat || !cfg.enabled || (EXT && !owner)) return;
    if (e.key === "Escape" && lens) { lensOn(false); return; }
    if (!keyMatch(e, cfg.lensKey)) return;
    const tag = (e.target && e.target.tagName) || ""; if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
    e.preventDefault(); e.stopPropagation();
    lensOn(!lens); if (lens) flash(`Magnifier on \u00B7 ${keyLabel(cfg.lensKey)} or Esc to close`, 2200);
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
    if (h.classList.contains("bd-on") !== wantOn && cfg.enabled) { h.classList.toggle("bd-on", wantOn); h.classList.toggle("bd-panels", wantOn && !!panelCol); repaint(); }
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
    const open = [], events = []; let prog = null;
    for (const s of M.sessions) for (const [o, c] of sessionTimes(s, now)) {
      if (now >= o && now < c && !open.includes(s.label)) open.push(s.label);
      if (now >= o && now < c && M.main.includes(s.id)) prog = (now - o) / (c - o);   // how far into the main session
      if (M.main.includes(s.id)) { if (o > now) events.push([o, s.label + " opens"]); if (c > now) events.push([c, s.label + " closes"]); }
    }
    // fully closed (weekend, CME daily break): the soonest reopening of ANY session matters most
    if (!open.length) for (const s of M.sessions) for (const [o] of sessionTimes(s, now)) if (o > now) events.push([o, s.label + " opens"]);
    events.sort((a, b) => a[0] - b[0]);
    const nx = events[0], head = open.length ? open.join(" + ") + " open" : "Closed";
    if (!nx) return { open: !!open.length, name: M.name, text: head };
    const far = nx[0] - now > 864e5, sess = M.sessions.find((s) => nx[1].startsWith(s.label));
    // "at": the moment it happens, in your own time (with the day when it isn't today); "in": a countdown
    const at = () => { const d = new Date(nx[0]), today = new Date(now).toDateString() === d.toDateString();
      return "at " + new Intl.DateTimeFormat(undefined, today ? { hour: "numeric", minute: "2-digit" } : { weekday: "short", hour: "numeric", minute: "2-digit" }).format(d); };
    const when = cfg.timerFormat === "at" ? at() : far ? new Intl.DateTimeFormat("en-US", { timeZone: sess.tz, weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(nx[0])) : `in ${dur(nx[0] - now)}`;
    const next = `${nx[1]} ${when}`;
    return { open: !!open.length, name: M.name, prog, text: cfg.timerShow === "next" ? next : `${head} \u00B7 ${next}` };
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
      timerEl.innerHTML = '<i></i><b></b><span></span><u></u>';
      document.documentElement.appendChild(timerEl);
    }
    const sty = ["pill", "glass", "minimal"].includes(cfg.timerStyle) ? cfg.timerStyle : "pill";
    timerEl.classList.toggle("bd-t-glass", sty === "glass"); timerEl.classList.toggle("bd-t-min", sty === "minimal");
    timerEl.style.setProperty("--tc", upColor());
    tickTimer(); placeTimer();
    if (!timerIv) timerIv = setInterval(() => { if (!document.hidden) tickTimer(); }, 1000);
  }
  function tickTimer() {
    if (!timerEl) return;
    let t; try { t = timerText(); } catch { t = { open: false, name: "", text: "" }; }
    timerEl.classList.toggle("bd-t-open", t.open);
    timerEl.style.setProperty("--tp", t.prog != null ? (Math.round(t.prog * 1000) / 10) + "%" : "0%");
    timerEl.style.display = cfg.timerClosed === "hide" && !t.open ? "none" : "";      // "hide while the market is closed"
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
  // Two copies of Priism on one page (e.g. the Chrome Web Store one and an old zip): only one may draw. The one whose
  // panel you used last wins ("pick" = when you last changed a setting in that copy), so the background you choose is
  // always the one you see. Ties go to the newer version, then to whoever got there first.
  let myPick = 0;
  const readOwner = () => { const [id, ver, token, ts, pick] = (document.documentElement.getAttribute("data-bd-owner") || "").split("|"); return id ? { id, ver, token, ts: +ts, pick: +pick || 0 } : null; };
  const writeOwner = () => document.documentElement.setAttribute("data-bd-owner", [ME.id, ME.ver, ME.token, Date.now(), myPick].join("|"));
  const outranks = (a, b) => a.pick !== b.pick ? a.pick > b.pick : verCmp(a.ver, b.ver) > 0;   // does copy a win over copy b?
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
      if (cur.id !== ME.id && !outranks({ pick: myPick, ver: ME.ver }, cur)) return false;   // the other copy was used more recently (or is newer)
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
      (cur.id !== ME.id ? outranks(cur, { pick: myPick, ver: ME.ver }) : verCmp(cur.ver, ME.ver) > 0 || ctxDead()); };
  function yieldPage() {
    standDown = true; teardown(); if (wmEl) { wmEl.remove(); wmEl = null; }
    if (timerEl) { timerEl.remove(); timerEl = null; } clearInterval(timerIv); timerIv = 0;
    if (goalEl) { goalEl.remove(); goalEl = null; }
    if (guardEl) { guardEl.remove(); guardEl = null; }
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
  const CHART_SEL = ".chart-markup-table, .chart-container, [data-bd-lwroot], .tv-lightweight-charts, [class*='lightweight'], [data-bd-tdvpane]";
  // a real chart: one at least 400 x 250, or several smaller ones that together fill that much (a 2- or 3-chart layout
  // on a small window). Mini charts (sparklines, a watchlist's tiny previews) are below 200 x 140 and don't count.
  const bigChart = () => { let area = 0;
    for (const el of document.querySelectorAll(CHART_SEL)) { const r = el.getBoundingClientRect();
      if (r.width >= 400 && r.height >= 250) return true; if (r.width >= 200 && r.height >= 140) area += r.width * r.height; }
    return area >= 400 * 250 * 1.5; };
  let startFn = null, started = false;
  function whenChart(start) {
    startFn = start;
    const go = () => { if (!claim()) return; sweep(); started = true; start(); setTimeout(announceFrame, 300); };
    if (bigChart()) return go();
    // charts render late and small widgets (mini charts) never qualify; check for a while
    // keep checking (login-gated / single-page apps can show the chart much later), slower after the first 3 minutes
    let iv = setInterval(() => { if (bigChart()) { clearInterval(iv); go(); } }, 500);
    setTimeout(() => { if (!bigChart()) { clearInterval(iv); iv = setInterval(() => { if (bigChart()) { clearInterval(iv); go(); } }, 2000); } }, 180000);
  }

  // You changed something in THIS copy's panel: if another copy is drawing here, take the page back from it.
  function retake() {
    if (owner && !standDown) { writeOwner(); return; }
    if (!startFn || !bigChart()) return;
    const was = standDown; standDown = false;
    if (!claim()) { standDown = was; return; }
    sweep();
    if (!started) { started = true; startFn(); setTimeout(announceFrame, 300); return; }
    build(); pushCandles(); pushFx(); renderWatermark(); applyFocus(); renderTimer(); applyPrivacy(); setTimeout(announceFrame, 300);
  }

  // Plans (src/pass.js): "pro" (a signed pass from the licence check, or an invite), "free" (when Free is open) or
  // "none" (nothing is drawn until a code / key is entered in the panel). cfg.enabled = your on/off switch AND a plan;
  // wantOn remembers the switch itself. On Free, Pro settings are held back here, the one place every change passes
  // through, so editing saved settings can't unlock them; your own values are kept (held) and come back with Pro.
  let wantOn = true, passInfo = null, passFor = "", lastPlan = null;
  const held = {};
  const inviteOk = () => !!(cfg.invite && cfg.invite.ok && cfg.invite.code);
  const plan = () => (window.PriismPass ? window.PriismPass.planOf(passInfo, cfg.invite) : inviteOk() ? "pro" : "none");
  async function refreshPass() {     // check the pass again when it (or this copy's id) changes
    const P = window.PriismPass, id = (cfg.pass || "") + "|" + (cfg.deviceId || "");
    if (id === passFor) return; passFor = id;
    try { passInfo = P ? await P.verify(cfg.pass, cfg.deviceId) : null; } catch { passInfo = null; }
  }
  function gate(keys) {
    if (keys) for (const k of keys) delete held[k];           // a setting that just changed is yours again (held again below on Free)
    if (!keys || keys.includes("enabled")) wantOn = cfg.enabled !== false;
    const p = plan(), P = window.PriismPass, touched = [];
    cfg.enabled = wantOn && p !== "none";
    if (p === "free" && P) {
      for (const k of Object.keys(DEFAULTS)) {
        if (k in held) continue;
        const f = P.freeValue(k, cfg[k], DEFAULTS);
        if (f !== undefined && JSON.stringify(f) !== JSON.stringify(cfg[k])) { held[k] = cfg[k]; cfg[k] = f; touched.push(k); }
      }
    } else for (const k of Object.keys(held)) { cfg[k] = held[k]; delete held[k]; touched.push(k); }
    if (keys) {
      for (const k of touched) if (!keys.includes(k)) keys.push(k);
      if ((p !== lastPlan || keys.includes("invite")) && !keys.includes("enabled")) keys.push("enabled");
    }
    lastPlan = p; try { document.documentElement.setAttribute("data-bd-plan", p); } catch {}   // (for Diagnose / tests)
    return keys;
  }
  setInterval(() => { passFor = ""; const was = plan(); refreshPass().then(() => { if (plan() !== was) apply(gate(["enabled"])); }); }, 3600e3);   // a pass runs out
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    // when you last used this copy's panel is known BEFORE claiming the page, so after a reload the right copy wins
    chrome.storage.local.get({ lastPick: 0 }, (s) => { myPick = +s.lastPick || 0;
      whenChart(() => chrome.storage.local.get(DEFAULTS, async (stored) => { cfg = { ...DEFAULTS, ...stored }; await refreshPass(); gate(); build(); pushCandles(); pushFx(); renderWatermark(); applyFocus(); renderTimer(); applyPrivacy(); })); });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      // today's total is shared between tabs (and reset from the panel); the journal is just stored data
      if (changes.dayPnl) { const nv = changes.dayPnl.newValue; day = nv && nv.date ? { ...freshDay(), ...nv } : freshDay(); renderGoal(); }
      const keys = Object.keys(changes).filter((k) => k !== "dayPnl" && k !== "journal" && k !== "lastPick");
      if (changes.lastPick) {
        myPick = +changes.lastPick.newValue || 0;
        if (!(owner && !standDown)) { for (const k of keys) cfg[k] = changes[k].newValue; gate(keys); return retake(); }   // another copy had the page: take it back
        writeOwner();                                                                                     // already ours: just note it, then apply as usual
      }
      for (const k of keys) cfg[k] = changes[k].newValue;
      const go = () => { gate(keys); if (keys.length) apply(keys); };
      if (keys.includes("pass") || keys.includes("deviceId")) refreshPass().then(go); else go();
    });
  } else {
    // Desktop app: host injects window.__BD_CFG and calls window.__bdUpdate on change.
    cfg = { ...DEFAULTS, ...(window.__BD_CFG || {}) };
    refreshPass().then(() => {
      gate();
      build();
      pushCandles();
      pushFx();
      renderWatermark(); applyFocus(); renderTimer(); applyPrivacy();
    });
    window.__bdUpdate = (next) => {
      const keys = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(k === "enabled" ? wantOn : k in held ? held[k] : cfg[k]));
      cfg = { ...cfg, ...next };
      const go = () => { gate(keys); if (keys.length) apply(keys); };
      if (keys.includes("pass") || keys.includes("deviceId")) refreshPass().then(go); else go();
    };
  }

  // ---------- TopstepX: the platform's own panels in your look ----------
  // TopstepX (the ProjectX platform) keeps its chart in a frame; its panels, order ticket, tables and menus are in the
  // top page, where nothing else of Priism runs. This styles them with the same settings as TradingView's panels
  // (TradingView tab › Bars & panels: Panel colours, Panel style, Rounded, and the accent Match everything sets):
  //  - TopstepX's own design tokens (--tds-*): surfaces, borders, accent, focus ring, selection. Its trading colours
  //    (buy / sell, profit / loss, flashes) and status colours (warnings, errors) are never touched.
  //  - its older parts that don't use the tokens yet: dock panels and tabs, tables, menus, dialogs, the order ticket's
  //    surfaces. Only colours, borders and corner radius: nothing moves, resizes or changes how it works.
  // One stylesheet, no observers; if TopstepX changes these parts, the rules simply stop matching.
  if (window === window.top && (/(^|\.)(topstepx|projectx)\.com$/.test(location.hostname) || document.documentElement.hasAttribute("data-tds-brand"))) (function topstepx() {
    const KEYS = { enabled: true, invite: null, pass: "", deviceId: "", panelMode: "off", panelColor: "#10131c", pnStyle: "flat", pnRound: false, uiAccent: "", wallMatch: null, candleUp: "#00ffa3", tsxLogo: "own", tsxLogoText: "", tsxLogoColor: "look", privacy: false, privacyAcct: true, tsxAcctLabel: "",
      tsxAcctStyle: "own", tsxAcctFont: "default", tsxAcctFill: "glass", tsxAcctGlow: "soft", tsxAcctBadge: "filled" };
    let c = { ...KEYS }, st = null, tries = 0, pro = false;
    const hex = (h) => /^#[0-9a-f]{6}$/i.test(h || "") ? h : null;
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const rgba = (h, a) => `rgba(${rgb(h).join(",")},${a})`, mix = (a, b, f) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * f));
    const accent = () => hex(c.uiAccent) || (c.wallMatch && Array.isArray(c.wallMatch.colors) && hex(c.wallMatch.colors[0])) || hex(c.candleUp) || "#7c6cff";
    // the panel colour, exactly as on TradingView (panelColour): your colour, or a deep tint of the wallpaper's accent
    const panel = () => c.panelMode === "color" ? hex(c.panelColor) : c.panelMode === "skin" ? toHex(rgb(accent()).map((v, i) => [11, 13, 19][i] + (v - [11, 13, 19][i]) * 0.14)) : null;
    function css() {
      const P = panel(); if (!P || !c.enabled || !pro) return "";
      const A = accent(), lum = (x) => { const [r, g, b] = rgb(x).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const S0 = mix(P, "#000000", 0.35), S1 = mix(P, "#ffffff", 0.04), S2 = mix(P, "#ffffff", 0.07), S3 = mix(P, "#ffffff", 0.1), glass = c.pnStyle === "glass";
      const BG = glass ? rgba(P, 0.74) : P, L1 = rgba(mix("#ffffff", A, 0.25), 0.08), L2 = rgba(mix("#ffffff", A, 0.25), 0.13);
      const edge = c.pnStyle === "neon" || c.pnStyle === "aurora" ? rgba(A, 0.5) : c.pnStyle === "outline" ? rgba(A, 0.3) : L2, R = c.pnRound ? "10px" : null;
      const H = "html.bd-tsx", on = lum(A) > 0.55 ? "#0b0c10" : "#ffffff";
      const barBG = glass ? rgba(S0, 0.55) : S0, blur = glass ? "backdrop-filter:blur(14px) saturate(1.2);" : "";
      const barEdge = (o) => c.pnStyle === "neon" || c.pnStyle === "aurora" ? `inset ${o} 0 ${rgba(A, 0.6)},0 0 14px ${rgba(A, 0.16)}`
        : c.pnStyle === "outline" ? `inset ${o} 0 ${rgba(A, 0.35)}` : `inset ${o} 0 ${L1}`;
      return `${H},${H} [data-tds-brand]{--tds-color-surface-sunken:${S0}!important;--tds-color-surface-base:${BG}!important;--tds-color-surface-raised:${S1}!important;--tds-color-surface-elevated:${S2}!important;--tds-color-surface-overlay:${S3}!important;` +
        `--tds-color-brand-panel:${glass ? rgba(P, 0.7) : P}!important;--tds-color-topstepx-panel-glass:${rgba(P, 0.7)}!important;--tds-color-brand-page:${S0}!important;--tds-brand-page-gradient:radial-gradient(ellipse at top,${rgba(A, 0.12)} 0%,${S0} 58%,#000 100%)!important;` +
        `--tds-color-border-subtle:${L1}!important;--tds-color-border-default:${L2}!important;--tds-color-accent-solid:${A}!important;--tds-color-accent-solid-hover:${mix(A, "#ffffff", 0.15)}!important;--tds-color-accent-on-solid:${on}!important;` +
        `--tds-color-accent-fg:${A}!important;--tds-color-accent-indicator:${A}!important;--tds-color-accent-subtle:${rgba(A, 0.16)}!important;--tds-color-accent-border:${rgba(A, 0.6)}!important;--tds-color-focus-ring:${A}!important;` +
        `--tds-color-state-selected:${rgba(A, 0.12)}!important;--tds-color-state-selected-hover:${rgba(A, 0.16)}!important;${R ? `--tds-radius-md:${R}!important;--tds-shape-container:${R}!important;` : ""}}` +
        // the dock: panels, tab bars, the active tab's line, its menus
        `${H} .dock-panel{background-color:${BG}!important;border-color:${edge}!important;${R ? `border-radius:${R}!important;` : ""}}` +
        `${H} .dock-bar,${H} .dock-nav{background-color:${S1}!important}${H} .dock-tab{border-bottom-color:${L1}!important}${H} .dock-ink-bar{background-color:${A}!important}` +
        `${H} .dock-dropdown-menu,${H} .dropdown-menu,${H} .react-contextmenu,${H} .MuiMenu-paper,${H} .MuiPopover-paper{background-color:${S3}!important;border:1px solid ${L2}!important}` +
        `${H} .dock-dropdown-menu-item:hover,${H} .dropdown-item:hover,${H} .react-contextmenu-item:hover,${H} .MuiMenuItem-root:hover{background-color:${rgba(A, 0.12)}!important}` +
        `${H} .modal-content,${H} .MuiDialog-paper{background-color:${S2}!important;border-color:${L2}!important}` +
        // tables (positions, orders, trades): headers, separators, row hover. Values and their colours stay as they are.
        `${H} .MuiTableHead-root .MuiTableCell-head,${H} .rt-thead.-header{background-color:${S1}!important}` +
        `${H} .MuiTableCell-root,${H} .rt-tr-group,${H} .rt-thead.-header{border-bottom-color:${L1}!important}` +
        `${H} .MuiTableBody-root .MuiTableRow-root:hover,${H} .rt-tbody .rt-tr:hover{background-color:${rgba(A, 0.07)}!important}` +
        // the order ticket: its surface and fields (Buy / Sell, their colours and every button stay TopstepX's own)
        `${H} [class*="ordercard-module__cardWrapper"]{background-color:${BG}!important}` +
        `${H} [class*="ordercard-module__inputContent"],${H} [class*="ordercard-module__inputMarketContent"]{background-color:${S0}!important;border-color:${L2}!important}` +
        `${H} [class*="ordercard-module__inputContent"]:focus-within{border-color:${A}!important;box-shadow:0 0 0 1px ${rgba(A, 0.35)}!important}` +
        `${H} [class*="dom-module__domHeader"]{background-color:${S1}!important}` +
        // the left icon bar and the top account bar (found by where they are: see markBars), and their known classes
        // They follow your panel settings like the panels do: Panel style (glass = see-through and frosted, over the
        // backdrop; neon / aurora = a glowing accent edge; outline = an accent line), Rounded, colour, accent.
        // Edges are shadows, never borders, so nothing resizes.
        `${H} [data-testid="user-layout-container"]{background:radial-gradient(ellipse at top,${rgba(A, 0.14)} 0%,${S0} 55%,${mix(S0, "#000000", 0.5)} 100%)!important;background-color:${S0}!important}` +
        `${H} [data-bd-tsx="side"],${H} [data-testid="sidebar-container"],${H} .sidebar .main-menu,${H} .MuiDrawer-paper{background-color:${barBG}!important;box-shadow:${barEdge("-1px 0")}!important;${blur}}` +
        `${H} [data-bd-tsx="top"],${H} [data-testid="navbar-container"],${H} .navbar,${H} .MuiAppBar-root{background-color:${barBG}!important;box-shadow:${barEdge("0 -1px")}!important;${blur}${R ? `border-radius:0 0 ${R} ${R}!important;` : ""}}` +
        `${H} [data-bd-tsx="fill"]{background-color:transparent!important}` +
        // every other page (Platform Settings, Stats, Store…): its dark neutral surfaces, by how dark they were (see markSurfaces)
        `${H} [data-bd-tsx-surf="0"]{background-color:${S0}!important}${H} [data-bd-tsx-surf="1"]{background-color:${BG}!important}` +
        `${H} [data-bd-tsx-surf="2"]{background-color:${S1}!important}${H} [data-bd-tsx-surf="3"]{background-color:${S2}!important}` +
        `${H} [data-bd-tsx="field"]{background-color:${S1}!important;border-color:${L2}!important}` +
        `html.bd-tsx-logo [data-bd-tsx-logo]{opacity:0!important}@keyframes bd-tsx-sheen{0%,62%{transform:translateX(-120%)}100%{transform:translateX(120%)}}` +
        `@keyframes bd-tsx-spin{to{transform:rotate(1turn)}}@keyframes bd-tsx-pulse{50%{opacity:.55}}` +
        `@media (prefers-reduced-motion:reduce){#bd-tsx-logo i{animation:none!important;opacity:0}#bd-tsx-logo b,#bd-tsx-logo u{animation:none!important}}` +
        `${H} .sidebar .main-menu ul li.active a i{background:${A}!important;color:${on}!important}`;
    }
    // The left icon bar and the top account bar are built at run time with generated class names, so they're found by
    // where they are: the element stack at a few points (left edge, top edge), no page-wide search and no observer.
    //  side / top = the bar itself; fill = an inner box in the bar's own colour (made see-through, so the bar's new
    //  colour shows); field = a box in another solid colour inside the top bar (the account picker)
    const solid = (el) => { const c = getComputedStyle(el).backgroundColor, m = c.match(/[\d.]+/g); return m && (m.length < 4 || +m[3] > 0.6) ? c : null; };
    function markBars() {
      if (!document.body) return false;
      const W = innerWidth, Hh = innerHeight, found = { side: null, top: null };
      const isSide = (r) => r.left <= 2 && r.width >= 24 && r.width <= 140 && r.height >= Hh * 0.6;
      const isTop = (r) => r.top <= 2 && r.height >= 18 && r.height <= 90 && r.width >= W * 0.5;
      // the outermost element at those points with the bar's shape (whatever its own colour: the live app's bars are
      // often see-through, their black coming from the page or a full-size box inside)
      const pick = (pts, test) => { let best = null, bestA = 0;
        for (const [x, y] of pts) for (const el of document.elementsFromPoint(x, y)) {
          if (el === document.documentElement || el === document.body || el.tagName === "IFRAME") continue;
          const r = el.getBoundingClientRect(); if (test(r) && r.width * r.height >= bestA) { best = el; bestA = r.width * r.height; } }   // (>=: the outer of same-size boxes)
        return best; };
      // TopstepX names both bars for its own tests (data-testid, from its app code): use those first. The top bar
      // sits in the column right of the left bar, under any banner, so it isn't always at the window's top edge.
      found.side = document.querySelector('[data-testid="sidebar-container"]') || pick([[10, Hh * 0.5], [10, Hh * 0.7], [10, Hh * 0.35]], isSide);
      found.top = document.querySelector('[data-testid="navbar-container"]') || pick([[W * 0.5, 10], [W * 0.35, 10], [W * 0.65, 10], [W * 0.8, 10]], isTop);
      // the logo: TopstepX's own picture at the top of the left bar (your logo goes exactly over it)
      if (found.side && !(logoEl && logoEl.isConnected)) {
        const rb = found.side.getBoundingClientRect();
        logoEl = [...found.side.querySelectorAll("img, svg")].find((e) => { const r = e.getBoundingClientRect(); return r.width >= 20 && r.height >= 16 && r.height <= 90 && r.top - rb.top < 80; }) || null;
        if (!logoEl) for (const el of document.elementsFromPoint(rb.left + rb.width / 2, rb.top + 22)) {
          if (el === found.side || !found.side.contains(el)) continue;
          const r = el.getBoundingClientRect(); if (r.width >= 20 && r.height >= 16 && r.height <= 90 && r.top - rb.top < 60) logoEl = el; }
        if (logoEl) logoEl.setAttribute("data-bd-tsx-logo", "");
      }
      for (const [k, el] of Object.entries(found)) {
        if (!el) continue;
        if (el.getAttribute("data-bd-tsx") !== k) el.setAttribute("data-bd-tsx", k);
        const rb = el.getBoundingClientRect();
        // boxes inside the bar that paint it black: full-size ones go see-through (the bar's new colour shows); a smaller
        // dark box in the top bar (the account picker) takes the raised colour. Buttons, inputs, images keep theirs.
        const pts = k === "side" ? [[rb.left + rb.width / 2, Hh * 0.3], [rb.left + 6, Hh * 0.5], [rb.left + rb.width / 2, Hh * 0.75], [rb.left + 4, rb.bottom - 8]]
          : [[W * 0.1, rb.top + rb.height / 2], [W * 0.35, rb.top + rb.height / 2], [W * 0.5, rb.top + 3], [W * 0.65, rb.top + rb.height / 2], [W * 0.9, rb.top + rb.height / 2]];
        for (const [x, y] of pts) for (const c of document.elementsFromPoint(x, y)) {
          if (c === el || !el.contains(c) || c.hasAttribute("data-bd-tsx") || c.matches("button, [role=button], input, select, img, svg, svg *, canvas")) continue;
          const bg = solid(c); if (!bg) continue;
          const m = bg.match(/[\d.]+/g).slice(0, 3).map(Number), dark = m[0] + m[1] + m[2] < 150, r = c.getBoundingClientRect();
          if (!dark) continue;
          const full = k === "side" ? r.width >= rb.width * 0.8 : r.height >= rb.height * 0.8 && r.width >= rb.width * 0.4;
          if (full) c.setAttribute("data-bd-tsx", "fill");
          else if (k === "top" && r.width > 60 && r.height < rb.height) c.setAttribute("data-bd-tsx", "field");
        }
      }
      // for troubleshooting: what was found (read with document.documentElement.dataset.bdTsxFound)
      const d = (el) => el ? `${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(/\s+/)[0] || ""} ${[...Object.values(el.getBoundingClientRect().toJSON())].slice(0, 4).map(Math.round).join(",")}` : "none";
      document.documentElement.dataset.bdTsxFound = `side: ${d(found.side)} | top: ${d(found.top)}`;
      return !!(found.side && found.top);
    }
    // Your logo on TopstepX: a badge drawn exactly over TopstepX's own logo (same box: nothing moves; clicks go through
    // to its link). Priism = the Priism mark, Your name = your text. Both in your look: a dark glass tile in the panel
    // colour, an accent edge and glow, the mark / letters filled with your wallpaper's colours, and a slow light sweep
    // (off with reduced motion). Drawn once as an SVG (crisp at any zoom), redrawn only when the look changes.
    let logoEl = null, logoDiv = null, logoSig = "";
    // Logo & account colours (one setting for both): your look's (accent + wallpaper colours), a rainbow, or one
    // colour you pick (in light-to-deep shades)
    function badgeColours() {
      const P = panel() || "#0b0d12", wall = (c.wallMatch && Array.isArray(c.wallMatch.colors) ? c.wallMatch.colors.map(hex).filter(Boolean) : []);
      const RAINBOW = ["#ff3b6b", "#ff9a3c", "#ffe14a", "#3dff9a", "#38d6ff", "#6f6bff", "#ff4ff0"];
      const pick = hex(c.tsxLogoColor), rainbow = c.tsxLogoColor === "rainbow";
      const A = rainbow ? "#9b6bff" : pick || accent();
      const stops = rainbow ? RAINBOW : pick ? [mix(pick, "#ffffff", 0.6), pick, mix(pick, "#000000", 0.35)]
        : [mix(A, "#ffffff", 0.55), A, wall.find((x) => x.toLowerCase() !== A.toLowerCase()) || mix(A, "#000000", 0.25)];
      return { P, A, stops, rainbow };
    }
    function renderLogo() {
      const H = document.documentElement, mode = c.tsxLogo === "look" || c.tsxLogo === "text" ? c.tsxLogo : "own";
      const show = mode !== "own" && H.classList.contains("bd-tsx") && logoEl && logoEl.isConnected;
      H.classList.toggle("bd-tsx-logo", !!show);
      if (!show) { if (logoDiv) { logoDiv.remove(); logoDiv = null; logoSig = ""; } return; }
      const r = logoEl.getBoundingClientRect(), W = Math.max(20, Math.round(r.width)), Hh = Math.max(16, Math.round(r.height));
      const { P, A, stops, rainbow } = badgeColours();
      const name = mode === "text" ? String(c.tsxLogoText || "").trim().slice(0, 24) : "";
      const sig = [mode, name, W, Hh, A, P, stops.join(""), c.tsxLogoColor].join("|");
      if (!logoDiv) { logoDiv = document.createElement("div"); logoDiv.id = "bd-tsx-logo"; logoDiv.setAttribute("aria-hidden", "true"); document.documentElement.appendChild(logoDiv); }
      logoDiv.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${W}px;height:${Hh}px;z-index:2147483000;pointer-events:none;border-radius:${Math.min(10, Hh * 0.24)}px;overflow:hidden;isolation:isolate;` +
        `box-shadow:0 0 18px -2px ${rgba(A, 0.7)},0 0 4px ${rgba(A, 0.55)},0 0 30px -6px ${rgba(stops[2], 0.6)}`;
      if (sig === logoSig) return; logoSig = sig;
      const esc = (t) => t.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
      const still = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })();
      const rad = Math.min(10, Hh * 0.24), ring = rainbow ? [...stops, stops[0]] : [...stops, mix(A, "#ffffff", 0.2), stops[0]];
      // the fill sweeps slowly through your look's colours (a holographic shimmer), unless you've asked for less motion
      const grad = `<linearGradient id="bdtsx-f" x1="0" y1="1" x2="1" y2="0" spreadMethod="reflect">${stops.map((x, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${x}"/>`).join("")}` +
        (still ? "" : `<animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="9s" repeatCount="indefinite"/>`) + `</linearGradient>`;
      let art;
      if (mode === "look") {   // the Priism mark (the same three candles as the Priism icon), centred, with a soft glow
        const k = Math.min(W, Hh) * 0.78 / 32, ox = (W - 32 * k) / 2, oy = (Hh - 32 * k) / 2;
        art = `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(4)})" fill="url(#bdtsx-f)" filter="url(#bdtsx-g)"><rect x="5" y="17" width="6" height="9" rx="1.5"/><rect x="13" y="11" width="6" height="12" rx="1.5"/><rect x="21" y="5" width="6" height="15" rx="1.5"/><rect x="7.25" y="15" width="1.5" height="13" rx=".75"/><rect x="15.25" y="8" width="1.5" height="17" rx=".75"/><rect x="23.25" y="3" width="1.5" height="19" rx=".75"/></g>`;
      } else {                 // your name: up to two lines, as big as fits, squeezed (never cut) when long
        const words = (name || "PRIISM").split(/\s+/).filter(Boolean), lines = words.length > 1 && name.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [words.join(" ")];
        const fs = Math.min(Hh * (lines.length > 1 ? 0.34 : 0.42), (W - 8) / (Math.max(...lines.map((l) => l.length)) * 0.58)), lh = fs * 1.05, y0 = Hh / 2 - (lines.length - 1) * lh / 2;
        art = `<g fill="url(#bdtsx-f)" filter="url(#bdtsx-g)" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-weight="800" font-size="${fs.toFixed(1)}" text-anchor="middle" dominant-baseline="central" letter-spacing="${(fs * 0.04).toFixed(2)}">` +
          lines.map((l, i) => `<text x="${W / 2}" y="${(y0 + i * lh).toFixed(1)}"${l.length * fs * 0.6 > W - 6 ? ` textLength="${W - 6}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(l)}</text>`).join("") + "</g>";
      }
      // an edge of light that circles the badge: a slowly turning ring of your look's colours, seen as a 1.5px rim
      // around the glass tile drawn just inside it
      logoDiv.innerHTML = `<b style="position:absolute;left:50%;top:50%;width:${Math.ceil(Math.hypot(W, Hh)) + 4}px;height:${Math.ceil(Math.hypot(W, Hh)) + 4}px;margin:-${Math.ceil(Math.hypot(W, Hh) / 2) + 2}px;` +
        `background:conic-gradient(from 0deg,${ring.join(",")});animation:bd-tsx-spin 6s linear infinite"></b>` +
        `<div style="position:absolute;inset:1.5px;border-radius:${Math.max(0, rad - 1.5)}px;overflow:hidden">` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W - 3}" height="${Hh - 3}" viewBox="1.5 1.5 ${W - 3} ${Hh - 3}" style="display:block"><defs>${grad}` +
        `<linearGradient id="bdtsx-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P, A, 0.2)}"/><stop offset="1" stop-color="${mix(P, "#000000", 0.45)}"/></linearGradient>` +
        `<linearGradient id="bdtsx-e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${rgba(stops[0], 0.9)}"/><stop offset=".5" stop-color="${rgba(A, 0.35)}"/><stop offset="1" stop-color="${rgba(stops[2], 0.8)}"/></linearGradient>` +
        `<filter id="bdtsx-g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(Math.min(W, Hh) / 28).toFixed(2)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
        `<rect x="1.5" y="1.5" width="${W - 3}" height="${Hh - 3}" fill="url(#bdtsx-t)"/>` +
        `<rect x="1.5" y="1.5" width="${W - 3}" height="${(Hh - 3) / 2}" rx="${Math.max(0, rad - 1)}" fill="#ffffff" opacity=".06"/>${art}</svg>` +
        `<u style="position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 55%,${rgba(A, 0.28)},transparent 70%);mix-blend-mode:screen;animation:bd-tsx-pulse 3.2s ease-in-out infinite"></u>` +
        `<i style="position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.26) 50%,transparent 65%);animation:bd-tsx-sheen 7s ease-in-out infinite"></i></div>`;
    }
    // Every page, not just the trading screen: TopstepX's other pages (Platform Settings, Stats, Store…) are built from
    // components with fixed dark colours of their own. Their dark, neutral surfaces take your panel colours, the darkest
    // the deepest shade. Anything coloured (the red RP&L badge, Save, buy / sell, profit / loss, status) keeps its colour,
    // and so do buttons, inputs, pictures, the chart frame and the bars (styled above). Only elements not seen before are
    // looked at, every few seconds while the look is on (a page or tab opening adds new ones): no observer, no cost at rest.
    const surfSeen = new WeakSet();
    function markSurfaces() {
      const root = document.body; if (!root) return;      // (the whole page: order toasts and dialogs live outside the layout)
      let n = 0;
      for (const el of root.querySelectorAll("div, section, aside, header, nav, main, ul, li, form, table, thead, tbody, tr, td, th, fieldset")) {
        if (surfSeen.has(el)) continue; surfSeen.add(el);
        if (++n > 2500) break;
        if (el.hasAttribute("data-bd-tsx") || el.closest('[data-bd-tsx="side"], [data-bd-tsx="top"], [data-bd-tsx-logo], #bd-tsx-logo, iframe, button, [role="button"], .dock-panel, [id^="bd-"], [class*="bd-ui"]')) continue;
        const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); if (!m || (m.length > 3 && +m[3] < 0.5)) continue;
        const [r, g, b] = m.slice(0, 3).map(Number), L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        if (Math.max(r, g, b) - Math.min(r, g, b) > 34 || L > 0.2) continue;                      // coloured, or not a dark surface
        const q = el.getBoundingClientRect(); if (q.width * q.height < 2000) continue;           // a tiny box (a dot, a chip)
        el.setAttribute("data-bd-tsx-surf", L < 0.035 ? "0" : L < 0.075 ? "1" : L < 0.12 ? "2" : "3");
      }
    }
    let surfT = 0;
    const surfLoop = () => { clearInterval(surfT); surfT = 0; if (document.documentElement.classList.contains("bd-tsx")) { markSurfaces(); surfT = setInterval(() => { if (!document.hidden) markSurfaces(); }, 3000); } };
    let barsDone = false, rsT = 0;
    addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(() => { if (document.documentElement.classList.contains("bd-tsx")) { markBars(); renderLogo(); } }, 500); }, { passive: true });
    const apply = () => {
      const want = css(), here = !!document.querySelector(".dock-panel, .dock-layout, [data-tds-brand], [data-testid='user-layout-container']");
      document.documentElement.classList.toggle("bd-tsx", !!want && here);
      if (!want || !here) { if (st) st.textContent = ""; renderLogo(); clearInterval(surfT); surfT = 0; return !here; }
      if (!st) { st = document.createElement("style"); st.id = "bd-tsx-css"; (document.head || document.documentElement).appendChild(st); }
      if (st.textContent !== want) st.textContent = want;
      if (!barsDone) barsDone = markBars();
      if (!surfT) surfLoop();
      renderLogo();
      return !barsDone;   // keep looking (a few times) until both bars are found
    };
    const plan = async () => { const P = window.PriismPass; let info = null; try { info = P ? await P.verify(c.pass, c.deviceId) : null; } catch {}
      pro = P ? P.planOf(info, c.invite) === "pro" : !!(c.invite && c.invite.ok); };
    // ---------- the account box (TopstepX's account picker, top left) ----------
    // Visual only, local and reversible: nothing about the account is changed, read out or sent, and clicking the box
    // still opens TopstepX's own account list. What it shows comes from TopstepX's own box (PriismAcct.read):
    //  - the real account type, always (Practice, Combine, Express Funded, Live Funded…), in a fixed colour per type
    //    that your colours can't change, so a practice account can never look live or funded
    //  - its size and number as TopstepX shows them (the number masked in Streamer mode)
    //  - your nickname, if you set one (PriismAcct.nickname: never numbers, money or account words)
    // Account box › Custom (with Panels on) restyles it: font, fill (glass / gradient / solid), glow, badge style, in
    // Logo & account colours. Streamer mode › Blur account panel masks the number, blurs the balances next to it and
    // the numbers in its account list (readable under your mouse, so you can still pick one).
    // If the type can't be read for certain, nothing is restyled; in Streamer mode the box is then blurred instead.
    const ACCT_HINT = /\b(practice|combine|express|funded|live|xfa|lfa|eval|evaluation)\b|\(\s*(…|\.\.\.)\s*\d{2,}\s*\)/i;
    const MONEY_RE = /[-+]?\$\s*[-+]?[\d,]+(\.\d+)?|^[-+]?[\d,]+\.\d{2}$/;
    const AC = () => window.PriismAcct;
    let acctT = 0, acctCss = null, acctBox = null;
    const leaf = (el, re) => ![...el.children].some((k) => re.test(k.textContent || ""));
    const topBar = () => document.querySelector('[data-testid="navbar-container"], [data-bd-tsx="top"]');
    function findAcct() {     // the smallest box in the top bar with the account in it, or the picker it sits in
      const top = topBar(); if (!top) return null;
      if (acctBox && acctBox.isConnected && top.contains(acctBox)) return acctBox;
      for (const el of top.querySelectorAll("*")) {
        if (el.closest("#bd-tsx-logo, .bd-acct") || el.children.length > 3) continue;
        const t = (el.textContent || "").trim(); if (!t || t.length > 80 || !ACCT_HINT.test(t) || !leaf(el, ACCT_HINT)) continue;
        const box = el.closest('[data-bd-tsx="field"], [role="button"], [role="combobox"], button') || el;
        if (top.contains(box)) { box.setAttribute("data-bd-tsx-acct", ""); return (acctBox = box); }
      }
      return null;
    }
    function markMoney() {    // Streamer mode: the balances in the top bar and the numbers in an open account list
      const top = topBar();
      if (top) for (const el of top.querySelectorAll("*")) { if (el.closest(".bd-acct, [data-bd-tsx-acct]") || el.children.length > 3 || el.hasAttribute("data-bd-tsx-money")) continue;
        const t = (el.textContent || "").trim(); if (t && t.length <= 40 && MONEY_RE.test(t) && leaf(el, MONEY_RE)) el.setAttribute("data-bd-tsx-money", ""); }
      for (const menu of document.querySelectorAll('[role="menu"], [role="listbox"], .MuiPopover-paper, .MuiMenu-paper, .MuiAutocomplete-popper'))
        for (const el of menu.querySelectorAll("*")) { const t = (el.textContent || "").trim();
          if (t && t.length <= 80 && /\d/.test(t) && (ACCT_HINT.test(t) || MONEY_RE.test(t)) && leaf(el, /\d/)) el.setAttribute("data-bd-tsx-acctitem", ""); }
    }
    const esc = (t) => String(t).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
    const EYE = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>`;
    function renderAcct() {
      const H = document.documentElement, A0 = AC();
      const custom = !!(A0 && c.enabled && pro && c.tsxAcctStyle === "custom" && H.classList.contains("bd-tsx"));
      const priv = !!(c.enabled && pro && c.privacy && c.privacyAcct !== false);
      H.classList.toggle("bd-tsx-priv", priv);
      const box = (custom || priv) ? findAcct() : null;
      // TopstepX's own text only (never our line inside the box, or it would read itself back)
      const own = box ? [...box.childNodes].filter((n) => !(n.classList && n.classList.contains("bd-acct"))).map((n) => n.textContent).join("") : "";
      const info = box && A0 ? A0.read(own) : null;
      const show = !!(box && info);
      H.classList.toggle("bd-tsx-acct-on", show); H.classList.toggle("bd-tsx-acct-blur", !!(box && priv && !info));
      if (!show) { document.querySelectorAll(".bd-acct").forEach((e) => e.remove()); return; }
      let ov = box.querySelector(":scope > .bd-acct");
      if (!ov) { ov = document.createElement("span"); ov.className = "bd-acct"; ov.setAttribute("aria-hidden", "true"); box.appendChild(ov); }
      const nick = A0.nickname(c.tsxAcctLabel), num = info.number ? (priv ? "\u2022\u2022\u2022\u2022" : "\u2026" + info.number) : "";
      const html = `<b class="t">${esc(info.type)}</b>${info.size ? `<i class="s">${esc(info.size)}</i>` : ""}${nick ? `<em class="n">${esc(nick)}</em>` : ""}` +
        (num || priv ? `<i class="u">${priv ? EYE : ""}${num ? `<span class="d">${num}</span>` : ""}</i>` : "");
      const sig = [custom, priv, html, c.tsxAcctFont, c.tsxAcctFill, c.tsxAcctGlow, c.tsxAcctBadge, c.tsxLogoColor, c.panelMode, c.panelColor, c.uiAccent, JSON.stringify(c.wallMatch && c.wallMatch.colors), box.clientTop, box.clientLeft].join("|");
      if (ov.dataset.sig === sig) return; ov.dataset.sig = sig; ov.innerHTML = html;
      ov.classList.toggle("bd-acct-x", custom);
      // the type badge: its own fixed colour (never yours), filled or outlined
      const T = info.color, outline = custom && c.tsxAcctBadge === "outline";
      let st = `--bd-acct-type:${T};--bd-acct-type-bg:${outline ? "transparent" : T};--bd-acct-type-fg:${outline ? T : "#0b0d12"};`;
      if (custom) {
        const { P, A, stops, rainbow } = badgeColours(), g = c.tsxAcctGlow === "strong" ? 1 : c.tsxAcctGlow === "off" ? 0 : 0.55;
        const fill = c.tsxAcctFill === "solid" ? mix(P, A, 0.12) : c.tsxAcctFill === "gradient" ? `linear-gradient(100deg,${mix(P, stops[0], 0.28)},${mix(P, stops[stops.length - 1], 0.4)})` : rgba(mix(P, "#000000", 0.2), 0.62);
        const font = c.tsxAcctFont === "mono" ? 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace' : c.tsxAcctFont === "display" ? 'ui-sans-serif,"Inter","Segoe UI",system-ui,sans-serif' : "inherit";
        st += `--bd-acct-fill:${fill};--bd-acct-edge:${rgba(A, 0.25 + 0.35 * g)};--bd-acct-glow:${g ? `0 0 ${Math.round(6 + 14 * g)}px -2px ${rgba(A, 0.35 + 0.45 * g)}` : "none"};` +
          `--bd-acct-name:${rainbow || c.tsxAcctFill === "gradient" ? `linear-gradient(90deg,${stops.join(",")})` : `linear-gradient(90deg,${mix(A, "#ffffff", 0.55)},${mix(A, "#ffffff", 0.3)})`};` +
          `--bd-acct-tshadow:${g ? `0 0 ${Math.round(4 + 8 * g)}px ${rgba(A, 0.5 * g)}` : "none"};--bd-acct-font:${font};--bd-acct-weight:${c.tsxAcctFont === "display" ? 800 : 700};--bd-acct-track:${c.tsxAcctFont === "display" ? ".04em" : ".01em"};` +
          `--bd-acct-blur:${c.tsxAcctFill === "glass" ? "blur(8px) saturate(1.2)" : "none"};`;
      }
      ov.style.cssText = st + `inset:-${box.clientTop}px -${box.clientLeft}px`;   // over the box's own border too
      // the box keeps TopstepX's size, so when it's too narrow: drop the size, then the number, then use TopstepX's own
      // short name for a long type (XFA, LFA); your nickname is shortened last (…). The type is never dropped.
      ov.classList.remove("bd-acct-nosize", "bd-acct-nonum");
      const tb = ov.querySelector(".t"), nk = ov.querySelector(".n"), fits = () => ov.scrollWidth <= ov.clientWidth + 1;
      if (nk) nk.style.flex = "none";                      // measure with the nickname at its full width…
      for (const step of ["bd-acct-nosize", "bd-acct-nonum", "short"]) {
        if (fits()) break;
        if (step === "short") { if (info.short !== info.type) tb.textContent = info.short; } else ov.classList.add(step);
      }
      if (nk) nk.style.flex = "";                          // …and shorten it (…) only if it still doesn't fit
    }
    function applyAcct() {
      clearInterval(acctT); acctT = 0;
      if (!acctCss) { acctCss = document.createElement("style"); acctCss.id = "bd-tsx-acct-css"; (document.head || document.documentElement).appendChild(acctCss); }
      acctCss.textContent =
        // the box's own text is hidden (still there, still clickable); our line sits on top of it, the same size
        `html.bd-tsx-acct-on [data-bd-tsx-acct]{position:relative!important}` +
        `html.bd-tsx-acct-on [data-bd-tsx-acct],html.bd-tsx-acct-on [data-bd-tsx-acct] *:not(.bd-acct):not(.bd-acct *){color:transparent!important;text-shadow:none!important}` +
        `html.bd-tsx-acct-on [data-bd-tsx-acct] svg:not(.bd-acct svg) *{fill:transparent!important;stroke:transparent!important}` +
        `.bd-acct{position:absolute;inset:0;z-index:1;display:flex;align-items:center;gap:6px;padding:0 8px;box-sizing:border-box;overflow:hidden;white-space:nowrap;pointer-events:none;` +
          `border-radius:inherit;color:#e6e8ef;font:600 11.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em}` +
        `.bd-acct .t{flex:none;padding:2px 6px;border-radius:999px;border:1px solid var(--bd-acct-type);background:var(--bd-acct-type-bg);color:var(--bd-acct-type-fg);` +
          `font:800 9.5px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase}` +
        `.bd-acct .s{flex:none;font-style:normal;font-weight:700;color:#cfd3dd}` +
        `.bd-acct .n{min-width:0;overflow:hidden;text-overflow:ellipsis;font-style:normal;font-weight:700}` +
        `.bd-acct .u{flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:3px;font-style:normal;color:#9aa0ad;font-variant-numeric:tabular-nums}` +
        // (in Streamer mode the hidden eye stays, so viewers can tell the number is hidden)
        `.bd-acct.bd-acct-nosize .s,.bd-acct.bd-acct-nonum .u .d,.bd-acct.bd-acct-nonum .u:not(:has(svg)){display:none}` +
        // Custom: the box in your style
        `.bd-acct.bd-acct-x{background:var(--bd-acct-fill);border:1px solid var(--bd-acct-edge);box-shadow:var(--bd-acct-glow);-webkit-backdrop-filter:var(--bd-acct-blur);backdrop-filter:var(--bd-acct-blur);` +
          `font-family:var(--bd-acct-font);font-weight:var(--bd-acct-weight);letter-spacing:var(--bd-acct-track)}` +
        `.bd-acct.bd-acct-x .n{background:var(--bd-acct-name);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(var(--bd-acct-tshadow))}` +
        `.bd-acct.bd-acct-x .t{box-shadow:0 0 8px -2px var(--bd-acct-type)}` +
        // Streamer mode: balances blurred; the account list's numbers blurred except the one under your mouse; a box
        // whose type couldn't be read is blurred whole
        `html.bd-tsx-priv [data-bd-tsx-money]{filter:blur(6px)!important}` +
        `html.bd-tsx-priv [data-bd-tsx-acctitem]{filter:blur(5px)!important;transition:filter .12s}html.bd-tsx-priv [data-bd-tsx-acctitem]:hover{filter:none!important}` +
        `html.bd-tsx-acct-blur [data-bd-tsx-acct]{filter:blur(6px)!important}`;
      const tick = () => { renderAcct(); if (document.documentElement.classList.contains("bd-tsx-priv")) markMoney(); };
      tick();
      if (c.enabled && pro && (c.tsxAcctStyle === "custom" || (c.privacy && c.privacyAcct !== false)))
        acctT = setInterval(() => { if (!document.hidden) tick(); }, 1000);   // TopstepX redraws its bar as numbers change
    }
    // TopstepX builds its screen after loading: look for its panels a few times (cheap), then stop
    const look = () => { if (apply() && ++tries < 30) setTimeout(look, 2000); };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(KEYS, async (s) => { c = { ...KEYS, ...s }; await plan(); look(); applyAcct(); });
      chrome.storage.onChanged.addListener(async (ch, area) => { if (area !== "local") return; let hit = false; for (const k of Object.keys(ch)) if (k in KEYS) { c[k] = ch[k].newValue; hit = true; } if (!hit) return; if (ch.pass || ch.invite || ch.deviceId) await plan(); apply(); applyAcct(); });
    }
  })();
})();
