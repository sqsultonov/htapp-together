-- Create app_settings table for login customization
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  available_grades jsonb NOT NULL DEFAULT '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]'::jsonb,
  login_bg_image_url text,
  login_bg_overlay_opacity numeric NOT NULL DEFAULT 0.7,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read app settings"
ON public.app_settings FOR SELECT
USING (true);

-- Only admins can update settings (via service role)
CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
USING (true);

-- Insert default settings
INSERT INTO public.app_settings (available_grades) VALUES ('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]'::jsonb);

-- Add assigned_grades to instructors table
ALTER TABLE public.instructors ADD COLUMN assigned_grades integer[] DEFAULT ARRAY[]::integer[];

-- Create trigger for updating updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();