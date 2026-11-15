/* Invite only: Priism needs an invite code before it draws anything (extension, desktop app, Android).
   The code is checked with the Workshop backend (Supabase): redeem_invite(code, device) -> ok | invalid | revoked | full.
   Only the code you typed and a random id for this copy of Priism are sent; nothing about your charts or account.
   Shared by the panel (popup.js) and the extension's background worker (bg.js). Stored as
   invite = { code, ok, status, checked (last answer from the server), since }   and   deviceId = random id. */
(function (root) {
  const CFG = () => root.WORKSHOP_CONFIG || {};
  const RECHECK_MS = 24 * 3600e3;            // ask again at most once a day (revoked codes lock within a day)
  const store = () => root.chrome && root.chrome.storage && root.chrome.storage.local;
  const get = (d) => new Promise((r) => { try { store().get(d, r); } catch { r(d); } });
  const put = (o) => new Promise((r) => { try { store().set(o, r); } catch { r(); } });
  const tidy = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  async function deviceId() {
    const s = await get({ deviceId: "" });
    if (/^[A-Za-z0-9-]{8,64}$/.test(s.deviceId || "")) return s.deviceId;
    const id = (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12));
    await put({ deviceId: id }); return id;
  }
  const app = () => (root.wickedStore ? "desktop" : root.PriismNative ? "android" : "extension");
  // ask the server about a code: "ok" | "invalid" | "revoked" | "full" | "offline"
  async function ask(code) {
    const c = CFG(); if (!c.url || !c.anonKey) return "offline";
    const ctl = typeof AbortController === "function" ? new AbortController() : null, t = setTimeout(() => ctl && ctl.abort(), 8000);
    try {
      const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/redeem_invite", { method: "POST", signal: ctl && ctl.signal,
        headers: { apikey: c.anonKey, Authorization: "Bearer " + c.anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ p_code: tidy(code), p_device: await deviceId(), p_app: app() }) });
      if (!r.ok) return "offline";
      const v = await r.json(); return ["ok", "invalid", "revoked", "full"].includes(v) ? v : "offline";
    } catch { return "offline"; } finally { clearTimeout(t); }
  }
  // you typed a code in the panel
  async function redeem(code) {
    const status = await ask(code);
    if (status === "ok") { const inv = { code: tidy(code), ok: true, status, checked: Date.now(), since: Date.now() }; await put({ invite: inv }); return inv; }
    return { ok: false, status };
  }
  // now and then: is the saved code still good? A revoked / deleted code locks Priism again; no internet keeps it as is.
  async function recheck(force) {
    const { invite } = await get({ invite: null });
    if (!invite || !invite.code) return invite;
    if (!force && Date.now() - (invite.checked || 0) < RECHECK_MS) return invite;
    const status = await ask(invite.code);
    if (status === "offline") return invite;
    const next = { ...invite, ok: status === "ok", status, checked: Date.now() };
    await put({ invite: next }); return next;
  }
  const isOk = (inv) => !!(inv && inv.ok && inv.code);
  root.PriismInvite = { redeem, recheck, isOk, deviceId, tidy };
})(typeof self !== "undefined" ? self : window);
