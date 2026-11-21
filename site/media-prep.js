/* Priism Workshop: getting a wallpaper ready to upload, in the browser (no paid image service).
   - The original is kept exactly as you made it whenever it fits the limits.
   - A picture bigger than the size limit (longest side, 4K by default) or the file limit is scaled down to that size and
     saved as high-quality WebP (92%). Never upscaled. Animated GIFs and videos are never re-encoded: if one is over
     the limit you're told how big it may be.
   - The thumbnail for browsing is a small WebP (JPEG where WebP isn't available).
   window.PriismMediaPrep: { prepare(file, kind, limits) -> { file, changed, note } | throws Error(message), thumb(file, kind) } */
(function (root) {
  "use strict";
  const MB = 1048576, mb = (b) => (b < MB ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / MB >= 10 ? Math.round(b / MB) : Math.round((b / MB) * 10) / 10) + " MB");
  const DEF = { max_image_bytes: 20 * MB, max_video_bytes: 30 * MB, max_image_px: 3840 };
  const loadImage = (file) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That picture couldn't be opened.")); i.src = URL.createObjectURL(file); });
  const toBlob = (c, type, q) => new Promise((res) => c.toBlob(res, type, q));
  const named = (blob, name, type) => { try { return new File([blob], name, { type }); } catch { blob.name = name; return blob; } };

  async function prepare(file, kind, limits) {
    const L = { ...DEF, ...(limits || {}) }, maxB = kind === "video" ? +L.max_video_bytes : +L.max_image_bytes;
    if (kind === "video") {
      if (file.size > maxB) throw new Error(`Videos can be up to ${mb(maxB)} (this one is ${mb(file.size)}). A free tool like HandBrake can make it smaller at the same quality.`);
      return { file, changed: false, note: "" };
    }
    if (file.type === "image/gif") {          // (could be animated: never re-encoded)
      if (file.size > maxB) throw new Error(`GIFs can be up to ${mb(maxB)} (this one is ${mb(file.size)}).`);
      return { file, changed: false, note: "" };
    }
    const img = await loadImage(file), w = img.naturalWidth, h = img.naturalHeight, long = Math.max(w, h), maxPx = +L.max_image_px;
    if (long <= maxPx && file.size <= maxB) return { file, changed: false, note: `Kept as you made it (${w}\u00d7${h}).` };
    const k = Math.min(1, maxPx / long), W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(img.src);
    for (const q of [0.92, 0.86, 0.8]) {
      const b = await toBlob(c, "image/webp", q);
      if (b && b.type === "image/webp" && b.size <= maxB) {
        const base = (file.name || "wallpaper").replace(/\.[^.]+$/, "");
        return { file: named(b, base + ".webp", "image/webp"), changed: true,
          note: `${k < 1 ? `Scaled from ${w}\u00d7${h} to ${W}\u00d7${H}` : `Saved at ${W}\u00d7${H}`} as high-quality WebP (${mb(b.size)}, was ${mb(file.size)}), to fit the Workshop's limits.` };
      }
    }
    throw new Error(`Pictures can be up to ${mb(maxB)}; this one is still too big after scaling it down. Try a smaller copy.`);
  }

  // the browsing thumbnail: 560 px wide (sharp on a 2x screen at the cards' size), WebP 82% (JPEG fallback)
  function thumb(file, kind) {
    return new Promise((res, rej) => {
      const draw = async (src, w, h) => {
        try {
          const c = document.createElement("canvas"), k = Math.min(1, 560 / w); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
          const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, c.width, c.height);
          let b = await toBlob(c, "image/webp", 0.82), ext = "webp";
          if (!b || b.type !== "image/webp") { b = await toBlob(c, "image/jpeg", 0.82); ext = "jpg"; }
          b ? res({ blob: b, ext, type: ext === "webp" ? "image/webp" : "image/jpeg" }) : rej(new Error("no thumbnail"));
        } catch (e) { rej(e); }
      };
      if (kind === "image") { const i = new Image(); i.onload = () => draw(i, i.naturalWidth, i.naturalHeight); i.onerror = rej; i.src = URL.createObjectURL(file); }
      else { const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(file);
        v.onloadeddata = () => { v.currentTime = Math.min(0.1, v.duration || 0.1); }; v.onseeked = () => draw(v, v.videoWidth, v.videoHeight); v.onerror = rej; }
    });
  }
  root.PriismMediaPrep = { prepare, thumb, mb };
})(typeof self !== "undefined" ? self : this);
