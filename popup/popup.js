// Desktop app: its preload provides storage as window.wickedStore (Electron already owns window.chrome).
if (window.wickedStore && !(window.chrome && window.chrome.storage)) {
  try { window.chrome = window.chrome || {}; window.chrome.storage = window.wickedStore.storage; }
  catch { window.chrome = { storage: window.wickedStore.storage }; }
}
const $ = (id) => document.getElementById(id);
// Small inline icons (some system fonts lack ↖ ✕ etc.)
const ICON_X = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const cornerIcon = (x, y) => `<svg viewBox="0 0 16 12" width="18" height="14" aria-hidden="true"><rect x="0.75" y="0.75" width="14.5" height="10.5" rx="2" fill="none" stroke="currentColor" stroke-opacity=".55"/><rect x="${x}" y="${y}" width="5" height="3" rx="1" fill="currentColor"/></svg>`;
const MAX_MB = 50;
const CHART_KEYS = ["tkOn","tkColor","tkSize","tkFont","tkGlow","tkOnly","dlgMode","dlgColor","dlgAlpha","sbOn","sbColor","sbW","sbStyle","axOn","axColor","axW","axStyle","gridOn","gridColor","gridAlpha","gridW","gridStyle","chOn","chColor","chW","chStyle","chGlow","chLabels","plOn","plColor","plW","plStyle","panelMode","panelColor"];
const LOOK_KEYS = [...CHART_KEYS, "opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont","react","reactStrength","vignette","calm","sessionOn","sessionSkins","multi","chartSkins","bracketOn","bracketSize","bracketBack","bracketFill","bracketText","bracketProfit","bracketLoss","bracketBorderColor","bracketBorderW","bracketLineColor","bracketLineW","bracketQty","pnlShow","pnlStyle","pnlPos","pnlSize","pnlBack","pnlUp","pnlDown"];
const DEFAULTS = {
  enabled: true, skin: "aurora", mediaId: null, media: [], loadouts: [],
  opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
  fps: "auto", fit: "cover", posX: 50, posY: 50,
  powerSaver: false, paused: false, bw: false, layer: "behind",
  candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
  react: "off", reactStrength: 0.6,
  wmOn: false, wmPos: "br", wmText: "", wmStyle: "corner", wmOpacity: 0.85, wmDrift: false, clipEdit: true, clipQuality: "balanced", clipAudio: "none", clipLen: 10, privacy: false, privacyPeek: false, privacyKey: "Alt+Shift+KeyP", privacyAcct: true, privacyOrder: false, privacyPnl: "hide", bracketQty: "", goalSound: "off", sessionSound: "off", tkOn: false, tkColor: "", tkSize: 1, tkFont: "default", tkGlow: false, tkOnly: false, tradeClipOn: false, tradeClipLen: 30, toggleKey: "Alt+Shift+KeyW", focusKey: "Alt+Shift+KeyF", recordKey: "Alt+Shift+KeyR", snapKey: "Alt+Shift+KeyS", focus: false, focusHides: "wallpaper", timerOn: false, timerMarket: "auto", timerPos: "bc", timerShow: "full", timerFormat: "in", timerClosed: "show", timerStyle: "pill", sides: "off", leftBar: "off", panelMode: "off", panelColor: "#10131c", dlgMode: "off", dlgColor: "#12151f", dlgAlpha: 0.78, uiFont: "default", uiSize: 0, uiAccent: "", vignette: 0, calm: false,
  sessionOn: false, sessionSkins: { asia: "galaxy", london: "rain", ny: "cybergrid", off: "ocean" },
  symbolOn: false, symbolSkins: {}, autoQuality: true, autoMatch: false,
  candleLook: "solid", shiftSpeed: 10,
  gridOn: false, gridColor: "", gridAlpha: 0.35, gridW: 0, gridStyle: "dotted",
  chOn: false, chColor: "", chW: 0, chStyle: "dashed", chGlow: false, chLabels: false,
  plOn: false, plColor: "", plW: 0, plStyle: "dotted",
  sbOn: false, sbColor: "", sbW: 0, sbStyle: "dashed", axOn: false, axColor: "", axW: 0, axStyle: "solid",
  lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: true,
  scaleSize: 0, scaleFont: "default",
  multi: "span", chartSkins: {}, pnlShow: false, pnlStyle: "color", pnlPos: "tc", pnlSize: 1, pnlBack: "glass", pnlUp: "", pnlDown: "",
  bracketOn: false, bracketSize: 1, bracketBack: "keep",
  bracketFill: "", bracketText: "", bracketProfit: "", bracketLoss: "",
  bracketBorderColor: "", bracketBorderW: 0, bracketLineColor: "", bracketLineW: 0,
  goalOn: false, goalGuard: false, goalTarget: 500, goalLimit: 300, goalPos: "bl", journalOn: false, clipMode: "chart", clipFps: 30,
};
let cfg = { ...DEFAULTS };
const set = (obj) => { Object.assign(cfg, obj); chrome.storage.local.set(obj); };
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- tabs ----------
document.querySelectorAll("#nav button").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("#nav button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll("main section").forEach((s) => (s.hidden = s.id !== "tab-" + b.dataset.tab));
  };
});

// ---------- skins (live previews share one loop) ----------
let previews = [], quickPreviews = [], activeCat = "All";
function renderSkins() {
  const cats = ["All", "Wow", ...new Set(Object.values(WickedSkins).map((s) => s.cat))];
  $("chips").innerHTML = "";
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "chip" + (c === activeCat ? " on" : "");
    b.textContent = c;
    b.onclick = () => { activeCat = c; renderSkins(); };
    $("chips").appendChild(b);
  });
  $("skinCards").innerHTML = "";
  previews = [];
  let shown = 0;
  const big = document.body.classList.contains("desk");
  // in the app, "All" is shown as sections (the showpieces first), like a gallery
  let list = Object.entries(WickedSkins);
  const grouped = big && activeCat === "All" && !skinQuery();
  if (grouped) {
    const cats = [...new Set(list.map(([, s]) => s.cat))];
    list = [["__h", "\u2726 Wow \u00B7 showpieces"], ...list.filter(([, s]) => s.wow), ...cats.flatMap((c) => [["__h", c], ...list.filter(([, s]) => !s.wow && s.cat === c)])];
  }
  for (const [id, s] of list) {
    if (id === "__h") { const h = document.createElement("h5"); h.className = "grp-h"; h.textContent = s; $("skinCards").appendChild(h); continue; }
    if (!grouped && (activeCat === "Wow" ? !s.wow : activeCat !== "All" && s.cat !== activeCat)) continue;
    if (!matchQ(s.name, s.cat, s.wow ? "wow" : "")) continue;
    shown++;
    const card = document.createElement("button");
    card.className = "card" + (currentSrc() === id ? " on" : "");
    const cv = document.createElement("canvas");
    const CW = big ? 260 : 160, CH = big ? 128 : 76;
    cv.width = CW; cv.height = CH;
    const skin = s.create(cv.getContext("2d")); skin.resize(CW, CH);
    previews.push(watchPreview({ skin, t: 0 }, cv));
    card.append(cv);
    card.insertAdjacentHTML("beforeend", `<span class="live">● LIVE</span><div class="label">${esc(s.name)}</div>`);
    card.onclick = () => pickSource(id);
    $("skinCards").appendChild(card);
  }
  updateEmpty(shown);
  renderHero();
}
// Only animate previews that are actually on screen (dozens of live canvases would load the computer for nothing).
// Each preview draws one still frame straight away, so off-screen cards still show a picture.
const previewIO = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { for (const e of es) if (e.target.__bdP) e.target.__bdP.vis = e.isIntersecting; }) : null;
function watchPreview(p, cv) {
  p.vis = !previewIO; try { p.skin.frame(2, 0.016); } catch {}
  if (previewIO) { cv.__bdP = p; previewIO.observe(cv); }
  return p;
}
let last = 0;
(function loop(now) {
  requestAnimationFrame(loop);
  if (now - last < 66) return; // ~15fps previews
  const dt = (now - last) / 1000; last = now;
  if (document.hidden) return;
  for (const p of [...previews, ...quickPreviews, ...lookPreviews]) if (p.vis !== false) p.skin.frame((p.t += Math.min(dt, 0.1)), Math.min(dt, 0.1));
})(0);

// ---------- desktop app: a full-window layout of its own (the extension keeps its compact panel) ----------
// Same controls and settings as the extension (nothing duplicated): the app just lays them out for a big window:
// a sidebar, a top bar with live stats, a big live preview of your look, a gallery of wallpapers, two-column settings.
const heroP = { p: null, key: "" };
function renderHero() {
  if (!document.body.classList.contains("desk")) return;
  const bg = $("dhBg"), fg = $("dhFg"); if (!bg || !fg) return;
  const r = bg.getBoundingClientRect(); if (r.width < 50) return;
  const W = Math.round(r.width * 0.8), H = Math.round(r.height * 0.8);
  const src = cfg.skin, sk = WickedSkins[src], key = src + "|" + W + "x" + H;
  if (heroP.key !== key) {
    heroP.key = key; bg.width = W; bg.height = H; heroP.p = null;
    if (sk) { const s = sk.create(bg.getContext("2d")); s.resize(W, H); heroP.p = { skin: s, t: 3 }; s.frame(3, 0.016); }
    else { const g = bg.getContext("2d"); g.fillStyle = "#0b0d14"; g.fillRect(0, 0, W, H); }
  }
  const media = src === "media" && (cfg.media || []).find((m) => m.id === cfg.mediaId);
  $("dhName").textContent = sk ? sk.name : media ? media.name || "Your upload" : "Your wallpaper";
  const tags = [cfg.enabled ? "\u25CF LIVE" : "\u25CB OFF", sk ? sk.cat : "My upload", sk && sk.wow ? "\u2726 Wow" : ""].filter(Boolean);
  $("dhTags").innerHTML = tags.map((t, i) => `<i class="${i === 0 ? (cfg.enabled ? "on" : "") : ""}">${esc(t)}</i>`).join("");
  // candles across the stage, in your colours and look
  const dpr = Math.min(2, devicePixelRatio || 1), fr = fg.getBoundingClientRect();
  fg.width = Math.round(fr.width * dpr); fg.height = Math.round(fr.height * dpr);
  const g = fg.getContext("2d"), CL = window.__bdCandleLooks, look = cfg.candleOn ? cfg.candleLook || "solid" : "solid";
  const up = cfg.candleOn && /^#[0-9a-f]{6}$/i.test(cfg.candleUp || "") ? cfg.candleUp : "#26a69a", dn = cfg.candleOn && /^#[0-9a-f]{6}$/i.test(cfg.candleDown || "") ? cfg.candleDown : "#ef5350";
  let seed = 7, p = 50; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = Math.max(30, Math.round(fr.width / 16)), bars = [];
  for (let i = 0; i < n; i++) { const o = p; p += (rnd() - 0.47) * 6; bars.push([o, p, Math.min(o, p) - rnd() * 3, Math.max(o, p) + rnd() * 3]); }
  let lo = Infinity, hi = -Infinity; for (const b of bars) { lo = Math.min(lo, b[2]); hi = Math.max(hi, b[3]); }
  const top = fg.height * 0.12, bot = fg.height * 0.62, Y = (v) => bot - ((v - lo) / (hi - lo || 1)) * (bot - top), slot = fg.width / (n + 1), bw = Math.max(2 * dpr, slot * 0.56);
  const k = { fill: (a, b, c, d) => g.fillRect(a, b, c, d), style: (v) => { g.fillStyle = v; }, stroke: (v) => { g.strokeStyle = v; }, strokeRect: (a, b, c, d) => g.strokeRect(a, b, c, d), fillPath: () => g.fill(), px: dpr, yfrac: 0 };
  const glow = Math.max(+cfg.candleGlow || 0, CL && CL.META[look] ? CL.META[look].minGlow : 0);
  bars.forEach(([o, c, l, h], i) => {
    const isUp = c >= o, col = isUp ? up : dn, cx = slot * (i + 1), t0 = Y(Math.max(o, c)), t1 = Y(Math.min(o, c)); k.yfrac = t0 / fg.height;
    g.save(); if (glow > 0) { g.shadowColor = col; g.shadowBlur = (4 + glow * 18) * dpr * 0.7; }
    g.fillStyle = CL ? CL.wick(look, col, k) : col; g.fillRect(Math.round(cx - dpr / 2), Y(h), dpr, Y(l) - Y(h));
    if (CL) CL.draw(g, look, Math.round(cx - bw / 2), t0, Math.round(bw), Math.max(dpr, t1 - t0), col, isUp, k); else { g.fillStyle = col; g.fillRect(cx - bw / 2, t0, bw, t1 - t0); }
    g.restore();
  });
  // your look, at a glance
  const lm = CL && CL.META[look];
  $("dhLook").innerHTML = `<div class="dl-row"><span>Candles</span><b>${esc(cfg.candleOn ? (lm ? lm.name : "Solid") : "TradingView's own")}</b></div>
    <div class="dl-row"><span>Colours</span><b><i class="sw" style="background:${up}"></i><i class="sw" style="background:${dn}"></i></b></div>
    <div class="dl-row"><span>Chart lines</span><b>${[cfg.gridOn && "grid", cfg.chOn && "crosshair", cfg.plOn && "price line"].filter(Boolean).join(", ") || "TradingView's own"}</b></div>
    <div class="dl-row"><span>TradingView</span><b>${cfg.panelMode && cfg.panelMode !== "off" ? "styled panels" : "TradingView's own"}</b></div>`;
}
(function heroLoop() {                                              // the big preview runs smoother than the small cards
  let last = 0;
  (function f(now) {
    requestAnimationFrame(f);
    if (!heroP.p || document.hidden || now - last < 33 || $("tab-skins").hidden) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now; heroP.p.skin.frame((heroP.p.t += dt), dt);
  })(0);
})();
function setupDesk() {
  if (!DESK || IS_TAB) return;
  const B = document.body; B.classList.add("desk");
  const nav = $("nav"), main = document.querySelector("main");
  nav.querySelector(".brand").innerHTML = '<img src="../icons/icon-128.png" alt="" /><div><b>Priism Skins</b><small>for TradingView</small></div>';
  // sidebar foot: the chart card + the on/off switch
  const foot = document.createElement("div"); foot.className = "desk-foot";
  foot.append($("deskCard"), main.querySelector(".top"));
  nav.appendChild(foot);
  // top bar: page title, search, live stats
  const bar = document.createElement("header"); bar.className = "desk-bar";
  bar.innerHTML = '<div class="desk-title"><h1 id="deskPage">Skins</h1><p id="deskSub"></p></div><div class="desk-stats" id="deskStats"></div>';
  bar.insertBefore(main.querySelector(".finder"), $("deskStats"));
  main.insertBefore(bar, main.firstChild);
  const SUB = { skins: "Wallpapers and one-tap looks for your chart", candles: "Candles, chart lines and the price scale", interface: "TradingView's own panels, toolbars and windows",
    trading: "Brackets, P&L, daily goal, session timer and trade clips", capture: "Snapshots, clips, streamer mode and watermark", workshop: "Community looks and wallpapers",
    loadouts: "Your saved looks and share links", tune: "Picture, motion, shortcuts and advanced" };
  const setPage = (b) => { if (!b) return; $("deskPage").textContent = b.querySelector("span").textContent; $("deskSub").textContent = SUB[b.dataset.tab] || "";
    main.scrollTop = 0; if (b.dataset.tab === "skins") setTimeout(renderHero, 0); };
  document.querySelectorAll("#nav button[data-tab]").forEach((b) => b.addEventListener("click", () => setPage(b)));
  setPage(document.querySelector("#nav button.on"));
  // the big live preview on Skins
  const hero = document.createElement("div"); hero.id = "deskHero";
  hero.innerHTML = '<div class="dh-stage"><canvas id="dhBg"></canvas><div class="dh-dim"></div><canvas id="dhFg"></canvas><div class="dh-text"><div id="dhTags"></div><h2 id="dhName"></h2></div></div>' +
    '<div class="dh-side"><b class="dh-h">Your look</b><div id="dhLook"></div><div class="dh-btns"><button class="primary" id="dhShare">Copy share link</button><button id="dhSave">Save this look</button></div></div>';
  $("tab-skins").insertBefore(hero, $("tab-skins").firstChild);
  $("dhShare").onclick = () => { $("codeCopy").click(); toast("Share link copied. Paste it anywhere."); };
  $("dhSave").onclick = () => { document.querySelector('#nav [data-tab="loadouts"]').click(); $("loName").focus(); };
  addEventListener("resize", () => { clearTimeout(setupDesk.rt); setupDesk.rt = setTimeout(renderHero, 120); });
  // live stats: chart FPS (from the chart window) and what the app is using
  const stat = (k, v, cls) => `<span class="${cls || ""}"><small>${k}</small>${v}</span>`;
  const tick = async () => {
    let s = null; try { s = await DESK.stats(); } catch {}
    if (!s) return;
    $("deskStats").innerHTML = stat("CHART", s.open ? "Open" : "Closed", s.open ? "ok" : "") + stat("FPS", s.open && s.fps ? s.fps : "\u2013") + stat("CPU", s.cpu + "%") + stat("RAM", s.mem + " MB");
  };
  tick(); setInterval(() => { if (!document.hidden) tick(); }, 2000);
}


