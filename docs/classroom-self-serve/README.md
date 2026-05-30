# Classroom self-serve auto-build — backend implementation record

> **Where this lives:** the edge functions and table described here belong to the
> **Shryn website** Supabase project (`cmoamdistlpbahcryjda`), *not* to this repo's
> project. This document is the source-of-truth record of what was deployed via the
> Supabase MCP and the **integration contract** the classroom frontend (Lovable,
> `classroom.shryn.ai`) needs for its half of the work. The runtime source for each
> function is mirrored in this folder for traceability — the live copy is the deployed
> edge function.

Implements the "CC" scope of the self-serve auto-build spec: make the lecture build
asynchronous and reliable, seed the Q&A feed so a new page reads alive, and give the
preview/publish flow an edge path. The Lovable "frontend only" scope (form polling,
progress UI, preview step) is unchanged here and is tracked separately.

## What changed (deployed 2026-05-30)

### Migration — `classroom_lectures_async_build_status`
Added to `public.classroom_lectures`:
- `status text NOT NULL DEFAULT 'ready'` — build state: `transcribing → generating_prompt → seeding → ready`, or `failed`. Legacy rows default to `ready` so existing pages are unaffected.
- `error_message text` — human-readable failure reason (null unless `status = 'failed'`).
- `transcript_job_id text` — AssemblyAI transcript id.
- `transcription_token text` — per-lecture secret the AssemblyAI webhook must echo.

Dropped `NOT NULL` on `transcript`, `duration_seconds`, `teaching_mode_prompt` (now
populated asynchronously, after transcription).

### `lecture-create` (v6) — fast synchronous path only
Why: v5 polled AssemblyAI inline for up to 5 minutes inside one request, which
exceeds the edge wall-clock limit and dies on real (long) lectures. v6 does only the
fast work and returns immediately:

1. Validate input, upload the video to `classroom-assets/{subject-slug}/{slug}.mp4`.
2. Insert a `classroom_lectures` row with `status='transcribing'`, **unpublished**
   (`is_public=false`). The professor's public/private choice is preserved as
   `access_mode` (+ `access_password`) and applied on Publish — the build never
   auto-publishes (spec §3.3).
3. Submit an AssemblyAI job that **fetches the public video URL directly** (no
   re-upload of bytes to AAI) and calls the `lecture-build` webhook on completion.
4. Return `{ lecture_id, status: 'transcribing' }`.

> **Frontend contract change:** the old response (`{ lecture_id, video_url,
> captions_url, teaching_mode_prompt }`) is gone. The form must now poll
> `lecture-status` until `status` is `ready` or `failed`.

### `lecture-build` (v2, NEW) — AssemblyAI webhook receiver / build finisher
`verify_jwt=false` (AssemblyAI can't send a JWT). Authorized by `?lecture_id=` +
`x-lecture-token` header matching `transcription_token`. On a completed transcript it:

1. Atomically **claims** the job (`transcribing → generating_prompt`) so a retried/
   concurrent webhook delivery can't double-seed.
2. Acknowledges fast and runs the rest in `EdgeRuntime.waitUntil` so AssemblyAI's
   short webhook timeout never triggers a retry mid-build.
3. Fetches the transcript + word timestamps, builds WebVTT, uploads captions.
4. Drafts the `teaching_mode_prompt` (Claude Haiku) — now with an explicit
   **engagement-style** instruction (challenge / Socratic / curiosity), not flat
   statements (spec §3.4).
5. **Seeds 14 starter Q&A rows** into `conversation_logs` (`response_source =
   'classroom_seed'`, `visibility='public'`, backdated across ~8 days) so the
   "Class questions" feed reads as prior class activity, also engagement-first (§3.2).
6. Writes `transcript`, `duration_seconds`, `captions_url`, `teaching_mode_prompt`
   and flips `status='ready'`. Any failure sets `status='failed'` + `error_message`.

### `lecture-status` (v1, NEW) — poll endpoint
`GET ?lecture_id=` → `{ status, error_message, subject_slug, lecture_slug,
lecture_title, is_public, access_mode, video_url, captions_url, teaching_mode_prompt,
duration_seconds, preview_url }`. URLs/prompt are only returned once `ready`.

### `classroom-write` (v2) — lecture write path added
New action `update_lecture` (existing course `create`/`update` actions unchanged):
```jsonc
{ "action": "update_lecture",
  "lecture_id": "...",
  "payload": { "teaching_mode_prompt": "...",   // save edited prompt (preview step)
               "lecture_title": "...",
               "is_public": true,                // Publish
               "access_mode": "public|private",
               "access_password": "..." } }
```
There was previously no edge path to write a lecture row — `classroom-set-visibility`
only flips student `conversation_logs` rows, not lectures.

## Frontend (Lovable) integration — the remaining "frontend only" work
Guards for every Lovable prompt: do not create/modify edge functions; do not modify
Serge; no bulk client-side DB operations.

1. **New lecture form** → multipart POST to `lecture-create` (fields: `video`,
   `subject_id`, `subject_name`, `course_id?`, `lecture_title`, `lecture_slug`,
   `is_public`, `access_password?`). Take `lecture_id` from the response.
2. **Poll** `lecture-status?lecture_id=…` every ~3s. Drive progress UI from `status`
   (`transcribing/generating_prompt/seeding`); show `error_message` on `failed`.
3. **Preview step** (`ready`): play `video_url` (the `<video>` tag needs
   `crossOrigin="anonymous"` for captions; storage serves `accept-ranges: bytes` for
   scrubbing), toggle `captions_url`, exercise the Q&A panel (`classroom-ask`), show
   the `teaching_mode_prompt` in an editable box → save via `classroom-write`
   `update_lecture`.
4. **Publish / Share**: `classroom-write` `update_lecture` with `is_public:true`
   (+ `access_mode`/`access_password`); Share link is
   `shryn.ai/classroom/{subject-slug}/{lecture-slug}`.

## Verification status
- Migration applied; legacy rows confirmed `status='ready'`.
- All four functions deployed (compiled clean).
- Full end-to-end (real lecture upload through the form → `ready` → playback,
  captions, in-voice answer, seed feed, publish) is the spec §5 acceptance test and
  still requires a real professor-account run through the Lovable form. **Built but
  unverified** until that pass.

## Notes / follow-ups
- `lecture-create` keeps `verify_jwt=false` (matches v5 and the existing form). It is
  therefore callable unauthenticated, which can trigger billable transcription. This
  is the pre-existing posture; tightening auth is out of scope here but worth a future
  pass.
- Build reliability depends on the `ASSEMBLYAI_API_KEY` and `ANTHROPIC_API_KEY`
  secrets already configured on the project (used by v5 and `classroom-ask`).
- The `classroom-assets` bucket must remain public-read so AssemblyAI can fetch the
  video by URL and the page can play it.
