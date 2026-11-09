# Changelog

## 0.1.51 (2026-11-04)
- **Three more Christmas wallpapers**, each with its own one-tap look (Skins → Seasonal):
  - **Tree Lights:** Christmas-tree lights out of focus, glowing softly in the dark, with an occasional sparkle. The calmest of the set. Look: **Cozy Lights** (neon candles).
  - **Winter Village:** snowy rooftops at night, warm lit windows, chimney smoke drifting up, snowfall and a crescent moon. Look: **Silent Night** (ice candles).
  - **Northern Noel:** northern lights rippling over snowy hills, pines and a little cabin with a warm window. Look: **Northern Noel** (glass candles).
  - That's 4 Christmas wallpapers plus Hallows Night. In December the Skins card offers Christmas Spirit and points you to the others.
- **Four new Wow wallpapers**, each with its own one-tap look (Skins → Wow, Looks → Wow):
  - **Koi Pond:** six koi seen from above, swimming with real body bends, waving tails and fins, each with its own pattern (kohaku, showa, yamabuki and more). Light ripples over the water, the odd ring spreads where a fish nears the surface, and lily pads with pink flowers float on top. Look: **Koi Pond** (3D candles).
  - **Rain on Glass:** a rainy window over a blurred city at night. The glass is misted; drops slide down in little runs and wipe a clear streak where you see the city sharper, leaving tiny beads behind. Each big drop shows the city upside down inside it. Look: **Rainy Night** (glass candles).
  - **Ringed Giant:** a huge ringed planet rising in the corner of deep space: banded clouds and a storm, the rings' shadow across it, the near side of the rings passing in front, a soft atmosphere and a small moon drifting across. Look: **Ringed Giant** (holo candles).
  - **Deep Blue:** a manta ray gliding slowly through the deep ocean under soft swaying sunbeams, with marine snow and the odd stream of bubbles. Look: **Deep Blue** (ice candles).
  - All four draw off the chart's thread like the other wallpapers, so the chart stays smooth.

## 0.1.50 (2026-11-04)
- **Seasonal drops.** Two new wallpapers, each with a matching one-tap look:
  - **Christmas Eve:** a deep blue night, slow snowfall, a string of softly twinkling lights, snowy pines. Its look is **Christmas Spirit** (green / red glass candles).
  - **Hallows Night:** a harvest moon, low drifting mist, glowing jack-o'-lanterns, a bare tree and a few bats gliding past. Its look is **Hallows Eve** (purple / orange lava candles).
  - In December (Christmas) and October (Halloween), a card at the top of Skins offers the season's look: one tap, Undo as always. "Not now" hides it until next year. Both are in the new **Seasonal** chip all year.
- **Match everything** (top of the Style tab): one tap reads your wallpaper's colours and sets the candles, crosshair, grid, price line, price scale, ticker, trade brackets, P&L readout, TradingView's panels and windows, and the accent to match. Undo puts it all back.
  - Works with every wallpaper, including your own uploads, and in the desktop and Android apps.
  - Up candles always get the cooler colour (green, teal, blue, violet) and down the warmer one (red, orange, pink), the way traders read them.
  - Grey wallpapers get a matching silver look.
- **Recordings are now MP4** (H.264, with AAC sound where your browser supports it). They play everywhere: phones, Windows, Mac, editing apps and social sites. This covers clips, screen recordings, auto trade clips and edited clips. Browsers that can't record MP4 still save WebM.
  - To include music or anything else playing on your computer, set Capture → Clip → Sound to **Computer** (or **Both** for your voice too). Chrome asks what to share: on Windows tick "Share system audio"; on a Mac pick the tab that's playing.