// ---------- candles ----------
// [id, name, up, down, group]. Ids are stored in settings; keep them stable.
const CANDLE_GROUPS = ["Clean", "Neon", "Warm", "Cool", "Rich"];
const CANDLE_PRESETS = [
  ["mono", "Mono", "#ffffff", "#2f2f35", "Clean"],
  ["ghost", "Ghost", "#f5f5f5", "#5c5c5c", "Clean"],
  ["arctic", "Arctic", "#e0f7fa", "#0288d1", "Clean"],
  ["neon", "Neon Pulse", "#00ffa3", "#ff2e97", "Neon"],
  ["cyberpunk", "Cyberpunk", "#fcee0a", "#00f0ff", "Neon"],
  ["matrix", "Terminal", "#00ff41", "#0b6623", "Neon"],
  ["acid", "Acid", "#c6ff00", "#7c4dff", "Neon"],
  ["bubblegum", "Bubblegum", "#7cf7d4", "#ff8fd8", "Neon"],
  ["lava", "Magma", "#ffb300", "#ff3d00", "Warm"],
  ["gold", "Aurum", "#ffd36b", "#a67c1a", "Warm"],
  ["sunrise", "Sunrise", "#ffe082", "#ff6e40", "Warm"],
  ["dusk", "Dusk", "#ffb74d", "#ec407a", "Warm"],
  ["crimson", "Crimson", "#ff5252", "#8a0f2e", "Warm"],
  ["ice", "Glacier", "#8be9ff", "#3d5afe", "Cool"],
  ["deepsea", "Deepsea", "#4dd0e1", "#5c6bc0", "Cool"],
  ["amethyst", "Amethyst", "#b388ff", "#4a5a6a", "Cool"],
  ["forest", "Forest", "#9ccc65", "#6d4c41", "Rich"],
  ["royal", "Royal", "#ffd700", "#6a1b9a", "Rich"],
];
let candleGroup = "All";
const bars = (up, down) => {
  // 8 tiny candles: [open, close, low, high] in a 0-30 box
  const d = [[20,16,22,12],[16,18,19,13],[18,12,20,10],[12,14,16,9],[14,9,15,6],[9,10,12,5],[10,5,11,2],[5,6,8,1]];
  return `<svg viewBox="0 0 80 30" preserveAspectRatio="none">${d.map(([o, c, lo, hi], i) => {
    const col = c <= o ? up : down; // lower y = higher price
    const x = 5 + i * 10, top = Math.min(o, c), ht = Math.max(2, Math.abs(o - c));
    return `<line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${col}"/><rect x="${x - 3}" y="${top}" width="6" height="${ht}" fill="${col}"/>`;
  }).join("")}</svg>`;
};
const LOOK_HINT = {
  solid: "Solid bodies in your colours.",
  neon: "Tube: glowing outlines with a faint fill.",
  prism: "Rainbow: colours fan out across the chart, left to right.",
  shift: "Cycle: colours keep flowing over time. Indicator lines on the chart cycle too.",
};
// Candle look cards: every look, each with a small preview drawn in YOUR current candle colours (same drawing code
// the chart uses, so the preview is what you get). Redrawn when colours or glow change.
function renderLookGrid() {
  setTimeout(renderHero, 0);
  const box = $("candleLook"), CL = window.__bdCandleLooks; if (!box || !CL) return;
  const up = /^#[0-9a-f]{6}$/i.test(cfg.candleUp || "") ? cfg.candleUp : "#00ffa3", down = /^#[0-9a-f]{6}$/i.test(cfg.candleDown || "") ? cfg.candleDown : "#ff2e97";
  const sig = up + down + (+cfg.candleGlow || 0) + "|" + (cfg.skin || "");
  // one still frame of YOUR current wallpaper, used behind every look preview
  let bgc = null;
  try { const sk = WickedSkins[cfg.skin]; if (sk) { bgc = document.createElement("canvas"); bgc.width = 200; bgc.height = 104; const s0 = sk.create(bgc.getContext("2d")); s0.resize(200, 104); s0.frame(3, 0.016); } } catch { bgc = null; }
  if (box.dataset.sig !== sig || box.children.length !== CL.LOOKS.length) {
    box.dataset.sig = sig; box.textContent = "";
    for (const [id, name] of CL.LOOKS) {
      const b = document.createElement("button"); b.className = "lookcard"; b.dataset.look = id; b.title = CL.META[id].hint;
      const cv = document.createElement("canvas"); cv.width = 200; cv.height = 104;
      const lab = document.createElement("span"); lab.textContent = name;
      b.append(cv, lab); box.appendChild(b);
      b.onclick = () => { set({ candleLook: id, candleOn: true }); $("candleOn").checked = true; renderCandles(); };
      requestAnimationFrame(() => { try { CL.preview(cv, id, up, down, +cfg.candleGlow || 0, bgc); } catch {} });
    }
  }
  for (const b of box.children) b.classList.toggle("on", b.dataset.look === (cfg.candleLook || "solid"));
}
function renderCandles() {
  $("candleOn").checked = cfg.candleOn;
  seg("autoMatch", [[false, "Off"], [true, "On"]], () => !!cfg.autoMatch, (v) => { set({ autoMatch: v, ...(v ? { candleOn: true } : {}) }); if (v) $("candleOn").checked = true; });
  // Match-wallpaper only makes sense on your own uploaded wallpaper.
  const onMedia = cfg.skin === "media";
  $("autoMatchRow").hidden = !onMedia;
  $("autoMatchHint").hidden = !onMedia;
  renderLookGrid();
  $("shiftRow").hidden = cfg.candleLook !== "shift";
  $("shiftSpeed").value = cfg.shiftSpeed; $("shiftSpeedOut").textContent = cfg.shiftSpeed + "s";
  { const CL = window.__bdCandleLooks, m = CL && CL.META[cfg.candleLook];
    $("lookHint").textContent = m ? m.name + ": " + m.hint : (LOOK_HINT[cfg.candleLook] || ""); }
  $("lineGlow").value = cfg.lineGlow; $("lineGlowOut").textContent = Math.round(cfg.lineGlow * 100) + "%";
  seg("scaleTextMode", [["auto", "Auto"], ["custom", "Custom"]], () => (cfg.scaleText ? "custom" : "auto"),
    (v) => { set({ scaleText: v === "custom" ? $("scaleText").value : "" }); renderCandles(); });
  $("scaleText").value = cfg.scaleText || "#e9ebf2"; $("scaleText").hidden = !cfg.scaleText;
  seg("scaleSize", [[0, "Normal"], [1, "Large"], [2, "XL"]], () => cfg.scaleSize, (v) => set({ scaleSize: v }));
  seg("scaleFont", [["default", "Default"], ["mono", "Mono"], ["rounded", "Rounded"]], () => cfg.scaleFont, (v) => set({ scaleFont: v }));
  $("scaleBgColor").value = cfg.scaleBgColor || "#0b1320"; $("scaleBgColor").hidden = cfg.scaleBg !== "color";
  $("scaleGlow").value = cfg.scaleGlow; $("scaleGlowOut").textContent = Math.round(cfg.scaleGlow * 100) + "%";
  seg("scaleBold", [[false, "Regular"], [true, "Bold"]], () => cfg.scaleBold, (v) => set({ scaleBold: v }));
  seg("scaleBg", [["auto", "Auto"], ["glass", "Glass"], ["color", "Colour"]], () => (cfg.scaleBg === "clear" ? "auto" : cfg.scaleBg === "default" ? "glass" : cfg.scaleBg), (v) => { set({ scaleBg: v }); renderCandles(); });
  seg("scaleLabels", [[true, "Candle colours"], [false, "Original"]], () => cfg.scaleLabels, (v) => set({ scaleLabels: v }));
  $("candleGlow").value = cfg.candleGlow; $("candleGlowOut").textContent = Math.round(cfg.candleGlow * 100) + "%";
  $("candleUp").value = cfg.candleUp; $("candleDown").value = cfg.candleDown;
  // filter chips + grouped grid
  const chips = $("candleChips"); chips.innerHTML = "";
  for (const g of ["All", ...CANDLE_GROUPS]) {
    const c = document.createElement("button");
    c.className = "chip" + (g === candleGroup ? " on" : ""); c.textContent = g;
    c.onclick = () => { candleGroup = g; renderCandles(); };
    chips.appendChild(c);
  }
  const box = $("candleCards"); box.innerHTML = "";
  const custom = cfg.candleOn && !CANDLE_PRESETS.some(([, , u, d]) => u === cfg.candleUp && d === cfg.candleDown);
  if (custom) {
    box.insertAdjacentHTML("beforeend", `<div class="grp-label">Your colours</div>`);
    box.insertAdjacentHTML("beforeend", `<button class="card preset on" disabled>${bars(cfg.candleUp, cfg.candleDown)}<div class="label">Custom</div></button>`);
  }
  let lastGroup = null;
  CANDLE_PRESETS.filter((p) => candleGroup === "All" || p[4] === candleGroup).forEach(([id, name, up, down, group]) => {
    if (candleGroup === "All" && group !== lastGroup) { box.insertAdjacentHTML("beforeend", `<div class="grp-label">${group}</div>`); lastGroup = group; }
    const b = document.createElement("button");
    b.className = "card preset" + (cfg.candleOn && cfg.candleUp === up && cfg.candleDown === down ? " on" : "");
    b.innerHTML = bars(up, down) + `<div class="label">${esc(name)}</div>`;
    b.onclick = () => applyWithUndo({ candleOn: true, candleUp: up, candleDown: down, candlePreset: id }, `Candles: ${name}.`);
    box.appendChild(b);
  });
}
$("candleOn").onchange = (e) => set({ candleOn: e.target.checked });
$("shiftSpeed").oninput = (e) => { set({ shiftSpeed: +e.target.value }); $("shiftSpeedOut").textContent = e.target.value + "s"; };
$("lineGlow").oninput = (e) => { set({ lineGlow: +e.target.value }); $("lineGlowOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("scaleGlow").oninput = (e) => { set({ scaleGlow: +e.target.value }); $("scaleGlowOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("scaleText").oninput = (e) => set({ scaleText: e.target.value });
$("scaleBgColor").oninput = (e) => set({ scaleBgColor: e.target.value });
$("uiAccent").oninput = (e) => set({ uiAccent: e.target.value });
$("candleGlow").oninput = (e) => { set({ candleGlow: +e.target.value }); renderLookGrid(); $("candleGlowOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("candleUp").oninput = (e) => { set({ candleUp: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; renderLookGrid(); };
$("candleDown").oninput = (e) => { set({ candleDown: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; renderLookGrid(); };

// ---------- undo ----------
// Any one-click change can be undone from the toast at the bottom.
let undoTimer;
function toast(msg, undo) {
  $("toastMsg").textContent = msg;
  $("toast").hidden = false;
  $("toastUndo").hidden = !undo;
  $("toastUndo").onclick = undo ? () => { undo(); $("toast").hidden = true; } : null;
  clearTimeout(undoTimer); undoTimer = setTimeout(() => ($("toast").hidden = true), undo ? 8000 : 3000);
}
function applyWithUndo(changes, label) {
  const before = Object.fromEntries(Object.keys(changes).map((k) => [k, cfg[k]]));
  set(changes); refreshAll();
  toast(label, () => { set(before); refreshAll(); });
}
function refreshAll() { renderChartStyle(); syncPanels(); syncShortcuts(); syncTimer(); syncExtras(); syncSkinView(); renderSkins(); renderMedia(); renderCandles(); syncTune(); syncWatermark(); renderQuick(); renderLoadouts(); syncSessions(); syncSymbols(); syncCharts(); syncPnl(); syncBracket(); syncGoal(); renderJournal(); if ($("clipMode")) syncClipMode(); }

// ---------- one-click looks: skin + candles + glow + price scale in one tap ----------
// Look groups (shown as chips). New looks: add the id here or they land in "Classic".
const LOOK_GROUP = {
  "ocean-calm": "Calm", nightfall: "Calm", daybreak: "Calm", sterling: "Calm", harbor: "Calm", dune: "Calm", "clean-focus": "Calm", blossom: "Calm",
  glowstick: "Glow", blacklight: "Glow", vaporwave: "Glow", molten: "Glow", warp: "Glow", spectrum: "Glow", "neon-night": "Glow", firefly: "Glow",
  horizon: "Wow", bloom: "Wow", ink: "Wow", kaleido: "Wow", slick: "Wow", hypercube: "Wow", helix: "Wow", synapse: "Wow",
};
const LOOK_GROUPS = ["All", "Wow", "Calm", "Glow", "Classic"];
const groupOf = (q) => LOOK_GROUP[q.id] || "Classic";
const QUICK_LOOKS = [
  // ----- Wow: the showpiece wallpapers, each with one of the new candle looks (no wallpaper reused) -----
  { id: "horizon", name: "Event Horizon", sub: "Black hole · Glass candles", skin: "blackhole",
    set: { candleOn: true, candleUp: "#ffd27a", candleDown: "#8c6bff", candleLook: "glass", candleGlow: 0.3, candlePreset: "custom", lineGlow: 0.25, scaleText: "#ffe1a8", scaleGlow: 0.2, scaleBg: "auto", dim: 0.3 } },
  { id: "bloom", name: "Bloom", sub: "Fractal Bloom · Holo", skin: "julia",
    set: { candleOn: true, candleUp: "#ff9ecf", candleDown: "#6f63ff", candleLook: "holo", candleGlow: 0.2, candlePreset: "custom", lineGlow: 0.2, scaleText: "#ffc7e4", scaleGlow: 0.15, scaleBg: "auto", dim: 0.25 } },
  { id: "ink", name: "Ink", sub: "Ink Flow · Outline", skin: "inkflow",
    set: { candleOn: true, candleUp: "#e8e3d6", candleDown: "#7d8db0", candleLook: "outline", candleGlow: 0, candlePreset: "custom", lineGlow: 0, scaleText: "#e8e3d6", scaleGlow: 0, scaleBg: "auto", dim: 0.35 } },
  { id: "kaleido", name: "Mirror", sub: "Kaleidoscope · Fade", skin: "kaleido",
    set: { candleOn: true, candleUp: "#7df9ff", candleDown: "#ff5ec8", candleLook: "fade", candleGlow: 0.25, candlePreset: "custom", lineGlow: 0.25, scaleText: "#b8fbff", scaleGlow: 0.2, scaleBg: "auto", dim: 0.35 } },
  { id: "slick", name: "Liquid Chrome", sub: "Oil Slick · Chrome", skin: "oilslick",
    set: { candleOn: true, candleUp: "#b9f7ff", candleDown: "#c08bff", candleLook: "chrome", candleGlow: 0.1, candlePreset: "custom", lineGlow: 0.15, scaleText: "#d9faff", scaleGlow: 0.1, scaleBg: "glass", dim: 0.3 } },
  { id: "hypercube", name: "Hypercube", sub: "Tesseract · Neon", skin: "tesseract",
    set: { candleOn: true, candleUp: "#00e5ff", candleDown: "#ff3d7f", candleLook: "neon", candleGlow: 0.5, candlePreset: "custom", lineGlow: 0.4, scaleText: "#8ff4ff", scaleGlow: 0.35, scaleBg: "auto", dim: 0.35 } },
  { id: "helix", name: "Genome", sub: "Double Helix · 3D", skin: "helix",
    set: { candleOn: true, candleUp: "#39ff88", candleDown: "#ff4d6d", candleLook: "bevel", candleGlow: 0.15, candlePreset: "custom", lineGlow: 0.2, scaleText: "#a8ffc9", scaleGlow: 0.15, scaleBg: "auto", dim: 0.35 } },
  { id: "synapse", name: "Neural", sub: "Synapse · Ice", skin: "synapse",
    set: { candleOn: true, candleUp: "#c8f3ff", candleDown: "#7a8cff", candleLook: "ice", candleGlow: 0.2, candlePreset: "custom", lineGlow: 0.2, scaleText: "#d6f5ff", scaleGlow: 0.15, scaleBg: "auto", dim: 0.35 } },
  { id: "neon-night", name: "Neon Night", sub: "Cyber Grid · Tube", skin: "cybergrid",
    set: { candleOn: true, candleUp: "#fcee0a", candleDown: "#00f0ff", candleLook: "neon", candleGlow: 0.5, candlePreset: "cyberpunk", lineGlow: 0.5, scaleText: "#7df9ff", scaleGlow: 0.45, scaleBg: "auto", dim: 0.25 } },
  { id: "clean-focus", name: "Clean Focus", sub: "Slate · Mono", skin: "graphite",
    set: { candleOn: true, candleUp: "#ffffff", candleDown: "#5c5f6e", candleLook: "solid", candleGlow: 0, candlePreset: "mono", lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBg: "auto", dim: 0.35 } },
  { id: "cosmic", name: "Cosmic", sub: "Spiral Galaxy · Rainbow", skin: "galaxy",
    set: { candleOn: true, candleUp: "#b388ff", candleDown: "#ff6ec7", candleLook: "prism", candleGlow: 0.35, candlePreset: "custom", lineGlow: 0.35, scaleText: "", scaleGlow: 0.3, scaleBg: "auto", dim: 0.2 } },
  { id: "inferno", name: "Inferno", sub: "Cinders · Magma", skin: "embers",
    set: { candleOn: true, candleUp: "#ffb300", candleDown: "#ff3d00", candleLook: "solid", candleGlow: 0.6, candlePreset: "lava", lineGlow: 0.3, scaleText: "#ffcc80", scaleGlow: 0.35, scaleBg: "auto", dim: 0.3 } },
  { id: "ocean-calm", name: "Ocean Calm", sub: "Tide · Glacier", skin: "ocean",
    set: { candleOn: true, candleUp: "#8be9ff", candleDown: "#3d5afe", candleLook: "solid", candleGlow: 0.2, candlePreset: "ice", lineGlow: 0.15, scaleText: "", scaleGlow: 0, scaleBg: "auto", dim: 0.3 } },
  { id: "flow", name: "Colour Flow", sub: "Polar Lights · Cycle", skin: "aurora",
    set: { candleOn: true, candleUp: "#00ffa3", candleDown: "#ff2e97", candleLook: "shift", shiftSpeed: 12, candleGlow: 0.3, candlePreset: "neon", lineGlow: 0.3, scaleText: "", scaleGlow: 0.2, scaleBg: "auto", dim: 0.3 } },
  // Nexus Match: dark Deep Field so Nexus "Priisma Neon" glass zones pop; candles + scale in the same cyan→magenta family.
  { id: "nexus-match", name: "Nexus Match", sub: "Deep Field · for Priisma Neon zones", skin: "starfield",
    set: { candleOn: true, candleUp: "#00eeff", candleDown: "#ff36bc", candleLook: "solid", candleGlow: 0.3, candlePreset: "custom", lineGlow: 0.2, scaleText: "#7ef0ff", scaleGlow: 0.3, scaleBg: "glass", dim: 0.5 } },
  // Monochrome: a live black background with crisp white (up) and dark (down) candles. Clean for streams.
  { id: "mono-black", name: "Blackout", sub: "Deep Field · White & Black", skin: "starfield",
    set: { candleOn: true, candleUp: "#ffffff", candleDown: "#2a2d36", candleLook: "solid", candleGlow: 0, candlePreset: "mono", lineGlow: 0.1, scaleText: "#ffffff", scaleGlow: 0, scaleBold: true, scaleBg: "auto", scaleLabels: false, dim: 0.55 } },
  // Terminal green on black — hacker/retro.
  { id: "terminal", name: "Terminal", sub: "Code Rain · Green", skin: "matrix",
    set: { candleOn: true, candleUp: "#00ff41", candleDown: "#0b6623", candleLook: "neon", candleGlow: 0.4, candlePreset: "matrix", lineGlow: 0.4, scaleText: "#00ff41", scaleGlow: 0.4, scaleFont: "mono", scaleBg: "auto", dim: 0.4 } },
  // Gold on deep navy — premium look.
  { id: "midas", name: "Midas", sub: "Abyssal Glow · Gold", skin: "deepsea",
    set: { candleOn: true, candleUp: "#ffd36b", candleDown: "#8a6d1a", candleLook: "solid", candleGlow: 0.35, candlePreset: "gold", lineGlow: 0.25, scaleText: "#ffd36b", scaleGlow: 0.3, scaleBg: "glass", dim: 0.35 } },
  // Soft pastel on falling petals — calm, pretty.
  { id: "blossom", name: "Blossom", sub: "Petal Drift · Pastel", skin: "sakura",
    set: { candleOn: true, candleUp: "#7cf7d4", candleDown: "#ff8fd8", candleLook: "solid", candleGlow: 0.2, candlePreset: "bubblegum", lineGlow: 0.15, scaleText: "", scaleGlow: 0, scaleBg: "glass", dim: 0.25 } },

  // ----- Calm, low-distraction "matching everything" looks. Each uses a DIFFERENT wallpaper (no skin reused across
  // these), solid candles, little/no glow, and the wallpaper dimmed back so the chart stays the focus. -----
  // Nightfall: muted teal up / dusty rose down over Night Drizzle. Quiet, rainy-city calm.
  { id: "nightfall", name: "Nightfall", sub: "Night Drizzle · Muted", skin: "rain",
    set: { candleOn: true, candleUp: "#5fb0a8", candleDown: "#cf8a8f", candleLook: "solid", candleGlow: 0, candlePreset: "custom", lineGlow: 0, scaleText: "#aebccb", scaleGlow: 0, scaleBg: "auto", dim: 0.5 } },
  // Daybreak: a LIGHT look — deep teal up / clay down on Snowfall. Clean and bright (like ChartSkins' light themes).
  { id: "daybreak", name: "Daybreak", sub: "Snowfall · Light", skin: "snow",
    set: { candleOn: true, candleUp: "#2f8f78", candleDown: "#c75d4d", candleLook: "solid", candleGlow: 0, candlePreset: "custom", lineGlow: 0, scaleText: "#39404c", scaleGlow: 0, scaleBg: "glass", dim: 0.12 } },
  // Sterling: soft platinum up / slate down on Stardust. Barely-there glow, elegant and understated.
  { id: "sterling", name: "Sterling", sub: "Stardust · Platinum", skin: "nebula",
    set: { candleOn: true, candleUp: "#d7dce4", candleDown: "#7b8392", candleLook: "solid", candleGlow: 0.08, candlePreset: "custom", lineGlow: 0.06, scaleText: "#d7dce4", scaleGlow: 0, scaleBg: "auto", dim: 0.5 } },
  // Firefly: warm amber up / deep moss down on Glowbugs. Cozy and gentle, low glow.
  { id: "firefly", name: "Firefly", sub: "Glowbugs · Amber", skin: "fireflies",
    set: { candleOn: true, candleUp: "#e8b864", candleDown: "#5f7a4e", candleLook: "solid", candleGlow: 0.15, candlePreset: "custom", lineGlow: 0.12, scaleText: "#e8cf9a", scaleGlow: 0.1, scaleBg: "glass", dim: 0.45 } },
  // Harbor: steel-blue up / slate-grey down on Thunderstorm, toned right down. Moody but calm, not flashy.
  { id: "harbor", name: "Harbor", sub: "Thunderstorm · Steel", skin: "storm",
    set: { candleOn: true, candleUp: "#7fa8c9", candleDown: "#566273", candleLook: "solid", candleGlow: 0.1, candlePreset: "custom", lineGlow: 0.08, scaleText: "#b9c6d6", scaleGlow: 0, scaleBg: "auto", dim: 0.5 } },
  // Dune: a loud skin (Retro Sun) deliberately made CALM — warm sand up / terracotta down, low glow. The surprise one.
  { id: "dune", name: "Dune", sub: "Retro Sun · Sand", skin: "synthwave",
    set: { candleOn: true, candleUp: "#e6c391", candleDown: "#c2734e", candleLook: "solid", candleGlow: 0.12, candlePreset: "custom", lineGlow: 0.1, scaleText: "#ecd6b0", scaleGlow: 0.1, scaleBg: "glass", dim: 0.5 } },

  // ----- Glow-in-the-dark / bold crowd-favourite looks. Luminous neon-tube candles, strong glow, dark wallpaper
  // pushed back so the candles light up the chart. Each on its own (previously-unused) wallpaper. -----
  // Glowstick: electric lime up / hot-magenta down, neon tube, max glow. Literal rave glow-in-the-dark.
  { id: "glowstick", name: "Glowstick", sub: "Plasma · Neon tube", skin: "plasma",
    set: { candleOn: true, candleUp: "#b6ff00", candleDown: "#ff1fa5", candleLook: "neon", candleGlow: 0.7, candlePreset: "custom", lineGlow: 0.55, scaleText: "#d6ff6b", scaleGlow: 0.5, scaleBg: "auto", dim: 0.45 } },
  // Blacklight: UV violet up / acid-cyan down — that blacklight-poster glow. Outside-the-box.
  { id: "blacklight", name: "Blacklight", sub: "Circuit · UV glow", skin: "circuit",
    set: { candleOn: true, candleUp: "#9b5cff", candleDown: "#2bf5d0", candleLook: "neon", candleGlow: 0.65, candlePreset: "custom", lineGlow: 0.5, scaleText: "#c6a3ff", scaleGlow: 0.5, scaleBg: "auto", dim: 0.5 } },
  // Vaporwave: pink + cyan on a neon skyline, glowing. The aesthetic people love.
  { id: "vaporwave", name: "Vaporwave", sub: "Skyline · Pink & Cyan", skin: "neoncity",
    set: { candleOn: true, candleUp: "#2ff0ff", candleDown: "#ff4fd0", candleLook: "neon", candleGlow: 0.6, candlePreset: "custom", lineGlow: 0.45, scaleText: "#8ff6ff", scaleGlow: 0.45, scaleBg: "auto", dim: 0.4 } },
  // Molten: glowing lava orange up / deep ember red down on Lava Lamp. Warm, radiant.
  { id: "molten", name: "Molten", sub: "Lava Lamp · Lava glow", skin: "lavalamp",
    set: { candleOn: true, candleUp: "#ffaa1d", candleDown: "#ff2b2b", candleLook: "neon", candleGlow: 0.65, candlePreset: "lava", lineGlow: 0.4, scaleText: "#ffcf7a", scaleGlow: 0.45, scaleBg: "auto", dim: 0.4 } },
  // Warp: icy white up / electric blue down streaking through Lightspeed, glowing. Fast and cool.
  { id: "warp", name: "Warp", sub: "Lightspeed · Ion glow", skin: "hyperspace",
    set: { candleOn: true, candleUp: "#eafcff", candleDown: "#2b8bff", candleLook: "neon", candleGlow: 0.6, candlePreset: "custom", lineGlow: 0.5, scaleText: "#bfe8ff", scaleGlow: 0.5, scaleBg: "auto", dim: 0.35 } },
  // Spectrum: candles cycle through the whole rainbow across the chart (prism), glowing, on Ticker Tape. Wild.
  { id: "spectrum", name: "Spectrum", sub: "Ticker Tape · Rainbow", skin: "tickertape",
    set: { candleOn: true, candleUp: "#00e5ff", candleDown: "#ff00a8", candleLook: "prism", candleGlow: 0.5, candlePreset: "custom", lineGlow: 0.4, scaleText: "", scaleGlow: 0.35, scaleBg: "glass", dim: 0.45 } },
];
let lookGroup = localStorage.getItem("lookGroup") || "All";
const skinQuery = () => ($("skinSearch") ? $("skinSearch").value.trim().toLowerCase() : "");
const matchQ = (...parts) => { const q = skinQuery(); return !q || parts.join(" ").toLowerCase().includes(q); };
function renderQuick() {
  const box = $("quickLooks"); if (!box) return;
  setTimeout(renderHero, 0);
  if ($("lookChips")) { $("lookChips").innerHTML = "";
    for (const g of LOOK_GROUPS) { const b = document.createElement("button"); b.className = "chip" + (g === lookGroup ? " on" : ""); b.textContent = g;
      b.onclick = () => { lookGroup = g; localStorage.setItem("lookGroup", g); renderQuick(); }; $("lookChips").appendChild(b); } }
  box.innerHTML = ""; quickPreviews = [];
  let shown = 0;
  for (const q of QUICK_LOOKS) {
    const grp = groupOf(q);
    if (lookGroup !== "All" && grp !== lookGroup) continue;
    const sk0 = WickedSkins[q.skin]; if (!sk0) continue;
    if (!matchQ(q.name, q.sub, grp, sk0.name)) continue;
    shown++;
    const on = cfg.skin === q.skin && cfg.candleOn && cfg.candleUp === q.set.candleUp && cfg.candleLook === q.set.candleLook;
    const card = document.createElement("button");
    card.className = "card" + (on ? " on" : "");
    const cv = document.createElement("canvas"); cv.width = 160; cv.height = 64;
    const sk = WickedSkins[q.skin].create(cv.getContext("2d")); sk.resize(160, 64); quickPreviews.push(watchPreview({ skin: sk, t: 0 }, cv));
    card.append(cv);
    card.insertAdjacentHTML("beforeend", `<div class="bars">${bars(q.set.candleUp, q.set.candleDown)}</div><div class="label"><span>${esc(q.name)}<small>${esc(q.sub)}</small></span></div>`);
    card.onclick = () => applyWithUndo($("keepBg") && $("keepBg").checked ? { enabled: true, ...q.set } : { enabled: true, skin: q.skin, ...q.set },
      $("keepBg") && $("keepBg").checked ? `Applied ${q.name} (kept your wallpaper).` : `Applied ${q.name}.`);
    box.appendChild(card);
  }
  updateEmpty(shown);
}
function updateEmpty(n) { if ($("skinEmpty")) $("skinEmpty").hidden = n > 0 || !skinQuery(); }
// Looks / Wallpapers switch + search (remembered)
let skinView = localStorage.getItem("skinView") || "looks";
function syncSkinView() {
  if (!$("skinView")) return;
  seg("skinView", [["looks", "Looks"], ["walls", "Wallpapers"], ["mine", "My uploads"]], () => skinView, (v) => { skinView = v; localStorage.setItem("skinView", v); syncSkinView(); });
  $("viewLooks").hidden = skinView !== "looks"; $("viewWalls").hidden = skinView !== "walls"; $("tab-media").hidden = skinView !== "mine";
  if ($("skinSearch")) $("skinSearch").hidden = skinView === "mine";
  if (skinView === "mine") return renderMedia();
  if (skinView === "looks") renderQuick(); else renderSkins();
}
// "Use your own wallpaper" links (Wallpapers view, Workshop): open Skins › My uploads
document.querySelectorAll("[data-goto-mine]").forEach((b) => b.addEventListener("click", () => {
  skinView = "mine"; localStorage.setItem("skinView", "mine");
  const t = document.querySelector('#nav button[data-tab="skins"]'); if (t) t.click();
  syncSkinView();
}));
if ($("skinSearch")) $("skinSearch").oninput = () => (skinView === "looks" ? renderQuick() : renderSkins());
if ($("keepBg")) { $("keepBg").checked = localStorage.getItem("keepBg") === "1"; $("keepBg").onchange = (e) => localStorage.setItem("keepBg", e.target.checked ? "1" : "0"); }

// ---------- remember which sections are open ----------
document.querySelectorAll("details.grp").forEach((d) => {
  const k = "grp:" + d.dataset.grp, v = localStorage.getItem(k);
  if (v !== null) d.open = v === "1";
  d.addEventListener("toggle", () => localStorage.setItem(k, d.open ? "1" : "0"));
});
// the candle switch lives inside a <summary>; don't let clicking it fold the section
document.querySelectorAll("summary .switch").forEach((sw) => sw.addEventListener("click", (e) => e.stopPropagation()));

// ---------- my media ----------
// Extension: files are stored as Blobs in IndexedDB (src/mediadb.js) and played by player/player.html,
// so big videos are fine. Desktop app (no chrome.runtime): falls back to data URLs, 50 MB each.
const EXT_MODE = !!(chrome.runtime && chrome.runtime.id);

// Desktop app only: a status card like ChartSkins — "Open TradingView with skins" / "Close". The app no longer
// pops a chart open by itself; you open it from here.
const DESK = window.wickedStore && window.wickedStore.tv;
function renderDesk(open) {
  if (!DESK) return;
  $("deskCard").hidden = false;
  $("deskTitle").textContent = open ? "TradingView is open — skins are on" : "TradingView is closed";
  $("deskHint").textContent = open ? `Your look is live on the chart. ${/Mac/.test(navigator.platform) ? "\u2318" : "Ctrl+"}T opens another chart tab, and ${/Mac/.test(navigator.platform) ? "\u2318," : "Ctrl+,"} brings you back here.` : "Your real TradingView, with your look. Sign in once in that window and your layouts, alerts and broker come with you.";
  const btn = $("deskBtn");
  btn.textContent = open ? "Show chart" : "Open TradingView";
  btn.onclick = () => (open ? DESK.open() : DESK.open());   // both focus/open; close is via the chart window
}
function deskCard() {
  if (!DESK) { const c = $("deskCard"); if (c) c.hidden = true; return; }
  DESK.state().then((s) => renderDesk(!!(s && s.open)));
  DESK.onState((s) => renderDesk(!!(s && s.open)));
}
const IS_TAB = new URLSearchParams(location.search).has("page");
const MAX_FILE_MB = EXT_MODE ? 2048 : MAX_MB;
const converting = {}; // id -> progress 0..1

function renderMedia() {
  const box = $("mediaCards"); box.innerHTML = "";
  cfg.media.forEach((m) => {
    const card = document.createElement("div");
    card.className = "card" + (currentSrc() === "media:" + m.id ? " on" : "");
    if (m.thumb || m.pending) {
      const img = document.createElement("img");
      if (m.thumb) img.src = m.thumb; else img.alt = "";
      card.append(img);
    } else {
      const el = document.createElement(m.type === "video" ? "video" : "img");
      el.src = m.src;
      if (m.type === "video") Object.assign(el, { muted: true, loop: true, autoplay: true });
      card.append(el);
    }
    const badge = m.pending ? `<span class="live">${converting[m.id] !== undefined ? "CONVERTING " + Math.round(converting[m.id] * 100) + "%" : "WAITING TO CONVERT"}</span>`
      : m.type === "video" ? '<span class="live">● VIDEO</span>' : "";
    card.insertAdjacentHTML("beforeend", `${badge}<div class="label"><span>${esc(m.name)}</span><button class="x" title="Remove">${ICON_X}</button></div>`);
    card.onclick = (e) => {
      if (e.target.classList.contains("x")) {
        const media = cfg.media.filter((x) => x.id !== m.id);
        const wasActive = cfg.skin === "media" && cfg.mediaId === m.id;
        if (m.file && window.WickedMediaDB) WickedMediaDB.del(m.id).catch(() => {});
        const chartSkins = Object.fromEntries(Object.entries(cfg.chartSkins || {}).filter(([, v]) => v !== "media:" + m.id));
        set(wasActive ? { media, chartSkins, skin: "aurora", mediaId: null } : { media, chartSkins });
      } else if (!m.pending) return pickSource("media:" + m.id);
      renderMedia(); renderSkins(); syncTune();
    };
    box.appendChild(card);
  });
}

const IMAGE_EXT = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", jfif: "image/jpeg", pjpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", apng: "image/apng", bmp: "image/bmp",
  ico: "image/x-icon", svg: "image/svg+xml" };
// Any of these is accepted. Ones the browser can't play are converted to WebM on your computer.
const VIDEO_EXT = new Set(["mp4", "m4v", "mov", "qt", "webm", "mkv", "avi", "wmv", "asf", "flv", "f4v", "mpg", "mpeg",
  "mpe", "m2v", "ts", "mts", "m2ts", "3gp", "3g2", "ogv", "ogg", "hevc", "h264", "264", "h265", "265", "vob", "divx",
  "xvid", "rm", "rmvb", "mxf", "dv", "y4m", "gifv"]);
const UNSUPPORTED = { heic: "HEIC (iPhone photo): export it as JPG or PNG first",
  heif: "HEIF: export it as JPG or PNG first", tif: "TIFF: convert it to PNG first", tiff: "TIFF: convert it to PNG first",
  psd: "PSD: export it as PNG first" };

function classify(f) {
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  if (UNSUPPORTED[ext]) return { err: UNSUPPORTED[ext] };
  if (f.type.startsWith("video/") || VIDEO_EXT.has(ext)) return { type: "video" };
  if (f.type.startsWith("image/") || IMAGE_EXT[ext]) return { type: "image", mime: f.type || IMAGE_EXT[ext] };
  return { err: "not an image or video file" };
}

// Load it for real; for videos also grab a small thumbnail frame.
function probe(type, url) {
  return new Promise((ok) => {
    const el = document.createElement(type === "video" ? "video" : "img");
    let t;
    const done = (v) => { clearTimeout(t); ok(v); };
    t = setTimeout(() => done(null), 10000);
    const thumbOf = (src, w, h) => {
      try {
        const c = document.createElement("canvas"); c.width = 192; c.height = 108;
        const g = c.getContext("2d"), s = Math.max(192 / w, 108 / h);
        g.drawImage(src, (192 - w * s) / 2, (108 - h * s) / 2, w * s, h * s);
        return c.toDataURL("image/jpeg", 0.7);
      } catch { return null; }
    };
    if (type === "video") {
      Object.assign(el, { muted: true, preload: "auto", playsInline: true });
      el.onloadeddata = () => { if (!el.videoWidth) return done(null); el.currentTime = Math.min(1, (el.duration || 2) / 3); };
      el.onseeked = () => done({ thumb: thumbOf(el, el.videoWidth, el.videoHeight) });
    } else el.onload = () => done(el.naturalWidth ? { thumb: thumbOf(el, el.naturalWidth, el.naturalHeight) } : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

const readAsDataURL = (f, mime) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(mime ? r.result.replace(/^data:[^;,]*/, "data:" + mime) : r.result);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

const hint = (t) => { $("mediaHint").textContent = t; };
const saveMedia = (media, extra = {}) => set({ media, ...extra });

async function addFiles(files) {
  const problems = []; let added = 0, needConvert = 0, lastId = null;
  hint("Checking files…");
  for (const f of files) {
    const c = classify(f);
    if (c.err) { problems.push(`${f.name}: ${c.err}`); continue; }
    if (f.size > MAX_FILE_MB * 1024 * 1024) { problems.push(`${f.name}: over ${MAX_FILE_MB >= 1024 ? MAX_FILE_MB / 1024 + " GB" : MAX_FILE_MB + " MB"}`); continue; }
    const name = f.name;
    const id = uid();

    if (!EXT_MODE) { // desktop app fallback
      const src = await readAsDataURL(f, c.mime);
      const p = await probe(c.type, src);
      if (!p) { problems.push(`${f.name}: can't play in the desktop app yet (try MP4 H.264 or WebM)`); continue; }
      cfg.media = [...cfg.media, { id, name, type: c.type, src }]; lastId = id; added++;
      continue;
    }

    const url = URL.createObjectURL(f);
    const p = await probe(c.type, url);
    URL.revokeObjectURL(url);
    if (p) {
      await WickedMediaDB.put(id, f);
      cfg.media = [...cfg.media, { id, name, type: c.type, file: true, thumb: p.thumb, size: f.size }];
      lastId = id; added++;
    } else if (c.type === "video") {
      await WickedMediaDB.put(id + ":src", f); // original kept until converted
      cfg.media = [...cfg.media, { id, name, type: "video", file: true, pending: true, origName: f.name, size: f.size }];
      needConvert++;
    } else problems.push(`${f.name}: this image's format can't be shown in the browser`);
  }
  saveMedia(cfg.media, lastId ? { skin: "media", mediaId: lastId } : {});
  renderMedia(); renderSkins();
  const parts = [];
  if (added) parts.push(`Added ${added} file${added > 1 ? "s" : ""}.`);
  if (needConvert) parts.push(`${needConvert} video${needConvert > 1 ? "s" : ""} need converting…`);
  if (problems.length) parts.push("Skipped " + problems.join(" · "));
  hint(parts.join(" ") || "Files stay on your computer.");
  if (needConvert) {
    if (IS_TAB) convertPending();
    else chrome.tabs.create({ url: chrome.runtime.getURL("popup/popup.html?page=media") }); // keep converting even if the popup closes
  }
}

