// Match everything's indicator / drawing colours (src/candlelooks.js, Wallpaper mode), checked in a browser page.
//   node test/match/palette.test.js
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "..", "src", "candlelooks.js");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage();
  await p.setContent("<canvas id=c width=400 height=200></canvas>");
  await p.addScriptTag({ content: fs.readFileSync(SRC, "utf8") });
  const r = await p.evaluate(() => {
    const L = window.__bdCandleLooks, g = document.getElementById("c").getContext("2d");
    const rgb = (h) => (h.startsWith("#") ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number));
    const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255, dist = (a, b2) => Math.hypot(a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]);
    // six indicators in their own (TradingView-default-like) colours, plus a green and a red one that mean up / down
    const IND = ["#2962ff", "#ff9800", "#9c27b0", "#00bcd4", "#e91e63", "#ffeb3b"], GREEN = "#26a69a", RED = "#ef5350";
    const run = (wall, bg, up, down) => { L.setWallColors(wall, bg);
      const o = { mode: "wallpaper", up, down, accent: wall[0] };
      const cols = IND.map((c) => L.indicator(g, c, o).s);
      return { cols, green: (L.indicator(g, GREEN, o) || {}).s || null, red: (L.indicator(g, RED, o) || {}).s || null }; };
    const W = { colourful: [["#e0407a", "#3fa9f5", "#f5c542", "#7c4dff"], "dark"], bright: [["#f2e9dc", "#c8d8e8", "#f7d4c0"], "light"],
      dark: [["#1a1f3a", "#2b1d3d", "#10202a"], "dark"], blackwhite: [["#111111", "#777777", "#dddddd"], "dark"] };
    const out = {};
    for (const [n, [wall, bg]] of Object.entries(W)) out[n] = { bg, ...run(wall, bg, "#7dffc4", "#ffd479") };
    out.otherCandles = run(W.colourful[0], "dark", "#4da3ff", "#ff6bd5");
    out.noCandles = run(W.colourful[0], "dark", undefined, undefined);
    return { out, lum: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.cols.map((c) => +lum(rgb(c)).toFixed(2))])),
      minDist: Object.fromEntries(Object.entries(out).map(([k, v]) => { let m = 1e9; for (let i = 0; i < v.cols.length; i++) for (let j = i + 1; j < v.cols.length; j++) m = Math.min(m, dist(rgb(v.cols[i]), rgb(v.cols[j]))); return [k, Math.round(m)]; })),
      candleDist: Object.fromEntries(Object.entries(out).filter(([k]) => k !== "noCandles").map(([k, v]) => { const cs = k === "otherCandles" ? ["#4da3ff", "#ff6bd5"] : ["#7dffc4", "#ffd479"];
        return [k, Math.round(Math.min(...v.cols.flatMap((c) => cs.map((x) => dist(rgb(c), rgb(x))))))]; })) };
  });
  let pass = 0, fail = 0; const ok = (k, v, d) => { v ? pass++ : fail++; console.log((v ? "PASS " : "FAIL ") + k + "  " + JSON.stringify(d)); };
  for (const n of ["colourful", "bright", "dark", "blackwhite"]) {
    const o = r.out[n], light = o.bg === "light";
    ok(`${n} wallpaper: every indicator colour stands out from it (${light ? "deep on a bright wallpaper" : "light on a dark one"})`, r.lum[n].every((l) => (light ? l <= 0.31 : l >= 0.44)), { lum: r.lum[n], cols: o.cols });
    ok(`${n}: six indicators, six different colours (told apart easily)`, new Set(o.cols).size === 6 && r.minDist[n] >= 45, { minDist: r.minDist[n] });
    ok(`${n}: no indicator in a candle's colour`, r.candleDist[n] >= 55, { candleDist: r.candleDist[n] });
    const hue = (h) => { const [r, g, b2] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b2), mn = Math.min(r, g, b2), d = mx - mn; if (!d) return 0;
      let x = mx === r ? ((g - b2) / d) % 6 : mx === g ? (b2 - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
    const near = (a, b2) => { const d = Math.abs(hue(a) - hue(b2)); return Math.min(d, 360 - d) <= 12; };
    ok(`${n}: a green (up) indicator takes your up candle colour (#7dffc4), a red (down) one your down colour (#ffd479), made readable`, o.green && o.red && near(o.green, "#7dffc4") && near(o.red, "#ffd479"), { green: o.green, red: o.red });
  }
  ok("change the candle colours: the theme changes with them", JSON.stringify(r.out.otherCandles.cols) !== JSON.stringify(r.out.colourful.cols) && r.candleDist.otherCandles >= 55, r.out.otherCandles.cols);
  ok("Priism's candles off: green / red indicators keep their own colours (their meaning is never lost)", r.out.noCandles.green === null && r.out.noCandles.red === null, { green: r.out.noCandles.green, red: r.out.noCandles.red });
  console.log(`\nMATCH PALETTE: ${pass}/${pass + fail}`); await b.close(); process.exitCode = fail ? 1 : 0;
})();
