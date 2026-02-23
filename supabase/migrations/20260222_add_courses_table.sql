-- =============================================================================
-- Add courses table and restructure around courses instead of documents
-- =============================================================================

-- 1. Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Course',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Users can view own courses"
    ON courses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
    ON courses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
    ON courses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
    ON courses FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Add course_id column to documents (nullable initially for backfill)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- 3. Backfill: Create one "Untitled Course" per user who has documents without a course
INSERT INTO courses (user_id, title, description)
SELECT DISTINCT user_id, 'Untitled Course', 'Auto-created for existing documents'
FROM documents
WHERE course_id IS NULL
ON CONFLICT DO NOTHING;

-- Assign orphaned documents to their user's "Untitled Course"
UPDATE documents d
SET course_id = c.id
FROM courses c
WHERE d.course_id IS NULL
  AND d.user_id = c.user_id
  AND c.title = 'Untitled Course'
  AND c.description = 'Auto-created for existing documents';

-- 4. Now make course_id NOT NULL
ALTER TABLE documents ALTER COLUMN course_id SET NOT NULL;

-- Index for course-document lookups
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);

-- 5. Add course_id to bkt_mastery (keeping document_id for granular tracking if needed later)
ALTER TABLE bkt_mastery ADD COLUMN IF NOT EXISTS course_id UUID;

-- Backfill bkt_mastery.course_id from documents
UPDATE bkt_mastery bm
SET course_id = d.course_id
FROM documents d
WHERE bm.document_id = d.id
  AND bm.course_id IS NULL;