// ---------- video converter (ffmpeg.wasm, runs locally, loaded only when needed) ----------
let ffmpegP;
function getFFmpeg() {
  if (ffmpegP) return ffmpegP;
  // ESM build: ffmpeg.wasm 0.12 runs in a module worker, which needs the ESM core.
  const base = chrome.runtime.getURL("vendor/ffmpeg/");
  ffmpegP = import(base + "esm/index.js").then(async ({ FFmpeg }) => {
    const ff = new FFmpeg();
    await ff.load({ coreURL: base + "ffmpeg-core.js", wasmURL: base + "ffmpeg-core.wasm" });
    return ff;
  }).catch((e) => { ffmpegP = null; throw e; });
  return ffmpegP;
}

let convertBusy = false;
async function convertPending() {
  if (convertBusy || !EXT_MODE) return;
  convertBusy = true;
  try {
    for (;;) {
      const m = cfg.media.find((x) => x.pending);
      if (!m) break;
      converting[m.id] = 0; renderMedia();
      hint(`Converting ${m.origName} to a format the browser can play… keep this tab open.`);
      try {
        const src = await WickedMediaDB.get(m.id + ":src");
        if (!src) throw new Error("original file missing");
        const ff = await getFFmpeg();
        const onProg = ({ progress }) => { converting[m.id] = Math.max(0, Math.min(1, progress || 0)); renderMedia(); };
        ff.on("progress", onProg);
        const inName = "in." + ((m.origName.split(".").pop() || "bin").toLowerCase());
        await ff.writeFile(inName, new Uint8Array(await src.arrayBuffer()));
        // Wallpaper-friendly: no audio, max 1920px wide, 30 fps, fast VP8 WebM, first 3 minutes.
        const code = await ff.exec(["-i", inName, "-t", "180", "-an", "-vf", "scale='min(1920,iw)':-2,fps=30",
          "-c:v", "libvpx", "-b:v", "4M", "-deadline", "realtime", "-cpu-used", "8", "-pix_fmt", "yuv420p", "out.webm"]);
        ff.off("progress", onProg);
        if (code !== 0) throw new Error("ffmpeg could not read this video");
        const data = await ff.readFile("out.webm");
        await ff.deleteFile(inName).catch(() => {}); await ff.deleteFile("out.webm").catch(() => {});
        const blob = new Blob([data.buffer], { type: "video/webm" });
        const url = URL.createObjectURL(blob); const p = await probe("video", url); URL.revokeObjectURL(url);
        if (!p) throw new Error("converted video still won't play");
        await WickedMediaDB.put(m.id, blob);
        await WickedMediaDB.del(m.id + ":src");
        delete converting[m.id];
        cfg.media = cfg.media.map((x) => (x.id === m.id ? { id: x.id, name: x.name, type: "video", file: true, thumb: p.thumb, size: blob.size, converted: true } : x));
        saveMedia(cfg.media, { skin: "media", mediaId: m.id });
        hint(`Converted ${m.origName}. It's on your chart now.`);
      } catch (e) {
        delete converting[m.id];
        await WickedMediaDB.del(m.id + ":src").catch(() => {});
        cfg.media = cfg.media.filter((x) => x.id !== m.id);
        saveMedia(cfg.media);
        hint(`Couldn't convert ${m.origName}: ${e.message || e}.`);
      }
      renderMedia(); renderSkins();
    }
  } finally { convertBusy = false; }
}

// In the popup, picking files opens the full-tab manager: Chrome can close the popup when a file
// dialog opens, and long conversions need a page that stays open.
$("addMedia").addEventListener("click", (e) => {
  if (EXT_MODE && !IS_TAB) { e.preventDefault(); chrome.tabs.create({ url: chrome.runtime.getURL("popup/popup.html?page=media&pick=1") }); }
});
$("file").onchange = async (e) => { await addFiles([...e.target.files]); e.target.value = ""; };

// Drag & drop anywhere on the Uploads tab
const mediaTab = $("tab-media");
mediaTab.addEventListener("dragover", (e) => { e.preventDefault(); mediaTab.classList.add("drop"); });
mediaTab.addEventListener("dragleave", () => mediaTab.classList.remove("drop"));
mediaTab.addEventListener("drop", (e) => { e.preventDefault(); mediaTab.classList.remove("drop"); addFiles([...e.dataTransfer.files]); });

// ---------- workshop: community wallpapers ----------
let wsSort = "popular", wsPage = 0, wsItems = [], wsKind = localStorage.getItem("wsKind") || "looks";
const W = () => window.Workshop;

