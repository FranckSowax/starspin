import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/utils/security';

// Lazy initialization of admin client to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return supabaseAdmin;
}

export interface LoyaltyClient {
  id: string;
  merchant_id: string;
  card_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  total_purchases: number;
  total_spent: number;
  qr_code_data: string;
  status: 'active' | 'suspended' | 'expired';
  last_visit: string | null;
  created_at: string;
  updated_at: string;
  merchant?: {
    business_name: string;
    logo_url: string | null;
  };
}

export interface LoyaltyStats {
  totalCards: number;
  activeCards: number;
  totalPoints: number;
  totalPurchases: number;
  totalSpent: number;
  cardsThisMonth: number;
  pointsDistributed: number;
  pointsRedeemed: number;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `admin-loyalty:${clientIP}`,
      RATE_LIMITS.API_DEFAULT.limit,
      RATE_LIMITS.API_DEFAULT.windowMs
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const adminClient = getSupabaseAdmin();

    if (!adminClient) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin authorization
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const userEmail = user.email?.toLowerCase();

    if (adminEmails.length === 0) {
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 403 });
    }

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // First check if loyalty_clients table exists
    const { error: tableCheckError } = await adminClient
      .from('loyalty_clients')
      .select('id')
      .limit(1);

    // If table doesn't exist, return empty data
    if (tableCheckError?.code === '42P01') {
      return NextResponse.json({
        clients: [],
        stats: {
          totalCards: 0,
          activeCards: 0,
          totalPoints: 0,
          totalPurchases: 0,
          totalSpent: 0,
          cardsThisMonth: 0,
          pointsDistributed: 0,
          pointsRedeemed: 0
        },
        total: 0
      });
    }

    // Fetch loyalty clients with merchant info
    let query = adminClient
      .from('loyalty_clients')
      .select(`
        *,
        merchant:merchants(business_name, logo_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,card_id.ilike.%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: clients, error: clientsError, count } = await query;

    if (clientsError) {
      console.error('Error fetching loyalty clients:', clientsError);
      throw clientsError;
    }

    // Get aggregate stats
    const { data: allClients } = await adminClient
      .from('loyalty_clients')
      .select('id, points, total_purchases, total_spent, status, created_at');

    // Try to get transactions, but don't fail if table doesn't exist
    let transactions: { type: string; points: number }[] = [];
    try {
      const { data: txData } = await adminClient
        .from('points_transactions')
        .select('type, points');
      transactions = txData || [];
    } catch {
      transactions = [];
    }

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    interface ClientData {
      id: string;
      points: number;
      total_purchases: number;
      total_spent: string | number;
      status: string;
      created_at: string;
    }

    const clientList = (allClients || []) as ClientData[];

    const stats: LoyaltyStats = {
      totalCards: clientList.length,
      activeCards: clientList.filter((c: ClientData) => c.status === 'active').length,
      totalPoints: clientList.reduce((sum: number, c: ClientData) => sum + (c.points || 0), 0),
      totalPurchases: clientList.reduce((sum: number, c: ClientData) => sum + (c.total_purchases || 0), 0),
      totalSpent: clientList.reduce((sum: number, c: ClientData) => sum + (parseFloat(String(c.total_spent)) || 0), 0),
      cardsThisMonth: clientList.filter((c: ClientData) => c.created_at >= startOfMonth).length,
      pointsDistributed: transactions.filter(t => t.type === 'earn' || t.type === 'welcome' || t.type === 'bonus').reduce((sum, t) => sum + Math.abs(t.points || 0), 0),
      pointsRedeemed: transactions.filter(t => t.type === 'redeem').reduce((sum, t) => sum + Math.abs(t.points || 0), 0)
    };

    return NextResponse.json({
      clients: clients || [],
      stats,
      total: count || 0
    });

  } catch (error: any) {
    console.error('Admin Loyalty API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
