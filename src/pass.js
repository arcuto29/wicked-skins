/* Priism plans: Free and Pro. Shared by the chart (content.js), the panel (popup.js), the background worker, the
   desktop app and Android. The switches for selling are at the top of this file:
     FREE_TIER      false = invite / licence only (as before); true = anyone can use Free without a code
     PASS_REQUIRED  false = a saved invite counts as Pro on its own (until the licence function is deployed);
                    true  = Pro needs a signed pass from the licence function (supabase/functions/licence)
     STORE_URL      your Whop store page (Get Pro buttons)
   A pass is a signed note from the licence function: { plan, src, dev, iat, exp, until }. It's checked here with the
   public key below (ECDSA P-256), for this device only, and lasts 14 days; Priism renews it once a day. Editing saved
   settings can't make one. Nothing about your charts or trading is sent anywhere. (Setup: LICENCES.md) */
(function (root) {
  if (root.PriismPass) return;
  const FREE_TIER = false;
  const PASS_REQUIRED = false;
  const STORE_URL = "";
  const PUBLIC_JWK = { kty: "EC", crv: "P-256", x: "po_7MEF1ILlVXG3EpMWwSU6P3koiNkFClC9Sry6DDYQ", y: "DPdTlvkvBkfk0rdSPOscJAxu0mH9abOX6Yag1Z_uvQY" };

  // ---- what Free includes ----
  // 6 wallpapers, candle colours, the picture's own settings (dim, blur, speed, sharpness, layer...), shortcuts and
  // the on / off switches. Everything else is Pro and goes back to its default while on Free; your own settings stay
  // saved, so they come straight back with Pro. The Priism watermark is always on with Free.
  const FREE_SKINS = ["midnight", "graphite", "starfield", "twinkle", "rain", "snow"];
  const FREE_KEEP = new Set(["enabled", "opacity", "overOpacity", "dim", "blur", "vividness", "tint", "speed", "fps", "fit", "posX", "posY", "res",
    "powerSaver", "paused", "bw", "layer", "autoQuality", "calm", "candleOn", "candleUp", "candleDown", "candleGlow", "candlePreset", "chartColors",
    "toggleKey", "focusKey", "focus", "focusHides", "wmPos"]);
  // not features: account, bookkeeping and data (left exactly as they are)
  const INTERNAL = new Set(["invite", "pass", "deviceId", "welcomePending", "media", "mediaId", "loadouts", "wallMatch", "bracketDebug", "dayPnl", "journal", "lastPick", "sites", "siteOfferNo", "myCandles"]);
  const FREE_FORCE = { wmOn: true, wmText: "", wmStyle: "corner", wmOpacity: 0.85, wmDrift: false };
  const isFreeSkin = (id) => FREE_SKINS.includes(id);
  // the value a setting has on Free (undefined = yours)
  function freeValue(k, v, D) {
    if (INTERNAL.has(k) || FREE_KEEP.has(k)) return undefined;
    if (k === "skin") return isFreeSkin(v) ? undefined : "midnight";
    if (k in FREE_FORCE) return FREE_FORCE[k];
    return D[k];
  }
  // a setting is Pro (for the panel's locks)
  const isPro = (k) => !INTERNAL.has(k) && !FREE_KEEP.has(k) && k !== "skin";

  // ---- the pass ----
  const unb64u = (s) => { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };
  let keyP = null; const memo = new Map();
  // -> { plan, until, src } if the pass is genuine, for this device and still current; else null
  async function verify(token, device) {
    if (typeof token !== "string" || !token || !device) return null;
    const m = memo.get(token); let p = m;
    if (m === undefined) {
      p = null;
      try {
        const subtle = root.crypto && root.crypto.subtle; const [a, b] = token.split(".");
        if (subtle && a && b) {
          keyP = keyP || subtle.importKey("jwk", PUBLIC_JWK, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
          const body = unb64u(a);
          if (await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, await keyP, unb64u(b), body)) p = JSON.parse(new TextDecoder().decode(body));
        }
      } catch { p = null; }
      if (memo.size > 20) memo.clear(); memo.set(token, p);
    }
    if (!p || p.v !== 1 || p.dev !== device || !(p.exp * 1000 > Date.now())) return null;
    return { plan: p.plan === "lifetime" ? "lifetime" : "pro", until: p.until || null, src: p.src || "" };
  }
  // "pro" | "free" | "none" (none = Priism stays off until a code / key is entered)
  // Beta copies ("Priism Skins Beta" listing, a beta zip, a desktop / Android beta build) only open for invited
  // testers whose access is tied to their account (a beta code added on the website, then this device linked with a
  // link code: src/invite.js). Sharing the install link or a beta zip gives nobody access: without that account
  // link a beta copy stays locked (no Free fallback either). Stable copies are unchanged.
  const CHANNEL = (() => {
    try { const m = root.chrome && root.chrome.runtime && root.chrome.runtime.getManifest && root.chrome.runtime.getManifest();
      if (m && (m.version || m.name)) return /-beta/i.test(m.version_name || "") || /\bbeta\b/i.test(m.name || "") ? "beta" : "stable"; } catch {}
    try { const a = root.wickedStore && root.wickedStore.app; if (a && a.version) return /-beta/i.test(a.version) ? "beta" : "stable"; } catch {}
    try { if (root.PriismNative && root.PriismNative.version) return /-beta/i.test(String(root.PriismNative.version())) ? "beta" : "stable"; } catch {}
    return root.__BD_CHANNEL === "beta" ? "beta" : "stable";
  })();
  function planOf(passInfo, invite) {
    if (CHANNEL === "beta") return (passInfo && passInfo.src === "account") || (!PASS_REQUIRED && invite && invite.ok && invite.kind === "account") ? "pro" : "none";
    if (passInfo) return "pro";
    if (!PASS_REQUIRED && invite && invite.ok && invite.code) return "pro";
    return FREE_TIER ? "free" : "none";
  }
  root.PriismPass = { FREE_TIER, PASS_REQUIRED, STORE_URL, CHANNEL, FREE_SKINS, isFreeSkin, isPro, freeValue, verify, planOf };
})(typeof self !== "undefined" ? self : window);
