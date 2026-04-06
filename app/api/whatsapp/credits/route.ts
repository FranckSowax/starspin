import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_PACKS } from '@/lib/whatsapp/types';

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

// GET - Return credits balance, available packs, and purchase history
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get merchant credit balance
  const { data: merchant, error: merchantError } = await adminClient
    .from('merchants')
    .select('campaign_credits')
    .eq('id', merchantId)
    .single();

  if (merchantError) return NextResponse.json({ error: merchantError.message }, { status: 500 });

  // Get purchase history
  const { data: purchases } = await adminClient
    .from('campaign_credit_purchases')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    credits: merchant?.campaign_credits ?? 0,
    packs: CREDIT_PACKS,
    purchases: purchases || [],
  });
}

// POST - Buy a credit pack
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { merchantId, packId } = body;

  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find the pack
  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });

  // Increment credits on the merchant
  const { data: merchant, error: updateError } = await adminClient
    .rpc('increment_campaign_credits', {
      p_merchant_id: merchantId,
      p_amount: pack.credits,
    });

  // Fallback: manual select + update if RPC doesn't exist
  let newBalance: number;
  if (updateError) {
    const { data: current } = await adminClient
      .from('merchants')
      .select('campaign_credits')
      .eq('id', merchantId)
      .single();

    const currentCredits = current?.campaign_credits ?? 0;
    newBalance = currentCredits + pack.credits;

    const { error: manualError } = await adminClient
      .from('merchants')
      .update({ campaign_credits: newBalance })
      .eq('id', merchantId);

    if (manualError) return NextResponse.json({ error: manualError.message }, { status: 500 });
  } else {
    newBalance = typeof merchant === 'number' ? merchant : merchant?.campaign_credits;
  }

  // Record the purchase
  const { error: purchaseError } = await adminClient
    .from('campaign_credit_purchases')
    .insert({
      merchant_id: merchantId,
      pack_name: pack.name,
      credits: pack.credits,
      price: pack.price,
      currency: pack.currency,
    });

  if (purchaseError) {
    console.warn('Failed to record credit purchase:', purchaseError.message);
  }

  return NextResponse.json({
    success: true,
    credits: newBalance!,
    purchased: pack,
  });
}
