-- Migration: course_quizzes generation status
--
-- Gives on-demand quiz generation a real lifecycle in the DB (mirrors the
-- generation_status pattern already used on the legacy `quizzes` table), so:
--   - a crashed/killed generation is a visible 'failed' row instead of a
--     "Generating..." placeholder stranded forever
--   - the frontend can poll status instead of blocking on a single request
--   - quiz_attempts_service can refuse to start an attempt on a quiz that
--     isn't actually ready yet, instead of silently creating a 0-question one
--
-- Apply in Supabase SQL editor.

ALTER TABLE public.course_quizzes
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'generating'
        CHECK (status IN ('generating', 'completed', 'failed')),
    ADD COLUMN IF NOT EXISTS error_message text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill: every pre-existing row was only ever written by the old
-- synchronous flow after generation had already produced (or failed to
-- produce) questions, so there is no real "still generating" backlog.
UPDATE public.course_quizzes
SET status = 'completed', updated_at = created_at
WHERE total_questions > 0;

UPDATE public.course_quizzes
SET status = 'failed',
    error_message = 'Backfilled: no questions were ever generated for this quiz.',
    updated_at = created_at
WHERE total_questions = 0;

-- Supports the watchdog sweep (status = 'generating' AND updated_at < cutoff).
CREATE INDEX IF NOT EXISTS idx_course_quizzes_generating_updated_at
    ON public.course_quizzes (updated_at)
    WHERE status = 'generating';

COMMENT ON COLUMN public.course_quizzes.status IS 'Lifecycle of on-demand quiz generation: generating, completed, failed';
COMMENT ON COLUMN public.course_quizzes.error_message IS 'Populated when status = failed';
