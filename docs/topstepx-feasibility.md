# TopstepX panel styling: feasibility

## How this was checked
TopstepX needs a login, so I couldn't open the real trading screen. I worked from its **real production stylesheet and app
code**, which are public: `topstepx.com/static/main-*.css` (290 KB) and `main-*.js` (5 MB), downloaded on 20 Nov 2026.

From those files:
- The panels are built with **rc-dock**: `.dock-panel`, `.dock-bar`, `.dock-tab`, `.dock-ink-bar` and `.dock-dropdown-menu`.
- The tables are **MUI** (`MuiTable*`, 49 uses) plus an older **ReactTable** (`.rt-*`).
- The order ticket uses CSS-module classes (`ordercard-module__…`). Those names include a build hash, so the rules match
  on the stable prefix (`[class*="ordercard-module__cardWrapper"]`).
- There's a **design-token system**, `--tds-*`: 466 tokens for surfaces, borders, accent, focus ring, selection, radius
  and the trading colours, with `[data-tds-brand=topstepx]` selecting TopstepX's own variant.
- The chart sits in a frame. Priism already skins it as a chart through Turn on (#165).

Everything was tested on a local stand-in page (`pwtest/tsxsite`). It loads **TopstepX's real stylesheet** with markup
that uses those real class names. It is not the live app: the live layout, and anything TopstepX builds at runtime that
the CSS doesn't show, still need checking on a real account (see below).

## Support
| Area | Status | How |
|---|---|---|
| Panel surfaces, borders, page background | **Supported** | `--tds-color-surface-*`, `--tds-color-border-*`, `--tds-color-brand-*`, plus `.dock-panel` for the parts that still hard-code `#2a292f` borders |
| Panel tabs, active-tab line | **Supported** | `.dock-bar` / `.dock-nav`, `.dock-tab` border, `.dock-ink-bar` in your accent |
| Accent: focus rings, selected states, accent buttons | **Supported** | `--tds-color-accent-*`, `--tds-color-focus-ring`, `--tds-color-state-selected*` |
| Menus, dropdowns, context menus, dialogs | **Supported** | `.dock-dropdown-menu`, `.dropdown-menu`, `.react-contextmenu`, `.MuiMenu-paper`, `.MuiPopover-paper`, `.modal-content`, `.MuiDialog-paper` |
| Positions / orders tables: header, separators, row hover | **Supported** | `.MuiTableHead`, `.MuiTableCell`, `.MuiTableRow:hover`, `.rt-thead`, `.rt-tr-group` |
| Order ticket surface, input fields, focus | **Supported** | `ordercard-module__cardWrapper / inputContent / inputMarketContent`, `:focus-within` |
| DOM ladder header | **Partly** | `dom-module__domHeader` only. The ladder rows carry bid/ask meaning in their colours (`dom-ask-row`, `dom-bid-row-color`), so they are left alone |
| Buy / Sell, profit / loss, flashes, warnings, errors, disabled states | **Never touched, by design** | `--tds-color-trading-*` and `--tds-color-status-*` are not overridden |
| Corner radius | **Supported** | Rounded panels sets `--tds-radius-md`, `--tds-shape-container` and `.dock-panel` radius |
| Fonts / typography | **Not done** | TopstepX's own `--tds-type-*` scale is already tuned for dense numbers. Changing it risks readability and truncation |
| Glass (wallpaper showing through panels) | **Partly** | Panel style › Glass makes panel colours see-through, with no `backdrop-filter` blur (cost). The wallpaper itself is only inside the chart frame |
| Toasts, notifications | **Not done** | `react-toastify` variables exist, but toasts carry trade confirmations: left as TopstepX shows them |
| Mobile web layout (`mobileWebChartTrade-module`) | **Not tested** | |

## What the setting does
There are no new settings. It reuses **TradingView tab › Bars & panels** (Panel colours, Panel style, Rounded) and the
accent that **Match everything** sets, exactly as for TradingView's panels. Match everything on TopstepX makes the panels
follow the wallpaper. Panel colours **Off** leaves TopstepX as it is. It is a Pro feature.

## Safety and cost (stand-in, tsxtest.js 17/17)
- **Layout:** none of the 35 buttons, inputs, tabs, table cells or panels moved or changed size, in any of the 3 looks.
- **Colours and states:** Buy / Sell tabs and buttons, profit / loss values, the Sell side cell and disabled Join buttons
  are pixel-for-pixel the same colour.
- **Cost:** one stylesheet, written once. No MutationObserver, and it checks for the panels 30 times at most (2 s apart)
  while TopstepX loads. Applying it caused no long tasks. Pointer-move delay over the panels was p95 3.0 ms with the look
  on and 13.7 ms with it off, which is within noise.
- **If TopstepX changes:** rules that stop matching do nothing. The tokens are TopstepX's public design system, so they
  are the most stable layer.

## Still to check on a real TopstepX account
1. The real layout picks up the panel colour everywhere: header bar, side menu, account selector.
2. MUI tables built at runtime, such as Positions, Orders and Trades, look like the stand-in.
3. The DOM ladder header and order ticket look right in the live app.
