/**
 * WhatsApp shared types — used by config.ts, client.ts, and all API routes
 */

export type WhatsAppProvider = 'whapi' | 'meta';

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  merchantId: string;
  // Meta Cloud API
  wabaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  // Whapi (legacy / transactional)
  whapiApiKey?: string;
}

// ==========================================
// Message Payloads
// ==========================================

export interface WhatsAppInteractivePayload {
  to: string;
  header?: { type: 'text' | 'image' | 'video'; text?: string; link?: string };
  body: string;
  footer?: string;
  buttons: { id: string; title: string; url?: string }[];
}

export interface WhatsAppTextPayload {
  to: string;
  body: string;
}

export interface WhatsAppTemplatePayload {
  to: string;
  templateName: string;
  languageCode: string;
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: TemplateParameter[];
  sub_type?: string;
  index?: number;
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  image?: { link: string };
  video?: { link: string };
  document?: { link: string };
}

export interface WhatsAppCarouselPayload {
  to: string;
  body: { text: string };
  cards: {
    media: { media: string };
    text: string;
    id: string;
    buttons: { type: string; title: string; id: string; url?: string }[];
  }[];
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ==========================================
// Database interfaces
// ==========================================

export interface MerchantWhatsAppConfig {
  id: string;
  merchant_id: string;
  provider: WhatsAppProvider;
  waba_id: string | null;
  phone_number_id: string | null;
  access_token: string | null;
  display_phone: string | null;
  is_verified: boolean;
  webhook_verify_token: string | null;
  whapi_api_key: string | null;
  message_price: number;
  price_currency: string;
  configured_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';

export interface WhatsAppTemplate {
  id: string;
  merchant_id: string;
  meta_template_id: string | null;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: TemplateStatus;
  components: any; // JSONB - Meta template components
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCampaignMessage {
  id: string;
  campaign_id: string;
  merchant_id: string;
  recipient_phone: string;
  recipient_name: string | null;
  meta_message_id: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  cost: number;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string;
}

// ==========================================
// Credit packs
// ==========================================

export const CREDIT_PACKS = [
  { id: 'pack_100', name: '100 crédits', credits: 100, price: 180, currency: 'THB' },
  { id: 'pack_500', name: '500 crédits', credits: 500, price: 750, currency: 'THB' },
  { id: 'pack_1000', name: '1 000 crédits', credits: 1000, price: 1200, currency: 'THB' },
  { id: 'pack_5000', name: '5 000 crédits', credits: 5000, price: 5000, currency: 'THB' },
];
