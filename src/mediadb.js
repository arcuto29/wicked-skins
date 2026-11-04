/* Tiny IndexedDB store for wallpaper files (extension origin only).
   Big videos live here as Blobs instead of chrome.storage, so there's no 50 MB cap
   and nothing gets copied around as base64. Used by the popup/manager and the player. */
(function () {
  const DB = "wicked-media", STORE = "files";
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
      const req = fn(s);
      t.oncomplete = () => res(req && req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  };
  window.WickedMediaDB = {
    put: (id, blob) => tx("readwrite", (s) => s.put(blob, id)),
    get: (id) => tx("readonly", (s) => s.get(id)),
    del: (id) => tx("readwrite", (s) => s.delete(id)),
  };
})();
