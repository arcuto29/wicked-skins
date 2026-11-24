/* Priism versions and release channels, shared by the panel, the background worker, the chart and the tests.
   Stable:  0.1.87          everywhere.
   Beta:    0.1.87-beta.2   desktop / Android / GitHub tag v0.1.87-beta.2;
            0.1.87.2        in the extension's manifest (Chrome versions are numbers only), with
                            version_name "0.1.87-beta.2" and the name "Priism Skins Beta" (scripts/build-extension.js).
   A beta comes before its stable release: 0.1.87-beta.2 < 0.1.87 < 0.1.88-beta.1.                                 */
(function (root) {
  // "0.1.87", "v0.1.87-beta.2", "0.1.87.2" -> { n: [0, 1, 87], beta: 2 | 0 }
  function parse(v) {
    const s = String(v || "").trim().replace(/^v/i, "");
    const m = /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+)|-beta\.?(\d+))?$/i.exec(s);
    if (!m) return null;
    return { n: [+m[1], +m[2], +m[3]], beta: +(m[4] || m[5] || 0) };
  }
  // < 0 when a is older than b; unknown versions sort first
  function cmp(a, b) {
    const x = parse(a), y = parse(b);
    if (!x || !y) return (x ? 1 : 0) - (y ? 1 : 0);
    for (let i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] - y.n[i];
    if (x.beta === y.beta) return 0;
    if (!x.beta) return 1; if (!y.beta) return -1;           // the stable release is newer than its betas
    return x.beta - y.beta;
  }
  const newer = (a, b) => cmp(a, b) > 0;
  const isBeta = (v) => !!(parse(v) && parse(v).beta);
  // how a version is shown: 0.1.87, or 0.1.87 Beta 2
  const label = (v) => { const p = parse(v); return p ? p.n.join(".") + (p.beta ? ` Beta ${p.beta}` : "") : String(v || ""); };
  const canon = (v) => { const p = parse(v); return p ? p.n.join(".") + (p.beta ? `-beta.${p.beta}` : "") : String(v || ""); };
  // this copy of Priism: its version and channel
  function self() {
    try {
      const m = root.chrome && root.chrome.runtime && root.chrome.runtime.getManifest && root.chrome.runtime.getManifest();
      if (m && m.version) { const v = canon(m.version_name && parse(m.version_name) ? m.version_name : m.version);
        return { version: v, channel: isBeta(v) || /\bbeta\b/i.test(m.name || "") ? "beta" : "stable", store: "update_url" in m, kind: "extension" }; }
    } catch {}
    const a = root.wickedStore && root.wickedStore.app;
    if (a && a.version) return { version: canon(a.version), channel: isBeta(a.version) ? "beta" : "stable", store: false, kind: "desktop" };
    const n = root.PriismNative && root.PriismNative.version ? String(root.PriismNative.version()) : "";
    if (n) return { version: canon(n), channel: isBeta(n) ? "beta" : "stable", store: false, kind: "android" };
    const c = root.__BD_CHANNEL;   // the desktop / Android chart pages are told by the app
    return { version: "", channel: c === "beta" ? "beta" : "stable", store: false, kind: "page" };
  }
  root.PriismVersion = { parse, cmp, newer, isBeta, label, canon, self };
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
