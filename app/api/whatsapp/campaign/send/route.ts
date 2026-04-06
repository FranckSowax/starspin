import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';
import { sendTemplateMessage } from '@/lib/whatsapp/client';

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

async function verifyUser(request: NextRequest, adminClient: SupabaseClient) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET - Return merchant's credit balance
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: merchant, error } = await adminClient
    .from('merchants')
    .select('campaign_credits')
    .eq('id', merchantId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ credits: merchant?.campaign_credits ?? 0 });
}

// POST - Send campaign messages
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { merchantId, campaignId, templateVariables } = body;

  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });

  // Fetch campaign
  const { data: campaign, error: campaignError } = await adminClient
    .from('whatsapp_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('merchant_id', merchantId)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Fetch template
  const { data: template, error: templateError } = await adminClient
    .from('whatsapp_templates')
    .select('*')
    .eq('id', campaign.template_id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Template must be APPROVED before sending' }, { status: 400 });
  }

  // Get WhatsApp config
  const config = await getWhatsAppConfig(merchantId);
  if (config.provider !== 'meta') {
    return NextResponse.json({ error: 'Meta Cloud API config required for campaigns' }, { status: 400 });
  }

  // Fetch queued messages
  const { data: messages, error: messagesError } = await adminClient
    .from('whatsapp_campaign_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'queued');

  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 });
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No queued messages to send' }, { status: 400 });
  }

  // Check credit balance
  const { data: merchant } = await adminClient
    .from('merchants')
    .select('campaign_credits')
    .eq('id', merchantId)
    .single();

  const credits = merchant?.campaign_credits ?? 0;
  if (credits < messages.length) {
    return NextResponse.json({
      error: 'Insufficient credits',
      required: messages.length,
      available: credits,
    }, { status: 402 });
  }

  // Update campaign status to SENDING
  await adminClient
    .from('whatsapp_campaigns')
    .update({ status: 'SENDING' })
    .eq('id', campaignId);

  // Send messages
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      const result = await sendTemplateMessage(config, {
        to: msg.recipient_phone,
        templateName: template.name,
        languageCode: template.language,
        components: templateVariables || undefined,
      });

      if (result.success) {
        sent++;
        await adminClient
          .from('whatsapp_campaign_messages')
          .update({
            status: 'sent',
            meta_message_id: result.messageId || null,
            sent_at: new Date().toISOString(),
          })
          .eq('id', msg.id);
      } else {
        failed++;
        await adminClient
          .from('whatsapp_campaign_messages')
          .update({
            status: 'failed',
            error_message: result.error || 'Unknown error',
            failed_at: new Date().toISOString(),
          })
          .eq('id', msg.id);
      }
    } catch (err: any) {
      failed++;
      await adminClient
        .from('whatsapp_campaign_messages')
        .update({
          status: 'failed',
          error_message: err.message,
          failed_at: new Date().toISOString(),
        })
        .eq('id', msg.id);
    }

    // Rate limiting delay
    await delay(100);
  }

  // Deduct credits (only successful sends)
  const creditsUsed = sent;
  if (creditsUsed > 0) {
    const newBalance = credits - creditsUsed;
    await adminClient
      .from('merchants')
      .update({ campaign_credits: newBalance })
      .eq('id', merchantId);
  }

  // Update campaign stats
  const now = new Date().toISOString();
  await adminClient
    .from('whatsapp_campaigns')
    .update({
      status: failed === messages.length ? 'FAILED' : 'SENT',
      send_count: (campaign.send_count || 0) + sent,
      actual_cost_fcfa: (campaign.actual_cost_fcfa || 0) + creditsUsed,
      last_sent_at: now,
    })
    .eq('id', campaignId);

  return NextResponse.json({
    sent,
    failed,
    creditsUsed,
    creditsRemaining: credits - creditsUsed,
  });
}
