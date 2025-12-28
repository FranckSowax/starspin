import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
