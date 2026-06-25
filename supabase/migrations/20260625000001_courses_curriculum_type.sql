-- Per-course curriculum override (consumed by PR #37).
-- Each course may carry its own curriculum; NULL means "inherit the account
-- default" (user_profiles.curriculum). The frontend maps ib/ap/gcse <-> IB/AP/GCSE
-- and sends NULL for percentage / A-Level (no DB slot yet) — see src/lib/curricula.ts.
--
-- NOTE: this column + constraint already exist on the live project
-- (uvvcniogunfacurkhyid); they were applied directly via the dashboard/MCP and were
-- never captured in a migration. This file backfills that history, so it is written
-- idempotently and is a no-op against the live DB.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_type TEXT;

-- CHECK: NULL (inherit) or one of the DB-supported curricula.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_curriculum_type'
          AND conrelid = 'public.courses'::regclass
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT valid_curriculum_type
            CHECK (curriculum_type IS NULL OR curriculum_type IN ('IB', 'AP', 'GCSE'));
    END IF;
END $$;
