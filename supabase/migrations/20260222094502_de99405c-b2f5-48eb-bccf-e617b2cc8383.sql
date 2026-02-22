
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-previews', 'design-previews', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view design previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-previews');

CREATE POLICY "Service role can upload design previews"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-previews');