## 0.1.49 (2026-11-04)
- **Focus guard is now a reminder, and it's instant.** At your max loss, a calm "Done for today" card appears on the chart. Nothing on TradingView is blocked any more: Priism only changes how things look. "Got it" hides it for the rest of today in every tab, and it comes back the next day. The option is now called "Done for today" at max loss (Trading → Daily goal & limit).
- **The P&L on your chart is read the moment it changes**, so the reminder, the daily goal bar and Live mood never lag. In a test, the card appeared about 0.01 seconds after the position's loss crossed the limit; before, it could take up to a second.
- **Fixed on Lightweight Charts platforms (like nq.vision): Live mood "day's move" could stay off** on a quiet chart. The chart's price was only read after the first second, and a still chart may draw its price just once.
- Zip installs: the update notice now offers the Chrome Web Store version, which updates itself.

## 0.1.48 (2026-11-04)
- **Focus guard** (Trading → Daily goal & limit → Lock trading at max loss; off by default).
  - Once today's loss reaches your max loss, TradingView's order panel and the chart's Buy / Sell buttons dim and can't be clicked.
  - A calm "Done for today" card shows your limit. No flashing and no alarms (the optional limit sound is separate).
  - To trade anyway, **hold Unlock for 3 seconds**. A short press does nothing, so it's a moment to think, not a wall. Unlocking lasts for the rest of today.
  - Every TradingView tab locks and unlocks together, and it resets the next day.
  - It works from the P&L your chart shows, like the daily bar. It's a nudge, not a block at your broker: orders placed elsewhere (your broker's app, another platform) aren't affected.

