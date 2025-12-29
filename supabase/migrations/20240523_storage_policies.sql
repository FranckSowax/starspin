-- Create the merchant-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('merchant-assets', 'merchant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of assets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'merchant-assets' );

-- Policy to allow authenticated users to upload assets
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'merchant-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update their assets
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'merchant-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete their assets
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'merchant-assets' 
  AND auth.role() = 'authenticated'
);
