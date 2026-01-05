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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Étape 1: Créer l'utilisateur dans Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
          data: {
            business_name: businessName,
          },
        },
      });

      if (signUpError) {
        // Gérer les erreurs spécifiques
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          setError('🚫 Ce compte existe déjà ! Connectez-vous ou utilisez "Mot de passe oublié" si nécessaire.');
        } else if (signUpError.message.includes('password')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
        } else if (signUpError.message.includes('valid email')) {
          setError('Veuillez entrer une adresse email valide.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Supabase peut retourner un user existant sans erreur (identities vides)
      // Cela arrive quand l'email existe déjà mais n'est pas confirmé
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('🚫 Ce compte existe déjà ! Si vous n\'avez pas reçu l\'email de confirmation, connectez-vous et demandez un nouvel envoi.');
        setLoading(false);
        return;
      }

      // Vérifier si l'email nécessite une confirmation
      if (data.user && !data.session) {
        // Email de confirmation envoyé - l'utilisateur doit confirmer
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      // Étape 2: Si l'utilisateur est créé et connecté, créer le profil marchand
      if (data.user && data.session) {
        const { error: merchantError } = await supabase.from('merchants').insert({
          id: data.user.id,
          email,
          business_name: businessName,
          subscription_tier: 'starter',
        });

        if (merchantError) {
          // Si l'erreur est liée à RLS, afficher un message plus clair
          if (merchantError.message.includes('row-level security') || merchantError.code === '42501') {
            setError('Erreur de configuration. Veuillez contacter le support.');
          } else if (merchantError.message.includes('duplicate')) {
            // Le profil existe déjà, continuer vers le dashboard
            router.push('/dashboard');
            return;
          } else {
            setError(`Erreur lors de la création du profil: ${merchantError.message}`);
          }
          setLoading(false);
          return;
        }

        router.push('/dashboard');
      }
    } catch {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    }

    setLoading(false);
  };

  // Afficher l'écran de confirmation d'email
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Animation de succès */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {/* Cercle de notification */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Inscription réussie !</h1>
          
          {/* Notification importante */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Action requise : Vérifiez votre email
                </p>
                <p className="text-sm text-blue-700">
                  Un email de confirmation a été envoyé à <strong className="font-semibold">{email}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-600">
                Ouvrez votre boîte email <strong>{email}</strong>
              </p>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-600">
                Cliquez sur le lien de confirmation dans l'email
              </p>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-600">
                Vous serez redirigé vers votre dashboard StarSpin
              </p>
            </div>
          </div>

          {/* Aide */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Vous ne trouvez pas l'email ?</strong>
            </p>
            <ul className="text-xs text-gray-500 space-y-1 text-left">
              <li>• Vérifiez votre dossier <strong>spam</strong> ou <strong>courrier indésirable</strong></li>
              <li>• L'email peut prendre quelques minutes à arriver</li>
              <li>• Vérifiez que l'adresse <strong>{email}</strong> est correcte</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => setConfirmationSent(false)} 
              variant="outline"
              className="flex-1"
            >
              Modifier l'email
            </Button>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="flex-1 bg-gradient-to-r from-[#4CAF50] to-[#45a049]"
            >
              Aller à la connexion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Join StarSpin</h1>
        <p className="text-center text-gray-600 mb-8">Create your merchant account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
            {error.includes('existe déjà') && (
              <a
                href="/auth/login"
                className="inline-block mt-2 text-sm font-semibold text-[#4CAF50] hover:underline"
              >
                → Se connecter maintenant
              </a>
            )}
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
