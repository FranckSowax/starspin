import { supabase } from '@/lib/supabase/client';

export interface Coupon {
  id: string;
  spin_id: string;
  merchant_id: string;
  code: string;
  prize_name: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface CouponCreate {
  spin_id: string;
  merchant_id: string;
  code: string;
  prize_name: string;
  expires_at: string;
}

/**
 * Coupon Repository - Data access methods for coupons
 */
export const couponRepository = {
  /**
   * Create a new coupon
   */
  async create(coupon: CouponCreate): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        ...coupon,
        used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get coupon by code
   */
  async getByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching coupon:', error);
      return null;
    }

    return data;
  },

  /**
   * Get coupon by ID
   */
  async getById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching coupon:', error);
      return null;
    }

    return data;
  },

  /**
   * Get coupons for a merchant
   */
  async getByMerchantId(
    merchantId: string,
    options?: { limit?: number; includeUsed?: boolean }
  ): Promise<Coupon[]> {
    const { limit = 100, includeUsed = true } = options || {};

    let query = supabase
      .from('coupons')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeUsed) {
      query = query.eq('used', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Mark coupon as used
   */
  async markAsUsed(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('coupons')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error marking coupon as used:', error);
      return false;
    }

    return true;
  },

  /**
   * Validate coupon (exists, not used, not expired, belongs to merchant)
   */
  async validate(code: string, merchantId: string): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
  }> {
    const coupon = await this.getByCode(code);

    if (!coupon) {
      return { valid: false, error: 'Coupon non trouvé' };
    }

    if (coupon.merchant_id !== merchantId) {
      return { valid: false, error: 'Coupon invalide pour ce commerce' };
    }

    if (coupon.used) {
      return { valid: false, error: 'Coupon déjà utilisé' };
    }

    const expiresAt = new Date(coupon.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Coupon expiré' };
    }

    return { valid: true, coupon };
  },

  /**
   * Get coupon statistics for a merchant
   */
  async getStats(merchantId: string): Promise<{
    total: number;
    used: number;
    expired: number;
    active: number;
  }> {
    const coupons = await this.getByMerchantId(merchantId);
    const now = new Date();

    const used = coupons.filter((c) => c.used).length;
    const expired = coupons.filter(
      (c) => !c.used && new Date(c.expires_at) < now
    ).length;
    const active = coupons.filter(
      (c) => !c.used && new Date(c.expires_at) >= now
    ).length;

    return {
      total: coupons.length,
      used,
      expired,
      active,
    };
  },

  /**
   * Generate a unique coupon code
   */
  generateCode(prefix: string = 'STAR'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix + '-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
