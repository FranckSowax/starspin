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

    // Fetch all merchants using admin client (bypasses RLS)
    const { data: merchants, error: merchantsError } = await adminClient
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (merchantsError) {
      console.error('Error fetching merchants:', merchantsError);
      return NextResponse.json({ error: merchantsError.message }, { status: 500 });
    }

    // Fetch stats for each merchant
    const merchantsWithStats = await Promise.all(
      (merchants || []).map(async (merchant) => {
        // Get feedback stats
        const { data: feedbackData } = await adminClient
          .from('feedback')
          .select('rating, is_positive')
          .eq('merchant_id', merchant.id);

        // Get spins count
        const { count: spinsCount } = await adminClient
          .from('spins')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchant.id);

        // Get coupons stats
        const { data: couponsData } = await adminClient
          .from('coupons')
          .select('used')
          .eq('merchant_id', merchant.id);

        const safeFeedbackData = feedbackData || [];
        const totalReviews = safeFeedbackData.length;
        const positiveReviews = safeFeedbackData.filter(f => f.is_positive).length;
        const avgRating = totalReviews > 0 
          ? safeFeedbackData.reduce((sum, f) => sum + f.rating, 0) / totalReviews 
          : 0;
        const couponsRedeemed = couponsData?.filter(c => c.used).length || 0;

        return {
          ...merchant,
          stats: {
            totalReviews,
            positiveReviews,
            avgRating: Math.round(avgRating * 10) / 10,
            totalSpins: spinsCount || 0,
            couponsRedeemed,
          }
        };
      })
    );

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
