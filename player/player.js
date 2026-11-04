/* Plays a wallpaper stored in the extension's IndexedDB. Embedded by content.js as an
   iframe behind the chart. Look settings (fit, position, speed, pause) arrive via postMessage. */
(async function () {
  const q = new URLSearchParams(location.search);
  const id = q.get("id"), type = q.get("type");
  let el, look = {};

  function apply() {
    if (!el) return;
    el.style.objectFit = { cover: "cover", fit: "contain", stretch: "fill" }[look.fit] || "cover";
    el.style.objectPosition = `${look.posX ?? 50}% ${look.posY ?? 50}%`;
    if (el.tagName === "VIDEO") {
      el.playbackRate = Math.max(0.25, Math.min(4, look.speed || 1));
      look.paused ? el.pause() : el.play().catch(() => {});
    }
  }

  addEventListener("message", (e) => {
    if (!e.data || e.data.__wicked !== "look") return;
    look = e.data.look || {};
    apply();
  });

  try {
    const blob = await WickedMediaDB.get(id);
    if (!blob) throw new Error("missing");
    el = document.createElement(type === "video" ? "video" : "img");
    el.id = "m";
    if (type === "video") Object.assign(el, { loop: true, muted: true, autoplay: true, playsInline: true });
    el.src = URL.createObjectURL(blob);
    document.body.appendChild(el);
    apply();
    parent.postMessage({ __wicked: "player-ready", id }, "*");
  } catch (err) {
    parent.postMessage({ __wicked: "player-error", id, msg: String(err) }, "*");
  }
})();
