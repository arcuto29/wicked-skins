# Chrome Web Store submission (copy-paste)

**Name:** Priism Skins (decided). The listing name is hard to change once people install it, so keep it.
Website is published via GitHub Pages; contact email is set in `site/site-config.js`.

## 1. Upload
Chrome Web Store Developer Dashboard → **New item** → upload `priism-skins-<version>.zip`
(from the latest GitHub Release, or run `npm run build:ext`).

## 2. Store listing
**Name:** Priism Skins: Live Wallpapers for TradingView
**Summary (132 chars max):**
Live wallpapers, candle looks, chart styling and streamer mode for your TradingView charts. Smooth, private, no account.

**Description** (paste into the big "Description" box; it allows up to 16,000 chars and is NOT the 132-char manifest description).
Keep it plain sentences: the first version was rejected (Yellow Argon, "excessive keywords") for listing video file formats.
Don't add lists of file formats, platforms, chart types or skin names.
```
Your charts, in full spectrum. Priism Skins puts calm, animated wallpapers behind your TradingView candles and lets you restyle the chart to match. It is purely cosmetic: your data, orders and account are never touched.

Live wallpapers
Choose from dozens of animated scenes, from quiet night skies and glowing nebulas to ocean depths and city grids. You can also use your own pictures or videos, privately on your computer. The Workshop lets you try wallpapers and complete looks shared by other traders in one tap. Wallpapers are drawn in the background so your chart stays smooth.

Candles, chart and ticker
Recolour your candles and pick from sixteen candle looks, from glass and neon to soft outlines. Style the grid, crosshair, price line, price scale and the ticker at the top of your chart, and recolour TradingView's own panels and menus to match.

For traders
Make your take-profit, stop and P&L labels bigger and easier to read, and give each part its own colour. Set a daily goal and loss limit with an optional chime, get a soft heads-up before the session opens or closes, and let the edges of your chart glow with your P&L.

For streamers
Streamer mode hides your money on screen and in recordings, and you choose whether P&L shows as ticks, points or dollars. Save snapshots and clips of your chart, with your voice or your computer's sound, crop or trim them before saving, and let a clip of each trade save itself when it closes.

Other platforms
Turn it on for other charting platforms you trade on, with one click and your permission.

Looks
Apply a complete look in one click, undo it just as fast, save your own and share them with a link.

Privacy
Priism Skins never reads your orders, positions or account and sends nothing from the chart anywhere. Your settings and wallpapers stay on your computer. No account is needed.

Not affiliated with, endorsed or sponsored by TradingView, Inc. Not financial advice.
```
**Category:** Productivity  ·  **Language:** English (United States)

**Images** — all staged, exact sizes, in `store/submit/`:
- Store icon 128×128: `store/submit/store-icon-128.png`
- Screenshots 1280×800 (live TradingView, retaken for 0.1.45): `store/submit/screenshot-1-event-horizon.png`, `-2-nebula`, `-3-synapse`, `-4-streamer` (streamer mode hiding the TP amount, SL in points)
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
