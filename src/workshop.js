/* Workshop client for the extension: BROWSE + USE only, no account.
   Sharing, liking, reporting and admin review happen on the website (login there) — see site/workshop.html.
   window.Workshop is the small API the panel uses. Tests can swap in a fake via window.__WORKSHOP_FAKE. */
(function () {
  if (window.__WORKSHOP_FAKE) { window.Workshop = window.__WORKSHOP_FAKE; return; }
  const CFG = window.WORKSHOP_CONFIG || {};
  const configured = !!(CFG.url && CFG.anonKey && window.supabase);
  const BUCKET = "workshop", PAGE = 24;
  // No session: the extension only reads approved wallpapers (public) and downloads the files.
  const sb = configured ? window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  const publicUrl = (p) => (p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : null);
  const need = () => { if (!sb) throw new Error("The Workshop isn't connected yet."); };
  const err = (r) => { if (r.error) throw new Error(r.error.message || String(r.error)); return r.data; };

  window.Workshop = {
    configured,
    // sort: "popular" | "new"
    async list(sort = "popular", page = 0) {
      need();
      let q = sb.from("wallpapers").select("id, title, kind, file_path, thumb_path, size_bytes, likes, uses, created_at").eq("status", "approved");
      q = sort === "new" ? q.order("created_at", { ascending: false }) : q.order("likes", { ascending: false }).order("uses", { ascending: false });
      const rows = err(await q.range(page * PAGE, page * PAGE + PAGE - 1));
      return rows.map((r) => ({ ...r, fileUrl: publicUrl(r.file_path), thumbUrl: publicUrl(r.thumb_path) || publicUrl(r.file_path) }));
    },
    // community looks (whole setups, stored as settings): sort "top" | "new"
    async listLooks(sort = "top", page = 0) {
      need();
      let q = sb.from("looks").select("id, title, author, skin, data, uses, created_at").eq("status", "approved");
      q = sort === "new" ? q.order("created_at", { ascending: false }) : q.order("uses", { ascending: false }).order("created_at", { ascending: false });
      return err(await q.range(page * PAGE, page * PAGE + PAGE - 1));
    },
    countLookUse(id) { if (sb) sb.rpc("count_look_use", { look: id }).then(() => {}, () => {}); },
    // download the file so it can be added to your Uploads (and count the use)
    async fetchFile(item) {
      need();
      const r = await fetch(item.fileUrl);
      if (!r.ok) throw new Error("Download failed (" + r.status + ").");
      const blob = await r.blob();
      sb.rpc("count_use", { wallpaper: item.id }).then(() => {}, () => {});
      return blob;
    },
  };
})();
