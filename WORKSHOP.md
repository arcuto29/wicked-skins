# Workshop setup (about 10 minutes)

## 1. Supabase project
1. Create a free project at https://supabase.com (pick a region near your users).
2. **SQL Editor → New query →** paste `supabase/schema.sql` → **Run**. This creates the tables, rules and file bucket.
3. **Project Settings → API:** copy the **Project URL** and the **anon public** key into
   - `src/workshop-config.js` (`url`, `anonKey`)
   - `site/site-config.js` (`supabaseUrl`, `supabaseAnonKey`)
   The anon key is public by design; the rules in `schema.sql` decide what it can do.

## 2. Sign-in
**Email + password:** on by default (Authentication → Providers → Email). To let people sign in right after creating
an account, turn off "Confirm email"; otherwise they confirm via the email link first.
For "Forgot password → email me a code", edit **Authentication → Email Templates → Magic Link** so it includes `{{ .Token }}`.

**Google:**
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → *Web application*.
   Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Google** → paste the Client ID + Secret → enable.
3. Supabase → Authentication → URL Configuration → **Redirect URLs** → add `https://*.chromiumapp.org/**`
   (that's where Chrome returns from Google sign-in for extensions).

## 3. Make yourself admin
Sign in once from the extension (Workshop tab), then in the SQL Editor run, with your email:
```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```
Now your uploads go live immediately, and **Workshop → Review** shows everyone else's for you to approve or reject.

## How it works
- Anyone can browse approved wallpapers (extension + website), no account needed.
- Signed-in users can share (max 50 MB; MP4, WebM, PNG, JPG, WebP, GIF, AVIF), like and report.
- Uploads wait for your review; yours are approved automatically.
- 3 reports hide a wallpaper until you review it again.
- All of this is enforced in the database (`supabase/schema.sql`), verified by 27 tests.

## Costs
Free tier is fine to start. Videos use bandwidth: when the Workshop gets popular, expect the Pro plan (~$25/month)
or move files to cheaper storage.
