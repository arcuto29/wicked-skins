/* "Update ready" / "Updated" card, shared by the extension panel and the desktop app's panel.
   A white beam goes into a prism and leaves as a spectrum; the new version is written in that light.
   It only ever appears in Priism's own panel, never over the chart, and Esc / "Not now" closes it.

   PriismUpdateCard.show({
     mode: "ready" | "updated",
     from: "0.1.50", to: "0.1.51",
     items: [...],            // shown straight away (fallback); replaced by the release's headlines when they load
     lead, foot,              // optional text overrides
     primary: "Update now",   // button text
     onPrimary(), onLater(),  // onLater also runs on Esc / clicking outside
   })                                                                                                            */
(function (root) {
  const REPO = "arcuto29/wicked-skins";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // The headlines of a release: the bold start of each top-level bullet in its notes (CHANGELOG.md style).
  function notesFrom(md) {
    const out = [];
    for (const line of String(md || "").split(/\r?\n/)) {
      const m = /^[-*]\s+\*\*(.+?)\*\*/.exec(line);
      if (m) { const t = m[1].replace(/[.:,;]\s*$/, "").trim(); if (t) out.push(t); }
    }
    return out.slice(0, 5);
  }
  // Release notes for a version from GitHub (cached; quietly gives up when offline).
  async function fetchNotes(version) {
    const key = "puNotes:" + version;
    try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && c.length) return c; } catch {}
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 5000);
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/v${version}`, { headers: { Accept: "application/vnd.github+json" }, signal: ctl && ctl.signal });
      if (!r.ok) return null;
      const items = notesFrom((await r.json()).body);
      if (items.length) try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
      return items.length ? items : null;
    } catch { return null; } finally { clearTimeout(t); }
  }

  const RAYS = ["#ff5f7a", "#ffa04d", "#ffe066", "#2ef2b0", "#19d3ff", "#8f7bff"];
  const scene = () => `
    <svg class="pu-scene" viewBox="0 0 240 120" aria-hidden="true">
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

  let open = null;
  function show(o) {
    close();
    const doc = root.document, ready = o.mode !== "updated";
    const veil = doc.createElement("div");
    veil.className = "pu-veil";
    veil.innerHTML = `
      <div class="pu-card" role="dialog" aria-modal="true" aria-labelledby="puTitle">
        <div class="pu-haze"></div>
        ${scene()}
        <div class="pu-eyebrow"><i></i>${ready ? "Update ready" : "Updated"}</div>
        <h2 id="puTitle" class="pu-ver">${o.from ? `<span class="pu-old">${esc(o.from)}</span><span class="pu-arrow"></span>` : ""}<span class="pu-new">${esc(o.to)}</span></h2>
        <p class="pu-lead">${esc(o.lead || (ready ? "Downloaded and waiting. It takes a few seconds, and your look and settings stay exactly as they are." : "You're on the newest Priism. Here's what came with it:"))}</p>
        <ul class="pu-list"></ul>
        <div class="pu-btns">
          ${ready ? `<button class="pu-later" type="button">Not now</button>` : ""}
          <button class="pu-go" type="button">${esc(o.primary || (ready ? "Update now" : "Got it"))}</button>
        </div>
        ${o.foot !== "" ? `<div class="pu-foot">${esc(o.foot || (ready ? "Your charts stay open while Priism updates." : "Find everything new in the panel, as always."))}</div>` : ""}
      </div>`;
    const list = veil.querySelector(".pu-list");
    const fill = (items) => {
      list.innerHTML = (items || []).slice(0, 5).map((t, i) => `<li style="--c:${RAYS[(i + 3) % RAYS.length]}">${esc(t)}</li>`).join("");
      list.hidden = !list.children.length;
    };
    fill(o.items);
    if (o.to) fetchNotes(o.to).then((n) => { if (n && open && open.veil === veil) fill(n); });

    const done = (fn) => { close(); try { fn && fn(); } catch {} };
    const later = () => done(o.onLater);
    veil.querySelector(".pu-go").onclick = () => done(o.onPrimary || o.onLater);
    const lb = veil.querySelector(".pu-later"); if (lb) lb.onclick = later;
    veil.addEventListener("mousedown", (e) => { if (e.target === veil) later(); });
    const key = (e) => { if (e.key === "Escape") { e.preventDefault(); later(); } };
    doc.addEventListener("keydown", key, true);
    doc.body.appendChild(veil);
    open = { veil, key };
    requestAnimationFrame(() => { veil.classList.add("in"); try { veil.querySelector(".pu-go").focus({ preventScroll: true }); } catch {} });
    return veil;
  }
  function close() {
    if (!open) return;
    root.document.removeEventListener("keydown", open.key, true);
    open.veil.remove(); open = null;
  }
  root.PriismUpdateCard = { show, close, notesFrom, fetchNotes, isOpen: () => !!open };
})(window);
