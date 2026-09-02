-- Migration: 20260902000001_topic_tending_progress_columns.sql
-- Adds the two columns needed to persist per-stage Tending Flow progress
-- that were previously never written anywhere:
--   - mnemonic_results: mnemonic stage self-ratings (accepted by /complete's
--     request schema but silently dropped before this migration).
--   - quiz_results: the embedded quiz stage's summary (correct/total/
--     question_ids), needed so a resumed session's /complete call can tell
--     the quiz already ran and avoid double-applying the soft-BKT nudge.

ALTER TABLE topic_tending_sessions
  ADD COLUMN mnemonic_results JSONB DEFAULT '[]',
  ADD COLUMN quiz_results JSONB DEFAULT NULL;
