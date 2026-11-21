// Tests the Workshop rules in supabase/schema.sql against a real Postgres (PGlite, WebAssembly).
// Run:  npm i --no-save @electric-sql/pglite && node supabase/test.mjs
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
const db = new PGlite();
const R = {}; const ok = (k, v, d) => { R[k] = v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + d : "")); };
// --- minimal stand-ins for Supabase's auth + storage schemas and roles ---
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now());
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
// Supabase grants table privileges to these roles by default; mirror that
await db.exec(`grant select, insert, delete on all tables in schema public to anon, authenticated;
  grant select, insert, delete on storage.objects to authenticated;
  grant execute on all functions in schema public to anon, authenticated;
  revoke update on public.profiles from authenticated; grant update (display_name) on public.profiles to authenticated;`);
const ADMIN = "00000000-0000-0000-0000-00000000000a", U1 = "00000000-0000-0000-0000-000000000001", U2 = "00000000-0000-0000-0000-000000000002", U3 = "00000000-0000-0000-0000-000000000003", U4 = "00000000-0000-0000-0000-000000000004";
for (const [id, e] of [[ADMIN, "you@example.com"], [U1, "a@x.com"], [U2, "b@x.com"], [U3, "c@x.com"], [U4, "d@x.com"]]) await db.query("insert into auth.users (id, email) values ($1, $2)", [id, e]);
ok("profile auto-created on sign-up", (await db.query("select count(*)::int n from public.profiles")).rows[0].n === 5);
const OWNER = "00000000-0000-0000-0000-0000000000ff";
await db.query("insert into auth.users (id, email) values ($1, 'Arcuto2978@gmail.com')", [OWNER]);
ok("the owner's email is an admin automatically (no SQL step)", (await db.query("select is_admin from public.profiles where id = $1", [OWNER])).rows[0].is_admin === true);
ok("other sign-ups are not", (await db.query("select count(*)::int n from public.profiles where is_admin")).rows[0].n === 1);
await db.exec(`update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com')`);   // e.g. a test account
await db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));   // re-running is safe and keeps it
ok("re-running the schema keeps the owner admin", (await db.query("select is_admin from public.profiles where id = $1", [OWNER])).rows[0].is_admin === true);
ok("...and takes admin away from accounts that aren't owners", (await db.query("select count(*)::int n from public.profiles where is_admin")).rows[0].n === 1);
await db.exec(`update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com')`);
const as = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ""}', false);`);
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
};
const tryAs = async (...a) => { try { await as(...a); return "ok"; } catch (e) { return "denied: " + e.message.slice(0, 60); } };
// a file in Storage (as Supabase records it: its real size in metadata), uploaded by that user
const put = (uid, name, size = 1000) => as(uid, `insert into storage.objects (bucket_id, name, metadata) values ('workshop', $1, $2)`, [name, JSON.stringify({ size, mimetype: "video/webm" })]);
let nFile = 0;
const up = async (uid, title) => { const f = `${uid}/x${++nFile}.webm`; await put(uid, f); return as(uid, `insert into public.wallpapers (title, kind, file_path, size_bytes, status, likes) values ($1, 'video', $2, 1000, 'approved', 999) returning id, status, owner, likes`, [title, f]); };
const w1 = (await up(U1, "User wallpaper")).rows[0];
ok("user upload -> pending, can't self-approve or fake likes", w1.status === "pending" && w1.likes === 0 && w1.owner === U1, JSON.stringify(w1));
const wa = (await up(ADMIN, "Admin wallpaper")).rows[0];
ok("admin upload -> approved immediately", wa.status === "approved", wa.status);
const anonSee = (await as(null, "select title from public.wallpapers")).rows.map(r => r.title);
ok("anyone (no account) sees only approved", anonSee.length === 1 && anonSee[0] === "Admin wallpaper", JSON.stringify(anonSee));
ok("uploader sees own pending item", (await as(U1, "select title from public.wallpapers")).rows.length === 2);
ok("other users don't see it", (await as(U2, "select title from public.wallpapers")).rows.length === 1);
ok("admin sees the review queue", (await as(ADMIN, "select count(*)::int n from public.wallpapers where status = 'pending'")).rows[0].n === 1);
ok("non-admin can't approve", (await tryAs(U1, "select public.moderate_wallpaper($1, 'approved')", [w1.id])).startsWith("denied"));
ok("nobody can edit rows directly", (await tryAs(U1, "update public.wallpapers set status = 'approved' where id = $1", [w1.id])).startsWith("denied"));
ok("users can't make themselves admin", (await tryAs(U1, "update public.profiles set is_admin = true where id = $1", [U1])).startsWith("denied"));
await as(ADMIN, "select public.moderate_wallpaper($1, 'approved')", [w1.id]);
ok("admin approves -> public", (await as(null, "select count(*)::int n from public.wallpapers")).rows[0].n === 2);
await as(U2, "insert into public.likes (wallpaper_id) values ($1)", [w1.id]); await as(U3, "insert into public.likes (wallpaper_id) values ($1)", [w1.id]);
ok("likes counted", (await as(null, "select likes from public.wallpapers where id = $1", [w1.id])).rows[0].likes === 2);
ok("can't like twice", (await tryAs(U2, "insert into public.likes (wallpaper_id) values ($1)", [w1.id])).startsWith("denied"));
await as(U2, "delete from public.likes where wallpaper_id = $1", [w1.id]);
ok("unlike", (await as(null, "select likes from public.wallpapers where id = $1", [w1.id])).rows[0].likes === 1);
await as(null, "select public.count_use($1)", [w1.id]);
ok("uses counted (no account needed)", (await as(null, "select uses from public.wallpapers where id = $1", [w1.id])).rows[0].uses === 1);
ok("can't report anonymously", (await tryAs(null, "insert into public.reports (wallpaper_id, reason) values ($1, 'x')", [w1.id])).startsWith("denied"));
for (const u of [U2, U3]) await as(u, "insert into public.reports (wallpaper_id, reason) values ($1, 'copyright')", [w1.id]);
ok("2 reports: still visible", (await as(null, "select count(*)::int n from public.wallpapers where id = $1", [w1.id])).rows[0].n === 1);
ok("same person can't report twice", (await tryAs(U2, "insert into public.reports (wallpaper_id) values ($1)", [w1.id])).startsWith("denied"));
await as(U4, "insert into public.reports (wallpaper_id, reason) values ($1, 'copyright')", [w1.id]);
ok("3rd report hides it until re-review", (await as(null, "select count(*)::int n from public.wallpapers where id = $1", [w1.id])).rows[0].n === 0);
ok("reports readable only by admin", (await as(U1, "select count(*)::int n from public.reports")).rows[0].n === 0 && (await as(ADMIN, "select count(*)::int n from public.reports")).rows[0].n === 3);
await as(ADMIN, "select public.moderate_wallpaper($1, 'rejected', 'Copyrighted artwork')", [w1.id]);
ok("rejected: owner sees reason", (await as(U1, "select status, reject_reason from public.wallpapers where id = $1", [w1.id])).rows[0].reject_reason === "Copyrighted artwork");
ok("can't delete someone else's", (await as(U2, "delete from public.wallpapers where id = $1 returning id", [wa.id])).rows.length === 0);
ok("owner can delete own", (await as(U1, "delete from public.wallpapers where id = $1 returning id", [w1.id])).rows.length === 1);
// storage folders
ok("upload file into own folder", (await tryAs(U1, `insert into storage.objects (bucket_id, name) values ('workshop', '${U1}/a.webm')`)) === "ok");
ok("can't upload into someone else's folder", (await tryAs(U1, `insert into storage.objects (bucket_id, name) values ('workshop', '${U2}/a.webm')`)).startsWith("denied"));
ok("title length enforced", (await tryAs(U1, `insert into public.wallpapers (title, kind, file_path, size_bytes) values ('', 'image', 'x', 10)`)).startsWith("denied"));
ok("size limit enforced (50 MB)", (await tryAs(U1, `insert into public.wallpapers (title, kind, file_path, size_bytes) values ('big', 'video', 'x', 60000000)`)).startsWith("denied"));
// ---------- community looks ----------
const share = (uid, title, data = { candleOn: true, candleUp: "#00ffa3" }) => as(uid, `insert into public.looks (title, skin, data, status, uses, author) values ($1, 'aurora', $2, 'approved', 500, 'fake') returning id, status, uses, owner, author`, [title, JSON.stringify(data)]);
const l1 = (await share(U1, "Night look")).rows[0];
ok("look share -> pending, can't fake uses / author / status", l1.status === "pending" && l1.uses === 0 && l1.owner === U1 && l1.author === "a", JSON.stringify(l1));
const la = (await share(ADMIN, "Admin look")).rows[0];
ok("admin look -> approved immediately", la.status === "approved");
ok("anyone sees only approved looks", (await as(null, "select count(*)::int n from public.looks")).rows[0].n === 1);
ok("can't share a look anonymously", (await tryAs(null, "insert into public.looks (title, skin, data) values ('x', 'aurora', '{}')")).startsWith("denied"));
ok("look skin id validated", (await tryAs(U1, "insert into public.looks (title, skin, data) values ('x', '<script>', '{}')")).startsWith("denied"));
ok("look data must be a small object", (await tryAs(U1, "insert into public.looks (title, skin, data) values ('x', 'aurora', '[1,2]')")).startsWith("denied"));
ok("non-admin can't approve looks", (await tryAs(U1, "select public.moderate_look($1, 'approved')", [l1.id])).startsWith("denied"));
ok("nobody edits looks directly", (await tryAs(U1, "update public.looks set status = 'approved' where id = $1", [l1.id])).startsWith("denied"));
await as(ADMIN, "select public.moderate_look($1, 'approved')", [l1.id]);
await as(null, "select public.count_look_use($1)", [l1.id]); await as(null, "select public.count_look_use($1)", [l1.id]);
ok("look uses counted without an account", (await as(null, "select uses from public.looks where id = $1", [l1.id])).rows[0].uses === 2);
for (const u of [U2, U3, U4]) await as(u, "insert into public.look_reports (look_id, reason) values ($1, 'spam')", [l1.id]);
ok("3 reports hide a look until re-review", (await as(null, "select count(*)::int n from public.looks where id = $1", [l1.id])).rows[0].n === 0);
{ const lu = (await share(U2, "Mine")).rows[0];
  ok("someone else can't update your look", (await tryAs(U1, "select public.update_my_look($1, 'x', 'aurora', '{}')", [lu.id])).startsWith("denied"));
  ok("signed out can't update a look", (await tryAs(null, "select public.update_my_look($1, 'x', 'aurora', '{}')", [lu.id])).startsWith("denied"));
  await as(ADMIN, "select public.moderate_look($1, 'approved')", [lu.id]);
  const st = (await as(U2, "select public.update_my_look($1, 'Mine v2', 'galaxy', $2) s", [lu.id, JSON.stringify({ candleUp: "#ff0000" })])).rows[0].s;
  const row = (await as(U2, "select title, skin, data, status from public.looks where id = $1", [lu.id])).rows[0];
  ok("owner updates own look; it goes back to review", st === "pending" && row.title === "Mine v2" && row.skin === "galaxy" && row.data.candleUp === "#ff0000" && row.status === "pending", JSON.stringify(row));
  ok("update checks the skin id", (await tryAs(U2, "select public.update_my_look($1, 'x', '<b>', '{}')", [lu.id])).startsWith("denied"));
  const sa = (await as(ADMIN, "select public.update_my_look($1, 'Admin look 2', 'aurora', '{}') s", [la.id])).rows[0].s;
  ok("an admin's update stays live", sa === "approved" && (await as(null, "select title from public.looks where id = $1", [la.id])).rows[0].title === "Admin look 2"); }
