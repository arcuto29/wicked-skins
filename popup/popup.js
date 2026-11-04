const $ = (id) => document.getElementById(id);
const MAX_MB = 50;
const LOOK_KEYS = ["opacity","overOpacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer","candleOn","candleUp","candleDown","candleGlow","candlePreset","react","reactStrength"];
const DEFAULTS = {
  enabled: true, skin: "aurora", mediaId: null, media: [], loadouts: [],
  opacity: 1, overOpacity: 0.35, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
  fps: "auto", fit: "cover", posX: 50, posY: 50,
  powerSaver: false, paused: false, bw: false, layer: "behind",
  candleOn: false, candleUp: "#00ffa3", candleDown: "#ff2e97", candleGlow: 0, candlePreset: "neon",
  react: "off", reactStrength: 0.6, pnlSide: "long", pnlEntry: 0, pnlSymbol: "",
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
let previews = [], activeCat = "All";
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
    card.onclick = () => { set({ skin: id }); renderSkins(); renderMedia(); };
    $("skinCards").appendChild(card);
  }
}
let last = 0;
(function loop(now) {
  requestAnimationFrame(loop);
  if (now - last < 66) return; // ~15fps previews
  const dt = (now - last) / 1000; last = now;
  previews.forEach((p) => p.skin.frame((p.t += Math.min(dt, 0.1)), Math.min(dt, 0.1)));
})(0);

