# Wicked Skins for TradingView

<img src="icons/icon-128.png" width="96" alt="Wicked Skins logo">

Live backgrounds (animated skins, images, GIFs, video) behind TradingView charts.
Purely cosmetic. It does not read orders, positions or account data and makes no network requests.

## Try it
1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** and select this `wicked-skins/` folder.
3. Open a TradingView chart and click the Wicked Skins icon.

## Layout
- `src/skins.js`: built-in canvas skins. Add one by adding a factory to `window.WickedSkins`.
- `src/content.js`: builds the background layer and applies settings live.
- `src/content.css`: makes the chart transparent. **If TradingView changes its markup, fix selectors here.**
- `popup/`: skin picker, custom media upload, darken/blur/FPS.

## Features
- **Candles**: recolour up/down candles and volume (18 presets or custom colours; works with your own TradingView colours and candle/hollow/Heikin Ashi/bar styles) with optional glow. Changes apply live.
- **Skins**: 24 live wallpapers in 8 categories (Nature, Space, Warm, Neon, City, Calm, Weather, Trading).
- **My media**: your own images/GIFs/videos, **any video format**. MP4/MOV/MKV/WebM play directly; AVI, WMV, FLV,
  HEVC/H.265 and others are converted to WebM on your computer (ffmpeg.wasm, see `vendor/ffmpeg/NOTICE.md`).
  Files are stored in the extension's own database (up to 2 GB each) and played by `player/player.html`.
  Adding files opens a full-tab manager so long conversions aren't interrupted. Drag & drop supported.
- **Reacts to**:
  - *Market*: the chart edges glow green or red with the day's move and pulse on price ticks, and skins speed up when price moves.
    Price comes from the tab title TradingView already shows.
  - *My P&L*: glows with your P&L from an entry price **you type in** (long/short, optional symbol). Worked out locally;
    it never reads your account, orders or positions.
- **Watermark**: your own text and/or logo on the chart (on/off switch, 5 positions, size, opacity, colour).
  It sits on top of the chart so it shows in screen recordings and screenshots of your screen; it never blocks clicks.
  (TradingView's own camera snapshot is rendered by TradingView and won't include it.)
- **Tune**: opacity, Over chart strength, dim, blur, vividness, tint, speed, position, fit, FPS, power saver, layer.
- **Loadouts**: save/apply/export/import your look.

## Roadmap
1. Skin format: a skin pack is JSON `{ id, name, type, ...}` so it can be exported/imported and shared.
2. Workshop: backend (auth, uploads, moderation queue, likes, report/DMCA flow) plus an in-extension browser.
3. Pro tier: license keys, device limits, subscriptions (Stripe or Whop).
4. Desktop app (Electron / TradingView Desktop injection) and Safari port.
5. Ideas to beat the competition: per-layout skins, price-reactive effects (glow on up/down candles), scheduled skins, performance auto-throttle.

## Desktop app (Windows / macOS / Linux)
```
cd desktop && npm install && npm start
```
Opens TradingView in its own window with the same engine and settings UI (Ctrl/Cmd+, reopens settings).
Settings are saved in the app's user-data folder. Package with `electron-builder` when ready.
Note: this wraps tradingview.com; it does not modify the official TradingView Desktop install.

## Mobile (planned)
- **iOS / iPadOS / macOS Safari**: Safari Web Extension. Xcode can convert this folder
  (`xcrun safari-web-extension-converter wicked-skins/`). Needs an Apple Developer account.
- **Android**: Chrome for Android has no extensions. Options are Firefox for Android (supports WebExtensions)
  or a small WebView app that loads tradingview.com and injects `src/` (same approach as `desktop/`).
- The official TradingView mobile apps cannot be modified, so mobile means web-in-browser or our own wrapper app.

## Logo
`icons/logo.svg` (full) and `icons/logo-small.svg` (simplified, used for 16/32 px) are the sources.
PNG sizes 16/32/48/128/512 are rendered from them. If the name changes, only the popup label and these files need updating.
