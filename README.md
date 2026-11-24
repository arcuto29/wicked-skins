Test builds only. Not a release.

## priism-main-latest.zip (main at efb49df)
Everything merged so far: auto-updates (#179), no duplicate uploads (#183), wallpaper sound (#184), Auto-match for
indicators and drawings (#185). Not in it yet: the uploads fix (#186) and beta licensing (#177).
Same permanent test id as priism-keep-uploads-test.zip, so both see the same wallpapers and settings.


## priism-keep-uploads-test.zip (PR #186)
Main plus the uploads fix. It has Priism's fixed test id (clnbopeffinekcpboohdadbmilhaelab), so it keeps its uploads
and settings in any folder, and every later keyed test build sees the same ones. Your other copies keep their own.
To bring your wallpapers over: in your current copy, Settings > Backup & restore > Save a backup; in this one, Restore.


## priism-all-open-prs-test.zip
Main plus every open PR merged together: #177 beta licensing, #179 auto-updates, #184 wallpaper sound, #185 Auto-match
for indicators and drawings (#183 no duplicate uploads is already in main). Load unpacked in Chrome
(chrome://extensions, Developer mode, Load unpacked, pick the unzipped folder). All test suites pass on this combination.


priism-skins-0.1.86-test.zip: main at 8705ac7

evidence/pr179: CI run 44988226739 (feat/auto-updates at 55402da): desktop updater on Windows and Linux, Android signed upgrade, update card, backup restore, stable/beta channels. Test output only.

evidence/colours: colour flicker fix (fix/colour-flicker at 4f8a2d6): recordings (webm, before/after per platform), stills of the same frame before/after, and the frame-by-frame results of every run. Test output only.

priism-colours-and-wallpapers-test.zip: PR #180 (23621ed) merged locally with main 8eccdee (which has #181). Test build only.
priism-main-test.zip: main at 8eccdee (has #181, not #180), for comparison.

evidence/smart-fit: Smart fit (feat/smart-fit), tradingview.com and a 2-chart Lightweight Charts page, before (main) / after. Test output only.
