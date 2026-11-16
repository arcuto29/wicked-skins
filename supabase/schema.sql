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
language sql
security definer
set search_path = ''
as $$
  update public.wallpapers set uses = uses + 1 where id = wallpaper and status = 'approved';
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
