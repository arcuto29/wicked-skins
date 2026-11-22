#!/usr/bin/env bash
# The desktop updater test, start to finish, on a GitHub runner (Windows via Git Bash, or Linux). See updates.yml.
#   1. builds two new versions from this branch (CI-only version numbers 0.1.990 and 0.1.991, never committed)
#   2. BEFORE: installs the real published 0.1.85 and serves it the real published 0.1.86 release: the 404 users get
#   3. AFTER:  installs the real published 0.1.86, serves 0.1.990: it must update itself, no reinstall
#   4. NEW UPDATER: 0.1.990 -> 0.1.991 with the server failing in each way, then Restart & update
# github.com points at the local stand-in (github-mock.js) only on this throwaway runner, and only after the real
# releases have been downloaded.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT=$PWD; OUT="$ROOT/test-output/desktop-$(node -p process.platform)"; mkdir -p "$OUT"; : > "$OUT/mock-log.jsonl"; echo ok > "$OUT/mode.txt"
export MOCK_LOG="$OUT/mock-log.jsonl" MOCK_MODE_FILE="$OUT/mode.txt"
WIN=0; case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1;; esac
REL=https://github.com/arcuto29/wicked-skins/releases/download
WORK="$ROOT/.upd"; mkdir -p "$WORK"

echo "::group::Build 0.1.990 and 0.1.991 from this branch"
for v in 0.1.990 0.1.991; do
  ( cd desktop && npm pkg set version=$v && rm -rf dist
    # 0.1.991 carries 12 MB of extra (random, so incompressible) data: 0.1.990 -> 0.1.991 is then a download of
    # real size, like a real release, instead of a few changed blocks, and its progress can be watched
    if [ $v = 0.1.991 ]; then head -c 12000000 /dev/urandom > ci-padding.bin
      node -e 'const f="package.json",p=require("./"+f);p.build.files.push("ci-padding.bin");require("fs").writeFileSync(f,JSON.stringify(p,null,2))'; fi
    T=--linux; [ $WIN = 1 ] && T=--win
    for i in 1 2 3; do npx electron-builder $T --publish never && break; echo "retry $i"; sleep 30; [ $i = 3 ] && exit 1; done
    node ../scripts/check-desktop-release.js dist
    mkdir -p "$WORK/rel-$v"; for f in dist/*; do [ -f "$f" ] && case "$f" in *.exe|*.blockmap|*.AppImage|*/latest*.yml) cp "$f" "$WORK/rel-$v/";; esac; done
    ls -la "$WORK/rel-$v" )
done
( cd desktop && git checkout -- package.json && rm -f ci-padding.bin )
echo "::endgroup::"

echo "::group::The real published 0.1.85 and 0.1.86"
mkdir -p "$WORK/real085" "$WORK/real086"
if [ $WIN = 1 ]; then
  curl -fsSL -o "$WORK/real085/setup.exe" "$REL/v0.1.85/Priism.Skins.Setup.0.1.85.exe"
  for f in latest.yml Priism.Skins.Setup.0.1.86.exe Priism.Skins.Setup.0.1.86.exe.blockmap; do curl -fsSL -o "$WORK/real086/$f" "$REL/v0.1.86/$f"; done
  OLD085="$WORK/real085/setup.exe"; OLD086="$WORK/real086/Priism.Skins.Setup.0.1.86.exe"
else
  curl -fsSL -o "$WORK/real085/app.AppImage" "$REL/v0.1.85/Priism.Skins-0.1.85.AppImage"
  for f in latest-linux.yml Priism.Skins-0.1.86.AppImage; do curl -fsSL -o "$WORK/real086/$f" "$REL/v0.1.86/$f"; done
  OLD085="$WORK/real085/app.AppImage"; OLD086="$WORK/real086/Priism.Skins-0.1.86.AppImage"
fi
ls -la "$WORK"/real08*
echo "::endgroup::"