// ---------- candles ----------
const CANDLE_PRESETS = [
  ["neon", "Neon Pulse", "#00ffa3", "#ff2e97"],
  ["ice", "Glacier", "#8be9ff", "#3d5afe"],
  ["lava", "Magma", "#ffb300", "#ff3d00"],
  ["gold", "Aurum", "#ffd36b", "#a67c1a"],
  ["ghost", "Ghost", "#f5f5f5", "#5c5c5c"],
  ["amethyst", "Amethyst", "#b388ff", "#4a5a6a"],
  ["dusk", "Dusk", "#ffb74d", "#ec407a"],
  ["acid", "Acid", "#c6ff00", "#7c4dff"],
  ["crimson", "Crimson", "#ff5252", "#8a0f2e"],
  ["deepsea", "Deepsea", "#4dd0e1", "#5c6bc0"],
];
const bars = (up, down) => {
  // 8 tiny candles: [open, close, low, high] in a 0-30 box
  const d = [[20,16,22,12],[16,18,19,13],[18,12,20,10],[12,14,16,9],[14,9,15,6],[9,10,12,5],[10,5,11,2],[5,6,8,1]];
  return `<svg viewBox="0 0 80 30" preserveAspectRatio="none">${d.map(([o, c, lo, hi], i) => {
    const col = c <= o ? up : down; // lower y = higher price
    const x = 5 + i * 10, top = Math.min(o, c), ht = Math.max(2, Math.abs(o - c));
    return `<line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${col}"/><rect x="${x - 3}" y="${top}" width="6" height="${ht}" fill="${col}"/>`;
  }).join("")}</svg>`;
};
function renderCandles() {
  $("candleOn").checked = cfg.candleOn;
  $("candleGlow").value = cfg.candleGlow; $("candleGlowOut").textContent = Math.round(cfg.candleGlow * 100) + "%";
  $("candleUp").value = cfg.candleUp; $("candleDown").value = cfg.candleDown;
  const box = $("candleCards"); box.innerHTML = "";
  CANDLE_PRESETS.forEach(([id, name, up, down]) => {
    const b = document.createElement("button");
    b.className = "card preset" + (cfg.candlePreset === id ? " on" : "");
    b.innerHTML = bars(up, down) + `<div class="label">${esc(name)}</div>`;
    b.onclick = () => { set({ candleOn: true, candleUp: up, candleDown: down, candlePreset: id }); renderCandles(); };
    box.appendChild(b);
  });
}
$("candleOn").onchange = (e) => set({ candleOn: e.target.checked });
$("candleGlow").oninput = (e) => { set({ candleGlow: +e.target.value }); $("candleGlowOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("candleUp").oninput = (e) => { set({ candleUp: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; };
$("candleDown").oninput = (e) => { set({ candleDown: e.target.value, candleOn: true, candlePreset: "custom" }); $("candleOn").checked = true; };

// ---------- my media ----------
function renderMedia() {
  const box = $("mediaCards"); box.innerHTML = "";
  cfg.media.forEach((m) => {
    const card = document.createElement("div");
    card.className = "card" + (cfg.skin === "media" && cfg.mediaId === m.id ? " on" : "");
    const el = document.createElement(m.type === "video" ? "video" : "img");
    el.src = m.src;
    if (m.type === "video") Object.assign(el, { muted: true, loop: true, autoplay: true });
    card.append(el);
    card.insertAdjacentHTML("beforeend", `<div class="label"><span>${esc(m.name)}</span><button class="x" title="Remove">✕</button></div>`);
    card.onclick = (e) => {
      if (e.target.classList.contains("x")) {
        const media = cfg.media.filter((x) => x.id !== m.id);
        const wasActive = cfg.skin === "media" && cfg.mediaId === m.id;
        set(wasActive ? { media, skin: "aurora", mediaId: null } : { media });
      } else set({ skin: "media", mediaId: m.id });
      renderMedia(); renderSkins();
    };
    box.appendChild(card);
  });
}
// Formats Chrome/Edge/Electron can decode natively. Anything else gets a clear message.
const IMAGE_EXT = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", jfif: "image/jpeg", pjpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", apng: "image/apng", bmp: "image/bmp",
  ico: "image/x-icon", svg: "image/svg+xml" };
const VIDEO_EXT = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/mp4", // most .mov are H.264
  ogv: "video/ogg", ogg: "video/ogg", mkv: "video/webm" };                                   // mkv w/ VP8/VP9/AV1 plays
const UNSUPPORTED = { heic: "HEIC (iPhone photo): export it as JPG or PNG first",
  heif: "HEIF: export it as JPG or PNG first", tif: "TIFF: convert it to PNG first", tiff: "TIFF: convert it to PNG first",
  avi: "AVI: convert it to MP4 first", wmv: "WMV: convert it to MP4 first", flv: "FLV: convert it to MP4 first",
  psd: "PSD: export it as PNG first" };

function classify(f) {
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  if (UNSUPPORTED[ext]) return { err: UNSUPPORTED[ext] };
  if (f.type.startsWith("video/") || VIDEO_EXT[ext]) return { type: "video", mime: f.type || VIDEO_EXT[ext] };
  if (f.type.startsWith("image/") || IMAGE_EXT[ext]) return { type: "image", mime: f.type || IMAGE_EXT[ext] };
  return { err: "not an image or video file" };
}

// Actually try to decode it, so users find out now instead of seeing a black chart.
function canDecode(type, src) {
  return new Promise((ok) => {
    const el = document.createElement(type === "video" ? "video" : "img");
    const done = (v) => { clearTimeout(t); el.removeAttribute("src"); ok(v); };
    const t = setTimeout(() => done(false), 8000);
    if (type === "video") { el.muted = true; el.preload = "metadata"; el.onloadeddata = () => done(el.videoWidth > 0); }
    else el.onload = () => done(el.naturalWidth > 0);
    el.onerror = () => done(false);
    el.src = src;
  });
}

const readAsDataURL = (f, mime) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(mime ? r.result.replace(/^data:[^;,]*/, "data:" + mime) : r.result);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

async function addFiles(files) {
  const added = [], problems = [];
  $("mediaHint").textContent = "Checking files…";
  for (const f of files) {
    const c = classify(f);
    if (c.err) { problems.push(`${f.name}: ${c.err}`); continue; }
    if (f.size > MAX_MB * 1024 * 1024) { problems.push(`${f.name}: over ${MAX_MB} MB`); continue; }
    const src = await readAsDataURL(f, c.mime);
    if (!(await canDecode(c.type, src))) {
      problems.push(`${f.name}: this ${c.type}'s format/codec can't play in the browser` +
        (c.type === "video" ? " (try exporting as MP4 H.264 or WebM)" : ""));
      continue;
    }
    added.push({ id: uid(), name: f.name.replace(/\.[^.]+$/, ""), type: c.type, src });
  }
  if (added.length) {
    const last = added[added.length - 1];
    set({ media: [...cfg.media, ...added], skin: "media", mediaId: last.id });
    renderMedia(); renderSkins();
  }
  $("mediaHint").textContent = problems.length
    ? "Skipped " + problems.join(" · ")
    : added.length ? `Added ${added.length} file${added.length > 1 ? "s" : ""}.` : "Files stay on your computer. Max 50 MB each.";
}

$("file").onchange = async (e) => { await addFiles([...e.target.files]); e.target.value = ""; };

// Drag & drop anywhere on the My media tab
const mediaTab = $("tab-media");
mediaTab.addEventListener("dragover", (e) => { e.preventDefault(); mediaTab.classList.add("drop"); });
mediaTab.addEventListener("dragleave", () => mediaTab.classList.remove("drop"));
mediaTab.addEventListener("drop", (e) => { e.preventDefault(); mediaTab.classList.remove("drop"); addFiles([...e.dataTransfer.files]); });

// ---------- loadouts ----------
const snapshot = () => Object.fromEntries(LOOK_KEYS.map((k) => [k, cfg[k]]));
function renderLoadouts() {
  const box = $("loCards"); box.innerHTML = "";
  cfg.loadouts.forEach((lo) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="label"><span>${esc(lo.name)}<br><small style="color:#8b8e9c">${esc(lo.skin === "media" ? "My media" : (WickedSkins[lo.skin]?.name || lo.skin))}</small></span><button class="x" title="Delete">✕</button></div>`;
    card.onclick = (e) => {
      if (e.target.classList.contains("x")) { set({ loadouts: cfg.loadouts.filter((x) => x.id !== lo.id) }); }
      else {
        const hasMedia = lo.skin !== "media" || cfg.media.some((m) => m.id === lo.mediaId);
        set({ ...lo.look, skin: hasMedia ? lo.skin : cfg.skin, mediaId: hasMedia ? lo.mediaId : cfg.mediaId });
        syncTune(); renderSkins(); renderMedia(); renderCandles();
      }
      renderLoadouts();
    };
    box.appendChild(card);
  });
}
$("loSave").onclick = () => {
  const name = $("loName").value.trim(); if (!name) return;
  set({ loadouts: [{ id: uid(), name, skin: cfg.skin, mediaId: cfg.mediaId, look: snapshot() }, ...cfg.loadouts] });
  $("loName").value = ""; renderLoadouts();
};
$("loExport").onclick = () => {
  // Media files are not included in exports (size + rights); only skin id and look.
  const data = cfg.loadouts.map(({ id, name, skin, look }) => ({ name, skin: skin === "media" ? "aurora" : skin, look }));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "wicked-skins-loadouts.json"; a.click();
};
$("loImport").onchange = async (e) => {
  try {
    const arr = JSON.parse(await e.target.files[0].text());
    const clean = arr.filter((x) => x && typeof x.name === "string" && WickedSkins[x.skin]).map((x) => ({
      id: uid(), name: x.name.slice(0, 40), skin: x.skin, mediaId: null,
      look: Object.fromEntries(LOOK_KEYS.filter((k) => x.look && k in x.look).map((k) => [k, x.look[k]])),
    }));
    set({ loadouts: [...clean, ...cfg.loadouts] }); renderLoadouts();
  } catch { alert("That file isn't a valid loadouts export."); }
  e.target.value = "";
};

