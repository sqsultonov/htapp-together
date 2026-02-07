-- Drop the grade check constraint that's causing login failures
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_check;

-- Make grade column nullable with a default value
ALTER TABLE public.students ALTER COLUMN grade SET DEFAULT 1;
ALTER TABLE public.students ALTER COLUMN grade DROP NOT NULL;