## 0.1.47 (2026-11-04)
- **Desktop app: TradingView in tabs, like TradingView Desktop.**
  - The chart window has a tab bar. **+** (or Ctrl+T) opens another chart, Ctrl+W closes one, Ctrl+Tab and Ctrl+1–9 switch. Chart links open as a new tab. Every tab is skinned.
  - **Opens where you left off:** your tabs come back with their layouts (TradingView keeps the layout in each tab's address), along with the window's size and position.
  - **Stays signed in:** your TradingView sign-in is saved to disk regularly and when the app closes.
  - A tab you're not looking at pauses its wallpaper, so extra tabs don't slow your computer.
  - The **Skins** button on the tab bar opens Priism Skins' settings.
- **nq.vision: the legend over the chart is readable.** Its symbol line and indicator names (EMA, VWAP…) are dark text made for its own dark-grey chart, so they disappeared on a wallpaper. They now get a soft dark halo, and text that's too dark is lightened. Coloured indicator values keep their colour. The ticker in that legend takes your Ticker styling, and indicator names are never mistaken for watchlist symbols.
- **Session timer: choose what it shows and how it looks** (Trading → Session timer).
  - **Style:** Pill, Glass card (market name on top, a big countdown, and a thin bar showing how far into the session you are) or Minimal (glowing text, no box).
  - **Shows:** "Status + next" ("NY session open · closes in 1h 20m") or "Next only" (no open/closed status).
  - **Time as:** a countdown ("in 1h 20m") or clock time ("at 4:00 PM", in your own time zone).
  - **While closed:** keep showing it, or hide it until the market opens.
  - The panel shows an example of what the timer will read.
- **nq.vision: the price line no longer gets the crosshair's glow.** nq.vision draws its price line in its own grey/black candle colour, which Priism mistook for a crosshair line. The line was styled like the crosshair and glowed where the crosshair crossed it. It now takes your price-line style, and the glow only appears where the crosshair's own two lines cross.

## 0.1.46 (2026-11-04)
- **nq.vision: your candle colours and looks now stay on.** They used to show for a couple of seconds after a refresh, then disappear. nq.vision first draws candles in default colours, then switches them to its own grey and black. Priism had also picked up blue and pink that nq.vision draws elsewhere, and took those for the candles, so it never noticed the switch.
  - Candles are now recognised by their shape: narrow bars spread across the chart that end at different heights. That works for coloured, grey, white or black candles. Volume bars and buttons are ignored, and only the candle bars are recoloured.
  - Changes show straight away, with no refresh. nq.vision never resizes its chart, so the old "redraw" nudge did nothing there. Priism now sends a tiny mouse-wheel nudge on the chart (and undoes it), which makes it redraw without changing your zoom.
- **Fixed: two "glow at the pointer" lights.** With more than one chart pane, a second glow stayed in the pane you'd just left. Fixed on TradingView (charts with indicator panes) and on Lightweight Charts platforms.
- Diagnose on those platforms shows "candles found by shape".

## 0.1.45 (2026-11-04)
- **Smoother charts: wallpapers are drawn in the background.** Built-in animated wallpapers now render on a background thread (a worker), so TradingView's own thread is free for the chart: scrolling, drawing tools and order entry. With a heavy wallpaper, TradingView got 1.4–1.7× more free time in tests (10× with Nebula), and wallpapers still run at 60 fps. Snapshots, clips, auto-contrast and every setting work as before. Pages or browsers that don't allow it fall back to the old way automatically.
- **Fixed for new installs: the first chart had no wallpaper.** On a first install, Priism opens a TradingView chart, and that tab could get the extension twice; the two copies removed each other's wallpaper. Each tab now runs exactly one copy.
- **Welcome for new users:**
  - On first install, a TradingView chart opens with a card explaining how to pin Priism Skins and change your look.
  - The panel's tour is hands-on: "Try a Wow look" applies one in a single tap, "Open Style" takes you there, and a step explains turning it on for your trading platform.
- **Fixed: price-scale numbers could turn dark on dark wallpapers.** After a coloured price tag, the following plain numbers were drawn in the tag's dark text colour. Only the text on the tag itself uses it now.
- **TradingView light theme:** the chart's bottom bar (1D 5D 1M…) is readable now too.
- Nebula is a little softer, so the price numbers and candles read better over its brightest clouds.
- New store screenshots and description for the Chrome Web Store listing (STORE.md).

## 0.1.44 (2026-11-04)
- **Fixed: candles not changing on nq.vision.** Its candles are grey/white and black. Priism ignores those shades on purpose (apps draw text, boxes and backgrounds in them), so they were never recoloured. Now it recognises grey candles by their shape (many narrow bars across the chart) and recolours only those bars. Candle looks work on them too. Text and boxes in the same shades stay as they are.
- Diagnose shows "grey candles found" when this applies.
- Releases publish to the Chrome Web Store automatically once the store keys are added (RELEASING.md); the release log says when they're missing.

## 0.1.43 (2026-11-04)
- **Screen recordings no longer start with Chrome's "Choose what to share" window in them.** The first frames of a new screen share still showed the picker closing. Recording now starts about a second later, once the picker is gone and a fresh frame of your screen has arrived. Same in the desktop app.

## 0.1.42 (2026-11-04)
- **Fixed on Lightweight Charts platforms (like nq.vision):** Priism could take the platform's white, grey, black or dark-navy drawing for candle colours, then recolour everything drawn in those shades (e.g. black areas turning your down colour). Only colourful candle colours are learned now, and greys / white / black are never treated as candles. Refresh the nq.vision tab once after updating, so the old copy is gone.
- **More customization on Lightweight Charts platforms:**
  - **Ticker** (Style → Chart lines & ticker): the platform's symbol name above the chart and its timeframe buttons take your ticker colour, size, font and glow.
  - **Accent** (TradingView tab → Text & accent): tints the platform's watchlist symbols and timeframe buttons. Panels already recolours the watchlist panel itself.
  - **Crosshair:** "Glow at the pointer" and "Price & time labels: Match crosshair" work there now.
  - **Line glow** (Style → Chart lines): indicator lines (EMA, VWAP…) and drawings glow. Candles, grid and crosshair don't.

## 0.1.41 (2026-11-04)
- **Platforms on Lightweight Charts (like nq.vision): the rest of your customization now works there too.**
  - **Panels** (TradingView tab → Panels: Skin or Colour) recolours the platform's own sidebars, headers and cards. Light surfaces (inputs, cards) get a light version of the colour so their text stays readable.
  - **Font** (TradingView tab → Text & accent) changes the platform's text; icons keep their icon font.
  - **Price scale** (Style tab): text colour, size, font, bold and glow on the price and time numbers, and Backing (Default keeps the platform's own, Colour uses yours).
  - **Trade brackets** (Trading tab): the platform's order and position lines take your level-line colour and width, and their labels (on the price scale and on the chart) your box colour, number colour, profit/loss colours and size.
  - **Streamer mode** hides the amounts in those labels and in P&L text drawn on the chart, using your P&L option.
  - **Live mood:** "P&L" follows P&L the chart draws; "day's move" follows the last price, measured from the first price seen today on that site, because these platforms don't put the price in the tab title.
  - Options that only style TradingView's own interface (top & bottom bars, left toolbar, windows & menus, text size, accent) are hidden on these platforms, with a note saying what applies.
  - Picture and Motion settings (strength, dim, blur, colour, tint, vignette, black & white, animation) already worked there.

## 0.1.40 (2026-11-04)
- **TradingView's light theme is readable now.** Its top bar, toolbars and side panels have dark text and no background of their own, so over a wallpaper they were close to invisible, and it didn't look like TradingView. They now keep TradingView's own light background.
  - The first time, a card on the chart offers **Use dark theme**, which flips TradingView's own theme setting (same as its menu's switch), or Keep light. Priism Skins looks best on dark.
- **Desktop app: sign in to your TradingView.** If the chart window isn't signed in (you'd see "Upgrade" and a default watchlist), a card offers **Sign in**. After signing in you're taken back to your chart, with your own layouts, watchlists, alerts and broker.
- **Lightweight Charts platforms (like nq.vision): candle looks on every kind of chart.** Some apps draw candle bodies as shapes instead of plain rectangles. Looks like Neon, Glass and Outline now work there too. Before, they couldn't apply, and on such a chart a look could even stop the candles from drawing.
  - Candle colours are now also learned on apps whose candles are white, grey or black (not only coloured ones).
  - Diagnose shows more about the chart (how candles are drawn, the most-drawn colours) so problems can be pinned down.
