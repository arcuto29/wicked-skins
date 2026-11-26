# Releasing updates

**Nothing reaches users until the owner approves it.** A release tag only builds and tests; publishing waits for an
approval in GitHub Actions, and stops completely if that approval rule isn't switched on.

| Where they installed it | How the update reaches them | What the panel shows |
|---|---|---|
| Chrome Web Store ("Priism Skins") | Chrome downloads it by itself (within hours of the store approving it) | **Update ready → Restart & update**, only once Chrome has really downloaded it (a few seconds, charts stay open) |
| Chrome Web Store beta ("Priism Skins Beta", trusted testers only) | The same, from the beta listing | The same |
| Loaded unpacked (zip) | Chrome can't update these | **Update available** with the 3 steps (unzip over the same folder, Reload). Everything stays |
| Desktop app, Windows / Linux | The app downloads it in the background, checks it against the release, installs when you choose **Restart & update** or the next time you close it | Real download progress, then **Update ready**; plain reasons if it fails |
| Desktop app, macOS | Apple only lets signed apps update themselves (not set up yet) | **Update available → Download** (drag into Applications; settings stay) |
| Android (APK from GitHub) | Only Google Play can install silently: Priism links the new APK, Android asks to confirm | **Update available → Download**. Settings stay from 0.1.87 on (same signing key) |

After any update the panel shows **Updated · what's new** once (from the release notes), and saved settings are
upgraded automatically and safely (`src/migrate.js`: all or nothing, old values kept).

## Every release
```bash
npm run release 0.2.0           # or a beta for invited testers: npm run release 0.2.0-beta.1
# write what changed under "## 0.2.0" in CHANGELOG.md (users see the bold headlines)
git commit -am "Release v0.2.0" && git tag v0.2.0 && git push --follow-tags
```
`npm run release` sets the version everywhere in each platform's form (`scripts/versions.js`): `0.2.0-beta.1` is
`0.2.0.1` in the extension's manifest (version_name `0.2.0-beta.1`, name "Priism Skins Beta"), and the Android
versionCode always goes up.

GitHub Actions (`.github/workflows/release.yml`) then:
1. **Builds and tests, publishes nothing**:
   - checks the code, the versions and the CHANGELOG section;
   - runs the update tests;
   - builds the extension zip, the desktop installers and the Android APK (unsigned);
   - checks every desktop update file against its metadata: names GitHub keeps, sizes and SHA-512;
   - keeps the files as workflow artifacts for 14 days. They are only visible from the run page (to signed-in GitHub
     users, since the repo is public), and no update feed or store points at them.
2. **Checks that approval is required.** Environment `release` must have a required reviewer, or the run stops.
3. **Waits for you.** In the run: **Review deployments → release → Approve**.
4. **Publishes, all in one job, after approval:**
   - signs the APK with Priism's key and refuses any other key (`android/release-signing.sha256`);
   - creates the GitHub Release as a draft with every file;
   - checks every file is there;
   - makes the release public (a pre-release for betas);
   - sends the zip to the Chrome Web Store: the stable listing, or the beta listing for a beta tag.

   Desktop and Android only ever see a complete, public release. Stable copies ignore pre-releases. Beta copies get
   betas, and stable releases after them.

Pull requests run `ci.yml` (checks, build, desktop smoke test) and `updates.yml`:
- real installed apps updating on Windows and Linux;
- Android upgrades in an emulator;
- backup / restore between two Chrome installs;
- the update card in every state.

## Where your users' things are kept (and why updates never lose them)
| Install | Kept in | Survives updates because |
|---|---|---|
| Chrome Web Store | the extension's own storage + its file database (`wicked-media`), under the store's extension id | Chrome keeps an extension's data when it updates it (same id) |
| Loaded unpacked (zip) | the same, under the **unpacked copy's id** | from 0.1.88 on the zip has a fixed key (`keys/unpacked.json`): the same id in **any** folder |
| Desktop app | `settings.json` in the app's folder (`%APPDATA%/Priism Skins`, `~/Library/Application Support/Priism Skins`, `~/.config/Priism Skins`), written safely with a `.bak` | the installer never touches that folder; settings left under the old name "Wicked Skins" are copied over on first start (`desktop/userdata.js`) |
| Android | the app's own storage | every release is signed with the same key (from 0.1.87 on) |

Only removing Priism (uninstall, or Remove in `chrome://extensions`) deletes them. That's Chrome's and the operating
system's rule, so **Settings › Backup & restore › Save a backup** is the way to move to a new install.

**Unpacked ids.** Chrome gives an unpacked copy without a key an id made from its **folder path**, and keeps its data
under that id. Unzipping an update into a new folder therefore made a new, empty copy (the old copy's data is still
there, under the old id, until that copy is removed). The build now makes two zips:
- `priism-skins-X.zip`: to load unpacked. From `keyedFrom` (0.1.88) on it has the fixed key, so updates can go in any folder.
- `priism-skins-X-store.zip`: for the Chrome Web Store, with no key (the store refuses one). The release workflow uploads
  this one, and refuses a store zip that has a key.

Adding a key to an existing install changes its id once. So 0.1.87 still ships without a key. For 0.1.88, its update
card tells unpacked users to unzip into a **new** folder and Load unpacked next to the old copy. The new copy then
takes everything from the old one **by itself** (`src/handover.js`), and both panels say when it's done. No backup is
needed.

