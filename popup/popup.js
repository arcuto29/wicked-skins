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
const LOOK_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont","react","reactStrength","vignette","calm","sessionOn","sessionSkins","multi","chartSkins","bracketOn","bracketSize","bracketBack","bracketFill","bracketText","bracketProfit","bracketLoss","bracketBorderColor","bracketBorderW","bracketLineColor","bracketLineW","pnlShow","pnlStyle","pnlPos","pnlSize","pnlBack","pnlUp","pnlDown"];
const DEFAULTS = {
  enabled: true, skin: "aurora", mediaId: null, media: [], loadouts: [],
  opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
  fps: "auto", fit: "cover", posX: 50, posY: 50,
  powerSaver: false, paused: false, bw: false, layer: "behind",
  candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
  react: "off", reactStrength: 0.6,
  wmOn: false, wmPos: "br", wmText: "", wmStyle: "corner", wmOpacity: 0.85, wmDrift: false, sides: "off", uiFont: "default", uiSize: 0, uiAccent: "", vignette: 0, calm: false,
  sessionOn: false, sessionSkins: { asia: "galaxy", london: "rain", ny: "cybergrid", off: "ocean" },
  symbolOn: false, symbolSkins: {}, autoQuality: true, autoMatch: false,
  candleLook: "solid", shiftSpeed: 10,
  lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: true,
  scaleSize: 0, scaleFont: "default",
  multi: "span", chartSkins: {}, pnlShow: false, pnlStyle: "color", pnlPos: "tc", pnlSize: 1, pnlBack: "glass", pnlUp: "", pnlDown: "",
  bracketOn: false, bracketSize: 1, bracketBack: "keep",
  bracketFill: "", bracketText: "", bracketProfit: "", bracketLoss: "",
  bracketBorderColor: "", bracketBorderW: 0, bracketLineColor: "", bracketLineW: 0,
  goalOn: false, goalTarget: 500, goalLimit: 300, goalPos: "bl", journalOn: false, clipMode: "chart", clipFps: 30,
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
  const cats = ["All", ...new Set(Object.values(WickedSkins).map((s) => s.cat))];
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
  for (const [id, s] of Object.entries(WickedSkins)) {
    if (activeCat !== "All" && s.cat !== activeCat) continue;
    const card = document.createElement("button");
    card.className = "card" + (currentSrc() === id ? " on" : "");
    const cv = document.createElement("canvas");
    cv.width = 160; cv.height = 76;
    const skin = s.create(cv.getContext("2d")); skin.resize(160, 76);
    previews.push({ skin, t: 0 });
    card.append(cv);
    card.insertAdjacentHTML("beforeend", `<span class="live">● LIVE</span><div class="label">${esc(s.name)}</div>`);
    card.onclick = () => pickSource(id);
    $("skinCards").appendChild(card);
  }
}
let last = 0;
(function loop(now) {
  requestAnimationFrame(loop);
  if (now - last < 66) return; // ~15fps previews
  const dt = (now - last) / 1000; last = now;
  for (const p of [...previews, ...quickPreviews, ...lookPreviews]) p.skin.frame((p.t += Math.min(dt, 0.1)), Math.min(dt, 0.1));
})(0);

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
function renderCandles() {
  $("candleOn").checked = cfg.candleOn;
  seg("autoMatch", [[false, "Off"], [true, "On"]], () => !!cfg.autoMatch, (v) => { set({ autoMatch: v, ...(v ? { candleOn: true } : {}) }); if (v) $("candleOn").checked = true; });
  // Match-wallpaper only makes sense on your own uploaded wallpaper.
  const onMedia = cfg.skin === "media";
  $("autoMatchRow").hidden = !onMedia;
  $("autoMatchHint").hidden = !onMedia;
  seg("candleLook", [["solid", "Solid"], ["neon", "Tube"], ["prism", "Rainbow"], ["shift", "Cycle"]], () => cfg.candleLook,
    (v) => { set({ candleLook: v, candleOn: true }); $("candleOn").checked = true; renderCandles(); });
  $("shiftRow").hidden = cfg.candleLook !== "shift";
  $("shiftSpeed").value = cfg.shiftSpeed; $("shiftSpeedOut").textContent = cfg.shiftSpeed + "s";
  $("lookHint").textContent = LOOK_HINT[cfg.candleLook] || "";
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
$("candleGlow").oninput = (e) => { set({ candleGlow: +e.target.value }); $("candleGlowOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("candleUp").oninput = (e) => { set({ candleUp: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; };
$("candleDown").oninput = (e) => { set({ candleDown: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; };

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
function refreshAll() { renderSkins(); renderMedia(); renderCandles(); syncTune(); syncWatermark(); renderQuick(); renderLoadouts(); syncSessions(); syncSymbols(); syncCharts(); syncPnl(); syncBracket(); syncGoal(); renderJournal(); if ($("clipMode")) syncClipMode(); }

// ---------- one-click looks: skin + candles + glow + price scale in one tap ----------
const QUICK_LOOKS = [
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
function renderQuick() {
  const box = $("quickLooks"); if (!box) return;
  box.innerHTML = ""; quickPreviews = [];
  for (const q of QUICK_LOOKS) {
    const on = cfg.skin === q.skin && cfg.candleOn && cfg.candleUp === q.set.candleUp && cfg.candleLook === q.set.candleLook;
    const card = document.createElement("button");
    card.className = "card" + (on ? " on" : "");
    const cv = document.createElement("canvas"); cv.width = 160; cv.height = 64;
    const sk = WickedSkins[q.skin].create(cv.getContext("2d")); sk.resize(160, 64); quickPreviews.push({ skin: sk, t: 0 });
    card.append(cv);
    card.insertAdjacentHTML("beforeend", `<div class="bars">${bars(q.set.candleUp, q.set.candleDown)}</div><div class="label"><span>${esc(q.name)}<small>${esc(q.sub)}</small></span></div>`);
    card.onclick = () => applyWithUndo({ enabled: true, skin: q.skin, ...q.set }, `Applied ${q.name}.`);
    box.appendChild(card);
  }
}

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
  $("deskHint").textContent = open ? "Your wallpaper and candle colours are live on the chart." : "Open it here and your skin loads in.";
  const btn = $("deskBtn");
  btn.textContent = open ? "Focus chart" : "Open with skins";
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
let wsSort = "popular", wsPage = 0, wsItems = [];
const W = () => window.Workshop;

// The extension Workshop is browse + use only — no account. Sharing/liking/reporting and admin review all live
// on the website (login there), which avoids a sign-in wall and the free-tier email limits inside the popup.
const WS_SITE = () => (window.WORKSHOP_CONFIG && window.WORKSHOP_CONFIG.siteUrl) || "https://arcuto29.github.io/wicked-skins/";
function wsTabs() {
  const box = $("wsTabs"); box.innerHTML = "";
  for (const [k, label] of [["popular", "Popular"], ["new", "New"]]) {
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
  try {
    const rows = await W().list(wsSort, wsPage);
    wsItems = reset ? rows : [...wsItems, ...rows];
    $("wsMore").hidden = rows.length < 24;
    $("wsMsg").textContent = wsItems.length ? "" : "No wallpapers yet. Be the first — submit one on the website!";
  } catch (e) { $("wsMsg").textContent = "Couldn't load the Workshop: " + e.message; }
  wsRender();
}
function wsRender() {
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
    toast(`“${it.title}” is on your chart and in your Uploads.`);
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
  let loaded = false;
  document.querySelector('#nav [data-tab="workshop"]').addEventListener("click", () => { if (!loaded) { loaded = true; wsLoad(true); } });
}

// ---------- saved looks ----------
const snapshot = () => Object.fromEntries(LOOK_KEYS.map((k) => [k, cfg[k]]));
const lookPreviews = [];
const sameLook = (lo) => lo.skin === cfg.skin && (lo.skin !== "media" || lo.mediaId === cfg.mediaId) &&
  ["candleOn", "candleUp", "candleDown", "candleLook", "lineGlow", "dim"].every((k) => JSON.stringify(lo.look[k]) === JSON.stringify(cfg[k]));
function describe(lo) {
  const sk = lo.skin === "media" ? (cfg.media.find((m) => m.id === lo.mediaId)?.name || "Upload") : (WickedSkins[lo.skin]?.name || lo.skin);
  const preset = lo.look.candleOn ? (CANDLE_PRESETS.find(([, , u, d]) => u === lo.look.candleUp && d === lo.look.candleDown)?.[1] || "Custom colours") : "Chart colours";
  const style = { solid: "", neon: " · Tube", prism: " · Rainbow", shift: " · Cycle" }[lo.look.candleLook] || "";
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
function parseLookCode(code) {
  const raw = String(code || "").trim();
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
  const code = makeLookCode(($("loName") && $("loName").value.trim()) || "");
  const done = await copyText(code);
  if ($("codeInput")) $("codeInput").value = code;
  codeMsg(done ? "Copied! Paste it anywhere to share your look." : "Couldn't copy — select the code above and copy it manually.", done);
};
if ($("codeApply")) {
  const apply = () => {
    const parsed = parseLookCode($("codeInput").value);
    if (!parsed) return codeMsg("That isn't a valid look code (it should start with PRIISM1-).", false);
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
let clipSecs = 5;
// Chart only = we redraw the chart + effects ourselves (fast, no prompts). Whole screen = Chrome's screen share,
// which records exactly what you see (every effect, uploaded wallpapers, the lot) after you pick what to share.
const CLIP_HINTS = {
  chart: "Records an animated clip (WebM) of your chart with the live wallpaper and effects moving, from 2 seconds up to 2 minutes. Click Record, then close this panel if you like: it downloads by itself when it ends. A badge on the chart shows the countdown; click it to stop and save early. Keep the chart tab visible. An uploaded wallpaper can't be read this way; use Whole screen for that.",
  screen: "Records exactly what you see, so every effect and any uploaded wallpaper is in it. After you click Record, a card appears on your chart: click \u201cChoose what to record\u201d and pick Entire Screen (or a window / this tab) in Chrome's box. It records for the length below, then downloads by itself. Stop early with Chrome's \u201cStop sharing\u201d button.",
};
const syncClipMode = () => {
  seg("clipFps", [[30, "30 fps"], [60, "60 fps"]], () => (+cfg.clipFps === 60 ? 60 : 30), (v) => { set({ clipFps: v }); syncClipMode(); });
  seg("clipMode", [["chart", "Chart only"], ["screen", "Whole screen"]], () => cfg.clipMode || "chart", (v) => { set({ clipMode: v }); syncClipMode(); });
  if ($("clipHint")) $("clipHint").textContent = CLIP_HINTS[cfg.clipMode === "screen" ? "screen" : "chart"];
  if ($("clipBtn")) $("clipBtn").textContent = cfg.clipMode === "screen" ? "Record screen" : "Record";
};
if ($("clipMode")) syncClipMode();
if ($("clipLen")) seg("clipLen", [[5, "5s"], [10, "10s"], [30, "30s"], [60, "1 min"], [120, "2 min"]], () => clipSecs, (v) => { clipSecs = v; if ($("clipCustom")) $("clipCustom").value = ""; });
// a custom length (2-120 s) overrides the preset
const clipLength = () => { const c = Math.round(+($("clipCustom") && $("clipCustom").value)); return c >= 2 ? Math.min(120, c) : clipSecs; };
if ($("clipBtn")) $("clipBtn").onclick = async () => {
  const msg = $("clipMsg"), prev = $("clipPreview"), vid = $("clipVid"), btn = $("clipBtn");
  const show = (t, ok) => { msg.style.display = ""; msg.textContent = t; msg.style.color = ok === false ? "#ff8a8a" : ""; };
  if (!EXT_MODE || IS_TAB) return show("Open this on a TradingView chart tab to record.", false);
  const secs = clipLength();
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
function syncGoal() {
  if (!$("goalOn")) return;
  $("goalOn").checked = !!cfg.goalOn;
  if (document.activeElement !== $("goalTarget")) $("goalTarget").value = cfg.goalTarget;
  if (document.activeElement !== $("goalLimit")) $("goalLimit").value = cfg.goalLimit;
  seg("goalPos", [["bl", "Bottom left"], ["tl", "Top left"], ["tc", "Top"]], () => cfg.goalPos || "bl", (v) => set({ goalPos: v }));
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
      meta.innerHTML = `<b>${esc(e.sym || "Trade")}</b> <span class="${e.v >= 0 ? "jup" : "jdn"}">${esc(fmtMoneyP(e.v, e.unit))}</span><small>${esc(when)} \u00B7 held ${fmtDurP(e.secs || 0)}</small>`;
      const del = document.createElement("button"); del.className = "x"; del.title = "Delete"; del.innerHTML = ICON_X;
      del.onclick = async () => { const cur = (await storeGet({ journal: [] })).journal || []; chrome.storage.local.set({ journal: cur.filter((x) => x.id !== e.id) }, renderJournal); };
      row.append(meta, del); box.append(row);
    }
  });
}
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
  $("sidesRow").hidden = cfg.layer === "over";
  $("sidesHint").hidden = cfg.layer === "over";
  seg("sides", [["off", "Chart only"], ["glass", "Glass"], ["clear", "Clear"]], () => cfg.sides || "off", (v) => set({ sides: v }));
  // Interface (fonts / size / accent for TradingView's own panels)
  seg("uiFont", [["default", "Default"], ["mono", "Mono"], ["rounded", "Rounded"]], () => cfg.uiFont || "default", (v) => set({ uiFont: v }));
  seg("uiSize", [[0, "Normal"], [1, "Large"]], () => (+cfg.uiSize || 0), (v) => set({ uiSize: v }));
  seg("uiAccentMode", [["off", "Default"], ["custom", "Custom"]], () => (cfg.uiAccent ? "custom" : "off"),
    (v) => { set({ uiAccent: v === "custom" ? ($("uiAccent").value || "#2ef2b0") : "" }); syncTune(); });
  $("uiAccent").value = cfg.uiAccent || "#2ef2b0"; $("uiAccent").hidden = !cfg.uiAccent;
  seg("react", [["off", "Off"], ["market", "Price"], ["pnl", "Position"]], () => cfg.react, (v) => { set({ react: v }); syncReact(); });
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
          window.__bdDiagSeen = [];
          if (!window.__bdDiagProbe) {
            window.__bdDiagProbe = 1; const o = C.fillText;
            C.fillText = function (t) {
              try {
                const c = this.canvas, inPane = c && c.closest && c.closest(".chart-markup-table") && !c.closest("[class*=time-axis]");
                if (inPane && /[0-9]/.test(String(t)) && window.__bdDiagSeen && window.__bdDiagSeen.length < 40) {
                  const key = String(t).slice(0, 16) + this.font;
                  if (!window.__bdDiagSeen.some((s) => s.k === key)) window.__bdDiagSeen.push({ k: key, t: String(t).slice(0, 16), f: this.font, a: this.textAlign });
                }
              } catch {}
              return o.apply(this, arguments);
            };
          }
        } catch {}
      },
    });
    // nudge the chart so it repaints into our probe, then wait a beat
    await new Promise((r) => setTimeout(r, 900));
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
        return { hooked: !!window.__bdHooked, ver: window.__bdHookVer || null, caught: d ? d.samples : null, onChart: window.__bdDiagSeen || [], engine, canvases };
      },
    });
    const score = (x) => x && x.result ? ((x.result.caught ? x.result.caught.length * 100 : 0) + (x.result.onChart ? x.result.onChart.length : 0) + (x.result.engine && x.result.engine !== "unknown" ? 5 : 0) + (x.result.hooked ? 1 : 0)) : -1;
    const best = (results || []).sort((a, b) => score(b) - score(a))[0];
    const r = best && best.result;
    if (!r) { out.textContent = "Couldn't read the chart. Make sure Priism Skins is on for this tab."; return; }
    // Engine check first — if it's Lightweight Charts, no amount of "turning on" will skin it with today's build.
    if (r.engine === "lightweight") {
      out.textContent = "This chart is TradingView Lightweight Charts — a different engine Priism Skins doesn't support yet (candles/brackets won't apply). Send me this message and I'll look at an adapter.";
      return;
    }
    if (!r.hooked && r.engine !== "advanced") {
      out.textContent = `No TradingView (Advanced Charts) chart detected here${r.canvases ? ` (${r.canvases} canvas chart(s) on the page, but not a supported engine)` : ""}. Priism Skins only skins TradingView's Advanced Charts. Paste me this line.`;
      return;
    }
    if (!r.hooked) { out.textContent = "The skin engine isn't active on this tab yet. Turn Priism Skins on here, let the chart load, then click again."; return; }
    if (r.caught && r.caught.length) {
      const list = r.caught.slice(0, 6).map((s) => `“${s.text}” (${s.font}${s.box ? "" : ", no box"})`).join("; ");
      out.textContent = `Caught ${r.caught.length} pill(s): ${list}. If these aren't restyling, tell me and paste this text.`;
    } else if (r.onChart && r.onChart.length) {
      const list = r.onChart.slice(0, 8).map((s) => `“${s.t}” [${s.f}]`).join("; ");
      out.textContent = `No pills matched yet. Chart text seen: ${list}. Copy this and send it to me — it shows your pill's font so I can match it.`;
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

const ADJUST_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","sides","uiFont","uiSize","uiAccent","react","reactStrength","vignette","calm"];
const STYLE_KEYS = ["candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont","bracketOn","bracketSize","bracketBack","bracketFill","bracketText","bracketProfit","bracketLoss","bracketBorderColor","bracketBorderW","bracketLineColor","bracketLineW"];
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
    return show("on", `On for ${host}`, "Skins, candles and glow are active on this site's charts.", "Turn off", async () => {
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
    const ok = await chrome.permissions.request({ origins: origins.map((o) => o + "/*") });  // Chrome shows its prompt here
    if (!ok) { $("siteHint").textContent = "Not turned on: Chrome's permission was declined."; return; }
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
    notice(`Update available: ${latest}`, "Download it, replace the files in your Priism Skins folder, then click the reload arrow on its card in chrome://extensions. Your settings are kept.",
      "Download", `${RELEASES}/latest`);
  }
}

// ---------- master switch + boot ----------
$("enabled").onchange = (e) => { set({ enabled: e.target.checked }); $("status").textContent = e.target.checked ? "On" : "Off"; };
chrome.storage.local.get(DEFAULTS, (stored) => {
  cfg = { ...DEFAULTS, ...stored };
  $("enabled").checked = cfg.enabled; $("status").textContent = cfg.enabled ? "On" : "Off";
  renderSkins(); renderMedia(); renderLoadouts(); syncTune(); renderCandles(); syncWatermark(); renderQuick(); initWorkshop(); syncSessions(); syncSymbols(); syncCharts(); syncPnl(); syncBracket(); syncGoal(); renderJournal(); if ($("clipMode")) syncClipMode();
  siteBar();
  deskCard();
  detectCharts();
  updates();
  const q = new URLSearchParams(location.search);
  if (q.get("page")) {
    document.body.classList.add("page");
    const b = document.querySelector(`#nav button[data-tab="${q.get("page")}"]`); b && b.click();
    if (q.has("pick")) hint("Click “Add video / image” or drop files here.");
    convertPending();
  }
});
