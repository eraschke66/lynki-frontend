// lecture-verify-password v1 — server-side gate for private classroom lectures.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// Public (no JWT): students aren't logged in. Compares the submitted password to the
// SHA-256(lecture_id:password) hash in the service-role-only classroom_lecture_secrets
// table — the password itself is never exposed to the client. Rate-limited per IP.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(b: Record<string, unknown>, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
async function sha256hex(s: string){ const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
function timingSafeEqual(a: string, b: string){ if(a.length!==b.length) return false; let o=0; for(let i=0;i<a.length;i++) o|=a.charCodeAt(i)^b.charCodeAt(i); return o===0; }

const WINDOW_MS = 60_000, MAX = 10;
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string){ const now=Date.now(); const e=hits.get(ip); if(!e||e.reset<=now){ hits.set(ip,{n:1,reset:now+WINDOW_MS}); return false; } e.n++; return e.n>MAX; }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ valid: false, error: "POST only" }, 405);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return json({ valid: false, error: "Too many attempts" }, 429);
  try {
    const { lecture_id, password } = await req.json();
    if (!lecture_id || typeof password !== "string" || !password) return json({ valid: false, error: "lecture_id and password required" }, 400);
    const { data: secret } = await sb.from("classroom_lecture_secrets").select("password_hash").eq("lecture_id", lecture_id).maybeSingle();
    if (!secret) return json({ valid: false, error: "No password set for this lecture" }, 404);
    const valid = timingSafeEqual(await sha256hex(`${lecture_id}:${password}`), secret.password_hash);
    return json({ valid });
  } catch (e) { return json({ valid: false, error: "Internal error" }, 500); }
});
