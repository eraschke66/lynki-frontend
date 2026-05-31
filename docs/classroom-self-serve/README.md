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

## Frontend — static HTML (built here: `html/portal.html`, `html/lecture.html`)
The professor self-serve UI is plain, dependency-light HTML that talks straight to
the edge functions (no framework/build step). `portal.html` covers steps 1–4 below;
`lecture.html` is the public viewer. See `html/README.md`. The flow:

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

## Security hardening (2026-05-31, student-privacy)
The professor-facing mutating endpoints were open (`verify_jwt=false`, no ownership
check). Hardened so student data can't be exposed by a stranger:
- **`lecture-create` (v7/v8)**, **`lecture-status` (v2)**, **`classroom-write` (v3)**
  now require the **subject owner's JWT** (`subject_profiles.user_id = auth.uid()`)
  or the **service-role key**. Without it they return `401`/`403`. This stops anyone
  from creating lectures under another subject, reading an unpublished/private
  lecture's video+prompt, or publishing a private classroom (which would expose its
  student feed). The authenticated portal already sends the owner JWT via
  `supabase-js`, so this is compatible; only unauthenticated callers are now rejected.
- **Webhook secret moved to HMAC.** The AssemblyAI callback token is now
  `HMAC-SHA256('lecture-build:'+lecture_id)` keyed by the service-role secret —
  recomputed and constant-time-compared in `lecture-build`. Nothing secret is stored
  in `classroom_lectures` (which is anon-readable), closing the build-injection vector.
- **`lecture-create` v8** also fixes the AssemblyAI param (`speech_models: ["universal"]`;
  `speech_model` is now rejected with HTTP 400 — caught by the smoke test below).

### Pre-existing holes found but NOT changed (need Erik's call — could break the live public frontend)
RLS lets the **anon key** do things well beyond this feature:
- `classroom_lectures` policy `"Anon read all lectures"` (`qual: true`) exposes every
  column of every lecture to anon, **including `access_password`** (defeats private-
  lecture protection). RLS can't hide a column; the safe fix is a view or column
  grants, with a frontend tweak — risky to apply blind.
- `subject_profiles`: `anon_read_subject_profiles` exposes PII (`subject_email`,
  `correction_pin_hash`, Stripe IDs); **`anon_update_subject_profiles` lets anyone
  rewrite any scholar's profile** (critical). Both are broader than this feature and
  likely load-bearing for the public chat frontend, so left for Erik to decide.

## Verification (2026-05-31) — pipeline passed end-to-end
Ran a real media file through the actual `lecture-create → AssemblyAI → lecture-build`
chain as Erik's subject (`erik-raschke`), driven server-side via `pg_net` (this
container can't reach the function host). Result row `autobuild-smoke-test`:
- `status = ready`; transcript 4,880 chars (real: *"Smoke from hundreds of wildfires
  in Canada…"*); `duration_seconds = 282`; WebVTT captions generated + uploaded;
  teaching prompt 4,102 chars containing `ENGAGEMENT STYLE: TEACH THROUGH CHALLENGE &
  CURIOSITY`; **14 seed Q&A rows** inserted (engagement-first, grounded, varied names).
- `classroom-feed` returns the seeds (HTTP 200, safe fields only — no `session_id`/
  `subject_id` leaked).
- `lecture-status` correctly returns **401** to an unauthenticated caller (auth gate
  verified live).

Caveats:
- **YouTube extraction is currently broken on the project.** `youtubei.js` (used by
  `youtube-audio-extract` and the throwaway test harness) **503s at boot** — YouTube's
  anti-bot/PoToken changes routinely break these libraries. So the literal "strip from
  YouTube" step needs the extractor repaired/upgraded first; the pipeline was proven
  with a direct public media URL instead. Repairing YouTube ingest is a separate task.
- The smoke-test artifacts remain under Erik's subject: lecture
  `/classroom/erik-raschke/autobuild-smoke-test` (unpublished) + its 14 seed rows.
  Delete with: `DELETE FROM classroom_lectures WHERE lecture_slug='autobuild-smoke-test';
  DELETE FROM conversation_logs WHERE page_url='/classroom/erik-raschke/autobuild-smoke-test';`
- The temporary `lecture-test-ingest` edge function was neutralized to an inert 410
  stub (no MCP delete-function tool exists); safe to delete from the dashboard.
- Full §5 acceptance (real professor upload through the Lovable form → playback in the
  browser → in-voice answer → publish/share) still needs the Lovable frontend work.

## Notes / follow-ups
- Build reliability depends on `ASSEMBLYAI_API_KEY` and `ANTHROPIC_API_KEY` secrets
  (already configured; both exercised successfully in the smoke test).
- The `classroom-assets` bucket must remain public-read so AssemblyAI can fetch the
  video by URL and the page can play it.
- `transcription_token` column is now unused (token is HMAC-derived); harmless to keep.
