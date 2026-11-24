-- Priism Skins Workshop: community wallpapers.
-- Run once in your Supabase project: Dashboard -> SQL Editor -> paste this file -> Run.
-- Safe to re-run (uses "if not exists" / "or replace").
--
-- Rules (enforced here, so nobody can bypass them from the extension):
--   * anyone can browse APPROVED wallpapers, no account needed
--   * signed-in users can upload; uploads wait for review ("pending")
--   * admins' uploads are approved immediately; only admins can approve / reject
--   * 3 reports hide an approved wallpaper again until an admin re-reviews it
--   * nobody can make themselves admin: only the owner emails listed in public.owner_emails() (bottom of this
--     file) are admins, automatically, whether they signed up before or after you run this

-- ---------- owners ----------
-- The site owner's sign-in email(s). These accounts are admins: their uploads go live without review, and the
-- website's Workshop page shows them a Review list for everyone else's uploads. Change / add emails here and re-run.
create or replace function public.owner_emails()
returns text[]
language sql
immutable
as $$ select array['arcuto2978@gmail.com']::text[] $$;
revoke execute on function public.owner_emails() from public, anon, authenticated;   -- not callable from the website

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
          lower(coalesce(new.email, '')) = any (public.owner_emails()))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin((select auth.uid())));
drop policy if exists "profiles: update own name" on public.profiles;
create policy "profiles: update own name" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- users may only change their display name, never is_admin
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- ---------- wallpapers ----------
create table if not exists public.wallpapers (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  kind text not null check (kind in ('image', 'video')),
  file_path text not null,
  thumb_path text,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  likes integer not null default 0,
  uses integer not null default 0,
  reports integer not null default 0,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists wallpapers_status_created on public.wallpapers (status, created_at desc);
create index if not exists wallpapers_status_likes on public.wallpapers (status, likes desc);
create index if not exists wallpapers_owner on public.wallpapers (owner);
alter table public.wallpapers enable row level security;

-- On upload: the owner is you, counters start at zero, and the status depends on who you are.
create or replace function public.wallpapers_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.likes := 0; new.uses := 0; new.reports := 0;
  new.reject_reason := null;
  -- no signed-in user: only the project's service key can get here (visitors can't insert at all). That's the owner
  -- adding wallpapers with Priism's own tools (like the credited space pack): it keeps the owner it was given, and only
  -- if that owner is an admin, and it's approved straight away.
  if auth.uid() is null then
    if new.owner is null or not public.is_admin(new.owner) then raise exception 'service uploads must belong to an admin'; end if;
    new.status := 'approved'; new.reviewed_at := now(); return new;
  end if;
  new.owner := auth.uid();
  if public.is_admin(auth.uid()) then
    new.status := 'approved'; new.reviewed_at := now();
  else
    -- your files, in your folder, within the limits (app_limits); the size is the stored file's real size
    new.size_bytes := public.workshop_check_upload(new.kind, new.file_path, new.thumb_path, new.size_bytes);
    new.status := 'pending'; new.reviewed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists wallpapers_before_insert on public.wallpapers;
create trigger wallpapers_before_insert before insert on public.wallpapers
  for each row execute function public.wallpapers_before_insert();

drop policy if exists "wallpapers: read approved, own, or all for admins" on public.wallpapers;
create policy "wallpapers: read approved, own, or all for admins" on public.wallpapers for select to anon, authenticated
  using (status = 'approved' or owner = (select auth.uid()) or public.is_admin((select auth.uid())));
drop policy if exists "wallpapers: signed-in users upload" on public.wallpapers;
create policy "wallpapers: signed-in users upload" on public.wallpapers for insert to authenticated
  with check ((select auth.uid()) is not null);
drop policy if exists "wallpapers: delete own or admin" on public.wallpapers;
create policy "wallpapers: delete own or admin" on public.wallpapers for delete to authenticated
  using (owner = (select auth.uid()) or public.is_admin((select auth.uid())));
-- no UPDATE policy: changes go through the functions below

