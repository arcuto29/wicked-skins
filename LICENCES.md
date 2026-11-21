# Selling Priism Pro (Whop licence keys)

Priism has two plans:
- **Free:** 6 wallpapers (Midnight, Graphite, Starfield, Twinkle, Rain, Snow), candle colours, and the picture
  settings, with the Priism watermark always on.
- **Pro:** everything else.

Buyers pay on **Whop**, get a **licence key**, and enter it in the Priism panel, in the same box as invite codes.
Invite codes keep working and count as Pro.

Here's how a key is checked:
1. The panel sends the key and a random id for that copy of Priism to the **licence function** on your Supabase
   backend (`supabase/functions/licence`).
2. The function asks Whop whether the membership is active. Whop's API key stays in the function and never ships in
   the app.
3. It saves which devices use the key on the Whop membership (up to 3: browser, desktop app, phone).
4. It answers with a **signed pass**.
5. Priism checks the pass with the public key in `src/pass.js`. A pass works only on that device and lasts 14 days.
   Priism renews it once a day.

Editing saved settings can't create a pass. Nothing about anyone's charts or trading is sent anywhere.

The switches are at the top of `src/pass.js`:

| Switch | Now | Meaning |
|---|---|---|
| `FREE_TIER` | `false` | `false`: invite or key only, as today. `true`: anyone can use Free without a code. |
| `PASS_REQUIRED` | `false` | `false`: a saved invite counts as Pro by itself. `true`: Pro needs a signed pass. |
| `STORE_URL` | `""` | Your Whop store page. It's used by the Get Pro buttons. |

## 1. Whop
1. Create your Whop business, then a product called **Priism Pro**, and add the **Software licensing** app to it.
   That's what makes Whop issue a licence key with each purchase.
2. Add the plans (Whop calls them variants), for example:
   - Monthly $14.99
   - Yearly $119
   - Lifetime $249 (a one-time payment)

   Priism tells a one-time purchase apart by itself and shows it as *Lifetime*.
3. **Developer → API keys:** create an account API key that can read and update memberships. Keep it secret.
4. Note the product's id (`prod_…`).
5. Copy your store page link.

## 2. Supabase (the licence function)
You need the Supabase CLI (`npm i -g supabase`) and to be logged in (`supabase login`). Run these in this repo:

```sh
supabase link --project-ref tsazewpipzgfwgcepcsb
supabase secrets set WHOP_API_KEY='…your Whop API key…'
supabase secrets set WHOP_PRODUCT_IDS='prod_…'            # several: prod_a,prod_b
supabase secrets set PASS_PRIVATE_JWK="$(cat PRIVATE-priism-pass-key.json)"
supabase functions deploy licence
```

- `PRIVATE-priism-pass-key.json` is the private half of the key in `src/pass.js`. It was generated for you and saved
  **outside** this repo, at `/projects/sandbox/PRIVATE-priism-pass-key.json`. Store it in a password manager, then
  delete that copy.
- **Never commit it.** Anyone holding it could make passes.
- If it leaks, make a new pair (`node supabase/functions/licence/newkeys.mjs`), set the new private key as above, put
  the new public key in `src/pass.js`, and release.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to the function by Supabase.

Check it's live:
```sh
curl -s -X POST https://tsazewpipzgfwgcepcsb.supabase.co/functions/v1/licence \
  -H "apikey: <anon key from src/workshop-config.js>" -H "Authorization: Bearer <same anon key>" \
  -H "Content-Type: application/json" -d '{"key":"NOPE-NOPE-NOPE","device":"test-device-1"}'
# -> {"status":"invalid"}
```

