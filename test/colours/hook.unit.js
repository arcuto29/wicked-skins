// The colour hook on its own, frame by frame, with the exact drawing sequences TradingView uses (no website needed,
// so the cases that only happen now and then on a live chart run every time).
//   node test/colours/hook.unit.js [--src <dir with candlelooks.js + hook.js>]   (default: this repo's src/)
// A canvas inside .chart-markup-table stands in for the chart pane. Each case draws what TradingView draws in one paint,
// then reads the pixels once that paint is over (what the browser would show for that frame).
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SRC = path.resolve(arg("src", path.join(__dirname, "..", "..", "src")));
// --dpr 2: a high-DPI chart, drawn the way TradingView draws one (the canvas at twice the size, everything scaled)
const DPR = +arg("dpr", 1);
const results = {}; const ok = (k, v, d) => { results[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d) : "")); };

const N = { line: "#fa640a", box: "#0a0afa", trend: "#0afa64", hline: "#fa0ac8", other: "#3cb4dc" };
const GOLD = "#ffe600", PURPLE = "#a855f7", CYAN = "#00e5ff", PINK = "#ff5ec4";
const FX = { bracketOn: true, bracketLineColor: GOLD, bracketSize: 0, bracketBack: "keep", indMode: "own", drawOn: false, lineGlow: 0,
  indCustom: { "10,250,100": { c: PURPLE }, "250,10,200": { c: CYAN }, "200,60,30": { c: PINK },
    "120,40,200": { c: PINK, h: true },   // a level hidden in Each indicator
    "40,160,90": { c: CYAN },             // a see-through level
    "220,120,40": { c: PURPLE } } };      // an indicator line whose colour an order line also has

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] });
  const page = await b.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: DPR });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.setContent(`<!doctype html><html class="bd-on" data-ws-fx='${JSON.stringify(FX)}'><body style="margin:0;background:#000">
    <div class="chart-markup-table" style="display:flex"><div style="position:relative"><canvas id="pane" width="${920 * DPR}" height="${700 * DPR}" style="width:920px;height:700px;display:block"></canvas></div>
    <div class="price-axis" style="position:relative"><canvas id="axis" width="${70 * DPR}" height="${700 * DPR}" style="width:70px;height:700px;display:block"></canvas></div></div></body></html>`);
  // the chart's drawings, as TradingView's API reports them (start: none)
  await page.evaluate(() => { window.__shapes = []; window.__props = {};
    window.TradingViewApi = { activeChart: () => ({ getAllShapes: () => window.__shapes.slice(), getShapeById: (id) => ({ getProperties: () => window.__props[id] }) }) }; });
  await page.addScriptTag({ content: fs.readFileSync(path.join(SRC, "candlelooks.js"), "utf8") });
  await page.addScriptTag({ content: fs.readFileSync(path.join(SRC, "hook.js"), "utf8") });
  await page.waitForTimeout(300);
  ok("hook loaded", await page.evaluate(() => !!window.__bdHooked), await page.evaluate(() => window.__bdHookVer));

  // helpers in the page: one paint = these calls, then wait for the frame to end and read pixels
  await page.evaluate(() => {
    const c = document.getElementById("pane"), g = c.getContext("2d");
    window.__g = g; const S = devicePixelRatio;
    g.setTransform(S, 0, 0, S, 0, 0);
    const ax = document.getElementById("axis"), ga = ax.getContext("2d"); ga.setTransform(S, 0, 0, S, 0, 0); window.__ga = ga;
    window.__clearAxis = () => { ga.setTransform(1, 0, 0, 1, 0, 0); ga.clearRect(0, 0, ax.width, ax.height); ga.setTransform(S, 0, 0, S, 0, 0); };
    // a price tag on the scale, the way TradingView draws one: a pointed box in the line's colour, then the number
    window.__tag = (y, col, text) => { ga.save(); ga.fillStyle = col; ga.beginPath(); ga.moveTo(0, y); ga.lineTo(6, y - 10); ga.lineTo(68, y - 10); ga.lineTo(68, y + 10); ga.lineTo(6, y + 10); ga.closePath(); ga.fill();
      ga.font = "12px sans-serif"; ga.textAlign = "left"; ga.textBaseline = "middle"; ga.fillStyle = "#ffffff"; ga.fillText(text || "123.45", 12, y); ga.restore(); };
    const atA = (x, y) => ga.getImageData(Math.floor(x * S + S / 2), Math.floor(y * S + S / 2), 1, 1).data;
    window.__isA = (x, y, h) => { const d = atA(x, y), w = hex(h); return d[3] > 40 && Math.abs(d[0] - w[0]) <= 8 && Math.abs(d[1] - w[1]) <= 8 && Math.abs(d[2] - w[2]) <= 8; };
    window.__pxA = (x, y) => Array.from(atA(x, y)).join(",");
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    window.__clear = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.setTransform(S, 0, 0, S, 0, 0); };
    // what's at a point (CSS px, read at the middle of that pixel on the canvas): "r,g,b,a"
    const at = (x, y) => g.getImageData(Math.floor(x * S + S / 2), Math.floor(y * S + S / 2), 1, 1).data;
    window.__px = (x, y) => Array.from(at(x, y)).join(",");
    window.__is = (x, y, h) => { const d = at(x, y), w = hex(h); return d[3] > 40 && Math.abs(d[0] - w[0]) <= 8 && Math.abs(d[1] - w[1]) <= 8 && Math.abs(d[2] - w[2]) <= 8; };
    window.__endFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    // TradingView's order line: the line either side of the label, THEN the label (box + text, Verdana, centred)
    window.__orderLine = (y, how) => {
      g.save();
      if (how === "boxfirst") { g.fillStyle = "#0a0afa"; g.beginPath(); g.roundRect(782, y - 10, 92, 21, 3); g.fill(); }
      g.lineWidth = 1; g.strokeStyle = "#fa640a";
      g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(782, y + 0.5); g.stroke();
      g.beginPath(); g.moveTo(874, y + 0.5); g.lineTo(920, y + 0.5); g.stroke();
      if (how === "box") { g.fillStyle = "#0a0afa"; g.fillRect(782, y - 10, 92, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.fillText("TP +$412.50", 828, y); }
      if (how === "boxfirst") { g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.fillText("TP +$412.50", 828, y); }
      if (how === "pasted") {   // a cached label picture, pasted clipped to its box
        g.save(); g.beginPath(); g.rect(782, y - 10, 92, 21); g.clip(); g.drawImage(window.__sprite, 782, y - 10); g.restore(); }
      g.restore();
    };
    // the label picture TradingView keeps (drawn once, off screen)
    const s = document.createElement("canvas"); s.width = 92; s.height = 21; const sg = s.getContext("2d");
    sg.fillStyle = "#0a0afa"; sg.fillRect(0, 0, 92, 21); sg.font = "11px Verdana"; sg.textAlign = "center"; sg.textBaseline = "middle"; sg.fillStyle = "#ffffff"; sg.fillText("SL -$133.00", 46, 10.5);
    window.__sprite = s;
    window.__trend = (col) => { g.save(); g.lineWidth = 2; g.strokeStyle = col; g.beginPath(); g.moveTo(160, 600); g.lineTo(700, 420); g.stroke(); g.restore(); };
    window.__hline = (y, col) => { g.save(); g.lineWidth = 1; g.strokeStyle = col; g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(920, y + 0.5); g.stroke(); g.restore(); };
  });
  const paint = async (fn, arg1, arg2) => { await page.evaluate(([fn, a, b]) => { window.__clear(); window[fn](a, b); }, [fn, arg1, arg2]); await page.evaluate(() => window.__endFrame()); };
  const at = (x, y, h) => page.evaluate(([x, y, h]) => window.__is(x, y, h), [x, y, h]);
  const px = (x, y) => page.evaluate(([x, y]) => window.__px(x, y), [x, y]);

  // ---- brackets ----
  await paint("__orderLine", 300, "box");
  ok("order line, first paint: in your colour on screen (line drawn before its label in the same paint)", await at(400, 300, GOLD) && await at(900, 300, GOLD), [await px(400, 300), await px(900, 300)]);
  await paint("__orderLine", 300, "box");
  ok("...next paint: your colour", await at(400, 300, GOLD), await px(400, 300));
  await page.waitForTimeout(1100);   // a live chart repaints about once a second
  await paint("__orderLine", 300, "box");
  ok("...a paint a second later (live chart): still your colour, not TradingView's", await at(400, 300, GOLD) && !(await at(400, 300, N.line)), await px(400, 300));
  for (const y of [340, 410, 520, 180]) {   // dragged / moved: a new row each paint
    await paint("__orderLine", y, "box");
    ok(`...moved to a new row (y ${y}): your colour in that very frame`, await at(400, y, GOLD) && await at(900, y, GOLD), [await px(400, y), await px(900, y)]);
  }
  await paint("__orderLine", 250, "pasted");
  ok("order line with a cached label pasted on (clipped to the label): your colour in that frame", await at(400, 250, GOLD) && await at(900, 250, GOLD), [await px(400, 250), await px(900, 250)]);
  ok("...and the label stays on top of its line (the line isn't drawn across it)", !(await at(800, 250, GOLD)) && !(await at(800, 250, N.line)), await px(800, 250));
  await page.waitForTimeout(1100);
  await paint("__orderLine", 610, "pasted");
  ok("...pasted label on a new row after a pause: your colour", await at(400, 610, GOLD), await px(400, 610));
  await paint("__orderLine", 380, "none");   // a paint that redraws only the lines (labels left as they were), new row
  ok("a paint with only the order lines, on a new row (zooming): your colour", await at(400, 380, GOLD) && await at(900, 380, GOLD), [await px(400, 380), await px(900, 380)]);
  await paint("__hline", 560, N.line);
  ok("...but a full-width line in that same colour (not ending at a label) keeps its colour", await at(400, 560, N.line), await px(400, 560));
  await page.waitForTimeout(1100);
  for (const y of [130, 660]) {   // TradingView's charting library (TopstepX): the label's box first, then the line, then the text
    await page.evaluate(([y]) => { window.__clear(); for (let k = 0; k < 30; k++) window.__hline(10 + k * 22, "rgba(46,46,46,0.2)"); window.__orderLine(y, "boxfirst"); }, [y]);   // after the grid's 30 lines
    await page.evaluate(() => window.__endFrame());
    ok(`label box drawn before its line (charting library), new row y ${y}: your colour in that frame`, await at(400, y, GOLD) && await at(900, y, GOLD) && !(await at(828, y + 6, GOLD)), [await px(400, y), await px(900, y), await px(828, y + 6)]);
  }
  // never more than that: a full-width line with no label stays as it is (grid, level, someone else's line)
  await paint("__hline", 450, N.other);
  ok("a wide line with no label next to it keeps its own colour", await at(400, 450, N.other), await px(400, 450));
  await page.evaluate(() => { window.__clear(); const g = window.__g; window.__hline(470, "#3cb4dc");   // an indicator's label in the middle of a level
    g.fillStyle = "#0a0afa"; g.fillRect(400, 460, 60, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.fillStyle = "#fff"; g.fillText("+12.5", 430, 470); });
  await page.evaluate(() => window.__endFrame());
  ok("a line that runs through a label (not ending at it) keeps its own colour", await at(200, 470, N.other), await px(200, 470));

  // ---- drawings (Each indicator colours) ----
  await page.evaluate(() => { window.__shapes = [{ id: "t1", name: "LineToolTrendLine" }]; window.__props.t1 = { linecolor: "#0afa64", linewidth: 2 }; });
  await paint("__trend", N.trend);
  ok("a new trend line: your colour from its first frame", await at(430, 510, PURPLE), await px(430, 510));
  await page.evaluate(() => { window.__shapes = []; }); await paint("__hline", 50, N.other);   // another symbol: its drawings aren't there
  await page.evaluate(() => { window.__shapes = [{ id: "t1", name: "LineToolTrendLine" }, { id: "h1", name: "LineToolHorzLine" }]; window.__props.h1 = { linecolor: "#fa0ac8" }; });
  await paint("__trend", N.trend);
  ok("back on its symbol: the trend line in your colour in the first frame (no flash of its own)", await at(430, 510, PURPLE), await px(430, 510));
  await paint("__hline", 200, N.hline);
  ok("a horizontal-line drawing: your colour from its first frame", await at(400, 200, CYAN), await px(400, 200));
  await paint("__trend", N.other);
  ok("a line in a colour that isn't customised keeps its colour", await at(430, 510, N.other), await px(430, 510));

  // ---- an indicator's level line (one straight horizontal line, e.g. prints / a session level) ----
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#c83c1e"; g.beginPath(); g.moveTo(120, 333.5); g.lineTo(700, 333.5); g.stroke(); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  ok("an indicator's new level line: your colour in its very first frame (not after ~1 s)", await at(400, 333, PINK), await px(400, 333));
  await paint("__hline", 333, "#c83c1e"); await page.evaluate(() => { const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#c83c1e"; g.beginPath(); g.moveTo(120, 333.5); g.lineTo(700, 333.5); g.stroke(); g.restore(); }); await page.evaluate(() => window.__endFrame());
  ok("...and in the next paints", await at(400, 333, PINK), await px(400, 333));
  // a tag (another order's label) passed over the level's row a moment ago and moved on: the level keeps your colour
  const lvlPaint = (tagY) => page.evaluate((tagY) => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#c83c1e"; g.beginPath(); g.moveTo(120, 333.5); g.lineTo(700, 333.5); g.stroke();
    g.fillStyle = "#2a8a3c"; g.fillRect(720, tagY - 10, 90, 21); g.restore(); }, tagY).then(() => page.evaluate(() => window.__endFrame()));
  await lvlPaint(333); await lvlPaint(300); await lvlPaint(260);
  ok("a tag that crossed the level's row and moved on doesn't leave the level in its own colour", await at(400, 333, PINK), await px(400, 333));
  // a line in a new colour with a price tag on its row (an order / position line), bracket line colour off: left alone
  await page.evaluate(() => { document.documentElement.setAttribute("data-ws-fx", JSON.stringify({ ...JSON.parse(document.documentElement.getAttribute("data-ws-fx")), bracketLineColor: "", indMode: "rainbow" })); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#1e64c8"; g.beginPath(); g.moveTo(0, 555.5); g.lineTo(700, 555.5); g.stroke();
    g.fillStyle = "#1e64c8"; g.fillRect(700, 545, 90, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("Buy 2", 745, 555); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  ok("a new line with a price tag on its row (an order line) isn't taken for an indicator level", await at(300, 555, "#1e64c8"), await px(300, 555));

  // ---- see-through lines: drawn once, in the right colour (your colour over the original would mix with it) ----
  await page.evaluate(() => { document.documentElement.setAttribute("data-ws-fx", JSON.stringify({ ...JSON.parse(document.documentElement.getAttribute("data-ws-fx")), bracketLineColor: "#ffe600", indMode: "own" })); });
  await page.waitForTimeout(200);
  // (colours of their own, never seen before: a colour already known as a bracket line's is drawn in yours straight away)
  const seeThru = (y, how) => page.evaluate(([y, how]) => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#5a8cfa"; g.globalAlpha = 0.6;
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(782, y + 0.5); g.stroke();
    g.globalAlpha = 1;
    if (how === "label") { g.fillStyle = "#0a0afa"; g.fillRect(782, y - 10, 92, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("TP +$50.00", 828, y); }
    if (how === "over") { g.fillStyle = "#2a8a3c"; g.fillRect(300, y - 4, 20, 9); }   // something drawn over it later in the paint
    g.restore(); }, [y, how]).then(() => page.evaluate(() => window.__endFrame()));
  const rgbaAt = (x, y) => page.evaluate(([x, y]) => window.__px(x, y), [x, y]);
  await seeThru(140, "label");
  { const v = (await rgbaAt(400, 140)).split(",").map(Number);
    ok("a see-through bracket line, first frame: your colour only, no trace of its own", Math.abs(v[0] - 255) <= 4 && Math.abs(v[1] - 230) <= 4 && v[2] <= 4, v.join(",")); }
  await seeThru(140, "label");
  { const v = (await rgbaAt(400, 140)).split(",").map(Number);
    ok("...and in the next paints", Math.abs(v[0] - 255) <= 4 && Math.abs(v[1] - 230) <= 4 && v[2] <= 4, v.join(",")); }
  // a 1 px line on a whole-pixel row (TradingView at 1x): two rows at half strength. First frame on a new row: no mix
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#e05a14"; g.beginPath(); g.moveTo(0, 177); g.lineTo(782, 177); g.stroke();
    g.fillStyle = "#0a0afa"; g.fillRect(782, 167, 92, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("SL -$20.00", 828, 177); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  { const rows = await page.evaluate(() => { const S = devicePixelRatio, out = []; for (let dy = -1; dy <= 0; dy++) { const d = window.__g.getImageData(Math.floor(400 * S), Math.floor((177 + dy) * S + (S > 1 ? S / 2 : 0)), 1, 1).data; out.push(Array.from(d)); } return out; });
    const mixed = rows.some((v) => v[3] > 20 && !(Math.abs(v[0] - 255) <= 4 && Math.abs(v[1] - 230) <= 4 && v[2] <= 4));
    ok("an order line spread over two pixel rows, first frame on a new row: pure bracket colour (no mix with its own at the edges)", !mixed, rows.map((v) => v.join(",")).join(" / ")); }
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "rgba(40,200,200,0.5)"; g.beginPath(); g.moveTo(0, 222.5); g.lineTo(500, 222.5); g.stroke();
    g.fillStyle = "#2a8a3c"; g.fillRect(300, 218, 20, 9); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  { const v = (await rgbaAt(250, 222)).split(",").map(Number);
    ok("a see-through line with no label: drawn exactly as it is (once, its own colour and opacity)", Math.abs(v[0] - 40) <= 6 && Math.abs(v[1] - 200) <= 6 && Math.abs(v[2] - 200) <= 6 && v[3] > 100 && v[3] < 160, v.join(",")); }
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "rgba(40,200,200,0.5)"; g.beginPath(); g.moveTo(0, 222.5); g.lineTo(500, 222.5); g.stroke();
    g.fillStyle = "#2a8a3c"; g.fillRect(300, 218, 20, 9); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  ok("...next paint: drawn straight away, so what the chart draws over it stays on top", await at(310, 222, "#2a8a3c"), await rgbaAt(310, 222));

  // ---- level lines that are hidden or see-through: right from their first frame ----
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#7828c8"; g.beginPath(); g.moveTo(120, 401.5); g.lineTo(700, 401.5); g.stroke(); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  { const v = (await rgbaAt(400, 401)).split(",").map(Number); ok("a level hidden in Each indicator: not there, not even in its first frame", v[3] === 0, v.join(",")); }
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#7828c8"; g.beginPath(); g.moveTo(120, 401.5); g.lineTo(700, 401.5); g.stroke(); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  { const v = (await rgbaAt(400, 401)).split(",").map(Number); ok("...nor later", v[3] === 0, v.join(",")); }
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "rgba(40,160,90,0.5)"; g.beginPath(); g.moveTo(120, 431.5); g.lineTo(700, 431.5); g.stroke(); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  { const v = (await rgbaAt(400, 431)).split(",").map(Number);
    ok("a see-through level with a colour of yours: your colour only in its first frame (no mix with its own)", Math.abs(v[0] - 0) <= 6 && Math.abs(v[1] - 229) <= 6 && Math.abs(v[2] - 255) <= 6 && v[3] > 100 && v[3] < 160, v.join(",")); }
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#5a1e78"; g.beginPath(); g.moveTo(0, 471.5); g.lineTo(700, 471.5); g.stroke();
    g.fillStyle = "#5a1e78"; g.fillRect(700, 461, 90, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("Alert", 745, 471); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  ok("a new line with a tag on its row isn't taken for a level, and is drawn as it is", await at(300, 471, "#5a1e78"), await rgbaAt(300, 471));

  // ---- price-scale tags of your lines ----
  const curve = (col) => { const g = window.__g; g.save(); g.lineWidth = 2; g.strokeStyle = col; g.beginPath(); g.moveTo(40, 300); for (let i = 1; i <= 12; i++) g.lineTo(40 + i * 60, 300 + Math.sin(i) * 30); g.stroke(); g.restore(); };
  await page.evaluate(([c]) => { window.__clear(); window.__clearAxis(); (new Function("col", "(" + c + ")(col)"))("#dc7828"); window.__tag(300, "#dc7828", "4812.25"); }, [curve.toString()]);
  await page.evaluate(() => window.__endFrame());
  ok("an indicator line in your colour: its value tag on the scale takes your colour too", await page.evaluate(() => window.__isA(40, 296, "#a855f7")), await page.evaluate(() => window.__pxA(40, 296)));
  ok("...the number on it stays readable (white on this colour)", await page.evaluate(() => { const d = window.__ga.getImageData(0, Math.floor(286 * devicePixelRatio), Math.floor(68 * devicePixelRatio), Math.floor(28 * devicePixelRatio)).data;
    let w = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) w++; return w > 10; }));
  await page.evaluate(() => { window.__clearAxis(); window.__tag(120, "#26a69a", "4811.00"); });
  ok("the price tag (candle colour) is left as it is", await page.evaluate(() => window.__isA(40, 116, "#26a69a")), await page.evaluate(() => window.__pxA(40, 116)));
  await page.evaluate(() => { window.__clearAxis(); window.__tag(520, "#aa33cc", "4790.00"); });
  ok("a tag in a colour that isn't yours is left as it is", await page.evaluate(() => window.__isA(40, 516, "#aa33cc")), await page.evaluate(() => window.__pxA(40, 516)));
  // an order line in exactly that colour: its label on the chart, its tag on the scale at the same height
  await page.evaluate(([c]) => { window.__clear(); window.__clearAxis(); (new Function("col", "(" + c + ")(col)"))("#dc7828"); const g = window.__g;
    g.save(); g.lineWidth = 1; g.strokeStyle = "#dc7828"; g.beginPath(); g.moveTo(0, 600.5); g.lineTo(782, 600.5); g.stroke();
    g.fillStyle = "#dc7828"; g.fillRect(782, 590, 92, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("SL -$80.00", 828, 600); g.restore();
    window.__tag(600, "#dc7828", "4770.50"); window.__tag(300, "#dc7828", "4812.25"); }, [curve.toString()]);
  await page.evaluate(() => window.__endFrame());
  ok("an order line in the same colour as a restyled indicator: its tag keeps its colour (stop-loss / take-profit stay recognisable)", await page.evaluate(() => window.__isA(40, 596, "#dc7828")), await page.evaluate(() => window.__pxA(40, 596)));
  ok("...its line takes the bracket colour, the indicator's line its own", await at(300, 600, GOLD) && await at(160, 300 + Math.sin(2) * 30, "#a855f7"), [await px(300, 600)]);
  ok("...and the indicator's tag still matches the indicator", await page.evaluate(() => window.__isA(40, 296, "#a855f7")), await page.evaluate(() => window.__pxA(40, 296)));
  // a hidden line's tag stays (its value stays readable)
  await page.evaluate(() => { window.__clearAxis(); window.__tag(401, "#7828c8", "4800.00"); });
  ok("the tag of a line hidden in Each indicator is left as it is", await page.evaluate(() => window.__isA(40, 397, "#7828c8")), await page.evaluate(() => window.__pxA(40, 397)));

  // ---- overlapping: an indicator line crossing an order line; a level on an order line's row ----
  await page.evaluate(() => { window.__clear(); const g = window.__g; g.save(); g.lineWidth = 1; g.strokeStyle = "#fa640a"; g.beginPath(); g.moveTo(0, 350.5); g.lineTo(782, 350.5); g.stroke();
    g.fillStyle = "#0a0afa"; g.fillRect(782, 340, 92, 21); g.font = "11px Verdana"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("TP +$412.50", 828, 350);
    g.lineWidth = 3; g.strokeStyle = "#0afa64"; g.beginPath(); g.moveTo(380, 330); g.lineTo(420, 370); g.stroke(); g.restore(); });
  await page.evaluate(() => window.__endFrame());
  ok("a trend line drawn over an order line stays on top of it (drawing order kept)", await at(400, 350, PURPLE), await px(400, 350));
  ok("...the order line is in the bracket colour either side", await at(200, 350, GOLD) && await at(600, 350, GOLD), [await px(200, 350), await px(600, 350)]);

  const p = Object.values(results).filter((r) => r.pass).length;
  console.log(`\nHOOK COLOURS: ${p}/${Object.keys(results).length}`, errs.length ? "page errors: " + JSON.stringify(errs.slice(0, 3)) : "");
  await b.close();
  process.exitCode = p === Object.keys(results).length ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
