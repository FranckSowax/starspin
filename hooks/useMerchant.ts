'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Merchant } from '@/lib/repositories/merchantRepository';

interface UseMerchantState {
  merchant: Merchant | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing merchant profile
 * Automatically redirects to login if not authenticated
 */
export function useMerchant() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth({ requireAuth: true });
  const router = useRouter();

  const [state, setState] = useState<UseMerchantState>({
    merchant: null,
    isLoading: true,
    error: null,
  });

  const fetchMerchant = useCallback(async (userId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setState({
        merchant: data as Merchant,
        isLoading: false,
        error: null,
      });

      return data as Merchant;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching merchant';
      setState({
        merchant: null,
        isLoading: false,
        error: errorMessage,
      });
      return null;
    }
  }, []);

  const updateMerchant = useCallback(async (updates: Partial<Merchant>) => {
    if (!user?.id) return null;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('merchants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setState({
        merchant: data as Merchant,
        isLoading: false,
        error: null,
      });

      return data as Merchant;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error updating merchant';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user?.id) {
      setState({ merchant: null, isLoading: false, error: null });
      return;
    }

    fetchMerchant(user.id);
  }, [user?.id, authLoading, isAuthenticated, fetchMerchant]);

  return {
    user,
    merchant: state.merchant,
    isLoading: authLoading || state.isLoading,
    error: state.error,
    isAuthenticated,
    updateMerchant,
    refreshMerchant: () => user?.id && fetchMerchant(user.id),
  };
}

/**
 * Hook for fetching a merchant by ID (public, for customer-facing pages)
 */
export function useMerchantById(merchantId: string | null) {
  const [state, setState] = useState<UseMerchantState>({
    merchant: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!merchantId) {
      setState({ merchant: null, isLoading: false, error: 'No merchant ID' });
      return;
    }

    const fetchMerchant = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', merchantId)
          .single();

        if (error) throw error;

        setState({
          merchant: data as Merchant,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          merchant: null,
          isLoading: false,
          error: 'Merchant not found',
        });
      }
    };

    fetchMerchant();
  }, [merchantId]);

  return state;
}
