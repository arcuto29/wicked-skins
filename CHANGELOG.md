# Changelog

## 0.1.35 (2026-11-04)
- **Streamer mode** (Capture → Streamer mode, or Alt+Shift+P on the chart): hides your money while you stream or record.
  - The numbers in your TP / Stop / P&L labels become dots, right where TradingView draws them, so they're hidden on screen and in any recording.
  - Priism's P&L readout and goal bar (including how full it is) and the journal amounts are hidden too.
  - TradingView's account and order panels are blurred. Optionally they clear while your mouse is over them.
- **Auto trade clips** (Trading → After each trade → Save a clip): while you're in a trade, Priism keeps the last 15 s, 30 s or 1 min ready and saves a clip automatically when the trade closes, ending just after the close. Nothing records while you're flat.
- **Less crowded panel**:
  - A section that's switched off now shows only its title and a short line; switch it on and its options appear.
  - Uploads moved into Skins (Looks · Wallpapers · My uploads), so there's one tab fewer.
  - The journal and auto clips sit together under "After each trade".

## 0.1.34 (2026-11-04)
- **Focus mode** (default Alt+Shift+F on the chart): fades the wallpaper away and pauses it, so only your chart is left. Press again to bring it back.
  - "Everything" also drops the chart styling. Your P&L, goal bar, session timer and brackets stay.
  - If Focus is on, the panel shows a banner with an Exit button.
- **Shortcuts you can change** (Adjust → Shortcuts): Focus mode, Record a clip (press again to stop early), Snapshot (saves straight to downloads) and Turn everything on/off.
  - Click a key and press the new one; Backspace turns a shortcut off.
  - Plain letters, keys you already use and browser shortcuts are refused. You get a warning if TradingView also uses that key.
- **Session timer** (Trading → Session timer): a slim countdown to the next market open or close in your look's colour.
  - Covers CME futures (Globex + the NY session), US stocks, Forex (Tokyo, London, New York), London, Tokyo and Crypto (daily close), or picks automatically from your symbol.
  - Uses each exchange's own time zone, so daylight saving is handled; holidays aren't included.
  - Sits just above the time axis so it never covers TradingView's legend, and shows in snapshots and clips.
- **Share links** replace look codes (Saved → More ways to share). One link opens a page with a live preview of the look. With Priism installed, click its icon on that page and tap **Add look**. Older look codes still paste.
- Community looks now say "coming soon" instead of showing an error until the database is set up.

## 0.1.33 (2026-11-04)
- **Reorganised panel: everything in one place, no duplicates.**
  - **Style**: Candles (colours, look and glow together), Chart lines (grid, crosshair, price line, session breaks, plus line glow), Price scale (now including scale borders).
  - **TradingView** (new): one section for TradingView's own interface (top and bottom bars, left toolbar, panels, windows & menus), plus Text & accent.
  - **Trading** (new): Trade brackets, P&L readout, Daily goal and Trade journal.
  - **Capture** (new): Snapshot, Clip and Watermark.
  - **Saved**: your saved looks. Look codes and file export are under "More ways to share".
  - **Adjust**: Picture and Motion, with Advanced (wallpaper layer, multiple charts, sessions, per symbol) below.
