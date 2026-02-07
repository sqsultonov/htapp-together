-- Add branding settings columns to app_settings
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'HTApp',
ADD COLUMN IF NOT EXISTS app_logo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS app_description TEXT DEFAULT 'O''quv platformasi - darslar, testlar va o''zlashtirish ko''rsatkichlarini bir joyda boshqaring',
ADD COLUMN IF NOT EXISTS app_mission TEXT DEFAULT 'Zamonaviy ta''lim tizimi orqali o''quvchilarning bilim va ko''nikmalarini oshirish';

-- Create storage bucket for app assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for app-assets bucket
CREATE POLICY "Anyone can view app assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

CREATE POLICY "Admins can manage app assets"
ON storage.objects FOR ALL
USING (bucket_id = 'app-assets');