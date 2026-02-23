-- Add unique constraint on (user_id, course_id, knowledge_component_id) for course-scoped BKT mastery
-- This is needed for upsert operations now that mastery is scoped by course, not document.

-- First, deduplicate any rows that would violate the new constraint
-- (keep the row with the highest p_mastery and most attempts)
DELETE FROM bkt_mastery a
USING bkt_mastery b
WHERE a.user_id = b.user_id
  AND a.course_id = b.course_id
  AND a.knowledge_component_id = b.knowledge_component_id
  AND a.id < b.id;

-- Add the new unique constraint
ALTER TABLE bkt_mastery
ADD CONSTRAINT bkt_mastery_user_course_kc_unique
UNIQUE (user_id, course_id, knowledge_component_id);
