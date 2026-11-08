/* Priism Skins — trading sounds. Short tones made on the fly with Web Audio, so there are no sound files to
   download and nothing plays unless you turn a sound on. Used by the chart (goal / loss limit / session heads-up)
   and by the panel (a preview when you pick a volume). window.PriismSounds.play(kind, level). */
(function () {
  if (window.PriismSounds) return;
  let ac = null;
  const ctx = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } }
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  // one soft bell-like note: a sine plus a quiet overtone, quick attack, gentle fade
  function note(a, t, freq, len, vol, type = "sine") {
    const g = a.createGain(), o = a.createOscillator(), o2 = a.createOscillator(), g2 = a.createGain();
    o.type = type; o.frequency.value = freq; o2.type = "sine"; o2.frequency.value = freq * 2.01; g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(a.destination);
    o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  }
  // [frequency Hz, start offset s, length s, wave]
  const TUNES = {
    goal:  [[784, 0, 0.5], [988, 0.11, 0.5], [1319, 0.22, 0.9]],                 // rising: G5 B5 E6
    warn:  [[659, 0, 0.35, "triangle"], [659, 0.22, 0.45, "triangle"]],           // two even notes
    limit: [[523, 0, 0.5, "triangle"], [392, 0.26, 0.9, "triangle"]],             // falling: C5 G4
    heads: [[1047, 0, 0.7]],                                                       // one soft ping: 5 minutes to go
    bell:  [[1047, 0, 0.6], [1047, 0.28, 0.9]],                                    // two pings: it opens / closes now
  };
  const VOL = { soft: 0.12, loud: 0.32 };
  function play(kind, level) {
    const tune = TUNES[kind], vol = VOL[level]; if (!tune || !vol) return false;
    const a = ctx(); if (!a) return false;
    const t0 = a.currentTime + 0.03;
    for (const [f, off, len, type] of tune) note(a, t0 + off, f, len, vol, type);
    return true;
  }
  window.PriismSounds = { play, kinds: Object.keys(TUNES) };
})();
