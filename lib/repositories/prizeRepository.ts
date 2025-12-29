import { supabase } from '@/lib/supabase/client';

export interface Prize {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PrizeCreate {
  merchant_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  probability: number;
  quantity?: number;
}

export type PrizeUpdate = Partial<Omit<Prize, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>>;

/**
 * Prize Repository - Data access methods for prizes
 */
export const prizeRepository = {
  /**
   * Get all prizes for a merchant
   */
  async getByMerchantId(merchantId: string): Promise<Prize[]> {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching prizes:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get a single prize by ID
   */
  async getById(id: string): Promise<Prize | null> {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prize:', error);
      return null;
    }

    return data;
  },

  /**
   * Create a new prize
   */
  async create(prize: PrizeCreate): Promise<Prize | null> {
    const { data, error } = await supabase
      .from('prizes')
      .insert({
        ...prize,
        quantity: prize.quantity ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prize:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Update a prize
   */
  async update(id: string, updates: PrizeUpdate): Promise<Prize | null> {
    const { data, error } = await supabase
      .from('prizes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prize:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Delete a prize
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('prizes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting prize:', error);
      return false;
    }

    return true;
  },

  /**
   * Get available prizes (quantity > 0) for a merchant
   */
  async getAvailable(merchantId: string): Promise<Prize[]> {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('merchant_id', merchantId)
      .gt('quantity', 0)
      .order('probability', { ascending: false });

    if (error) {
      console.error('Error fetching available prizes:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Decrement prize quantity (when won)
   */
  async decrementQuantity(id: string): Promise<boolean> {
    const prize = await this.getById(id);
    if (!prize || prize.quantity <= 0) return false;

    const { error } = await supabase
      .from('prizes')
      .update({
        quantity: prize.quantity - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return !error;
  },

  /**
   * Get total probability for a merchant's prizes
   */
  async getTotalProbability(merchantId: string): Promise<number> {
    const prizes = await this.getByMerchantId(merchantId);
    return prizes.reduce((sum, p) => sum + p.probability, 0);
  },
};