echo "::group::github.com -> the local stand-in (test certificate trusted on this runner only)"
cd "$WORK"
export MSYS2_ARG_CONV_EXCL="*"   # (Git Bash on Windows would turn "/CN=..." into a file path)
openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj "/CN=Priism test CA" -keyout ca.key -out ca.crt
openssl req -newkey rsa:2048 -nodes -subj "/CN=github.com" -keyout gh.key -out gh.csr
printf "subjectAltName=DNS:github.com\nextendedKeyUsage=serverAuth\nbasicConstraints=CA:FALSE\n" > ext.cnf
openssl x509 -req -in gh.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 2 -extfile ext.cnf -out gh.crt
unset MSYS2_ARG_CONV_EXCL
if [ $WIN = 1 ]; then
  powershell -NoProfile -Command "Import-Certificate -FilePath '$(cygpath -w "$WORK/ca.crt")' -CertStoreLocation Cert:\\LocalMachine\\Root | Out-Null; Add-Content -Path C:\\Windows\\System32\\drivers\\etc\\hosts -Value '127.0.0.1 github.com'; ipconfig /flushdns | Out-Null"
else
  mkdir -p "$HOME/.pki/nssdb"; certutil -d "sql:$HOME/.pki/nssdb" -N --empty-password 2>/dev/null || true
  certutil -d "sql:$HOME/.pki/nssdb" -A -t "C,," -n priism-test-ca -i ca.crt
  echo "127.0.0.1 github.com" | sudo tee -a /etc/hosts >/dev/null
fi
cd "$ROOT"
echo "::endgroup::"

MOCK=""
mock() {   # mock <dir> <tag>
  [ -n "$MOCK" ] && { kill $MOCK 2>/dev/null || sudo kill $MOCK 2>/dev/null || true; sleep 1; }
  if [ $WIN = 1 ]; then node test/updates/github-mock.js --dir "$1" --tag "$2" --cert "$WORK/gh.crt" --key "$WORK/gh.key" --log "$MOCK_LOG" --mode "$MOCK_MODE_FILE" & MOCK=$!
  else sudo -E env "PATH=$PATH" node test/updates/github-mock.js --dir "$1" --tag "$2" --cert "$WORK/gh.crt" --key "$WORK/gh.key" --log "$MOCK_LOG" --mode "$MOCK_MODE_FILE" & MOCK=$!; fi
  # (Windows curl asks the certificate's issuer about revocation; a test certificate has nobody to ask)
  NOREV=""; [ $WIN = 1 ] && NOREV=--ssl-no-revoke
  for i in $(seq 1 30); do curl -fsS $NOREV -o /dev/null "https://github.com/arcuto29/wicked-skins/releases/latest" --cacert "$WORK/ca.crt" && return 0; sleep 1; done
  echo "mock didn't start"; exit 1
}
run() { if [ $WIN = 1 ]; then node test/updates/desktop-upgrade.js "$@"; else xvfb-run -a node test/updates/desktop-upgrade.js "$@"; fi; }
STATUS=0

echo "::group::BEFORE: installed 0.1.85 meets the real 0.1.86 release"
run install "$OLD085"; run seed
mock "$WORK/real086" v0.1.86
run expect-404 0.1.85 0.1.86 || STATUS=1
echo "::endgroup::"

echo "::group::AFTER: installed 0.1.86 (what users have) updates itself to 0.1.990"
run install "$OLD086"
mock "$WORK/rel-0.1.990" v0.1.990
run self-update 0.1.86 0.1.990 || STATUS=1
echo "::endgroup::"

echo "::group::NEW UPDATER: 0.1.990 -> 0.1.991 (errors, progress, Restart & update)"
mock "$WORK/rel-0.1.991" v0.1.991
run restart-flow 0.1.990 0.1.991 || STATUS=1
echo "::endgroup::"

[ -n "$MOCK" ] && { kill $MOCK 2>/dev/null || sudo kill $MOCK 2>/dev/null || true; }
cp "$MOCK_LOG" "$OUT/" 2>/dev/null || true
node -e 'const r=require(process.argv[1]); const k=Object.keys(r); const p=k.filter(x=>r[x].pass).length; console.log(`\nDESKTOP UPDATER: ${p}/${k.length}`); for (const x of k) console.log((r[x].pass?"PASS ":"FAIL ")+x)' "$OUT/results.json"
exit $STATUS
