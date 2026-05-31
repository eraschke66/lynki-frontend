// lecture-import v1 — create a classroom lecture from a HOSTED video URL.
//
// Project: Shryn website (cmoamdistlpbahcryjda). Mirror of the deployed edge function.
//
// Sources: youtube | vimeo | url (direct media). Owner-authed (subject owner JWT or
// service-role key), same contract as lecture-create. Playback vs transcription split:
//   - PLAYBACK: youtube/vimeo embed the player (embed_url); 'url' plays the file.
//   - TRANSCRIPT:
//       youtube -> caption track (Innertube timedtext) -> inline VTT + transcript,
//                  then teaching prompt + seeds. No download. Needs the video to have captions.
//       vimeo   -> player config: progressive file URL -> AssemblyAI (webhook -> lecture-build).
//       url     -> AssemblyAI fetches the URL (webhook -> lecture-build).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ASSEMBLYAI_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const YT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"; // public Innertube web key

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(b: Record<string, unknown>, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
function slugify(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }

async function lectureToken(id: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE_ROLE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`lecture-build:${id}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function authorize(req: Request, sb: any) {
  const t = (req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if (!t) return null;
  if (t === SERVICE_ROLE_KEY) return { isService: true } as const;
  try { const { data, error } = await sb.auth.getUser(t); if (error || !data?.user) return null; return { isService: false, userId: data.user.id } as const; } catch { return null; }
}

function parseYouTubeId(u: string){ const m = u.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/) || u.match(/^([A-Za-z0-9_-]{11})$/); return m ? m[1] : null; }
function parseVimeoId(u: string){ const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/) || u.match(/^(\d+)$/); return m ? m[1] : null; }

function vttTime(ms: number){ const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60); return `${String(h).padStart(2,"0")}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}.${String(ms%1000).padStart(3,"0")}`; }
function buildVTT(cues: Array<{start:number;end:number;text:string}>){ const out=["WEBVTT",""]; for(const c of cues){ if(!c.text.trim())continue; out.push(`${vttTime(c.start)} --> ${vttTime(c.end)}`); out.push(c.text.trim()); out.push(""); } return out.join("\n"); }

async function youtubeTranscript(videoId: string){
  const pr = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${YT_KEY}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId, context: { client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "en" } } }),
    signal: AbortSignal.timeout(20000),
  });
  if (!pr.ok) throw new Error(`YouTube player ${pr.status}`);
  const j = await pr.json();
  const title = j?.videoDetails?.title || "YouTube lecture";
  const tracks = j?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) throw new Error("This YouTube video has no captions to transcribe. Enable captions on YouTube, or upload the file directly.");
  const track = tracks.find((t: any) => /^en/.test(t.languageCode) && t.kind !== "asr") || tracks.find((t: any) => /^en/.test(t.languageCode)) || tracks[0];
  const cr = await fetch(`${track.baseUrl}&fmt=json3`, { signal: AbortSignal.timeout(20000) });
  if (!cr.ok) throw new Error(`YouTube timedtext ${cr.status}`);
  const cj = await cr.json();
  const cues: Array<{start:number;end:number;text:string}> = [];
  for (const e of (cj.events || [])) {
    const text = (e.segs || []).map((s: any) => s.utf8 || "").join("");
    if (!text.trim()) continue;
    cues.push({ start: e.tStartMs || 0, end: (e.tStartMs || 0) + (e.dDurationMs || 2000), text });
  }
  const transcript = cues.map(c => c.text).join(" ").replace(/\s+/g, " ").trim();
  if (!transcript) throw new Error("YouTube captions were empty.");
  return { title, transcript, cues };
}

async function vimeoConfig(id: string){
  const r = await fetch(`https://player.vimeo.com/video/${id}/config`, { headers: { Referer: "https://vimeo.com/" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Vimeo config ${r.status} (is the video public / downloadable?)`);
  const j = await r.json();
  const prog = j?.request?.files?.progressive || [];
  const url = prog.length ? prog.sort((a: any, b: any) => (b.width||0)-(a.width||0))[0].url : null;
  return { title: j?.video?.title || "Vimeo lecture", progressive: url as string | null };
}

