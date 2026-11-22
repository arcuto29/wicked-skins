#!/usr/bin/env bash
# Android: what an update does to your settings, on a real Android system (emulator). Run by updates.yml.
#   APKs: v1 (0.1.86 form) and v2 (0.1.87 form) signed with the SAME key, and v2 signed with ANOTHER key.
#   (Throwaway test keys made here; Priism's real key is only used by the approved release job.)
#   1. install v1, give it settings (wallpaper, looks, licence), open it
#   2. install v2 over it: must succeed, keep the settings byte for byte, and open
#   3. install v2 signed with another key over it: Android refuses (this is why 0.1.86 and older need a one-time
#      reinstall: each was signed with a different temporary key), and the settings are still there
#   4. installing an older versionCode over a newer one is refused
set -uo pipefail
cd "$(dirname "$0")/../.."
OUT="$PWD/test-output/android"; mkdir -p "$OUT"; R="$OUT/results.txt"; : > "$R"
pass() { echo "PASS $1" | tee -a "$R"; }; fail() { echo "FAIL $1" | tee -a "$R"; FAILED=1; }; FAILED=0
APKS="$PWD/.apks"; PKG=com.priism.skins
adb wait-for-device; adb shell getprop ro.build.version.release
prefs() { adb exec-out run-as $PKG cat shared_prefs/priism.xml 2>/dev/null; }
launch() { adb shell am start -W -n $PKG/.MainActivity >/dev/null 2>&1; sleep 8; adb shell pidof $PKG >/dev/null && echo running; }
vcode() { adb shell dumpsys package $PKG | grep -m1 -o 'versionCode=[0-9]*' | cut -d= -f2; }

adb install "$APKS/v1.apk" >/dev/null && pass "v1 installs" || fail "v1 installs"
# settings as the app stores them: one JSON object in SharedPreferences "priism" (Store.kt)
# (made inside python: a 400 KB value is too long to pass as a command-line argument)
python3 - > "$OUT/priism.xml" <<'EOF'
import os, json, html, base64
img = base64.b64encode(os.urandom(300000)).decode()
cfg = {"skin": "media", "mediaId": "seed0001",
       "media": [{"id": "seed0001", "name": "Mine.png", "type": "image", "src": "data:image/png;base64," + img}],
       "candleLook": "neon", "loadouts": [{"id": "lk1", "name": "Night", "skin": "aurora", "look": {}}],
       "invite": {"code": "PRIISM-ANDR-TEST", "ok": True}}
print("<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n    <string name=\"cfg\">%s</string>\n</map>"
      % html.escape(json.dumps(cfg, separators=(",", ":")), quote=True))
EOF
echo "seed file: $(wc -c < "$OUT/priism.xml") bytes"
adb shell am force-stop $PKG
# into the app's own storage (run-as: the app's user), like the app writing them itself
adb push "$OUT/priism.xml" /data/local/tmp/priism.xml >/dev/null && adb shell chmod 644 /data/local/tmp/priism.xml
adb shell "run-as $PKG sh -c 'mkdir -p shared_prefs && cp /data/local/tmp/priism.xml shared_prefs/priism.xml'"
adb shell rm /data/local/tmp/priism.xml
[ "$(launch)" = running ] && pass "v1 opens with the settings" || fail "v1 opens with the settings"
adb shell am force-stop $PKG
BEFORE=$(prefs | sha256sum | cut -c1-64); echo "settings before: $BEFORE ($(prefs | wc -c) bytes)"
SIZE=$(prefs | wc -c)
if grep -q "PRIISM-ANDR-TEST" <(prefs) && [ "$SIZE" -gt 300000 ]; then pass "the settings (with a 300 KB wallpaper) are stored: $SIZE bytes"; else fail "the settings are stored ($SIZE bytes)"; echo "nothing to compare: stopping"; exit 1; fi

V1=$(vcode); OUTP=$(adb install -r "$APKS/v2.apk" 2>&1); echo "$OUTP" | tail -1
echo "$OUTP" | grep -q Success && pass "v2 (same key) installs over v1" || fail "v2 (same key) installs over v1: $OUTP"
V2=$(vcode); [ "$V2" -gt "$V1" ] && pass "versionCode went up ($V1 -> $V2)" || fail "versionCode went up ($V1 -> $V2)"
AFTER=$(prefs | sha256sum | cut -c1-64)
[ "$AFTER" = "$BEFORE" ] && [ "$(prefs | wc -c)" -gt 300000 ] && pass "after the update: every setting, wallpaper, look and the licence byte for byte the same" || fail "settings changed by the update"
[ "$(launch)" = running ] && pass "v2 opens" || fail "v2 opens"
adb shell am force-stop $PKG

OUTP=$(adb install -r "$APKS/v2-otherkey.apk" 2>&1); echo "$OUTP" | tail -1
echo "$OUTP" | grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE" && pass "an APK signed with another key is refused (INSTALL_FAILED_UPDATE_INCOMPATIBLE): why 0.1.86 and older need one reinstall" || fail "other key not refused: $OUTP"
[ "$(prefs | sha256sum | cut -c1-64)" = "$BEFORE" ] && pass "...and the settings are untouched by the refused install" || fail "settings changed by refused install"

OUTP=$(adb install -r "$APKS/v1.apk" 2>&1); echo "$OUTP" | tail -1
echo "$OUTP" | grep -q "INSTALL_FAILED_VERSION_DOWNGRADE" && pass "an older version can't be installed over a newer one" || fail "downgrade not refused: $OUTP"
echo "ANDROID: $(grep -c ^PASS "$R")/$(grep -c . "$R")"
exit $FAILED
