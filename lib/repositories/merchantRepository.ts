import { supabase } from '@/lib/supabase/client';

export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  logo_url: string | null;
  background_url: string | null;
  qr_code_url: string | null;
  google_review_link: string | null;
  google_maps_url: string | null;
  tripadvisor_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  redirect_strategy: string | null;
  subscription_tier: string;
  unlucky_probability: number;
  retry_probability: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantStats {
  totalReviews: number;
  positiveReviews: number;
  avgRating: number;
  totalSpins: number;
  couponsRedeemed: number;
}

export type MerchantUpdate = Partial<Omit<Merchant, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Merchant Repository - Data access methods for merchants
 */
export const merchantRepository = {
  /**
   * Get merchant by ID
   */
  async getById(id: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching merchant:', error);
      return null;
    }

    return data;
  },

  /**
   * Get current user's merchant profile
   */
  async getCurrentMerchant(): Promise<Merchant | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return this.getById(user.id);
  },

  /**
   * Update merchant profile
   */
  async update(id: string, updates: MerchantUpdate): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating merchant:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Update merchant branding (logo, background)
   */
  async updateBranding(
    id: string,
    branding: { logo_url?: string; background_url?: string }
  ): Promise<Merchant | null> {
    return this.update(id, branding);
  },

  /**
   * Update merchant social links
   */
  async updateSocialLinks(
    id: string,
    links: {
      google_review_link?: string | null;
      google_maps_url?: string | null;
      tripadvisor_url?: string | null;
      instagram_url?: string | null;
      tiktok_url?: string | null;
    }
  ): Promise<Merchant | null> {
    return this.update(id, links);
  },

  /**
   * Update wheel probabilities
   */
  async updateProbabilities(
    id: string,
    probabilities: { unlucky_probability?: number; retry_probability?: number }
  ): Promise<Merchant | null> {
    return this.update(id, probabilities);
  },

  /**
   * Check if merchant exists
   */
  async exists(id: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) return false;
    return (count ?? 0) > 0;
  },
};