ok("owner can delete own look", (await as(U1, "delete from public.looks where id = $1 returning id", [l1.id])).rows.length === 1);
// ---------- wallpaper labels (quality + OLED) ----------
{ await put(U1, `${U1}/dark.png`, 10); await put(U1, `${U1}/y.png`, 10);
  const w = (await as(U1, `insert into public.wallpapers (title, kind, file_path, size_bytes, width, height, oled) values ('dark', 'image', '${U1}/dark.png', 10, 3840, 2160, true) returning id, width, oled`)).rows[0];
  ok("a shared wallpaper keeps its size and OLED label", w.width === 3840 && w.oled === true);
  ok("silly sizes are refused", (await tryAs(U1, `insert into public.wallpapers (title, kind, file_path, size_bytes, width, height) values ('x', 'image', '${U1}/y.png', 10, 0, 99999)`)) !== "ok");
  ok("non-admins can't relabel", (await tryAs(U2, "select public.label_wallpaper($1, 640, 360, false)", [w.id])).startsWith("denied"));
  await as(ADMIN, "select public.label_wallpaper($1, 1920, 1080, false)", [w.id]);
  const r = (await as(ADMIN, "select width, oled from public.wallpapers where id = $1", [w.id])).rows[0];
  ok("admin can (re-)measure a wallpaper", r.width === 1920 && r.oled === false); }
