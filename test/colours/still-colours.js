// Which watched colours are in a still (PNG) from the colour tests, counted pixel by pixel: a check that doesn't depend
// on looking at the picture.   node test/colours/still-colours.js <png>...
const { chromium } = require("playwright"); const fs = require("fs");
const COLS = { "native order line #fa640a": [250, 100, 10], "Priism order line #ffe600": [255, 230, 0], "native MA": [58, 133, 173], "Priism MA / EMA #ff5ec4": [255, 94, 196],
  "native trend line #0afa64": [10, 250, 100], "Priism trend line #a855f7": [168, 85, 247], "native horizontal line #fa0ac8": [250, 10, 200], "Priism horizontal line / level #00e5ff": [0, 229, 255],
  "native level #c83c1e": [200, 60, 30], "native EMA #c80afa": [200, 10, 250] };
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage();
  for (const f of process.argv.slice(2)) {
    const r = await p.evaluate(async ([url, COLS]) => { const im = new Image(); await new Promise((r) => { im.onload = r; im.src = url; });
      const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, out = {};
      for (const [k, v] of Object.entries(COLS)) { let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - v[0]) < 8 && Math.abs(d[i + 1] - v[1]) < 8 && Math.abs(d[i + 2] - v[2]) < 8) n++; out[k] = n; }
      return out; }, ["data:image/png;base64," + fs.readFileSync(f).toString("base64"), COLS]);
    console.log(f.split("/").slice(-2).join("/"), JSON.stringify(r));
  }
  await b.close();
})();
