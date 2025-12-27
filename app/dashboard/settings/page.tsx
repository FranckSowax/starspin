'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Check, X, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Social media redirect settings
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [redirectStrategy, setRedirectStrategy] = useState('google_maps');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      setMerchant(merchantData);
      if (merchantData?.logo_url) setLogoPreview(merchantData.logo_url);
      if (merchantData?.background_url) setBackgroundPreview(merchantData.background_url);
      
      // Load social media settings
      setGoogleMapsUrl(merchantData?.google_maps_url || '');
      setTripadvisorUrl(merchantData?.tripadvisor_url || '');
      setTiktokUrl(merchantData?.tiktok_url || '');
      setInstagramUrl(merchantData?.instagram_url || '');
      setRedirectStrategy(merchantData?.redirect_strategy || 'google_maps');
    };

    checkAuth();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set file immediately to enable Save button
      setBackgroundFile(file);
      
      // Check aspect ratio (9:16 for vertical) - warning only, not blocking
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const target = 9 / 16;
        if (Math.abs(aspectRatio - target) > 0.15) {
          setMessage({ 
            type: 'error', 
            text: `Image ratio is ${(aspectRatio * 16 / 9).toFixed(2)}:16. Recommended: 9:16 (vertical format)` 
          });
        } else {
          setMessage(null);
        }
      };
      img.src = URL.createObjectURL(file);
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('merchant-assets')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;

    setUploading(true);
    setMessage(null);

    try {
      const updates: any = {
        google_maps_url: googleMapsUrl || null,
        tripadvisor_url: tripadvisorUrl || null,
        tiktok_url: tiktokUrl || null,
        instagram_url: instagramUrl || null,
        redirect_strategy: redirectStrategy,
      };

      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, 'logos');
        updates.logo_url = logoUrl;
      }

      if (backgroundFile) {
        const backgroundUrl = await uploadImage(backgroundFile, 'backgrounds');
        updates.background_url = backgroundUrl;
      }

      const { error } = await supabase
        .from('merchants')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setLogoFile(null);
      setBackgroundFile(null);
      
      // Refresh merchant data
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      setMerchant(merchantData);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setUploading(false);
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize your rating page appearance</p>
        </div>

        {message && (
          <Card className={`p-4 ${message.type === 'success' ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-teal-700' : 'text-red-700'}>
                {message.text}
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
                <p className="text-sm text-gray-600">Displayed at the top of your rating page</p>
              </div>
              <Badge variant="outline">Square</Badge>
            </div>

            <div className="space-y-4">
              {logoPreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-teal-600 font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>
          </Card>

          {/* Background Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Background Image</h3>
                <p className="text-sm text-gray-600">Background for your rating page</p>
              </div>
              <Badge variant="outline">9:16 Ratio</Badge>
            </div>

            <div className="space-y-4">
              {backgroundPreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <p className="text-white text-sm">With overlay (40% opacity)</p>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  id="background-upload"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
                <label htmlFor="background-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-teal-600 font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (9:16 format) up to 10MB</p>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="max-w-sm mx-auto aspect-[9/16] bg-white rounded-2xl shadow-xl overflow-hidden relative">
              {backgroundPreview && (
                <div className="absolute inset-0">
                  <img src={backgroundPreview} alt="Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-16 mb-4 object-contain" />
                )}
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full">
                  <h3 className="text-xl font-bold text-center mb-4">{merchant.business_name}</h3>
                  <p className="text-center text-gray-600 text-sm">Rating window preview</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Social Media Redirect Settings */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirection après notation</h3>
            <p className="text-sm text-gray-600">Configurez où rediriger vos clients après une note de 4 ou 5 étoiles</p>
          </div>

          <div className="space-y-4">
            {/* Redirect Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plateforme de redirection
              </label>
              <select
                value={redirectStrategy}
                onChange={(e) => setRedirectStrategy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="google_maps">Google Maps</option>
                <option value="tripadvisor">TripAdvisor</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="none">Aucune redirection</option>
              </select>
            </div>

            {/* Google Maps URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien Google Maps
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://g.page/your-business"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* TripAdvisor URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien TripAdvisor
              </label>
              <input
                type="url"
                value={tripadvisorUrl}
                onChange={(e) => setTripadvisorUrl(e.target.value)}
                placeholder="https://www.tripadvisor.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* TikTok URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien TikTok
              </label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@your-account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Instagram URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien Instagram
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/your-account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Astuce :</strong> Les clients qui donnent 4 ou 5 étoiles seront automatiquement redirigés vers la plateforme sélectionnée. Assurez-vous que le lien est correct !
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setLogoFile(null);
              setBackgroundFile(null);
              setLogoPreview(merchant.logo_url || '');
              setBackgroundPreview(merchant.background_url || '');
            }}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
