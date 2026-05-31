// lecture-create v9 — fast synchronous path + AUTHORIZED + HMAC webhook token.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// v9: private-lecture passwords stored as SHA-256(lecture_id:password) in the
// service-role-only classroom_lecture_secrets table; access_password left NULL.
// v8: fix AssemblyAI param — use speech_models (array); 'speech_model' is
// deprecated/rejected with HTTP 400. (Caught by the end-to-end smoke test.)
// v7 security hardening (student-privacy):
//   - AUTHORIZATION: the caller must own the subject (subject_profiles.user_id =
//     auth.uid()) or present the service-role key.
//   - WEBHOOK SECRET via HMAC: the AssemblyAI callback token is HMAC(lecture_id)
//     keyed by the service-role secret — NOT stored in the anon-readable table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ASSEMBLYAI_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
async function sha256hex(s: string){ const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join(""); }

export async function lectureToken(lectureId: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE_ROLE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`lecture-build:${lectureId}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function authorize(req: Request, sb: any): Promise<{ isService: boolean; userId?: string } | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  if (token === SERVICE_ROLE_KEY) return { isService: true };
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return null;
    return { isService: false, userId: data.user.id };
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, 500);
  if (!ASSEMBLYAI_API_KEY) return json({ error: "ASSEMBLYAI_API_KEY not configured" }, 500);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const auth = await authorize(req, sb);
  if (!auth) return json({ error: "Unauthorized: log in as the subject owner" }, 401);

  try {
    const formData = await req.formData();
    const video = formData.get("video") as File | null;
    const subject_id = formData.get("subject_id") as string;
    const subject_name = formData.get("subject_name") as string;
    const course_id = (formData.get("course_id") as string || "").trim();
    const lecture_title = formData.get("lecture_title") as string;
    const lecture_slug = formData.get("lecture_slug") as string;
    const is_public_str = formData.get("is_public") as string;
    const access_password = (formData.get("access_password") as string || "").trim();

    if (!video) return json({ error: "No video file provided" }, 400);
    if (!subject_id) return json({ error: "Missing subject_id" }, 400);
    if (!subject_name) return json({ error: "Missing subject_name" }, 400);
    if (!lecture_title) return json({ error: "Missing lecture_title" }, 400);
    if (!lecture_slug) return json({ error: "Missing lecture_slug" }, 400);

    // Ownership: a non-service caller may only create lectures for a subject they own.
    if (!auth.isService) {
      const { data: owned } = await sb.from("subject_profiles")
        .select("id").eq("id", subject_id).eq("user_id", auth.userId).maybeSingle();
      if (!owned) return json({ error: "Forbidden: you do not own this subject" }, 403);
    }

    const wants_public = is_public_str === "true";
    const access_mode = wants_public ? "public" : "private";
    const scholarSlug = slugify(subject_name);

    console.log(`[lecture-create] Start: ${lecture_title} (${(video.size / 1048576).toFixed(1)}MB) for ${subject_name}`);

    // 1. Upload video (public bucket so AssemblyAI + the page can read it)
    const storagePath = `${scholarSlug}/${lecture_slug}.mp4`;
    const videoBytes = await video.arrayBuffer();
    const { error: uploadErr } = await sb.storage.from("classroom-assets")
      .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: true });
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
    const video_url = sb.storage.from("classroom-assets").getPublicUrl(storagePath).data.publicUrl;
    console.log(`[lecture-create] Uploaded: ${video_url}`);

    // 2. Resolve chat function / portrait / voice from the subject profile
    const { data: sp } = await sb.from("subject_profiles")
      .select("edge_function_name, profile_image_url, voice_profile").eq("id", subject_id).single();
    const chat_edge_function = sp?.edge_function_name || "agent-chat";
    const portrait_url = sp?.profile_image_url || null;
    const voice_profile = sp?.voice_profile as Record<string, unknown> | null;
    let resolved_voice_id = (voice_profile as Record<string, string>)?.elevenlabs_voice_id || null;
    if (!resolved_voice_id) {
      const { data: prev } = await sb.from("classroom_lectures")
        .select("voice_id").eq("subject_id", subject_id)
        .not("voice_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (prev?.voice_id) resolved_voice_id = prev.voice_id;
    }

    // 3. Resolve course_name (fallback to lecture_title)
    let course_name = lecture_title;
    if (course_id) {
      const { data: course } = await sb.from("classroom_courses").select("course_name").eq("id", course_id).single();
      if (course?.course_name) course_name = course.course_name;
    }

    // 4. Insert the lecture row in 'transcribing' state (unpublished)
    const { data: lecture, error: lectureErr } = await sb.from("classroom_lectures").insert({
      subject_id, subject_slug: scholarSlug, lecture_slug, lecture_title, course_name,
      audio_url: video_url, video_url, slide_manifest: [], chat_edge_function,
      voice_id: resolved_voice_id, portrait_url,
      is_public: false, access_mode, access_password: null,
      status: "transcribing",
    }).select("id").single();
    if (lectureErr) {
      console.error("[lecture-create] insert error:", lectureErr);
      return json({ error: `Lecture insert failed: ${lectureErr.message}` }, 400);
    }
    const lectureId = lecture.id as string;

    // Private password -> hashed secret (never plaintext in the anon-readable row)
    if (!wants_public && access_password) {
      await sb.from("classroom_lecture_secrets").upsert({ lecture_id: lectureId, password_hash: await sha256hex(`${lectureId}:${access_password}`), updated_at: new Date().toISOString() });
    }

    // 5. Link to course if provided
    if (course_id) {
      const { count } = await sb.from("classroom_lecture_courses")
        .select("*", { count: "exact", head: true }).eq("course_id", course_id);
      const { error: linkErr } = await sb.from("classroom_lecture_courses")
        .insert({ lecture_id: lectureId, course_id, position: (count || 0) + 1 });
      if (linkErr) console.error(`[lecture-create] course link warning: ${linkErr.message}`);
    }

    // 6. Submit AssemblyAI job (HMAC webhook token; nothing secret stored in DB)
    const token = await lectureToken(lectureId);
    const webhookUrl = `${SUPABASE_URL}/functions/v1/lecture-build?lecture_id=${lectureId}`;
    try {
      const jobRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: { authorization: ASSEMBLYAI_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          audio_url: video_url,
          speech_models: ["universal"],
          webhook_url: webhookUrl,
          webhook_auth_header_name: "x-lecture-token",
          webhook_auth_header_value: token,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!jobRes.ok) throw new Error(`AAI job ${jobRes.status}: ${(await jobRes.text()).slice(0, 200)}`);
      const { id: tid } = await jobRes.json();
      await sb.from("classroom_lectures").update({ transcript_job_id: tid, updated_at: new Date().toISOString() }).eq("id", lectureId);
      console.log(`[lecture-create] AAI job ${tid} submitted; webhook -> ${webhookUrl}`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[lecture-create] AAI submit failed: ${msg}`);
      await sb.from("classroom_lectures").update({
        status: "failed", error_message: `Transcription could not start: ${msg}`.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", lectureId);
      return json({ lecture_id: lectureId, status: "failed", error: msg }, 200);
    }

    return json({ lecture_id: lectureId, status: "transcribing" });
  } catch (err) {
    console.error("[lecture-create] unhandled:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
