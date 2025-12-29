import { supabase } from '@/lib/supabase/client';

export interface Feedback {
  id: string;
  merchant_id: string;
  rating: number;
  comment: string | null;
  customer_email: string | null;
  is_positive: boolean;
  user_token: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface FeedbackCreate {
  merchant_id: string;
  rating: number;
  comment?: string | null;
  customer_email?: string | null;
  is_positive: boolean;
  user_token?: string | null;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  averageRating: number;
}

/**
 * Feedback Repository - Data access methods for customer feedback
 */
export const feedbackRepository = {
  /**
   * Create new feedback entry
   */
  async create(feedback: FeedbackCreate): Promise<Feedback | null> {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback)
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get feedback for a merchant
   */
  async getByMerchantId(
    merchantId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'rating';
      order?: 'asc' | 'desc';
    }
  ): Promise<Feedback[]> {
    const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc' } = options || {};

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('merchant_id', merchantId)
      .order(orderBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get feedback statistics for a merchant
   */
  async getStats(merchantId: string): Promise<FeedbackStats> {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating, is_positive')
      .eq('merchant_id', merchantId);

    if (error || !data) {
      return { total: 0, positive: 0, negative: 0, averageRating: 0 };
    }

    const total = data.length;
    const positive = data.filter((f) => f.is_positive).length;
    const negative = total - positive;
    const averageRating =
      total > 0 ? data.reduce((sum, f) => sum + f.rating, 0) / total : 0;

    return {
      total,
      positive,
      negative,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  },

  /**
   * Get recent feedback for a merchant
   */
  async getRecent(merchantId: string, limit: number = 10): Promise<Feedback[]> {
    return this.getByMerchantId(merchantId, { limit, orderBy: 'created_at', order: 'desc' });
  },

  /**
   * Get feedback count by rating for a merchant
   */
  async getRatingDistribution(merchantId: string): Promise<Record<number, number>> {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating')
      .eq('merchant_id', merchantId);

    if (error || !data) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((f) => {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    });

    return distribution;
  },

  /**
   * Check if user has already submitted feedback today
   */
  async hasSubmittedToday(merchantId: string, userToken: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('user_token', userToken)
      .gte('created_at', today.toISOString());

    if (error) return false;
    return (count ?? 0) > 0;
  },
};
