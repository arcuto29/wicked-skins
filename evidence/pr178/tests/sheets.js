// Before / after sheets for PR #178: every look, main (before) next to the fix (after), in each state.
//   real tradingview.com: previews/tvreal-real-main + tvreal-real-fix   nq.vision stand-in: previews/lwscale-lwS-main + lwscale-lwS-fix
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
const OUT = "/projects/sandbox/out/evidence-pr178"; fs.mkdirSync(OUT, { recursive: true });
const looks = fs.readFileSync("/projects/sandbox/wicked-skins/src/candlelooks.js", "utf8").match(/const LOOKS = \[([\s\S]*?)\n  \];/)[1].match(/\["([a-z]+)",\s*"([^"]+)"/g).map((s) => s.match(/\["([a-z]+)",\s*"([^"]+)"/).slice(1));
const SETS = [
  { name: "tradingview-real", title: "Real tradingview.com (NQ1!, no account), driven by mouse and keyboard", a: "/projects/sandbox/previews/tvreal-real-main", b: "/projects/sandbox/previews/tvreal-real-fix",
    states: [["normal", "Normal"], ["zoomedIn", "Zoomed in"], ["squeezed", "Price scale squeezed"], ["stretched", "Price scale stretched"], ["inStretched", "Zoomed in + stretched"]], w: 120, h: 210 },
  { name: "nqvision-standin", title: "nq.vision stand-in (Lightweight Charts 5.2.1, nq.vision's grey / black candles, colours found by shape)", a: "/projects/sandbox/previews/lwscale-lwS-main", b: "/projects/sandbox/previews/lwscale-lwS-fix",
    states: [["normal", "Normal"], ["stretched", "Stretched"], ["wide400", "Zoomed far in"], ["out+stretch", "Zoomed out + stretched"]], w: 130, h: 164 },
];
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"] }), page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const made = [];
  for (const S of SETS) {
    for (let g = 0; g < looks.length; g += 6) {
      const part = looks.slice(g, g + 6), n = Math.floor(g / 6) + 1;
      const cell = (dir, look, st) => { const f = path.join(dir, `${look}-${st}.png`); return fs.existsSync(f) ? `<img src="file://${f}" style="width:${S.w}px;height:${S.h}px;object-fit:cover;object-position:right top;display:block">` : `<div style="width:${S.w}px;height:${S.h}px;background:#300;color:#f99;font:11px sans-serif">missing</div>`; };
      const html = `<html><body style="margin:0;background:#0b0e14;color:#e7ebf3;font:13px system-ui;padding:14px">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${S.title}</div>
        <div style="color:#9aa6bd;margin-bottom:10px">Each pair: <b style="color:#ff8a9a">before</b> (main) | <b style="color:#6ff5c6">after</b> (PR #178). Sheet ${n} of ${Math.ceil(looks.length / 6)}.</div>
        <table style="border-collapse:collapse"><tr><td></td>${S.states.map(([, t]) => `<td colspan=2 style="text-align:center;padding:2px 6px;color:#c9d1e3">${t}</td>`).join("")}</tr>
        ${part.map(([id, name]) => `<tr><td style="padding:4px 8px;white-space:nowrap;font-weight:600">${name}<br><span style="color:#7d879c;font-weight:400">${id}</span></td>${S.states.map(([st]) => `<td style="padding:2px 1px 2px 6px;border-top:2px solid #ff8a9a">${cell(S.a, id, st)}</td><td style="padding:2px 6px 2px 1px;border-top:2px solid #6ff5c6">${cell(S.b, id, st)}</td>`).join("")}</tr>`).join("")}
        </table></body></html>`;
      const hf = path.join(OUT, `_sheet.html`); fs.writeFileSync(hf, html); await page.goto("file://" + hf); await page.waitForTimeout(400);
      const out = path.join(OUT, `${S.name}-${n}.png`); await page.screenshot({ path: out, fullPage: true }); made.push(out);
    }
  }
  fs.rmSync(path.join(OUT, "_sheet.html"), { force: true });
  console.log(made.length, "sheets:", made.map((f) => path.basename(f)).join(", "));
  await b.close();
})();
