-- Migration: classroom_lectures_async_build_status
-- Project: Shryn website (cmoamdistlpbahcryjda). Applied 2026-05-30 via Supabase MCP.
-- Adds async build-status tracking + transcription-webhook plumbing.
-- All additive / backward compatible: existing rows default to 'ready'.

ALTER TABLE public.classroom_lectures
  ADD COLUMN IF NOT EXISTS status              text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS error_message       text,
  ADD COLUMN IF NOT EXISTS transcript_job_id   text,
  ADD COLUMN IF NOT EXISTS transcription_token text;

-- These three are now populated asynchronously (after transcription), so they
-- can no longer be NOT NULL at insert time. Existing rows already have values.
ALTER TABLE public.classroom_lectures
  ALTER COLUMN transcript           DROP NOT NULL,
  ALTER COLUMN duration_seconds     DROP NOT NULL,
  ALTER COLUMN teaching_mode_prompt DROP NOT NULL;

COMMENT ON COLUMN public.classroom_lectures.status IS
  'Build pipeline state: uploading | transcribing | generating_prompt | seeding | ready | failed. Defaults to ready for legacy rows.';
COMMENT ON COLUMN public.classroom_lectures.error_message IS
  'Human-readable reason the build failed (shown to the professor). Null unless status = failed.';
COMMENT ON COLUMN public.classroom_lectures.transcript_job_id IS
  'AssemblyAI transcript id for the async transcription job.';
COMMENT ON COLUMN public.classroom_lectures.transcription_token IS
  'Random per-lecture secret; the AssemblyAI webhook (lecture-build) must echo it to be trusted.';

-- Migration: classroom_lectures_video_source (applied 2026-05-31)
-- Video source connectors (upload | youtube | vimeo | url). Hosted sources embed
-- the player; uploads use video_url.
ALTER TABLE public.classroom_lectures
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS source_url  text,
  ADD COLUMN IF NOT EXISTS embed_url   text;
COMMENT ON COLUMN public.classroom_lectures.source_type IS 'upload | youtube | vimeo | url (legacy rows = upload).';
COMMENT ON COLUMN public.classroom_lectures.source_url  IS 'Original professor-supplied URL.';
COMMENT ON COLUMN public.classroom_lectures.embed_url   IS 'Player embed URL for hosted sources; null for uploads.';

-- Migration: classroom_privacy_hardening (applied 2026-05-31)
-- (1) Close critical hole: anon could UPDATE any subject_profiles row.
DROP POLICY IF EXISTS anon_update_subject_profiles ON public.subject_profiles;
-- (2) Per-lecture passwords as hashes in a service-role-only table (never readable
--     via the anon key, unlike classroom_lectures.access_password).
CREATE TABLE IF NOT EXISTS public.classroom_lecture_secrets (
  lecture_id    uuid PRIMARY KEY REFERENCES public.classroom_lectures(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classroom_lecture_secrets ENABLE ROW LEVEL SECURITY; -- no policies => service-role only
-- (3) Clear any plaintext from the anon-readable column.
UPDATE public.classroom_lectures SET access_password = NULL WHERE access_password IS NOT NULL;
