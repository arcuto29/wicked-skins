const $ = (id) => document.getElementById(id);
const MAX_MB = 50;
const LOOK_KEYS = ["opacity","dim","blur","vividness","tint","speed","fps","fit","posX","posY","powerSaver","paused","bw","layer"];
const DEFAULTS = {
  enabled: true, skin: "aurora", mediaId: null, media: [], loadouts: [],
  opacity: 1, dim: 0.3, blur: 0, vividness: 1, tint: 0, speed: 1,
  fps: "auto", fit: "cover", posX: 50, posY: 50,
  powerSaver: false, paused: false, bw: false, layer: "behind",
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
$("file").onchange = async (e) => {
  const added = [];
  for (const f of e.target.files) {
    if (f.size > MAX_MB * 1024 * 1024) { $("mediaHint").textContent = `${f.name} is over ${MAX_MB} MB.`; continue; }
    const src = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
    added.push({ id: uid(), name: f.name.replace(/\.[^.]+$/, ""), type: f.type.startsWith("video") ? "video" : "image", src });
  }
  if (added.length) {
    const last = added[added.length - 1];
    set({ media: [...cfg.media, ...added], skin: "media", mediaId: last.id });
    renderMedia(); renderSkins();
  }
  e.target.value = "";
};

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
        syncTune(); renderSkins(); renderMedia();
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
}
$("reset").onclick = () => { set(Object.fromEntries(LOOK_KEYS.map((k) => [k, DEFAULTS[k]]))); syncTune(); };

// ---------- master switch + boot ----------
$("enabled").onchange = (e) => { set({ enabled: e.target.checked }); $("status").textContent = e.target.checked ? "On" : "Off"; };
chrome.storage.local.get(DEFAULTS, (stored) => {
  cfg = { ...DEFAULTS, ...stored };
  $("enabled").checked = cfg.enabled; $("status").textContent = cfg.enabled ? "On" : "Off";
  renderSkins(); renderMedia(); renderLoadouts(); syncTune();
});
