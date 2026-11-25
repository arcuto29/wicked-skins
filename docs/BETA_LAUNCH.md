# Launch guide: Supabase, Whop and the Chrome Web Store (owner steps)

This is the one guide for everything you do by hand. It assumes you have never used a terminal or a database dashboard.
Do the parts in order. Each step says **what you should see**, so you know it worked, and every step can be undone
(last section).

**Nothing here costs money, and nothing is charged automatically.** The beta uses no payment system at all. Code
changes (merging, releasing, publishing) only happen after you tell Kiro to go ahead.

Project: `tsazewpipzgfwgcepcsb` · Website: https://arcuto29.github.io/wicked-skins/

## How it fits together (read once)

| Piece | What it does | Where it lives |
|---|---|---|
| **Supabase database** | The truth about who has access: beta codes, accounts, linked devices, end dates. Also counts wrong guesses. | `supabase/schema.sql` |
| **Licence function** | Answers "is this copy allowed?" with a **signed pass** that only works on that one device. Holds the private signing key and the Whop key. | `supabase/functions/licence` |
| **The extension / desktop / Android app** | Checks the pass with the public key. Editing saved settings can't create a pass. Asks again once a day. | `src/pass.js`, `src/invite.js` |
| **The website's Workshop page** (signed in as you) | Your **owner dashboard**: make codes, set end dates, reset devices, turn people off, see beta spots. | `site/workshop.html` |
| **Whop** | Only for selling Pro later. Beta testers never touch it. | whop.com |
| **Chrome Web Store** | Delivers the extension and its automatic updates. | Developer dashboard |

**Your own access.** You never buy anything. The database makes any account signed in with an address listed in
`owner_emails()` (in `schema.sql`; now `arcuto2978@gmail.com`) an admin, and an admin always has access with no end
date. You link your devices exactly like a tester (website › Beta access › **Get a link code**), so the decision is made
by the server, not by anything in the app that someone could edit. The address must be a **confirmed** one: someone
signing up with your address without confirming it gets nothing.

**What is and isn't protected today.** The app currently has `PASS_REQUIRED = false` and `LICENCE_LIVE = false`
in `src/pass.js`, because the licence function isn't deployed yet. Until you deploy it and Kiro switches them on
(Part 7), a person who edits their own browser storage by hand can still give themselves Pro. After Part 7 they can't:
the app only believes a signed pass, and a pass is only made by the server. CI refuses a build where
`PASS_REQUIRED` is on without `LICENCE_LIVE`, which would lock everyone out.

---

## Part 0: Before you start
1. **A password manager** (Bitwarden is free). You'll store three secrets in it: the signing key, the rate-limit key,
   and later your Whop key.
