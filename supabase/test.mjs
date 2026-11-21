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
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
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
const up = (uid, title) => as(uid, `insert into public.wallpapers (title, kind, file_path, size_bytes, status, likes) values ($1, 'video', $2, 1000, 'approved', 999) returning id, status, owner, likes`, [title, `${uid}/x.webm`]);
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
{ const w = (await as(U1, "insert into public.wallpapers (title, kind, file_path, size_bytes, width, height, oled) values ('dark', 'image', 'u/x.png', 10, 3840, 2160, true) returning id, width, oled")).rows[0];
  ok("a shared wallpaper keeps its size and OLED label", w.width === 3840 && w.oled === true);
  ok("silly sizes are refused", (await tryAs(U1, "insert into public.wallpapers (title, kind, file_path, size_bytes, width, height) values ('x', 'image', 'u/y.png', 10, 0, 99999)")) !== "ok");
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
  ok("signed-in users still can't choose another owner", (await as(U1, "insert into public.wallpapers (owner, title, kind, file_path, size_bytes) values ($1, 'y', 'image', 'u/y.jpg', 10) returning owner", [OWNER])).rows[0].owner === U1); }
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
// ---------- beta access tied to accounts ----------
// Supabase grants execute on new functions by default and schema.sql revokes it again; the blanket grant above undid
// that here, so put the schema's revoke back for the internal helper.
await db.exec("revoke execute on function public.account_access(uuid) from anon, authenticated");
// (tests above may re-run schema.sql, which keeps only the owner as admin: make the test admin an admin again)
await db.exec(`update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com')`);
const raw = (sql, p) => db.query(sql, p);   // as the database owner: used only to move the clock for a test
const B1 = "00000000-0000-0000-0000-0000000000b1", B2 = "00000000-0000-0000-0000-0000000000b2";
for (const [id, e] of [[B1, "tester1@x.com"], [B2, "tester2@x.com"]]) await raw("insert into auth.users (id, email) values ($1, $2)", [id, e]);
ok("new codes are for 1 device by default", (await as(ADMIN, "insert into public.invites (code) values ('BETA-0001-AAAA') returning max_devices")).rows[0].max_devices === 1);
await as(ADMIN, "update public.invites set requires_account = true, expires_at = now() + interval '21 days' where code = 'BETA-0001-AAAA'");
await as(ADMIN, "insert into public.invites (code, requires_account, expires_at) values ('BETA-0002-AAAA', true, now() - interval '1 day'), ('BETA-0003-AAAA', true, now() + interval '21 days')");
const claim = async (uid, c) => (await as(uid, "select public.claim_invite($1) r", [c])).rows[0].r;
ok("a beta code can't be used by a device on its own", (await red("BETA-0001-AAAA", "solo-0000001")) === "account");
ok("an ended code says expired", (await red("BETA-0002-AAAA", "solo-0000001")) === "expired" && (await claim(B1, "BETA-0002-AAAA")) === "expired");
ok("signed out can't claim", (await tryAs(null, "select public.claim_invite('BETA-0001-AAAA')")).startsWith("denied"));
ok("claim a code to your account", (await claim(B1, " beta-0001-aaaa ")) === "ok" && (await claim(B1, "BETA-0001-AAAA")) === "ok");
ok("someone else can't take it", (await claim(B2, "BETA-0001-AAAA")) === "taken");
ok("unknown code", (await claim(B2, "NOPE-0000-0000")) === "invalid");
const acc = async uid => (await as(uid, "select public.my_access() r")).rows[0].r;
{ const a = await acc(B1); ok("my_access: ok, until the code's end, 1 device", a.status === "ok" && a.until && a.max_devices === 1 && a.codes.length === 1, JSON.stringify(a)); }
ok("no code yet -> none", (await acc(B2)).status === "none");
ok("the internal access check isn't callable from outside", (await tryAs(null, "select public.account_access($1)", [B1])).startsWith("denied") && (await tryAs(B2, "select public.account_access($1)", [B1])).startsWith("denied"));
ok("no link code without access", (await tryAs(B2, "select public.create_link_code()")).startsWith("denied") && (await tryAs(null, "select public.create_link_code()")).startsWith("denied"));
const mk = async uid => (await as(uid, "select public.create_link_code() c")).rows[0].c;
const S1 = "s".repeat(40), S2 = "t".repeat(40), S3 = "u".repeat(40);
const link = async (c, dev, sec, app = "extension") => (await as(null, "select public.link_device($1, $2, $3, $4) r", [c, dev, sec, app])).rows[0].r;
const chk = async (dev, sec) => (await as(null, "select public.device_check($1, $2) r", [dev, sec])).rows[0].r;
let L = await mk(B1);
ok("link code looks like ABCD-EF23", /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(L), L);
ok("a new link code replaces the old one", (await mk(B1)) !== L && (await link(L, "pc-00000001", S1)).status === "invalid");
L = await mk(B1);
ok("bad device or secret refused", (await link(L, "x';drop", S1)).status === "invalid" && (await link(L, "pc-00000001", "short")).status === "invalid");
{ const r = await link(L.toLowerCase().replace("-", "-"), "pc-00000001", S1); ok("first copy links (ok + until)", r.status === "ok" && r.until, JSON.stringify(r)); }
ok("a link code works once", (await link(L, "pc-00000009", S3)).status === "invalid");
ok("only the hash of the secret is stored", (await raw("select secret_hash from public.account_devices where device = 'pc-00000001'")).rows[0].secret_hash.length === 64
  && (await raw("select count(*)::int n from public.account_devices where secret_hash like '%sss%'")).rows[0].n === 0);
