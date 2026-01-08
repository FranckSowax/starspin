import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Vérification des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client pour bypass RLS
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET /api/loyalty/rewards
 *
 * Récupère les récompenses d'un merchant
 *
 * Query params:
 * - merchantId: UUID du merchant (obligatoire)
 * - activeOnly: "true" pour n'afficher que les récompenses actives (optionnel)
 * - includeStats: "true" pour inclure le nombre de fois échangées (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REWARDS GET] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error', rewards: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required', rewards: [] },
        { status: 200 } // Return 200 with empty array to not break UI
      );
    }

    let query = supabaseAdmin
      .from('loyalty_rewards')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('sort_order', { ascending: true })
      .order('points_cost', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: rewards, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si on veut les stats, on récupère le nombre d'échanges par récompense
    if (includeStats && rewards && rewards.length > 0) {
      const rewardIds = rewards.map(r => r.id);

      const { data: stats } = await supabaseAdmin
        .from('redeemed_rewards')
        .select('reward_id')
        .in('reward_id', rewardIds);

      // Compter les échanges par reward
      const redeemCounts: Record<string, number> = {};
      stats?.forEach(s => {
        if (s.reward_id) {
          redeemCounts[s.reward_id] = (redeemCounts[s.reward_id] || 0) + 1;
        }
      });

      // Ajouter les stats aux récompenses
      const rewardsWithStats = rewards.map(reward => ({
        ...reward,
        times_redeemed: redeemCounts[reward.id] || 0
      }));

      return NextResponse.json({ rewards: rewardsWithStats });
    }

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('[LOYALTY REWARDS GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/rewards
 *
 * Crée une nouvelle récompense
 *
 * Body: {
 *   merchantId: string,
 *   name: string,
 *   description?: string,
 *   type: 'discount' | 'product' | 'service' | 'cashback',
 *   value: string,
 *   pointsCost: number,
 *   quantityAvailable?: number (null = illimité),
 *   imageUrl?: string,
 *   validUntil?: string (ISO date)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REWARDS POST] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      merchantId,
      name,
      description,
      type,
      value,
      pointsCost,
      quantityAvailable,
      imageUrl,
      validUntil
    } = body;

    if (!merchantId || !name || !type || !value || !pointsCost) {
      return NextResponse.json(
        { error: 'merchantId, name, type, value, and pointsCost are required' },
        { status: 400 }
      );
    }

    if (pointsCost <= 0) {
      return NextResponse.json(
        { error: 'pointsCost must be positive' },
        { status: 400 }
      );
    }

    const validTypes = ['discount', 'product', 'service', 'cashback'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Use: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier que le merchant existe
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, loyalty_enabled')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Récupérer le dernier sort_order
    const { data: lastReward } = await supabaseAdmin
      .from('loyalty_rewards')
      .select('sort_order')
      .eq('merchant_id', merchantId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastReward?.sort_order || 0) + 1;

    const { data: reward, error: createError } = await supabaseAdmin
      .from('loyalty_rewards')
      .insert({
        merchant_id: merchantId,
        name,
        description: description || null,
        type,
        value,
        points_cost: pointsCost,
        quantity_available: quantityAvailable || null,
        image_url: imageUrl || null,
        valid_until: validUntil || null,
        is_active: true,
        sort_order: sortOrder
      })
      .select()
      .single();

    if (createError) {
      console.error('[LOYALTY REWARDS] Create error:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error('[LOYALTY REWARDS POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/loyalty/rewards
 *
 * Met à jour une récompense
 *
 * Body: {
 *   rewardId: string,
 *   merchantId: string,
 *   updates: Partial<LoyaltyReward>
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REWARDS PATCH] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { rewardId, merchantId, updates } = body;

    if (!rewardId || !merchantId) {
      return NextResponse.json(
        { error: 'rewardId and merchantId are required' },
        { status: 400 }
      );
    }

    // Champs autorisés pour mise à jour
    const allowedFields = [
      'name', 'description', 'type', 'value', 'points_cost',
      'quantity_available', 'image_url', 'valid_until', 'is_active', 'sort_order'
    ];

    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      } else if (updates[camelKey] !== undefined) {
        sanitizedUpdates[key] = updates[camelKey];
      }
    }

    if (sanitizedUpdates.points_cost !== undefined && sanitizedUpdates.points_cost <= 0) {
      return NextResponse.json(
        { error: 'points_cost must be positive' },
        { status: 400 }
      );
    }

    const { data: reward, error } = await supabaseAdmin
      .from('loyalty_rewards')
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('[LOYALTY REWARDS PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/loyalty/rewards
 *
 * Supprime une récompense
 *
 * Query params:
 * - rewardId: UUID de la récompense
 * - merchantId: UUID du merchant
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REWARDS DELETE] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Support both query params and body for DELETE
    let rewardId: string | null = null;
    let merchantId: string | null = null;

    // Try query params first
    const { searchParams } = new URL(request.url);
    rewardId = searchParams.get('rewardId');
    merchantId = searchParams.get('merchantId');

    // If not in query params, try body
    if (!rewardId || !merchantId) {
      try {
        const body = await request.json();
        rewardId = body.rewardId || rewardId;
        merchantId = body.merchantId || merchantId;
      } catch {
        // Body parsing failed, continue with query params
      }
    }

    if (!rewardId || !merchantId) {
      return NextResponse.json(
        { error: 'rewardId and merchantId are required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('loyalty_rewards')
      .delete()
      .eq('id', rewardId)
      .eq('merchant_id', merchantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOYALTY REWARDS DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
