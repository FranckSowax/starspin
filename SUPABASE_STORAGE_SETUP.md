# Supabase Storage Setup Instructions

## ⚠️ IMPORTANT: Complete these steps to enable image uploads

### Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `merchant-assets`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: `10485760` (10 MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
6. Click **"Create bucket"**

### Step 2: Add Database Columns

1. Go to **SQL Editor** in your Supabase Dashboard
2. Create a new query
3. Copy and paste this SQL:

```sql
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS background_url TEXT;
```

4. Click **"Run"**

### Step 3: Set Storage Policies

1. Still in **SQL Editor**, create another new query
2. Copy and paste this SQL:

```sql
-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'merchant-assets');

-- Policy 3: Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

3. Click **"Run"**

### Step 4: Verify Setup

1. Go to **Storage** > **merchant-assets**
2. You should see an empty bucket
3. Try uploading an image from the dashboard at `/dashboard/settings`

## Troubleshooting

### Error 400: Bucket not found
- Make sure the bucket name is exactly `merchant-assets`
- Verify the bucket is marked as **Public**

### Error 403: Permission denied
- Check that all 4 storage policies were created successfully
- Verify you're logged in as an authenticated user

### Images not displaying
- Check the browser console for CORS errors
- Verify the bucket is set to **Public**
- Make sure the image URLs are being saved correctly in the database

## Testing

After setup, test the feature:
1. Go to `/dashboard/settings`
2. Upload a logo (square image)
3. Upload a background (9:16 vertical image)
4. Click "Save Changes"
5. Visit your rating page: `/rate/[your-merchant-id]`
6. You should see your custom logo and background!
