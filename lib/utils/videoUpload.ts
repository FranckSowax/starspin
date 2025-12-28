import { supabase } from '@/lib/supabase/client';

/**
 * Upload a demo video to Supabase Storage
 * @param file - Video file to upload
 * @param language - Language code (fr, en, th)
 * @returns Public URL of the uploaded video or null if error
 */
export async function uploadDemoVideo(
  file: File,
  language: 'fr' | 'en' | 'th'
): Promise<string | null> {
  try {
    const fileName = `demo-${language}.mp4`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('demo-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Replace if already exists
        contentType: file.type
      });

    if (error) {
      console.error('Video upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('demo-videos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Unexpected error during video upload:', error);
    return null;
  }
}

/**
 * Get the public URL for a demo video
 * @param language - Language code (fr, en, th)
 * @returns Public URL of the video
 */
export function getDemoVideoUrl(language: 'fr' | 'en' | 'th'): string {
  const { data: { publicUrl } } = supabase.storage
    .from('demo-videos')
    .getPublicUrl(`demo-${language}.mp4`);
  
  return publicUrl;
}

/**
 * Delete a demo video from storage
 * @param language - Language code (fr, en, th)
 * @returns Success boolean
 */
export async function deleteDemoVideo(
  language: 'fr' | 'en' | 'th'
): Promise<boolean> {
  try {
    const fileName = `demo-${language}.mp4`;
    
    const { error } = await supabase.storage
      .from('demo-videos')
      .remove([fileName]);

    if (error) {
      console.error('Video deletion error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during video deletion:', error);
    return false;
  }
}
