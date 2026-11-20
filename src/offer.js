/* "Turn on Priism Skins here?" on trading platforms Priism knows (manifest: the offer.js content script and its
   host_permissions). It only runs in the top page, and only until you answer.
   - Already on for this site (sites.js), Priism turned off, or no plan (no code / key, and Free isn't open): nothing.
   - A chart shows up: a small card offers to turn it on. One click and the background worker registers the site
     (sites.js enable), then the page reloads skinned. No trip to the toolbar icon, so it works in an installed
     platform app window too (TopstepX installed from Chrome), where there is no toolbar.
   - "Not now" hides the card in this tab; "Never here" stops asking on this site (you can still turn it on from the
     Priism icon). Turning a site off in the panel also stops the card from asking.
   Reads nothing from the page except whether a chart is there; never touches orders, account data or the network. */
(function () {
  if (window !== window.top || window.__bdOffer) return;
  window.__bdOffer = true;
  const origin = location.origin, host = location.hostname.replace(/^www\./, "");
  if (sessionStorage.getItem("bdOfferLater")) return;
  // A chart: TradingView's charting library in the page or in an iframe, or a big drawn chart (Lightweight Charts)
  const chartFrames = () => {
    let direct = !!document.querySelector(".chart-markup-table, .chart-container, .tv-lightweight-charts"), chart = direct;
    const frames = new Set();
    for (const f of document.querySelectorAll("iframe")) {
      try { if (f.contentDocument && f.contentDocument.querySelector(".chart-markup-table, .chart-container, .tv-lightweight-charts")) chart = direct = true; } catch {}
      const src = f.src || "";
      if (/charting_library|tradingview|tv[-_]?chart/i.test(src) || /^tradingview_/i.test(f.id || "") || /tradingview/i.test(f.name || "")) {
        chart = true;
        try { const o = new URL(src, location.href).origin; if (/^https:/.test(o) && o !== origin) frames.add(o); } catch {}
      }
    }
    if (!direct) for (const c of document.querySelectorAll("canvas")) { const r = c.getBoundingClientRect(); if (r.width >= 400 && r.height >= 250) { chart = direct = true; break; } }
    return chart ? { direct, frames: [...frames] } : null;   // direct: the chart is on this site (page or same-site frame)
  };
  chrome.storage.local.get({ sites: [], siteOfferNo: {}, enabled: true, invite: null }, (s) => {
    if (chrome.runtime.lastError) return;
    if (s.enabled === false || !((s.invite && s.invite.ok) || (window.PriismPass && window.PriismPass.FREE_TIER))) return;   // (an invite / key, or Free is open)
    if (s.sites.some((x) => x.origin === origin) || s.siteOfferNo[origin]) return;
    let tries = 0;
    const look = () => {
      if (window.__bdContentAlive) return;   // Priism already runs on this page (content.js, same extension world): nothing to offer
      const found = chartFrames();
      if (found) return show(found);
      if (++tries < 120) setTimeout(look, tries < 40 ? 1500 : 5000);   // a platform can take a while to open its chart
    };
    setTimeout(look, 1500);
  });

  function show(found) {
    const host$ = document.createElement("div"); host$.id = "bd-offer";
    host$.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647";
    const root = host$.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      .c{display:flex;align-items:center;gap:10px;padding:10px 12px 10px 14px;border-radius:12px;background:rgba(14,17,26,.94);color:#e9ebf2;
        font:500 13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 34px -8px rgba(0,0,0,.7);border:1px solid rgba(125,249,255,.25);max-width:min(92vw,620px)}
      b{color:#7df9ff;font-weight:600} .t{flex:1} button{font:600 12.5px system-ui,-apple-system,"Segoe UI",sans-serif;border-radius:8px;padding:6px 11px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e9ebf2;white-space:nowrap}
      button.p{background:linear-gradient(135deg,#2ef2b0,#19d3ff);color:#06121a;border:0} button:hover{filter:brightness(1.12)}</style>
      <div class="c" role="dialog" aria-label="Priism Skins"><span class="t"><b>Priism Skins</b> \u00B7 turn on for ${host.replace(/[<>&"]/g, "")}? The page reloads with your look.</span>
      <button class="p" id="on">Turn on</button><button id="later">Not now</button><button id="never">Never here</button></div>`;
    const txt = root.querySelector(".t"), close = () => host$.remove();
    root.getElementById("later").onclick = () => { sessionStorage.setItem("bdOfferLater", "1"); close(); };
    root.getElementById("never").onclick = () => { chrome.storage.local.get({ siteOfferNo: {} }, (s) => { s.siteOfferNo[origin] = "never"; chrome.storage.local.set({ siteOfferNo: s.siteOfferNo }); }); close(); };
    root.getElementById("on").onclick = () => {
      txt.textContent = "Turning on\u2026";
      chrome.runtime.sendMessage({ priism: "site-on", frames: found.frames, direct: found.direct }, (r) => {
        if (!chrome.runtime.lastError && r && r.ok) return;            // the page reloads now
        // the chart comes from another site Chrome hasn't allowed yet: only Chrome's own prompt (the Priism icon) can
        txt.textContent = r && r.missing && r.missing.length
          ? `The chart here loads from ${r.missing.map((o) => o.replace(/^https:\/\//, "")).join(", ")}. Click the Priism Skins icon \u2192 Turn on here, and allow it.`
          : "Couldn't turn on here. Click the Priism Skins icon \u2192 Turn on here.";
      });
    };
    (document.body || document.documentElement).appendChild(host$);
  }
})();
