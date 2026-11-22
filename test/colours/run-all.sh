#!/usr/bin/env bash
# Every colour test, one after the other (each run opens its own browser). Results + videos in test-output/colours/.
#   test/colours/run-all.sh [<main checkout for the BEFORE runs>]
# Needs Playwright (node_modules) and network access to tradingview.com, trading-terminal.tradingview-widget.com and
# unpkg.com (the Lightweight Charts library for lw.e2e.js).
set -u
cd "$(dirname "$0")/../.."
BASE="${1:-}"
LOG=test-output/colours/run-all.log; mkdir -p test-output/colours; : > "$LOG"
run() { echo "=== $*" | tee -a "$LOG"; node "$@" 2>&1 | grep -E "^(PASS|FAIL)|COLOURS|HOOK COLOURS|page errors|Error" | cut -c1-400 | tee -a "$LOG"; }
run test/colours/hook.unit.js
run test/colours/hook.unit.js --dpr 2
[ -n "$BASE" ] && run test/colours/hook.unit.js --src "$BASE/src"
run test/colours/flicker.e2e.js --label after --platform tv --rounds 3
run test/colours/flicker.e2e.js --label after --platform terminal --rounds 3
run test/colours/flicker.e2e.js --label after --platform tv --rounds 2 --dpr 2
run test/colours/flicker.e2e.js --label after --platform terminal --rounds 2 --dpr 2
run test/colours/lw.e2e.js --label after --rounds 3
run test/colours/lw.e2e.js --label after --rounds 2 --dpr 2
if [ -n "$BASE" ]; then
  run test/colours/flicker.e2e.js --label before --platform tv --rounds 1 --ext "$BASE"
  run test/colours/flicker.e2e.js --label before --platform terminal --rounds 1 --ext "$BASE"
  run test/colours/lw.e2e.js --label before --rounds 1 --ext "$BASE"
  # short recordings, the same actions before and after
  for L in before after; do E=$([ $L = before ] && echo "$BASE" || pwd)
    run test/colours/flicker.e2e.js --label "rec-$L" --platform tv --rounds 1 --only live-updates,move-order-line,symbol --ext "$E"
    run test/colours/flicker.e2e.js --label "rec-$L" --platform terminal --rounds 1 --only symbol,zoom,move-order-line --ext "$E"
  done
fi
echo "=== done" | tee -a "$LOG"
