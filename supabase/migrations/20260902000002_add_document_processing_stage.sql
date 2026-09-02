-- Granular sub-status for document processing, so the frontend can show a
-- staged, narrated wait ("Extracting text..." -> "Analyzing...") instead of
-- one static "Processing" spinner for the whole ~1-2 minute pipeline.
--
-- processing_started_at is stamped fresh on every processing attempt
-- (including retries) so elapsed time can be computed client-side instead
-- of faking a progress animation.

alter table documents
  add column processing_stage text check (processing_stage in ('extracting', 'analyzing')),
  add column processing_started_at timestamptz;