// The extension Workshop is browse + use only — no account. Sharing/liking/reporting and admin review all live
// on the website (login there), which avoids a sign-in wall and the free-tier email limits inside the popup.
const WS_SITE = () => (window.WORKSHOP_CONFIG && window.WORKSHOP_CONFIG.siteUrl) || "https://arcuto29.github.io/wicked-skins/";
function wsTabs() {
  seg("wsKind", [["looks", "Community looks"], ["walls", "Wallpapers"]], () => wsKind, (v) => { wsKind = v; localStorage.setItem("wsKind", v); wsSort = "popular"; wsLoad(true); });
  $("wsSubmit").hidden = wsKind !== "walls"; $("wsShareLook").hidden = wsKind !== "looks";
  const box = $("wsTabs"); box.innerHTML = "";
  for (const [k, label] of [["popular", wsKind === "looks" ? "Top" : "Popular"], ["new", "New"], ...(wsKind === "looks" ? [["mine", "Mine"]] : [])]) {
    const b = document.createElement("button"); b.className = "chip" + (k === wsSort ? " on" : ""); b.textContent = label;
    b.onclick = () => { wsSort = k; wsLoad(true); };
    box.appendChild(b);
  }
}
async function wsLoad(reset) {
  if (!W() || !W().configured) return;
  if (reset) { wsPage = 0; wsItems = []; }
  wsTabs();
  $("wsMsg").textContent = "Loading…";
  if (wsKind === "looks") return wsLoadLooks(reset);
  try {
    const rows = await W().list(wsSort, wsPage);
    wsItems = reset ? rows : [...wsItems, ...rows];
    $("wsMore").hidden = rows.length < 24;
    $("wsMsg").textContent = wsItems.length ? "" : "No approved wallpapers yet. Shared one? It shows here once it's approved: on the website, check \u201cMy uploads\u201d (moderators approve under Review).";
  } catch (e) { $("wsMsg").textContent = "Couldn't load the Workshop: " + e.message; }
  wsRender();
}
// ---------- community looks ----------
// A look is settings only (built-in wallpaper + styling), so the card preview is drawn live from the data itself.
const LOOK_SAFE = new Set(LOOK_KEYS);
const cleanLook = (data) => Object.fromEntries(Object.entries(data || {}).filter(([k, v]) => LOOK_SAFE.has(k) && (v === null || ["string", "number", "boolean"].includes(typeof v) || (typeof v === "object" && JSON.stringify(v).length < 2000))));
const myShared = () => { try { return JSON.parse(localStorage.getItem("myLooks") || "[]"); } catch { return []; } };
let wsLooks = [];
async function wsLoadLooks(reset) {
  try {
    let rows;
    if (wsSort === "mine") {
      const mine = myShared();
      rows = mine.length ? (await W().listLooks("new", 0)).filter((r) => mine.some((m) => m.t === r.title && m.s === r.skin)) : [];
      $("wsMsg").textContent = rows.length ? "" : mine.length ? `You've shared ${mine.length} look${mine.length === 1 ? "" : "s"}. They appear here once approved (moderators approve them on the website under Review).` : "Looks you share appear here once they're approved. Tap \u201cShare my current look\u201d to share one.";
    } else {
      rows = await W().listLooks(wsSort === "new" ? "new" : "top", wsPage);
      $("wsMsg").textContent = "";
    }
    wsLooks = reset ? rows : [...wsLooks, ...rows];
    $("wsMore").hidden = wsSort === "mine" || rows.length < 24;
    if (!wsLooks.length && wsSort !== "mine") $("wsMsg").textContent = "No community looks yet. Be the first: tap \u201cShare my current look\u201d.";
  } catch (e) {
    // the backend hasn't been set up for looks yet (WORKSHOP.md: re-run supabase/schema.sql): say so plainly
    const notReady = /looks|relation|schema cache|404|not find/i.test(String(e && e.message));
    $("wsMsg").textContent = notReady ? "Community looks are coming soon. Wallpapers already work: switch to Wallpapers above." : "Couldn't load community looks right now. Check your connection and try again.";
    if (notReady) $("wsShareLook").hidden = true;
  }
  wsRenderLooks();
}
function wsRenderLooks() {
  const box = $("wsCards"); box.innerHTML = ""; lookPreviews.length = 0;
  for (const it of wsLooks) {
    if (!WickedSkins[it.skin]) continue;
    const d = cleanLook(it.data), card = document.createElement("button"); card.className = "card wslook";
    const cv = document.createElement("canvas"); cv.width = 160; cv.height = 64;
    const sk = WickedSkins[it.skin].create(cv.getContext("2d")); sk.resize(160, 64); lookPreviews.push(watchPreview({ skin: sk, t: 0 }, cv));
    card.append(cv);
    const up = d.candleUp || "#26a69a", down = d.candleDown || "#ef5350";
    card.insertAdjacentHTML("beforeend", `<div class="bars">${bars(up, down)}</div><span class="oncount">${it.uses} ON</span>
      <div class="label"><span>${esc(it.title)}<small>by ${esc(it.author || "trader")} · ${esc(WickedSkins[it.skin].name)}</small></span></div>`);
    card.onclick = () => {
      applyWithUndo({ ...d, enabled: true, skin: it.skin }, `Applied \u201c${it.title}\u201d by ${it.author || "trader"}.`);
      const used = new Set(JSON.parse(localStorage.getItem("usedLooks") || "[]"));
      if (!used.has(it.id)) { used.add(it.id); localStorage.setItem("usedLooks", JSON.stringify([...used].slice(-500))); W().countLookUse(it.id); }   // count each person once
    };
    box.appendChild(card);
  }
}
// Share: the website (signed in there) receives your look as a code and posts it for review.
function shareLook() {
  const name = (($("loName") && $("loName").value.trim()) || (WickedSkins[cfg.skin] ? WickedSkins[cfg.skin].name : "My look")).slice(0, 40);
  const code = makeLookCode(name);
  const skin = cfg.skin === "media" ? "aurora" : cfg.skin, a = myShared();
  if (!a.some((m) => m.t === name && m.s === skin)) localStorage.setItem("myLooks", JSON.stringify([...a, { t: name, s: skin }].slice(-100)));
  const u = WS_SITE() + "workshop.html#look=" + encodeURIComponent(code);
  if (window.PriismNative && window.PriismNative.openUrl) window.PriismNative.openUrl(u);          // Android app
  else if (chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url: u });                       // extension
  else window.open(u, "_blank");                                                                      // desktop app -> your browser
  if (cfg.skin === "media") toast("Your own upload can't be shared in a look, so it uses a built-in wallpaper instead.");
}
if ($("wsShareLook")) $("wsShareLook").onclick = shareLook;
if ($("loShare")) $("loShare").onclick = shareLook;
function wsRender() {
  if (wsKind === "looks") return wsRenderLooks();
  const box = $("wsCards"); box.innerHTML = "";
  for (const it of wsItems) {
    const card = document.createElement("div"); card.className = "card ws";
    const sub = `${it.likes} like${it.likes === 1 ? "" : "s"} · ${it.uses} use${it.uses === 1 ? "" : "s"}`;
    card.innerHTML = `<img alt="" loading="lazy" src="${esc(it.thumbUrl || "")}"><span class="live">${it.kind === "video" ? "● VIDEO" : "IMAGE"}</span>
      <div class="label"><span>${esc(it.title)}<small>${esc(sub)}</small></span></div><div class="acts"></div>`;
    const acts = card.querySelector(".acts");
    const btn = (label, fn, cls) => { const b = document.createElement("button"); b.textContent = label; if (cls) b.className = cls; b.onclick = (e) => { e.stopPropagation(); fn(b); }; acts.appendChild(b); return b; };
    btn("Use", () => wsUse(it), "primary");
    card.onclick = () => wsUse(it);
    box.appendChild(card);
  }
}
// "Use": download into your Uploads and put it on the chart. No account needed.
async function wsUse(it) {
  toast(`Downloading “${it.title}”…`);
  try {
    const blob = await W().fetchFile(it);
    const ext = (blob.type.split("/")[1] || "").replace("jpeg", "jpg");
    await addFiles([new File([blob], `${it.title}.${ext || (it.kind === "video" ? "webm" : "png")}`, { type: blob.type })]);
    toast(`“${it.title}” is on your chart and in My uploads (Skins tab).`);
  } catch (e) { toast("Couldn't use it: " + e.message); }
}
$("wsMore").onclick = () => { wsPage++; wsLoad(false); };

function initWorkshop() {
  const on = !!(window.Workshop && Workshop.configured);
  $("wsOff").hidden = on; $("wsOn").hidden = !on;
  // Not connected to a backend yet (see WORKSHOP.md): hide the tab entirely instead of showing an empty one.
  document.querySelector('#nav [data-tab="workshop"]').hidden = !on;
  if (!on) return;
  $("wsSubmit").href = WS_SITE() + "workshop.html#submit";
  $("wsReportLink").href = WS_SITE() + "workshop.html";
  // Load fresh every time you open the tab (at most every 15 s), so something just approved shows up without
  // closing the panel; the desktop settings window stays open for hours.
  let loadedAt = 0;
  document.querySelector('#nav [data-tab="workshop"]').addEventListener("click", () => { if (Date.now() - loadedAt > 15000) { loadedAt = Date.now(); wsLoad(true); } });
}

// ---------- saved looks ----------
const snapshot = () => Object.fromEntries(LOOK_KEYS.map((k) => [k, cfg[k]]));
const lookPreviews = [];
const sameLook = (lo) => lo.skin === cfg.skin && (lo.skin !== "media" || lo.mediaId === cfg.mediaId) &&
  ["candleOn", "candleUp", "candleDown", "candleLook", "lineGlow", "dim"].every((k) => JSON.stringify(lo.look[k]) === JSON.stringify(cfg[k]));
function describe(lo) {
  const sk = lo.skin === "media" ? (cfg.media.find((m) => m.id === lo.mediaId)?.name || "Upload") : (WickedSkins[lo.skin]?.name || lo.skin);
  const preset = lo.look.candleOn ? (CANDLE_PRESETS.find(([, , u, d]) => u === lo.look.candleUp && d === lo.look.candleDown)?.[1] || "Custom colours") : "Chart colours";
  const lm = window.__bdCandleLooks && window.__bdCandleLooks.META[lo.look.candleLook];
  const style = lo.look.candleLook && lo.look.candleLook !== "solid" && lm ? " · " + lm.name : "";
  return `${sk} · ${preset}${style}`;
}
function applyLook(lo) {
  const hasMedia = lo.skin !== "media" || cfg.media.some((m) => m.id === lo.mediaId);
  applyWithUndo({ ...lo.look, enabled: true, skin: hasMedia ? lo.skin : cfg.skin, mediaId: hasMedia ? lo.mediaId : cfg.mediaId },
    hasMedia ? `Applied “${lo.name}”.` : `Applied “${lo.name}” (its upload is gone, kept your current wallpaper).`);
  renderLoadouts();
}
function download(name, data) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = name; a.click();
}
// uploads (your own files) aren't put in shared files: size + they're yours
const exportable = (lo) => ({ name: lo.name, skin: lo.skin === "media" ? "aurora" : lo.skin, look: lo.look });

// ---------- Look Codes: a short, pasteable text version of a whole look (skin + candles + glow + scale + brackets).
// Share it in chat and a friend pastes it to get your exact vibe. Uploaded wallpapers can't travel in a code, so
// a code made on an upload falls back to a built-in skin; everything else (colours/glow/scale/brackets) carries. ----
const LOOK_CODE_PREFIX = "PRIISM1-";
// url-safe base64 of a UTF-8 JSON string
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str); let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const bin = atob(s), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function makeLookCode(name) {
  // skip uploads; store the built-in skin (or aurora as a safe default) + only the keys that differ from defaults
  const skin = cfg.skin === "media" ? "aurora" : cfg.skin;
  const look = {};
  for (const k of LOOK_KEYS) if (JSON.stringify(cfg[k]) !== JSON.stringify(DEFAULTS[k])) look[k] = cfg[k];
  const payload = { v: 1, n: (name || "").slice(0, 40), s: skin, l: look };
  return LOOK_CODE_PREFIX + b64urlEncode(JSON.stringify(payload));
}
const lookLink = (code) => WS_SITE() + "look.html#" + code;
function parseLookCode(code) {
  const m = String(code || "").match(/PRIISM1-[A-Za-z0-9_-]+/);    // a share link or a bare code
  const raw = m ? m[0] : "";
  if (!raw.startsWith(LOOK_CODE_PREFIX)) return null;
  try {
    const p = JSON.parse(b64urlDecode(raw.slice(LOOK_CODE_PREFIX.length)));
    if (!p || p.v !== 1 || !WickedSkins[p.s]) return null;
    const look = Object.fromEntries(LOOK_KEYS.filter((k) => p.l && k in p.l).map((k) => [k, p.l[k]]));
    return { name: typeof p.n === "string" ? p.n.slice(0, 40) : "", skin: p.s, look };
  } catch { return null; }
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch { try { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return true; } catch { return false; } }
}

function renderLoadouts() {
  const box = $("loCards"); box.innerHTML = ""; lookPreviews.length = 0;
  $("loEmpty").hidden = cfg.loadouts.length > 0;
  cfg.loadouts.forEach((lo) => {
    const card = document.createElement("div");
    card.className = "card look" + (sameLook(lo) ? " on" : "");
    // preview: the look's skin (live) or upload thumbnail, with its candle colours on top
    const media = lo.skin === "media" && cfg.media.find((m) => m.id === lo.mediaId);
    if (media && media.thumb) { const im = document.createElement("img"); im.src = media.thumb; card.append(im); }
    else {
      const cv = document.createElement("canvas"); cv.width = 160; cv.height = 64;
      const def = WickedSkins[lo.skin] || WickedSkins.aurora; const sk = def.create(cv.getContext("2d")); sk.resize(160, 64);
      lookPreviews.push({ skin: sk, t: 0 }); card.append(cv);
    }
    if (lo.look.candleOn) card.insertAdjacentHTML("beforeend", `<div class="bars">${bars(lo.look.candleUp, lo.look.candleDown)}</div>`);
    card.insertAdjacentHTML("beforeend", `<div class="label"><span class="nm">${esc(lo.name)}<small>${esc(describe(lo))}</small></span></div>
      <div class="acts">
        <button data-a="update" title="Save your current setup into this look">Update</button>
        <button data-a="rename" title="Rename">Rename</button>
        <button data-a="share" title="Save this look as a file to share">Share</button>
        <button data-a="del" class="x" title="Delete">${ICON_X}</button>
      </div>`);
    card.onclick = (e) => {
      const act = e.target.closest("[data-a]")?.dataset.a;
      if (!act) return applyLook(lo);
      e.stopPropagation();
      if (act === "del") {
        const before = cfg.loadouts;
        set({ loadouts: cfg.loadouts.filter((x) => x.id !== lo.id) }); renderLoadouts();
        toast(`Deleted “${lo.name}”.`, () => { set({ loadouts: before }); renderLoadouts(); });
      } else if (act === "update") {
        set({ loadouts: cfg.loadouts.map((x) => (x.id === lo.id ? { ...x, skin: cfg.skin, mediaId: cfg.mediaId, look: snapshot() } : x)) });
        renderLoadouts(); hintToast(`Updated “${lo.name}” with your current setup.`);
      } else if (act === "rename") {
        const span = card.querySelector(".nm");
        span.innerHTML = `<input class="field" maxlength="40" value="${esc(lo.name)}" />`;
        const inp = span.querySelector("input"); inp.focus(); inp.select();
        const done = () => { const v = inp.value.trim(); if (v && v !== lo.name) set({ loadouts: cfg.loadouts.map((x) => (x.id === lo.id ? { ...x, name: v } : x)) }); renderLoadouts(); };
        inp.onkeydown = (k) => { if (k.key === "Enter") done(); if (k.key === "Escape") renderLoadouts(); };
        inp.onblur = done; inp.onclick = (k) => k.stopPropagation();
      } else if (act === "share") {
        download(`${lo.name.replace(/[^\w-]+/g, "-").toLowerCase() || "look"}.priism.json`, [exportable(lo)]);
      }
    };
    box.appendChild(card);
  });
}
const hintToast = (msg) => toast(msg);
const saveLook = () => {
  const name = $("loName").value.trim() || `Look ${cfg.loadouts.length + 1}`;
  set({ loadouts: [{ id: uid(), name, skin: cfg.skin, mediaId: cfg.mediaId, look: snapshot() }, ...cfg.loadouts] });
  $("loName").value = ""; renderLoadouts(); hintToast(`Saved “${name}”.`);
};
$("loSave").onclick = saveLook;
$("loName").onkeydown = (e) => { if (e.key === "Enter") saveLook(); };
$("loExport").onclick = () => download("priism-skins-looks.json", cfg.loadouts.map(exportable));
$("loImport").onchange = async (e) => {
  try {
    const arr = JSON.parse(await e.target.files[0].text());
    const clean = (Array.isArray(arr) ? arr : [arr]).filter((x) => x && typeof x.name === "string" && WickedSkins[x.skin]).map((x) => ({
      id: uid(), name: x.name.slice(0, 40), skin: x.skin, mediaId: null,
      look: Object.fromEntries(LOOK_KEYS.filter((k) => x.look && k in x.look).map((k) => [k, x.look[k]])),
    }));
    if (!clean.length) throw 0;
    set({ loadouts: [...clean, ...cfg.loadouts] }); renderLoadouts(); hintToast(`Imported ${clean.length} look${clean.length > 1 ? "s" : ""}.`);
  } catch { hintToast("That file isn't a saved-looks file."); }
  e.target.value = "";
};

// ---------- look codes (copy / paste a short code of the whole look) ----------
const codeMsg = (t, ok) => { const el = $("codeMsg"); if (!el) return; el.style.display = ""; el.textContent = t; el.style.color = ok === false ? "#ff8a8a" : ""; };
if ($("codeCopy")) $("codeCopy").onclick = async () => {
  const link = lookLink(makeLookCode(($("loName") && $("loName").value.trim()) || ""));
  const done = await copyText(link);
  if ($("codeInput")) $("codeInput").value = link;
  codeMsg(done ? "Link copied! Paste it anywhere to share your look." : "Couldn't copy: select the link above and copy it.", done);
};
if ($("codeApply")) {
  const apply = () => {
    const parsed = parseLookCode($("codeInput").value);
    if (!parsed) return codeMsg("That isn't a Priism share link or look code.", false);
    applyWithUndo({ ...parsed.look, enabled: true, skin: parsed.skin },
      parsed.name ? `Applied look code “${parsed.name}”.` : "Applied look code.");
    codeMsg("Applied! (Use the Undo in the toast to revert.)", true);
  };
  $("codeApply").onclick = apply;
  $("codeInput").onkeydown = (e) => { if (e.key === "Enter") apply(); };
}

// ---------- snapshot (capture the chart with skin + watermark as a shareable PNG) ----------
if ($("snapBtn")) $("snapBtn").onclick = async () => {
  const msg = $("snapMsg"), prev = $("snapPreview"), img = $("snapImg");
  const show = (t, ok) => { msg.style.display = ""; msg.textContent = t; msg.style.color = ok === false ? "#ff8a8a" : ""; };
  if (DESK && DESK.action) {
    const r = await DESK.action("snapshot");
    return r && r.ok !== false ? show("Snapshot taken in your chart window. Choose where to save it.", true) : show((r && r.reason) || "Open your chart first (Open TradingView with skins).", false);
  }
  if (!EXT_MODE || IS_TAB) return show("Open this on a TradingView chart tab to capture.", false);
  show("Capturing…"); prev.style.display = "none";
  const r = await tabMsgAnyFrame({ ws: "snapshot" });
  if (!r) return show("Couldn't reach the chart. Open your TradingView chart, make sure Priism Skins is on here, then try again.", false);
  if (!r.ok) return show(r.reason || "Couldn't capture the chart.", false);
  img.src = r.url; prev.href = r.url;
  const sym = (await tabMsg({ ws: "symbol" }).catch(() => null)) || {};
  prev.download = `priism-${(sym.symbol || "chart").replace(/[^\w-]+/g, "")}.png`;
  prev.style.display = "";
  show(r.mediaMissed
    ? "Done — click the image to save. (Your uploaded wallpaper couldn't be included because it renders in a protected frame; the chart and watermark are captured.)"
    : "Done — click the image to save or drag it out to share.", true);
};