- **Your own wallpaper, no sharing needed.** It was already possible but easy to miss: Skins → Wallpapers and the Workshop now have a "Use your own image or video" link straight to **My uploads**. Your files stay private, on your computer.

## 0.1.39 (2026-11-04)
- **Style your ticker** (Style → Chart lines & ticker → Ticker): the symbol name at the top left of the chart.
  - Colour: your skin's colour, your candle colour, or any colour.
  - Size: Normal, Large, XL, Huge. Font: Default, Mono, Rounded. Optional glow.
  - Show the name, timeframe and exchange, or the name only.
  - Indicator names (like Vol) are left alone.
- **Trading sounds** (off unless you pick Soft or Loud; picking one plays it once so you know what you'll hear):
  - Daily goal & limit → Sound: a rising chime when you hit your goal, two even notes at 80% of your max loss, a low falling tone at the limit.
  - Session timer → Heads-up sound: a soft ping 5 minutes before the session opens or closes, and two pings when it does.
  - With several TradingView tabs open, only one of them plays. The tones are generated by the browser, with nothing to download.
- **Workshop: you're the admin automatically.** Your email is now built into `supabase/schema.sql`. Run it once in Supabase and your uploads go live with no review. Everyone else's appear under **Review** on the website's Workshop page for you to approve or reject.
- **Workshop uploads failing with "Bucket not found"**: the file storage hadn't been created on the server. Running `supabase/schema.sql` creates it. The script now finishes even if the project blocks the storage rules, and the website explains the problem plainly instead of showing the raw error.

## 0.1.38 (2026-11-04)
- **New wallpaper: Nebula** (Cosmos, Wow). Glowing gas clouds in violet, magenta and a warm orange core, with dark dust lanes, twinkling stars and a few bright stars with spikes. The clouds drift, turn and breathe slowly. It's light to run: the clouds are painted once, so each frame is only a few image draws.
- **Streamer mode, more control** (Capture → Streamer mode):
  - **P&L on your trades:** Hidden, Ticks, Points or Dollars.
    - *Ticks*: dollar amounts become dots, and TradingView's tick and % values stay visible. Set TradingView to show ticks in Settings → Trading.
    - *Points*: like Ticks, shown as points (e.g. −8 ticks on NQ shows as −2 pts). Works for the common futures (NQ, ES, YM, RTY, CL, GC and their micros, and more). Other symbols stay in ticks.
  - **The order panel is no longer blurred by default**, so you can still see and use it. Switch on "Blur order panel" if you want it hidden. "Blur account panel" (balance, positions, history) is on by default.
- **Trade brackets: lot size colour.** Give the quantity pill on your brackets its own colour (Trading → Trade brackets → Lot size colour).
- **Turning Priism Skins on for a platform takes one click.** Before, Chrome's permission prompt could close the panel before it finished, so you had to click Turn on twice. The background now finishes the job and reloads the tab.
- **No refresh needed after an update.** Charts that were already open get the new version straight away, and the panel can reach them. Before, the panel couldn't talk to the chart until you refreshed the page.
- **TradingView's big windows open smoother.** Trade / broker login, Settings, Indicators and Alerts open over a blurred chart. The wallpaper now holds still while one is open, so the blur isn't redone every frame. Small pop-ups don't pause it.
- **Lightweight Charts platforms (like nq.vision): chart lines.** Grid, crosshair and price-line styling (Style tab) now work there too, not only on TradingView. Wallpaper, candle colours and candle looks already worked. The TradingView tab styles TradingView's own panels, so it can't change a platform's own layout; the panel now says so on those sites.
- **Clip editor sound:** the button now says "Play sound" until the preview can actually play sound. Before, it said "Sound on" over a silent preview, and the first click muted it again.
- **Workshop** reloads every time you open it, so newly approved wallpapers and looks show up without closing the panel. When the list is empty it explains that shared items appear after a moderator approves them.
- **Desktop app:** press Ctrl+, (⌘, on Mac) or F1 in the chart window to bring the Priism Skins settings back to the front.

## 0.1.37 (2026-11-04)
- **Desktop app: a full-window design of its own.** Before, it showed the extension's small panel squeezed to the left. The app now has:
  - a sidebar with your chart's status and the on/off switch;
  - a top bar with the page title, search and live stats (chart open, FPS, CPU, RAM);
  - a big live preview of your look on Skins, with your wallpaper, your candles in their look and colours, and a "Your look" card with Copy share link and Save;
  - a gallery of wallpapers in sections (Wow showpieces first, then each category), with big cards;
  - settings laid out in two or three columns, so the whole window is used.
  - The controls are the same ones as the extension, so nothing is duplicated.
- **Live mood is back** (Trading → Live mood): a soft glow around the edges of your chart in your up or down colour. Pick whether it follows the day's move or your open position's P&L, and set its strength.
- Dropdowns (like Session timer → Market) are easy to read now: a dark list with clear text instead of light text on a light list, an arrow so it's obviously a dropdown, and full width so the choice isn't cut off.
- **Desktop app: your real TradingView account.** The chart window now identifies as a normal Chrome browser, and sign-in pop-ups (Google, Apple, your broker's login) open inside the app. Sign in once and your layouts, watchlists, alerts and broker come with you. Before, Google refused to sign in and you were left on a signed-out default chart.

## 0.1.36 (2026-11-04)
- **Sound in clips** (Capture → Clip → Sound): Off, Voice, Computer or Both.
  - **Voice** records your microphone, so you can talk through a trade. Chrome asks once to use the mic on tradingview.com.
  - **Computer** includes whatever is playing: music, videos, TradingView alerts. Chrome asks what to share when you record. On Windows pick Entire screen and tick "Share system audio"; on a Mac Chrome can only take a tab's sound, so pick the tab that's playing.
  - **Both** mixes them into one track.
  - Works for chart-only and whole-screen clips, and from the Record shortcut.
  - The crop & trim editor keeps the sound, with a Sound on / Muted button for the preview.
- Recording from the panel now opens Chrome's share picker straight away. A card on the chart only asks first when Chrome doesn't pass your click on.
- **Desktop app**:
  - The panel's Record and Snapshot buttons now work (they run in the chart window).
  - Whole-screen recording works.
  - On Windows it can include the computer's sound.

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
