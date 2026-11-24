# Colour tests

Your chosen colours (brackets, drawings, indicator lines and levels) must be on the chart in every frame, never the
platform's own colour first. These tests check that frame by frame, not with a screenshot after things settle.

| Test | What | Needs |
|---|---|---|
| `hook.unit.js` | The colour hook alone, on a local page, with the exact drawing sequences TradingView uses (line before its label, cached labels pasted in clipped, label box first, lines-only repaints, a pause, new rows, drawings that disappear and come back, level lines, tags passing over them). Reads the pixels at the end of each paint. `--dpr 2` draws a real high-DPI canvas. `--src <dir>` runs it on another copy of `src/` (e.g. main, for a before/after). | Playwright. Runs in CI. |
| `flicker.e2e.js` | The extension on real charts: `--platform tv` (tradingview.com signed out: indicator + take-profit / stop-loss; TradingView allows no drawings without an account) or `--platform terminal` (TradingView's trading-terminal demo, the charting library TopstepX uses, drawings included). Repeats live updates, zoom, pan, price-scale drag, selecting / moving / editing a drawing, its settings dialog, order lines moving, timeframe, symbol, window size and reopening. | Network, a desktop Chromium build (Playwright) |
| `lw.e2e.js` | The same on TradingView's Lightweight Charts (what nq.vision uses), served from a local page. | Network (unpkg for the library) |
| `recorder.js` | Loaded before Priism by the e2e tests: records every draw in a watched colour (with its frame) and, once per frame, the native-coloured pixels on screen, plus stills (`still-*.png`). | |
| `still-colours.js` | Counts the watched colours in those stills. | |
| `run-all.sh` | All of the above, plus the BEFORE runs on a main checkout: `test/colours/run-all.sh <main checkout>`. Each e2e run takes 10-25 min. | |

Each element gets a native colour nothing else uses, so any pixel or draw in that colour while Priism is on is the
original colour showing. Results, recordings (`chart-*.webm`) and stills go to `test-output/colours/`.
