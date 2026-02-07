-- lessons jadvalidagi class_id foreign key cheklovini olib tashlaymiz
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_class_id_fkey;

-- class_id ustunini nullable qilamiz va default qiymat beramiz
ALTER TABLE public.lessons ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN class_id SET DEFAULT NULL;

-- created_by ustunini ham nullable qilamiz
ALTER TABLE public.lessons ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN created_by SET DEFAULT NULL;

-- tests jadvalida ham xuddi shunday qilamiz
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_class_id_fkey;
ALTER TABLE public.tests ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE public.tests ALTER COLUMN class_id SET DEFAULT NULL;
ALTER TABLE public.tests ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.tests ALTER COLUMN created_by SET DEFAULT NULL;