Then set `LICENCE_LIVE = true` in `src/pass.js` and release. Until then Priism checks invite codes the old way (and doesn't ask the function at all, so Chrome logs no errors); Whop keys can only be checked once it's on.

## 2b. The closed beta (codes tied to accounts)
Beta codes belong to one person's account and work on one device at a time until their end date. Nothing is paid,
so Whop isn't involved.

**Set up (once):** run `supabase/schema.sql` in the SQL Editor. This adds the beta columns and functions, and existing
codes keep working. Turn on Google sign-in (Authentication › Providers) so testers don't need email confirmation.

**Give someone access:** on the website (Workshop, signed in as the owner), go to **Invites** › For one person. Leave
"Beta: needs an account" on, set 1 device and 21 days, then press **Make a code** and send it to them.

**What the tester does:**
1. On the website: sign in, then **Beta access** › paste the code › **Add to my account**.
2. Press **Get a link code**. It gives a code like `K7QM-3XPA` that works once, for 10 minutes.
3. In the Priism panel: type the link code in the code box. The panel shows **Priism beta**, "Beta until <date>".

**Rules (enforced by the database, not the app):**
- One code goes on one account. If anyone else tries it, they get "taken".
- One device per account. Linking a new device moves the beta to it, and the old one locks at its next daily check.
  A move is allowed once every 7 days. "Unlink" in Settings › Plan still counts toward that, so access can't be
  passed around.
- The device keeps a random secret, and the server stores only its SHA-256. Copying the device id alone doesn't work.
- After the end date, the device's check says *ended* and it locks. A pass never lasts past the end date.

**Manage access (Invites list):** each row shows who claimed the code, how many devices are linked, when they were last
seen and when the code ends.
- **+7 days** extends it. Devices pick up the new date at their next check.
- **Reset devices** unlinks everything on that account, so the tester can link a new device straight away (for
  example, after a reinstall or a new PC).
- **Turn off** revokes the code, and the device locks within a day.

**What the device secret protects against, and what it doesn't (audit, Nov 2026):**

| Situation | Result |
|---|---|
| A tester sends their beta code to a friend | Blocked: the code is already on the tester's account ("taken"). |
| A tester sends a link code | It works once, for 10 minutes, and moves the beta off the tester's own device. They notice. |
| Someone copies the device id from one install into another | Blocked: they also need the secret, and the server only has its hash. |
| Someone edits `invite` in storage by hand (devtools) | **Gets Pro while `PASS_REQUIRED = false`.** Only the signed pass stops this, so deploy the function and turn `PASS_REQUIRED` on before relying on it. |
| Someone copies the whole browser profile or the desktop `settings.json` to a second machine | **Both copies work.** They have the same id and secret, and the server can't tell them apart. Possible later fix: a new secret on every check, with the previous one accepted for a day, so the copy that checks in second is caught. Not built: it adds lock-out risk if a reply is lost. |
| Someone edits the extension's own code | Can't be prevented by any extension. The pass makes it a deliberate act, not a casual one. |
| A tester goes offline or blocks the server | Pro keeps working until the pass ends: 14 days at most, and never past the beta's end. Revoking or moving takes effect at the next check (once a day when online). |
| A tester reinstalls or clears the extension's data | It's a new device. Within 7 days of their last move they get "full" until you press **Reset devices**. This is expected support work during the beta. |
| Guessing codes | Link codes and invite codes each have 32^8 (about 10^12) possibilities. With 15 testers that's out of reach without rate limiting (PostgREST has none). |

Where the secret is stored: `chrome.storage.local` (extension), `settings.json` in the app's data folder (desktop) and
SharedPreferences (Android), all in plain text like the rest of the settings. Other websites and extensions can't
read them. Anyone with access to the user's computer account can.

Before the licence function is deployed, the panel calls the database functions directly (`link_device`,
`device_check`). The checks run on the server, but without a signed pass, so `PASS_REQUIRED` must stay `false` until
§2 is done. After that, set `LICENCE_LIVE = true` and then `PASS_REQUIRED = true`. Beta devices then need a pass
from the function, and it expires at the beta's end date.

## 3. Test a real purchase
1. Make a 100% off promo code on Whop and "buy" Pro with it.
2. Enter the key in the panel. It should say **Priism Pro**, and Settings › Plan should show the renewal date and
   **Manage billing**.
3. Settings › Plan › **Sign out on this device** frees the device.
4. Cancel the membership on Whop. Within a day, or straight away after reopening the panel, it says the membership
   has ended.

## 4. Launch
In `src/pass.js`:
- `STORE_URL`: your Whop store link.
- `PASS_REQUIRED = true`, once the function is live. Invite users get their pass the next time Priism re-checks.
- `FREE_TIER = true`, when you want everyone to be able to install and use Free.

Then release as usual (RELEASING.md). The panel's Settings › **Plan** shows each user's plan.

## Notes
- **Refunds and chargebacks:** Whop ends the membership, and Priism switches back to Free (or locks, if Free isn't
  open) at the next daily check.
- **Offline:** a pass lasts 14 days, so travelling or a server outage doesn't lock anyone out.
- **Limits:** a determined person could still edit the app's own code on their machine. No browser extension can stop
  that. The pass stops the easy ways: copying settings, editing storage, or sharing a key with more than 3 devices.
- **Tests:**
  - `node supabase/licence.test.mjs`: the function against a fake Whop. It runs in CI.
  - `pwtest/plans.js`: Free and Pro on a real chart, with real signed passes.
