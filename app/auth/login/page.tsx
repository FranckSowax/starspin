'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/dashboard');

  useEffect(() => {
    // Récupérer l'URL de redirection depuis les paramètres
    const redirect = searchParams.get('redirect');
    if (redirect) {
      // Sécurité : s'assurer que la redirection est locale
      if (redirect.startsWith('/')) {
        setRedirectUrl(redirect);
      }
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[LOGIN] Tentative de connexion pour:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[LOGIN] Réponse Supabase:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        error: error?.message
      });

      if (error) {
        console.error('[LOGIN] Erreur Supabase:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        console.log('[LOGIN] Session créée, user_id:', data.session.user.id);
        console.log('[LOGIN] Token expires_at:', data.session.expires_at);

        // Stocker la session manuellement pour Safari
        try {
          localStorage.setItem('starspin-auth-token', JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          }));
          console.log('[LOGIN] Token stocké dans localStorage');
        } catch (storageError) {
          console.error('[LOGIN] Erreur localStorage:', storageError);
        }

        // Vérifier que la session est bien active
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
        console.log('[LOGIN] Vérification session:', {
          hasSession: !!sessionCheck.session,
          error: sessionError?.message
        });

        if (!sessionCheck.session) {
          console.error('[LOGIN] Session non persistée après login!');
          setError('Session non persistée. Vérifiez que les cookies sont activés.');
          setLoading(false);
          return;
        }

        console.log('[LOGIN] Redirection vers:', redirectUrl);

        // Attendre un peu avant la redirection
        await new Promise(resolve => setTimeout(resolve, 500));

        window.location.replace(redirectUrl);
      } else {
        console.error('[LOGIN] Pas de session retournée');
        setError('Connexion échouée. Veuillez réessayer.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[LOGIN] Exception:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF6F61] to-[#FFC107] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <Button onClick={() => setMagicLinkSent(false)} variant="outline">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6F61] to-[#FFC107] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">StarSpin</h1>
        <p className="text-center text-gray-600 mb-8">Merchant Login</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <Button
          onClick={handleMagicLink}
          disabled={loading || !email}
          variant="outline"
          className="w-full"
        >
          Send Magic Link
        </Button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/auth/signup" className="text-[#FF6F61] font-semibold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6F61] to-[#FFC107] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-[#FF6F61] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