// ---------- tune ----------
const SLIDERS = [
  ["opacity", "Opacity", 0, 1, 0.05, (v) => Math.round(v * 100) + "%"],
  ["overOpacity", "Over chart", 0.05, 1, 0.05, (v) => Math.round(v * 100) + "%"],
  ["dim", "Dim", 0, 0.9, 0.05, (v) => Math.round(v * 100) + "%"],
  ["blur", "Blur", 0, 20, 1, (v) => v + "px"],
  ["vividness", "Vividness", 0, 2, 0.05, (v) => Math.round(v * 100) + "%"],
  ["tint", "Tint", 0, 360, 5, (v) => (v ? v + "°" : "Off")],
  ["speed", "Speed", 0.25, 3, 0.05, (v) => v.toFixed(1) + "×"],
  ["posX", "Left · Right", 0, 100, 1, (v) => (v === 50 ? "Middle" : v + "%")],
  ["posY", "Up · Down", 0, 100, 1, (v) => (v === 50 ? "Middle" : v + "%")],
];
function seg(id, options, get, onPick) {
  const box = $(id); box.innerHTML = "";
  options.forEach(([val, label]) => {
    const b = document.createElement("button");
    b.textContent = label; b.className = get() === val ? "on" : "";
    b.onclick = () => { onPick(val); seg(id, options, get, onPick); };
    box.appendChild(b);
  });
}
function syncTune() {
  $("sliders").innerHTML = "";
  SLIDERS.forEach(([key, label, min, max, step, fmt]) => {
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}"><output></output>`;
    const inp = row.querySelector("input"), out = row.querySelector("output");
    inp.value = cfg[key]; out.textContent = fmt(+cfg[key]);
    inp.oninput = () => { set({ [key]: +inp.value }); out.textContent = fmt(+inp.value); };
    inp.ondblclick = () => { inp.value = DEFAULTS[key]; inp.oninput(); }; // double-click resets
    $("sliders").appendChild(row);
  });
  seg("fps", [["auto", "Auto"], [20, "20"], [30, "30"], [60, "60"]], () => cfg.fps, (v) => set({ fps: v }));
  seg("fit", [["cover", "Fill"], ["fit", "Fit"], ["stretch", "Stretch"]], () => cfg.fit, (v) => set({ fit: v }));
  seg("powerSaver", [[false, "Off"], [true, "On"]], () => cfg.powerSaver, (v) => set({ powerSaver: v }));
  seg("motion", [[false, "Play"], [true, "Pause"]], () => cfg.paused, (v) => set({ paused: v }));
  seg("layer", [["behind", "Behind candles"], ["over", "Over chart"]], () => cfg.layer, (v) => set({ layer: v }));
  seg("react", [["off", "Off"], ["market", "Market"], ["pnl", "My P&L"]], () => cfg.react, (v) => { set({ react: v }); syncReact(); });
  seg("pnlSide", [["long", "Long"], ["short", "Short"]], () => cfg.pnlSide, (v) => set({ pnlSide: v }));
  syncReact();
}
function syncReact() {
  $("reactOpts").hidden = cfg.react === "off";
  $("pnlOpts").hidden = cfg.react !== "pnl";
  $("reactStrength").value = cfg.reactStrength;
  $("reactStrengthOut").textContent = Math.round(cfg.reactStrength * 100) + "%";
  $("pnlEntry").value = cfg.pnlEntry || "";
  $("pnlSymbol").value = cfg.pnlSymbol;
  $("reactHint").textContent = cfg.react === "market"
    ? "Chart edges glow green/red with the day's move and pulse on every tick. Skins speed up when price moves."
    : "Glows with your P&L from the entry you type here, worked out on your computer. Never reads your account or positions.";
}
$("reactStrength").oninput = (e) => { set({ reactStrength: +e.target.value }); $("reactStrengthOut").textContent = Math.round(+e.target.value * 100) + "%"; };
$("pnlEntry").oninput = (e) => set({ pnlEntry: +e.target.value || 0 });
$("pnlSymbol").oninput = (e) => set({ pnlSymbol: e.target.value.trim() });
$("reset").onclick = () => { set(Object.fromEntries(LOOK_KEYS.map((k) => [k, DEFAULTS[k]]))); syncTune(); };

// ---------- master switch + boot ----------
$("enabled").onchange = (e) => { set({ enabled: e.target.checked }); $("status").textContent = e.target.checked ? "On" : "Off"; };
chrome.storage.local.get(DEFAULTS, (stored) => {
  cfg = { ...DEFAULTS, ...stored };
  $("enabled").checked = cfg.enabled; $("status").textContent = cfg.enabled ? "On" : "Off";
  renderSkins(); renderMedia(); renderLoadouts(); syncTune(); renderCandles();
});
