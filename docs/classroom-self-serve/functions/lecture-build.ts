// lecture-build v2 — AssemblyAI transcription webhook receiver + async build finisher.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// Triggered by AssemblyAI when a transcript submitted by lecture-create completes.
// Does the slow/heavy work that used to block lecture-create synchronously:
//   1. Fetch the finished transcript (text + word timestamps).
//   2. Generate WebVTT captions and upload them.
//   3. Draft the teaching_mode_prompt (Claude Haiku, engagement-first).
//   4. Seed 12–18 starter Q&A rows into conversation_logs (backdated).
//   5. Flip classroom_lectures.status to 'ready' (or 'failed' with a reason).
//
// v2: acknowledge the webhook FAST and run the build in EdgeRuntime.waitUntil,
// so AssemblyAI's short webhook timeout never fires a retry mid-build. The job
// is claimed atomically (status transcribing -> generating_prompt) so concurrent
// webhook deliveries can't double-seed.
//
// Auth: no JWT (AssemblyAI can't send one). The webhook URL carries ?lecture_id=
// and AssemblyAI echoes a per-lecture secret in 'x-lecture-token' which must
// match classroom_lectures.transcription_token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ASSEMBLYAI_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lecture-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function formatVTTTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const rem_ms = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(rem_ms).padStart(3, "0")}`;
}

function generateVTT(words: Array<{ text: string; start: number; end: number }>): string {
  if (!words.length) return "WEBVTT\n";
  const lines: string[] = ["WEBVTT", ""];
  const cueSize = 8;
  for (let i = 0; i < words.length; i += cueSize) {
    const chunk = words.slice(i, i + cueSize);
    lines.push(`${formatVTTTime(chunk[0].start)} --> ${formatVTTTime(chunk[chunk.length - 1].end)}`);
    lines.push(chunk.map(w => w.text).join(" "));
    lines.push("");
  }
  return lines.join("\n");
}