// the owner's tools (service key: no signed-in user) add credited wallpapers for an admin, approved straight away
{ await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");   // like the service key: no user
  const w = (await db.query("insert into public.wallpapers (owner, title, kind, file_path, size_bytes, credit) values ($1, 'Cosmic Cliffs', 'image', 'o/c.jpg', 10, 'NASA, ESA, CSA, and STScI') returning status, owner, credit", [OWNER])).rows[0];
  ok("service upload for the owner: approved, owner kept, credit stored", w.status === "approved" && w.owner === OWNER && w.credit === "NASA, ESA, CSA, and STScI");
  let bad = "ok"; try { await db.query("insert into public.wallpapers (owner, title, kind, file_path, size_bytes) values ($1, 'x', 'image', 'o/x.jpg', 10)", [U1]); } catch { bad = "refused"; }
  ok("service uploads for a non-admin are refused", bad === "refused");
  ok("signed-in users still can't choose another owner", (await as(U1, `insert into public.wallpapers (owner, title, kind, file_path, size_bytes) values ($1, 'y', 'image', '${U1}/y.png', 10) returning owner`, [OWNER])).rows[0].owner === U1); }
// ---------- invites ----------
await db.exec("grant update on public.invites to authenticated");
ok("non-admin can't make invites", (await tryAs(U1, "insert into public.invites (code) values ('PRIISM-AAAA-BBBB')")).startsWith("denied"));
await as(ADMIN, "insert into public.invites (code, max_devices) values ('PRIISM-AAAA-BBBB', 2)");
ok("nobody else can read the codes", (await as(U1, "select count(*)::int n from public.invites")).rows[0].n === 0 && (await as(null, "select count(*)::int n from public.invites")).rows[0].n === 0);
const red = async (code, dev) => (await as(null, "select public.redeem_invite($1, $2, 'ext') r", [code, dev])).rows[0].r;
ok("a wrong code -> invalid", (await red("PRIISM-NOPE-NOPE", "dev-00000001")) === "invalid");
ok("first device -> ok (any case / spaces)", (await red(" priism-aaaa-bbbb ", "dev-00000001")) === "ok");
ok("same device again -> still ok", (await red("PRIISM-AAAA-BBBB", "dev-00000001")) === "ok");
ok("second device -> ok", (await red("PRIISM-AAAA-BBBB", "dev-00000002")) === "ok");
ok("third device -> full", (await red("PRIISM-AAAA-BBBB", "dev-00000003")) === "full");
ok("admin sees the devices on a code", (await as(ADMIN, "select count(*)::int n from public.invite_devices")).rows[0].n === 2);
ok("others can't see devices", (await as(U1, "select count(*)::int n from public.invite_devices")).rows[0].n === 0);
await as(ADMIN, "delete from public.invite_devices where device = 'dev-00000002'");
ok("admin frees a slot -> a new device fits", (await red("PRIISM-AAAA-BBBB", "dev-00000003")) === "ok");
ok("non-admin can't revoke", (await tryAs(U1, "update public.invites set revoked = true")).startsWith("ok") && (await red("PRIISM-AAAA-BBBB", "dev-00000001")) === "ok");
await as(ADMIN, "update public.invites set revoked = true where code = 'PRIISM-AAAA-BBBB'");
ok("revoked -> every device locks", (await red("PRIISM-AAAA-BBBB", "dev-00000001")) === "revoked");
ok("bad device ids are refused", (await red("PRIISM-AAAA-BBBB", "x';drop")) === "invalid");
// group codes (one code for a whole community) and bulk codes
await as(ADMIN, "insert into public.invites (code, max_devices, note) values ('PRIISM-GRUP-0001', 500, 'discord')");
for (let i = 0; i < 120; i++) await red("PRIISM-GRUP-0001", "grp-" + String(i).padStart(8, "0"));
ok("a group code lets many devices in (120 of 500)", (await as(ADMIN, "select count(*)::int n from public.invite_devices where code = 'PRIISM-GRUP-0001'")).rows[0].n === 120);
ok("up to 10000 devices allowed, more refused", (await tryAs(ADMIN, "insert into public.invites (code, max_devices) values ('PRIISM-BIGG-0001', 10000)")).startsWith("ok")
  && (await tryAs(ADMIN, "insert into public.invites (code, max_devices) values ('PRIISM-HUGE-0001', 10001)")) !== "ok");
