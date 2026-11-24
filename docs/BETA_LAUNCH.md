# Beta launch runbook (owner steps)

Do these in order. Every step can be undone. Nothing here turns on billing, so the project stays on the **Free** plan
($0). Code steps (merging, releasing) only happen after you approve them.

Project: `tsazewpipzgfwgcepcsb` · Website: https://arcuto29.github.io/wicked-skins/

## 0. Before you start
- **Plan:** Dashboard › Organization › Billing should say **Free**. Don't add a card or turn off the spend cap. On
  Free, going over a quota restricts the service and is never billed.
- **API keys:** Settings › API Keys. **Keep the legacy `anon` key active.** Every copy of Priism already installed
  uses it. Moving to the new publishable key comes in a later release; don't deactivate legacy keys before then.
- **Signing key:** the private pass key was generated in the Kiro sandbox, outside the repo, and was never committed
  or packaged (scanned Nov 2026). It's still safest to make your own before going live:
  `node supabase/functions/licence/newkeys.mjs` on your computer, outside the repo folder. It writes the new
  private key to `PRIVATE-priism-pass-key.json` (keep it in your password manager) and prints the public key
  (send it to Kiro to put in `src/pass.js` › `PUBLIC_JWK`). Then delete
  `/projects/sandbox/PRIVATE-priism-pass-key.json`.

## 1. Database (SQL Editor)
1. SQL Editor › New query › paste all of `supabase/schema.sql` from `main` (after the PRs are merged) › **Run**.
   It's safe to run again: it only adds what's missing and keeps your data.
2. If a notice says the Storage policy wasn't updated, do it by hand: Storage › Policies › `workshop` › the upload
   policy › add `and public.workshop_can_upload()` to its check.
3. Check: `select public.redeem_invite('NOPE-NOPE-NOPE', 'test-device-1');` returns `invalid`.

## 2. Sign-in (Authentication)
- Authentication › Providers › **Google**: on. You need a Google Cloud OAuth client: Web, with the redirect URL
  Supabase shows you. Testers then sign in without email confirmation.
- Authentication › URL Configuration › Site URL: `https://arcuto29.github.io/wicked-skins/`. Add
  `https://arcuto29.github.io/wicked-skins/workshop.html` to the redirect URLs.
- Email and password sign-up also works, but Supabase's built-in email only reaches your own team. Testers would
  need Google, or a custom SMTP (Resend free, or a Gmail app password) under Authentication › Emails › SMTP.

## 3. Licence function (needs the Supabase CLI on your computer)
```sh
npm i -g supabase && supabase login
supabase link --project-ref tsazewpipzgfwgcepcsb
supabase secrets set PASS_PRIVATE_JWK="$(cat path/to/your-private-key.json)"   # required
supabase secrets set WHOP_API_KEY='…'  WHOP_PRODUCT_IDS='prod_…'              # only when you sell Pro (not for the beta)
supabase functions deploy licence
```
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are given to the function by Supabase. Never set the `service_role` key
  anywhere: the function doesn't need it.
- Keep JWT verification on (the default). Priism sends the legacy anon key, which passes it.
- Check (should print `{"status":"invalid"}`):
  ```sh
  curl -s -X POST https://tsazewpipzgfwgcepcsb.supabase.co/functions/v1/licence \
    -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>" -H "Content-Type: application/json" \
    -d '{"key":"NOPE-NOPE-NOPE","device":"test-device-1"}'
  ```
- Then tell Kiro it's live. The release with `LICENCE_LIVE = true` is tested against the live function first, and
  `PASS_REQUIRED = true` comes only after a real signed pass has been seen working on your own device.

## 4. Testers (website, signed in as the owner)
Invites › For one person: "Beta: needs an account" on, 1 device, 21 days › **Make a code**. Send each tester their
code and these three steps:
1. Sign in at the website › **Beta access** › add your code.
2. Press **Get a link code**.
3. Type it in the Priism panel within 10 minutes.

## 5. Watching it (weekly)
- Website › **Usage** (owner): storage against the 900 MB cap, database size, estimated downloads.
- Dashboard › Usage: the real egress (Free: 5 GB uncached + 5 GB cached a month). The website's figure is an
  estimate from "Use" clicks only.
- The keep-alive workflow (`.github/workflows/keepalive.yml`) stops Free from pausing the project after 7 quiet
  days. Check it's green under GitHub › Actions.

## Undo
- A tester: **Turn off** (locks within a day) or **Reset devices**.
- The licence function: `supabase functions delete licence`. Priism falls back to the database check while
  `LICENCE_LIVE` is false.
- `schema.sql` only adds things. Removing a beta table isn't needed to roll back the app.
