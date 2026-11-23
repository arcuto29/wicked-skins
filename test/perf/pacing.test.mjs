// Wallpaper frame pacing on real refresh rates, simulated tick by tick: the browser can only draw on a display refresh,
// so the wallpaper loop (content.js startLoop) chooses which refreshes to draw on. Old rule: draw once a full interval
// (minus 2 ms) has passed. New rule (content.js): a running schedule where a frame may come half a refresh early.
// Checks the delivered rate against the asked one at 60/75/90/120/144/165/240/360 Hz.   node test/perf/pacing.test.mjs
const HZ = [60, 75, 90, 120, 144, 165, 240, 360], TARGETS = [60, 40, 30, 20, 15];
const run = (hz, target, rule) => {
  const per = 1000 / hz, iv = 1000 / target; let last = 0, due = 0, n = 0; const gaps = [];
  for (let i = 1; i <= hz * 10; i++) {
    const now = i * per;
    if (rule === "old") { if (now - last < iv - 2) continue; }
    else { if (now < due - per / 2) continue; due = now - due > iv ? now + iv : due + iv; }
    gaps.push(now - last); last = now; n++;
  }
  return { fps: n / 10, worstGapMs: Math.max(...gaps.slice(1)) };
};
let fails = 0; const rows = [];
for (const hz of HZ) for (const t of TARGETS) {
  if (t > hz) continue;
  const o = run(hz, t, "old"), m = run(hz, t, "new"), ok = Math.abs(m.fps - t) <= t * 0.03 + 0.5;
  if (!ok) fails++;
  rows.push(`${String(hz).padStart(3)} Hz, ${String(t).padStart(2)} fps asked: before ${o.fps.toFixed(1).padStart(5)} · now ${m.fps.toFixed(1).padStart(5)} ${ok ? "PASS" : "FAIL"}`);
}
console.log(rows.join("\n"));
console.log(`\nPACING: ${rows.length - fails}/${rows.length} within 3% of the rate asked for`);
process.exitCode = fails ? 1 : 0;
