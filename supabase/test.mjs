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
ok("owner can delete own look", (await as(U1, "delete from public.looks where id = $1 returning id", [l1.id])).rows.length === 1);
const passed = Object.values(R).filter(Boolean).length, total = Object.keys(R).length;
console.log("SUMMARY:", passed + "/" + total); if (passed !== total) process.exit(1);