async function generateTeachingPrompt(transcript: string, voiceProfile: Record<string, unknown> | null, subjectName: string): Promise<string> {
  const fallback = `You are ${subjectName}. Teach this lecture material in your authentic voice. Do not just state facts — challenge students with Socratic questions, surface tensions in the material, and feed their curiosity with vivid examples and follow-up provocations.`;
  if (!ANTHROPIC_API_KEY) return fallback;
  const voiceCtx = voiceProfile ? `\nVoice profile: ${JSON.stringify(voiceProfile).slice(0, 1500)}` : "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 900,
        messages: [{
          role: "user",
          content: `You are writing a teaching_mode_prompt for an AI that roleplays as ${subjectName} during a classroom lecture Q&A. The AI must stay in character, reference this lecture's material, and engage students pedagogically.${voiceCtx}\n\nLecture transcript (first 3500 chars):\n${transcript.slice(0, 3500)}\n\nWrite a concise system prompt (under 600 words) instructing the AI how to behave as this scholar in the lecture. REQUIRED: an explicit ENGAGEMENT STYLE section directing the AI to teach through challenge, Socratic questioning, and curiosity — never flat declarative lecturing. It should push back, ask the student a sharpening question, and offer a concrete example or provocation rather than only stating conclusions. Also cover: persona/voice, awareness of this lecture's topic, and boundaries (stay on the material, admit uncertainty in character). Output ONLY the prompt text, no preamble.`
        }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.error(`[lecture-build] Claude prompt ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return fallback;
    }
    const data = await res.json();
    return data.content?.[0]?.text || fallback;
  } catch (e) {
    console.error(`[lecture-build] prompt gen err: ${(e as Error).message}`);
    return fallback;
  }
}

function sanitizeFirstName(raw: unknown): string {
  if (typeof raw !== "string") return "Anonymous";
  const cleaned = raw.replace(/[^A-Za-z\s'\-]/g, "").replace(/\s+/g, " ").trim();
  const first = cleaned.split(" ")[0] || "";
  if (first.length < 2 || first.length > 20) return "Anonymous";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

async function generateSeeds(teachingPrompt: string, transcript: string, subjectName: string): Promise<Array<{ name: string; question: string; answer: string }>> {
  if (!ANTHROPIC_API_KEY) return [];
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: `You are ${subjectName}, answering students in a lecture. Stay fully in character per this teaching prompt:\n\n${teachingPrompt}`,
        messages: [{
          role: "user",
          content: `Generate a realistic \"class questions\" feed of 14 prior student exchanges from THIS lecture, so a new visitor sees a living classroom, not an empty page.\n\nLecture transcript (first 4000 chars for grounding):\n${transcript.slice(0, 4000)}\n\nRules:\n- Questions must be specific to this lecture's actual content, varied in difficulty (some curious/basic, some sharp/challenging, a couple skeptical or pushing back).\n- Each answer must be in ${subjectName}'s authentic voice and ENGAGEMENT-FIRST: do not merely state facts. Challenge the student, ask a Socratic follow-up, or offer a vivid example/provocation. 2–5 sentences.\n- Student names: realistic, varied first names only.\n\nReturn ONLY a JSON array of exactly 14 objects, no prose, no markdown fences:\n[{\"student_name\":\"...\",\"question\":\"...\",\"answer\":\"...\"}]`
        }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      console.error(`[lecture-build] Claude seeds ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return [];
    }
    const data = await res.json();
    let txt = (data.content?.[0]?.text || "").trim();
    const start = txt.indexOf("[");
    const end = txt.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    txt = txt.slice(start, end + 1);
    const arr = JSON.parse(txt);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x: any) => x && typeof x.question === "string" && typeof x.answer === "string")
      .map((x: any) => ({
        name: sanitizeFirstName(x.student_name),
        question: String(x.question).slice(0, 500),
        answer: String(x.answer).slice(0, 2000),
      }));
  } catch (e) {
    console.error(`[lecture-build] seed gen err: ${(e as Error).message}`);
    return [];
  }
}

async function fail(sb: any, lectureId: string, message: string) {
  console.error(`[lecture-build] FAILED ${lectureId}: ${message}`);
  await sb.from("classroom_lectures").update({
    status: "failed",
    error_message: message.slice(0, 500),
    updated_at: new Date().toISOString(),
  }).eq("id", lectureId);
}

async function runBuild(sb: any, lecture: any, transcriptId: string) {
  const lectureId = lecture.id as string;
  try {
    // 1. Fetch finished transcript
    const tRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: ASSEMBLYAI_API_KEY },
      signal: AbortSignal.timeout(30000),
    });
    if (!tRes.ok) throw new Error(`AAI fetch ${tRes.status}: ${(await tRes.text()).slice(0, 200)}`);
    const t = await tRes.json();
    if (t.status === "error") throw new Error(`AAI error: ${t.error}`);
    if (t.status !== "completed") throw new Error(`AAI not completed (status=${t.status})`);

    const transcript: string = t.text || "";
    const words: Array<{ text: string; start: number; end: number }> = t.words || [];
    const duration_seconds = t.audio_duration ? Math.round(t.audio_duration) : (words.length ? Math.round(words[words.length - 1].end / 1000) : 0);

    // 2. WebVTT
    const vtt = generateVTT(words);
    const vttPath = `${lecture.subject_slug}/${lecture.lecture_slug}.vtt`;
    const { error: vttErr } = await sb.storage.from("classroom-assets")
      .upload(vttPath, new TextEncoder().encode(vtt), { contentType: "text/vtt", upsert: true });
    if (vttErr) console.error(`[lecture-build] VTT upload warning: ${vttErr.message}`);
    const captions_url = sb.storage.from("classroom-assets").getPublicUrl(vttPath).data.publicUrl;

    // 3. Teaching prompt
    const { data: sp } = await sb.from("subject_profiles")
      .select("subject_name, voice_profile").eq("id", lecture.subject_id).single();
    const subjectName = sp?.subject_name || lecture.subject_slug;
    const voiceProfile = (sp?.voice_profile as Record<string, unknown> | null) || null;
    const teaching_mode_prompt = await generateTeachingPrompt(transcript, voiceProfile, subjectName);

    // 4. Seed feed
    await sb.from("classroom_lectures").update({ status: "seeding", updated_at: new Date().toISOString() }).eq("id", lectureId);
    const seeds = await generateSeeds(teaching_mode_prompt, transcript, subjectName);
    if (seeds.length) {
      const pageUrl = `/classroom/${lecture.subject_slug}/${lecture.lecture_slug}`;
      const now = Date.now();
      const rows = seeds.map((s, i) => {
        const ageMs = ((i + 1) / (seeds.length + 1)) * 8 * 24 * 60 * 60 * 1000 + Math.random() * 6 * 60 * 60 * 1000;
        return {
          subject_name: lecture.subject_slug,
          subject_id: lecture.subject_id,
          question: s.question,
          response: s.answer,
          page_url: pageUrl,
          is_demo: true,
          response_source: "classroom_seed",
          student_display_name: s.name,
          visibility: "public",
          created_at: new Date(now - ageMs).toISOString(),
        };
      });
      const { error: seedErr } = await sb.from("conversation_logs").insert(rows);
      if (seedErr) console.error(`[lecture-build] seed insert warning: ${seedErr.message}`);
      else console.log(`[lecture-build] seeded ${rows.length} Q&A rows for ${pageUrl}`);
    }

    // 5. Finalize
    const { error: finErr } = await sb.from("classroom_lectures").update({
      transcript,
      duration_seconds,
      captions_url,
      teaching_mode_prompt,
      status: "ready",
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", lectureId);
    if (finErr) throw new Error(`Finalize update failed: ${finErr.message}`);
    console.log(`[lecture-build] READY ${lectureId} (${duration_seconds}s, ${transcript.length} chars, ${seeds.length} seeds)`);
  } catch (err) {
    await fail(sb, lectureId, (err as Error).message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!SERVICE_ROLE_KEY) return json({ error: "SERVICE_ROLE_KEY not configured" }, 500);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const lectureId = url.searchParams.get("lecture_id");
  const token = req.headers.get("x-lecture-token") || "";
  if (!lectureId) return json({ error: "lecture_id required" }, 400);

  const { data: lecture, error: lecErr } = await sb.from("classroom_lectures")
    .select("id, subject_id, subject_slug, lecture_slug, transcript_job_id, transcription_token, status")
    .eq("id", lectureId).single();
  if (lecErr || !lecture) return json({ error: "Lecture not found" }, 404);
  if (!lecture.transcription_token || !timingSafeEqual(token, lecture.transcription_token)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: any = {};
  try { payload = await req.json(); } catch (_) { /* AssemblyAI sends JSON */ }
  const transcriptId = payload.transcript_id || lecture.transcript_job_id;
  const aaiStatus = payload.status;

  if (aaiStatus === "error") {
    await fail(sb, lectureId, `AssemblyAI error: ${payload.error || "unknown"}`);
    return json({ ok: true });
  }
  if (!transcriptId) return json({ error: "No transcript_id" }, 400);

  // Atomically claim the job so concurrent / retried webhook deliveries can't
  // run the build twice (which would double-seed the feed). Only the delivery
  // that flips 'transcribing' -> 'generating_prompt' proceeds.
  const { data: claimed } = await sb.from("classroom_lectures")
    .update({ status: "generating_prompt", updated_at: new Date().toISOString() })
    .eq("id", lectureId).eq("status", "transcribing").select("id");
  if (!claimed || claimed.length === 0) {
    return json({ ok: true, note: "already claimed or finished" });
  }

  // Acknowledge fast; finish the heavy build in the background so AssemblyAI's
  // webhook timeout never fires a retry.
  const work = runBuild(sb, lecture, transcriptId);
  // @ts-ignore EdgeRuntime is a Supabase global
  if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any)?.waitUntil) {
    // @ts-ignore
    (EdgeRuntime as any).waitUntil(work);
  } else {
    await work;
  }
  return json({ ok: true, status: "building" });
});
