-- Drop the old check constraint that only allows grades 1-11
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_grade_check;

-- Add new check constraint that allows grades 1-12
ALTER TABLE public.lessons ADD CONSTRAINT lessons_grade_check CHECK (grade >= 1 AND grade <= 12);

-- Also update tests table if it has similar constraint
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_grade_check;
ALTER TABLE public.tests ADD CONSTRAINT tests_grade_check CHECK (grade >= 1 AND grade <= 12);