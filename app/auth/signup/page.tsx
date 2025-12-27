'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [redirectStrategy, setRedirectStrategy] = useState('google_maps');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: merchantError } = await supabase.from('merchants').insert({
        id: data.user.id,
        email,
        business_name: businessName,
        subscription_tier: 'starter',
        google_maps_url: googleMapsUrl || null,
        tripadvisor_url: tripadvisorUrl || null,
        tiktok_url: tiktokUrl || null,
        instagram_url: instagramUrl || null,
        redirect_strategy: redirectStrategy,
      });

      if (merchantError) {
        setError(merchantError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Join StarSpin</h1>
        <p className="text-center text-gray-600 mb-8">Create your merchant account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="text"
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="My Coffee Shop"
            required
          />

          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="merchant@example.com"
            required
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Liens de Redirection (Optionnel)</p>
            <p className="text-xs text-gray-500 mb-4">Les clients avec 4-5 étoiles seront redirigés vers votre plateforme préférée</p>
            
            <Input
              type="url"
              label="Google Maps"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />

            <Input
              type="url"
              label="TripAdvisor"
              value={tripadvisorUrl}
              onChange={(e) => setTripadvisorUrl(e.target.value)}
              placeholder="https://tripadvisor.com/..."
            />

            <Input
              type="url"
              label="TikTok"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@..."
            />

            <Input
              type="url"
              label="Instagram"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stratégie de Redirection
              </label>
              <select
                value={redirectStrategy}
                onChange={(e) => setRedirectStrategy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="google_maps">Google Maps</option>
                <option value="tripadvisor">TripAdvisor</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="none">Aucune redirection</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-[#4CAF50] font-semibold hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
