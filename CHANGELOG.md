# Changelog

## 0.1.22 (2026-11-04)
- Fixed TP / Stop / P&L numbers that could turn invisible ("fully white") with trade-bracket styling on.
  - A strengthened box used to become TradingView's own pill colour at full strength, often the same colour as its number. It is now a dark box tinted with that colour.
  - The number is checked against its box. If they're too close in colour, it switches to black or white so it always reads.
  - With Box set to Keep, we no longer override TradingView's own number colour.
  - Pill text is now recognised by where it sits (inside a pill box), not only by font, so pills drawn in a different font get styled too.
- New one-tap button in Style → Trade brackets: **Make TP / Stop / P&L easy to see** (bigger number, dark box, profit green / loss red, thicker line and outline).

## 0.1.21 (2026-11-07)
- Fixed custom trading apps built on TradingView Lightweight Charts (like nq.vision): the wallpaper and candle colours now show up. Before, only the watermark did.
  - The wallpaper was hidden behind the app's own solid backgrounds. On these apps it now sits inside the chart's own box, directly under the chart, so nothing the app paints around the chart can cover it.
  - Candle colours now work with the app's own colours, not just the library defaults (the extension works out which colours are the candles). The chart is told to redraw when you change a setting, so changes show straight away.
  - The price and time scales become see-through panels instead of solid strips.
- Diagnose (Style → Trade brackets) now explains what it sees on these pages: whether the wallpaper is mounted, which candle colours were found, and what sits over the chart, so any remaining problem can be pinned down from one pasted message.
- Note: broker pills (trade brackets) don't exist on these charts, and the Interface and Sides options only apply to TradingView itself.

## 0.1.20 (2026-11-07)
- 22 new live wallpapers, taking the collection from 24 to 46: Totality, Meteor Shower, Wormhole, Pulsar, Wildfire, Caldera, Hive, Old Terminal, Laser Show, Equalizer, Night Drive, Midnight Towers, Zen Waves, Fog Bank, Reef Light, Silk, Autumn Drift, Moonlit Ridge, Jellyfish, plus three trading-themed ones: Candle Rain, Order Ladder and Ghost Charts. Every one is light on your computer.
- New "Max" smoothness (Adjust → Smoothness): the wallpaper runs at your screen's own refresh rate, so on a 120/144/240 Hz monitor it is as smooth as the screen allows. Before, the top setting was capped at 60 fps. Max uses more GPU; auto quality still eases off if your computer struggles.
- Fixed auto quality: it used to lower the wallpaper's quality when your computer struggled but never raised it again. It now recovers once things are smooth, and waits longer before retrying if it keeps failing.
- Fixed a brief blank flash of the wallpaper whenever it changed resolution or you resized the window, and a wallpaper that could stay blank if it was paused at that moment.
- Live clip can record at 60 fps (Saved → Live clip → Smoothness). Whole-screen recordings follow the same setting.

## 0.1.19 (2026-11-06)
- Snapshots and chart-only clips now include your effects: wallpaper blur, saturation, hue and black & white, opacity and "On top" mode, vignette, the mood glow, the big P&L readout, the daily goal bar and the watermark (even while it drifts). Before, they only had the wallpaper, the chart and the watermark.
- Live clip can now record your whole screen. Pick "Whole screen" under Saved → Live clip, press Record, click the card that appears on your chart, and choose what to share in Chrome's box. It records exactly what you see, so everything is in it, including uploaded wallpapers that chart-only clips can't read. It downloads by itself when it ends; Chrome's "Stop sharing" button ends it early.
- Fix: the Saved tab no longer scrolls sideways, and the look-code and custom-length boxes match the rest of the panel.

## 0.1.18 (2026-11-06)
- Daily goal & limit: an optional slim bar on your chart tracking today's P&L against a profit goal and a max loss. It turns amber at 80% of your limit and red at 100%, and tells you once when you hit your goal. Find it under Style → Daily goal & limit.
- Trade journal: an optional journal that saves a picture of your chart, as it looked while the trade was open (your entry, stop and target), stamped with the symbol, P&L and time held, every time a trade closes. Stored only on your computer (latest 60). Find it under Saved → Trade journal.
- Both work from the P&L your chart already shows on your position line, so they are estimates, not your broker's statement. They don't read your account, and nothing leaves your computer.

## 0.1.17 (2026-11-05)
- Live clip: record for as long as you like, from 2 seconds up to 2 minutes. Pick 5s / 10s / 30s / 1 min / 2 min, or type your own length.
- Live clip now downloads by itself the moment recording ends, so you can click Record and close the panel. A countdown badge on the chart shows the time left; click it to stop and save early.

## 0.1.16 (2026-11-05)
- Fix: shortened the extension's description so it meets the Chrome Web Store's 132-character limit (the store rejected the upload otherwise). No feature changes.

## 0.1.15 (2026-11-05)
- Live clip: record a short animated clip (WebM) of your chart with the live wallpaper moving — the animated companion to Snapshot, for sharing a vibe a still can't show. Pick 3/5/8 seconds under Saved → Live clip. (Built-in animated skins record their motion; an uploaded image/video wallpaper renders in a protected frame so it isn't in the clip — the chart and watermark are.)

## 0.1.14 (2026-11-05)
- Look codes: copy a short code of your whole look (skin, candles, glow, price scale, brackets) and share it anywhere — anyone pastes it to get your exact setup in one tap. Under Saved → Look code.
- Snapshot: one-click capture a clean PNG of your chart with the skin and your watermark baked in, ready to share. Under Saved → Snapshot. (Animated wallpaper is captured as a single still frame; an uploaded image/video wallpaper can't be included because it renders in a protected frame — the chart and watermark still are.)

## 0.1.13 (2026-11-05)
- Six bold new "glow in the dark" one-click looks: Glowstick, Blacklight, Vaporwave, Molten, Warp and Spectrum (a full-rainbow prism). Luminous neon-tube candles with strong glow over a dimmed dark wallpaper — the opposite end from the calm set. Every look now has its own wallpaper.

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