const bulk = Array.from({ length: 50 }, (_, i) => `('PRIISM-BULK-${String(i).padStart(4, "0")}', 1)`).join(",");
await as(ADMIN, "insert into public.invites (code, max_devices) values " + bulk);
ok("50 codes made at once", (await as(ADMIN, "select count(*)::int n from public.invites where code like 'PRIISM-BULK-%'")).rows[0].n === 50);
// ---------- bug reports ----------
await db.exec("grant select, insert, update, delete on public.bug_reports to anon, authenticated");   // Supabase gives these by default; RLS decides
const bug = async (msg, dev, contact = null, info = {}) => (await as(null, "select public.report_bug($1, $2, $3::jsonb, $4) r", [msg, contact, JSON.stringify(info), dev])).rows[0].r;
ok("a device with an invite can report a bug", (await bug("Candles flicker on 4 charts", "grp-00000001", "@me", { v: "0.1.80", app: "extension" })) === "ok");
ok("no invite on the device -> refused", (await bug("spam", "nope-0000001")) === "invalid");
ok("a revoked code's devices can't report", (await bug("still here", "dev-00000001")) === "invalid");
ok("empty or huge text is refused", (await bug("  ", "grp-00000001")) === "invalid" && (await bug("x".repeat(2001), "grp-00000001")) === "invalid");
for (let i = 0; i < 4; i++) await bug("report " + i, "grp-00000001");
ok("at most 5 an hour from one device", (await bug("one more", "grp-00000001")) === "slow");
ok("nobody but admins can read them", (await as(U1, "select count(*)::int n from public.bug_reports")).rows[0].n === 0 && (await as(null, "select count(*)::int n from public.bug_reports")).rows[0].n === 0);
const br = (await as(ADMIN, "select message, contact, info->>'v' v from public.bug_reports order by id limit 1")).rows[0];
ok("the owner reads them, with contact and version", br && br.message === "Candles flicker on 4 charts" && br.contact === "@me" && br.v === "0.1.80");
ok("nobody can write one directly (only through report_bug)", (await tryAs(U1, "insert into public.bug_reports (device, message) values ('x-00000001', 'hey')")) !== "ok" && (await tryAs(null, "insert into public.bug_reports (device, message) values ('x-00000001', 'hey')")) !== "ok");
await as(ADMIN, "update public.bug_reports set done = true where message = 'report 0'");
ok("the owner marks one done and deletes one", (await as(ADMIN, "select count(*)::int n from public.bug_reports where done")).rows[0].n === 1 && (await tryAs(ADMIN, "delete from public.bug_reports where message = 'report 1'")).startsWith("ok"));
// ---------- free-tier limits: upload quotas, the real size, the total cap, the usage monitor ----------
await db.exec("grant update on public.app_limits to anon, authenticated");   // Supabase grants it by default; RLS decides
const U5 = "00000000-0000-0000-0000-000000000005", U6 = "00000000-0000-0000-0000-000000000006";
for (const [id, e] of [[U5, "e@x.com"], [U6, "f@x.com"]]) await db.query("insert into auth.users (id, email) values ($1, $2)", [id, e]);
const MB = 1048576;
const share1 = (uid, kind, file, claimed = 1000, thumb = null) => as(uid, `insert into public.wallpapers (title, kind, file_path, thumb_path, size_bytes) values ('t', $1, $2, $3, $4) returning size_bytes`, [kind, file, thumb, claimed]);
ok("limits are readable by anyone (the site shows them)", (await as(null, "select max_uploads_per_user n from public.app_limits")).rows[0].n === 15);
ok("only admins change the limits", (await as(U5, "update public.app_limits set max_uploads_per_user = 999 returning id")).rows.length === 0
  && (await as(ADMIN, "update public.app_limits set max_uploads_per_user = 3, max_bytes_per_user = $1, max_image_bytes = $2, max_video_bytes = $2 returning id", [10 * MB, 5 * MB])).rows.length === 1);
