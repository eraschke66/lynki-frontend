// lecture-status v1 — lightweight GET poll endpoint for the New Lecture build.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// The portal form polls this every few seconds after POSTing to lecture-create.
// Returns the build status and, once ready, the URLs + generated prompt the
// preview step needs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SERVICE_ROLE_KEY not configured" }, 500);

  try {
    const url = new URL(req.url);
    const lectureId = url.searchParams.get("lecture_id");
    if (!lectureId) return json({ error: "lecture_id required" }, 400);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: l, error } = await sb.from("classroom_lectures")
      .select("id, subject_slug, lecture_slug, lecture_title, status, error_message, video_url, captions_url, teaching_mode_prompt, duration_seconds, is_public, access_mode")
      .eq("id", lectureId).single();

    if (error || !l) return json({ error: "Lecture not found" }, 404);

    const ready = l.status === "ready";
    return new Response(JSON.stringify({
      lecture_id: l.id,
      status: l.status,
      error_message: l.error_message || null,
      subject_slug: l.subject_slug,
      lecture_slug: l.lecture_slug,
      lecture_title: l.lecture_title,
      is_public: l.is_public,
      access_mode: l.access_mode,
      // Only meaningful once ready, but harmless to expose during the build.
      video_url: l.video_url || null,
      captions_url: ready ? (l.captions_url || null) : null,
      teaching_mode_prompt: ready ? (l.teaching_mode_prompt || null) : null,
      duration_seconds: l.duration_seconds || null,
      preview_url: ready ? `/classroom/${l.subject_slug}/${l.lecture_slug}` : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
