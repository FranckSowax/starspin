export interface Merchant {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  logo_url: string | null;
  branding: Record<string, any>;
  google_review_link: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

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

export interface Feedback {
  id: string;
  merchant_id: string;
  rating: number;
  comment: string | null;
  is_positive: boolean;
  user_token: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface Spin {
  id: string;
  merchant_id: string;
  prize_id: string | null;
  ip_hash: string | null;
  user_token: string | null;
  created_at: string;
}

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

export interface QRCode {
  id: string;
  merchant_id: string;
  asset_url: string;
  asset_type: string;
  created_at: string;
}

export interface SubscriptionTier {
  tier_name: string;
  max_locations: number;
  price: number;
  features: Record<string, any>;
}