// ---------- live clip (short animated WebM of the chart + moving wallpaper) ----------
let clipSecs = 10;
// Chart only = we redraw the chart + effects ourselves (fast, no prompts). Whole screen = Chrome's screen share,
// which records exactly what you see (every effect, uploaded wallpapers, the lot) after you pick what to share.
const CLIP_HINTS = {
  chart: "Records an animated clip (WebM) of your chart with the live wallpaper and effects moving, from 2 seconds up to 2 minutes. Click Record, then close this panel if you like: it downloads by itself when it ends. A badge on the chart shows the countdown; click it to stop and save early. Keep the chart tab visible. An uploaded wallpaper can't be read this way; use Whole screen for that.",
  screen: "Records exactly what you see, so every effect and any uploaded wallpaper is in it. After you click Record, a card appears on your chart: click \u201cChoose what to record\u201d and pick Entire Screen (or a window / this tab) in Chrome's box. It records for the length below, then downloads by itself. Stop early with Chrome's \u201cStop sharing\u201d button.",
};
const AUDIO_HINT = {
  mic: "Your voice: Chrome asks once to use your microphone on tradingview.com.",
  computer: "Computer sound (music, videos, alerts): Chrome asks what to share when you record. On Windows pick Entire screen and tick \u201cShare system audio\u201d. On a Mac Chrome can only take a tab's sound, so pick the tab that's playing and keep \u201cShare tab audio\u201d on.",
  both: "Your voice and the computer's sound, mixed. Chrome asks once for the microphone, then what to share: on Windows tick \u201cShare system audio\u201d; on a Mac pick the tab that's playing.",
};
const syncClipMode = () => {
  if ($("clipAudio")) { seg("clipAudio", [["none", "Off"], ["mic", "Voice"], ["computer", "Computer"], ["both", "Both"]], () => cfg.clipAudio || "none", (v) => { set({ clipAudio: v }); syncClipMode(); });
    $("clipAudioHint").hidden = !AUDIO_HINT[cfg.clipAudio]; $("clipAudioHint").textContent = AUDIO_HINT[cfg.clipAudio] || ""; }
  if ($("clipQuality")) seg("clipQuality", [["high", "High"], ["balanced", "Balanced"], ["small", "Small file"]], () => cfg.clipQuality || "balanced", (v) => set({ clipQuality: v }));
  if ($("clipEdit")) seg("clipEdit", [[true, "Crop & trim first"], [false, "Download right away"]], () => cfg.clipEdit !== false, (v) => set({ clipEdit: v }));
  seg("clipFps", [[30, "30 fps"], [60, "60 fps"]], () => (+cfg.clipFps === 60 ? 60 : 30), (v) => { set({ clipFps: v }); syncClipMode(); });
  seg("clipMode", [["chart", "Chart only"], ["screen", "Whole screen"]], () => cfg.clipMode || "chart", (v) => { set({ clipMode: v }); syncClipMode(); });
  if ($("clipHint")) $("clipHint").textContent = CLIP_HINTS[cfg.clipMode === "screen" ? "screen" : "chart"];
  if ($("clipBtn")) $("clipBtn").textContent = cfg.clipMode === "screen" ? "Record screen" : "Record";
};
if ($("clipMode")) syncClipMode();
if ($("clipLen")) seg("clipLen", [[5, "5s"], [10, "10s"], [30, "30s"], [60, "1 min"], [120, "2 min"]], () => clipSecs, (v) => { clipSecs = v; set({ clipLen: v }); if ($("clipCustom")) $("clipCustom").value = ""; });
if ($("clipCustom")) $("clipCustom").addEventListener("input", () => { const c = Math.round(+$("clipCustom").value); if (c >= 2) set({ clipLen: Math.min(120, c) }); });
// a custom length (2-120 s) overrides the preset
const clipLength = () => { const c = Math.round(+($("clipCustom") && $("clipCustom").value)); return c >= 2 ? Math.min(120, c) : clipSecs; };
if ($("clipBtn")) $("clipBtn").onclick = async () => {
  const msg = $("clipMsg"), prev = $("clipPreview"), vid = $("clipVid"), btn = $("clipBtn");
  const show = (t, ok) => { msg.style.display = ""; msg.textContent = t; msg.style.color = ok === false ? "#ff8a8a" : ""; };
  const secs = clipLength();
  if (DESK && DESK.action) {                                   // desktop app: record in the chart window
    set({ clipLen: secs });
    const r = await DESK.action("record");
    if (!r || r.ok === false) return show((r && r.reason) || "Open your chart first (Open TradingView with skins), then record.", false);
    return show(r.stopped ? "Stopped. Your clip is saving." : `Recording on your chart window for ${secs}s. It saves by itself when it ends.`, true);
  }
  if (!EXT_MODE || IS_TAB) return show("Open this on a TradingView chart tab to record.", false);
  if (cfg.clipMode !== "screen" && (cfg.clipAudio === "computer" || cfg.clipAudio === "both")) {
    const r1 = await tabMsgAnyFrame({ ws: "clip", seconds: secs, fps: +cfg.clipFps === 60 ? 60 : 30 });
    if (!r1) return show("Couldn't reach the chart. Open your TradingView chart, make sure Priism Skins is on here, then try again.", false);
    if (!r1.ok) return show(r1.reason || "Couldn't start the recording.", false);
    return show(`Now click \u201cChoose sound\u201d on your chart and pick what to share. It records ${secs}s, then downloads by itself.`, true);
  }
  if (cfg.clipMode === "screen") {
    const r0 = await tabMsgAnyFrame({ ws: "clip", seconds: secs, mode: "screen", fps: +cfg.clipFps === 60 ? 60 : 30 });
    if (!r0) return show("Couldn't reach the chart. Open your TradingView chart, make sure Priism Skins is on here, then try again.", false);
    if (!r0.ok) return show(r0.reason || "Couldn't start the screen recording.", false);
    return show(`Now click \u201cChoose what to record\u201d on your chart and pick what to share. It records ${secs}s, then downloads by itself.`, true);
  }
  prev.style.display = "none"; btn.disabled = true;
  let left = secs; show(`Recording ${secs}s. You can close this panel; the clip downloads by itself when it ends.`);
  const tick = setInterval(() => { left--; }, 1000);
  const r = await tabMsgAnyFrame({ ws: "clip", seconds: secs, fps: +cfg.clipFps === 60 ? 60 : 30 });
  clearInterval(tick); btn.disabled = false;
  if (!r) return show("Couldn't reach the chart. Open your TradingView chart, make sure Priism Skins is on here, then try again.", false);
  if (!r.ok) return show(r.reason || "Couldn't record the clip.", false);
  if (r.saved) {
    const mb = ((r.bytes || 0) / 1048576).toFixed(1);
    return show(`Saved ${r.name} (${mb} MB) to your downloads.` + (r.mediaMissed ? " (Your uploaded wallpaper renders in a protected frame, so it isn't in the clip; the chart + watermark are.)" : ""), true);
  }
  vid.src = r.url; prev.href = r.url;
  const sym = (await tabMsg({ ws: "symbol" }).catch(() => null)) || {};
  prev.download = `priism-${(sym.symbol || "chart").replace(/[^\w-]+/g, "")}.webm`;
  prev.style.display = "";
  const kb = Math.round((r.bytes || 0) / 1024);
  show(r.mediaMissed
    ? `Done (${kb} KB) — click to save. (Your uploaded wallpaper renders in a protected frame, so it's not in the clip; the chart + watermark are.)`
    : `Done (${kb} KB) — click the clip to save, or drag it out to share.`, true);
};

// ---------- daily goal & limit + trade journal (the data lives in chrome.storage.local; the page writes it) ----------
const dayKeyP = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtMoneyP = (v, u) => `${v >= 0 ? "+" : "\u2212"}${u && u.length === 1 ? u : ""}${Math.abs(v).toFixed(2)}${u && u.length > 1 ? " " + u : ""}`;
const fmtDurP = (s) => (s < 90 ? s + "s" : s < 5400 ? Math.round(s / 60) + "m" : (s / 3600).toFixed(1) + "h");
const storeGet = (defaults) => new Promise((res) => { try { chrome.storage.local.get(defaults, res); } catch { res(defaults); } });
// Trading sounds (src/sounds.js): picking Soft or Loud plays the sound once so you know what you'll hear.
const SOUND_LEVELS = [["off", "Off"], ["soft", "Soft"], ["loud", "Loud"]];
const preview = (kind, level) => { try { window.PriismSounds && window.PriismSounds.play(kind, level); } catch {} };
if ($("goalGuard")) $("goalGuard").onchange = (e) => set({ goalGuard: e.target.checked, goalOn: cfg.goalOn || e.target.checked });
function syncGoal() {
  if (!$("goalOn")) return;
  $("goalOn").checked = !!cfg.goalOn;
  if (document.activeElement !== $("goalTarget")) $("goalTarget").value = cfg.goalTarget;
  if (document.activeElement !== $("goalLimit")) $("goalLimit").value = cfg.goalLimit;
  seg("goalPos", [["bl", "Bottom left"], ["tl", "Top left"], ["tc", "Top"]], () => cfg.goalPos || "bl", (v) => set({ goalPos: v }));
  if ($("goalGuard")) $("goalGuard").checked = !!cfg.goalGuard;
  seg("goalSound", SOUND_LEVELS, () => cfg.goalSound || "off", (v) => { set({ goalSound: v }); preview("goal", v); });
  storeGet({ dayPnl: null }).then((s) => {
    const d = s.dayPnl && s.dayPnl.date === dayKeyP() ? s.dayPnl : null;
    $("goalToday").textContent = d ? `${fmtMoneyP(d.realized, d.unit)} \u00B7 ${d.trades} closed trade${d.trades === 1 ? "" : "s"}` : "no closed trades yet";
  });
}
if ($("goalOn")) {
  $("goalOn").onchange = (e) => set({ goalOn: e.target.checked });
  $("goalTarget").oninput = (e) => set({ goalTarget: Math.max(0, +e.target.value || 0) });
  $("goalLimit").oninput = (e) => set({ goalLimit: Math.max(0, +e.target.value || 0) });
  $("goalReset").onclick = () => { try { chrome.storage.local.remove("dayPnl", syncGoal); } catch {} hintToast("Today's total was reset."); };
}
function renderJournal() {
  const box = $("journalList"); if (!box) return;
  $("journalOn").checked = !!cfg.journalOn;
  storeGet({ journal: [] }).then((s) => {
    const list = Array.isArray(s.journal) ? s.journal : [];
    box.innerHTML = ""; $("journalEmpty").hidden = list.length > 0; $("journalClear").hidden = list.length === 0;
    for (const e of list) {
      const row = document.createElement("div"); row.className = "jrow";
      const when = new Date(e.t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      if (e.img) {
        const a = document.createElement("a"), im = document.createElement("img");
        im.src = e.img; im.alt = "trade"; a.href = e.img; a.title = "Click to save the picture";
        a.download = `trade-${(e.sym || "chart").replace(/[^\w-]+/g, "")}-${new Date(e.t).toISOString().slice(0, 16).replace(/[:T]/g, "-")}.jpg`;
        a.append(im); row.append(a);
      }
      const meta = document.createElement("div"); meta.className = "jmeta";
      meta.innerHTML = `<b>${esc(e.sym || "Trade")}</b> <span class="${e.v >= 0 ? "jup" : "jdn"}">${esc(cfg.privacy && cfg.privacyPnl !== "show" ? "\u2022\u2022\u2022\u2022\u2022" : fmtMoneyP(e.v, e.unit))}</span><small>${esc(when)} \u00B7 held ${fmtDurP(e.secs || 0)}</small>`;
      const del = document.createElement("button"); del.className = "x"; del.title = "Delete"; del.innerHTML = ICON_X;
      del.onclick = async () => { const cur = (await storeGet({ journal: [] })).journal || []; chrome.storage.local.set({ journal: cur.filter((x) => x.id !== e.id) }, renderJournal); };
      row.append(meta, del); box.append(row);
    }
  });
}
// streamer mode + auto trade clips
function syncExtras() {
  if ($("privacyOn")) { $("privacyOn").checked = !!cfg.privacy; seg("privacyPeek", [[false, "Stay blurred"], [true, "Clear while pointing"]], () => !!cfg.privacyPeek, (v) => set({ privacyPeek: v }));
    seg("privacyPnl", [["hide", "Hidden"], ["ticks", "Ticks"], ["points", "Points"], ["show", "Dollars"]], () => cfg.privacyPnl || "hide", (v) => { set({ privacyPnl: v }); syncPrivHint(); renderJournal(); });
    $("privacyAcct").checked = cfg.privacyAcct !== false; $("privacyOrder").checked = !!cfg.privacyOrder; syncPrivHint(); }
  if ($("tradeClipOn")) { $("tradeClipOn").checked = !!cfg.tradeClipOn; $("tradeClipLenRow").hidden = !cfg.tradeClipOn;
    seg("tradeClipLen", [[15, "Last 15s"], [30, "Last 30s"], [60, "Last 1 min"]], () => +cfg.tradeClipLen || 30, (v) => set({ tradeClipLen: v })); }
}
function syncPrivHint() {
  const m = cfg.privacyPnl || "hide";
  $("privacyPnlHint").textContent = m === "hide" ? "Every number in your trade labels becomes dots."
    : m === "show" ? "Your P&L stays visible in dollars; only the panels you pick below are blurred."
    : `Dollar amounts become dots; ${m === "points" ? "TradingView's tick values are shown in points (futures we know the tick size of; others stay in ticks)" : "tick and % values stay visible"}. Set TradingView to show ticks: Settings \u203A Trading \u203A P&L in Ticks.`;
}
if ($("privacyAcct")) $("privacyAcct").onchange = (e) => set({ privacyAcct: e.target.checked });
if ($("privacyOrder")) $("privacyOrder").onchange = (e) => set({ privacyOrder: e.target.checked });
if ($("privacyOn")) $("privacyOn").onchange = (e) => { set({ privacy: e.target.checked }); renderJournal(); };
if ($("tradeClipOn")) $("tradeClipOn").onchange = (e) => { set({ tradeClipOn: e.target.checked }); syncExtras(); };
if ($("journalOn")) {
  $("journalOn").onchange = (e) => set({ journalOn: e.target.checked });
  $("journalClear").onclick = () => { try { chrome.storage.local.set({ journal: [] }, renderJournal); } catch {} };
}
// the page updates these while the panel is open (a trade just closed)
try { chrome.storage.onChanged && chrome.storage.onChanged.addListener((ch, area) => { if (area !== "local") return; if (ch.dayPnl) syncGoal(); if (ch.journal) renderJournal(); }); } catch {}

// ---------- tune ----------
const SLIDERS = [
  ["opacity", "Opacity", 0, 1, 0.05, (v) => Math.round(v * 100) + "%"],
  ["overOpacity", "On top", 0.05, 1, 0.05, (v) => Math.round(v * 100) + "%"],
  ["dim", "Darken", 0, 0.9, 0.05, (v) => Math.round(v * 100) + "%"],
  ["blur", "Blur", 0, 20, 1, (v) => v + "px"],
  ["vividness", "Saturation", 0, 2, 0.05, (v) => Math.round(v * 100) + "%"],
  ["tint", "Hue", 0, 360, 5, (v) => (v ? v + "°" : "Off")],
  ["speed", "Speed", 0.25, 3, 0.05, (v) => v.toFixed(1) + "×"],
  ["vignette", "Vignette", 0, 1, 0.05, (v) => (v ? Math.round(v * 100) + "%" : "Off")],
  ["posX", "Horizontal", 0, 100, 1, (v) => (v === 50 ? "Middle" : v + "%")],
  ["posY", "Vertical", 0, 100, 1, (v) => (v === 50 ? "Middle" : v + "%")],
];
function seg(id, options, get, onPick) {
  const box = $(id); box.innerHTML = "";
  options.forEach(([val, label]) => {
    const b = document.createElement("button");
    if (label.startsWith("<svg")) { b.innerHTML = label; b.title = val; } else b.textContent = label;
    b.className = get() === val ? "on" : "";
    b.onclick = () => { onPick(val); seg(id, options, get, onPick); };
    box.appendChild(b);
  });
}
// ---------- chart styling: grid, crosshair, price line ----------
const CHART_PARTS = [
  { k: "grid", title: "Grid", desc: "The lines behind the candles.", styles: [["solid", "Solid"], ["dotted", "Dotted"], ["dashed", "Dashed"], ["none", "None"]] },
  { k: "ch", title: "Crosshair", desc: "The lines that follow your pointer.", styles: [["solid", "Solid"], ["dotted", "Dotted"], ["dashed", "Dashed"]], glow: true },
  { k: "pl", title: "Price line", desc: "The dotted line at the last price.", styles: [["solid", "Solid"], ["dotted", "Dotted"], ["dashed", "Dashed"]] },
  { k: "sb", title: "Session breaks", desc: "The lines between trading sessions (turn them on in TradingView first).", styles: [["solid", "Solid"], ["dotted", "Dotted"], ["dashed", "Dashed"], ["none", "Hide"]] },
  { k: "ax", title: "Scale borders", desc: "The edge lines of the price and time scales.", styles: [["solid", "Show"], ["none", "Hide"]] },
];
function renderChartStyle() {
  const box = $("chartStyle"); if (!box) return;
  box.innerHTML = ""; if ($("scaleParts")) $("scaleParts").innerHTML = "";
  for (const p of CHART_PARTS) {
    const on = !!cfg[p.k + "On"], card = document.createElement("div"); card.className = "cpart";
    const host = p.k === "ax" && $("scaleParts") ? $("scaleParts") : box;     // scale borders live with the price scale
    card.innerHTML = `<div class="cpart-h"><div><b>${p.title}</b><small>${p.desc}</small></div><div class="seg cpart-mode" id="cs-${p.k}-on"></div></div>`;
    host.appendChild(card);
    seg(`cs-${p.k}-on`, [[false, "Own"], [true, "Styled"]], () => !!cfg[p.k + "On"], (v) => { set({ [p.k + "On"]: v }); renderChartStyle(); });
    if (!on) continue;
    const body = document.createElement("div"); body.className = "cpart-b";
    const colKey = p.k + "Color", cur = cfg[colKey] || "";
    body.innerHTML = `<div class="row"><span>Colour</span><div class="seg" id="cs-${p.k}-cm"></div><input type="color" id="cs-${p.k}-col" ${/^#/.test(cur) ? "" : "hidden"} /></div>
      <div class="row"><span>Width</span><div class="seg" id="cs-${p.k}-w"></div></div>
      <div class="row"><span>Style</span><div class="seg" id="cs-${p.k}-st"></div></div>` +
      (p.k === "grid" ? `<div class="row"><span>Strength</span><input type="range" id="cs-grid-a" min="0.05" max="1" step="0.05" /><output id="cs-grid-ao"></output></div>` : "") +
      (p.glow ? `<div class="row"><span>Glow at the pointer</span><div class="seg" id="cs-ch-glow"></div></div><div class="row"><span>Price &amp; time labels</span><div class="seg" id="cs-ch-lab"></div></div>` : "");
    card.appendChild(body);
    seg(`cs-${p.k}-cm`, [["", "Skin colour"], ["candle", "Candle"], ["custom", "Custom"]], () => (/^#/.test(cfg[colKey] || "") ? "custom" : cfg[colKey] || ""),
      (v) => { set({ [colKey]: v === "custom" ? ($(`cs-${p.k}-col`).value || "#7df9ff") : v }); renderChartStyle(); });
    const ci = $(`cs-${p.k}-col`); ci.value = /^#/.test(cur) ? cur : "#7df9ff"; ci.oninput = (e) => set({ [colKey]: e.target.value });
    seg(`cs-${p.k}-w`, [[0, "1"], [1, "2"], [2, "3"]], () => +cfg[p.k + "W"] || 0, (v) => set({ [p.k + "W"]: v }));
    seg(`cs-${p.k}-st`, p.styles, () => cfg[p.k + "Style"], (v) => set({ [p.k + "Style"]: v }));
    if (p.k === "grid") { const r = $("cs-grid-a"); r.value = cfg.gridAlpha; $("cs-grid-ao").textContent = Math.round(cfg.gridAlpha * 100) + "%";
      r.oninput = (e) => { set({ gridAlpha: +e.target.value }); $("cs-grid-ao").textContent = Math.round(+e.target.value * 100) + "%"; }; }
    if (p.glow) { seg("cs-ch-glow", [[false, "Off"], [true, "On"]], () => !!cfg.chGlow, (v) => set({ chGlow: v }));
      seg("cs-ch-lab", [[false, "Own"], [true, "Match crosshair"]], () => !!cfg.chLabels, (v) => set({ chLabels: v })); }
  }
  renderTicker(box);
}
// The ticker: the symbol name at the top left of the chart (plus timeframe and exchange). Not a line, but it lives
// with the other parts of the chart you can style.
function renderTicker(box) {
  const card = document.createElement("div"); card.className = "cpart";
  card.innerHTML = `<div class="cpart-h"><div><b>Ticker</b><small>The symbol name at the top left of the chart.</small></div><div class="seg cpart-mode" id="tk-on"></div></div>`;
  box.appendChild(card);
  seg("tk-on", [[false, "Own"], [true, "Styled"]], () => !!cfg.tkOn, (v) => { set({ tkOn: v }); renderChartStyle(); });
  if (!cfg.tkOn) return;
  const cur = cfg.tkColor || "", body = document.createElement("div"); body.className = "cpart-b";
  body.innerHTML = `<div class="row"><span>Colour</span><div class="seg" id="tk-cm"></div><input type="color" id="tk-col" ${/^#/.test(cur) ? "" : "hidden"} /></div>
    <div class="row"><span>Size</span><div class="seg" id="tk-size"></div></div>
    <div class="row"><span>Font</span><div class="seg" id="tk-font"></div></div>
    <div class="row"><span>Glow</span><div class="seg" id="tk-glow"></div></div>
    <div class="row"><span>Show</span><div class="seg" id="tk-only"></div></div>`;
  card.appendChild(body);
  seg("tk-cm", [["", "Skin colour"], ["candle", "Candle"], ["custom", "Custom"]], () => (/^#/.test(cfg.tkColor || "") ? "custom" : cfg.tkColor || ""),
    (v) => { set({ tkColor: v === "custom" ? ($("tk-col").value || "#ffffff") : v }); renderChartStyle(); });
  const ci = $("tk-col"); ci.value = /^#/.test(cur) ? cur : "#ffffff"; ci.oninput = (e) => set({ tkColor: e.target.value });
  seg("tk-size", [[0, "Normal"], [1, "Large"], [2, "XL"], [3, "Huge"]], () => +cfg.tkSize || 0, (v) => set({ tkSize: v }));
  seg("tk-font", [["default", "Default"], ["mono", "Mono"], ["rounded", "Rounded"]], () => cfg.tkFont || "default", (v) => set({ tkFont: v }));
  seg("tk-glow", [[false, "Off"], [true, "On"]], () => !!cfg.tkGlow, (v) => set({ tkGlow: v }));
  seg("tk-only", [[false, "Name, timeframe, exchange"], [true, "Name only"]], () => !!cfg.tkOnly, (v) => set({ tkOnly: v }));
}
// ---------- shortcuts ----------
const KEY_NAMES = { focusKey: "Focus mode", privacyKey: "Streamer mode", recordKey: "Record a clip", snapKey: "Snapshot", toggleKey: "Turn everything on/off" };
const keyLabel = (spec) => spec ? String(spec).split("+").map((k) => k.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "")).join("+") : "Off";
const TV_ALT = ["KeyT", "KeyH", "KeyJ", "KeyV", "KeyC", "KeyF", "KeyI", "KeyL", "KeyR", "KeyS", "KeyA", "KeyG", "KeyP", "KeyW", "KeyX", "KeyZ", "KeyK", "KeyN", "KeyO", "KeyD", "KeyB"];
let keyListen = null;
function syncShortcuts() {
  document.querySelectorAll(".keybtn").forEach((b) => { b.textContent = keyListen === b.dataset.key ? "Press keys\u2026" : keyLabel(cfg[b.dataset.key]); b.classList.toggle("listening", keyListen === b.dataset.key);
    b.onclick = () => { keyListen = keyListen === b.dataset.key ? null : b.dataset.key; if ($("keyMsg")) $("keyMsg").textContent = keyListen ? "Press the new shortcut. Esc cancels, Backspace turns it off." : ""; syncShortcuts(); }; });
  if ($("focusHides")) seg("focusHides", [["wallpaper", "Wallpaper"], ["all", "Everything"]], () => cfg.focusHides || "wallpaper", (v) => set({ focusHides: v }));
  if ($("tipToggle")) $("tipToggle").textContent = keyLabel(cfg.toggleKey); if ($("tipFocus")) $("tipFocus").textContent = keyLabel(cfg.focusKey);
  const fb = $("focusBar");
  if (fb) { fb.hidden = !cfg.focus; if (cfg.focus) { fb.innerHTML = `<b>Focus is on</b><p class="hint" style="color:#cfd5e2;margin:2px 0 8px">Your wallpaper is hidden. Press <b>${esc(keyLabel(cfg.focusKey))}</b> on the chart to bring it back.</p><button class="primary" id="focusExit">Exit focus</button>`; $("focusExit").onclick = () => { set({ focus: false }); syncShortcuts(); }; } }
}
addEventListener("keydown", (e) => {
  if (!keyListen) return;
  e.preventDefault(); e.stopPropagation();
  const msg = (t) => { if ($("keyMsg")) $("keyMsg").textContent = t; };
  if (e.key === "Escape") { keyListen = null; msg(""); return syncShortcuts(); }
  if (e.key === "Backspace" || e.key === "Delete") { set({ [keyListen]: "" }); msg(`${KEY_NAMES[keyListen]} shortcut turned off.`); keyListen = null; return syncShortcuts(); }
  if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;               // wait for the real key
  const fkey = /^F([1-9]|1[0-2])$/.test(e.code);
  if (!e.altKey && !e.ctrlKey && !e.metaKey && !fkey) return msg("Add Alt, Ctrl or \u2318 (or use an F-key) so it never fires while you type.");
  const spec = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Meta", e.code].filter(Boolean).join("+");
  const used = Object.keys(KEY_NAMES).find((k) => k !== keyListen && cfg[k] === spec);
  if (used) return msg(`${keyLabel(spec)} is already used for ${KEY_NAMES[used]}.`);
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && ["KeyC", "KeyV", "KeyX", "KeyZ", "KeyY", "KeyS", "KeyF", "KeyP", "KeyA", "KeyR", "KeyW", "KeyT", "KeyN"].includes(e.code))
    return msg(`${keyLabel(spec)} is a browser shortcut. Pick another one.`);
  const tvClash = e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && TV_ALT.includes(e.code);
  set({ [keyListen]: spec });
  msg(`${KEY_NAMES[keyListen]}: ${keyLabel(spec)}.` + (tvClash ? ` TradingView also uses ${keyLabel(spec)}; on the chart Priism takes it. Add Shift to keep both.` : ""));
  keyListen = null; syncShortcuts();
}, true);

// ---------- session timer ----------
function syncTimer() {
  if (!$("timerOn")) return;
  $("timerOn").checked = !!cfg.timerOn; $("timerMarket").value = cfg.timerMarket || "auto";
  seg("timerPos", [["bl", "Bottom left"], ["bc", "Bottom centre"], ["br", "Bottom right"]], () => (["bl", "bc", "br"].includes(cfg.timerPos) ? cfg.timerPos : "bc"), (v) => set({ timerPos: v, timerOn: true }));
  seg("timerStyle", [["pill", "Pill"], ["glass", "Glass card"], ["minimal", "Minimal"]], () => cfg.timerStyle || "pill", (v) => set({ timerStyle: v, timerOn: true }));
  seg("timerShow", [["full", "Status + next"], ["next", "Next only"]], () => cfg.timerShow || "full", (v) => { set({ timerShow: v, timerOn: true }); syncTimer(); });
  seg("timerFormat", [["in", "Countdown"], ["at", "Clock time"]], () => cfg.timerFormat || "in", (v) => { set({ timerFormat: v, timerOn: true }); syncTimer(); });
  seg("timerClosed", [["show", "Keep showing"], ["hide", "Hide"]], () => cfg.timerClosed || "show", (v) => { set({ timerClosed: v, timerOn: true }); syncTimer(); });
  if ($("timerPreview")) {   // what the timer will read, with these choices
    const when = cfg.timerFormat === "at" ? "at " + new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, 16, 0)) : "in 1h 20m";
    $("timerPreview").textContent = `Example: \u201c${cfg.timerShow === "next" ? "" : "NY session open \u00B7 "}NY session closes ${when}\u201d${cfg.timerClosed === "hide" ? ". Hidden while the market is closed." : ""}`;
  }
  seg("sessionSound", SOUND_LEVELS, () => cfg.sessionSound || "off", (v) => { set({ sessionSound: v }); preview("bell", v); });
}
if ($("timerOn")) { $("timerOn").onchange = (e) => set({ timerOn: e.target.checked }); $("timerMarket").onchange = (e) => set({ timerMarket: e.target.value, timerOn: true }); }

