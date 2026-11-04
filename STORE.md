# Chrome Web Store submission (copy-paste)

**Name:** Priism Skins (decided). The listing name is hard to change once people install it, so keep it.
Fill `contactEmail` in `site/site-config.js` and publish the website (Privacy policy URL is required).

## 1. Upload
Chrome Web Store Developer Dashboard → **New item** → upload `priism-skins-<version>.zip`
(from the latest GitHub Release, or run `npm run build:ext`).

## 2. Store listing
**Name:** Priism Skins: Live Wallpapers for TradingView
**Summary (132 chars max):**
Live wallpapers, your own videos, candle colours, glow and a readable price scale behind your TradingView charts.

**Description:**
```
Your charts, in full spectrum. Priism Skins puts live wallpapers behind your TradingView candles and lets you restyle the chart, without touching your data.

LIVE WALLPAPERS
• 24 animated skins: Spiral Galaxy, Cyber Grid, Skyline, Thunderstorm, Tide, Cinders and more
• Your own images, GIFs and videos: any video format (MP4, MOV, MKV, AVI, WMV, HEVC). Ones the browser can't play are converted on your computer
• Workshop: browse community wallpapers, use them in one tap, share your own

CANDLES & GLOW
• 18 colour presets in Clean, Neon, Warm, Cool and Rich
• Styles: Solid, Tube (glowing outlines), Rainbow, Cycle
• Glow for candles, indicators, drawings, price and position lines
• Works with your own TradingView colours and with candles, hollow candles, Heikin Ashi and bars

READABLE & CALM
• Price scale text turns light or dark per label to stay readable on any wallpaper
• Price scale size, font, glow, backing and price-tag colours
• Darken, blur, vignette, Calm mode (dims while your cursor is on the chart), Eco mode

MORE
• One-click looks with Undo, saved looks you can share
• Live mood: the chart glows with the day's move or with the open P&L on your position lines
• Watermark with the Priism Skins logo for recordings
• Works on TopstepX and other platforms that embed TradingView charts ("Turn on here")
• Alt+Shift+W toggles everything

PRIVACY
Purely cosmetic. Priism Skins never reads your orders, positions or account and sends nothing from the chart anywhere. The Workshop account (optional) only stores your email and what you share.

Not affiliated with, endorsed or sponsored by TradingView, Inc. Not financial advice.
```
**Category:** Productivity (or "Fun")  ·  **Language:** English

**Images** (in `store/`):
- Store icon 128×128: `icons/icon-128.png`
- Screenshots 1280×800: `store/screenshot-1-neon-night.png`, `-2-cosmic`, `-3-inferno`, `-4-ocean`
- Small promo tile 440×280: `store/promo-small.png`
- Marquee 1400×560 (optional): `store/promo-marquee.png`

**Website:** https://arcuto29.github.io/wicked-skins/  ·  **Support:** your contact email

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
| identity | Optional "Continue with Google" sign-in for the Workshop. |
| Remote code | **No.** All code is in the package (ffmpeg.wasm and supabase-js are bundled). |

**Data usage:** tick **Personally identifiable information** (email) and **User-generated content** (only for Workshop accounts/uploads).
Certify: not sold, not used for unrelated purposes, not used for creditworthiness.
**Privacy policy URL:** https://arcuto29.github.io/wicked-skins/privacy.html

## 4. Automatic updates afterwards
Once published, add the `CWS_*` secrets (RELEASING.md). Every tagged release then uploads and publishes itself.
