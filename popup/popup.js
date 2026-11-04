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
const LOOK_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont","react","reactStrength","vignette","calm"];
const DEFAULTS = {
  enabled: true, skin: "aurora", mediaId: null, media: [], loadouts: [],
  opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
  fps: "auto", fit: "cover", posX: 50, posY: 50,
  powerSaver: false, paused: false, bw: false, layer: "behind",
  candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
  react: "off", reactStrength: 0.6,
  wmOn: false, wmPos: "br", vignette: 0, calm: false,
  candleLook: "solid", shiftSpeed: 10,
  lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: false,
  scaleSize: 0, scaleFont: "default",
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
    card.className = "card" + (cfg.skin === id ? " on" : "");
    const cv = document.createElement("canvas");
    cv.width = 160; cv.height = 76;
    const skin = s.create(cv.getContext("2d")); skin.resize(160, 76);
    previews.push({ skin, t: 0 });
    card.append(cv);
    card.insertAdjacentHTML("beforeend", `<span class="live">● LIVE</span><div class="label">${esc(s.name)}</div>`);
    card.onclick = () => { set({ skin: id }); renderSkins(); renderMedia(); syncTune(); };
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
  seg("scaleBg", [["auto", "Auto"], ["glass", "Glass"], ["color", "Colour"], ["default", "TV"]], () => (cfg.scaleBg === "clear" ? "auto" : cfg.scaleBg), (v) => { set({ scaleBg: v }); renderCandles(); });
  seg("scaleLabels", [[false, "Original"], [true, "Candle"]], () => cfg.scaleLabels, (v) => set({ scaleLabels: v }));
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
function refreshAll() { renderSkins(); renderMedia(); renderCandles(); syncTune(); syncWatermark(); renderQuick(); renderLoadouts(); }

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
const IS_TAB = new URLSearchParams(location.search).has("page");
const MAX_FILE_MB = EXT_MODE ? 2048 : MAX_MB;
const converting = {}; // id -> progress 0..1

function renderMedia() {
  const box = $("mediaCards"); box.innerHTML = "";
  cfg.media.forEach((m) => {
    const card = document.createElement("div");
    card.className = "card" + (cfg.skin === "media" && cfg.mediaId === m.id ? " on" : "");
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
        set(wasActive ? { media, skin: "aurora", mediaId: null } : { media });
      } else if (!m.pending) set({ skin: "media", mediaId: m.id });
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
        download(`${lo.name.replace(/[^\w-]+/g, "-").toLowerCase() || "look"}.wicked.json`, [exportable(lo)]);
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
$("loExport").onclick = () => download("wicked-skins-looks.json", cfg.loadouts.map(exportable));
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
  seg("smooth", [["eco", "Eco"], ["balanced", "Balanced"], ["smooth", "Smooth"]],
    () => (cfg.powerSaver ? "eco" : String(cfg.fps) === "60" || cfg.fps === "auto" ? "smooth" : "balanced"),
    (v) => set(v === "eco" ? { powerSaver: true, fps: 30 } : v === "balanced" ? { powerSaver: false, fps: 30 } : { powerSaver: false, fps: 60 }));
  seg("fit", [["cover", "Cover"], ["fit", "Contain"], ["stretch", "Stretch"]], () => cfg.fit, (v) => set({ fit: v }));
  seg("calm", [[false, "Off"], [true, "On"]], () => cfg.calm, (v) => set({ calm: v }));
  seg("motion", [[false, "On"], [true, "Paused"]], () => cfg.paused, (v) => set({ paused: v }));
  seg("layer", [["behind", "Under chart"], ["over", "On top"]], () => cfg.layer, (v) => { set({ layer: v }); syncTune(); });
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

// ---------- watermark (logo + name) ----------
function syncWatermark() {
  $("wmOn").checked = cfg.wmOn;
  seg("wmPos", [["tl", cornerIcon(2.5, 2.5)], ["tr", cornerIcon(8.5, 2.5)], ["center", cornerIcon(5.5, 4.5)], ["bl", cornerIcon(2.5, 6.5)], ["br", cornerIcon(8.5, 6.5)]],
    () => cfg.wmPos, (v) => set({ wmPos: v, wmOn: true }));
}
$("wmOn").onchange = (e) => set({ wmOn: e.target.checked });

const ADJUST_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","react","reactStrength","vignette","calm"];
const STYLE_KEYS = ["candleOn","candleUp","candleDown","candleGlow","candlePreset","candleLook","shiftSpeed","lineGlow","scaleText","scaleGlow","scaleBold","scaleBg","scaleBgColor","scaleLabels","scaleSize","scaleFont"];
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
    show("", `Chart found on ${host}`, "Chrome will ask to let Wicked Skins \u201cread and change\u201d this site. That's Chrome's standard wording for drawing on a page; it only paints the chart and never reads your account or orders.", "Turn on here", turnOn);
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
    notice("Two copies of Wicked Skins are installed", `Remove the older one so they don't fight (keep version ${me}). It's under chrome://extensions.`,
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
    notice(`Update available: ${latest}`, "Download it, replace the files in your Wicked Skins folder, then click the reload arrow on its card in chrome://extensions. Your settings are kept.",
      "Download", `${RELEASES}/latest`);
  }
}

// ---------- master switch + boot ----------
$("enabled").onchange = (e) => { set({ enabled: e.target.checked }); $("status").textContent = e.target.checked ? "On" : "Off"; };
chrome.storage.local.get(DEFAULTS, (stored) => {
  cfg = { ...DEFAULTS, ...stored };
  $("enabled").checked = cfg.enabled; $("status").textContent = cfg.enabled ? "On" : "Off";
  renderSkins(); renderMedia(); renderLoadouts(); syncTune(); renderCandles(); syncWatermark(); renderQuick();
  siteBar();
  updates();
  const q = new URLSearchParams(location.search);
  if (q.get("page")) {
    document.body.classList.add("page");
    const b = document.querySelector(`#nav button[data-tab="${q.get("page")}"]`); b && b.click();
    if (q.has("pick")) hint("Click “Add video / image” or drop files here.");
    convertPending();
  }
});
