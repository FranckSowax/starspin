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

// GET - List all pricing configs
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await adminClient
    .from('wa_pricing')
    .select('*')
    .order('currency');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PUT - Update pricing
export async function PUT(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyAdmin(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, price_per_message } = await request.json();
  if (!id || price_per_message === undefined) {
    return NextResponse.json({ error: 'Missing id or price_per_message' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('wa_pricing')
    .update({ price_per_message })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