// Teaching prompt + seeds (shared logic with lecture-build).
async function teachingPrompt(transcript: string, voice: any, name: string){
  const fb = `You are ${name}. Teach this lecture in your authentic voice. Do not just state facts — challenge students with Socratic questions, surface tensions, and feed curiosity with vivid examples and provocations.`;
  if (!ANTHROPIC_API_KEY) return fb;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"x-api-key":ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
      body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:900, messages:[{role:"user", content:`You are writing a teaching_mode_prompt for an AI roleplaying as ${name} during a lecture Q&A.${voice?`\nVoice profile: ${JSON.stringify(voice).slice(0,1500)}`:""}\n\nLecture transcript (first 3500 chars):\n${transcript.slice(0,3500)}\n\nWrite a concise system prompt (<600 words). REQUIRED: an explicit ENGAGEMENT STYLE section — teach through challenge, Socratic questioning, and curiosity, never flat lecturing. Cover persona/voice, this lecture's topic, and boundaries. Output ONLY the prompt.`}] }),
      signal: AbortSignal.timeout(30000) });
    if(!r.ok) return fb; const d = await r.json(); return d.content?.[0]?.text || fb;
  } catch { return fb; }
}
function firstName(raw: unknown){ if(typeof raw!=="string")return "Anonymous"; const c=raw.replace(/[^A-Za-z\s'\-]/g,"").replace(/\s+/g," ").trim().split(" ")[0]||""; return (c.length<2||c.length>20)?"Anonymous":c[0].toUpperCase()+c.slice(1); }
async function seeds(prompt: string, transcript: string, name: string){
  if(!ANTHROPIC_API_KEY) return [];
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"x-api-key":ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
      body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:4000, system:`You are ${name}, answering students. Stay in character per:\n\n${prompt}`,
        messages:[{role:"user", content:`Generate a realistic "class questions" feed of 14 prior exchanges from THIS lecture.\n\nTranscript (first 4000 chars):\n${transcript.slice(0,4000)}\n\nRules: questions specific to this lecture, varied difficulty (some skeptical/pushing back); answers in ${name}'s voice and ENGAGEMENT-FIRST (challenge, Socratic follow-up, or vivid example), 2–5 sentences; realistic first names only.\n\nReturn ONLY a JSON array of 14 objects: [{"student_name":"...","question":"...","answer":"..."}]`}] }),
      signal: AbortSignal.timeout(60000) });
    if(!r.ok) return []; const d = await r.json(); let t=(d.content?.[0]?.text||"").trim(); const a=t.indexOf("["),b=t.lastIndexOf("]"); if(a<0||b<0)return [];
    const arr=JSON.parse(t.slice(a,b+1)); if(!Array.isArray(arr))return [];
    return arr.filter((x:any)=>x&&typeof x.question==="string"&&typeof x.answer==="string").map((x:any)=>({name:firstName(x.student_name),question:String(x.question).slice(0,500),answer:String(x.answer).slice(0,2000)}));
  } catch { return []; }
}
async function inlineBuild(sb:any, lecture:any, transcript:string, subjectName:string, voice:any){
  try {
    const prompt = await teachingPrompt(transcript, voice, subjectName);
    await sb.from("classroom_lectures").update({ status:"seeding", updated_at:new Date().toISOString() }).eq("id", lecture.id);
    const sd = await seeds(prompt, transcript, subjectName);
    if (sd.length) {
      const pageUrl = `/classroom/${lecture.subject_slug}/${lecture.lecture_slug}`; const now=Date.now();
      await sb.from("conversation_logs").insert(sd.map((s,i)=>({ subject_name:lecture.subject_slug, subject_id:lecture.subject_id, question:s.question, response:s.answer, page_url:pageUrl, is_demo:true, response_source:"classroom_seed", student_display_name:s.name, visibility:"public", created_at:new Date(now-(((i+1)/(sd.length+1))*8*864e5+Math.random()*6*36e5)).toISOString() })));
    }
    await sb.from("classroom_lectures").update({ teaching_mode_prompt:prompt, status:"ready", error_message:null, updated_at:new Date().toISOString() }).eq("id", lecture.id);
  } catch (e) {
    await sb.from("classroom_lectures").update({ status:"failed", error_message:String((e as Error).message).slice(0,500), updated_at:new Date().toISOString() }).eq("id", lecture.id);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SERVICE_ROLE_KEY) return json({ error: "SERVICE_ROLE_KEY not configured" }, 500);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const auth = await authorize(req, sb);
  if (!auth) return json({ error: "Unauthorized: log in as the subject owner" }, 401);

  try {
    const body = await req.json();
    let { source_type, url, subject_id, subject_name, course_id, lecture_title, lecture_slug, is_public, access_password } = body;
    if (!url || !subject_id || !subject_name || !lecture_slug) return json({ error: "url, subject_id, subject_name, lecture_slug required" }, 400);
    if (!source_type) source_type = /youtu/.test(url) ? "youtube" : /vimeo/.test(url) ? "vimeo" : "url";

    if (!auth.isService) {
      const { data: owned } = await sb.from("subject_profiles").select("id").eq("id", subject_id).eq("user_id", auth.userId).maybeSingle();
      if (!owned) return json({ error: "Forbidden: you do not own this subject" }, 403);
    }

    const scholarSlug = slugify(subject_name);
    const access_mode = is_public ? "public" : "private";
    const { data: sp } = await sb.from("subject_profiles").select("edge_function_name, profile_image_url, voice_profile, subject_name").eq("id", subject_id).single();
    const chat_edge_function = sp?.edge_function_name || "agent-chat";
    const voice_profile = sp?.voice_profile || null;
    let voice_id = (voice_profile as any)?.elevenlabs_voice_id || null;
    if (!voice_id) { const { data: prev } = await sb.from("classroom_lectures").select("voice_id").eq("subject_id", subject_id).not("voice_id","is",null).order("created_at",{ascending:false}).limit(1).maybeSingle(); voice_id = prev?.voice_id || null; }
    let course_name = lecture_title || "";
    if (course_id) { const { data: c } = await sb.from("classroom_courses").select("course_name").eq("id", course_id).single(); if (c?.course_name) course_name = c.course_name; }

    let embed_url: string | null = null, video_url = url, captionsCues: any = null, transcriptText: string | null = null, aaiAudioUrl: string | null = null, resolvedTitle = lecture_title;

    if (source_type === "youtube") {
      const id = parseYouTubeId(url); if (!id) return json({ error: "Could not parse YouTube id" }, 400);
      embed_url = `https://www.youtube.com/embed/${id}`; video_url = `https://www.youtube.com/watch?v=${id}`;
      const yt = await youtubeTranscript(id);
      transcriptText = yt.transcript; captionsCues = yt.cues; resolvedTitle = lecture_title || yt.title;
    } else if (source_type === "vimeo") {
      const id = parseVimeoId(url); if (!id) return json({ error: "Could not parse Vimeo id" }, 400);
      embed_url = `https://player.vimeo.com/video/${id}`; video_url = `https://vimeo.com/${id}`;
      const vc = await vimeoConfig(id); resolvedTitle = lecture_title || vc.title;
      if (!vc.progressive) return json({ error: "Vimeo did not expose a downloadable file for transcription. Enable file access on the video, add captions, or upload the file directly." }, 422);
      aaiAudioUrl = vc.progressive;
    } else {
      aaiAudioUrl = url;
    }
    if (!resolvedTitle) resolvedTitle = "Imported lecture";

    let captions_url: string | null = null, duration_seconds: number | null = null;
    if (captionsCues) {
      const vtt = buildVTT(captionsCues);
      const vttPath = `${scholarSlug}/${lecture_slug}.vtt`;
      await sb.storage.from("classroom-assets").upload(vttPath, new TextEncoder().encode(vtt), { contentType:"text/vtt", upsert:true });
      captions_url = sb.storage.from("classroom-assets").getPublicUrl(vttPath).data.publicUrl;
      duration_seconds = captionsCues.length ? Math.round(captionsCues[captionsCues.length-1].end/1000) : null;
    }

    const { data: lecture, error: insErr } = await sb.from("classroom_lectures").insert({
      subject_id, subject_slug: scholarSlug, lecture_slug, lecture_title: resolvedTitle, course_name: course_name || resolvedTitle,
      audio_url: video_url, video_url, embed_url, source_type, source_url: url,
      slide_manifest: [], chat_edge_function, voice_id, portrait_url: sp?.profile_image_url || null,
      is_public: false, access_mode, access_password: is_public ? null : (access_password || null),
      transcript: transcriptText, captions_url, duration_seconds,
      status: captionsCues ? "generating_prompt" : "transcribing",
    }).select("id, subject_slug, lecture_slug, subject_id").single();
    if (insErr) return json({ error: `Insert failed: ${insErr.message}` }, 400);

    if (course_id) {
      const { count } = await sb.from("classroom_lecture_courses").select("*",{count:"exact",head:true}).eq("course_id", course_id);
      await sb.from("classroom_lecture_courses").insert({ lecture_id: lecture.id, course_id, position:(count||0)+1 });
    }

    if (captionsCues) {
      const work = inlineBuild(sb, lecture, transcriptText!, sp?.subject_name || subject_name, voice_profile);
      // @ts-ignore
      if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any)?.waitUntil) (EdgeRuntime as any).waitUntil(work); else await work;
      return json({ lecture_id: lecture.id, status: "generating_prompt", source_type });
    }

    const token = await lectureToken(lecture.id);
    const jr = await fetch("https://api.assemblyai.com/v2/transcript", { method:"POST", headers:{ authorization: ASSEMBLYAI_API_KEY, "content-type":"application/json" },
      body: JSON.stringify({ audio_url: aaiAudioUrl, speech_models:["universal"], webhook_url:`${SUPABASE_URL}/functions/v1/lecture-build?lecture_id=${lecture.id}`, webhook_auth_header_name:"x-lecture-token", webhook_auth_header_value: token }),
      signal: AbortSignal.timeout(20000) });
    if (!jr.ok) { const m = `AAI job ${jr.status}: ${(await jr.text()).slice(0,200)}`; await sb.from("classroom_lectures").update({ status:"failed", error_message:m.slice(0,500) }).eq("id", lecture.id); return json({ lecture_id: lecture.id, status:"failed", error:m }, 200); }
    const { id: tid } = await jr.json();
    await sb.from("classroom_lectures").update({ transcript_job_id: tid }).eq("id", lecture.id);
    return json({ lecture_id: lecture.id, status: "transcribing", source_type });
  } catch (err) {
    console.error("[lecture-import] unhandled:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
