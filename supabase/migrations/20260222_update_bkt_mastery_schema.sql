-- 20260222_update_bkt_mastery_schema.sql
-- Ensures bkt_mastery table matches the BKT service expectations.
-- The actual table already has the correct columns (document_id, p_transit, n_attempts, n_correct, p_init).
-- This migration adds the missing unique constraint needed for upserts.

-- Unique constraint for BKT upserts (user + document + concept)
ALTER TABLE public.bkt_mastery
  ADD CONSTRAINT IF NOT EXISTS bkt_mastery_user_doc_kc_unique 
  UNIQUE (user_id, document_id, knowledge_component_id);

-- Index for efficient session/progress queries (user + document)
CREATE INDEX IF NOT EXISTS idx_bkt_mastery_user_doc
  ON public.bkt_mastery(user_id, document_id);
