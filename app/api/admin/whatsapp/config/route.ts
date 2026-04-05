import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/utils/security';

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

// GET - List all WA Business configs with merchant names
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: configs } = await adminClient
    .from('wa_business_config')
    .select('*, merchants(business_name, email)')
    .order('created_at', { ascending: false });

  const result = (configs || []).map((c: any) => ({
    ...c,
    business_name: c.merchants?.business_name || c.merchants?.email || '',
    merchants: undefined,
  }));

  return NextResponse.json(result);
}

// POST - Create or update WA config for a merchant
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { merchant_id, waba_id, phone_number_id, access_token, display_phone, business_id, app_id } = body;

  if (!merchant_id || !waba_id || !phone_number_id || !access_token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('wa_business_config')
    .upsert({
      merchant_id, waba_id, phone_number_id, access_token,
      display_phone: display_phone || null,
      business_id: business_id || null,
      app_id: app_id || null,
      is_active: true,
    }, { onConflict: 'merchant_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - Remove WA config for a merchant
export async function DELETE(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const merchantId = request.nextUrl.searchParams.get('merchant_id');
  if (!merchantId) return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });

  const { error } = await adminClient.from('wa_business_config').delete().eq('merchant_id', merchantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
