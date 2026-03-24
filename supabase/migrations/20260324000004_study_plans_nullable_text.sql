-- plan_text is no longer written by the backend; plan_json is used instead.
ALTER TABLE public.study_plans ALTER COLUMN plan_text DROP NOT NULL;
