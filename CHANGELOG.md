# Changelog

## 0.1.12 (2026-11-05)
- Six new one-click looks, all calm and easy on the eyes (candles, glow, price scale and wallpaper matched in one tap): Nightfall, Daybreak (a bright/light theme), Sterling, Firefly, Harbor, and Dune. Each uses its own wallpaper — no repeats.

## 0.1.11 (2026-11-05)
- New: support for platforms built on TradingView **Lightweight Charts** (a different engine from TradingView's main charts), such as nq.vision. On those charts Priism Skins now applies your wallpaper behind the chart and recolours the candles to your chosen up/down colours. Turn it on for the site the same way as any other (open the panel there → Turn on). Note: the trade brackets and price-scale styling are specific to TradingView's main (Advanced) charts and don't apply on Lightweight Charts, which has no broker pills.
- The Diagnose button now tells you which chart engine a site uses, so it's clear what will and won't apply.

## 0.1.10 (2026-11-05)
- Trade brackets: added a "Diagnose on my chart" button (Style → Trade brackets). If the brackets aren't restyling, click it and the panel tells you whether the skin engine is seeing your pills — and if not, what text is on the chart — so the issue can be pinned down without opening a console.

## 0.1.9 (2026-11-05)
- Trade brackets now recolour/resize the pill number reliably even when the pill's box is drawn in a way we can't intercept (some broker pills do this). Detection keys off the pill's font instead of requiring its box, so the TP / Stop / entry / P&L numbers restyle on far more setups.

## 0.1.8 (2026-11-05)
- Fixed: Trade brackets didn't restyle on some setups — including HiDPI / retina / scaled displays and the wide multi-part broker pills (quantity + P&L + close button). Detection is now display-density aware and keys off the pill's font, so every bracket variant is caught.

## 0.1.7 (2026-11-05)
- Trade brackets, fully customisable: recolour every part of your broker's on-chart TP / Stop / entry / P&L pills — the box, the number, the outline and the horizontal level line — in any colour you want, each independently (or leave any part as-is). The number now always stays readable (it picks black or white automatically on a recoloured box) and never spills out of the box when enlarged.
- Fixed: the TP / P&L numbers could be hard to see or the level line wouldn't restyle on some charts. Both are resolved.

## 0.1.6 (2026-11-05)
- Trade brackets: customise your broker's on-chart Take profit / Stop / entry / P&L pills — make the text bigger (Large / XL / Huge), add a stronger backing (Glass or Solid) so it stays readable on a busy wallpaper, and optionally recolour the profit/loss number. Find it under Style → Trade brackets.

## 0.1.5 (2026-11-05)
- P&L readout: a big, bold open-P&L number while you're in a trade — green/red or an animated rainbow, in any corner. Much easier to see than the default pill.

## 0.1.4 (2026-11-05)
- Match wallpaper: candle colours, glow and the price scale can follow your own uploaded wallpaper's colours.
- Interface: restyle TradingView's panels — font, size and an accent colour for the watchlist, top/bottom timeframe bars and toolbars. The left drawing tool rail is left as-is.
- Sides: the wallpaper now flows only across the chart's own top and bottom bars, not the watchlist or tool rail.
- New one-click look: Nexus Match (pairs with the Priisma Neon zone theme).
- Desktop app: opens to its settings/gallery and has an "Open TradingView with skins" button — it no longer pops a chart open by itself.

## 0.1.3 (2026-11-05)
- Privacy: removed a browser permission the extension no longer needs. No feature changes.

## 0.1.2 (2026-11-05)
- Skin per symbol: map a wallpaper to a ticker (BTCUSDT, NQ, AAPL…) and it switches by itself when you change symbol.
- Auto quality: on Smooth, the wallpaper lowers its detail by itself if your computer lags, then raises it again.
- Android app (beta): a build for phones and tablets — TradingView with Priism Skins built in.

## 0.1.1 (2026-11-05)
- Watermark: add your @handle, a Tiled style and Drift so your clips are harder to repost without credit, plus a strength slider.
- Sides: flow the wallpaper across the panels around the chart (watchlist and toolbars) — Glass keeps them readable, Clear is see-through.
- Four new one-click looks: Blackout (white & black candles on black), Terminal, Midas and Blossom.
- The macOS desktop app now builds.
- The Workshop no longer asks you to sign in inside the extension — browse and use wallpapers with no account; sharing happens on the website.

## 0.1.0
First release of Priism Skins.
- 24 live wallpapers behind your TradingView charts, plus your own images, GIFs and videos (any format).
- Candle colours and styles (Solid, Tube, Spectrum, Cycle), with glow on candles, indicators and P&L.
- Price-scale styling with a frosted-glass backing and a live-price tag that matches your colours.
- Auto readability: text stays legible whatever wallpaper is behind it.
- Multi-chart layouts: one wallpaper stretched across your layout, a copy per chart, or a different skin on each chart.
- One-click looks, saved looks, session skins, and a watermark for recordings.
- Workshop: browse community wallpapers and use them with one tap — no account needed. Share your own on the website.
- Works on tradingview.com and platforms that embed TradingView charts (e.g. TopstepX).
- Desktop app for Windows, macOS and Linux, with automatic updates.