-- Labels: the wallpaper's size (shown as 4K / 1440p / 1080p…) and whether it suits OLED screens (mostly true black,
-- no bright part that stays still). Measured in the browser when it's shared; admins can (re-)measure older ones.
alter table public.wallpapers add column if not exists width int check (width between 1 and 20000);
alter table public.wallpapers add column if not exists height int check (height between 1 and 20000);
alter table public.wallpapers add column if not exists oled boolean;
-- who to credit: shown on the card (required by some licences, like ESA/Webb's CC BY 4.0)
alter table public.wallpapers add column if not exists credit text check (char_length(credit) <= 300);
create or replace function public.label_wallpaper(wallpaper uuid, w int, h int, is_oled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admins only'; end if;
  update public.wallpapers set width = w, height = h, oled = is_oled where id = wallpaper;
end;
$$;
revoke execute on function public.label_wallpaper(uuid, int, int, boolean) from public, anon;
grant execute on function public.label_wallpaper(uuid, int, int, boolean) to authenticated;

-- Admin review: approve or reject.
create or replace function public.moderate_wallpaper(wallpaper uuid, new_status text, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admins only'; end if;
  if new_status not in ('approved', 'rejected', 'pending') then raise exception 'bad status'; end if;
  update public.wallpapers
     set status = new_status, reject_reason = case when new_status = 'rejected' then reason end,
         reviewed_at = now(), reports = case when new_status = 'approved' then 0 else reports end
   where id = wallpaper;
end;
$$;

-- Someone used a wallpaper (only counts approved ones).
create or replace function public.count_use(wallpaper uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare b bigint;
begin
  update public.wallpapers set uses = uses + 1 where id = wallpaper and status = 'approved' returning size_bytes into b;
  -- for the usage monitor: one download of that file today (an estimate of the bandwidth wallpapers use)
  if b is not null then
    insert into public.usage_daily (day, downloads, bytes) values (current_date, 1, b)
    on conflict (day) do update set downloads = public.usage_daily.downloads + 1, bytes = public.usage_daily.bytes + excluded.bytes;
  end if;
end;
$$;

-- ---------- likes ----------
create table if not exists public.likes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  wallpaper_id uuid not null references public.wallpapers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wallpaper_id)
);
alter table public.likes enable row level security;
drop policy if exists "likes: read own" on public.likes;
create policy "likes: read own" on public.likes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "likes: add own" on public.likes;
create policy "likes: add own" on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "likes: remove own" on public.likes;
create policy "likes: remove own" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.wallpapers set likes = likes + 1 where id = new.wallpaper_id;
  else
    update public.wallpapers set likes = greatest(likes - 1, 0) where id = old.wallpaper_id;
  end if;
  return null;
end;
$$;
drop trigger if exists likes_count on public.likes;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.likes_count();

-- ---------- reports ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  wallpaper_id uuid not null references public.wallpapers (id) on delete cascade,
  reporter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  unique (wallpaper_id, reporter)
);
alter table public.reports enable row level security;
drop policy if exists "reports: signed-in users report" on public.reports;
create policy "reports: signed-in users report" on public.reports for insert to authenticated
  with check (reporter = (select auth.uid()));
drop policy if exists "reports: admins read" on public.reports;
create policy "reports: admins read" on public.reports for select to authenticated
  using (public.is_admin((select auth.uid())));

-- 3 reports: hide it again (back to pending) until an admin re-reviews.
create or replace function public.reports_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.wallpapers
     set reports = reports + 1,
         status = case when reports + 1 >= 3 and status = 'approved' then 'pending' else status end
   where id = new.wallpaper_id;
  return null;
end;
$$;
drop trigger if exists reports_count on public.reports;
create trigger reports_count after insert on public.reports
  for each row execute function public.reports_count();

-- ---------- storage: wallpaper files ----------
-- Public bucket (files are served by URL); each user can only write into their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workshop', 'workshop', true, 52428800,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- (in a block of its own: if a project doesn't allow these from the SQL editor, the rest of this file still runs
-- and a notice says so; then add the two policies under Storage -> Policies instead)
do $$
begin
  drop policy if exists "workshop: upload to own folder" on storage.objects;
  create policy "workshop: upload to own folder" on storage.objects for insert to authenticated
    with check (bucket_id = 'workshop' and (storage.foldername(name))[1] = (select auth.uid())::text);
  drop policy if exists "workshop: delete own or admin" on storage.objects;
  create policy "workshop: delete own or admin" on storage.objects for delete to authenticated
    using (bucket_id = 'workshop' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin((select auth.uid()))));
exception when others then
  raise notice 'Storage policies not created (%). Add them in Storage -> Policies: insert into own folder, delete own.', sqlerrm;
end $$;

