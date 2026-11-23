// Before / after sheets from fit.visual.js screenshots: one per window size, rows = picture shapes.
//   node test/fit/sheet.js   (reads test-output/fit/{before,after}, writes test-output/fit/sheet-*.png)
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const D = path.join(__dirname, "..", "..", "test-output", "fit");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage({ viewport: { width: 1640, height: 400 } });
  for (const win of ["1600x900", "2560x1080", "1000x1000", "2charts"]) {
    const rows = (win === "2charts" ? ["portrait", "landscape", "ultrawide"] : ["portrait", "square", "landscape", "ultrawide", "video"]).map((s) => {
      const im = (l) => "data:image/png;base64," + fs.readFileSync(path.join(D, l, `${win}-${s}.png`)).toString("base64");
      return `<tr><th>${s}</th><td><img src="${im("before")}"></td><td><img src="${im("after")}"></td></tr>`; }).join("");
    await p.setContent(`<style>body{margin:0;background:#111;color:#eee;font:16px sans-serif}table{border-spacing:8px}th{writing-mode:vertical-rl;transform:rotate(180deg)}img{width:780px;display:block}h2{margin:8px}</style>
      <h2>Window ${win} · left: before (main, Cover) · right: after (Smart)</h2><table>${rows}</table>`);
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(D, `sheet-${win}.png`), fullPage: true });
  }
  await b.close();
})();
