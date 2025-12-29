'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  merchantRepository,
  feedbackRepository,
  prizeRepository,
  spinRepository,
  couponRepository,
  type Merchant,
  type MerchantUpdate,
  type Feedback,
  type FeedbackCreate,
  type Prize,
  type PrizeCreate,
  type PrizeUpdate,
  type SpinCreate,
} from '@/lib/repositories';

// Query Keys
export const queryKeys = {
  merchant: (id: string) => ['merchant', id] as const,
  currentMerchant: ['merchant', 'current'] as const,
  feedback: (merchantId: string) => ['feedback', merchantId] as const,
  feedbackStats: (merchantId: string) => ['feedback', merchantId, 'stats'] as const,
  prizes: (merchantId: string) => ['prizes', merchantId] as const,
  spins: (merchantId: string) => ['spins', merchantId] as const,
  spinStats: (merchantId: string) => ['spins', merchantId, 'stats'] as const,
  coupons: (merchantId: string) => ['coupons', merchantId] as const,
  couponStats: (merchantId: string) => ['coupons', merchantId, 'stats'] as const,
};

// ============================================
// Merchant Hooks
// ============================================

export function useMerchant(id: string) {
  return useQuery({
    queryKey: queryKeys.merchant(id),
    queryFn: () => merchantRepository.getById(id),
    enabled: !!id,
  });
}

export function useCurrentMerchant() {
  return useQuery({
    queryKey: queryKeys.currentMerchant,
    queryFn: () => merchantRepository.getCurrentMerchant(),
  });
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: MerchantUpdate }) =>
      merchantRepository.update(id, updates),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMerchant });
    },
  });
}

// ============================================
// Feedback Hooks
// ============================================

export function useFeedback(merchantId: string, options?: { limit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.feedback(merchantId), options],
    queryFn: () => feedbackRepository.getByMerchantId(merchantId, options),
    enabled: !!merchantId,
  });
}

export function useFeedbackStats(merchantId: string) {
  return useQuery({
    queryKey: queryKeys.feedbackStats(merchantId),
    queryFn: () => feedbackRepository.getStats(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedback: FeedbackCreate) => feedbackRepository.create(feedback),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feedback(data.merchant_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.feedbackStats(data.merchant_id) });
      }
    },
  });
}

// ============================================
// Prize Hooks
// ============================================

export function usePrizes(merchantId: string) {
  return useQuery({
    queryKey: queryKeys.prizes(merchantId),
    queryFn: () => prizeRepository.getByMerchantId(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreatePrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prize: PrizeCreate) => prizeRepository.create(prize),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.prizes(data.merchant_id) });
      }
    },
  });
}

export function useUpdatePrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PrizeUpdate }) =>
      prizeRepository.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.prizes(data.merchant_id) });
      }
    },
  });
}

export function useDeletePrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, merchantId }: { id: string; merchantId: string }) =>
      prizeRepository.delete(id).then((success) => ({ success, merchantId })),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.prizes(result.merchantId) });
      }
    },
  });
}

// ============================================
// Spin Hooks
// ============================================

export function useSpins(merchantId: string, options?: { limit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.spins(merchantId), options],
    queryFn: () => spinRepository.getByMerchantId(merchantId, options),
    enabled: !!merchantId,
  });
}

export function useSpinStats(merchantId: string) {
  return useQuery({
    queryKey: queryKeys.spinStats(merchantId),
    queryFn: () => spinRepository.getStats(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateSpin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spin: SpinCreate) => spinRepository.create(spin),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.spins(data.merchant_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.spinStats(data.merchant_id) });
      }
    },
  });
}

export function useDailySpinStats(merchantId: string, days: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.spinStats(merchantId), 'daily', days],
    queryFn: () => spinRepository.getDailyStats(merchantId, days),
    enabled: !!merchantId,
  });
}

// ============================================
// Coupon Hooks
// ============================================

export function useCoupons(merchantId: string, options?: { includeUsed?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.coupons(merchantId), options],
    queryFn: () => couponRepository.getByMerchantId(merchantId, options),
    enabled: !!merchantId,
  });
}

export function useCouponStats(merchantId: string) {
  return useQuery({
    queryKey: queryKeys.couponStats(merchantId),
    queryFn: () => couponRepository.getStats(merchantId),
    enabled: !!merchantId,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, merchantId }: { code: string; merchantId: string }) =>
      couponRepository.validate(code, merchantId),
  });
}

export function useRedeemCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, merchantId }: { id: string; merchantId: string }) =>
      couponRepository.markAsUsed(id).then((success) => ({ success, merchantId })),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons(result.merchantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.couponStats(result.merchantId) });
      }
    },
  });
}