ok("nobody can add or remove the limits row", (await tryAs(ADMIN, "insert into public.app_limits (id) values (2)")) !== "ok" && (await tryAs(ADMIN, "delete from public.app_limits")) !== "ok");
// the recorded size is the stored file's, never what the browser says
await put(U5, `${U5}/a.png`, 2 * MB);
ok("the size recorded is the stored file's (a fake small size is replaced)", Number((await share1(U5, "image", `${U5}/a.png`, 10)).rows[0].size_bytes) === 2 * MB);
ok("sharing a file that was never uploaded is refused", (await tryAs(U5, "insert into public.wallpapers (title, kind, file_path, size_bytes) values ('t', 'image', $1, 10)", [`${U5}/nope.png`])).includes("upload the file first"));
await put(U6, `${U6}/theirs.png`, MB);
ok("sharing someone else's file as your own is refused", (await tryAs(U5, "insert into public.wallpapers (title, kind, file_path, size_bytes) values ('t', 'image', $1, 10)", [`${U6}/theirs.png`])).includes("own folder"));
await put(U5, `${U5}/big.png`, 6 * MB);
ok("an image over the image limit is refused, with the limit", (await tryAs(U5, "insert into public.wallpapers (title, kind, file_path, size_bytes) values ('t', 'image', $1, 10)", [`${U5}/big.png`])).includes("up to 5 MB"));
await db.query("delete from storage.objects where name = $1", [`${U5}/big.png`]);   // (removed through the Storage API, as the site does)
await put(U5, `${U5}/b.png`, MB); await share1(U5, "image", `${U5}/b.png`); await put(U5, `${U5}/c.png`, MB); await share1(U5, "image", `${U5}/c.png`);
await put(U5, `${U5}/d.png`, MB);
ok("the per-user upload count is enforced (3 here), with how to make room", (await tryAs(U5, "insert into public.wallpapers (title, kind, file_path, size_bytes) values ('t', 'image', $1, 10)", [`${U5}/d.png`])).includes("up to 3 wallpapers"));
const mine = (await as(U5, "select public.my_workshop_usage() u")).rows[0].u;
ok("you see your own usage and limits", mine.uploads === 3 && mine.max_uploads === 3 && Number(mine.bytes) === 5 * MB && Number(mine.max_bytes) === 10 * MB && mine.unlimited === false, JSON.stringify(mine));
// storage itself stops a user who is at their byte limit (also uploads that never became a wallpaper)
await as(ADMIN, "update public.app_limits set max_uploads_per_user = 50, max_bytes_per_user = $1", [6 * MB]);
await put(U5, `${U5}/e.png`, MB);   // now at 6 MB
ok("Storage refuses more files once you're at your byte limit", (await tryAs(U5, `insert into storage.objects (bucket_id, name, metadata) values ('workshop', '${U5}/f.png', '{"size": 10}')`)).startsWith("denied"));
ok("...but other users can still upload", (await tryAs(U6, `insert into storage.objects (bucket_id, name, metadata) values ('workshop', '${U6}/ok.png', '{"size": 10}')`)) === "ok");
ok("admins aren't limited", (await tryAs(ADMIN, `insert into storage.objects (bucket_id, name, metadata) values ('workshop', '${ADMIN}/huge.mp4', '{"size": 52000000}')`)) === "ok"
  && (await as(ADMIN, "select public.my_workshop_usage() u")).rows[0].u.unlimited === true);
