/* Priism's update card, shared by the extension panel, the desktop app and Android.
   A white beam goes into a prism and leaves as a spectrum; the new version is written in that light.

   It only ever shows the REAL state it's given (the caller passes what the updater / Chrome reports):
     available    a newer version was found and is downloading (no progress known yet)
     downloading  { percent, transferred, total, speed } from the real download, updated live with update()
     ready        the complete download is verified and waiting: "Restart & update" (never before)
     error        why it stopped (offline, damaged download, file missing...) and "Try again"
     manual       this install can't update itself (loaded unpacked, Android, Mac): what to do, step by step
     updated      once after an update: what came with it (release notes)
   It never pops up over the chart, only inside Priism's own panel. "updated" is a centred card; the others sit
   docked in the corner so they never block the panel while you're trading. Esc / "Not now" closes it.

   PriismUpdateCard.show({ mode, from, to, items, lead, steps, foot, primary, href, onPrimary, later, onLater,
                           percent, transferred, total, speed, error })
   PriismUpdateCard.update({ percent, transferred, total, speed })   // live progress, no re-render
   PriismUpdateCard.isOpen() / mode() / close()                                                                     */
(function (root) {
  const REPO = "arcuto29/priism-skins";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const V = () => root.PriismVersion;
  const label = (v) => (V() ? V().label(v) : String(v || ""));
  const tagOf = (v) => "v" + (V() ? V().canon(v) : String(v || ""));

  // The headlines of a release: the bold start of each top-level bullet in its notes (CHANGELOG.md style).
  function notesFrom(md) {
    const out = [];
    for (const line of String(md || "").split(/\r?\n/)) {
      const m = /^[-*]\s+\*\*(.+?)\*\*/.exec(line);
      if (m) { const t = m[1].replace(/[.:,;]\s*$/, "").trim(); if (t) out.push(t); }
    }
    return out.slice(0, 5);
  }
  // Release notes for a version from GitHub (cached; quietly gives up when offline: the card keeps its fallback).
  async function fetchNotes(version) {
    const key = "puNotes:" + tagOf(version);
    try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && c.length) return c; } catch {}
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 5000);
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${tagOf(version)}`, { headers: { Accept: "application/vnd.github+json" }, signal: ctl && ctl.signal });
      if (!r.ok) return null;
      const items = notesFrom((await r.json()).body);
      if (items.length) try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
      return items.length ? items : null;
    } catch { return null; } finally { clearTimeout(t); }
  }

  const RAYS = ["#ff5f7a", "#ffa04d", "#ffe066", "#2ef2b0", "#19d3ff", "#8f7bff"];
  const scene = (small) => `
    <svg class="pu-scene${small ? " sm" : ""}" viewBox="0 0 240 120" aria-hidden="true">
      <defs>
        <linearGradient id="puBeam" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient>
        <linearGradient id="puEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19d3ff"/><stop offset=".55" stop-color="#2ef2b0"/><stop offset="1" stop-color="#c6ff3d"/></linearGradient>
        <linearGradient id="puGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
        ${RAYS.map((c, i) => `<linearGradient id="puR${i}" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`).join("")}
        <filter id="puGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>
      </defs>
      <g class="pu-rays">${RAYS.map((_, i) => { const y = 50 + i * 9.5, y2 = 14 + i * 19;
        return `<path d="M136 ${y} L238 ${y2} L238 ${y2 + 10} Z" fill="url(#puR${i})" style="--d:${i * 0.35}s"/>`; }).join("")}</g>
      <g filter="url(#puGlow)" opacity=".7"><line x1="0" y1="66" x2="112" y2="60" stroke="#fff" stroke-width="3"/></g>
      <line x1="0" y1="66" x2="112" y2="60" stroke="url(#puBeam)" stroke-width="1.6"/>
      <circle class="pu-spark" r="2.2" fill="#fff"/>
      <path d="M120 18 L160 92 L80 92 Z" fill="url(#puGlass)" stroke="url(#puEdge)" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M120 30 L131 52" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;

  const MB = (b) => (b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB" : (b / 1048576).toFixed(b >= 104857600 ? 0 : 1) + " MB");
  // "48% · 56.3 of 117 MB · 4.2 MB/s" from the real numbers only (nothing shown that isn't known)
  function progressText(p) {
    const parts = [];
    // (a differential download can count its request overhead past the total: never show "0.3 of 0.2 MB")
    if (p.total > 0) parts.push(`${MB(Math.min(p.transferred || 0, p.total))} of ${MB(p.total)}`);
    if (p.speed > 0) parts.push(`${MB(p.speed)}/s`);
    if (p.total > 0 && p.speed > 0 && p.transferred < p.total) { const s = Math.round((p.total - p.transferred) / p.speed); parts.push(s >= 90 ? `about ${Math.round(s / 60)} min left` : `${Math.max(1, s)} s left`); }
    return parts.join(" \u00B7 ");
  }
  const EYEBROW = { available: "Downloading update", downloading: "Downloading update", ready: "Update ready", error: "Update paused",
    manual: "Update available", updated: "Updated" };
  const LEAD = {
    available: "Finding the fastest way to download it. Keep trading: nothing changes until you choose to restart.",
    downloading: "Downloading in the background. Keep trading: nothing changes until you choose to restart.",
    ready: "Downloaded and checked against the release. It takes a few seconds, and your looks, wallpapers and settings stay exactly as they are.",
    updated: "You're on the newest Priism. Here's what came with it:" };

  let open = null;
  function show(o) {
    close();
    const doc = root.document, mode = o.mode || "ready", docked = mode !== "updated" && !o.modal;
    const veil = doc.createElement("div");
    veil.className = "pu-veil" + (docked ? " pu-dock" : "") + " pu-" + mode;
    const btnPrimary = o.primary !== "" && (o.primary || { ready: "Restart & update", error: "Try again", updated: "Got it" }[mode]);
    const btnLater = o.later !== "" && (o.later || { ready: "Not now", downloading: "Hide", available: "Hide", error: "Close", manual: "Not now" }[mode]);
    const prog = mode === "downloading" || mode === "available";
    veil.innerHTML = `
      <div class="pu-card" role="${docked ? "status" : "dialog"}" ${docked ? 'aria-live="polite"' : 'aria-modal="true"'} aria-labelledby="puTitle">
        <div class="pu-haze"></div>
        ${scene(docked)}
        <div class="pu-eyebrow"><i></i>${esc(EYEBROW[mode] || "Update")}${V() && V().isBeta(o.to) ? '<b class="pu-beta">Beta</b>' : ""}</div>
        <h2 id="puTitle" class="pu-ver">${o.from ? `<span class="pu-old">${esc(label(o.from))}</span><span class="pu-arrow"></span>` : ""}<span class="pu-new">${esc(label(o.to))}</span></h2>
        <p class="pu-lead">${esc(mode === "error" ? (o.error && o.error.message) || o.lead || "The update stopped. Nothing was changed." : o.lead || LEAD[mode] || "")}</p>
        ${prog ? `<div class="pu-prog${mode === "available" ? " wait" : ""}" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="pu-bar"><i></i></div><div class="pu-pct"><b></b><span></span></div></div>` : ""}
        ${o.steps && o.steps.length ? `<ol class="pu-steps">${o.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}
        <ul class="pu-list"></ul>
        ${btnPrimary || btnLater ? `<div class="pu-btns">
          ${btnLater ? `<button class="pu-later" type="button">${esc(btnLater)}</button>` : ""}
          ${btnPrimary ? (o.href ? `<a class="pu-go" href="${esc(o.href)}" target="_blank" rel="noopener">${esc(btnPrimary)}</a>` : `<button class="pu-go" type="button">${esc(btnPrimary)}</button>`) : ""}
        </div>` : ""}
        ${o.foot !== "" ? `<div class="pu-foot">${esc(o.foot || { ready: "Not now? It waits until you're ready.", downloading: "You choose when it installs.", available: "You choose when it installs.", updated: "Find everything new in the panel, as always." }[mode] || "")}</div>` : ""}
      </div>`;
    const list = veil.querySelector(".pu-list");
    const fill = (items) => {
      list.innerHTML = (items || []).slice(0, 5).map((t, i) => `<li style="--c:${RAYS[(i + 3) % RAYS.length]}">${esc(t)}</li>`).join("");
      list.hidden = !list.children.length;
    };
    fill(o.items);
    if (o.to && mode !== "error") fetchNotes(o.to).then((n) => { if (n && open && open.veil === veil) fill(n); });

    const done = (fn) => { close(); try { fn && fn(); } catch {} };
    const later = () => done(o.onLater);
    const go = veil.querySelector(".pu-go");
    if (go) go.onclick = (e) => { if (o.href && !o.onPrimary) return; if (o.href) e.preventDefault(); done(o.onPrimary || o.onLater); };
    const lb = veil.querySelector(".pu-later"); if (lb) lb.onclick = later;
    if (!docked) veil.addEventListener("mousedown", (e) => { if (e.target === veil) later(); });
    const key = (e) => { if (e.key === "Escape" && (!docked || veil.contains(doc.activeElement))) { e.preventDefault(); later(); } };
    doc.addEventListener("keydown", key, true);
    doc.body.appendChild(veil);
    open = { veil, key, mode, o };
    if (prog) update(o);
    requestAnimationFrame(() => { veil.classList.add("in"); if (!docked) { try { (go || lb).focus({ preventScroll: true }); } catch {} } });   // a docked card never takes the keyboard
    return veil;
  }
  // live download progress (the card stays the same element: no flicker, a smooth bar)
  function update(p) {
    if (!open || !(open.mode === "downloading" || open.mode === "available")) return false;
    const v = open.veil, pr = v.querySelector(".pu-prog"); if (!pr) return false;
    const known = p.total > 0 || p.percent > 0;
    if (known && open.mode === "available") { open.mode = "downloading"; v.classList.replace("pu-available", "pu-downloading"); pr.classList.remove("wait");
      v.querySelector(".pu-lead").textContent = LEAD.downloading; }
    const pct = Math.max(0, Math.min(100, +p.percent || 0));
    if (known) { v.querySelector(".pu-bar i").style.width = pct.toFixed(1) + "%"; pr.setAttribute("aria-valuenow", pct.toFixed(0));
      v.querySelector(".pu-pct b").textContent = Math.floor(pct) + "%"; v.querySelector(".pu-pct span").textContent = progressText(p); }
    return true;
  }
  function close() {
    if (!open) return;
    root.document.removeEventListener("keydown", open.key, true);
    open.veil.remove(); open = null;
  }
  root.PriismUpdateCard = { show, update, close, notesFrom, fetchNotes, progressText, isOpen: () => !!open, mode: () => (open ? open.mode : null) };
})(window);