2. **Node.js 20 or newer** on your computer (https://nodejs.org, the "LTS" button, then run the installer). Check:
   open a terminal (Windows: press the Windows key, type `PowerShell`, Enter. Mac: Spotlight, type `Terminal`) and run
   `node --version`. You should see `v20…` or higher.
3. **A copy of the repository on your computer.** The code is private, so use GitHub Desktop (https://desktop.github.com),
   sign in, **File › Clone repository** › `arcuto29/wicked-skins` (or `priism-app` after the rename). Note the folder it
   puts the files in; the terminal commands below start with `cd` into that folder.
   (`cd` means "go into this folder", for example `cd Documents/GitHub/wicked-skins`.)
4. **Supabase billing check.** Dashboard › your organization › **Billing** must say **Free**. Don't add a card.
   On Free, going over a limit pauses or restricts the service. You're never billed.
5. **API keys.** Dashboard › Project Settings › **API Keys**. Keep the legacy `anon` key active: every installed copy
   of Priism uses it. Never copy the `service_role` / secret key anywhere. Priism doesn't need it.

## Part 1: The private signing key (5 minutes)
The licence function signs passes with a **private key**. The app checks them with the matching **public key**. If the
private key leaks, anyone could make passes, so it is made on your computer and never goes in the repository.

> A key pair already exists from the Kiro sandbox (`PRIVATE-priism-pass-key.json`, outside the repo, and never
> committed or packaged; scanned Nov 2026). It's safest to make your own and discard that one.

1. In the terminal, go to a folder **outside** the repository, for example `cd Documents`.
2. Run (replace the path with where your repository is):
   `node path/to/wicked-skins/supabase/functions/licence/newkeys.mjs`
3. You should see `Private key written to PRIVATE-priism-pass-key.json (secret).` and a line starting
   `const PUBLIC_JWK = {…}`.
4. **Open `PRIVATE-priism-pass-key.json` and copy the whole thing into your password manager** as a secure note
   named "Priism pass private key". If you lose it you can make a new one, but every user's pass stops working until
   a release with the new public key.
5. **Send Kiro the `PUBLIC_JWK` line** (the public key is safe to share). Kiro puts it in `src/pass.js`; it goes out
   in the release in Part 7.
6. Delete `/projects/sandbox/PRIVATE-priism-pass-key.json` from the Kiro sandbox once you've made your own (ask Kiro to).
7. Keep `PRIVATE-priism-pass-key.json` on your computer until Part 3 is done, then delete it from the folder too.

## Part 2: Supabase database (10 minutes)
1. Open https://supabase.com/dashboard › your project › **SQL Editor** (left sidebar) › **New query**.
2. Open `supabase/schema.sql` from the repository (the `main` branch after this PR is merged), select everything (Ctrl+A),
   copy, paste into the editor, press **Run**.
   - It's safe to run again: it only adds what's missing and keeps all data.
   - You should see "Success. No rows returned". If a notice says the Storage policy wasn't updated, go to Storage ›
     Policies › `workshop` › the upload policy › add `and public.workshop_can_upload()` to its check.
3. **Set the rate-limit key.** Make a random text of 32+ letters and numbers in your password manager (use its
   generator, letters and numbers only, no quotes). Save it as "Priism rate-limit key". In the SQL Editor run, with your
   own text in place of the example:
   ```sql
   select public.licence_set_rate_key('PASTE-YOUR-RANDOM-TEXT-HERE');
   ```
   You should see `ok`. Only a fingerprint of the key is stored, not the key. (Supabase keeps SQL Editor history,
   so don't reuse this text anywhere else.)
4. Check it works. Run:
   ```sql
   select public.redeem_invite('NOPE-NOPE-NOPE', 'test-device-1');
   ```
   You should see `invalid`. Run it 11 times in a row: the 11th shows `limited`. That is the rate limit working; it
   clears by itself after 10 minutes. (It counts by the address you're connecting from, never by device id, so changing
   the device id doesn't help.)
5. Check you're an admin (after Part 3's sign-in): `select email, is_admin from public.profiles p join auth.users u on u.id = p.id;`
   your address should show `true`.
6. **Authentication › Sign In / Providers › Email**: keep **Confirm email** switched **on**. It is part of what stops
   someone claiming your owner address.

## Part 3: Sign-in, so you and testers can log in (15 minutes)
Testers sign in on the website with Google. (Supabase's built-in email only reaches your own team, so email sign-up
doesn't work for them unless you add your own mail service.)

**Google side** (https://console.cloud.google.com):
1. Create a project (top bar › New project, name it `Priism`).
2. **APIs & Services › OAuth consent screen** (may be called Google Auth Platform): choose **External**, fill the app name
   (`Priism`), your email, and save. Under Audience, click **Publish app** so sign-in doesn't expire after 7 days.
3. **Credentials › Create credentials › OAuth client ID** › Application type **Web application**.
4. Under **Authorized redirect URIs** add exactly: `https://tsazewpipzgfwgcepcsb.supabase.co/auth/v1/callback`
   (Supabase also shows this URL on its Google provider page; copy it from there if in doubt).
5. Click Create. Copy the **Client ID** and **Client secret**.

**Supabase side:**
1. **Authentication › Sign In / Providers › Google** (older dashboards: Authentication › Providers): switch on, paste the Client ID and Client secret, **Save**.
2. **Authentication › URL Configuration**: Site URL `https://arcuto29.github.io/wicked-skins/`; under Redirect URLs add
   `https://arcuto29.github.io/wicked-skins/workshop.html`. Save.
3. Test: open https://arcuto29.github.io/wicked-skins/workshop.html, sign in with Google using **your owner address**.
   You should see the **Invites** section marked ADMIN. If you don't, your Google address isn't in `owner_emails()`:
   tell Kiro, or edit that one line in the SQL Editor and run the schema again.

## Part 4: The licence function (15 minutes)
This is the server that issues signed passes. You run three commands. `npx` comes with Node.

1. In the terminal, go **into the repository folder** (`cd …/wicked-skins`).
2. Log in and link (a browser window opens to approve the login):
   ```sh
   npx supabase@latest login
   npx supabase@latest link --project-ref tsazewpipzgfwgcepcsb
   ```
   (Supabase's CLI can't be installed with `npm i -g`; `npx` is the supported way. If it asks for the database password,
   you don't need it for this: press Enter, or find it under Project Settings › Database.)
3. Set the two secrets. The values come from your password manager. **Mac / Linux** (the key file from Part 1 is in
   `~/Documents`):
   ```sh
   npx supabase@latest secrets set PASS_PRIVATE_JWK="$(cat ~/Documents/PRIVATE-priism-pass-key.json)"
   npx supabase@latest secrets set LICENCE_RATE_KEY='the same random text as in Part 2 step 3'
   ```
   **Windows PowerShell:**
   ```powershell
   $jwk = Get-Content -Raw "$HOME\Documents\PRIVATE-priism-pass-key.json"
   npx supabase@latest secrets set "PASS_PRIVATE_JWK=$jwk"
   npx supabase@latest secrets set "LICENCE_RATE_KEY=the same random text as in Part 2 step 3"
   ```
   The two `LICENCE_RATE_KEY` values must be identical (the function sends it, the database checks it). If you answer a
   confirmation question, type `y`.
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` are given to the function by Supabase.
4. Deploy: `npx supabase@latest functions deploy licence`. Leave JWT verification on (the default); Priism sends the
   anon key, which passes it.
5. Check (should print `{"status":"invalid"}`). Replace `<anon key>` with the anon key from `src/workshop-config.js`
   (it's public, meant to be in the app).
   - Mac / Linux:
     ```sh
     curl -s -X POST https://tsazewpipzgfwgcepcsb.supabase.co/functions/v1/licence \
       -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>" -H "Content-Type: application/json" \
       -d '{"key":"NOPE-NOPE-NOPE","device":"test-device-1"}'
     ```
   - Windows PowerShell: `Invoke-RestMethod -Method Post -Uri https://tsazewpipzgfwgcepcsb.supabase.co/functions/v1/licence -Headers @{apikey="<anon key>"; Authorization="Bearer <anon key>"} -ContentType "application/json" -Body '{"key":"NOPE-NOPE-NOPE","device":"test-device-1"}'`
6. Check the rate limit through the function: repeat that command 12 times. After about 10 wrong tries it answers
   `{"status":"limited"}`. Wait 10 minutes before testing anything else from your own connection. If it **never**
   says `limited`, the two rate-limit keys don't match: set both again with the same text.
   Also check the function logs (Dashboard › Edge Functions › licence › Logs): they must **not** say
   "LICENCE_RATE_KEY is not set".
7. Now delete `PRIVATE-priism-pass-key.json` from your Documents folder (it's in your password manager).
8. Tell Kiro "the licence function is live". Don't turn anything else on yet.

## Part 5: Your 15 beta testers (10 minutes)
1. Open the website's Workshop page, signed in as you. The **Invites** section shows **Beta spots: 0 of 15 used**.
   (The limit is a box you can change and Save. The database enforces it: a 16th person is told the beta is full.)
2. Choose **Several codes**. Set **Codes** to 15, **Devices** to **1** (it starts at 2), leave **Beta: needs an account**
   ticked, and **Ends after** 21 days. The end date counts from the moment you make the codes, so make them when you're
   ready to send them (you can always change it later with **Ends**). Press **Make the codes**, then **Copy all**. Send each
   tester **one** code.
3. Tell each tester (send these steps with their code):
   1. Install the beta (Part 8 for the Chrome Web Store link, or your zip).
   2. On the website: sign in with Google › **Beta access** › paste your code › **Add to my account**.
   3. Press **Get a link code**. Type it in the Priism panel within 10 minutes.
   4. The panel says **Priism beta · Beta until <date>**.
4. Each beta code belongs to one person and one device at a time. Moving to another device is allowed once every 7 days.
5. **Your own devices:** sign in, **Beta access › Get a link code**, type it in the panel. You'll see "Active" with no end
   date, and up to 5 devices.

### Managing people (the owner dashboard)
Everything is on the Workshop page › **Invites**. Each row shows who claimed the code, linked devices, when last seen,
and the end date.

| I want to… | Do this | When it takes effect |
|---|---|---|
| Give someone more time | **+7 days**, or pick any date in **Ends** | their next daily check |
| End someone's beta early | set **Ends** to today or earlier, or **Turn off** | within a day |
| Let someone use a new computer or after reinstalling | **Reset devices** | straight away |
| Turn someone off (and back on) | **Turn off** / **Turn on** | within a day |
| Remove a code for good | **Delete** (also frees the person's spot) | within a day |
| See how many spots are used, or change the limit | **Beta spots** line at the top | straight away |

Ended or turned-off codes free their spot for someone else.

## Part 6: When a beta ends (what happens, and what doesn't)
- **Pro locks. Nothing the person made is deleted.** Wallpapers, uploads, saved looks, candle styles and every setting
  stay in their browser exactly as they were. The Pro settings are only held back while the plan is off, and they come back
  when access returns. (Tests: `test/licence/invite.test.mjs`, `supabase/test.mjs`.)
- **Nobody is charged.** Beta codes never touch Whop or any card. When a beta ends, the panel says "The beta ended on
  <date>. Thanks for testing!" and stops. To offer a tester Pro afterwards, send them a Whop link or a promo code and
  they choose to buy.
- **If the server is down** (or the website is), copies keep working: a pass lasts 14 days and is renewed daily, and a
  check that fails because of an outage keeps the pass. A beta pass never lasts past the beta's end date.
- **Updates keep everything.** Chrome updates the extension itself and keeps its storage because the extension id
  doesn't change. Wallpapers are saved as soon as they're added and found again if a list ever lost them. No backup is
  needed (RELEASING.md › "Where your users' things are kept").

## Part 7: Turning the protection on (needs your OK, then Kiro releases)
Do this only after Part 4 works and you've linked **your own** device successfully.
1. Tell Kiro "turn on licensing". Kiro opens a release PR that sets, in `src/pass.js`: first `LICENCE_LIVE = true`, then
   (after a signed pass is seen working on your device) `PASS_REQUIRED = true`. `FREE_TIER` stays `false` until you
   decide to open a Free plan.
2. You approve the release, as in RELEASING.md. Nothing is published without it.
3. From then on, editing browser storage can't unlock anything.

## Part 8: Chrome Web Store (for stable and the beta listing)

### 8a. The developer account (already done for stable)
Your developer dashboard: https://chrome.google.com/webstore/devconsole. A new publisher can have up to two published
extensions at first: stable plus beta is exactly two.

### 8b. Create the beta listing (once)
1. Ask Kiro for the beta zip (`npm run release 0.1.87-beta.1`, then `npm run build:ext`; the file is
   `dist/priism-skins-beta-….zip`). It has a different name and its own extension id, so beta and stable never share data.
2. Developer dashboard › **New item** › upload the zip.
3. **Store listing**: same text as stable, name "Priism Skins Beta". Add the screenshots and icon as for stable (STORE.md).
4. **Privacy practices**: fill the single-purpose description and the permission reasons as for stable (STORE.md). In the
   data-use questions, say the extension sends a random device id and the code or key you type to Priism's server to
   check access, and nothing about charts or trading.
5. **Distribution › Visibility: Private**, then choose **Trusted testers** (or a group).
6. **Add the testers.** Developer dashboard › **Account** (left sidebar, or the gear) › **Trusted testers**: add each
   tester's Google address. (The list belongs to the account, so it serves stable and beta alike.) A tester must be signed
   into Chrome with that Google account to see the listing.
7. **Submit for review.** In the submit dialog, choose **Defer publishing** if you see it: after approval nothing goes
   live until you press **Publish**. That keeps release timing in your hands.
8. When approved, copy the item's id (the long letters in its URL) and give it to Kiro as `CWS_BETA_EXTENSION_ID`,
   and the listing's link for `BETA_STORE_URL`.

### 8c. Updates (automatic for everyone)
Chrome installs updates by itself, usually within hours of publishing. Users keep all their data because the extension id
is the same. To ship one: Kiro builds it, you approve, the release workflow uploads it, then you press **Publish** in the
dashboard. You can check an install with `chrome://extensions` › Developer mode › **Update**.

### 8d. Beta copies stay locked for outsiders
A beta copy only opens for a person whose account has a beta code and who linked that copy with a link code. Someone who
gets the install link but has no account gets a locked copy. If you only want invited people to even see the listing, the
trusted-testers list does that.

## Part 9: Whop (only when you start selling Pro; not needed for the beta)
Whop takes 2.7% + 30¢ per sale, with no monthly fee.
1. Make an account at https://whop.com and create your business.
2. Create a product named **Priism Pro** and add the **Software licensing** app to it. That's what makes Whop issue a
   licence key with every purchase.
3. Add plans (Whop calls them variants), for example Monthly $14.99, Yearly $119, Lifetime $249 (one-time). Priism shows
   a one-time purchase as *Lifetime* by itself.
4. Dashboard › **Developer › API keys** › create an **account** API key for your business. It needs permission to read
   memberships and to manage them (Priism writes the list of devices on the membership; Whop calls that `member:manage`).
   If the permission picker confuses you, the Admin role works but is broader. Copy the key once and store it in your
   password manager. See Whop's [API key docs](https://docs.whop.com/api-reference/api-keys/create-api-key).
5. Find the product's id (`prod_…`) on the product page.
6. Give them to the function (from the repository folder):
   ```sh
   npx supabase@latest secrets set WHOP_API_KEY='your key' WHOP_PRODUCT_IDS='prod_…'
   ```
   Windows PowerShell: `npx supabase@latest secrets set "WHOP_API_KEY=your key" "WHOP_PRODUCT_IDS=prod_…"`.
7. Tell Kiro your store link (for `STORE_URL`).
8. Test a real purchase: make a 100%-off promo code on Whop, "buy" Pro with it, enter the key in the panel. It should say
   **Priism Pro**. Cancel the membership in Whop; within a day (or when the panel is reopened) the panel says the membership
   ended, and **nothing was deleted**.
9. **Keep the beta and Whop apart.** Don't give testers Whop plans, trials or free memberships that renew into a paid plan.
   Anyone who buys does so on purpose. Beta access is only ever a beta code.

## Part 10: Watching it (once a week, 5 minutes)
- Workshop page › **Usage**: storage against the 900 MB cap, database size, estimated downloads.
- Supabase › Usage: the real bandwidth (Free: 5 GB uncached + 5 GB cached a month).
- GitHub › Actions: the daily keep-alive stays green (stops Supabase pausing after 7 quiet days).
- Edge Functions › licence › Logs: look for errors.

## What testers see, and what to do
| The panel says | Meaning | Your action |
|---|---|---|
| "That code or key isn't right…" | typo, or an already-used link code | ask them to copy it again |
| "That's a beta code. Add it to your account on the website first" | they typed a beta code in the panel | send them Part 5 step 3 |
| "Too many wrong tries. Wait about 10 minutes" | the rate limit | wait; if it keeps happening for a real person, check the logs |
| "All beta spots are taken right now" (website) | 15 of 15 in use | raise **Beta spots** or turn off an unused code |
| "Your beta moved to another device…" | they linked a second device | **Reset devices** if it was a mistake |
| "Your account is already used on another device… from <date>" | the 7-day move rule | **Reset devices** |
| "The beta ended on <date>. Thanks for testing!" | the end date passed | **+7 days** or set **Ends** |
| "This code has been turned off" | you turned it off | **Turn on** |
| "Couldn't reach the server" | their internet, or a Supabase outage | none; their pass keeps working up to 14 days |

## Undo
- A tester: **Turn off** (locks within a day) or **Reset devices**.
- The licence function: `npx supabase@latest functions delete licence`. Priism goes back to checking the database directly
  while `LICENCE_LIVE` is false.
- The rate limit: `delete from public.licence_limits;` in the SQL Editor clears everyone's counts at once.
- `schema.sql` only adds things. Rolling back the app doesn't need any table removed.
- A leaked private key: make a new pair (Part 1), set it (Part 4 step 3), tell Kiro the new public key, release.
