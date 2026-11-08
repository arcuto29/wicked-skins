/* Homepage: live playground (the extension's own wallpaper + candle code from lib/), feature tour, smart download. */
(function () {
  const $ = (id) => document.getElementById(id), S = window.SITE || {};
  const SK = window.WickedSkins || {}, CL = window.__bdCandleLooks;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- scroll reveal ----------
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

  // ---------- playground ----------
  const WALLS = [["blackhole", "Event Horizon"], ["inkflow", "Ink Flow"], ["aurora", "Polar Lights"], ["cybergrid", "Cyber Grid"], ["oilslick", "Oil Slick"], ["ocean", "Tide"]].filter(([k]) => SK[k]);
  const LOOKS = ["solid", "neon", "glass", "chrome", "holo", "lava", "pill"].filter((k) => !CL || CL.META[k]);
  const COLS = [["#ffd27a", "#8c6bff"], ["#00ffa3", "#ff2e97"], ["#26a69a", "#ef5350"], ["#7df9ff", "#ff5ec8"], ["#ffffff", "#5c5f6e"]];
  const st = { wall: WALLS[0] ? WALLS[0][0] : null, look: "glass", col: 0, stream: false };
  const bg = $("pgBg"), ch = $("pgChart");
  if (bg && ch) {
    const chip = (box, items, isOn, pick) => { box.innerHTML = ""; for (const [v, label] of items) { const b = document.createElement("button"); b.className = "chip" + (isOn(v) ? " on" : ""); b.textContent = label; b.onclick = () => { pick(v); chip(box, items, isOn, pick); }; box.appendChild(b); } };
    chip($("pgSkins"), WALLS, (v) => v === st.wall, (v) => { st.wall = v; mountWall(); });
    chip($("pgLooks"), LOOKS.map((k) => [k, CL ? CL.META[k].name : k]), (v) => v === st.look, (v) => { st.look = v; });
    const sws = $("pgCols"); COLS.forEach(([u, d], i) => { const b = document.createElement("button"); b.className = "sw" + (i === st.col ? " on" : ""); b.style.setProperty("--u", u); b.style.setProperty("--d", d); b.title = "Candle colours";
      b.onclick = () => { st.col = i; sws.querySelectorAll(".sw").forEach((x, j) => x.classList.toggle("on", j === i)); paintColours(); }; sws.appendChild(b); });
    $("pgStream").onchange = (e) => { st.stream = e.target.checked; };
    const stage = bg.parentElement;
    const paintColours = () => stage.style.setProperty("--pc", COLS[st.col][0]);
    paintColours();

    let skin = null;
    function mountWall() { skin = st.wall && SK[st.wall] ? SK[st.wall].create(bg.getContext("2d")) : null; if (skin) skin.resize(bg.width, bg.height); }
    // price data: a random walk; the last candle moves live, a new one starts every couple of seconds
    let price = 100; const bars = [];
    const newBar = () => { const o = price; bars.push({ o, c: o, h: o, l: o }); if (bars.length > 64) bars.shift(); };
    for (let i = 0; i < 64; i++) { newBar(); const b = bars[bars.length - 1]; for (let k = 0; k < 8; k++) step(b); }
    function step(b) { price += (Math.random() - 0.48) * 0.9; b.c = price; b.h = Math.max(b.h, price); b.l = Math.min(b.l, price); }
    function size() {
      const r = stage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      bg.width = Math.round(r.width * 0.7); bg.height = Math.round(r.height * 0.7); if (skin) skin.resize(bg.width, bg.height);
      ch.width = Math.round(r.width * dpr); ch.height = Math.round(r.height * dpr);
    }
    function drawChart() {
      const g = ch.getContext("2d"), W = ch.width, H = ch.height, dpr = W / (ch.clientWidth || W) || 1, scaleW = (ch.clientWidth < 760 ? 44 : 64) * dpr;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      let lo = Infinity, hi = -Infinity; for (const b of bars) { lo = Math.min(lo, b.l); hi = Math.max(hi, b.h); }
      const pad = (hi - lo) * 0.18 + 0.5, top = H * 0.2, bot = H * 0.84, Y = (v) => bot - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (bot - top);
      // grid
      g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = dpr;
      for (let i = 1; i < 6; i++) { const y = Math.round(top + ((bot - top) * i) / 6) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W - scaleW, y); g.stroke(); }
      const [up, dn] = COLS[st.col], n = bars.length, slot = (W - scaleW - 20 * dpr) / n, bw = Math.max(2 * dpr, slot * 0.62);
      const k = { fill: (a, b, c, d) => g.fillRect(a, b, c, d), style: (v) => { g.fillStyle = v; }, stroke: (v) => { g.strokeStyle = v; },
        strokeRect: (a, b, c, d) => g.strokeRect(a, b, c, d), fillPath: () => g.fill(), px: dpr, yfrac: 0 };
      const meta = CL && CL.META[st.look], glow = meta ? meta.minGlow : 0;
      bars.forEach((b, i) => {
        const isUp = b.c >= b.o, col = isUp ? up : dn, cx = 10 * dpr + slot * (i + 0.5);
        const t0 = Y(Math.max(b.o, b.c)), t1 = Y(Math.min(b.o, b.c)); k.yfrac = t0 / H;
        g.save(); if (glow > 0) { g.shadowColor = col; g.shadowBlur = (4 + glow * 18) * dpr * 0.6; }
        g.fillStyle = CL ? CL.wick(st.look, col, k) : col; g.fillRect(Math.round(cx - dpr / 2), Y(b.h), dpr, Y(b.l) - Y(b.h));
        if (CL) CL.draw(g, st.look, Math.round(cx - bw / 2), t0, Math.round(bw), Math.max(dpr, t1 - t0), col, isUp, k); else { g.fillStyle = col; g.fillRect(cx - bw / 2, t0, bw, Math.max(dpr, t1 - t0)); }
        g.restore();
      });
      // last price line + tag on the scale
      const last = bars[n - 1], ly = Math.round(Y(last.c)) + 0.5, lc = last.c >= last.o ? up : dn;
      g.setLineDash([2 * dpr, 3 * dpr]); g.strokeStyle = lc; g.beginPath(); g.moveTo(0, ly); g.lineTo(W - scaleW, ly); g.stroke(); g.setLineDash([]);
      g.fillStyle = lc; g.fillRect(W - scaleW, ly - 10 * dpr, scaleW, 20 * dpr);
      g.font = `700 ${11 * dpr}px ui-monospace, Menlo, monospace`; g.textBaseline = "middle"; g.textAlign = "center";
      g.fillStyle = "#06110d"; g.fillText(last.c.toFixed(2), W - scaleW / 2, ly);
      g.fillStyle = "rgba(230,235,245,.75)";
      for (let i = 1; i < 6; i++) { const y = top + ((bot - top) * i) / 6, v = (lo - pad) + ((bot - y) / (bot - top)) * (hi - lo + 2 * pad); if (Math.abs(y - ly) > 16 * dpr) g.fillText(v.toFixed(1), W - scaleW / 2, y); }
    }
    // P&L + timer overlays
    let pnl = 1240, tLeft = 2 * 3600 + 14 * 60;
    function overlays() {
      pnl += (Math.random() - 0.45) * 18;
      $("pgPnl").textContent = "P&L " + (st.stream ? "\u2022\u2022\u2022\u2022\u2022" : (pnl >= 0 ? "+$" : "-$") + Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      const h = Math.floor(tLeft / 3600), m = Math.floor((tLeft % 3600) / 60);
      $("pgTimer").textContent = `Globex open \u00B7 NY session opens in ${h}h ${String(m).padStart(2, "0")}m`;
    }
    size(); mountWall(); addEventListener("resize", size);
    let t = 0, last = performance.now(), acc = 0, sec = 0, visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (document.hidden || !visible) return;
      t += dt; acc += dt; sec += dt;
      if (skin) skin.frame(t, dt);
      if (!reduce || acc > 1) { step(bars[bars.length - 1]); if (acc > 2.2) { acc = 0; newBar(); } }
      if (sec > 1) { sec = 0; tLeft = Math.max(0, tLeft - 60); overlays(); }
      drawChart();
    })(last);
    overlays();
  }

  // ---------- tour (same tabs as the panel) ----------
  const TOUR = [
    { tab: "Skins", img: "img/tour-skins.png", h: "Wallpapers and one-tap looks", p: "50 live wallpapers behind your candles, or your own videos and pictures.",
      li: ["31 one-tap looks: wallpaper, candles, glow and scale together", "Groups for Wow, Calm and Glow, plus search", "Keep your own wallpaper and borrow just a look's styling"] },
    { tab: "Style", img: "img/tour-style.png", h: "Candles and every line", p: "16 candle looks in any colours, and every line on the chart styled your way.",
      li: ["Glass, Chrome, Ice, Lava, Holo, 3D, Pixel and more", "Grid, crosshair (with a glow at your pointer), price line, session breaks", "A price scale that stays readable on any wallpaper"] },
    { tab: "TradingView", img: "img/tour-tradingview.png", h: "TradingView itself, in your style", p: "The watchlist, toolbars, Settings window and menus can match your look.",
      li: ["Frosted glass or your own colour", "Top, bottom and left toolbars can let the wallpaper through", "Text always stays readable"] },
    { tab: "Trading", img: "img/tour-trading.png", h: "Built for traders", p: "Readable TP / Stop / P&L labels and the tools prop traders asked for.",
      li: ["One tap makes TP / Stop / P&L easy to see", "Session timer: next open or close for futures, stocks, forex and crypto", "Daily goal & limit bar, plus a picture or clip of every trade"] },
    { tab: "Capture", img: "img/tour-capture.png", h: "Stream and post with confidence", p: "Snapshots and clips with your effects in them, and Streamer mode to hide your money.",
      li: ["Streamer mode: your numbers become dots, on screen and in recordings", "Clips with your voice or computer sound, crop & trim (16:9, 9:16, square) and quality choices", "Shortcuts for focus, recording and snapshots, all changeable"] },
  ];
  const tabs = $("tourTabs");
  if (tabs) {
    const show = (i) => {
      tabs.querySelectorAll("button").forEach((b, j) => b.classList.toggle("on", j === i));
      const d = TOUR[i];
      $("tourText").innerHTML = `<h3>${d.h}</h3><p>${d.p}</p><ul>${d.li.map((x) => `<li>${x}</li>`).join("")}</ul>`;
      const img = $("tourImg"); img.style.opacity = 0; img.onload = () => (img.style.opacity = 1); img.src = d.img; img.alt = d.h;
    };
    TOUR.forEach((d, i) => { const b = document.createElement("button"); b.textContent = d.tab; b.onclick = () => show(i); tabs.appendChild(b); });
    show(0);
  }

  // ---------- download: the latest files, with your device highlighted ----------
  const ua = navigator.userAgent, os = /Android/i.test(ua) ? "android" : /Windows/i.test(ua) ? "win" : /Mac OS X|Macintosh/i.test(ua) ? "mac" : /Linux/i.test(ua) ? "linux" : "chrome";
  const desktopBrowser = /Chrome|Edg|Brave|OPR/i.test(ua) && !/Android/i.test(ua);
  const want = desktopBrowser ? "chrome" : os;                       // on a desktop browser, the extension is the easiest start
  const cards = {}; document.querySelectorAll("#dlCards [data-os]").forEach((a) => { cards[a.dataset.os] = a; a.href = S.releasesUrl || "#"; });
  if (cards[want]) cards[want].classList.add("you");
  if (S.chromeStoreUrl && cards.chrome) cards.chrome.href = S.chromeStoreUrl;
  const NAMES = { chrome: "Add to your browser", win: "Download for Windows", mac: "Download for Mac", linux: "Download for Linux", android: "Download for Android" };
  fetch("https://api.github.com/repos/arcuto29/wicked-skins/releases/latest").then((r) => (r.ok ? r.json() : null)).then((rel) => {
    if (!rel || !rel.assets) return;
    $("dlVer").textContent = "v" + String(rel.tag_name || "").replace(/^v/, "");
    const find = (re) => (rel.assets.find((a) => re.test(a.name)) || {}).browser_download_url;
    const urls = { chrome: S.chromeStoreUrl || find(/^priism-skins-[\d.]+\.zip$/i), win: find(/\.exe$/i), mac: find(/mac\.zip$/i), linux: find(/\.AppImage$/i), android: find(/\.apk$/i) };
    for (const [k, u] of Object.entries(urls)) if (u && cards[k]) cards[k].href = u;
    const main = $("ctaMain");
    if (main && want === "chrome" && !S.chromeStoreUrl) { main.href = "guide.html"; main.textContent = "Add to Chrome, free"; }   // the zip needs a 1-minute guide until the store listing is live
    else if (main && urls[want]) { main.href = urls[want]; main.textContent = NAMES[want] + ", free"; }
  }).catch(() => {});
})();
