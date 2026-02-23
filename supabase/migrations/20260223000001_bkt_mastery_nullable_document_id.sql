-- Migration: Make document_id nullable on bkt_mastery
-- Mastery is now course-scoped. document_id is optional metadata
-- that can be derived from concept → topic → document chain.

ALTER TABLE public.bkt_mastery ALTER COLUMN document_id DROP NOT NULL;

-- Drop the old document-scoped unique constraint (replaced by course-scoped one)
ALTER TABLE public.bkt_mastery DROP CONSTRAINT IF EXISTS bkt_mastery_user_doc_kc_unique;
