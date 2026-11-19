---
inclusion: always
---

# Mandatory rule: no duplicate features

Before implementing any new feature in Priism Skins:

1. **Audit the existing codebase** and find out whether the feature, or something similar, already exists.
2. **Reuse existing systems** instead of building separate implementations.
3. **Extend existing settings** rather than adding duplicate sliders, toggles, dropdowns or menus.
4. **Check every existing candle look, zone effect, wallpaper effect and preset** before adding new ones.
5. **Keep saved looks and user preferences working** (backward compatibility). Never rename or drop a stored key without a migration.
6. **Keep the settings panel organised.** Put new options in the section they belong to.
7. **Avoid duplicate rendering logic** across `candlelooks.js`, `hook.js`, `lw.js`, `content.js` and `skins.js`. Shared drawing belongs in one place.
8. **Run regression tests** so existing features still work.

## Classify before coding

Classify every proposed feature, and state the classification in the plan or PR:

- **Already exists:** don't implement it again.
- **Partially exists:** improve the existing implementation.
- **New:** implement it with the current architecture.
- **Unnecessary or overlapping:** skip it.

Don't create a new setting just because a feature has a different name.

## Where things already live (check these first)

- **Candle looks, materials, core / edge light, candle parts, closed-candle look:** `src/candlelooks.js` (`LOOKS`, `draw`, `candle`, `fx`, `parts`, `live`), keys `candleLook`, `candleClosedLook`, `candleFx*`, `candleWick*`, `candleBorder*`, `candleHollow`, `candleBodyW`, `candleGlow`.
- **Live-candle and zone positions:** `spot` in `src/candlelooks.js` (published on `<html data-ws-live>`); `priceLine` and `live` for the last-price line and closed candles.
- **Zone styling and reactions:** `zone`, `zoneBox`, `zoneHeat` in `src/candlelooks.js`; keys `zoneShape`, `zoneBorder`, `zoneStyle`, `zoneFill`, `zoneDim`, `zoneReact`, `zoneFx`, `indCustom`.
- **Atmosphere, zone lights, clarity drawing:** `window.PriismAtmo` in `src/skins.js`, placed by `content.js` (`applyAtmo`, `atmoStatic`).
- **Wallpaper effects, patterns, palette:** `window.PriismEffects`, `PriismPatterns`, `PriismPalette` in `src/skins.js`.
- **Dim, Smart dim, vignette (and its centre), blur, tint, opacity, Live mood glow, chart frame:** `content.js` (`applyLook`, `.bd-dim`, `vgCss` / `.bd-vignette`, `atmoStatic`, `.bd-react`, `.bd-frame`); keys `dim`, `smartDim`, `vignette`, `vignetteAt`.
- **Candle presets and mixes:** the one preset grid (`renderCandles`, `CANDLE_PRESETS`, `FX_PRESETS`) in `popup/popup.js`.
- **Renamed / removed settings:** add a migration in `src/migrate.js` (`MIGRATIONS` + `fix()`), and old saved looks are converted on apply (`WickedMigrate.look`).
- **Wallpaper brightness:** `gridOf` / `v.lum.grid` / `setBackdrop` in `content.js`.
- **Quality:** `liteNow()` / `window.__bdLite` (Power saver, Auto quality). Reduced motion: respect `prefers-reduced-motion`.
- **Panel:** `popup/popup.html` groups (`data-grp`), `popup/popup.js` (`DEFAULTS`, `LOOK_KEYS`, `STYLE_KEYS`, `PER_CHART_KEYS`, `CANDLE_STYLE_KEYS`).

## Tests

Tests are in `/projects/sandbox/pwtest` (run with `node -r ./nocard.js <test>.js`). At minimum, run `big.js` plus the tests for the area you changed.
