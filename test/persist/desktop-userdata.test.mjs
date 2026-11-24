// Desktop app: settings (uploads included) left in the folder of the app's old name are brought over, and nothing is
// ever overwritten or deleted (desktop/userdata.js).   node test/persist/desktop-userdata.test.mjs
import fs from "fs"; import path from "path"; import os from "os"; import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { recoverOldSettings } = require("../../desktop/userdata.js");
let pass = 0, fail = 0; const ok = (k, v, d) => { v ? pass++ : fail++; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d) : "")); };
const T = fs.mkdtempSync(path.join(os.tmpdir(), "priism-ud-")), appData = path.join(T, "AppData");
const NEW = path.join(appData, "Priism Skins"), OLD = path.join(appData, "Wicked Skins");
const big = "data:video/webm;base64," + Buffer.alloc(3 * 1048576, 7).toString("base64");   // an upload stored in the file
const oldCfg = { skin: "media", mediaId: "v1", media: [{ id: "v1", name: "my video.webm", type: "video", src: big }], candleUp: "#3fa9f5", loadouts: [{ name: "Mine" }] };
const reset = () => { fs.rmSync(appData, { recursive: true, force: true }); fs.mkdirSync(OLD, { recursive: true }); fs.writeFileSync(path.join(OLD, "settings.json"), JSON.stringify(oldCfg)); fs.writeFileSync(path.join(OLD, "chart-window.json"), JSON.stringify({ tabs: ["NQ"] })); };

reset();
const oldBytes = fs.readFileSync(path.join(OLD, "settings.json"));
const from = recoverOldSettings(appData, NEW);
const got = JSON.parse(fs.readFileSync(path.join(NEW, "settings.json"), "utf8"));
ok("first start after the rename: the old folder's settings are copied over", from === path.join(OLD, "settings.json") && got.candleUp === "#3fa9f5" && got.loadouts[0].name === "Mine");
ok("...uploads stored in them come along, byte for byte", got.media.length === 1 && got.media[0].src === big);
ok("...and the open chart tabs", JSON.parse(fs.readFileSync(path.join(NEW, "chart-window.json"), "utf8")).tabs[0] === "NQ");
ok("the old folder is left exactly as it was", fs.readFileSync(path.join(OLD, "settings.json")).equals(oldBytes));
ok("a note says where they came from", fs.readFileSync(path.join(NEW, "recovered-from.txt"), "utf8").includes("Wicked Skins"));
// already has settings of its own: never touched
fs.writeFileSync(path.join(NEW, "settings.json"), JSON.stringify({ candleUp: "#ffffff", media: [] }));
ok("a folder that already has settings is never overwritten", recoverOldSettings(appData, NEW) === null && JSON.parse(fs.readFileSync(path.join(NEW, "settings.json"), "utf8")).candleUp === "#ffffff");
// only the .bak survived (a crash mid-save in the new folder): left for the app's own .bak fallback
reset(); fs.mkdirSync(NEW, { recursive: true }); fs.writeFileSync(path.join(NEW, "settings.json.bak"), JSON.stringify({ candleUp: "#00ff00" }));
ok("the new folder's own backup copy wins over the old folder", recoverOldSettings(appData, NEW) === null && !fs.existsSync(path.join(NEW, "settings.json")));
// old file damaged: its .bak is used; nothing readable: nothing done
reset(); fs.writeFileSync(path.join(OLD, "settings.json"), "{ broken"); fs.writeFileSync(path.join(OLD, "settings.json.bak"), JSON.stringify(oldCfg));
ok("a damaged old file: its last good copy (.bak) is used", recoverOldSettings(appData, NEW) === path.join(OLD, "settings.json.bak") && JSON.parse(fs.readFileSync(path.join(NEW, "settings.json"), "utf8")).media.length === 1);
reset(); fs.writeFileSync(path.join(OLD, "settings.json"), "{ broken");
ok("nothing readable anywhere: nothing created (a fresh start, as before)", recoverOldSettings(appData, NEW) === null && !fs.existsSync(path.join(NEW, "settings.json")));
// a fresh install with no old folder at all
fs.rmSync(appData, { recursive: true, force: true });
ok("a fresh install: nothing to do", recoverOldSettings(appData, NEW) === null);
fs.rmSync(T, { recursive: true, force: true });
console.log(`\nDESKTOP SETTINGS FOLDER: ${pass}/${pass + fail}`);
process.exitCode = fail ? 1 : 0;
