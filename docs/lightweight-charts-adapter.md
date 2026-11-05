# Priism Skins on TradingView **Lightweight Charts** (e.g. nq.vision)

**Status: shipped (v0.1.11).** `src/lw.js` is a Lightweight Charts adapter that recolours candles (up/down,
auto-learned from the chart) and clears the chart background so a wallpaper shows through. It activates only when
Lightweight Charts is present and Advanced Charts is not, so it never conflicts with the main engine on
tradingview.com. Verified against a live Lightweight Charts chart (8/8).

**What works:** wallpaper behind the chart, candle recolour. **What does NOT exist on this engine:** the broker
**trade brackets** (TP/Stop/entry/P&L pills) — Lightweight Charts has no such element, so there is nothing to
restyle. Price-scale text styling and glow are Advanced-Charts-only for now.

The rest of this note is the original feasibility analysis.

---

## Why today's build shows nothing on nq.vision

Priism Skins is written for TradingView's **Advanced Charts** library (the big charting widget on
tradingview.com and prop platforms like TopstepX). It recognises that engine by fingerprints that **do not exist**
in Lightweight Charts:

| What we rely on (Advanced Charts) | In Lightweight Charts? |
|---|---|
| `.chart-container` / `.chart-markup-table` / `.layout__area--center` DOM | ❌ different DOM (a `tv-lightweight-charts` wrapper you create) |
| `window.TradingViewApi` (candle colours, repaint, multi-chart) | ❌ no global API object |
| Candle/price-scale draw signatures we detect at canvas time | ❌ drawn differently |
| Broker **position/order "bracket pills"** (TP / Stop / entry / P&L) | ❌ not a feature of Lightweight Charts at all |

So detection never fires → nothing is skinned. nq.vision is also **"modified,"** which adds uncertainty on top.

---

## What a Lightweight Charts adapter COULD do

Lightweight Charts is HTML5-canvas based and ships a clean public API, so two paths exist:

### A. Native styling (cleanest, no canvas hacking) — *best done by nq.vision itself*
Lightweight Charts exposes styling through its own API. The platform (or our injected script, if it can reach the
chart object) can call:
- `chart.applyOptions({ layout: { background: { type: 'solid'|'gradient', color/topColor/bottomColor }, textColor }, grid: {...} })`
- `candleSeries.applyOptions({ upColor, downColor, borderUpColor, borderDownColor, wickUpColor, wickDownColor })`

This covers **background colour/gradient, grid, candle colours** reliably and pixel-perfectly. It does **not** give
a live image/video wallpaper or glow — those aren't native options.

### B. Canvas hook (what our extension does) — feasible but new work
Our `fillRect`/`fill`/`stroke`/`fillText` interception approach *can* apply, but every detection rule must be
re-learned for this engine:
- **Wallpaper behind the chart** — position our layer over the Lightweight Charts container instead of
  `.chart-container`, and clear the engine's background fill so the wallpaper shows through. **Feasible.**
- **Candle recolour + glow** — identify the candle fills in this engine's draw stream (no `TradingViewApi`, so we'd
  learn colours from the series options or from the most-drawn small opaque fills). **Feasible, medium effort.**
- **Price-scale text styling** — different axis DOM/draw; re-detect. **Feasible, small/medium.**
- **Trade brackets** — ❌ **impossible**: the engine has no broker position/order pills. There is nothing to
  restyle. (Markers/primitives a site adds are custom and not a standard pill.)

---

## Realistic scope if we build adapter (path B)

| Feature | On Lightweight Charts |
|---|---|
| Image / video wallpaper behind the chart | ✅ likely |
| Candle colour + glow / looks | ✅ likely (medium effort) |
| Price-scale colour / size / glow | ⚠️ partial, needs re-detection |
| Watermark overlay | ✅ (it's our own layer, engine-independent) |
| **Trade brackets (TP/Stop/entry pills)** | ❌ not possible — no such element |
| Multi-chart / skin-per-symbol / session skins | ⚠️ depends on how nq.vision mounts charts |

## Blockers to confirm before investing
1. **Reachable on desktop Chrome?** Extensions don't run on mobile browsers at all — if nq.vision is used on a
   phone, none of this applies. Must be desktop Chrome.
2. **Same-origin / not a locked cross-origin iframe** we can inject into.
3. **What was "modified"?** A custom renderer / WebGL path could break canvas-2D hooking entirely.
4. **Owner consent** to hook their platform.

## Recommendation
- For the **background + candle colours**, the lowest-risk, best-looking option is for **nq.vision to apply them
  natively** via `applyOptions` (snippet above) — no extension needed, works on mobile too.
- If an image/video **wallpaper** and **glow** are the goal, that needs our canvas adapter (path B) — a separate,
  Lightweight-Charts-specific module. Worth doing only after the four blockers above check out.
- The **brackets** feature is off the table on this engine regardless.