- The separate Glow section is gone. Candle glow sits with Candles, and line glow with Chart lines.
- Retired **Live mood** (the chart glowing with your P&L or the day's move). It was too distracting next to calm wallpapers, and it's switched off for everyone.

## 0.1.32 (2026-11-04)
- Fixed saving an edited clip getting stuck at the end. When the end point was at the very end of the clip, the browser could stop delivering frames a moment before it, so the save never finished.
  - Saving now finishes when the end point is reached (within one frame), when the video ends or pauses, or at a hard deadline.
  - A timer keeps frames coming if the browser pauses them, and it never waits forever for the recorder.
  - Tested: a 10 s clip at 30 fps and a 30 s clip at 60 fps, cropped and trimmed to the end, both save at the right length. On the previous version the 10 s case hung.

## 0.1.31 (2026-11-04)
- **TradingView's windows & menus in your style** (Style → Interface → Windows & menus): the Settings window, other dialogs and dropdown menus can be **Glass** (frosted, your wallpaper glows through) or **Colour** (your own), with a Strength slider. Everything inside follows and text stays readable.
- **Clip quality** (Clip → Quality): High, Balanced or Small file. Small keeps long clips under ~20 MB, handy for Discord. Long clips no longer get a lower bitrate automatically.
- **Faster clip saving**:
  - If you don't crop or trim, "Save" is instant (it saves the original).
  - The editor has Size (Original, 1080p, 720p, 480p) and Quality options, with an estimate of the file size.
  - Saving an edited clip shows how many seconds are left. It still takes about as long as the clip, because the browser re-records it as it plays.

## 0.1.30 (2026-11-04)
- **Fixed brief freezes of the wallpaper and chart.** Three periodic jobs could each cause a short hitch on some PCs; all three are fixed:
  - An idle chart was fully redrawn about every 2 seconds as the wallpaper's brightness drifted. It now redraws only when the price-scale text really needs to switch between light and dark (in tests: 22 redraws in 40 s → 0).
  - Measuring the wallpaper (and video wallpapers) read pixels straight off the graphics card, which can stall the page. Frames are now shrunk in the background first, half as often, and never while the tab is hidden.
  - The "Skin colour" is now taken once per wallpaper. Animated wallpapers no longer keep re-colouring the lines and TradingView's panels.
- **Trade brackets: support for TradingView's newer label style**, where the box is rounded and the number is plain (like "40.75", 14px TradingView font). The labels are now restyled, and profit / loss colours come from the box's own green / red when the number has no + or − sign.

## 0.1.29 (2026-11-04)
- **Changes now show instantly.** Dragging through colours or clicking through options keeps up with you instead of stepping slowly through every colour.
  - Every change gets TradingView's own light redraw on the very next frame, with no blink. In tests the chart showed the final colour 12–18 ms after the last step, down from 130–200 ms.
  - The full chart rebuild (only needed for new candle colours, because TradingView caches volume-bar colours) now runs once, after you stop changing things.
  - Grid, crosshair, price line, panels, wallpaper, brackets, glow and candle looks no longer make the chart blink at all.
- Fixed a 2.8-second freeze when picking a panel colour (Interface → Panels). The colours are now applied in one step.

## 0.1.28 (2026-11-04)
- Crosshair price and time labels can match your crosshair colour (Chart styling → Crosshair → Price & time labels). The text stays readable.
- Session breaks are now recognised by the colour set in TradingView's own settings. They're grey dashed lines by default, and could be mixed up with the grid before.
- Panel: no option text is cut off any more ("Skin c…", "Ca…"). Rows with option buttons show their label on top, so every choice reads in full. Checked automatically across every tab.
- New store screenshots showing the new design and chart styling.
- Stability: a stress test switched wallpapers, candle looks, chart styling and panel colours dozens of times. Memory, page size and canvases stayed flat, and it held 60 fps.

## 0.1.27 (2026-11-04)
- **Community looks** (Workshop → Community looks): browse whole setups other traders shared (wallpaper, candles, chart styling, panels) by Top, New or Mine, each with a live preview and an "ON" count. One tap puts a look on, and Undo is one tap too.
  - **Share my current look** sends your setup to the website, where you sign in and post it. Shares are reviewed before they appear.
  - The website has a new admin **Review** queue for wallpapers and looks.
- **More chart styling**: session breaks (colour, width, style, or hide) and scale borders (colour or hide).
- **A cleaner, modern panel**: icon navigation, refined cards and controls, glowing selection, better focus states and a slimmer scrollbar.
- **Welcome tour** on first install and a **What's new** card after each update. Both are cards at the top, never a blocking popup.
- Apps: in the desktop and Android apps, web links from the panel (Share my look, the Workshop website) now open in your browser.

## 0.1.26 (2026-11-04)
- Trade brackets: added support for charts where TradingView draws TP / Stop / P&L labels once into a hidden canvas and pastes that picture onto the chart. Bracket styling never saw these labels, so it had no effect there.
  - Pasted labels are now redrawn as a styled pill: dark box, bigger number, profit green / loss red.
  - Labels on a separate overlay canvas in the chart area are covered too.
- Light labels (for example white) get a darker box, so profit and loss numbers keep their colour instead of turning white.
- Diagnose (Style → Trade brackets) now reports where the numbers on your chart are drawn: chart, overlay, hidden canvases, or page elements. It also reports which site the chart is on, to fix anything left quickly.

## 0.1.25 (2026-11-04)
- **Chart styling** (Style → Chart styling): grid, crosshair and price line, each Own or Styled. Pick the colour (Skin colour follows your wallpaper; Candle, or any colour), width and style (solid, dotted, dashed, or no grid). Grid strength, plus a soft glow where the crosshair meets your pointer.
- **TradingView's panels in your colours** (Style → Interface → Panels): the watchlist, toolbars, menus and dialogs, in a tint of your wallpaper or any colour. Text stays readable.
- **Crop & trim your recordings**: when a clip ends, an editor opens on the page. Drag a crop box (Free, 16:9, 9:16, 1:1, 4:5), trim the start and end, then save. "Save original" and a "Download right away" setting are there if you prefer.
- **8 new "Wow" wallpapers**, each with its own one-click look: Event Horizon, Fractal Bloom, Ink Flow, Kaleidoscope, Oil Slick, Tesseract, Double Helix and Synapse. 50 wallpapers in total.
  - Order Ladder, Ghost Charts, Candle Rain and Equalizer are retired as too distracting. If you were using one, you now get Fog Bank.
- **Easier to find everything**:
  - "Find a setting" search at the top of the panel jumps straight to any option.
  - The Skins tab has a Looks / Wallpapers switch, search, and look groups (Wow, Calm, Glow, Classic).
  - "Keep my wallpaper" applies a look's candles and styling to your own background.
  - Candle look previews now show on your current wallpaper.
- **Lighter on your computer**:
  - The panel only animates the previews you can see.
  - Nothing re-applies or redraws unless something really changed.
  - Tested at a steady 60 fps with every new option on.

## 0.1.24 (2026-11-04)
- **16 candle looks** (was 4), each shown as a card with a live preview in your own candle colours: Solid, Neon, Glass, Chrome, Ice, Lava, Fade, Outline, 3D, Holo, Ghost, Rounded, Pixel, Heat, Rainbow and Cycle.
  - Fade is brightest where each candle closed. Heat warms up the higher price is on the chart. Ghost shows barely-there bodies with solid open and close caps.
  - They work with any colours, on TradingView and on Lightweight Charts apps like nq.vision, and on desktop and Android too.
  - Bordered candles are drawn once, so outlines and glass don't double up. No measurable slowdown (60 fps in tests).

## 0.1.23 (2026-11-04)
- Custom trading apps built on TradingView Lightweight Charts (like nq.vision): candle colours and glow now work, not just the wallpaper and watermark.
  - Candle colours are learned even when the app uses slightly see-through colours, or draws candles as shapes instead of plain boxes.
  - The chart is found even if it shows up long after the page loads, for example after you log in. Before, the candle part gave up after 30 seconds.
  - The chart is recognised by its layout, so it's found even when the app renames TradingView's chart parts or uses a generic "chart-container" name.
  - Candle glow now works on these apps too.
- New: **Left toolbar** setting (Style → Placement): Glass or Clear lets the wallpaper show through TradingView's drawing-tool bar. It's off by default, so nothing changes unless you turn it on.

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
