import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api';
import type { WaBusinessConfig, SendTemplateParams } from '@/lib/whatsapp/meta-api';

let supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseAdmin;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST - Send a campaign
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Verify user
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId, merchantId, templateVariables } = await request.json();
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch campaign
  const { data: campaign } = await adminClient
    .from('wa_campaigns')
    .select('*, wa_templates(*)')
    .eq('id', campaignId)
    .eq('merchant_id', merchantId)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Campaign already sent or in progress' }, { status: 400 });
  }

  // Get WA config
  const { data: config } = await adminClient
    .from('wa_business_config')
    .select('*')
    .eq('merchant_id', merchantId)
    .single();

  if (!config) return NextResponse.json({ error: 'WhatsApp Business not configured' }, { status: 400 });

  const waConfig: WaBusinessConfig = {
    waba_id: config.waba_id,
    phone_number_id: config.phone_number_id,
    access_token: config.access_token,
    business_id: config.business_id,
    app_id: config.app_id,
  };

  const template = campaign.wa_templates;
  if (!template || template.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Template not approved' }, { status: 400 });
  }

  // Update campaign status
  await adminClient.from('wa_campaigns').update({ status: 'SENDING' }).eq('id', campaignId);

  // Fetch pending messages
  const { data: messages } = await adminClient
    .from('wa_campaign_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'PENDING');

  let totalSent = 0;
  let totalFailed = 0;

  for (const msg of (messages || [])) {
    try {
      const sendParams: SendTemplateParams = {
        phoneNumber: msg.phone_number,
        templateName: template.name,
        language: template.language,
        bodyParams: templateVariables?.body || [],
        headerParams: templateVariables?.header || [],
      };

      // Add media header if template has one
      if (template.header_type === 'IMAGE' && template.header_content) {
        sendParams.headerMediaUrl = template.header_content;
        sendParams.headerMediaType = 'image';
      } else if (template.header_type === 'VIDEO' && template.header_content) {
        sendParams.headerMediaUrl = template.header_content;
        sendParams.headerMediaType = 'video';
      }

      const result = await sendTemplateMessage(waConfig, sendParams);

      await adminClient.from('wa_campaign_messages').update({
        wa_message_id: result.messages?.[0]?.id || null,
        status: 'SENT',
        sent_at: new Date().toISOString(),
      }).eq('id', msg.id);

      totalSent++;
    } catch (err: any) {
      await adminClient.from('wa_campaign_messages').update({
        status: 'FAILED',
        error_message: err.message,
      }).eq('id', msg.id);

      totalFailed++;
    }

    // Rate limiting: 200ms between sends
    await delay(200);
  }

  // Update campaign totals
  await adminClient.from('wa_campaigns').update({
    status: 'SENT',
    sent_at: new Date().toISOString(),
    total_sent: totalSent,
    total_failed: totalFailed,
  }).eq('id', campaignId);

  return NextResponse.json({
    success: true,
    total_sent: totalSent,
    total_failed: totalFailed,
    total_messages: (messages || []).length,
  });
}
