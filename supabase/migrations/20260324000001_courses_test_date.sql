-- Add test_date to courses: the student's exam date for this course.
-- Used by the Study Plan page to generate a time-to-exam schedule.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS test_date DATE;
