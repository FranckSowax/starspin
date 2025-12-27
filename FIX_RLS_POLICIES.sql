-- Fix RLS policies to allow uploads without subfolder structure
-- The error "new row violates row-level security policy" means the policies are too restrictive

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create new simplified policies that work with files in bucket root

-- Policy 1: Allow authenticated users to upload files that start with their user ID
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-assets' AND
  (storage.filename(name) LIKE auth.uid()::text || '%')
);

-- Policy 2: Allow public read access to all files in merchant-assets
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'merchant-assets');

-- Policy 3: Allow users to update files that start with their user ID
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.filename(name) LIKE auth.uid()::text || '%')
);

-- Policy 4: Allow users to delete files that start with their user ID
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.filename(name) LIKE auth.uid()::text || '%')
);

-- Verify the policies were created
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Public can read'
    ELSE 'Authenticated users only'
  END as access_level
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%merchant%'
ORDER BY cmd;
