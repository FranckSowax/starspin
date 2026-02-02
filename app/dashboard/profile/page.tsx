'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Check, X, Loader2, Save, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string, sql?: string } | null>(null);

  // Contact info state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

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

      if (merchantData) {
        setMerchant(merchantData);
        setBusinessName(merchantData.business_name || '');
        setEmail(merchantData.email || '');
        setPhone(merchantData.phone || '');
        setAddress(merchantData.address || '');
        setCity(merchantData.city || '');
        setCountry(merchantData.country || '');
        setGoogleReviewLink(merchantData.google_review_link || '');
        setInstagramUrl(merchantData.instagram_url || '');
        setTiktokUrl(merchantData.tiktok_url || '');
        if (merchantData.logo_url) setLogoPreview(merchantData.logo_url);
        if (merchantData.background_url) setBackgroundPreview(merchantData.background_url);
      }
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
      setBackgroundFile(file);

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

    const { error: uploadError } = await supabase.storage
      .from('merchant-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const updates: any = {
        business_name: businessName,
        email,
        phone,
        address,
        city,
        country,
        google_review_link: googleReviewLink,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
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

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setLogoFile(null);
      setBackgroundFile(null);

      // Refresh merchant data
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      if (merchantData) {
        setMerchant(merchantData);
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('row-level security') || error.message.includes('StorageApiError'))) {
        setMessage({
          type: 'warning',
          text: 'Database configuration required: Storage policies are missing.',
          sql: `
-- Run this in your Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-assets', 'merchant-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'merchant-assets' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );`
        });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to save profile' });
      }
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil</h1>
          <p className="text-gray-600">Manage your business information and appearance</p>
        </div>

        {message && (
          <Card className={`p-4 ${
            message.type === 'success' ? 'bg-teal-50 border-teal-200' :
            message.type === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600 mt-0.5" />
              ) : message.type === 'warning' ? (
                <div className="w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
              ) : (
                <X className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  message.type === 'success' ? 'text-teal-700' :
                  message.type === 'warning' ? 'text-amber-800' :
                  'text-red-700'
                }`}>
                  {message.text}
                </p>
                {message.sql && (
                  <pre className="mt-2 p-3 bg-white/50 rounded border text-xs font-mono overflow-x-auto">
                    {message.sql}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Social Links */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Review Link</label>
              <input
                type="url"
                value={googleReviewLink}
                onChange={(e) => setGoogleReviewLink(e.target.value)}
                placeholder="https://g.page/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Image Uploads */}
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
                  <h3 className="text-xl font-bold text-center mb-4">{businessName || merchant.business_name}</h3>
                  <p className="text-center text-gray-600 text-sm">Rating window preview</p>
                </div>
              </div>
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
              setBusinessName(merchant.business_name || '');
              setEmail(merchant.email || '');
              setPhone(merchant.phone || '');
              setAddress(merchant.address || '');
              setCity(merchant.city || '');
              setCountry(merchant.country || '');
              setGoogleReviewLink(merchant.google_review_link || '');
              setInstagramUrl(merchant.instagram_url || '');
              setTiktokUrl(merchant.tiktok_url || '');
            }}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