// ---------- share link offer: open the panel on a Priism share link and add the look in one tap ----------
(async function lookOffer() {
  const el = $("lookOffer"); if (!el || !(chrome.tabs && chrome.tabs.query)) return;
  let tab; try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { return; }
  const parsed = tab && tab.url && /look\.html#PRIISM1-/.test(tab.url) ? parseLookCode(tab.url) : null;
  if (!parsed) return;
  el.innerHTML = `<b>Add this look?</b><p class="hint" style="color:#cfd5e2;margin:2px 0 8px">\u201c${esc(parsed.name || "Shared look")}\u201d \u00B7 ${esc((WickedSkins[parsed.skin] || {}).name || parsed.skin)}. It goes on your chart right away, with Undo.</p><button class="primary" id="lookOfferGo">Add look</button>`;
  el.hidden = false;
  $("lookOfferGo").onclick = () => { applyWithUndo({ ...parsed.look, enabled: true, skin: parsed.skin }, `Added \u201c${parsed.name || "Shared look"}\u201d.`); el.hidden = true; };
})();

function syncPanels() {
  if (!$("panelMode")) return;
  if ($("dlgMode")) {
    seg("dlgMode", [["off", "TradingView"], ["glass", "Glass"], ["color", "Colour"]], () => cfg.dlgMode || "off", (v) => { set({ dlgMode: v }); syncPanels(); });
    $("dlgColor").hidden = cfg.dlgMode !== "color"; $("dlgColor").value = cfg.dlgColor || "#12151f";
    $("dlgAlphaRow").hidden = !cfg.dlgMode || cfg.dlgMode === "off";
    $("dlgAlpha").value = cfg.dlgAlpha; $("dlgAlphaOut").textContent = Math.round(cfg.dlgAlpha * 100) + "%";
  }
  seg("panelMode", [["off", "TradingView"], ["skin", "Skin"], ["color", "Colour"]], () => cfg.panelMode || "off", (v) => { set({ panelMode: v }); syncPanels(); });
  $("panelColor").hidden = cfg.panelMode !== "color"; $("panelColor").value = cfg.panelColor || "#10131c";
}
if ($("dlgColor")) $("dlgColor").oninput = (e) => set({ dlgColor: e.target.value, dlgMode: "color" });
if ($("dlgAlpha")) $("dlgAlpha").oninput = (e) => { set({ dlgAlpha: +e.target.value }); $("dlgAlphaOut").textContent = Math.round(+e.target.value * 100) + "%"; };
if ($("panelColor")) $("panelColor").oninput = (e) => set({ panelColor: e.target.value, panelMode: "color" });

function syncTune() {
  $("sliders").innerHTML = "";
  SLIDERS.forEach(([key, label, min, max, step, fmt]) => {
    // only show what matters right now
    if ((key === "posX" || key === "posY") && cfg.skin !== "media") return;
    if (key === "overOpacity" && cfg.layer !== "over") return;
    if (key === "opacity" && cfg.layer === "over") return;
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}"><output></output>`;
    const inp = row.querySelector("input"), out = row.querySelector("output");
    inp.value = cfg[key]; out.textContent = fmt(+cfg[key]);
    inp.oninput = () => { set({ [key]: +inp.value }); out.textContent = fmt(+inp.value); };
    inp.ondblclick = () => { inp.value = DEFAULTS[key]; inp.oninput(); }; // double-click resets
    $("sliders").appendChild(row);
  });
  document.querySelectorAll("[data-only=media]").forEach((el) => (el.hidden = cfg.skin !== "media"));
  seg("smooth", [["eco", "Eco"], ["balanced", "Balanced"], ["smooth", "Smooth"], ["max", "Max"]],
    () => (cfg.powerSaver ? "eco" : cfg.fps === "max" ? "max" : cfg.fps === "auto" || String(cfg.fps) === "60" ? "smooth" : "balanced"),
    (v) => set(v === "eco" ? { powerSaver: true, fps: 30 } : v === "balanced" ? { powerSaver: false, fps: 30 } : v === "max" ? { powerSaver: false, fps: "max" } : { powerSaver: false, fps: "auto" }));
  // Max runs at your screen's refresh rate (120/144/240Hz). Show it when known.
  const hz = +document.documentElement.getAttribute("data-bd-hz") || 0;   // only set on a chart page, not the popup
  if ($("smoothHint")) $("smoothHint").textContent = cfg.powerSaver ? "Eco: 15 fps, lightest on your computer." : cfg.fps === "max" ? "Max: runs at your screen's refresh rate (e.g. 120/144/240Hz) for the smoothest motion. Uses more GPU." : cfg.fps === "auto" ? "Smooth: 60 fps." : "Balanced: 30 fps.";
  // Auto quality: meaningful on Smooth or Max (it eases off if your computer struggles). Eco/Balanced already cap things.
  $("autoQRow").hidden = cfg.powerSaver || (cfg.fps !== "auto" && cfg.fps !== "max");
  seg("autoQuality", [[true, "Auto"], [false, "Max"]], () => (cfg.autoQuality !== false), (v) => set({ autoQuality: v }));
  seg("fit", [["cover", "Cover"], ["fit", "Contain"], ["stretch", "Stretch"]], () => cfg.fit, (v) => set({ fit: v }));
  seg("calm", [[false, "Off"], [true, "On"]], () => cfg.calm, (v) => set({ calm: v }));
  seg("motion", [[false, "On"], [true, "Paused"]], () => cfg.paused, (v) => set({ paused: v }));
  seg("layer", [["behind", "Under chart"], ["over", "On top"]], () => cfg.layer, (v) => { set({ layer: v }); syncTune(); });
  // Sides only makes sense under the chart (On top already floats over everything).
  $("sidesRow").hidden = cfg.layer === "over"; if ($("leftBarRow")) $("leftBarRow").hidden = cfg.layer === "over";
  if ($("sidesHint")) $("sidesHint").hidden = cfg.layer === "over";
  seg("sides", [["off", "Default"], ["glass", "Glass"], ["clear", "Clear"]], () => cfg.sides || "off", (v) => set({ sides: v }));
  if ($("leftBar")) seg("leftBar", [["off", "Default"], ["glass", "Glass"], ["clear", "Clear"]], () => cfg.leftBar || "off", (v) => set({ leftBar: v }));
  // Interface (fonts / size / accent for TradingView's own panels)
  seg("uiFont", [["default", "Default"], ["mono", "Mono"], ["rounded", "Rounded"]], () => cfg.uiFont || "default", (v) => set({ uiFont: v }));
  seg("uiSize", [[0, "Normal"], [1, "Large"]], () => (+cfg.uiSize || 0), (v) => set({ uiSize: v }));
  seg("uiAccentMode", [["off", "Default"], ["custom", "Custom"]], () => (cfg.uiAccent ? "custom" : "off"),
    (v) => { set({ uiAccent: v === "custom" ? ($("uiAccent").value || "#2ef2b0") : "" }); syncTune(); });
  $("uiAccent").value = cfg.uiAccent || "#2ef2b0"; $("uiAccent").hidden = !cfg.uiAccent;
  seg("react", [["off", "Off"], ["market", "Day\u2019s move"], ["pnl", "My position"]], () => cfg.react, (v) => { set({ react: v }); syncReact(); });
  syncReact();
}
function syncReact() {
  $("reactOpts").hidden = cfg.react === "off";

  $("reactStrength").value = cfg.reactStrength;
  $("reactStrengthOut").textContent = Math.round(cfg.reactStrength * 100) + "%";

  $("reactHint").textContent = cfg.react === "market"
    ? "Chart edges glow green/red with the day's move and pulse on every tick. Skins speed up when price moves."
    : "Glows green/red with the open P&L shown on your chart's position line (broker, prop platform or paper trading). Nothing is sent anywhere.";
}
$("reactStrength").oninput = (e) => { set({ reactStrength: +e.target.value }); $("reactStrengthOut").textContent = Math.round(+e.target.value * 100) + "%"; };

// ---------- session skins ----------
const SESSIONS = [["asia", "Asia", "6pm–3am"], ["london", "London", "3am–8am"], ["ny", "New York", "8am–5pm"], ["off", "After-hours", "5–6pm, weekends"]];
function nowSession() {   // same rules as content.js
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const h = +parts.hour, day = parts.weekday;
  if (day === "Sat" || (day === "Sun" && h < 18) || (day === "Fri" && h >= 17)) return "off";
  if (h >= 18 || h < 3) return "asia"; if (h < 8) return "london"; if (h < 17) return "ny"; return "off";
}
function syncSessions() {
  $("sessionOn").checked = cfg.sessionOn;
  const box = $("sessionRows"); box.innerHTML = ""; const now = nowSession();
  const options = `<option value="">Your normal skin</option>` + Object.entries(WickedSkins).map(([id, sk]) => `<option value="${id}">${esc(sk.name)}</option>`).join("");
  for (const [key, label, hours] of SESSIONS) {
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = `<span>${label}${key === now ? ' <b class="now">now</b>' : ""}<br><small class="hint" style="margin:0">${hours}</small></span><select class="field">${options}</select>`;
    const sel = row.querySelector("select"); sel.value = (cfg.sessionSkins || {})[key] || "";
    sel.onchange = () => { set({ sessionSkins: { ...cfg.sessionSkins, [key]: sel.value }, sessionOn: true }); $("sessionOn").checked = true; };
    box.appendChild(row);
  }
}
$("sessionOn").onchange = (e) => set({ sessionOn: e.target.checked });

// ---------- symbol skins (a wallpaper per ticker) ----------
// Unlike sessions (fixed 4), symbols are open-ended, so you add rows. "Add current" grabs the chart's symbol.
function skinOptions(sel) {
  const opts = `<option value="">Your normal skin</option>` +
    `<optgroup label="Skins">` + Object.entries(WickedSkins).map(([id, sk]) => `<option value="${id}">${esc(sk.name)}</option>`).join("") + `</optgroup>` +
    (cfg.media.filter((m) => !m.pending).length ? `<optgroup label="Your uploads">` + cfg.media.filter((m) => !m.pending).map((m) => `<option value="media:${m.id}">${esc(m.name)}</option>`).join("") + `</optgroup>` : "");
  return opts;
}
function syncSymbols() {
  $("symbolOn").checked = cfg.symbolOn;
  const box = $("symbolRows"); if (!box) return; box.innerHTML = "";
  const map = cfg.symbolSkins || {}, keys = Object.keys(map);
  if (!keys.length) box.insertAdjacentHTML("beforeend", `<p class="hint" style="margin:4px 0">No tickers yet. Add one below (e.g. BTCUSDT, NQ, AAPL) and pick its wallpaper.</p>`);
  for (const sym of keys) {
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = `<span>${esc(sym)}</span><select class="field">${skinOptions()}</select><button class="x" title="Remove">${ICON_X}</button>`;
    const selEl = row.querySelector("select"); selEl.value = map[sym] || "";
    selEl.onchange = () => { set({ symbolSkins: { ...cfg.symbolSkins, [sym]: selEl.value }, symbolOn: true }); $("symbolOn").checked = true; };
    row.querySelector(".x").onclick = () => { const m = { ...cfg.symbolSkins }; delete m[sym]; set({ symbolSkins: m }); syncSymbols(); };
    box.appendChild(row);
  }
}
async function addSymbol(sym) {
  sym = (sym || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!sym) return;
  if ((cfg.symbolSkins || {})[sym] !== undefined) { $("symbolInput").value = ""; return; }
  set({ symbolSkins: { ...cfg.symbolSkins, [sym]: "" }, symbolOn: true });
  $("symbolInput").value = ""; syncSymbols();
}
$("symbolOn").onchange = (e) => set({ symbolOn: e.target.checked });
$("symbolAdd").onclick = () => addSymbol($("symbolInput").value);
$("symbolInput").onkeydown = (e) => { if (e.key === "Enter") addSymbol($("symbolInput").value); };
$("symbolCurrent").onclick = async () => {
  const r = await tabMsg({ ws: "symbol" });
  if (r && r.symbol) addSymbol(r.symbol); else hint && hint("Open a TradingView chart to grab its symbol.");
};

