'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Hook for authentication state management
 * Provides user state, loading state, and auth methods
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = '/auth/login', requireAuth = false } = options;
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check current session
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      const user = session?.user ?? null;

      setState({
        user,
        session,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });

      // Redirect if auth is required but user is not authenticated
      if (requireAuth && !user) {
        router.push(redirectTo);
      }

      return { user, session };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { user: null, session: null };
    }
  }, [requireAuth, redirectTo, router]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      router.push(redirectTo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [redirectTo, router]);

  // Sign in with email and password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState({
        user: data.user,
        session: data.session,
        isLoading: false,
        isAuthenticated: !!data.user,
        error: null,
      });

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { user: null, session: null, error: errorMessage };
    }
  }, []);

  // Sign in with magic link
  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Magic link error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setState((prev) => ({ ...prev, isLoading: false }));
      return { user: data.user, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { user: null, error: errorMessage };
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setState({
          user,
          session,
          isLoading: false,
          isAuthenticated: !!user,
          error: null,
        });

        if (event === 'SIGNED_OUT' && requireAuth) {
          router.push(redirectTo);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, requireAuth, redirectTo, router]);

  return {
    ...state,
    signOut,
    signInWithEmail,
    signInWithMagicLink,
    signUp,
    refreshSession: checkSession,
  };
}

/**
 * Hook specifically for protected pages that require authentication
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  return useAuth({ requireAuth: true, redirectTo });
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    setIsAdmin(adminEmails.includes(user.email.toLowerCase()));
  }, [user?.email]);

  return { isAdmin, isLoading, user };
}
