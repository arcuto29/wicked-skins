// One version, written the right way for each platform (used by release.js and check.js).
//   stable  0.1.87          beta  0.1.87-beta.2
//   package.json / desktop:   0.1.87 / 0.1.87-beta.2   (semver: electron-updater knows a beta comes before its release)
//   manifest.json:            version 0.1.87 / 0.1.87.2 (Chrome takes numbers only), version_name 0.1.87-beta.2 (beta only)
//   Android:                  versionName as package.json; versionCode X*10000000 + Y*100000 + Z*100 + (beta N, or 99 for stable)
//                             so every release is higher than the one before it, and a release higher than its betas
"use strict";
function parse(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/.exec(String(v || "").trim());
  if (!m) return null;
  const [x, y, z, b] = [+m[1], +m[2], +m[3], m[4] ? +m[4] : 0];
  if (y > 99 || z > 999 || (m[4] && (b < 1 || b > 98))) return null;
  return { x, y, z, beta: b, semver: `${x}.${y}.${z}${b ? "-beta." + b : ""}`, manifest: `${x}.${y}.${z}${b ? "." + b : ""}`, versionName: b ? `${x}.${y}.${z}-beta.${b}` : undefined,
    versionCode: x * 10000000 + y * 100000 + z * 100 + (b || 99), channel: b ? "beta" : "stable" };
}
module.exports = { parse };
