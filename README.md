# Wicked Skins for TradingView

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
