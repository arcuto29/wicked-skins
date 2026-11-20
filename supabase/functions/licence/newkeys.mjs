// Makes a new signing key pair for Priism passes (only if the old private key leaked; see LICENCES.md).
//   node supabase/functions/licence/newkeys.mjs
// Writes the private key to PRIVATE-priism-pass-key.json in the current folder (set it as the PASS_PRIVATE_JWK secret,
// keep it safe, never commit it) and prints the public key to put in src/pass.js (PUBLIC_JWK).
import fs from "fs";
const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const priv = await crypto.subtle.exportKey("jwk", kp.privateKey), pub = await crypto.subtle.exportKey("jwk", kp.publicKey);
fs.writeFileSync("PRIVATE-priism-pass-key.json", JSON.stringify(priv), { mode: 0o600 });
console.log("Private key written to PRIVATE-priism-pass-key.json (secret).");
console.log("Public key for src/pass.js:\n  const PUBLIC_JWK = " + JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }) + ";");
