# Chrome Web Store submission (copy-paste)

**Name:** Priism Skins (decided). The listing name is hard to change once people install it, so keep it.
Website is published via GitHub Pages; contact email is set in `site/site-config.js`.

## 1. Upload
Chrome Web Store Developer Dashboard → **New item** → upload `priism-skins-<version>.zip`
(from the latest GitHub Release, or run `npm run build:ext`).

## 2. Store listing
**Name:** Priism Skins: Live Wallpapers for TradingView
**Summary (132 chars max):**
Live wallpapers, your own videos, candle colours, glow and a readable price scale behind your TradingView charts.

**Description** (paste into the big "Description" box — this field allows up to 16,000 chars; it is NOT the 132-char manifest description):
```
Your charts, in full spectrum. Priism Skins puts live wallpapers behind your TradingView candles and lets you restyle the chart, without touching your data.

LIVE WALLPAPERS
• 24 animated skins: Spiral Galaxy, Cyber Grid, Skyline, Thunderstorm, Tide, Cinders and more
• Your own images, GIFs and videos: any video format (MP4, MOV, MKV, AVI, WMV, HEVC). Ones the browser can't play are converted on your computer
• Workshop: browse community wallpapers, use them in one tap, share your own

CANDLES & GLOW
• Colour presets in Clean, Neon, Warm, Cool and Rich
• Styles: Solid, Tube (glowing outlines), Rainbow, Cycle
• Glow for candles, indicators, drawings, price and position lines
• Works with your own TradingView colours, and with candles, hollow candles, Heikin Ashi and bars

READABLE & CALM
• Price scale text turns light or dark per label to stay readable on any wallpaper
• Price scale size, font, glow, backing and price-tag colours
• Darken, blur, vignette, Calm mode (dims while your cursor is on the chart), Eco mode

MORE
• One-click looks with Undo, plus saved looks and shareable look codes
• Trade brackets: recolour your broker's on-chart TP / Stop / entry pills
• Snapshot and Live Clip: save a shareable image or a clip of up to 2 minutes, with your effects in it, or record your whole screen
• Live mood: the chart glows with the day's move or with the open P&L on your position lines
• Daily goal & limit bar and an automatic trade journal (estimated from the P&L your chart already shows; nothing leaves your computer)
• Watermark for recordings
• Works on TopstepX and other platforms that embed TradingView charts ("Turn on here")
• Alt+Shift+W toggles everything

PRIVACY
Purely cosmetic. Priism Skins never reads your orders, positions or account and sends nothing from the chart anywhere. Your settings and your own wallpapers stay on your computer. Browsing and using Workshop wallpapers needs no account; sharing your own is done on the website.

Not affiliated with, endorsed or sponsored by TradingView, Inc. Not financial advice.
```
**Category:** Productivity  ·  **Language:** English (United States)

**Images** — all staged, exact sizes, in `store/submit/`:
- Store icon 128×128: `store/submit/store-icon-128.png`
- Screenshots 1280×800: `store/submit/screenshot-1-neon-night.png`, `-2-blackout`, `-3-interface`, `-4-ocean`
- Small promo tile 440×280: `store/submit/promo-small.png`
- Marquee 1400×560 (optional): `store/submit/promo-marquee.png`

## 2a. Privacy tab — single purpose (paste)
```
Restyle TradingView charts — live wallpapers, candle colours, glow and price-scale styling — on tradingview.com and on sites the user turns it on for.
```
Per-permission justifications (one box each):
- **storage:** `Save the user's settings (chosen wallpaper, candle colours, adjustments, saved looks) on their own computer.`
- **unlimitedStorage:** `Store the user's own wallpaper images and videos locally; these can be large, so the default storage quota is not enough.`
- **scripting:** `When the user taps "Turn on here" on another site that embeds a TradingView chart (e.g. TopstepX), register the same chart-styling scripts for that site.`
- **activeTab:** `When the user opens the extension panel, check the current tab for a TradingView chart so the panel can offer to turn styling on there.`
- **host https://*.tradingview.com/*:** `Draw the wallpaper behind the chart and restyle the chart canvas on tradingview.com.`
- **optional host (any site):** `Requested only when the user explicitly taps "Turn on here" on a site that shows a TradingView chart. The user can remove it from the panel at any time.`
- **Remote code:** No.
Data usage: **do not collect or use user data**; certify not sold, not used for unrelated purposes, not used for creditworthiness.
Privacy policy URL: `https://arcuto29.github.io/wicked-skins/privacy.html`

## 2b. Distribution tab
Visibility **Unlisted** to start · All regions · Free

**Website:** https://arcuto29.github.io/wicked-skins/  ·  **Support:** arcuto2978@gmail.com

## 3. Privacy tab
**Single purpose:** Restyle TradingView charts (wallpapers, candle colours, glow, price-scale styling) on tradingview.com and on sites the user turns it on for.

**Permission justifications**
| Permission | Why |
|---|---|
| Host access to tradingview.com | Draw the wallpaper behind the chart and restyle the chart canvas. |
| storage, unlimitedStorage | Save the user's settings, and their own wallpaper images/videos (can be large) on their computer. |
| scripting | When the user taps "Turn on here" on another chart site (e.g. TopstepX), register the same chart styling for that site. |
| optional host permissions (any site) | Requested only when the user taps "Turn on here" on a site with a TradingView chart; can be removed in the panel. |
| activeTab | Check the current page for a TradingView chart when the user opens the panel. |
| Remote code | **No.** All code is in the package (ffmpeg.wasm and supabase-js are bundled). |

**Data usage:** the extension collects **no** personal data — settings and uploaded wallpapers stay on the user's
computer, and browsing/using the Workshop needs no account. (Sharing a wallpaper happens on the website, not the
extension.) So you can answer "I don't collect user data" for the extension; certify not sold, not used for unrelated
purposes, not used for creditworthiness.
**Privacy policy URL:** https://arcuto29.github.io/wicked-skins/privacy.html

## 4. Automatic updates afterwards
Once published, add the `CWS_*` secrets (RELEASING.md). Every tagged release then uploads and publishes itself.
