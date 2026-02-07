-- Create storage bucket for lesson attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-attachments', 'lesson-attachments', true);

-- Create storage policies for lesson attachments
CREATE POLICY "Anyone can view lesson attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-attachments');

CREATE POLICY "Authenticated users can upload lesson attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-attachments');

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesson-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'lesson-attachments');

-- Add question_count to tests table for displaying
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS question_count integer DEFAULT 0;