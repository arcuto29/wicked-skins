// A stand-in for github.com's release URLs, for the desktop updater tests (test/updates/desktop-upgrade.js).
// The installed app is NOT changed or pointed anywhere else: the test machine resolves github.com to 127.0.0.1 and
// trusts this server's test certificate, so the app's own, unmodified updater talks to it exactly as it talks to
// GitHub. It serves one release the way GitHub does:
//   GET /<owner>/<repo>/releases.atom                       the releases feed
//   GET /<owner>/<repo>/releases/latest (Accept: json)      { tag_name }
//   GET /<owner>/<repo>/releases/download/<tag>/<file>      the release's files, under the names GITHUB gives
//                                                           uploaded files (a space becomes a dot), Range supported
// Every request is logged (JSON lines) with its status. A mode file switches failures on and off while it runs:
//   ok | slow (~1 MB/s, so progress can be watched) | 404 (installers missing) | corrupt (bytes changed) | down (resets)
//   node github-mock.js --dir <release files> --tag v0.1.990 --cert c.pem --key k.pem --log log.jsonl --mode mode.txt
"use strict";
const https = require("https"), fs = require("fs"), path = require("path");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const DIR = path.resolve(arg("dir")), TAG = arg("tag"), LOG = arg("log", "mock-log.jsonl"), MODE = arg("mode", ""), PORT = +arg("port", 443);
const OWNER = arg("owner", "arcuto29"), REPO = arg("repo", "priism-skins"), BASE = `/${OWNER}/${REPO}/releases`;
// what GitHub would call each file after upload: spaces become dots (that's how 0.1.86's files ended up named)
const ghName = (f) => f.replace(/ /g, ".");
const files = new Map(fs.readdirSync(DIR).filter((f) => fs.statSync(path.join(DIR, f)).isFile()).map((f) => [ghName(f), path.join(DIR, f)]));
const mode = () => { try { return fs.readFileSync(MODE, "utf8").trim() || "ok"; } catch { return "ok"; } };
const log = (o) => fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...o }) + "\n");
const feed = () => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-US"><id>tag:github.com,2008:https://github.com${BASE}</id><title>Release notes</title><updated>2026-11-21T00:00:00Z</updated>
<entry><id>tag:github.com,2008:Repository/1/${TAG}</id><updated>2026-11-21T00:00:00Z</updated><link rel="alternate" type="text/html" href="https://github.com${BASE}/tag/${TAG}"/>
<title>Priism Skins ${TAG}</title><content type="html">&lt;ul&gt;&lt;li&gt;&lt;strong&gt;Updater test release&lt;/strong&gt;&lt;/li&gt;&lt;/ul&gt;</content><author><name>${OWNER}</name></author></entry></feed>`;
https.createServer({ cert: fs.readFileSync(arg("cert")), key: fs.readFileSync(arg("key")) }, (req, res) => {
  const m = mode(), u = decodeURIComponent(req.url.split("?")[0]);
  const end = (status, body, headers = {}) => { log({ method: req.method, url: u, status, mode: m, range: req.headers.range || null }); res.writeHead(status, headers); res.end(body); };
  if (m === "down") { log({ method: req.method, url: u, status: "reset", mode: m }); return req.socket.destroy(); }
  if (u === `${BASE}.atom`) return end(200, feed(), { "content-type": "application/atom+xml; charset=utf-8" });
  if (u === `${BASE}/latest`) return end(200, JSON.stringify({ tag_name: TAG, name: TAG }), { "content-type": "application/json" });
  const dl = `${BASE}/download/${TAG}/`;
  if (!u.startsWith(dl)) return end(404, "Not Found");
  const name = u.slice(dl.length), file = files.get(name);
  if (!file || (m === "404" && /\.(exe|AppImage|zip)$/.test(name))) return end(404, "Not Found");
  const size = fs.statSync(file).size;
  let start = 0, stop = size - 1, status = 200;
  const r = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
  if (req.headers.range && !r) return end(416, "", { "content-range": `bytes */${size}` });   // (several ranges at once: the updater falls back to one download)
  if (r) { start = +r[1]; stop = r[2] ? Math.min(+r[2], size - 1) : size - 1; status = 206; }
  log({ method: req.method, url: u, status, mode: m, range: req.headers.range || null, bytes: stop - start + 1 });
  res.writeHead(status, { "content-type": "application/octet-stream", "content-length": stop - start + 1, "accept-ranges": "bytes", ...(r ? { "content-range": `bytes ${start}-${stop}/${size}` } : {}) });
  if (req.method === "HEAD") return res.end();
  // one piece at a time: write it, wait until the connection took it, and in "slow" mode also wait 240 ms
  // (~1 MB/s, so the progress can be watched). (Waiting only for "drain" made slow mode run at full speed.)
  (async () => {
    let flipped = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      for await (let c of fs.createReadStream(file, { start, end: stop, highWaterMark: 256 * 1024 })) {
        if (m === "corrupt" && !flipped && /\.(exe|AppImage|zip)$/.test(name)) { c = Buffer.from(c); c[Math.min(c.length - 1, 5000)] ^= 0xff; flipped = true; }   // one byte, like a broken download
        if (res.destroyed) return;
        if (!res.write(c)) await new Promise((r) => { const done = () => { res.off("drain", done); res.off("close", done); r(); }; res.on("drain", done); res.on("close", done); });
        if (m === "slow") await wait(240);
      }
      res.end();
    } catch { res.destroy(); }
  })();
}).listen(PORT, "127.0.0.1", () => { log({ ready: true, port: PORT, tag: TAG, files: [...files.keys()] }); console.log(`github mock on :${PORT} for ${TAG}: ${[...files.keys()].join(", ")}`); });
