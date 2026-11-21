// Pixel diff of the candle looks: two versions of src/candlelooks.js (A = before, B = after) drawn side by side in
// one page, every look over a grid of body sizes.
//   1. 1x screen, every ordinary size: B must draw exactly the same pixels as A (the looks are unchanged).
//   2. a body stretched far past the pane: B's stripes / blocks must reach the bottom of what's visible.
//   3. 2x screen: B drawn at 2x, averaged down to 1x, must match A drawn at 1x (the same physical look).
// A=<tree> B=<tree> node lookdiff.js
const { chromium } = require("playwright"); const fs = require("fs");
const A = fs.readFileSync((process.env.A || "/projects/sandbox/wtmain") + "/src/candlelooks.js", "utf8");
const B = fs.readFileSync((process.env.B || "/projects/sandbox/wicked-skins") + "/src/candlelooks.js", "utf8");
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 400) : "")); };
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] }), page = await b.newPage();
  await page.setContent("<html><body></body></html>");
  // each version in its own frame (its own window.__bdCandleLooks); time frozen (Hologram drifts with time)
  const frame = async (name, src) => page.evaluate(({ name, src }) => new Promise((res) => {
    const f = document.createElement("iframe"); f.name = name; document.body.appendChild(f);
    const w = f.contentWindow; w.performance.now = () => 1000; w.eval(src); res(!!w.__bdCandleLooks); }), { name, src });
  ok("both versions load", (await frame("A", A)) && (await frame("B", B)));
  const run = (spec) => page.evaluate((spec) => {
    const draw = (win, look, W, H, x, y, w, h, px, vy, up) => {
      const c = win.document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"), L = win.__bdCandleLooks;
      const k = { g, px, yfrac: 0.4, xfrac: 0.5, fill: (a, b, cc, d) => g.fillRect(a, b, cc, d), style: (v) => { g.fillStyle = v; }, stroke: (v) => { g.strokeStyle = v; },
        strokeRect: (a, b, cc, d) => g.strokeRect(a, b, cc, d), fillPath: () => g.fill(), clear: (a, b, cc, d) => g.clearRect(a, b, cc, d) };
      if (vy) { k.vy0 = vy[0]; k.vy1 = vy[1]; }
      L.draw(g, look, x, y, w, h, up ? "#00ffa3" : "#ff2e97", up, k);
      return g.getImageData(0, 0, W, H).data;
    };
    const A = document.querySelector("iframe[name=A]").contentWindow, B = document.querySelector("iframe[name=B]").contentWindow, out = [];
    for (const t of spec) {
      if (t.kind === "same") {
        const a = draw(A, t.look, t.W, t.H, t.x, t.y, t.w, t.h, 1, null, t.up), b = draw(B, t.look, t.W, t.H, t.x, t.y, t.w, t.h, 1, [0, t.H], t.up);
        let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; out.push({ ...t, diff: d });
      } else if (t.kind === "tall") {   // a body from far above to far below the canvas: is there ink on the bottom rows?
        const inkRows = (px) => { let n = 0; for (let y = t.H - 60; y < t.H; y++) { let any = false; for (let x = t.x; x < t.x + t.w; x++) if (px[(y * t.W + x) * 4 + 3] > 120) any = true; if (any) n++; } return n; };
        const a = draw(A, t.look, t.W, t.H, t.x, -1500, t.w, 4000, 1, null, true), b = draw(B, t.look, t.W, t.H, t.x, -1500, t.w, 4000, 1, [0, t.H], true);
        out.push({ ...t, aBottom: inkRows(a), bBottom: inkRows(b) });
      } else if (t.kind === "dpr2") {   // B at 2x (px 2, everything doubled), averaged 2x2 -> compare with A at 1x
        const a = draw(A, t.look, t.W, t.H, t.x, t.y, t.w, t.h, 1, null, t.up), b2 = draw(B, t.look, t.W * 2, t.H * 2, t.x * 2, t.y * 2, t.w * 2, t.h * 2, 2, [0, t.H * 2], t.up);
        // also the old code at 2x (px 1: details half as big), to show what 2x screens get today
        const o2 = draw(A, t.look, t.W * 2, t.H * 2, t.x * 2, t.y * 2, t.w * 2, t.h * 2, 1, null, t.up);
        const down = (p) => { const q = new Float32Array(t.W * t.H * 4); for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) for (let ch = 0; ch < 4; ch++) {
          let s = 0; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s += p[(((y * 2 + dy) * t.W * 2) + x * 2 + dx) * 4 + ch]; q[(y * t.W + x) * 4 + ch] = s / 4; } return q; };
        const err = (p) => { const q = down(p); let e = 0, n = 0; for (let i = 3; i < a.length; i += 4) { e += Math.abs(q[i] - a[i]); n++; } return +(e / n).toFixed(2); };   // mean alpha error per pixel
        out.push({ ...t, errNew: err(b2), errOld: err(o2) });
      }
    }
    return out;
  }, spec);
  const looks = await page.evaluate(() => document.querySelector("iframe[name=A]").contentWindow.__bdCandleLooks.IDS);
  ok("34 looks", looks.length === 34, looks.length);
  // 1. every look, 1x, ordinary sizes (bodies up to 600 px tall: inside the old limits)
  const same = [];
  // lower timeframes (thin bodies, dojis) up to higher timeframes zoomed in (Daily / Weekly: very wide, very tall)
  for (const look of looks) for (const w of [1, 2, 3, 4, 5, 7, 9, 13, 17, 29, 40, 80, 160, 300]) for (const h of [1, 2, 3, 5, 11, 23, 46, 120, 400, 590]) for (const up of [true, false])
    same.push({ kind: "same", look, W: w + 20, H: 620, x: 10, y: 12, w, h, up });
  // (where the old code hit its own limit, 200 stripes for Lines / 80 blocks for Pixel, it stopped drawing part-way:
  // those candles are the bug, checked separately below)
  const capped = (r) => r.w >= 2.5 && r.h >= 2.5 && ((r.look === "lines" && Math.ceil(r.h / 3) > 200) || (r.look === "pixel" && Math.ceil(r.h / Math.max(2, r.w)) > 80));   // (dojis and 1-2 px bodies are drawn solid by every look)
  const s = await run(same), bad = s.filter((r) => r.diff && !capped(r)), capFixed = s.filter((r) => capped(r));
  ok(`candles the old code cut short (${capFixed.length}: narrow Pixel bodies) are drawn differently now`, capFixed.every((r) => r.diff > 0), capFixed.slice(0, 3).map((r) => [r.look, r.w, r.h]));
  ok(`1x: every look draws the same pixels as before (${s.length - capFixed.length} candles: 34 looks x 14 widths 1-300 px x 10 heights 1-590 px x up/down)`, !bad.length, bad.slice(0, 6).map((r) => [r.look, r.w, r.h, r.diff]));
  // 2. stretched far past the pane
  const tall = await run(looks.flatMap((look) => [9, 120].map((w) => ({ kind: "tall", look, W: w + 20, H: 700, x: 10, w }))));   // a 1m candle and a zoomed-in Weekly one
  const fixed = tall.filter((r) => r.aBottom === 0 && r.bBottom >= 15).map((r) => r.look), worse = tall.filter((r) => r.bBottom < r.aBottom).map((r) => r.look);
  const pat = tall.filter((r) => ["lines", "pixel"].includes(r.look));
  ok("stretched candle: Lines and Pixel reach the bottom of the pane, narrow and wide", pat.every((r) => r.bBottom >= 15), pat);
  ok("...including every case that stopped part-way before (Lines narrow + wide, Pixel narrow)", pat.filter((r) => r.aBottom === 0).length === 3 && pat.filter((r) => r.aBottom === 0).every((r) => r.bBottom >= 15), pat.filter((r) => r.aBottom === 0).map((r) => [r.look, r.w]));
  ok("...and no look has less ink on a stretched candle than before", !worse.length, worse);
  // 3. 2x screens
  const d2 = await run(looks.flatMap((look) => [[5, 23], [9, 46], [17, 120]].map(([w, h]) => ({ kind: "dpr2", look, W: 40, H: 160, x: 10, y: 12, w, h, up: true }))));
  const avg = (k) => +(d2.reduce((s, r) => s + r[k], 0) / d2.length).toFixed(2), worse2 = d2.filter((r) => r.errNew > r.errOld + 0.05);
  ok(`2x: B at 2x matches the 1x look better than before (mean alpha error ${avg("errOld")} before -> ${avg("errNew")} after)`, avg("errNew") < avg("errOld"), { before: avg("errOld"), after: avg("errNew") });
  ok("2x: no look further from its 1x appearance than before", !worse2.length, worse2.map((r) => [r.look, r.w, r.errOld, r.errNew]));
  const per = {}; for (const r of d2) { per[r.look] = per[r.look] || [0, 0]; per[r.look][0] += r.errOld / 3; per[r.look][1] += r.errNew / 3; }
  console.log("2x per look (before -> after):", Object.entries(per).map(([k, v]) => `${k} ${v[0].toFixed(1)}->${v[1].toFixed(1)}`).join(", "));
  await b.close();
  const p = Object.values(R).filter(Boolean).length, n = Object.keys(R).length; console.log("SUMMARY:", p + "/" + n); process.exit(p === n ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
