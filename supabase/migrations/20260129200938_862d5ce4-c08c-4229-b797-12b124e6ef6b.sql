-- 1. Sinflar uchun yangi jadval yaratamiz (admin boshqaradi)
CREATE TABLE IF NOT EXISTS public.grade_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS yoqamiz
ALTER TABLE public.grade_classes ENABLE ROW LEVEL SECURITY;

-- RLS siyosatlari
CREATE POLICY "Anyone can read grade_classes" ON public.grade_classes FOR SELECT USING (true);
CREATE POLICY "Anyone can manage grade_classes" ON public.grade_classes FOR ALL USING (true);

-- 2. Mavjud sinflarni migratsiya qilamiz (1-12)
INSERT INTO public.grade_classes (name, display_order)
SELECT 
  grade::text || '-sinf' as name,
  grade as display_order
FROM generate_series(1, 12) as grade
ON CONFLICT DO NOTHING;

-- 3. lessons jadvalidagi grade ustunini class_name (text) ga o'zgartiramiz
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_grade_check;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS class_name text;

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.lessons SET class_name = grade::text || '-sinf' WHERE class_name IS NULL AND grade IS NOT NULL;

-- 4. tests jadvalidagi grade ustunini class_name (text) ga o'zgartiramiz
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_grade_check;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS class_name text;

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.tests SET class_name = grade::text || '-sinf' WHERE class_name IS NULL AND grade IS NOT NULL;

-- 5. students jadvalidagi grade ustunini class_name (text) ga o'zgartiramiz
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_name text;

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.students SET class_name = grade::text || '-sinf' WHERE class_name IS NULL AND grade IS NOT NULL;

-- 6. instructors jadvalidagi assigned_grades ustunini assigned_classes (text[]) ga o'zgartiramiz
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS assigned_classes text[] DEFAULT ARRAY[]::text[];

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.instructors 
SET assigned_classes = (
  SELECT array_agg(g::text || '-sinf')
  FROM unnest(assigned_grades) as g
)
WHERE assigned_classes = ARRAY[]::text[] AND assigned_grades IS NOT NULL AND array_length(assigned_grades, 1) > 0;

-- 7. homework jadvalidagi grade ustunini class_name (text) ga o'zgartiramiz
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS class_name text;

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.homework SET class_name = grade::text || '-sinf' WHERE class_name IS NULL AND grade IS NOT NULL;

-- 8. test_results jadvalidagi student_grade ustunini student_class (text) ga o'zgartiramiz
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS student_class text;

-- Mavjud ma'lumotlarni ko'chiramiz
UPDATE public.test_results SET student_class = student_grade::text || '-sinf' WHERE student_class IS NULL AND student_grade IS NOT NULL;

-- 9. app_settings jadvalidagi available_grades ustunini available_classes (text[]) ga o'zgartiramiz
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS available_classes text[] DEFAULT ARRAY[]::text[];

-- Mavjud ma'lumotlarni ko'chiramiz (jsonb arraydan text[] ga)
UPDATE public.app_settings 
SET available_classes = (
  SELECT array_agg(elem::text || '-sinf')
  FROM jsonb_array_elements_text(available_grades) as elem
)
WHERE available_classes = ARRAY[]::text[];