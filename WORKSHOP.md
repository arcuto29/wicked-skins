# Workshop setup (about 10 minutes)

## 1. Supabase project
1. Create a free project at https://supabase.com (pick a region near your users).
2. **SQL Editor → New query →** paste `supabase/schema.sql` → **Run**. This creates the tables, rules and file bucket.
3. **Project Settings → API:** copy the **Project URL** and the **anon public** key into
   - `src/workshop-config.js` (`url`, `anonKey`)
   - `site/site-config.js` (`supabaseUrl`, `supabaseAnonKey`)
   The anon key is public by design; the rules in `schema.sql` decide what it can do.

## 2. Sign-in (website only)
Accounts and uploading live on the **website** (`site/workshop.html`). The extension never asks anyone to log in —
it only browses and uses approved wallpapers. That keeps the extension simple and avoids email limits in a popup.

**Email + password:** on by default (Authentication → Providers → Email). To let people sign in right after creating
an account, turn off "Confirm email"; otherwise they confirm via the email link first.
"Forgot password" emails a reset link that opens `site/reset.html`. Note: Supabase's built-in email sender only allows
a few emails per hour — for a real launch, add custom SMTP (e.g. Resend) under **Authentication → Emails → SMTP Settings**.

**Google:**
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → *Web application*.
   Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Google** → paste the Client ID + Secret → enable.
3. Supabase → Authentication → URL Configuration → **Redirect URLs** → add your website URL
   (e.g. `https://arcuto29.github.io/wicked-skins/**`), where Google returns after sign-in.

## 3. Make yourself admin
Sign in once on the **website** (Workshop → Share), then in the SQL Editor run, with your email:
```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```
Now your uploads go live immediately, and **Workshop → Review** shows everyone else's for you to approve or reject.

## Community looks (added in 0.1.27)
Re-run `supabase/schema.sql` once (SQL Editor -> paste -> Run). It's safe to re-run and adds the `looks` table and
its rules. Looks are settings only (no files), shared from the extension via **Workshop -> Share my current look**
(the website signs you in and posts it). Approve them on the website under **Review** (admins only).

## How it works
- **Extension:** browse approved wallpapers and tap **Use** — no account, ever. "Use" downloads the file into Uploads
  and puts it on the chart. A **Submit on the website** link opens the site for sharing.
- **Website:** sign in to **share** (max 50 MB; MP4, WebM, PNG, JPG, WebP, GIF, AVIF). Anyone can browse there too.
- Uploads wait for admin review; an admin's own uploads are approved automatically.
- 3 reports hide a wallpaper until an admin reviews it again.
- All of this is enforced in the database (`supabase/schema.sql`), verified by 27 tests.

## Costs
Free tier is fine to start. Videos use bandwidth: when the Workshop gets popular, expect the Pro plan (~$25/month)
or move files to cheaper storage.
