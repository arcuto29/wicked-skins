// Versions and channels (src/version.js, scripts/versions.js): an update is only ever offered when it's really newer.
//   node test/updates/version.test.mjs
import fs from "fs"; import vm from "vm"; import { createRequire } from "module";
const require = createRequire(import.meta.url);
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d) : "")); };
const g = {}; g.self = g; vm.createContext(g); vm.runInContext(fs.readFileSync(new URL("../../src/version.js", import.meta.url), "utf8"), g);
const V = g.PriismVersion, P = require("../../scripts/versions.js").parse;
const order = ["0.1.85", "0.1.86", "0.1.87-beta.1", "0.1.87-beta.2", "0.1.87", "0.1.88-beta.1", "0.1.88", "0.2.0-beta.1", "0.2.0", "1.0.0"];
let sorted = true; for (let i = 1; i < order.length; i++) if (!(V.cmp(order[i - 1], order[i]) < 0)) sorted = false;
ok("versions in order: a beta comes before its release, after the one before", sorted);
ok("Chrome's beta form 0.1.87.2 is the same as 0.1.87-beta.2", V.cmp("0.1.87.2", "0.1.87-beta.2") === 0 && V.newer("0.1.87", "0.1.87.2") && V.newer("0.1.87.2", "0.1.87.1"));
ok("tags with a v", V.cmp("v0.1.87", "0.1.87") === 0);
ok("nothing offered for the same or an older version", !V.newer("0.1.86", "0.1.86") && !V.newer("0.1.85", "0.1.86"));
ok("an unknown version is never 'newer'", !V.newer("garbage", "0.1.86") && !V.newer("", "0.1.86"));
ok("labels", V.label("0.1.87-beta.2") === "0.1.87 Beta 2" && V.label("0.1.87.2") === "0.1.87 Beta 2" && V.label("0.1.87") === "0.1.87");
// every platform's version from one number
const codes = order.map((v) => P(v).versionCode);
ok("Android versionCode goes up with every release (betas too)", codes.every((c, i) => !i || c > codes[i - 1]), codes);
ok("...and is higher than every APK published so far (86)", codes[0] > 86);
ok("manifest forms", P("0.1.87").manifest === "0.1.87" && P("0.1.87-beta.2").manifest === "0.1.87.2" && P("0.1.87-beta.2").versionName === "0.1.87-beta.2" && P("0.1.87").versionName === undefined);
ok("bad versions refused", !P("0.1") && !P("0.1.87-rc.1") && !P("0.1.87-beta.0") && !P("0.1.87-beta.99"));
console.log("SUMMARY:", Object.values(R).filter(Boolean).length + "/" + Object.keys(R).length);
process.exit(Object.values(R).every(Boolean) ? 0 : 1);