// ---------- multi-chart layouts ----------
// "Stretch" = one wallpaper across the layout, "Each chart" = a copy per chart, "Mix" = a skin per chart.
// Chart 1 is top-left, then left to right, row by row. Chart 1 always shows your main skin.
let chartCount = 0;          // charts on the current tab (0 = unknown)
let target = "all";          // where a skin goes when you click it: "all" or a chart number
const MULTI_HINT = {
  span: "One wallpaper stretched across your whole layout.",
  each: "Every chart gets its own copy of your skin.",
  mix: "A different skin on each chart. Pick a chart, then click a skin.",
};
const mainSrc = () => (cfg.skin === "media" ? "media:" + cfg.mediaId : cfg.skin);
const chartN = () => Math.min(16, Math.max(chartCount, 2, ...Object.keys(cfg.chartSkins || {}).map(Number).filter((n) => n > 0)));
function currentSrc() {
  if (typeof target === "number" && target > 1) return (cfg.chartSkins || {})[target] || mainSrc();
  return mainSrc();
}
function srcName(src) {
  if (!src) return "";
  if (src.startsWith("media:")) { const m = cfg.media.find((x) => x.id === src.slice(6)); return m ? m.name : "Upload"; }
  return WickedSkins[src] ? WickedSkins[src].name : src;
}
function pickSource(src) {
  const asMain = src.startsWith("media:") ? { skin: "media", mediaId: src.slice(6) } : { skin: src };
  if (target === "all") set({ ...asMain, chartSkins: {}, ...(cfg.multi === "mix" ? { multi: "each" } : {}) });
  else if (target === 1) {
    // only chart 1 should change: charts still following chart 1 keep the skin they show now
    const keep = { ...(cfg.chartSkins || {}) };
    for (let n = 2; n <= chartN(); n++) if (!keep[n]) keep[n] = mainSrc();
    set({ ...asMain, chartSkins: keep, multi: "mix" });
  } else set({ chartSkins: { ...(cfg.chartSkins || {}), [target]: src }, multi: "mix" });
  renderSkins(); renderMedia(); syncTune(); syncCharts();
}
async function activeTab() {
  if (!EXT_MODE || IS_TAB || !chrome.tabs) return null;
  try { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); return tab && /^https?:/.test(tab.url || "") ? tab : null; } catch { return null; }
}
async function tabMsg(msg) {
  const tab = await activeTab(); if (!tab) return null;
  return new Promise((res) => { try { chrome.tabs.sendMessage(tab.id, msg, { frameId: 0 }, (r) => { void chrome.runtime.lastError; res(r || null); }); } catch { res(null); } });
}
// Snapshot: the owning instance (top frame on tradingview.com) answers. We message the top frame; the content
// script only replies from the owning, non-stood-down instance. (Broadcast-to-all-frames would need extra
// permissions we deliberately don't ask for, to keep the listing lean.)
async function tabMsgAnyFrame(msg) { return tabMsg(msg); }
async function detectCharts() {
  const r = await tabMsg({ ws: "layout" });
  if (r && r.count !== chartCount) { chartCount = r.count | 0; syncCharts(); }
}
const flashNumbers = (n) => tabMsg({ ws: "numbers", n }).then((r) => { if (r && r.count !== chartCount) { chartCount = r.count | 0; syncCharts(); } });
function renderPickers() {
  const show = chartCount > 1 || cfg.multi === "mix";
  document.querySelectorAll(".chartpick").forEach((box) => {
    box.hidden = !show; box.innerHTML = "";
    if (!show) return;
    box.insertAdjacentHTML("beforeend", `<span>Apply to</span>`);
    for (const t of ["all", ...Array.from({ length: chartN() }, (_, i) => i + 1)]) {
      const b = document.createElement("button");
      b.className = "chip" + (target === t ? " on" : "");
      b.textContent = t === "all" ? "All charts" : "Chart " + t;
      if (t !== "all") b.title = t === 1 ? "Top-left chart: " + srcName(mainSrc()) : srcName((cfg.chartSkins || {})[t] || mainSrc());
      b.onclick = () => { target = t; if (t !== "all") flashNumbers(t); renderSkins(); renderMedia(); renderPickers(); };
      box.appendChild(b);
    }
  });
}
function syncCharts() {
  seg("multi", [["span", "Stretch"], ["each", "Each chart"], ["mix", "Mix"]], () => cfg.multi || "span", (v) => {
    set({ multi: v }); if (v !== "mix" && typeof target === "number") target = "all"; syncCharts(); renderSkins(); renderMedia();
  });
  $("multiHint").textContent = MULTI_HINT[cfg.multi] || MULTI_HINT.span;
  $("chartsFound").textContent = chartCount > 1 ? `${chartCount} charts on this tab.` : chartCount === 1 ? "1 chart on this tab. Open a multi-chart layout to use these." : "";
  const rows = $("chartRows"); rows.innerHTML = "";
  if (cfg.multi === "mix") {
    const opts = `<option value="">Same as chart 1</option><optgroup label="Skins">` +
      Object.entries(WickedSkins).map(([id, sk]) => `<option value="${id}">${esc(sk.name)}</option>`).join("") + `</optgroup>` +
      (cfg.media.filter((m) => !m.pending).length ? `<optgroup label="Your uploads">` + cfg.media.filter((m) => !m.pending).map((m) => `<option value="media:${m.id}">${esc(m.name)}</option>`).join("") + `</optgroup>` : "");
    for (let n = 1; n <= chartN(); n++) {
      const row = document.createElement("div"); row.className = "row";
      if (n === 1) { row.innerHTML = `<span>Chart 1</span><small class="hint" style="margin:0">${esc(srcName(mainSrc()))} (your main skin)</small>`; rows.appendChild(row); continue; }
      row.innerHTML = `<span>Chart ${n}</span><select class="field">${opts}</select>`;
      const sel = row.querySelector("select"); sel.value = (cfg.chartSkins || {})[n] || "";
      sel.onchange = () => {
        const next = { ...(cfg.chartSkins || {}) }; if (sel.value) next[n] = sel.value; else delete next[n];
        set({ chartSkins: next }); renderPickers();
      };
      sel.onfocus = () => flashNumbers(n);
      rows.appendChild(row);
    }
  }
  renderPickers();
}
$("showNums").onclick = () => flashNumbers(typeof target === "number" ? target : 0);

// ---------- watermark (logo + name) ----------
function syncPnl() {
  $("pnlShow").checked = !!cfg.pnlShow;
  seg("pnlStyle", [["color", "Colour"], ["rainbow", "Rainbow"]], () => cfg.pnlStyle || "color", (v) => { set({ pnlStyle: v, pnlShow: true }); $("pnlShow").checked = true; syncPnl(); });
  $("pnlColsRow").hidden = cfg.pnlStyle === "rainbow";
  $("pnlUp").value = cfg.pnlUp || cfg.candleUp || "#00e08a"; $("pnlDown").value = cfg.pnlDown || cfg.candleDown || "#ff3355";
  seg("pnlBack", [["none", "None"], ["glass", "Glass"], ["solid", "Solid"]], () => cfg.pnlBack || "glass", (v) => set({ pnlBack: v }));
  seg("pnlSize", [[0, "S"], [1, "M"], [2, "L"]], () => (+cfg.pnlSize || 1), (v) => set({ pnlSize: v }));
  seg("pnlPos", [["tl", cornerIcon(2.5, 2.5)], ["tc", cornerIcon(5.5, 2.5)], ["tr", cornerIcon(8.5, 2.5)], ["bl", cornerIcon(2.5, 6.5)], ["br", cornerIcon(8.5, 6.5)]],
    () => cfg.pnlPos || "tc", (v) => set({ pnlPos: v }));
}
$("pnlShow").onchange = (e) => set({ pnlShow: e.target.checked });
$("pnlUp").oninput = (e) => set({ pnlUp: e.target.value });
$("pnlDown").oninput = (e) => set({ pnlDown: e.target.value });

// ---------- trade brackets (fully recolour the broker's TP / Stop / entry pills) ----------
// Each colour is Keep (leave TradingView's) or Custom (any colour). The number can also be Profit/Loss (green/red).
function bkOn() { set({ bracketOn: true }); $("bracketOn").checked = true; syncBracket(); }
function syncBracket() {
  $("bracketOn").checked = !!cfg.bracketOn;
  seg("bracketSize", [[0, "Normal"], [1, "Large"], [2, "XL"], [3, "Huge"]], () => (+cfg.bracketSize || 0), (v) => { set({ bracketSize: v }); bkOn(); });

  // Box colour: Keep | Custom
  seg("bracketFillMode", [["keep", "Keep"], ["custom", "Custom"]], () => (cfg.bracketFill ? "custom" : "keep"),
    (v) => { set({ bracketFill: v === "custom" ? ($("bracketFill").value || "#1e2130") : "" }); bkOn(); });
  $("bracketFill").value = cfg.bracketFill || "#1e2130"; $("bracketFill").hidden = !cfg.bracketFill;

  // Number colour: Keep | Custom | Profit/Loss
  const textMode = (cfg.bracketProfit || cfg.bracketLoss) ? "pl" : (cfg.bracketText ? "custom" : "keep");
  seg("bracketTextMode", [["keep", "Keep"], ["custom", "Custom"], ["pl", "Profit/Loss"]], () => textMode, (v) => {
    if (v === "keep") set({ bracketText: "", bracketProfit: "", bracketLoss: "" });
    else if (v === "custom") set({ bracketText: $("bracketText").value || "#ffffff", bracketProfit: "", bracketLoss: "" });
    else set({ bracketText: "", bracketProfit: $("bracketProfit").value || cfg.candleUp || "#00e08a", bracketLoss: $("bracketLoss").value || cfg.candleDown || "#ff3355" });
    bkOn();
  });
  $("bracketText").value = cfg.bracketText || "#ffffff"; $("bracketText").hidden = textMode !== "custom";
  $("bracketPLRow").hidden = textMode !== "pl";
  seg("bracketQtyMode", [["keep", "Keep"], ["custom", "Custom"]], () => (cfg.bracketQty ? "custom" : "keep"),
    (v) => { set({ bracketQty: v === "custom" ? ($("bracketQty").value || "#ffd166") : "" }); bkOn(); });
  $("bracketQty").value = cfg.bracketQty || "#ffd166"; $("bracketQty").hidden = !cfg.bracketQty;
  $("bracketProfit").value = cfg.bracketProfit || cfg.candleUp || "#00e08a";
  $("bracketLoss").value = cfg.bracketLoss || cfg.candleDown || "#ff3355";

  // Outline: Keep | Custom (+ width)
  seg("bracketBorderMode", [["keep", "Keep"], ["custom", "Custom"]], () => (cfg.bracketBorderColor ? "custom" : "keep"),
    (v) => { set({ bracketBorderColor: v === "custom" ? ($("bracketBorderColor").value || "#4094e8") : "", bracketBorderW: v === "custom" && !cfg.bracketBorderW ? 1 : cfg.bracketBorderW }); bkOn(); });
  $("bracketBorderColor").value = cfg.bracketBorderColor || "#4094e8"; $("bracketBorderColor").hidden = !cfg.bracketBorderColor;
  $("bracketBorderWRow").hidden = !cfg.bracketBorderColor;
  seg("bracketBorderW", [[0, "Thin"], [1, "Medium"], [2, "Thick"], [3, "Thicker"]], () => (+cfg.bracketBorderW || 0), (v) => { set({ bracketBorderW: v }); bkOn(); });

  // Level line: Keep | Custom (+ width)
  seg("bracketLineMode", [["keep", "Keep"], ["custom", "Custom"]], () => (cfg.bracketLineColor ? "custom" : "keep"),
    (v) => { set({ bracketLineColor: v === "custom" ? ($("bracketLineColor").value || "#4094e8") : "", bracketLineW: v === "custom" && !cfg.bracketLineW ? 1 : cfg.bracketLineW }); bkOn(); });
  $("bracketLineColor").value = cfg.bracketLineColor || "#4094e8"; $("bracketLineColor").hidden = !cfg.bracketLineColor;
  $("bracketLineWRow").hidden = !cfg.bracketLineColor;
  seg("bracketLineW", [[0, "Thin"], [1, "Medium"], [2, "Thick"], [3, "Thicker"]], () => (+cfg.bracketLineW || 0), (v) => { set({ bracketLineW: v }); bkOn(); });
}
$("bracketOn").onchange = (e) => set({ bracketOn: e.target.checked });
// One tap: big number on a dark box, profit green / loss red, thicker level line — readable on any wallpaper.
$("bracketEasy").onclick = () => {
  set({ bracketOn: true, bracketSize: 2, bracketBack: "solid", bracketFill: "", bracketText: "",
    bracketProfit: "#19e68c", bracketLoss: "#ff4d5e", bracketBorderColor: "", bracketBorderW: 1, bracketLineColor: "", bracketLineW: 1 });
  syncBracket(); toast && toast("TP / Stop / P&L: big, dark box, green/red numbers");
};
$("bracketFill").oninput = (e) => { set({ bracketFill: e.target.value }); bkOn(); };
$("bracketText").oninput = (e) => { set({ bracketText: e.target.value, bracketProfit: "", bracketLoss: "" }); bkOn(); };
$("bracketProfit").oninput = (e) => { set({ bracketProfit: e.target.value, bracketText: "", bracketOn: true }); };
$("bracketLoss").oninput = (e) => { set({ bracketLoss: e.target.value, bracketText: "", bracketOn: true }); };
$("bracketBorderColor").oninput = (e) => { set({ bracketBorderColor: e.target.value, bracketBorderW: cfg.bracketBorderW || 1 }); bkOn(); };
$("bracketLineColor").oninput = (e) => { set({ bracketLineColor: e.target.value, bracketLineW: cfg.bracketLineW || 1 }); bkOn(); };

// Diagnose: read, from the TradingView tab's page, which pills the hook actually caught — shown right here so the
// user never needs the console. If it caught pills but they didn't restyle, that tells us it's a styling bug; if
// it caught nothing, the pills draw in a way we don't yet detect (and we show what text IS on the chart).
if ($("bracketDiag")) $("bracketDiag").onclick = async () => {
  const out = $("bracketDiagOut");
  out.style.display = ""; out.textContent = "Looking at your chart…";
  if (!EXT_MODE || IS_TAB || !chrome.tabs || !chrome.scripting) { out.textContent = "Open this on a TradingView chart tab to diagnose."; return; }
  let tab; try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch {}
  if (!tab || !/^https?:/.test(tab.url || "")) { out.textContent = "Open your TradingView chart, then click again."; return; }
  // make sure brackets + debug are on so the hook is recording
  set({ bracketOn: true, bracketDebug: true }); $("bracketOn").checked = true;
  try {
    // 1) install a one-shot probe in the page that samples in-chart text (and reset its buffer each run)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true }, world: "MAIN",
      func: () => {
        try {
          const C = CanvasRenderingContext2D.prototype;
          window.__bdDiagSeen = []; window.__bdDiagWhere = {};
          // where is each number drawn? pane = the chart, overlay = another canvas in the chart area,
          // axis = price/time scale, hidden = a canvas not on the page (drawn once, pasted later), other = elsewhere
          const where = (c) => { try { if (!c || !c.isConnected) return "hidden"; if (c.closest("[class*=price-axis],[class*=time-axis]")) return "axis";
            if (c.closest(".chart-markup-table")) return "pane"; if (c.closest(".chart-container, .layout__area--center")) return "overlay"; return "other"; } catch { return "hidden"; } };
          const note = (t, font, align, c) => {
            const s = String(t); if (!/[0-9]/.test(s) || !window.__bdDiagSeen) return;
            const w = where(c); window.__bdDiagWhere[w] = (window.__bdDiagWhere[w] || 0) + 1;
            if (w === "axis" && window.__bdDiagSeen.filter((x) => x.w === "axis").length >= 3) return;   // a few scale labels are enough
            const key = s.slice(0, 16) + font + w;
            if (window.__bdDiagSeen.length < 40 && !window.__bdDiagSeen.some((x) => x.k === key)) window.__bdDiagSeen.push({ k: key, t: s.slice(0, 16), f: font, a: align, w });
          };
          if (!window.__bdDiagProbe) {
            window.__bdDiagProbe = 1; const o = C.fillText;
            C.fillText = function (t) { try { note(t, this.font, this.textAlign, this.canvas); } catch {} return o.apply(this, arguments); };
            if (typeof OffscreenCanvasRenderingContext2D !== "undefined") { const OP = OffscreenCanvasRenderingContext2D.prototype, oo = OP.fillText;
              OP.fillText = function (t) { try { note(t, this.font, this.textAlign, null); } catch {} return oo.apply(this, arguments); }; }
            const di = C.drawImage;
            C.drawImage = function (img) { try { if (img && img.tagName === "CANVAS" && !img.isConnected && this.canvas && this.canvas.isConnected) { const w = where(this.canvas); window.__bdDiagWhere["pasted-" + w] = (window.__bdDiagWhere["pasted-" + w] || 0) + 1; } } catch {} return di.apply(this, arguments); };
          }        } catch {}
      },
    });
    // nudge the chart so it repaints into our probe (TradingView's own soft redraw), then wait a beat
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, world: "MAIN", func: () => { try { document.dispatchEvent(new Event("bd-softrepaint")); window.dispatchEvent(new Event("resize")); } catch {} } }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2200));
    // 2) read what the hook caught + what the probe saw (across all frames; pick the richest result)
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true }, world: "MAIN",
      func: () => {
        const d = window.__bdBracketDebug;
        // Which chart engine is this? Advanced Charts has TradingViewApi + .chart-markup-table; Lightweight Charts
        // has a .tv-lightweight-charts wrapper (and/or a LightweightCharts global) and no TradingViewApi.
        let engine = "unknown";
        try {
          const adv = !!(window.TradingViewApi || window.tradingViewApi || document.querySelector(".chart-markup-table, .chart-container"));
          const lw = !!(window.LightweightCharts || document.querySelector(".tv-lightweight-charts, [class*='lightweight']"))
            || [...document.querySelectorAll("canvas")].some((c) => c.parentElement && /lightweight|tv-lw|lw-chart/i.test(c.parentElement.className || ""));
          if (adv) engine = "advanced";
          else if (lw) engine = "lightweight";
        } catch {}
        const canvases = (() => { try { return [...document.querySelectorAll("canvas")].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 150 && r.height > 120; }).length; } catch { return 0; } })();
        // facts about a Lightweight-Charts style page (read-only): is our adapter running, is the wallpaper mounted, and what
        // sits between the wallpaper and the screen (an opaque box there is what hides it)
        let lw = null, layer = null, stack = [];
        try { lw = window.__bdLwInfo ? window.__bdLwInfo() : null; } catch {}
        try {
          const l = document.getElementById("bd-layer");
          if (l) { const r = l.getBoundingClientRect(); layer = { inside: l.parentElement ? l.parentElement.tagName.toLowerCase() + (l.parentElement.id ? "#" + l.parentElement.id : "") : "", w: Math.round(r.width), h: Math.round(r.height), embedded: l.classList.contains("bd-embedded") }; }
          const cv = [...document.querySelectorAll("canvas")].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 250 && r.height > 150; }).sort((a, b) => b.width * b.height - a.width * a.height)[0];
          if (cv) { const r = cv.getBoundingClientRect(); let e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), n = 0;
            while (e && n++ < 7) { const bg = getComputedStyle(e).backgroundColor; stack.push(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0].slice(0, 24) : "") + (bg && !/rgba?\(0, 0, 0, 0\)|transparent/.test(bg) ? " [" + bg + "]" : "")); e = e.parentElement; } }
        } catch {}
        // labels made of page elements (HTML) over the chart, instead of canvas drawing
        const dom = [];
        try { const area = document.querySelector(".chart-container, .layout__area--center"); const ar = area && area.getBoundingClientRect();
          if (ar) for (const e of area.querySelectorAll("div, span")) { if (e.children.length || dom.length >= 6) continue; const t = (e.textContent || "").trim();
            if (!/^[+\-\u2212]?\s*[$\u20ac\u00a3]?\s*[\d,.]+/.test(t) || t.length > 16) continue; const r = e.getBoundingClientRect();
            if (r.width > 4 && r.height > 6 && r.height < 40 && r.left >= ar.left && r.right <= ar.right - 40) dom.push(t + " [" + getComputedStyle(e).font.slice(0, 40) + "]"); } } catch {}
        return { hooked: !!window.__bdHooked, ver: window.__bdHookVer || null, caught: d ? d.samples : null, onChart: window.__bdDiagSeen || [], where: window.__bdDiagWhere || {},
          paths: window.__bdBracketPaths || null, dom, engine, canvases, lw, layer, stack, frame: location.hostname };
      },
    });
    const score = (x) => x && x.result ? ((x.result.caught ? x.result.caught.length * 100 : 0) + (x.result.onChart ? x.result.onChart.length : 0) + (x.result.engine && x.result.engine !== "unknown" ? 5 : 0) + (x.result.hooked ? 1 : 0)) : -1;
    const best = (results || []).sort((a, b) => score(b) - score(a))[0];
    const r = best && best.result;
    if (!r) { out.textContent = "Couldn't read the chart. Make sure Priism Skins is on for this tab."; return; }
    // Lightweight Charts (custom apps like nq.vision): wallpaper + candle colours are supported; there are no broker pills.
    if (r.engine === "lightweight" || (r.lw && r.lw.active)) {
      const L = r.lw;
      const facts = [
        `adapter ${L && L.active ? "ON" : "NOT running"}`,
        `wallpaper ${r.layer ? (r.layer.embedded ? "mounted inside the chart box" : "mounted behind the page") + ` (${r.layer.w}\u00D7${r.layer.h})` : "NOT mounted"}`,
        L && L.candles ? `candle colours set (${L.candles.up}/${L.candles.down})` : "candle colours: not enabled (Style \u2192 Candles)",
        L && L.sides ? `${L.sides.length} candle colours known, learned: ${L.learned.map((x) => x[0] + " " + x[1]).join(", ") || "none yet"}` : "",
        L && L.mono && L.mono.length ? `candles found by shape: ${L.mono.map((x) => x[0] + " " + x[1]).join(", ")}` : "",
        `${r.canvases} chart canvas(es)`,
        L && L.drawCalls ? `draws: ${L.drawCalls.fillRect || 0} rect, ${L.drawCalls.fill || 0} path, ${L.drawCalls.pathLook || 0} path-looks, ${L.drawCalls.lines || 0} lines` : "",
        L && L.lastTally && L.lastTally.length ? `most drawn: ${L.lastTally.slice(0, 4).map((x) => x[0] + "\u00D7" + x[1]).join(", ")}` : "",
        r.stack && r.stack.length ? `over the chart: ${r.stack.join(" < ")}` : "",
      ].filter(Boolean).join(" \u00B7 ");
      out.textContent = `Lightweight Charts detected. Wallpaper and candle colours are supported here (broker pills are not, that chart has none). ${facts}. If something isn't showing, copy this whole message and send it to me.`;
      return;
    }
    if (!r.hooked && r.engine !== "advanced") {
      out.textContent = `No TradingView chart detected on this page${r.canvases ? ` (${r.canvases} canvas chart(s), but not one I recognise)` : ""}. ${r.stack && r.stack.length ? `Over the chart: ${r.stack.join(" < ")}. ` : ""}Copy this and send it to me.`;
      return;
    }
    if (!r.hooked) { out.textContent = "The skin engine isn't active on this tab yet. Turn Priism Skins on here, let the chart load, then click again."; return; }
    if (r.caught && r.caught.length) {
      const list = r.caught.slice(0, 6).map((s) => `“${s.text}” (${s.font}${s.box ? "" : ", no box"})`).join("; ");
      out.textContent = `Caught ${r.caught.length} pill(s): ${list}. If these aren't restyling, tell me and paste this text.`;
    } else if (r.paths && (r.paths.pasted.length || r.paths.hidden.length)) {
      const p = r.paths;
      out.textContent = `Your labels are drawn once and pasted onto the chart; restyling now handles that${p.pasted.length ? ` (${p.pasted.length} styled: ${p.pasted.slice(0, 4).map((x) => "\u201c" + x.t + "\u201d").join(", ")})` : ""}. If they still look unchanged, copy this and send it to me. Site: ${r.frame}. Seen: ${JSON.stringify(r.where)}.`;
    } else if ((r.onChart && r.onChart.length) || (r.dom && r.dom.length)) {
      const nonAxis = (r.onChart || []).filter((s) => s.w !== "axis");
      const list = (nonAxis.length ? nonAxis : r.onChart || []).slice(0, 8).map((s) => `\u201c${s.t}\u201d [${s.w}, ${s.f}]`).join("; ");
      out.textContent = `No pills matched yet. Site: ${r.frame}. Numbers drawn: ${JSON.stringify(r.where)}. ${list ? "Samples: " + list + "." : ""}${r.dom && r.dom.length ? " Labels made of page elements: " + r.dom.join("; ") + "." : ""} Keep a trade or order open, click Diagnose again, then copy this and send it to me.`;
    } else {
      out.textContent = "No chart text seen yet. Make sure a position/order is open on the chart, wait a moment, then click again.";
    }
  } catch (e) { out.textContent = "Diagnose failed: " + (e && e.message ? e.message : "unknown") + ". Send me a screenshot of the pills instead."; }
};

