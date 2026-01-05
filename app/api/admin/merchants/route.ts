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

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `admin:${clientIP}`,
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

    // Get admin client - returns null if env vars not configured
    const adminClient = getSupabaseAdmin();

    if (!adminClient) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    // Verify the user is authenticated via the regular client
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin authorization
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const userEmail = user.email?.toLowerCase();

    if (adminEmails.length === 0) {
      console.warn('No admin emails configured');
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 403 });
    }

    if (!userEmail || !adminEmails.includes(userEmail)) {
      console.warn(`Unauthorized admin API access attempt by: ${userEmail}`);
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all related data in parallel to avoid N+1 problem
    const [
      { data: merchants, error: merchantsError },
      { data: feedback, error: feedbackError },
      { data: spins, error: spinsError },
      { data: coupons, error: couponsError }
    ] = await Promise.all([
      adminClient.from('merchants').select('*').order('created_at', { ascending: false }),
      adminClient.from('feedback').select('merchant_id, rating, is_positive'),
      adminClient.from('spins').select('merchant_id'),
      adminClient.from('coupons').select('merchant_id, used')
    ]);

    if (merchantsError) throw merchantsError;
    if (feedbackError) console.error('Error fetching feedback:', feedbackError);
    if (spinsError) console.error('Error fetching spins:', spinsError);
    if (couponsError) console.error('Error fetching coupons:', couponsError);

    // Group stats by merchant_id
    const statsByMerchant = (merchants || []).reduce((acc: any, merchant) => {
      acc[merchant.id] = {
        totalReviews: 0,
        positiveReviews: 0,
        totalRatingSum: 0,
        totalSpins: 0,
        couponsRedeemed: 0
      };
      return acc;
    }, {});

    // Process feedback
    (feedback || []).forEach((f: any) => {
      if (statsByMerchant[f.merchant_id]) {
        statsByMerchant[f.merchant_id].totalReviews++;
        statsByMerchant[f.merchant_id].totalRatingSum += f.rating;
        if (f.is_positive) statsByMerchant[f.merchant_id].positiveReviews++;
      }
    });

    // Process spins
    (spins || []).forEach((s: any) => {
      if (statsByMerchant[s.merchant_id]) {
        statsByMerchant[s.merchant_id].totalSpins++;
      }
    });

    // Process coupons
    (coupons || []).forEach((c: any) => {
      if (statsByMerchant[c.merchant_id] && c.used) {
        statsByMerchant[c.merchant_id].couponsRedeemed++;
      }
    });

    // Format final response
    const merchantsWithStats = (merchants || []).map((merchant) => {
      const stats = statsByMerchant[merchant.id];
      const avgRating = stats.totalReviews > 0 
        ? stats.totalRatingSum / stats.totalReviews 
        : 0;

      return {
        ...merchant,
        stats: {
          totalReviews: stats.totalReviews,
          positiveReviews: stats.positiveReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          totalSpins: stats.totalSpins,
          couponsRedeemed: stats.couponsRedeemed,
        }
      };
    });

    // Calculate global stats
    const globalStats = {
      totalMerchants: merchants?.length || 0,
      activeMerchants: merchants?.filter(m => m.is_active !== false).length || 0,
      totalReviews: merchantsWithStats.reduce((sum, m) => sum + m.stats.totalReviews, 0),
      totalSpins: merchantsWithStats.reduce((sum, m) => sum + m.stats.totalSpins, 0),
      totalCouponsRedeemed: merchantsWithStats.reduce((sum, m) => sum + m.stats.couponsRedeemed, 0),
    };

    return NextResponse.json({
      merchants: merchantsWithStats,
      globalStats,
    });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
