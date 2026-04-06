/**
 * WhatsApp config resolver — determines which provider/credentials to use per merchant
 */

import { createClient } from '@supabase/supabase-js';
import type { WhatsAppConfig } from './types';

let adminClient: ReturnType<typeof createClient> | null = null;

function getAdmin() {
  if (!adminClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return adminClient;
}

/**
 * Resolve WhatsApp config for a merchant.
 * Priority:
 *   1. merchant_whatsapp_config with provider='meta' + valid credentials
 *   2. merchant_whatsapp_config with provider='whapi' + api key
 *   3. Fallback to global WHAPI_API_KEY env var
 */
export async function getWhatsAppConfig(merchantId: string): Promise<WhatsAppConfig> {
  const admin = getAdmin();

  if (admin) {
    const { data: config } = await admin
      .from('merchant_whatsapp_config')
      .select('*')
      .eq('merchant_id', merchantId)
      .single() as { data: any };

    if (config) {
      if (config.provider === 'meta' && config.waba_id && config.phone_number_id && config.access_token) {
        return {
          provider: 'meta',
          merchantId,
          wabaId: config.waba_id,
          phoneNumberId: config.phone_number_id,
          accessToken: config.access_token,
        };
      }

      if (config.provider === 'whapi' && config.whapi_api_key) {
        return {
          provider: 'whapi',
          merchantId,
          whapiApiKey: config.whapi_api_key,
        };
      }
    }
  }

  // Fallback: global Whapi key
  return {
    provider: 'whapi',
    merchantId,
    whapiApiKey: process.env.WHAPI_API_KEY || '',
  };
}

/**
 * Get raw config row from DB (for admin display)
 */
export async function getRawConfig(merchantId: string) {
  const admin = getAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from('merchant_whatsapp_config')
    .select('*')
    .eq('merchant_id', merchantId)
    .single() as { data: any };
  return data;
}
