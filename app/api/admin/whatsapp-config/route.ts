import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaToken } from '@/lib/whatsapp/client';

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

async function verifyAdmin(request: NextRequest, adminClient: SupabaseClient) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) return null;
  return user;
}

// GET - List all merchant WhatsApp configs with merchant info
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: configs } = await adminClient
    .from('merchant_whatsapp_config')
    .select('*, merchants(business_name, email)')
    .order('created_at', { ascending: false });

  const result = (configs || []).map((c: any) => ({
    ...c,
    business_name: c.merchants?.business_name || c.merchants?.email || '',
    merchants: undefined,
  }));

  return NextResponse.json(result);
}

// POST - Create or update WhatsApp config for a merchant
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const {
    action,
    merchant_id,
    provider,
    waba_id,
    phone_number_id,
    access_token,
    display_phone,
    whapi_api_key,
    message_price,
    price_currency,
  } = body;

  if (!merchant_id) {
    return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });
  }

  // Verify Meta token action
  if (action === 'verify') {
    if (!phone_number_id || !access_token) {
      return NextResponse.json({ error: 'phone_number_id and access_token required for verification' }, { status: 400 });
    }

    const result = await verifyMetaToken(phone_number_id, access_token);
    if (!result.verified) {
      return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('merchant_whatsapp_config')
      .upsert({
        merchant_id,
        provider: provider || 'meta',
        waba_id: waba_id || null,
        phone_number_id,
        access_token,
        display_phone: result.display_phone || display_phone || null,
        whapi_api_key: whapi_api_key || null,
        message_price: message_price ?? 1.80,
        price_currency: price_currency || 'THB',
        is_verified: true,
        configured_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, verification: result });
  }

  // Standard upsert
  const { data, error } = await adminClient
    .from('merchant_whatsapp_config')
    .upsert({
      merchant_id,
      provider: provider || 'meta',
      waba_id: waba_id || null,
      phone_number_id: phone_number_id || null,
      access_token: access_token || null,
      display_phone: display_phone || null,
      whapi_api_key: whapi_api_key || null,
      message_price: message_price ?? 1.80,
      price_currency: price_currency || 'THB',
      configured_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'merchant_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - Remove WhatsApp config for a merchant
export async function DELETE(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const merchantId = request.nextUrl.searchParams.get('merchant_id');
  if (!merchantId) return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });

  const { error } = await adminClient.from('merchant_whatsapp_config').delete().eq('merchant_id', merchantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
