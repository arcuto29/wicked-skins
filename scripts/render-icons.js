// Re-renders every PNG icon from icons/logo.svg (and icons/logo-small.svg for 16/32 px).
// Change the logo: edit the SVGs, then run:  npx --yes playwright@1.64.1 install chromium && node scripts/render-icons.js
// Also writes icons/preview.png (all sizes on dark + light toolbars) so you can check it at a glance.
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const DIR = path.join(__dirname, "..", "icons");
const big = fs.readFileSync(path.join(DIR, "logo.svg"), "utf8"), small = fs.readFileSync(path.join(DIR, "logo-small.svg"), "utf8");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage();
  for (const s of [16, 32, 48, 128, 512, 1024]) {
    const svg = (s <= 32 ? small.replace(/width="32" height="32"/, `width="${s}" height="${s}"`) : big.replace(/width="128" height="128"/, `width="${s}" height="${s}"`));
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(DIR, `icon-${s}.png`), omitBackground: true });
  }
  const img = (s, z) => `<img src="data:image/png;base64,${fs.readFileSync(path.join(DIR, `icon-${s}.png`)).toString("base64")}" style="width:${s * z}px;height:${s * z}px;image-rendering:pixelated;margin:8px;vertical-align:middle">`;
  await p.setViewportSize({ width: 820, height: 360 });
  await p.setContent(`<body style="margin:0;font:12px sans-serif">
    <div style="background:#202124;padding:12px;color:#aaa">dark toolbar ${img(16, 1)}${img(32, 1)}${img(48, 1)}${img(128, 1)} · 16px ×5 ${img(16, 5)}</div>
    <div style="background:#f1f3f4;padding:12px;color:#555">light toolbar ${img(16, 1)}${img(32, 1)}${img(48, 1)}${img(128, 1)} · 32px ×3 ${img(32, 3)}</div></body>`);
  await p.screenshot({ path: path.join(DIR, "preview.png") });
  await b.close();
  console.log("✓ icons rendered: 16 32 48 128 512 1024 + preview.png");
})().catch((e) => { console.error(e); process.exit(1); });