function syncWatermark() {
  $("wmOn").checked = cfg.wmOn;
  $("wmText").value = cfg.wmText || "";
  seg("wmStyle", [["corner", "Corner"], ["tiled", "Tiled"]], () => cfg.wmStyle, (v) => { set({ wmStyle: v, wmOn: true }); $("wmOn").checked = true; syncWatermark(); });
  const tiled = cfg.wmStyle === "tiled";
  $("wmPosRow").hidden = tiled;
  $("wmDriftRow").hidden = tiled;
  seg("wmPos", [["tl", cornerIcon(2.5, 2.5)], ["tr", cornerIcon(8.5, 2.5)], ["center", cornerIcon(5.5, 4.5)], ["bl", cornerIcon(2.5, 6.5)], ["br", cornerIcon(8.5, 6.5)]],
    () => cfg.wmPos, (v) => { set({ wmPos: v, wmOn: true }); $("wmOn").checked = true; });
  seg("wmDrift", [[false, "Fixed"], [true, "Drift"]], () => !!cfg.wmDrift, (v) => set({ wmDrift: v }));
  $("wmOpacity").value = cfg.wmOpacity; $("wmOpacityOut").textContent = Math.round(cfg.wmOpacity * 100) + "%";
}
$("wmOn").onchange = (e) => set({ wmOn: e.target.checked });
$("wmText").oninput = (e) => set({ wmText: e.target.value.slice(0, 40), wmOn: cfg.wmOn || !!e.target.value });
$("wmOpacity").oninput = (e) => { set({ wmOpacity: +e.target.value }); $("wmOpacityOut").textContent = Math.round(+e.target.value * 100) + "%"; };

const ADJUST_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","sides","leftBar","uiFont","uiSize","uiAccent","react","reactStrength","vignette","calm"];
const STYLE_KEYS = [...CHART_KEYS, "candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont","bracketOn","bracketSize","bracketBack","bracketFill","bracketText","bracketProfit","bracketLoss","bracketBorderColor","bracketBorderW","bracketLineColor","bracketLineW"];
$("reset").onclick = () => applyWithUndo(Object.fromEntries(ADJUST_KEYS.map((k) => [k, DEFAULTS[k]])), "Adjustments reset.");
$("resetStyle").onclick = () => applyWithUndo(Object.fromEntries(STYLE_KEYS.map((k) => [k, DEFAULTS[k]])), "Style reset.");

// ---------- other sites (prop-firm platforms with TradingView charts, e.g. TopstepX) ----------
// Looks at the page you're on; if it has a TradingView-style chart, offers to turn on there.
const BUILT_IN = /(^|\.)tradingview\.com$/;
async function siteBar() {
  if (!EXT_MODE || IS_TAB || !chrome.tabs || !chrome.scripting) return;
  const bar = $("siteBar");
  let tab; try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { return; }
  if (!tab || !/^https?:/.test(tab.url || "")) return;
  const url = new URL(tab.url), origin = url.origin, host = url.hostname.replace(/^www\./, "");
  if (BUILT_IN.test(url.hostname)) return;                       // always on there
  const show = (cls, title, hintText, btn, onClick) => {
    bar.hidden = false; bar.className = "sitebar" + (cls ? " " + cls : "");
    $("siteTitle").textContent = title; $("siteHint").textContent = hintText;
    $("siteBtn").textContent = btn; $("siteBtn").onclick = onClick;
  };
  const enabled = await WickedSites.find(origin);
  if (enabled) {
    // a Lightweight Charts platform (lw.js marks it): hide the options that only style TradingView's own interface
    chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: () => document.documentElement.getAttribute("data-bd-lw") === "on" })
      .then((rs) => { if (rs.some((r) => r.result)) document.body.classList.add("lw-page"); }).catch(() => {});
    return show("on", `On for ${host}`, "Wallpaper, candles, candle looks and chart lines (Style tab) work here. The TradingView tab styles TradingView's own panels and menus; this platform's own layout around the chart stays as it is.", "Turn off", async () => {
      await WickedSites.disable(enabled.origin); chrome.tabs.reload(tab.id); window.close();
    });
  }
  // Detect a chart: in the page, in same-origin chart iframes, or by an iframe that loads a charting library.
  let found = { chart: false, frames: [] };
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
      const SEL = ".chart-markup-table, .chart-container";
      let chart = !!document.querySelector(SEL); const frames = new Set();
      for (const f of document.querySelectorAll("iframe")) {
        try { if (f.contentDocument && f.contentDocument.querySelector(SEL)) chart = true; } catch {}
        const src = f.src || "";
        if (/charting_library|tradingview|tv[-_]?chart/i.test(src) || /^tradingview_/i.test(f.id || "") || /tradingview/i.test(f.name || "")) {
          chart = true;
          try { const o = new URL(src, location.href).origin; if (/^https?:/.test(o) && o !== location.origin) frames.add(o); } catch {}
        }
      }
      if (window.TradingView || window.tvWidget) chart = true;
      return { chart, frames: [...frames] };
    } });
    found = res.result || found;
  } catch {}
  const turnOn = async () => {
    const origins = [origin, ...found.frames];
    // Chrome's permission prompt often closes this panel before the answer comes back, which is why it used to take
    // two clicks. So the background worker is told what we're turning on, and finishes the job itself if we're gone.
    await chrome.storage.local.set({ pendingSite: { origin, frames: found.frames, tabId: tab.id, t: Date.now() } });
    const ok = await chrome.permissions.request({ origins: origins.map((o) => o + "/*") });  // Chrome shows its prompt here
    if (!ok) { chrome.storage.local.remove("pendingSite"); $("siteHint").textContent = "Not turned on: Chrome's permission was declined."; return; }
    await chrome.storage.local.remove("pendingSite");
    await WickedSites.enable(origin, found.frames);
    chrome.tabs.reload(tab.id); window.close();
  };
  if (found.chart) {
    show("", `Chart found on ${host}`, "Chrome will ask to let Priism Skins \u201cread and change\u201d this site. That's Chrome's standard wording for drawing on a page; it only paints the chart and never reads your account or orders.", "Turn on here", turnOn);
  } else {
    show("", `No TradingView chart found on ${host}`, "Open a chart on this site first, or turn it on anyway if the chart loads later.", "Turn on anyway", turnOn);
  }
}

// ---------- updates ----------
// Store installs are updated by Chrome automatically; we just say what's new afterwards.
// Zip / "Load unpacked" installs can't auto-update, so we check GitHub Releases (max every 6 h) and offer the download.
const REPO = "arcuto29/wicked-skins";
const RELEASES = `https://github.com/${REPO}/releases`;
const STORE_URL = "https://chromewebstore.google.com/detail/priism-skins-for-tradingv/ilmoloilbeblmgkanbiekhdegagfdloa";
const newer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
function notice(title, hintText, linkText, href, onClose) {
  const n = $("notice"); n.hidden = false;
  $("noticeTitle").textContent = title; $("noticeHint").textContent = hintText;
  $("noticeLink").textContent = linkText; $("noticeLink").href = href;
  $("noticeClose").innerHTML = ICON_X; $("noticeClose").onclick = () => { n.hidden = true; onClose && onClose(); };
}
async function updates() {
  if (!EXT_MODE || IS_TAB) return;
  const me = chrome.runtime.getManifest().version;
  if (window.WickedMigrate) await WickedMigrate.run().catch(() => {});
  // Another copy of the extension drew on a chart recently (content.js reports it).
  const { dupSeen } = await chrome.storage.local.get("dupSeen");
  if (dupSeen && Date.now() - dupSeen < 3 * 86400e3) {
    notice("Two copies of Priism Skins are installed", `Remove the older one so they don't fight (keep version ${me}). It's under chrome://extensions.`,
      "Open extensions", "#", () => chrome.storage.local.remove("dupSeen"));
    $("noticeLink").onclick = (e) => { e.preventDefault(); chrome.tabs.create({ url: "chrome://extensions" }); };
    return;
  }
  const { justUpdated } = await chrome.storage.local.get("justUpdated");
  if (justUpdated && justUpdated.to === me) {
    return notice(`Updated to ${me}`, "New features and fixes are live.", "What's new", `${RELEASES}/tag/v${me}`,
      () => chrome.storage.local.remove("justUpdated"));
  }
  // The Chrome Web Store adds update_url to the manifest of store installs; zip/unpacked installs don't have it.
  if ("update_url" in chrome.runtime.getManifest()) return;
  const { updCheck } = await chrome.storage.local.get("updCheck");
  let latest = updCheck && Date.now() - updCheck.at < 6 * 3600e3 ? updCheck.latest : null;
  if (!latest) {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
      if (r.ok) latest = String((await r.json()).tag_name || "").replace(/^v/, "");
    } catch {}
    if (latest) chrome.storage.local.set({ updCheck: { at: Date.now(), latest } });
  }
  if (latest && newer(latest, me)) {
    // the easiest fix is the store copy, which updates itself from then on (remove this copy afterwards)
    notice(`Update available: ${latest}`, "Get Priism Skins from the Chrome Web Store and it updates itself from now on (then remove this copy in chrome://extensions). Or download the new zip and reload it as before.",
      "Chrome Web Store", STORE_URL);
  }
}

// ---------- master switch + boot ----------
$("enabled").onchange = (e) => { set({ enabled: e.target.checked }); $("status").textContent = e.target.checked ? "On" : "Off"; };
chrome.storage.local.get(DEFAULTS, (stored) => {
  cfg = { ...DEFAULTS, ...stored };
  $("enabled").checked = cfg.enabled; $("status").textContent = cfg.enabled ? "On" : "Off";
  renderChartStyle(); syncPanels(); syncSkinView(); syncShortcuts(); syncTimer(); syncExtras();
  if (+cfg.clipLen) clipSecs = [5, 10, 30, 60, 120].includes(+cfg.clipLen) ? +cfg.clipLen : clipSecs;
  renderSkins(); renderMedia(); renderLoadouts(); syncTune(); renderCandles(); syncWatermark(); renderQuick(); initWorkshop(); syncSessions(); syncSymbols(); syncCharts(); syncPnl(); syncBracket(); syncGoal(); renderJournal(); if ($("clipMode")) syncClipMode();
  siteBar();
  deskCard(); if (DESK && !IS_TAB) { setupDesk(); renderSkins(); renderQuick(); }
  detectCharts();
  updates();
  const q = new URLSearchParams(location.search);
  if (q.get("page")) {
    document.body.classList.add("page");
    const pg = q.get("page") === "media" ? "skins" : q.get("page");          // Uploads now lives in Skins > My uploads
    if (q.get("page") === "media") { skinView = "mine"; localStorage.setItem("skinView", "mine"); }
    const b = document.querySelector(`#nav button[data-tab="${pg}"]`); b && b.click(); if (q.get("page") === "media") syncSkinView();
    if (q.has("pick")) hint("Click “Add video / image” or drop files here.");
    convertPending();
  }
});

// ---------- Find a setting: search every section of every tab, jump straight to it ----------
(function finder() {
  const inp = $("finder"), out = $("finderOut"); if (!inp) return;
  const TAB_NAME = {}; document.querySelectorAll("#nav [data-tab]").forEach((b) => (TAB_NAME[b.dataset.tab] = b.textContent.trim()));
  function index() {
    const items = [];
    document.querySelectorAll("main section").forEach((sec) => {
      const tab = sec.id.replace("tab-", "");
      sec.querySelectorAll("details.grp").forEach((d) => {
        const title = (d.querySelector("summary") || {}).textContent || "";
        const words = [title, ...[...d.querySelectorAll(".row > span:first-child, .hint, .cpart-h b, .looklabel, label")].map((e) => e.textContent)].join(" ");
        items.push({ tab, el: d, title: title.trim(), words: words.toLowerCase() });
        d.querySelectorAll(".row > span:first-child, .cpart-h b").forEach((r) => items.push({ tab, el: d, row: r, title: title.trim() + " \u203a " + r.textContent.trim(), words: (r.textContent + " " + title).toLowerCase() }));
      });
    });
    return items;
  }
  const go = (it) => {
    const b = document.querySelector(`#nav [data-tab="${it.tab}"]`); if (b) b.click();
    it.el.open = true;
    const target = it.row ? it.row.closest(".row, .cpart") || it.el : it.el;
    setTimeout(() => { target.scrollIntoView({ block: "center", behavior: "smooth" }); target.classList.add("found"); setTimeout(() => target.classList.remove("found"), 1600); }, 60);
    inp.value = ""; out.hidden = true;
  };
  inp.oninput = () => {
    const q = inp.value.trim().toLowerCase(); out.innerHTML = "";
    if (q.length < 2) { out.hidden = true; return; }
    // best first: a setting whose own name starts with / contains the words, then section names, then descriptions
    const score = (it) => { const own = (it.row ? it.row.textContent : it.title).trim().toLowerCase();
      return own.startsWith(q) ? 4 : own.includes(q) ? 3 : it.title.toLowerCase().includes(q) ? 2 : 1; };
    const seen = new Set(), hits = index().filter((it) => it.words.includes(q)).map((it) => ({ it, s: score(it) })).sort((a, b) => b.s - a.s)
      .map((x) => x.it).filter((it) => !seen.has(it.title) && seen.add(it.title)).slice(0, 8);
    if (!hits.length) { out.innerHTML = '<div class="fx none">No setting called that. Try another word.</div>'; out.hidden = false; return; }
    for (const it of hits) { const b = document.createElement("button"); b.className = "fx"; b.innerHTML = `<b></b><small></small>`;
      b.querySelector("b").textContent = it.title; b.querySelector("small").textContent = TAB_NAME[it.tab] || it.tab; b.onclick = () => go(it); out.appendChild(b); }
    out.hidden = false;
  };
  inp.onkeydown = (e) => { if (e.key === "Enter") { const f = out.querySelector("button.fx"); if (f) f.click(); } if (e.key === "Escape") { inp.value = ""; out.hidden = true; } };
})();

// ---------- welcome tour (first install) + "what's new" (once after each update) ----------
const WHATS_NEW = ["\u201cDone for today\u201d: a calm reminder the instant you reach your max loss (Trading › Daily goal & limit)",
  "Desktop app: TradingView in tabs, opens with your last layouts and keeps you signed in",
  "Smoother charts: wallpapers are now drawn in the background, leaving TradingView's thread free",
  "nq.vision and other Lightweight Charts platforms: panels, watchlist, ticker, timeframes, crosshair glow, line glow, price scale, brackets, streamer mode and Live mood",
  "TradingView's light theme is readable over your wallpaper, and one tap switches to dark",
  "Candle looks now work on more Lightweight Charts platforms (like nq.vision)",
  "Style your ticker: colour, size, font and glow for the symbol name (Style › Chart lines & ticker)",
  "Trading sounds: a chime at your goal, a warning near your max loss, a ping before the session opens or closes",
  "New Nebula wallpaper: glowing gas clouds and bright stars (Skins › Cosmos)",
  "Streamer mode: show P&L as ticks, points or dollars, and the order panel stays usable",
  "Trade brackets: give the lot size its own colour",
  "One click to turn on a platform, and no page refresh needed after an update",
  "Live mood is back: a soft glow around your chart that follows your P&L or the day's move (Trading)",
  "Desktop app: a full-window design, and sign in to your real TradingView account in the chart window",
  "Sound in clips: your voice, your computer's sound (music, videos), or both (Capture › Clip)",
  "Streamer mode hides your money on screen and in recordings (Capture, or Alt+Shift+P)"];
(function onboarding() {
  let ver = ""; try { ver = chrome.runtime.getManifest().version; } catch {}
  const seen = localStorage.getItem("seenVer");
  if (!seen) {
    localStorage.setItem("seenVer", ver || "1");
    // A hands-on tour: each step can do the thing for you (never a blocking overlay, Skip any time).
    const go = (tab) => { const b = document.querySelector(`#nav button[data-tab="${tab}"]`); if (b) b.click(); };
    const wow = QUICK_LOOKS.filter((q) => groupOf(q) === "Wow" && WickedSkins[q.skin]);
    const steps = [
      ["Pick a look", "One tap puts a matching wallpaper, candles and glow on your chart. Undo is one tap too.",
        ["Try a Wow look", () => { const q = wow[(Math.random() * wow.length) | 0]; if (q) applyWithUndo({ enabled: true, skin: q.skin, ...q.set }, `Look: ${q.name}`); }]],
      ["Make it yours", "Style has 16 candle looks, your candle colours, chart lines and the ticker. TradingView styles its own panels and menus.",
        ["Open Style", () => go("candles")]],
      ["Your platform too", "Trade on a prop firm platform or another charting site (TopstepX, nq.vision…)? Open it, then tap Turn on here at the top of this panel.", null],
      ["Find anything", "Type in \u201cFind any setting\u201d at the top to jump straight to it. Alt+Shift+W on the chart turns everything on or off.", null],
    ];
    // a friendly card at the top (never a blocking overlay)
    let i = 0; const el = $("news"); if (!el) return;
    const draw = () => { const act = steps[i][2];
      el.innerHTML = `<b>Welcome! ${steps[i][0]}</b><p class="hint" style="color:#cfd5e2;margin:2px 0 10px">${steps[i][1]}</p>
      ${act ? `<button class="primary keep" data-a="do" style="width:100%;margin:0 0 10px">${esc(act[0])}</button>` : ""}
      <div class="tour-bar"><div class="dots">${steps.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("")}</div>
      <div><button class="link" data-a="skip" style="margin:0 8px 0 0">Skip</button><button class="${act ? "" : "primary"}" data-a="next">${i < steps.length - 1 ? "Next" : "Let's go"}</button></div></div>`;
      el.hidden = false;
      if (act) el.querySelector("[data-a=do]").onclick = () => { act[1](); if (++i >= steps.length) el.hidden = true; else draw(); };
      el.querySelector("[data-a=skip]").onclick = () => { el.hidden = true; };
      el.querySelector("[data-a=next]").onclick = () => { if (++i >= steps.length) el.hidden = true; else draw(); }; };
    draw();
    return;
  }
  if (ver && seen !== ver && $("news")) {
    $("news").innerHTML = `<button class="x" title="Dismiss">\u2715</button><b>New in ${esc(ver)}</b><ul>${WHATS_NEW.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
    $("news").hidden = false;
    $("news").querySelector(".x").onclick = () => { $("news").hidden = true; localStorage.setItem("seenVer", ver); };
  }
})();

// ---------- keep it uncluttered: a switched-off section shows just its title and one line ----------
// (switch it on and its options appear). Candles stay open: picking a candle look is how most people start.
function syncOffGroups() {
  document.querySelectorAll("details.grp").forEach((d) => {
    const sw = d.querySelector(":scope > summary .switch input");
    d.classList.toggle("is-off", !!sw && !sw.checked && d.dataset.grp !== "candles");
  });
}
document.addEventListener("change", () => setTimeout(syncOffGroups, 0), true);
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("button")) setTimeout(syncOffGroups, 30); }, true);
syncOffGroups(); setTimeout(syncOffGroups, 300);
