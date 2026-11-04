/* Workshop client: community wallpapers on Supabase (see supabase/schema.sql for the rules).
   window.Workshop is a small API the panel uses. Tests can swap in a fake via window.__WORKSHOP_FAKE. */
(function () {
  if (window.__WORKSHOP_FAKE) { window.Workshop = window.__WORKSHOP_FAKE; return; }
  const CFG = window.WORKSHOP_CONFIG || {};
  const configured = !!(CFG.url && CFG.anonKey && window.supabase);
  const BUCKET = "workshop", PAGE = 24;
  const sb = configured ? window.supabase.createClient(CFG.url, CFG.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: "implicit" },
  }) : null;
  const publicUrl = (p) => (p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : null);
  const need = () => { if (!sb) throw new Error("The Workshop isn't connected yet."); };
  const err = (r) => { if (r.error) throw new Error(r.error.message || String(r.error)); return r.data; };
  const listeners = new Set();
  let user = null, profile = null;

  async function refreshUser() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    profile = null;
    if (user) {
      const r = await sb.from("profiles").select("display_name, is_admin").eq("id", user.id).maybeSingle();
      profile = r.data || { display_name: (user.email || "").split("@")[0], is_admin: false };
    }
    listeners.forEach((f) => f(me()));
    return me();
  }
  const me = () => (user ? { id: user.id, email: user.email, name: (profile && profile.display_name) || user.email, admin: !!(profile && profile.is_admin) } : null);
  if (sb) sb.auth.onAuthStateChange(() => { refreshUser(); });

  window.Workshop = {
    configured,
    onAuth: (f) => { listeners.add(f); return () => listeners.delete(f); },
    me,
    refresh: refreshUser,

    // ---------- accounts ----------
    async signUp(email, password) {
      need();
      const d = err(await sb.auth.signUp({ email, password }));
      await refreshUser();
      return { needsConfirm: !d.session };          // Supabase may require email confirmation first
    },
    async signIn(email, password) { need(); err(await sb.auth.signInWithPassword({ email, password })); return refreshUser(); },
    // Forgot password: Supabase emails a link that opens the website's reset page (site/reset.html)
    async resetPassword(email) { need(); err(await sb.auth.resetPasswordForEmail(email, { redirectTo: (CFG.siteUrl || "https://arcuto29.github.io/wicked-skins/") + "reset.html" })); },
    async signInGoogle() {
      need();
      if (!(window.chrome && chrome.identity && chrome.identity.launchWebAuthFlow)) throw new Error("Google sign-in works in the browser extension.");
      const redirect = chrome.identity.getRedirectURL();
      const url = `${CFG.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
      const back = await chrome.identity.launchWebAuthFlow({ url, interactive: true });
      const p = new URLSearchParams((back.split("#")[1] || back.split("?")[1] || ""));
      if (p.get("error")) throw new Error(p.get("error_description") || p.get("error"));
      err(await sb.auth.setSession({ access_token: p.get("access_token"), refresh_token: p.get("refresh_token") }));
      return refreshUser();
    },
    async signOut() { if (sb) await sb.auth.signOut(); user = null; profile = null; listeners.forEach((f) => f(null)); },

    // ---------- browse ----------
    // sort: "popular" | "new" | "mine" | "review" (admins)
    async list(sort = "popular", page = 0) {
      need();
      let q = sb.from("wallpapers").select("id, owner, title, kind, file_path, thumb_path, size_bytes, status, reject_reason, likes, uses, reports, created_at");
      if (sort === "mine") q = q.eq("owner", user ? user.id : "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false });
      else if (sort === "review") q = q.eq("status", "pending").order("created_at", { ascending: true });
      else { q = q.eq("status", "approved"); q = sort === "new" ? q.order("created_at", { ascending: false }) : q.order("likes", { ascending: false }).order("uses", { ascending: false }); }
      const rows = err(await q.range(page * PAGE, page * PAGE + PAGE - 1));
      let liked = new Set();
      if (user && rows.length) {
        const l = await sb.from("likes").select("wallpaper_id").in("wallpaper_id", rows.map((r) => r.id));
        liked = new Set((l.data || []).map((x) => x.wallpaper_id));
      }
      return rows.map((r) => ({ ...r, fileUrl: publicUrl(r.file_path), thumbUrl: publicUrl(r.thumb_path) || publicUrl(r.file_path), liked: liked.has(r.id), mine: !!user && r.owner === user.id }));
    },
    async like(id, on) {
      need();
      if (on) err(await sb.from("likes").insert({ wallpaper_id: id }));
      else err(await sb.from("likes").delete().eq("wallpaper_id", id).eq("user_id", user.id));
    },
    async report(id, reason) { need(); err(await sb.from("reports").insert({ wallpaper_id: id, reason: (reason || "").slice(0, 200) })); },
    // download the file so it can be added to your Uploads
    async fetchFile(item) {
      need();
      const r = await fetch(item.fileUrl);
      if (!r.ok) throw new Error("Download failed (" + r.status + ").");
      const blob = await r.blob();
      sb.rpc("count_use", { wallpaper: item.id }).then(() => {}, () => {});
      return blob;
    },

    // ---------- share ----------
    async share({ blob, thumb, title, kind }) {
      need(); if (!user) throw new Error("Sign in to share.");
      const ext = (blob.type.split("/")[1] || (kind === "video" ? "webm" : "png")).replace("jpeg", "jpg").replace(/[^a-z0-9]/g, "");
      const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
      const path = `${user.id}/${id}.${ext}`;
      err(await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || (kind === "video" ? "video/webm" : "image/png"), upsert: false }));
      let thumbPath = null;
      if (thumb) {
        thumbPath = `${user.id}/${id}.thumb.jpg`;
        await sb.storage.from(BUCKET).upload(thumbPath, thumb, { contentType: "image/jpeg" }).catch(() => (thumbPath = null));
      }
      const row = err(await sb.from("wallpapers").insert({ title: title.slice(0, 60), kind, file_path: path, thumb_path: thumbPath, size_bytes: blob.size }).select("id, status").single());
      return row; // status "approved" for admins, "pending" for everyone else
    },
    async remove(item) {
      need();
      err(await sb.from("wallpapers").delete().eq("id", item.id));
      await sb.storage.from(BUCKET).remove([item.file_path, item.thumb_path].filter(Boolean)).catch(() => {});
    },

    // ---------- review (admins) ----------
    async moderate(id, status, reason) { need(); err(await sb.rpc("moderate_wallpaper", { wallpaper: id, new_status: status, reason: reason || null })); },
  };
  refreshUser();
})();