-- ---------- community looks ----------
-- A "look" is a whole setup (built-in wallpaper + candles, glow, chart styling, panels...) stored as settings,
-- never a file, so it's tiny. Same rules as wallpapers: anyone browses approved looks, signed-in users share,
-- shares wait for review (admins' are live at once), 3 reports hide one again, uses are counted without an account.
create table if not exists public.looks (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author text check (char_length(author) <= 40),
  title text not null check (char_length(title) between 1 and 40),
  skin text not null check (skin ~ '^[a-z0-9_-]{1,40}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 8000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  uses integer not null default 0,
  reports integer not null default 0,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists looks_status_created on public.looks (status, created_at desc);
create index if not exists looks_status_uses on public.looks (status, uses desc);
create index if not exists looks_owner on public.looks (owner);
alter table public.looks enable row level security;

create or replace function public.looks_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.owner := auth.uid();
  new.author := coalesce((select p.display_name from public.profiles p where p.id = auth.uid()), 'trader');
  new.uses := 0; new.reports := 0; new.reject_reason := null;
  if public.is_admin(auth.uid()) then new.status := 'approved'; new.reviewed_at := now();
  else new.status := 'pending'; new.reviewed_at := null; end if;
  return new;
end;
$$;
drop trigger if exists looks_before_insert on public.looks;
create trigger looks_before_insert before insert on public.looks
  for each row execute function public.looks_before_insert();

drop policy if exists "looks: read approved, own, or all for admins" on public.looks;
create policy "looks: read approved, own, or all for admins" on public.looks for select to anon, authenticated
  using (status = 'approved' or owner = (select auth.uid()) or public.is_admin((select auth.uid())));
drop policy if exists "looks: signed-in users share" on public.looks;
create policy "looks: signed-in users share" on public.looks for insert to authenticated
  with check ((select auth.uid()) is not null);
drop policy if exists "looks: delete own or admin" on public.looks;
create policy "looks: delete own or admin" on public.looks for delete to authenticated
  using (owner = (select auth.uid()) or public.is_admin((select auth.uid())));

create or replace function public.moderate_look(look uuid, new_status text, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admins only'; end if;
  if new_status not in ('approved', 'rejected', 'pending') then raise exception 'bad status'; end if;
  update public.looks
     set status = new_status, reject_reason = case when new_status = 'rejected' then reason end,
         reviewed_at = now(), reports = case when new_status = 'approved' then 0 else reports end
   where id = look;
end;
$$;

-- Update a look you shared (the same title, new settings): yours only. An admin's stays live; anyone else's goes
-- back to review, so an approved look can't be swapped for something else unseen. Returns the new status.
create or replace function public.update_my_look(look uuid, new_title text, new_skin text, new_data jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare st text;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if new_title is null or char_length(new_title) not between 1 and 40 then raise exception 'bad title'; end if;
  if new_skin !~ '^[a-z0-9_-]{1,40}$' then raise exception 'bad skin'; end if;
  if jsonb_typeof(new_data) <> 'object' or pg_column_size(new_data) > 8000 then raise exception 'bad data'; end if;
  st := case when public.is_admin(auth.uid()) then 'approved' else 'pending' end;
  update public.looks
     set title = new_title, skin = new_skin, data = new_data, status = st, reject_reason = null,
         reviewed_at = case when st = 'approved' then now() else null end
   where id = look and owner = auth.uid();
  if not found then raise exception 'not your look'; end if;
  return st;
end;
$$;
revoke all on function public.update_my_look(uuid, text, text, jsonb) from public, anon;
grant execute on function public.update_my_look(uuid, text, text, jsonb) to authenticated;

create or replace function public.count_look_use(look uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.looks set uses = uses + 1 where id = look and status = 'approved';
$$;

create table if not exists public.look_reports (
  id uuid primary key default gen_random_uuid(),
  look_id uuid not null references public.looks (id) on delete cascade,
  reporter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  unique (look_id, reporter)
);
alter table public.look_reports enable row level security;
drop policy if exists "look_reports: signed-in users report" on public.look_reports;
create policy "look_reports: signed-in users report" on public.look_reports for insert to authenticated
  with check (reporter = (select auth.uid()));
drop policy if exists "look_reports: admins read" on public.look_reports;
create policy "look_reports: admins read" on public.look_reports for select to authenticated
  using (public.is_admin((select auth.uid())));
create or replace function public.look_reports_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.looks
     set reports = reports + 1,
         status = case when reports + 1 >= 3 and status = 'approved' then 'pending' else status end
   where id = new.look_id;
  return null;
end;
$$;
drop trigger if exists look_reports_count on public.look_reports;
create trigger look_reports_count after insert on public.look_reports
  for each row execute function public.look_reports_count();

-- ---------- owners are admins ----------
-- Accounts that already exist with an owner email become admins now (new ones are handled on sign-up above).
insert into public.profiles (id, display_name, is_admin)
select u.id, split_part(u.email, '@', 1), true from auth.users u where lower(u.email) = any (public.owner_emails())
on conflict (id) do update set is_admin = true;
-- ...and only they are: any other account marked admin (a test account, say) stops being one when you re-run this.
update public.profiles p set is_admin = false
 where p.is_admin and not exists (select 1 from auth.users u where u.id = p.id and lower(u.email) = any (public.owner_emails()));

-- ---------- invites: Priism is invite only ----------
-- Every copy of Priism (extension, desktop, Android) needs an invite code before it draws anything. You (an admin)
-- make codes on the website's Workshop page under Invites; each code works on up to max_devices devices. Revoke a
-- code and those devices lock again at their next check. Nobody can read the codes except admins: Priism only asks
-- redeem_invite("is this code good for this device?") and gets back ok / invalid / revoked / full.
create table if not exists public.invites (
  code text primary key check (code ~ '^[A-Z0-9-]{8,40}$'),
  note text check (char_length(note) <= 80),
  max_devices int not null default 2 check (max_devices between 1 and 10000),
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
-- a group code (one code for a whole Discord, say) can have up to 10000 devices; databases set up before kept the old
-- limit of 50, so it's replaced here (safe to re-run)
alter table public.invites drop constraint if exists invites_max_devices_check;
alter table public.invites add constraint invites_max_devices_check check (max_devices between 1 and 10000);
alter table public.invites enable row level security;
drop policy if exists "invites: admins read" on public.invites;
create policy "invites: admins read" on public.invites for select to authenticated using (public.is_admin((select auth.uid())));
drop policy if exists "invites: admins create" on public.invites;
create policy "invites: admins create" on public.invites for insert to authenticated with check (public.is_admin((select auth.uid())));
drop policy if exists "invites: admins change" on public.invites;
create policy "invites: admins change" on public.invites for update to authenticated using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
drop policy if exists "invites: admins delete" on public.invites;
create policy "invites: admins delete" on public.invites for delete to authenticated using (public.is_admin((select auth.uid())));

create table if not exists public.invite_devices (
  code text not null references public.invites (code) on delete cascade,
  device text not null check (device ~ '^[A-Za-z0-9-]{8,64}$'),
  app text check (char_length(app) <= 20),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (code, device)
);
alter table public.invite_devices enable row level security;
drop policy if exists "invite devices: admins read" on public.invite_devices;
create policy "invite devices: admins read" on public.invite_devices for select to authenticated using (public.is_admin((select auth.uid())));
drop policy if exists "invite devices: admins remove" on public.invite_devices;
create policy "invite devices: admins remove" on public.invite_devices for delete to authenticated using (public.is_admin((select auth.uid())));

-- is this code good for this device? 'ok' | 'invalid' | 'revoked' | 'full'  (a device already on the code stays ok)
create or replace function public.redeem_invite(p_code text, p_device text, p_app text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare inv public.invites; n int; c text := upper(trim(coalesce(p_code, '')));
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{8,64}$' then return 'invalid'; end if;
  select * into inv from public.invites where code = c;
  if not found then return 'invalid'; end if;
  if inv.revoked then return 'revoked'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then return 'expired'; end if;
  if inv.requires_account then return 'account'; end if;     -- a beta code: added to an account on the website, not here
  update public.invite_devices set last_seen = now() where code = c and device = p_device;
  if found then return 'ok'; end if;
  select count(*) into n from public.invite_devices where code = c;
  if n >= inv.max_devices then return 'full'; end if;
  insert into public.invite_devices (code, device, app) values (c, p_device, left(p_app, 20));
  return 'ok';
end;
$$;
revoke execute on function public.redeem_invite(text, text, text) from public;
grant execute on function public.redeem_invite(text, text, text) to anon, authenticated;

-- ---------- beta access tied to accounts ----------
-- A beta code (requires_account) is added to ONE person's account on the website (claim_invite) and ends on
-- expires_at. Their copy of Priism is then linked to that account with a short link code the website shows
-- (create_link_code: 10 minutes, once). The copy keeps a random device secret that only the server can check (stored
-- as a SHA-256 hash, never readable). An account has up to max_devices copies (1 for the beta); a new copy replaces
-- the old one at most once every 7 days, and the owner can reset any account. Older codes without requires_account
-- keep working per device, as before. Nothing about anyone's charts is involved.
alter table public.invites add column if not exists expires_at timestamptz;
alter table public.invites add column if not exists requires_account boolean not null default false;
alter table public.invites add column if not exists claimed_by uuid references auth.users (id) on delete set null;
alter table public.invites add column if not exists claimed_at timestamptz;
alter table public.invites alter column max_devices set default 1;
create index if not exists invites_claimed_by on public.invites (claimed_by);

create table if not exists public.account_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  device text not null check (device ~ '^[A-Za-z0-9-]{8,64}$'),
  app text check (char_length(app) <= 20),
  secret_hash text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  linked_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  active boolean not null default true,
  primary key (user_id, device)
);
create index if not exists account_devices_device on public.account_devices (device);
alter table public.account_devices enable row level security;   -- no policies: only through the functions below

create table if not exists public.account_moves (user_id uuid primary key references auth.users (id) on delete cascade, last_move timestamptz);
alter table public.account_moves enable row level security;

create table if not exists public.link_codes (
  code text primary key check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '10 minutes',
  used boolean not null default false
);
alter table public.link_codes enable row level security;

-- what an account may use now: status ok | none | expired | revoked, until (null = no end), max_devices
create or replace function public.account_access(p_uid uuid, out status text, out until timestamptz, out max_devices integer)
language plpgsql stable security definer set search_path = ''
as $$
declare n integer; has_open boolean; mx timestamptz; md integer;
begin
  if p_uid is null then status := 'none'; return; end if;
  if public.is_admin(p_uid) then status := 'ok'; until := null; max_devices := 5; return; end if;
  select count(*), coalesce(bool_or(i.expires_at is null), false), max(i.expires_at), max(i.max_devices) into n, has_open, mx, md
  from public.invites i where i.claimed_by = p_uid and not i.revoked and (i.expires_at is null or i.expires_at > now());
  if n > 0 then status := 'ok'; until := case when has_open then null else mx end; max_devices := md; return; end if;
  max_devices := 0;
  if exists (select 1 from public.invites i where i.claimed_by = p_uid and not i.revoked) then
    status := 'expired'; select max(i.expires_at) into until from public.invites i where i.claimed_by = p_uid and not i.revoked; return; end if;
  status := case when exists (select 1 from public.invites i where i.claimed_by = p_uid) then 'revoked' else 'none' end;
end;
$$;
revoke execute on function public.account_access(uuid) from public, anon, authenticated;

-- add a code to your account (website, signed in): ok | invalid | revoked | expired | taken (someone else's)
create or replace function public.claim_invite(p_code text)
returns text language plpgsql security definer set search_path = ''
as $$
declare inv public.invites; c text := upper(trim(coalesce(p_code, '')));
begin
  if (select auth.uid()) is null then return 'invalid'; end if;
  select * into inv from public.invites where code = c for update;
  if not found then return 'invalid'; end if;
  if inv.revoked then return 'revoked'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then return 'expired'; end if;
  if inv.claimed_by is null then update public.invites set claimed_by = (select auth.uid()), claimed_at = now() where code = c; return 'ok'; end if;
  return case when inv.claimed_by = (select auth.uid()) then 'ok' else 'taken' end;
end;
$$;
revoke execute on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;

-- a one-time link code for connecting a copy of Priism to your account (shown on the website, good for 10 minutes)
create or replace function public.create_link_code()
returns text language plpgsql volatile security definer set search_path = ''
as $$
declare A constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; c text; i integer;
begin
  if (select auth.uid()) is null then raise exception 'access: sign in first'; end if;
  if (public.account_access((select auth.uid()))).status <> 'ok' then raise exception 'access: this account has no active beta access'; end if;
  delete from public.link_codes where user_id = (select auth.uid()) or expires_at < now();
  loop
    b := decode(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'hex'); c := '';
    for i in 0..7 loop c := c || substr(A, (get_byte(b, i) % 32) + 1, 1); if i = 3 then c := c || '-'; end if; end loop;
    exit when not exists (select 1 from public.link_codes where code = c);
  end loop;
  insert into public.link_codes (code, user_id) values (c, (select auth.uid()));
  return c;
end;
$$;
revoke execute on function public.create_link_code() from public, anon;
grant execute on function public.create_link_code() to authenticated;

-- a copy of Priism enters a link code: it joins that account (status ok, until) or gets why not
-- (invalid | none | expired | revoked | full with next = when a move is allowed again)
create or replace function public.link_device(p_link text, p_device text, p_secret text, p_app text default null)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare lc public.link_codes; acc record; n integer; lm timestamptz; h text;
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{8,64}$' or p_secret is null or p_secret !~ '^[A-Za-z0-9_-]{32,128}$' then return jsonb_build_object('status', 'invalid'); end if;
  select * into lc from public.link_codes where code = upper(trim(coalesce(p_link, ''))) for update;
  if not found or lc.used or lc.expires_at < now() then return jsonb_build_object('status', 'invalid'); end if;
  select * into acc from public.account_access(lc.user_id);
  if acc.status <> 'ok' then return jsonb_build_object('status', acc.status); end if;
  -- copies used on this account in the last 7 days (still linked, or replaced / removed recently), other than this one
  select count(*) into n from public.account_devices d where d.user_id = lc.user_id and d.device <> p_device and (d.active or d.last_seen > now() - interval '7 days');
  if n >= acc.max_devices and not exists (select 1 from public.account_devices d where d.user_id = lc.user_id and d.device = p_device and d.active) then
    select m.last_move into lm from public.account_moves m where m.user_id = lc.user_id;
    if lm is not null and lm > now() - interval '7 days' then return jsonb_build_object('status', 'full', 'next', lm + interval '7 days'); end if;
    update public.account_devices set active = false where user_id = lc.user_id and device <> p_device;   -- the old copy stops at its next check
    insert into public.account_moves (user_id, last_move) values (lc.user_id, now()) on conflict (user_id) do update set last_move = now();
  end if;
  h := encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
  update public.account_devices set active = false where device = p_device and user_id <> lc.user_id;   -- one account per copy
  insert into public.account_devices (user_id, device, app, secret_hash) values (lc.user_id, p_device, left(p_app, 20), h)
  on conflict (user_id, device) do update set secret_hash = excluded.secret_hash, active = true, last_seen = now(), app = excluded.app;
  update public.link_codes set used = true where code = lc.code;
  return jsonb_build_object('status', 'ok', 'until', acc.until);
end;
$$;
revoke execute on function public.link_device(text, text, text, text) from public;
grant execute on function public.link_device(text, text, text, text) to anon, authenticated;

-- a linked copy checks in (daily): ok | expired | revoked | none | moved (another copy took its place) | invalid
create or replace function public.device_check(p_device text, p_secret text)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare d public.account_devices; acc record;
begin
  if p_device is null or p_secret is null then return jsonb_build_object('status', 'invalid'); end if;
  select * into d from public.account_devices where device = p_device and secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')
    order by active desc, last_seen desc limit 1;
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if not d.active then return jsonb_build_object('status', 'moved'); end if;
  update public.account_devices set last_seen = now() where user_id = d.user_id and device = d.device;
  select * into acc from public.account_access(d.user_id);
  return jsonb_build_object('status', acc.status, 'until', acc.until);
end;
$$;
revoke execute on function public.device_check(text, text) from public;
grant execute on function public.device_check(text, text) to anon, authenticated;

-- "Sign out on this device": the copy leaves its account (the 7-day rule still counts it, so it can't be passed around)
create or replace function public.unlink_device(p_device text, p_secret text)
returns text language plpgsql volatile security definer set search_path = ''
as $$
begin
  update public.account_devices set active = false, last_seen = now()
  where device = p_device and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'UTF8')), 'hex');
  return 'ok';
end;
$$;
revoke execute on function public.unlink_device(text, text) from public;
grant execute on function public.unlink_device(text, text) to anon, authenticated;

-- your access, codes and linked copies (website › Account)
create or replace function public.my_access()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare acc record; me uuid := (select auth.uid()); lm timestamptz;
begin
  if me is null then raise exception 'sign in first'; end if;
  select * into acc from public.account_access(me);
  select m.last_move into lm from public.account_moves m where m.user_id = me;
  return jsonb_build_object('status', acc.status, 'until', acc.until, 'max_devices', acc.max_devices,
    'next_move', case when lm is not null and lm > now() - interval '7 days' then lm + interval '7 days' end,
    'codes', (select coalesce(jsonb_agg(jsonb_build_object('code', i.code, 'expires_at', i.expires_at, 'revoked', i.revoked) order by i.claimed_at), '[]'::jsonb) from public.invites i where i.claimed_by = me),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('device', right(d.device, 6), 'app', d.app, 'linked_at', d.linked_at, 'last_seen', d.last_seen, 'active', d.active) order by d.linked_at desc), '[]'::jsonb)
                from public.account_devices d where d.user_id = me));
end;
$$;
revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- the owner: who has which code, their copies, and a reset (all copies removed, the 7-day rule cleared)
create or replace function public.admin_accounts()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'admins only'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('code', i.code, 'user_id', i.claimed_by, 'email', u.email, 'claimed_at', i.claimed_at,
      'devices', (select count(*) from public.account_devices d where d.user_id = i.claimed_by and d.active),
      'last_seen', (select max(d.last_seen) from public.account_devices d where d.user_id = i.claimed_by),
      'next_move', (select case when m.last_move > now() - interval '7 days' then m.last_move + interval '7 days' end from public.account_moves m where m.user_id = i.claimed_by))), '[]'::jsonb)
    from public.invites i join auth.users u on u.id = i.claimed_by);
