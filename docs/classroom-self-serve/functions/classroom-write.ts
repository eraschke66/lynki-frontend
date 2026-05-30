// classroom-write v2 — create/update classroom_courses AND update classroom_lectures.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// v2 adds the 'update_lecture' action so the portal preview step can (a) save an
// edited teaching_mode_prompt before publishing and (b) Publish the lecture by
// flipping is_public / access_mode / access_password. There was previously no
// edge path to write a lecture row (classroom-set-visibility only flips student
// conversation_logs rows), so the self-serve publish/edit flow needs this.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, 500);

  try {
    const { action, course_id, lecture_id, payload } = await req.json();
    if (!action) return json({ error: "Missing action" }, 400);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ---- Lecture update (edit teaching prompt / publish) ----
    if (action === "update_lecture") {
      const id = lecture_id || payload?.lecture_id;
      if (!id) return json({ error: "Missing lecture_id for update_lecture" }, 400);
      const p = payload || {};

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (p.teaching_mode_prompt !== undefined) updates.teaching_mode_prompt = p.teaching_mode_prompt;
      if (p.lecture_title !== undefined) updates.lecture_title = p.lecture_title;
      if (p.is_public !== undefined) updates.is_public = p.is_public;
      if (p.access_mode !== undefined) {
        if (p.access_mode !== "public" && p.access_mode !== "private") {
          return json({ error: "access_mode must be 'public' or 'private'" }, 400);
        }
        updates.access_mode = p.access_mode;
      }
      if (p.access_password !== undefined) updates.access_password = p.access_password || null;

      if (Object.keys(updates).length === 1) return json({ error: "No lecture fields to update" }, 400);

      const { data, error } = await sb.from("classroom_lectures")
        .update(updates).eq("id", id)
        .select("id, lecture_slug, subject_slug, is_public, access_mode, status").single();
      if (error) {
        console.error("[classroom-write] lecture update error:", error);
        return json({ error: error.message }, 400);
      }
      console.log(`[classroom-write] Updated lecture ${id} (${Object.keys(updates).filter(k => k !== "updated_at").join(", ")})`);
      return json({ lecture_id: data.id, ...data });
    }

    // ---- Course actions (unchanged behavior) ----
    if (!payload) return json({ error: "Missing payload" }, 400);
    if (!payload.subject_id) return json({ error: "Missing payload.subject_id" }, 400);
    if (!payload.course_slug) return json({ error: "Missing payload.course_slug" }, 400);
    if (!payload.course_name) return json({ error: "Missing payload.course_name" }, 400);

    if (action === "create") {
      const { data, error } = await sb.from("classroom_courses").insert({
        subject_id: payload.subject_id,
        course_slug: payload.course_slug,
        course_name: payload.course_name,
        description: payload.description || null,
        cover_image_url: payload.cover_image_url || null,
        term_label: payload.term_label || null,
        is_public: payload.is_public ?? false,
      }).select().single();
      if (error) {
        console.error("[classroom-write] insert error:", error);
        return json({ error: error.message }, 400);
      }
      console.log(`[classroom-write] Created course ${data.id}`);
      return json({ course_id: data.id, ...data });
    }

    if (action === "update") {
      if (!course_id) return json({ error: "Missing course_id for update" }, 400);
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.course_slug !== undefined) updates.course_slug = payload.course_slug;
      if (payload.course_name !== undefined) updates.course_name = payload.course_name;
      if (payload.description !== undefined) updates.description = payload.description;
      if (payload.cover_image_url !== undefined) updates.cover_image_url = payload.cover_image_url;
      if (payload.term_label !== undefined) updates.term_label = payload.term_label;
      if (payload.is_public !== undefined) updates.is_public = payload.is_public;

      const { data, error } = await sb.from("classroom_courses")
        .update(updates).eq("id", course_id).select().single();
      if (error) {
        console.error("[classroom-write] update error:", error);
        return json({ error: error.message }, 400);
      }
      console.log(`[classroom-write] Updated course ${data.id}`);
      return json({ course_id: data.id, ...data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("[classroom-write] unhandled:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
