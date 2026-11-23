// Fit rules (src/smartfit.js box()), no browser needed.   node test/fit/smartfit.test.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url); require("../../src/smartfit.js");
const F = globalThis.PriismSmartFit;
let pass = 0, fail = 0; const ok = (k, v, d) => { if (v) pass++; else fail++; console.log((v ? "PASS " : "FAIL ") + k + (v ? "" : "  " + JSON.stringify(d))); };
const near = (a, b) => Math.abs(a - b) < 0.6;
const shapes = { portrait: [1080, 1920], square: [2048, 2048], landscape: [3840, 2160], ultrawide: [5120, 2160] };
const areas = { "16:9 chart": [1600, 900], "ultrawide chart": [2400, 1000], "tall split chart": [700, 1000], "short stacked chart": [1600, 420] };
for (const [an, [W, H]] of Object.entries(areas)) for (const [sn, [w, h]] of Object.entries(shapes)) {
  const b = F.box(w, h, W, H, "auto", 50, 50), off = Math.max((w / h) / (W / H), (W / H) / (w / h));
  if (off <= F.EXTEND_AT) ok(`${sn} on ${an}: close in shape, fills it (Cover)`, !b.extend && b.w >= W - 0.5 && b.h >= H - 0.5, b);
  else ok(`${sn} on ${an}: shown whole, in proportion, centred (surround around it)`, b.extend && b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= W + 0.5 && b.y + b.h <= H + 0.5 && near(b.w / b.h, w / h) && (near(b.w, W) || near(b.h, H)), b);
}
ok("a 16:9 picture on a 16:9 chart: exactly the old Cover", (() => { const b = F.box(3840, 2160, 1600, 900, "auto", 50, 50); return !b.extend && near(b.x, 0) && near(b.y, 0) && near(b.w, 1600); })());
ok("Cover / Contain / Stretch unchanged", (() => { const c = F.box(1080, 1920, 1600, 900, "cover", 50, 50), f = F.box(1080, 1920, 1600, 900, "fit", 50, 50), s = F.box(1080, 1920, 1600, 900, "stretch", 50, 50);
  return !c.extend && near(c.w, 1600) && !f.extend && near(f.h, 900) && near(s.w, 1600) && near(s.h, 900); })());
ok("Horizontal places the artwork (0% = left)", near(F.box(1080, 1920, 1600, 900, "auto", 0, 50).x, 0) && near(F.box(1080, 1920, 1600, 900, "auto", 100, 50).x, 1600 - 900 * 1080 / 1920));
ok("unknown size: fills the chart, nothing breaks", (() => { const b = F.box(0, 0, 1600, 900, "auto"); return !b.extend && b.w === 1600; })());
console.log(`\nSMART FIT: ${pass}/${pass + fail}`); process.exitCode = fail ? 1 : 0;