ok("nobody reads linked copies directly", (await as(B1, "select count(*)::int n from public.account_devices")).rows[0].n === 0 && (await as(null, "select count(*)::int n from public.account_devices")).rows[0].n === 0);
ok("check: right secret ok", (await chk("pc-00000001", S1)).status === "ok");
ok("check: wrong secret or copied id is invalid", (await chk("pc-00000001", S2)).status === "invalid");
L = await mk(B1); await raw("update public.link_codes set expires_at = now() - interval '1 minute' where code = $1", [L]);
ok("a link code ends after 10 minutes", (await link(L, "pc-00000002", S2)).status === "invalid");
L = await mk(B1);
ok("a second copy moves the account to it", (await link(L, "pc-00000002", S2)).status === "ok");
ok("the old copy is told it moved", (await chk("pc-00000001", S1)).status === "moved" && (await chk("pc-00000002", S2)).status === "ok");
L = await mk(B1);
{ const r = await link(L, "pc-00000003", S3); ok("another move within 7 days -> full, with the date it opens", r.status === "full" && r.next, JSON.stringify(r)); }
ok("re-linking the same copy is fine (reinstall)", (await link(await mk(B1), "pc-00000002", S2)).status === "ok");
ok("my_access shows the next move date", !!(await acc(B1)).next_move);
await as(null, "select public.unlink_device($1, $2)", ["pc-00000002", S2]);
ok("sign out on a copy stops it", (await chk("pc-00000002", S2)).status === "moved");
ok("...and still counts for 7 days (can't pass it around)", (await link(await mk(B1), "pc-00000003", S3)).status === "full");
await raw("update public.account_moves set last_move = now() - interval '8 days' where user_id = $1", [B1]);
ok("after 7 days a move is allowed again", (await link(await mk(B1), "pc-00000003", S3)).status === "ok" && (await chk("pc-00000003", S3)).status === "ok");
ok("a linked copy can report a bug", (await bug("Glow too bright", "pc-00000003")) === "ok");
ok("non-admins can't see accounts or reset", (await tryAs(B1, "select public.admin_accounts()")).startsWith("denied") && (await tryAs(B1, "select public.admin_reset_account($1)", [B1])).startsWith("denied"));
{ const list = (await as(ADMIN, "select public.admin_accounts() r")).rows[0].r; const me = list.find(x => x.code === "BETA-0001-AAAA");
  ok("the owner sees who claimed which code and their copies", me && me.email === "tester1@x.com" && me.devices === 1 && me.next_move, JSON.stringify(me)); }
await as(ADMIN, "select public.admin_reset_account($1)", [B1]);
ok("owner reset: copies removed, a new one links straight away", (await chk("pc-00000003", S3)).status === "invalid" && (await link(await mk(B1), "pc-00000004", S1)).status === "ok"
  && (await link(await mk(B1), "pc-00000005", S2)).status === "ok");
await as(ADMIN, "update public.invites set expires_at = now() + interval '28 days' where code = 'BETA-0001-AAAA'");
ok("owner extends: the new end date shows on the next check", new Date((await chk("pc-00000005", S2)).until) > new Date(Date.now() + 27 * 864e5));
await raw("update public.invites set expires_at = now() - interval '1 minute' where code = 'BETA-0001-AAAA'");
ok("beta ends -> check says expired, no new link codes", (await chk("pc-00000005", S2)).status === "expired" && (await acc(B1)).status === "expired" && (await tryAs(B1, "select public.create_link_code()")).startsWith("denied"));
ok("an expired account's copies can't report bugs", (await bug("after the end", "pc-00000005")) === "invalid");
await raw("update public.invites set expires_at = now() + interval '7 days' where code = 'BETA-0001-AAAA'");
await as(ADMIN, "update public.invites set revoked = true where code = 'BETA-0001-AAAA'");
ok("owner revokes -> check says revoked", (await chk("pc-00000005", S2)).status === "revoked");
await claim(B2, "BETA-0003-AAAA"); await link(await mk(B2), "pc-00000005", S2);
ok("a copy linked to a new account leaves the old one", (await chk("pc-00000005", S2)).status === "ok"
  && (await raw("select count(*)::int n from public.account_devices where device = 'pc-00000005' and active")).rows[0].n === 1);
ok("admins: access with no code", (await as(ADMIN, "select public.my_access() r")).rows[0].r.status === "ok");
const passed = Object.values(R).filter(Boolean).length, total = Object.keys(R).length;
console.log("SUMMARY:", passed + "/" + total); if (passed !== total) process.exit(1);