// the whole Workshop has a cap below the plan's storage quota: once it's reached, uploads stop (for non-admins)
await as(ADMIN, "update public.app_limits set max_bytes_per_user = $1, max_total_bytes = $2", [100 * MB, 50 * MB]);
ok("once the Workshop is at its total cap, uploads stop for everyone but admins", (await tryAs(U6, `insert into storage.objects (bucket_id, name, metadata) values ('workshop', '${U6}/more.png', '{"size": 10}')`)).startsWith("denied"));
await as(ADMIN, "update public.app_limits set max_total_bytes = $1", [900 * MB]);
// the usage monitor (admins only)
await db.exec("update public.wallpapers set status = 'approved'");
const wid = (await as(U5, "select id from public.wallpapers where owner = $1 limit 1", [U5])).rows[0].id;
for (let i = 0; i < 3; i++) await as(null, "select public.count_use($1)", [wid]);
await db.exec(`insert into storage.objects (bucket_id, name, metadata, created_at) values ('workshop', '${U6}/stale.png', '{"size": 4096}', now() - interval '2 days')`);
const use = (await as(ADMIN, "select public.workshop_usage() u")).rows[0].u;
ok("monitor: storage, database, downloads this month (3 of the 2 MB file + the earlier 1000-byte one)", Number(use.workshop_bytes) > 0 && Number(use.db_bytes) > 0 && use.month_downloads === 4 && Number(use.month_bytes) === 3 * 2 * MB + 1000 && use.limits.free_storage_bytes === 1073741824, JSON.stringify({ w: use.workshop_bytes, d: use.month_downloads, b: use.month_bytes }));
ok("monitor: top uploaders and files left by unfinished uploads (older than a day)", use.top.length >= 2 && use.top[0].bytes >= use.top[1].bytes && use.orphans.some((o) => o.path === `${U6}/stale.png` && o.bytes === 4096) && !use.orphans.some((o) => o.path === `${U5}/a.png`), JSON.stringify(use.orphans.map((o) => o.path)));
ok("monitor: admins only", (await tryAs(U5, "select public.workshop_usage()")).startsWith("denied") && (await tryAs(null, "select public.workshop_usage()")).startsWith("denied"));
ok("the internal helpers can't be called directly", (await tryAs(U5, "select public.workshop_folder_usage($1)", [U6])).startsWith("denied") && (await tryAs(U5, "select public.workshop_check_upload('image', 'x', null, 1)")).startsWith("denied"));
ok("downloads per day aren't readable directly", (await as(U5, "select count(*)::int n from public.usage_daily")).rows[0].n === 0);
await as(ADMIN, "update public.app_limits set max_uploads_per_user = 15, max_bytes_per_user = $1, max_image_bytes = $2, max_video_bytes = $3", [60 * MB, 20 * MB, 30 * MB]);
await db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
ok("re-running the schema keeps the limits you set", (await db.query("select max_uploads_per_user n from public.app_limits")).rows[0].n === 15);
const passed = Object.values(R).filter(Boolean).length, total = Object.keys(R).length;
console.log("SUMMARY:", passed + "/" + total); if (passed !== total) process.exit(1);