end;
$$;
revoke execute on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;
create or replace function public.admin_reset_account(p_user uuid)
returns text language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'admins only'; end if;
  delete from public.account_devices where user_id = p_user;
  delete from public.account_moves where user_id = p_user;
  delete from public.link_codes where user_id = p_user;
  return 'ok';
end;
$$;
revoke execute on function public.admin_reset_account(uuid) from public, anon;
grant execute on function public.admin_reset_account(uuid) to authenticated;

-- ---------- bug reports ----------
-- Sent from the Priism panel (Settings › Report a bug). Only the owner / admins can read them (website › Workshop ›
-- Bug reports). Sending goes through report_bug() only: a copy of Priism that has redeemed an invite, at most 5 an
-- hour from one device, short text only. Nothing about the person's account or charts is included.
create table if not exists public.bug_reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device text not null,
  message text not null check (char_length(message) between 3 and 2000),
  contact text check (contact is null or char_length(contact) <= 120),
  info jsonb not null default '{}'::jsonb check (pg_column_size(info) <= 4000),
  done boolean not null default false
);
create index if not exists bug_reports_created on public.bug_reports (created_at desc);
alter table public.bug_reports enable row level security;
drop policy if exists "bug reports: admins read" on public.bug_reports;
create policy "bug reports: admins read" on public.bug_reports for select to authenticated using (public.is_admin((select auth.uid())));
drop policy if exists "bug reports: admins mark done" on public.bug_reports;
create policy "bug reports: admins mark done" on public.bug_reports for update to authenticated using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
drop policy if exists "bug reports: admins delete" on public.bug_reports;
create policy "bug reports: admins delete" on public.bug_reports for delete to authenticated using (public.is_admin((select auth.uid())));

