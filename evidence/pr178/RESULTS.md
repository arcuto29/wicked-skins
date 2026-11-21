# PR #178: candle looks at every zoom, price-scale stretch and timeframe — test results

Code tested: branch `fix/candle-scaling` at **aaaa38e** (base: main 8bb7345).
Test ZIP: `priism-candle-scaling-test.zip`. Every one of its 55 files is byte-identical to aaaa38e (list in
`zip-files.sha256`); the ZIP's SHA-256 is `1e3f1fdf51a8cde029fd7e26945d1229a8af664cfc05080905e689414ad25d7a`.

## Where it was tested

| Platform | Real site? | How |
|---|---|---|
| **TradingView (tradingview.com)** | **Real site**, no account (NQ1!) | All 34 looks × 7 states driven by mouse/keyboard (wheel zoom, price-axis drags, Alt+R); 6 looks × all 8 timeframes |
| TradingView Trading Terminal (TradingView's official demo of its charting library) | Real TradingView chart, demo site | All 34 looks × 26 states, fast changes, real axis drags, all 34 looks × 8 timeframes, 1× and 2× screens |
| **nq.vision** | **Stand-in** (login required) | Lightweight Charts 5.2.1 with nq.vision's grey/black candles; colours learned by shape (no API), as on nq.vision per your Diagnose message; 1× and 2× |
| **TopstepX** | **Stand-in** (login required) | `tsxsite` pages (TopstepX look suite); TopstepX uses the same TradingView hook as above |
| High-DPI | Emulated | Chrome `--force-device-scale-factor` (real 2× canvas backing); not a physical Retina/4K screen |

Not tested on the real nq.vision or TopstepX: those need your accounts. Please check them with the test ZIP.

## Results

**Drawing code, deterministic pixel diff** (`tests/lookdiff.js`, `results/lookdiff.log`, 9/9):
- 1× screens: **all 9,508 ordinary candles draw the same pixels as before**: 34 looks × widths 1–300 px × heights
  1–590 px × up/down. That covers 1m to Weekly sizes, dojis and very wide bodies.
- The 12 narrow "Pixel" bodies (3–4 px wide, 400–590 px tall) that the old 80-block limit cut short now draw in full.
- Stretched far past the pane: "Lines" (narrow and wide) and "Pixel" (narrow) stopped part-way before. Now they reach
  the bottom. No look has less ink than before.
- 2× screens: mean alpha difference from the 1× look **1.06 → 0.02**.

**Real tradingview.com, all 34 looks** (`results/tvreal-real-*.json`):

| State | before (main): big bodies drawn plain | after |
|---|---|---|
| normal, zoomed in, price scale squeezed | 0 | 0 |
| price scale stretched | **1,054 of 5,372** (all 34 looks) | **0** |
| zoomed in + stretched | **714 of 2,856** (all 34 looks) | **0** |

- After: all 238 states (34 looks × 7) were measured with candles in view, with 0 unstyled and 0 empty bodies.
- Zoomed out: TradingView draws 1 px bodies there, which nothing styles.

**Real tradingview.com, timeframes 1m / 5m / 15m / 30m / 1h / 4h / D / W** (Neon, Glass, Fade, Lines, Liquid Chrome,
Diamond Cut × normal / zoomed in / stretched / zoomed in + stretched / zoomed out + stretched):
- The timeframe was confirmed from TradingView's header each time.
- **197 of 240 states measured: 0 unstyled, 0 empty.**
- The other 43 had no candles in view: TradingView's prompts for visitors without an account disturbed the zoom.
  See Limitations.

**TradingView terminal** (`results/zoomaudit-*.json`):
- **Every timeframe, all 34 looks:** 1,088 states (normal, zoomed in + stretched 16×, zoomed far in, stretched 64×).
  0 unstyled, 0 empty. Bodies up to 157 px wide and 15,127 px tall.
- Switching timeframes: stray ink in the first frames is within Priism-off's own range, with 0 empty candles.
- **26 zoom/scale states, all 34 looks** (bar spacing 2–40, price scale ¼× to 64×, combined): 0 unstyled, 0 empty.
  Stray ink equals Priism off.
- Fast changes and real price-axis drags: stray ink and frame times are the same as Priism off (16.7 ms median).
- **2× screen:**
  - Neon and Lines: 0 unstyled and 0 empty, with bodies up to 28,481 px tall.
  - 8 looks × 8 timeframes: 0 unstyled and 0 empty, with bodies up to 316 px wide and 30,253 px tall.

**nq.vision stand-in, colours found by shape like the real site, all 34 looks** (`results/lwscale-lwS-*.json`):

| State | before (main) | after |
|---|---|---|
| stretched (6 drags) | 81 plain + 5 left in nq.vision's grey/black, every look | 0 |
| zoomed far in (317 px bodies) | **all 3 bodies left grey/black**, every look | 0 |
| zoomed out + stretched | 9 left grey/black, every look | 0 |
| normal, zoomed out, squeezed | 0 | 0 |

- At 2× after the fix, all looks are clean, with bodies up to 636 px wide and 3,563 px tall.
- (Solid is drawn without the shared look code on Lightweight Charts, so the "plain" count doesn't apply to it. Its
  colours are correct: 0 bodies grey/black.)

**Glow on thin bodies (the one intended visual change), Neon, glow pixels per body:**
- 3 px bodies: 116 → 57.
- 5 px bodies: 175 → 156.
- 7 px and wider: unchanged.

**Other suites (on aaaa38e):** TopstepX look 34/34; Free/Pro plans 25/25 (Free 18/18, pass required 3/3, as shipped 4/4); nq.vision tint markers unchanged.

Before/after sheets: `tradingview-real-1..6.png` (real site), `nqvision-standin-1..6.png`.

## Known limitations
- Real nq.vision and TopstepX are not tested yet (accounts). A physical high-DPI screen is not tested (emulated 2×).
- Candles under 2.5 CSS px in either direction (dojis, far zoomed out) are drawn solid in the candle colour by every
  look. This is the existing design, unchanged. TradingView itself draws 1 px bodies at bar spacing 4 and below.
- Custom wick width (Candle parts) stays in device pixels, as before.
- Zones and rectangles are not part of this PR. The zone issues found earlier (square after touching, unit mismatch
  at non-1× scaling) are separate.
- Hologram and Cycle animate over time, so their pixels differ between moments by design.
- Real-site timeframe runs: 43 of 240 states had no candles in view because of TradingView's prompts for visitors
  without an account.
