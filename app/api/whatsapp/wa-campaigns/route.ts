import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// GET - List campaigns for a merchant
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await adminClient
    .from('wa_campaigns')
    .select('*, wa_templates(name, status, category)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const campaigns = (data || []).map((c: any) => ({
    ...c,
    template_name: c.wa_templates?.name || '',
    template_status: c.wa_templates?.status || '',
    wa_templates: undefined,
  }));

  return NextResponse.json(campaigns);
}

// POST - Create a campaign with pricing
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { merchantId, templateId, name, recipients } = await request.json();
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!templateId || !name || !recipients?.length) {
    return NextResponse.json({ error: 'templateId, name, and recipients required' }, { status: 400 });
  }

  // Verify template is APPROVED
  const { data: template } = await adminClient
    .from('wa_templates')
    .select('*')
    .eq('id', templateId)
    .eq('merchant_id', merchantId)
    .single();

  if (!template || template.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Template must be approved by Meta' }, { status: 400 });
  }

  // Get pricing
  const { data: merchant } = await adminClient
    .from('merchants')
    .select('subscription_tier')
    .eq('id', merchantId)
    .single();

  // Default to EUR pricing
  const { data: pricing } = await adminClient
    .from('wa_pricing')
    .select('*')
    .eq('currency', 'EUR')
    .eq('is_active', true)
    .single();

  const pricePerMessage = pricing?.price_per_message || 0.05;
  const totalCost = recipients.length * pricePerMessage;

  // Create campaign
  const { data: campaign, error: campErr } = await adminClient
    .from('wa_campaigns')
    .insert({
      merchant_id: merchantId,
      template_id: templateId,
      name,
      total_recipients: recipients.length,
      price_per_message: pricePerMessage,
      total_cost: totalCost,
      currency: pricing?.currency || 'EUR',
      status: 'DRAFT',
    })
    .select()
    .single();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  // Create individual message records
  const messages = recipients.map((phone: string) => ({
    campaign_id: campaign.id,
    merchant_id: merchantId,
    phone_number: phone,
    status: 'PENDING',
  }));

  const { error: msgErr } = await adminClient.from('wa_campaign_messages').insert(messages);
  if (msgErr) console.error('Error creating message records:', msgErr);

  return NextResponse.json({
    ...campaign,
    pricing: {
      price_per_message: pricePerMessage,
      total_recipients: recipients.length,
      total_cost: totalCost,
      currency: pricing?.currency || 'EUR',
    },
  });
}
