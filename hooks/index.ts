/**
 * Custom Hooks Index
 *
 * Re-exports all custom hooks for easy importing
 */

// Authentication
export { useAuth, useRequireAuth, useIsAdmin } from './useAuth';

// Merchant
export { useMerchant, useMerchantById } from './useMerchant';

// Pagination
export { usePagination, useServerPagination } from './usePagination';

// React Query hooks
export {
  // Query keys
  queryKeys,
  // Merchant
  useMerchant as useMerchantQuery,
  useCurrentMerchant,
  useUpdateMerchant,
  // Feedback
  useFeedback,
  useFeedbackStats,
  useCreateFeedback,
  // Prizes
  usePrizes,
  useCreatePrize,
  useUpdatePrize,
  useDeletePrize,
  // Spins
  useSpins,
  useSpinStats,
  useCreateSpin,
  useDailySpinStats,
  // Coupons
  useCoupons,
  useCouponStats,
  useValidateCoupon,
  useRedeemCoupon,
} from './useQueries';