**Moving between copies by itself (`src/handover.js`).** The known ids are the store copy, the unpacked copy with the
fixed key, and the beta twin; stable and beta never mix.
- A copy with things says hello to those ids every 15 minutes (`chrome.alarms`).
- An empty copy at one of those ids pulls everything over Chrome's extension-to-extension messaging: settings, looks,
  candle styles and every wallpaper file. Each file is checked by size and CRC-32 before it's listed.
- A cut-off move resumes. Nothing is deleted on either side.
- A copy only gives its data to those ids. It takes from others only while it's empty.
- A licence code that comes along only counts after the server confirms it.
- The same move works between a store copy and an unpacked copy, either way.

Test builds use `node
scripts/build-extension.js --keyed`, so testers keep their uploads between test builds too. The key's private half isn't
needed (the id comes from the public half) and isn't in the repo.

## Two repos: private code, public releases
- **`arcuto29/priism-app` (private):** all the code, tests and history. Tags, CI and builds run here.
- **`arcuto29/priism-skins` (public):** only the GitHub Releases (downloads + the desktop app's auto-update files) and
  the website (`gh-pages` branch → https://arcuto29.github.io/priism-skins/). Never push code here.

The workflows publish to the public repo with the **`PUBLIC_REPO_TOKEN`** secret (in `priism-app` → Settings →
Secrets and variables → Actions). It's a fine-grained personal access token limited to **only** `arcuto29/priism-skins`,
with **Contents: Read and write**. When it expires, make a new one and replace the secret; releases and the website
fail with "Add the PUBLIC_REPO_TOKEN secret" until then.

## One-time setup (owner)
### 1. The approval gate (required: without it nothing publishes)
GitHub → repo **Settings → Environments → New environment** → name it `release`:
- **Required reviewers**: add yourself. Leave "Prevent self-review" off, since you approve your own releases.
- **Deployment branches and tags** → Selected → add a rule for tags `v*`.
- Put the secrets below in this environment (**Environment secrets**), not the repository, so only the approved
  publish job can read them.

### 2. Android signing key (permanent)
Kiro generated a new key; its private part was never printed or committed. It's in the sandbox at
`/projects/sandbox/out/android-release-key/`:
- `priism-release-2026.jks`, the key;
- `PRIVATE-android-release-key.txt`, its password and the base64 value.

1. Save both files in your password manager. **If this key is lost, phones can't update without uninstalling.**
2. Add three environment secrets to `release`:
   - `ANDROID_KEY_ALIAS` = `priism`
   - `ANDROID_KEYSTORE_PASSWORD` = the password from the text file
   - `ANDROID_KEYSTORE_B64` = the one long line from the text file
3. Ask Kiro to delete the sandbox copy.

Its public fingerprint is pinned in `android/release-signing.sha256`. A release signed with anything else fails
before publishing. (An older key in `/projects/sandbox/priism-android-key/` was exposed in a work log and must not be
used; it never signed a published APK.)

### 3. Chrome Web Store: stable (already live)
Environment secrets: `CWS_EXTENSION_ID`, `CWS_PUBLISHER_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.
If they're currently repository secrets, add them to `release` too, then remove the repository copies.
The [chrome-webstore-upload guide](https://github.com/fregante/chrome-webstore-upload-keys) covers the credentials.
With a normal Gmail account choose **External**, then **Publish app** on the consent screen, or the refresh token
expires after 7 days.

### 4. Chrome Web Store: "Priism Skins Beta" for invited testers
1. Build the first beta zip: `npm run release 0.1.87-beta.1`, then `npm run build:ext` gives
   `dist/priism-skins-beta-0.1.87.1.zip`. Don't commit the version change yet.
2. Developer dashboard → **New item** → upload it. Same listing text, marked as beta.
3. **Visibility: Private → Trusted testers.** Only Google accounts you add can see or install it, even with the link.
   Add each tester in Account → Trusted testers.
4. Submit for review. Once approved, add `CWS_BETA_EXTENSION_ID` (the new item's id) to `release`, and put its store
   link in `popup/popup.js` (`BETA_STORE_URL`) in a release.
5. Beta copies also only open for testers whose access is tied to their account (a beta code on the website plus a
   link code, PR #177). Someone with the link but no approved account gets a locked copy.

The beta has its own extension id, so beta and stable never share or overwrite settings. If both are installed,
only one draws on a chart (the one used last), and the panel says two copies are installed. To move a tester from
the zip to the listing: **Settings → Backup & restore → Save a backup** in the zip copy, install the beta, **Restore**
it there. When it says **Verified**, remove the zip copy. Keep the zip method until the listing is approved.

### 5. Desktop
Windows and Linux update without signing. Windows code signing (`CSC_LINK`, `CSC_KEY_PASSWORD`) only removes the
SmartScreen warning on first install.
macOS auto-update needs the Apple Developer Program ($99/year) plus signing and notarization. Until then Macs get
the honest "Download" card.

## Changing settings safely
If you rename or remove a setting, add a step to `MIGRATIONS` in `src/migrate.js` so existing settings carry over.
It runs once per install (extension, desktop, Android), all or nothing. The previous values are kept in
`migrateBackup`, and `WickedMigrate.restoreMigration()` puts them back.
