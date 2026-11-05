# Priism Skins — Android app

TradingView with Priism Skins built in, for phones and tablets. TradingView's own Android app can't run
browser add-ons, so this is a thin native shell: a full-screen **WebView** that opens `tradingview.com/chart`
and injects the *same* skin code the browser extension and desktop app use (`src/hook.js`, `src/skins.js`,
`src/content.js`, `src/content.css`). A settings sheet (the shared `popup/`) writes your preferences, which are
saved on the device and pushed live into the chart.

## How it maps to the rest of the project
- **hook.js** runs first, in the page, via `WebViewClient.shouldInterceptRequest` + an early `evaluateJavascript`
  at `onPageStarted` (it must wrap the canvas API before TradingView draws). Same role as the desktop preload.
- **skins.js + content.js + content.css** are injected at `onPageFinished`, exactly like `desktop/main.js` `inject()`.
- Settings are stored in `SharedPreferences` as the same JSON `cfg` object; the settings WebView talks to the
  chart WebView through a small JS bridge (`window.PriismStore`), mirroring `desktop/preload.js`'s `window.wickedStore`.

## Build
Requires Android Studio (or the Android SDK + Gradle). From this folder:

    ./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
    ./gradlew assembleRelease      # signed release (set the keystore in gradle.properties)

A Gradle task (`syncShared`) copies the shared JS/CSS from `../src` and `../popup` into `app/src/main/assets/shared/`
before each build, so there is only ever one copy of the skin code to maintain.

## Status / honesty
- This is a working scaffold: it loads TradingView and injects the skins. It still needs a real device/emulator
  pass, app signing, and a Play Store listing before release.
- **Store policy:** Google Play restricts "webview-only" apps. Our value-add (the skin engine, settings, Workshop)
  is real functionality on top of the WebView, which is the thing Play asks for — but review it against the current
  [Play policies](https://support.google.com/googleplay/android-developer/answer/9888379) before submitting.
- **TradingView ToS:** we only change how the page looks on the user's own device and never read account data —
  the same stance as the extension. Still worth a legal check before a paid launch, alongside the ffmpeg/trademark items.
