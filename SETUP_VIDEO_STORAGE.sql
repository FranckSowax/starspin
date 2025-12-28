-- ============================================
-- SUPABASE STORAGE SETUP FOR DEMO VIDEOS
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Step 1: Create storage bucket for demo videos (if not exists)
-- Note: You need to create the bucket manually in Supabase Dashboard first
-- Go to Storage > New Bucket
-- Name: demo-videos
-- Public: YES
-- File size limit: 104857600 (100 MB)
-- Allowed MIME types: video/mp4,video/webm,video/quicktime

-- Step 2: Set up storage policies for public read access
CREATE POLICY IF NOT EXISTS "Public read access for demo videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'demo-videos');

-- Step 3: Allow authenticated admins to upload videos
CREATE POLICY IF NOT EXISTS "Admins can upload demo videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'demo-videos');

-- Step 4: Allow authenticated admins to update videos
CREATE POLICY IF NOT EXISTS "Admins can update demo videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'demo-videos');

-- Step 5: Allow authenticated admins to delete videos
CREATE POLICY IF NOT EXISTS "Admins can delete demo videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'demo-videos');
