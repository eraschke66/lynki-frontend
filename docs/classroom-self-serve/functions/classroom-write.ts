// classroom-write v4 — AUTHORIZED create/update of classroom_courses + classroom_lectures.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// v4: update_lecture stores access_password as a hash in classroom_lecture_secrets
// (service-role only); never plaintext in the anon-readable row.
// v3: every action now requires the subject owner's JWT (subject_profiles.user_id
// = auth.uid()) or the service-role key. Previously these writes were open —
// anyone could create courses or (via v2's update_lecture) publish a private
// lecture, exposing its student feed/video. Course actions and the update_lecture
// action (save edited teaching prompt / publish) are otherwise unchanged.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

async function sha256hex(s: string){ const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function ownsSubject(sb: any, subjectId: string, userId: string): Promise<boolean> {
  const { data } = await sb.from("subject_profiles").select("id").eq("id", subjectId).eq("user_id", userId).maybeSingle();
  return !!data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, 500);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const auth = await authorize(req, sb);
  if (!auth) return json({ error: "Unauthorized: log in as the subject owner" }, 401);

  try {
    const { action, course_id, lecture_id, payload } = await req.json();
    if (!action) return json({ error: "Missing action" }, 400);

    // ---- Lecture update (edit teaching prompt / publish) ----
    if (action === "update_lecture") {
      const id = lecture_id || payload?.lecture_id;
      if (!id) return json({ error: "Missing lecture_id for update_lecture" }, 400);

      const { data: lec, error: lecErr } = await sb.from("classroom_lectures").select("id, subject_id").eq("id", id).single();
      if (lecErr || !lec) return json({ error: "Lecture not found" }, 404);
      if (!auth.isService && !(await ownsSubject(sb, lec.subject_id, auth.userId!))) return json({ error: "Forbidden" }, 403);

      const p = payload || {};
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (p.teaching_mode_prompt !== undefined) updates.teaching_mode_prompt = p.teaching_mode_prompt;
      if (p.lecture_title !== undefined) updates.lecture_title = p.lecture_title;
      if (p.is_public !== undefined) updates.is_public = p.is_public;
      if (p.access_mode !== undefined) {
        if (p.access_mode !== "public" && p.access_mode !== "private") return json({ error: "access_mode must be 'public' or 'private'" }, 400);
        updates.access_mode = p.access_mode;
      }
      // Password -> hashed secret table; never plaintext in the anon-readable row.
      if (p.access_password !== undefined) {
        updates.access_password = null;
        if (p.access_password) await sb.from("classroom_lecture_secrets").upsert({ lecture_id: id, password_hash: await sha256hex(`${id}:${p.access_password}`), updated_at: new Date().toISOString() });
        else await sb.from("classroom_lecture_secrets").delete().eq("lecture_id", id);
      }
      if (Object.keys(updates).length === 1 && p.access_password === undefined) return json({ error: "No lecture fields to update" }, 400);

      const { data, error } = await sb.from("classroom_lectures").update(updates).eq("id", id)
        .select("id, lecture_slug, subject_slug, is_public, access_mode, status").single();
      if (error) { console.error("[classroom-write] lecture update error:", error); return json({ error: error.message }, 400); }
      console.log(`[classroom-write] Updated lecture ${id} (${Object.keys(updates).filter(k => k !== "updated_at").join(", ")})`);
      return json({ lecture_id: data.id, ...data });
    }

    // ---- Course actions ----
    if (!payload) return json({ error: "Missing payload" }, 400);
    if (!payload.subject_id) return json({ error: "Missing payload.subject_id" }, 400);
    if (!payload.course_slug) return json({ error: "Missing payload.course_slug" }, 400);
    if (!payload.course_name) return json({ error: "Missing payload.course_name" }, 400);

    if (action === "create") {
      if (!auth.isService && !(await ownsSubject(sb, payload.subject_id, auth.userId!))) return json({ error: "Forbidden: you do not own this subject" }, 403);
      const { data, error } = await sb.from("classroom_courses").insert({
        subject_id: payload.subject_id, course_slug: payload.course_slug, course_name: payload.course_name,
        description: payload.description || null, cover_image_url: payload.cover_image_url || null,
        term_label: payload.term_label || null, is_public: payload.is_public ?? false,
      }).select().single();
      if (error) { console.error("[classroom-write] insert error:", error); return json({ error: error.message }, 400); }
      console.log(`[classroom-write] Created course ${data.id}`);
      return json({ course_id: data.id, ...data });
    }

    if (action === "update") {
      if (!course_id) return json({ error: "Missing course_id for update" }, 400);
      const { data: existing, error: exErr } = await sb.from("classroom_courses").select("id, subject_id").eq("id", course_id).single();
      if (exErr || !existing) return json({ error: "Course not found" }, 404);
      if (!auth.isService && !(await ownsSubject(sb, existing.subject_id, auth.userId!))) return json({ error: "Forbidden" }, 403);

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.course_slug !== undefined) updates.course_slug = payload.course_slug;
      if (payload.course_name !== undefined) updates.course_name = payload.course_name;
      if (payload.description !== undefined) updates.description = payload.description;
      if (payload.cover_image_url !== undefined) updates.cover_image_url = payload.cover_image_url;
      if (payload.term_label !== undefined) updates.term_label = payload.term_label;
      if (payload.is_public !== undefined) updates.is_public = payload.is_public;

      const { data, error } = await sb.from("classroom_courses").update(updates).eq("id", course_id).select().single();
      if (error) { console.error("[classroom-write] update error:", error); return json({ error: error.message }, 400); }
      console.log(`[classroom-write] Updated course ${data.id}`);
      return json({ course_id: data.id, ...data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("[classroom-write] unhandled:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
