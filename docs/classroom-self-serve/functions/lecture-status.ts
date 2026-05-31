// lecture-status v3 — AUTHORIZED poll endpoint for the New Lecture build.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// v3: adds source_type/embed_url so the preview can embed hosted players (YouTube/Vimeo).
// v2: requires the subject owner's JWT (or service-role key) — previously anyone with a
// lecture UUID could read an unpublished/private lecture's video_url + teaching_mode_prompt.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
async function authorize(req: Request, sb: any): Promise<{ isService: boolean; userId?: string } | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  if (token === SERVICE_ROLE_KEY) return { isService: true };
  try { const { data, error } = await sb.auth.getUser(token); if (error || !data?.user) return null; return { isService: false, userId: data.user.id }; } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SERVICE_ROLE_KEY not configured" }, 500);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const auth = await authorize(req, sb);
  if (!auth) return json({ error: "Unauthorized: log in as the subject owner" }, 401);
  try {
    const url = new URL(req.url);
    const lectureId = url.searchParams.get("lecture_id");
    if (!lectureId) return json({ error: "lecture_id required" }, 400);
    const { data: l, error } = await sb.from("classroom_lectures")
      .select("id, subject_id, subject_slug, lecture_slug, lecture_title, status, error_message, video_url, embed_url, source_type, captions_url, teaching_mode_prompt, duration_seconds, is_public, access_mode")
      .eq("id", lectureId).single();
    if (error || !l) return json({ error: "Lecture not found" }, 404);
    if (!auth.isService) {
      const { data: owned } = await sb.from("subject_profiles").select("id").eq("id", l.subject_id).eq("user_id", auth.userId).maybeSingle();
      if (!owned) return json({ error: "Forbidden" }, 403);
    }
    const ready = l.status === "ready";
    return json({
      lecture_id: l.id, status: l.status, error_message: l.error_message || null,
      subject_slug: l.subject_slug, lecture_slug: l.lecture_slug, lecture_title: l.lecture_title,
      is_public: l.is_public, access_mode: l.access_mode,
      source_type: l.source_type || "upload", embed_url: l.embed_url || null,
      video_url: l.video_url || null,
      captions_url: ready ? (l.captions_url || null) : null,
      teaching_mode_prompt: ready ? (l.teaching_mode_prompt || null) : null,
      duration_seconds: l.duration_seconds || null,
      preview_url: ready ? `/classroom/${l.subject_slug}/${l.lecture_slug}` : null,
    });
  } catch (err) { return json({ error: (err as Error).message }, 500); }
});
