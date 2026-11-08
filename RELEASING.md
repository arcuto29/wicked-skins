# Releasing updates

Every buyer gets updates **automatically**:

| Where they installed it | How the update reaches them |
|---|---|
| Chrome Web Store (recommended) | Chrome installs it in the background, usually within a few hours of you publishing. |
| Desktop app (Windows / macOS / Linux) | The app checks GitHub Releases at launch and every 6 h, downloads quietly, and installs on restart. |
| Zip / "Load unpacked" | The panel shows **Update available → Download** (checked against GitHub Releases). |

After any update the panel shows **"Updated to x.y.z · What's new"** with your changelog, and saved settings are
upgraded automatically (`src/migrate.js`).

## Every release (2 minutes)
```bash
npm run release 0.2.0          # sets the version everywhere, adds a CHANGELOG section, runs the checks
# write what changed under "## 0.2.0" in CHANGELOG.md (buyers see this)
git commit -am "Release v0.2.0" && git tag v0.2.0 && git push --follow-tags
```
GitHub Actions (`.github/workflows/release.yml`) then:
1. checks the code and that the tag matches the version,
2. builds `priism-skins-0.2.0.zip` and creates the GitHub Release with your changelog,
3. uploads and publishes it to the Chrome Web Store (once the secrets below are set),
4. builds the Windows installer, macOS `.dmg`/`.zip` and Linux `.AppImage` and attaches them; installed apps update from these.

Pull requests run `ci.yml`: syntax and manifest checks, the extension build, and a **desktop smoke test**
that launches the real app against TradingView and uploads screenshots.

## One-time setup
### Chrome Web Store (auto-updates for extension users)
1. Register as a Chrome Web Store developer (one-time $5 fee) at https://chrome.google.com/webstore/devconsole.
2. Upload the first zip by hand (from a GitHub Release or `npm run build:ext`), fill in the listing (screenshots,
   description, privacy policy URL; say it doesn't collect data) and submit for review.
3. Create API credentials for automatic uploads (Google Cloud OAuth client + refresh token). The
   [chrome-webstore-upload guide](https://github.com/fregante/chrome-webstore-upload-keys) walks through it.
   With a normal Gmail account choose **External** (not Internal), add yourself as a test user, then on the OAuth
   consent screen click **Publish app** (to "In production"). Otherwise Google expires the refresh token after 7 days.
   The **publisher ID** is in the developer dashboard under Account (or in the dashboard's URL).
4. In GitHub → repo **Settings → Secrets and variables → Actions**, add:
   `CWS_EXTENSION_ID`, `CWS_PUBLISHER_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.
   From then on every tag publishes to the store. (Store review still applies; small updates usually pass within a day.)

### Desktop app
Works without any setup: installers are built and published on every tag.
Optional but recommended before selling widely:
- **Windows code signing** (`CSC_LINK`, `CSC_KEY_PASSWORD` secrets with a code-signing certificate) removes the
  "Windows protected your PC" warning on first install. Updates work either way.
- **macOS signing + notarization** (Apple Developer Program, $99/year; secrets `CSC_LINK`, `CSC_KEY_PASSWORD`,
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`). **Without it macOS blocks the app by default and
  silent auto-update on Mac doesn't work**; Windows and Linux auto-update fine unsigned.

## Changing settings safely
If you rename or remove a setting, add a step to `MIGRATIONS` in `src/migrate.js` so existing buyers' settings
carry over. It runs once per user, on the first start after the update.
