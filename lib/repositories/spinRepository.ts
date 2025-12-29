import { supabase } from '@/lib/supabase/client';

export interface Spin {
  id: string;
  merchant_id: string;
  prize_id: string | null;
  user_token: string | null;
  ip_hash: string | null;
  result_type: 'prize' | 'unlucky' | 'retry';
  created_at: string;
}

export interface SpinCreate {
  merchant_id: string;
  prize_id?: string | null;
  user_token?: string | null;
  result_type?: 'prize' | 'unlucky' | 'retry';
}

export interface SpinStats {
  total: number;
  prizes: number;
  unlucky: number;
  retry: number;
}

/**
 * Spin Repository - Data access methods for wheel spins
 */
export const spinRepository = {
  /**
   * Record a new spin
   */
  async create(spin: SpinCreate): Promise<Spin | null> {
    const { data, error } = await supabase
      .from('spins')
      .insert(spin)
      .select()
      .single();

    if (error) {
      console.error('Error creating spin:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get spins for a merchant
   */
  async getByMerchantId(
    merchantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Spin[]> {
    const { limit = 100, offset = 0 } = options || {};

    const { data, error } = await supabase
      .from('spins')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching spins:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get spin statistics for a merchant
   */
  async getStats(merchantId: string): Promise<SpinStats> {
    const { data, error } = await supabase
      .from('spins')
      .select('prize_id, result_type')
      .eq('merchant_id', merchantId);

    if (error || !data) {
      return { total: 0, prizes: 0, unlucky: 0, retry: 0 };
    }

    return {
      total: data.length,
      prizes: data.filter((s) => s.prize_id !== null).length,
      unlucky: data.filter((s) => s.result_type === 'unlucky').length,
      retry: data.filter((s) => s.result_type === 'retry').length,
    };
  },

  /**
   * Get spin count for a merchant
   */
  async getCount(merchantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    if (error) return 0;
    return count ?? 0;
  },

  /**
   * Check if user has already spun today
   */
  async hasSpunToday(merchantId: string, userToken: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('user_token', userToken)
      .gte('created_at', today.toISOString());

    if (error) return false;
    return (count ?? 0) > 0;
  },

  /**
   * Get spins by date range
   */
  async getByDateRange(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Spin[]> {
    const { data, error } = await supabase
      .from('spins')
      .select('*')
      .eq('merchant_id', merchantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching spins by date range:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get daily spin counts for the last N days
   */
  async getDailyStats(merchantId: string, days: number = 30): Promise<{ date: string; count: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const spins = await this.getByDateRange(merchantId, startDate, endDate);

    // Group by date
    const dailyCounts: Record<string, number> = {};
    spins.forEach((spin) => {
      const date = spin.created_at.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const result: { date: string; count: number }[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({ date: dateStr, count: dailyCounts[dateStr] || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },
};
