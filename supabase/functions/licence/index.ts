// Supabase Edge Function "licence": checks an invite code or a Whop licence key and answers with a signed pass.
// Deploy:  supabase functions deploy licence      (setup: LICENCES.md; Priism calls it with the public anon key)
// Secrets: PASS_PRIVATE_JWK, LICENCE_RATE_KEY, and (when selling) WHOP_API_KEY, WHOP_PRODUCT_IDS  (SUPABASE_URL / SUPABASE_ANON_KEY are set by Supabase)
import { handle } from "./core.mjs";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("POST only", { status: 405, headers: CORS });
  let input: unknown = null;
  try { const t = await req.text(); if (t.length > 2000) throw 0; input = JSON.parse(t); } catch { input = null; }
  const env = Object.fromEntries(["SUPABASE_URL", "SUPABASE_ANON_KEY", "WHOP_API_KEY", "WHOP_PRODUCT_IDS", "PASS_PRIVATE_JWK", "LICENCE_RATE_KEY"].map((k) => [k, Deno.env.get(k) || ""]));
  // the visitor's address, for rate limiting (Cloudflare sets cf-connecting-ip; it can't be forged from outside)
  const client = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim();
  if (!env.LICENCE_RATE_KEY) console.error("licence: LICENCE_RATE_KEY is not set, so the rate limit can't tell visitors apart (docs/BETA_LAUNCH.md)");
  let out;
  try { out = await handle(input, env, fetch, Date.now(), client); } catch (e) { console.error("licence", e); out = { status: "offline" }; }
  return new Response(JSON.stringify(out), { headers: { ...CORS, "Content-Type": "application/json" } });
});
