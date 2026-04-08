
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-previews', 'design-previews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view design previews" ON storage.objects; CREATE POLICY "Anyone can view design previews" ON storage.objects FOR SELECT
USING (bucket_id = 'design-previews');

DROP POLICY IF EXISTS "Service role can upload design previews" ON storage.objects; CREATE POLICY "Service role can upload design previews" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-previews');