-- 'ok' | 'invalid' (no invite on this device, or the text is empty / too long) | 'slow' (too many in the last hour)
create or replace function public.report_bug(p_message text, p_contact text, p_info jsonb, p_device text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare msg text := trim(coalesce(p_message, '')); n int;
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{8,64}$' then return 'invalid'; end if;
  if not exists (select 1 from public.invite_devices d join public.invites i on i.code = d.code where d.device = p_device and not i.revoked)
     and not exists (select 1 from public.account_devices a where a.device = p_device and a.active and (public.account_access(a.user_id)).status = 'ok') then return 'invalid'; end if;
  if char_length(msg) < 3 or char_length(msg) > 2000 then return 'invalid'; end if;
  select count(*) into n from public.bug_reports where device = p_device and created_at > now() - interval '1 hour';
  if n >= 5 then return 'slow'; end if;
  insert into public.bug_reports (device, message, contact, info)
  values (p_device, msg, nullif(left(trim(coalesce(p_contact, '')), 120), ''),
          case when p_info is null or jsonb_typeof(p_info) <> 'object' or pg_column_size(p_info) > 4000 then '{}'::jsonb else p_info end);
  return 'ok';
end;
$$;
revoke execute on function public.report_bug(text, text, jsonb, text) from public;
grant execute on function public.report_bug(text, text, jsonb, text) to anon, authenticated;

-- =====================================================================================================================
-- ---------- free-tier limits, upload quotas and usage (keeps the beta inside Supabase's Free plan) ----------
-- One row of limits the owner can change any time (Workshop page › Usage, or here). Uploads are refused with a clear
-- message once a limit is reached, so storage can't run past the plan's quota and pause the Workshop for everyone.
-- The free_* columns are just the plan's quotas, for the usage monitor's bars (update them if the plan changes).
create table if not exists public.app_limits (
  id smallint primary key default 1 check (id = 1),
  max_uploads_per_user integer not null default 15 check (max_uploads_per_user between 0 and 1000),
  max_bytes_per_user bigint not null default 62914560 check (max_bytes_per_user between 0 and 53687091200),         -- 60 MB
  max_image_bytes bigint not null default 20971520 check (max_image_bytes between 1 and 52428800),                  -- 20 MB
  max_video_bytes bigint not null default 31457280 check (max_video_bytes between 1 and 52428800),                  -- 30 MB
  max_image_px integer not null default 3840 check (max_image_px between 640 and 16384),                            -- longest side kept
  max_total_bytes bigint not null default 943718400 check (max_total_bytes between 0 and 1099511627776),            -- 900 MB, under the 1 GB quota
  free_storage_bytes bigint not null default 1073741824,     -- Free plan: 1 GB file storage
  free_db_bytes bigint not null default 524288000,           -- Free plan: 500 MB database
  free_egress_bytes bigint not null default 10737418240,     -- Free plan: 5 GB uncached + 5 GB cached egress a month
  updated_at timestamptz not null default now()
);
insert into public.app_limits (id) values (1) on conflict (id) do nothing;
alter table public.app_limits enable row level security;
drop policy if exists "app_limits: anyone reads" on public.app_limits;
create policy "app_limits: anyone reads" on public.app_limits for select to anon, authenticated using (true);
drop policy if exists "app_limits: admins change" on public.app_limits;
create policy "app_limits: admins change" on public.app_limits for update to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
revoke insert, delete on public.app_limits from anon, authenticated;

-- a user's files in the Workshop bucket (count and bytes, from Storage's own records: never what the browser says)
create or replace function public.workshop_folder_usage(p_uid uuid, out files integer, out bytes bigint)
language sql stable security definer set search_path = ''
as $$
  select count(*)::integer, coalesce(sum(nullif(o.metadata->>'size', '')::bigint), 0)::bigint
  from storage.objects o where o.bucket_id = 'workshop' and (storage.foldername(o.name))[1] = p_uid::text;
$$;
create or replace function public.workshop_total_bytes()
returns bigint language sql stable security definer set search_path = ''
as $$ select coalesce(sum(nullif(o.metadata->>'size', '')::bigint), 0)::bigint from storage.objects o where o.bucket_id = 'workshop'; $$;
revoke execute on function public.workshop_folder_usage(uuid) from public, anon, authenticated;
revoke execute on function public.workshop_total_bytes() from public, anon, authenticated;

-- may the signed-in user store another file? (Storage checks this before every upload; admins aren't limited)
create or replace function public.workshop_can_upload()
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare L public.app_limits; u record;
begin
  if (select auth.uid()) is null then return false; end if;
  if public.is_admin((select auth.uid())) then return true; end if;
  select * into L from public.app_limits where id = 1;
  select * into u from public.workshop_folder_usage((select auth.uid()));
  -- each wallpaper is a file and its thumbnail; one extra pair of room for an upload that's being replaced
  return u.files < 2 * L.max_uploads_per_user + 2 and u.bytes < L.max_bytes_per_user and public.workshop_total_bytes() < L.max_total_bytes;
end;
$$;
grant execute on function public.workshop_can_upload() to authenticated;

-- on sharing a wallpaper (from wallpapers_before_insert, signed-in non-admins): the file and its thumbnail must be
-- yours and already stored; the size recorded is the stored file's; then the limits. Returns the real size.
create or replace function public.workshop_check_upload(p_kind text, p_file text, p_thumb text, p_claimed bigint)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare L public.app_limits; me text := (select auth.uid())::text; sz bigint; n integer; u record;
begin
  select * into L from public.app_limits where id = 1;
  if p_file is null or (storage.foldername(p_file))[1] is distinct from me then raise exception 'quota: the file must be in your own folder'; end if;
  if p_thumb is not null and (storage.foldername(p_thumb))[1] is distinct from me then raise exception 'quota: the thumbnail must be in your own folder'; end if;
  select nullif(o.metadata->>'size', '')::bigint into sz from storage.objects o where o.bucket_id = 'workshop' and o.name = p_file;
  if not found then raise exception 'quota: upload the file first'; end if;
  sz := coalesce(sz, p_claimed);   -- (Storage always records the size; this is only for a project set up without it)
  if p_kind = 'image' and sz > L.max_image_bytes then raise exception 'quota: images can be up to % MB', round(L.max_image_bytes / 1048576.0); end if;
  if p_kind = 'video' and sz > L.max_video_bytes then raise exception 'quota: videos can be up to % MB', round(L.max_video_bytes / 1048576.0); end if;
  select count(*) into n from public.wallpapers w where w.owner = (select auth.uid());
  if n >= L.max_uploads_per_user then raise exception 'quota: you can share up to % wallpapers (delete one to share another)', L.max_uploads_per_user; end if;
  select * into u from public.workshop_folder_usage((select auth.uid()));
  if u.bytes > L.max_bytes_per_user then raise exception 'quota: your wallpapers can use up to % MB in total', round(L.max_bytes_per_user / 1048576.0); end if;
  if public.workshop_total_bytes() > L.max_total_bytes then raise exception 'quota: the Workshop is full for now (the owner has been told)'; end if;
  return sz;
end;
$$;
revoke execute on function public.workshop_check_upload(text, text, text, bigint) from public, anon, authenticated;

-- Storage: uploads into your own folder, and only while you're within the limits (replaces the policy above)
do $$
begin
  drop policy if exists "workshop: upload to own folder" on storage.objects;
  create policy "workshop: upload to own folder" on storage.objects for insert to authenticated
    with check (bucket_id = 'workshop' and (storage.foldername(name))[1] = (select auth.uid())::text and public.workshop_can_upload());
exception when others then
  raise notice 'Storage upload policy not updated (%). In Storage -> Policies, add "and public.workshop_can_upload()" to the upload policy.', sqlerrm;
end;
$$;

-- downloads per day (count_use adds each one): an estimate of the bandwidth wallpapers use, for the usage monitor
create table if not exists public.usage_daily (
  day date primary key,
  downloads integer not null default 0,
  bytes bigint not null default 0
);
alter table public.usage_daily enable row level security;   -- no policies: only the functions here read or write it

-- your own usage and limits (the Workshop page shows "3 of 15 · 12 of 60 MB")
create or replace function public.my_workshop_usage()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare L public.app_limits; u record; n integer;
begin
  if (select auth.uid()) is null then raise exception 'sign in first'; end if;
  select * into L from public.app_limits where id = 1;
  select * into u from public.workshop_folder_usage((select auth.uid()));
  select count(*) into n from public.wallpapers w where w.owner = (select auth.uid());
  return jsonb_build_object('uploads', n, 'max_uploads', L.max_uploads_per_user, 'bytes', u.bytes, 'max_bytes', L.max_bytes_per_user,
    'max_image_bytes', L.max_image_bytes, 'max_video_bytes', L.max_video_bytes, 'max_image_px', L.max_image_px,
    'unlimited', public.is_admin((select auth.uid())));
end;
$$;
revoke execute on function public.my_workshop_usage() from public, anon;
grant execute on function public.my_workshop_usage() to authenticated;

-- the owner's usage monitor: storage, database, estimated download bandwidth this month, top uploaders, and files
-- with no wallpaper (an upload that didn't finish) older than a day, which can be cleaned up
create or replace function public.workshop_usage()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare L public.app_limits; r jsonb;
begin
  if not public.is_admin((select auth.uid())) then raise exception 'admins only'; end if;
  select * into L from public.app_limits where id = 1;
  select jsonb_build_object(
    'limits', to_jsonb(L),
    'storage_bytes', (select coalesce(sum(nullif(o.metadata->>'size', '')::bigint), 0) from storage.objects o),
    'workshop_bytes', public.workshop_total_bytes(),
    'objects', (select count(*) from storage.objects o where o.bucket_id = 'workshop'),
    'db_bytes', pg_database_size(current_database()),
    'wallpapers', (select count(*) from public.wallpapers),
    'pending', (select count(*) from public.wallpapers where status = 'pending'),
    'uploaders', (select count(distinct owner) from public.wallpapers),
    'month_downloads', (select coalesce(sum(downloads), 0) from public.usage_daily where day >= date_trunc('month', current_date)),
    'month_bytes', (select coalesce(sum(bytes), 0) from public.usage_daily where day >= date_trunc('month', current_date)),
    'last30', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'downloads', downloads, 'bytes', bytes) order by day), '[]'::jsonb)
               from public.usage_daily where day > current_date - 30),
    'top', (select coalesce(jsonb_agg(t order by t.bytes desc), '[]'::jsonb) from (
              select (storage.foldername(o.name))[1] as owner, p.display_name as name, count(*) as files,
                     coalesce(sum(nullif(o.metadata->>'size', '')::bigint), 0) as bytes
              from storage.objects o left join public.profiles p on p.id::text = (storage.foldername(o.name))[1]
              where o.bucket_id = 'workshop' group by 1, 2 order by 4 desc limit 10) t),
    'orphans', (select coalesce(jsonb_agg(jsonb_build_object('path', o.name, 'bytes', coalesce(nullif(o.metadata->>'size', '')::bigint, 0))), '[]'::jsonb)
                from (select o.name, o.metadata from storage.objects o
                      where o.bucket_id = 'workshop' and o.created_at < now() - interval '1 day'
                        and not exists (select 1 from public.wallpapers w where w.file_path = o.name or w.thumb_path = o.name)
                      limit 200) o)
  ) into r;
  return r;
end;
$$;
revoke execute on function public.workshop_usage() from public, anon;
grant execute on function public.workshop_usage() to authenticated;
