# Manual checks before releasing 0.1.86

These platforms need a login, so automated tests can't reach them. Run these checks with the test build
(`test-builds` branch, `priism-skins-0.1.86-test.zip`, loaded unpacked in `chrome://extensions`). Tick each box, or
note what you saw. **Never place a real order for these checks.** Use a demo or evaluation account, or just hover,
without clicking Buy or Sell.

## Before you start
- [ ] Remove any older Priism copy from `chrome://extensions`, then load the test zip. Only one copy should be installed.
- [ ] Chrome shows the new sites (TopstepX, topstep.com, nq.vision) when the update installs. Accept them.
- [ ] Priism panel › Wallpaper: pick a Signature look, e.g. **Aurora**.

## nq.vision (Lightweight Charts)
1. Open nq.vision and sign in with Discord. Open a chart.
   - [ ] Within a few seconds a card appears at the top: **"Priism Skins · turn on for nq.vision?"**
   - [ ] **Turn on** reloads the page, and the chart is skinned: wallpaper behind the candles, candles in the look's colours.
   - [ ] Open nq.vision again: it's skinned straight away and the card doesn't come back.
2. Live candle (Chart › Candle style › Closed candles: pick a different look)
   - [ ] Only the newest candle uses the live look; every closed candle uses the closed look.
   - [ ] Scroll back into history: no candle uses the live look.
3. Zones and lines (Chart › Lines, zones & labels)
   - [ ] Zone shape Rounded and Pill change your drawn boxes; Border Glow and Style Glass show.
   - [ ] Indicators › Custom colour with Glow at about 0.8: every indicator line has a visible soft halo, including the darker shades.
   - [ ] Markers › Rainbow recolours signal arrows; Markers › Own puts them back.
4. Speed
   - [ ] Moving the crosshair and dragging the chart feel the same as with Priism off (toggle it with Alt+Shift+W).
   - [ ] Hover the order buttons, if nq.vision shows any: the wallpaper holds still, and moves again when you leave.
5. Panel
   - [ ] Click the Priism icon: it says **"On for nq.vision"**. **Turn off** reloads nq.vision unskinned, and the card doesn't ask again.
   - [ ] "Check this page" says Priism is on the chart, with no warnings.

## TopstepX (TradingView charting library)
1. Open topstepx.com, sign in and open the trading screen.
   - [ ] The "turn on for topstepx.com?" card appears. **Turn on** reloads the page skinned.
   - [ ] If the card says the chart loads from another site, follow it: click the icon, choose **Turn on here** and allow it. Note which site it named.
2. Installed app window: in Chrome, use ⋮ › Cast, save and share › Install page as app (or Create shortcut › Open as window).
   - [ ] In the app window (no toolbar), the card appears and **Turn on** works without the toolbar.
3. Trade focus (Auto quality on, the default)
   - [ ] Hover Buy or Sell: the wallpaper and effects hold still within half a second. Move away: they move again.
   - [ ] With a position open on a demo or evaluation account, effects stay still the whole time. When it's closed, they move again within about 10 s.
4. Live candle
   - [ ] Only the newest candle is live, including after switching timeframe and after scrolling back.
5. Order safety
   - [ ] Buy, Sell, Close and Flatten work exactly as with Priism off. Check this on a demo account only.

## 4K / 1440p screens (if you have one)
- [ ] Wallpaper › Sharpness: **Ultra**. Every Signature look is sharp at full screen, and the drift is smooth.
- [ ] Task Manager (Shift+Esc in Chrome): with a Signature look on, the tab's CPU is close to the same tab with Priism off.

## Desktop app and Android
- [ ] Desktop: open the app, then Open with skins. TradingView is skinned and the Signature looks work.
- [ ] Android: the TradingView chart is skinned and a Signature look applies.

When everything is ticked, it's ready to tag. Anything that fails: note the platform, the step, and a screenshot.
