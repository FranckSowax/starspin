/**
 * Supabase MCP Helper Functions
 * Ces fonctions facilitent l'utilisation du MCP Supabase pour le développement
 */

import { supabase } from './client';
import type { 
  Merchant, 
  Prize, 
  Feedback, 
  Spin, 
  Coupon, 
  QRCode, 
  SubscriptionTier 
} from '@/lib/types/database';

// ============================================
// MERCHANTS
// ============================================

export const merchants = {
  /**
   * Récupérer tous les marchands
   */
  async getAll() {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Merchant[];
  },

  /**
   * Récupérer un marchand par ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Merchant;
  },

  /**
   * Créer un nouveau marchand
   */
  async create(merchant: Partial<Merchant>) {
    const { data, error } = await supabase
      .from('merchants')
      .insert(merchant)
      .select()
      .single();
    
    if (error) throw error;
    return data as Merchant;
  },

  /**
   * Mettre à jour un marchand
   */
  async update(id: string, updates: Partial<Merchant>) {
    const { data, error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Merchant;
  },
};

// ============================================
// PRIZES
// ============================================

export const prizes = {
  /**
   * Récupérer tous les prix d'un marchand
   */
  async getByMerchant(merchantId: string) {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Prize[];
  },

  /**
   * Créer un nouveau prix
   */
  async create(prize: Partial<Prize>) {
    const { data, error } = await supabase
      .from('prizes')
      .insert(prize)
      .select()
      .single();
    
    if (error) throw error;
    return data as Prize;
  },

  /**
   * Mettre à jour un prix
   */
  async update(id: string, updates: Partial<Prize>) {
    const { data, error } = await supabase
      .from('prizes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Prize;
  },

  /**
   * Supprimer un prix
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('prizes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Vérifier que les probabilités totalisent 100%
   */
  async validateProbabilities(merchantId: string): Promise<boolean> {
    const prizes = await this.getByMerchant(merchantId);
    const total = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    return Math.abs(total - 100) < 0.01; // Tolérance de 0.01%
  },
};

// ============================================
// FEEDBACK
// ============================================

export const feedback = {
  /**
   * Récupérer tous les feedbacks d'un marchand
   */
  async getByMerchant(merchantId: string, filters?: { isPositive?: boolean }) {
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    
    if (filters?.isPositive !== undefined) {
      query = query.eq('is_positive', filters.isPositive);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Feedback[];
  },

  /**
   * Créer un nouveau feedback
   */
  async create(feedback: Partial<Feedback>) {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback)
      .select()
      .single();
    
    if (error) throw error;
    return data as Feedback;
  },

  /**
   * Obtenir les statistiques de feedback
   */
  async getStats(merchantId: string) {
    const allFeedback = await this.getByMerchant(merchantId);
    
    const totalCount = allFeedback.length;
    const positiveCount = allFeedback.filter(f => f.is_positive).length;
    const negativeCount = totalCount - positiveCount;
    const avgRating = totalCount > 0 
      ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalCount 
      : 0;
    
    return {
      totalCount,
      positiveCount,
      negativeCount,
      avgRating: Math.round(avgRating * 10) / 10,
      conversionRate: totalCount > 0 ? (positiveCount / totalCount) * 100 : 0,
    };
  },
};

// ============================================
// SPINS
// ============================================

export const spins = {
  /**
   * Récupérer tous les spins d'un marchand
   */
  async getByMerchant(merchantId: string) {
    const { data, error } = await supabase
      .from('spins')
      .select('*, prizes(*)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Vérifier si un utilisateur a déjà tourné aujourd'hui
   */
  async hasSpunToday(merchantId: string, userToken: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('spins')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('user_token', userToken)
      .gte('created_at', today.toISOString())
      .limit(1);
    
    if (error) throw error;
    return (data?.length || 0) > 0;
  },

  /**
   * Créer un nouveau spin
   */
  async create(spin: Partial<Spin>) {
    const { data, error } = await supabase
      .from('spins')
      .insert(spin)
      .select()
      .single();
    
    if (error) throw error;
    return data as Spin;
  },
};

// ============================================
// COUPONS
// ============================================

export const coupons = {
  /**
   * Récupérer un coupon par code
   */
  async getByCode(code: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    return data as Coupon;
  },

  /**
   * Créer un nouveau coupon
   */
  async create(coupon: Partial<Coupon>) {
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupon)
      .select()
      .single();
    
    if (error) throw error;
    return data as Coupon;
  },

  /**
   * Marquer un coupon comme utilisé
   */
  async markAsUsed(code: string) {
    const { data, error } = await supabase
      .from('coupons')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('code', code)
      .select()
      .single();
    
    if (error) throw error;
    return data as Coupon;
  },

  /**
   * Vérifier si un coupon est valide
   */
  async isValid(code: string): Promise<boolean> {
    try {
      const coupon = await this.getByCode(code);
      const now = new Date();
      const expiresAt = new Date(coupon.expires_at);
      
      return !coupon.used && now < expiresAt;
    } catch {
      return false;
    }
  },
};

// ============================================
// SUBSCRIPTION TIERS
// ============================================

export const subscriptionTiers = {
  /**
   * Récupérer tous les tiers d'abonnement
   */
  async getAll() {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) throw error;
    return data as SubscriptionTier[];
  },

  /**
   * Récupérer un tier par nom
   */
  async getByName(tierName: string) {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('tier_name', tierName)
      .single();
    
    if (error) throw error;
    return data as SubscriptionTier;
  },
};

// ============================================
// UTILITIES
// ============================================

export const utils = {
  /**
   * Générer un code de coupon unique
   */
  generateCouponCode(prefix: string = 'STAR'): string {
    const randomPart = crypto.randomUUID().substring(0, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  },

  /**
   * Calculer la date d'expiration d'un coupon
   */
  getCouponExpiration(hours: number = 24): string {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt.toISOString();
  },

  /**
   * Formater une date pour l'affichage
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
