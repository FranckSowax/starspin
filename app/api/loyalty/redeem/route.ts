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
 * Génère un code de rédemption unique
 */
async function generateRedemptionCode(): Promise<string> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let exists = true;

  while (exists) {
    // Générer un code au format RWD-XXXXXX
    const randomPart = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    code = `RWD-${randomPart}`;

    // Vérifier l'unicité
    const { data } = await supabaseAdmin
      .from('redeemed_rewards')
      .select('id')
      .eq('redemption_code', code)
      .single();

    exists = !!data;
  }

  return code!;
}

/**
 * GET /api/loyalty/redeem
 *
 * Récupère les récompenses échangées
 *
 * Query params:
 * - merchantId: UUID du merchant (obligatoire)
 * - clientId: UUID du client (optionnel - filtre par client)
 * - code: Code de rédemption (optionnel - recherche par code)
 * - status: 'pending' | 'used' | 'expired' (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REDEEM GET] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error', redeemedRewards: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const clientId = searchParams.get('clientId');
    const code = searchParams.get('code');
    const status = searchParams.get('status');

    // Recherche par code (accessible publiquement)
    if (code) {
      const { data: redeemedReward, error } = await supabaseAdmin
        .from('redeemed_rewards')
        .select(`
          *,
          loyalty_clients (
            id, name, phone, email, card_id
          )
        `)
        .eq('redemption_code', code.toUpperCase())
        .single();

      if (error || !redeemedReward) {
        return NextResponse.json(
          { error: 'Redemption code not found', found: false },
          { status: 404 }
        );
      }

      return NextResponse.json({ redeemedReward, found: true });
    }

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('redeemed_rewards')
      .select(`
        *,
        loyalty_clients (
          id, name, phone, email, card_id, points
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: redeemedRewards, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ redeemedRewards });
  } catch (error) {
    console.error('[LOYALTY REDEEM GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/redeem
 *
 * Échange des points contre une récompense
 *
 * Body: {
 *   clientId: string,
 *   merchantId: string,
 *   rewardId: string
 * }
 *
 * Returns: { redeemedReward, newBalance, redemptionCode }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REDEEM POST] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { clientId, merchantId, rewardId } = body;

    if (!clientId || !merchantId || !rewardId) {
      return NextResponse.json(
        { error: 'clientId, merchantId, and rewardId are required' },
        { status: 400 }
      );
    }

    // Récupérer le client et la récompense en parallèle
    const [clientResult, rewardResult] = await Promise.all([
      supabaseAdmin
        .from('loyalty_clients')
        .select('id, points, name')
        .eq('id', clientId)
        .eq('merchant_id', merchantId)
        .single(),
      supabaseAdmin
        .from('loyalty_rewards')
        .select('*')
        .eq('id', rewardId)
        .eq('merchant_id', merchantId)
        .single()
    ]);

    if (clientResult.error || !clientResult.data) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (rewardResult.error || !rewardResult.data) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    const client = clientResult.data;
    const reward = rewardResult.data;

    // Vérifications
    if (!reward.is_active) {
      return NextResponse.json(
        { error: 'This reward is no longer active' },
        { status: 400 }
      );
    }

    if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
      return NextResponse.json(
        { error: 'This reward has expired' },
        { status: 400 }
      );
    }

    if (reward.quantity_available !== null && reward.quantity_available <= 0) {
      return NextResponse.json(
        { error: 'This reward is out of stock' },
        { status: 400 }
      );
    }

    if (client.points < reward.points_cost) {
      return NextResponse.json(
        {
          error: 'Insufficient points',
          required: reward.points_cost,
          available: client.points
        },
        { status: 400 }
      );
    }

    // Générer le code de rédemption
    const redemptionCode = await generateRedemptionCode();

    // Date d'expiration (30 jours par défaut)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Créer l'enregistrement de rédemption
    const { data: redeemedReward, error: redeemError } = await supabaseAdmin
      .from('redeemed_rewards')
      .insert({
        client_id: clientId,
        reward_id: rewardId,
        merchant_id: merchantId,
        reward_name: reward.name,
        reward_value: reward.value,
        points_spent: reward.points_cost,
        redemption_code: redemptionCode,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (redeemError) {
      console.error('[LOYALTY REDEEM] Create error:', redeemError);
      return NextResponse.json(
        { error: redeemError.message },
        { status: 500 }
      );
    }

    const newBalance = client.points - reward.points_cost;

    // Créer la transaction de points
    await supabaseAdmin
      .from('points_transactions')
      .insert({
        client_id: clientId,
        merchant_id: merchantId,
        type: 'redeem',
        points: -reward.points_cost,
        balance_after: newBalance,
        description: `Échange: ${reward.name}`,
        reference_id: redeemedReward.id
      });

    // Mettre à jour le solde du client
    await supabaseAdmin
      .from('loyalty_clients')
      .update({
        points: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    // Décrémenter la quantité disponible si applicable
    if (reward.quantity_available !== null) {
      await supabaseAdmin
        .from('loyalty_rewards')
        .update({
          quantity_available: reward.quantity_available - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', rewardId);
    }

    return NextResponse.json({
      redeemedReward,
      newBalance,
      redemptionCode
    }, { status: 201 });
  } catch (error) {
    console.error('[LOYALTY REDEEM POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/loyalty/redeem
 *
 * Valide/utilise un code de rédemption
 *
 * Body: {
 *   redemptionCode: string,
 *   merchantId: string,
 *   action: 'use' | 'cancel'
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY REDEEM PATCH] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { redemptionCode, merchantId, action } = body;

    if (!redemptionCode || !merchantId || !action) {
      return NextResponse.json(
        { error: 'redemptionCode, merchantId, and action are required' },
        { status: 400 }
      );
    }

    // Récupérer la rédemption
    const { data: redeemedReward, error: fetchError } = await supabaseAdmin
      .from('redeemed_rewards')
      .select('*')
      .eq('redemption_code', redemptionCode.toUpperCase())
      .eq('merchant_id', merchantId)
      .single();

    if (fetchError || !redeemedReward) {
      return NextResponse.json(
        { error: 'Redemption code not found' },
        { status: 404 }
      );
    }

    if (redeemedReward.status === 'used') {
      return NextResponse.json(
        { error: 'This code has already been used', usedAt: redeemedReward.used_at },
        { status: 400 }
      );
    }

    if (redeemedReward.status === 'expired') {
      return NextResponse.json(
        { error: 'This code has expired' },
        { status: 400 }
      );
    }

    if (redeemedReward.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This code has been cancelled' },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (redeemedReward.expires_at && new Date(redeemedReward.expires_at) < new Date()) {
      // Marquer comme expiré
      await supabaseAdmin
        .from('redeemed_rewards')
        .update({ status: 'expired' })
        .eq('id', redeemedReward.id);

      return NextResponse.json(
        { error: 'This code has expired' },
        { status: 400 }
      );
    }

    let updateData: Record<string, any> = {};

    if (action === 'use') {
      updateData = {
        status: 'used',
        used_at: new Date().toISOString()
      };
    } else if (action === 'cancel') {
      updateData = {
        status: 'cancelled'
      };

      // Rembourser les points
      const { data: client } = await supabaseAdmin
        .from('loyalty_clients')
        .select('points')
        .eq('id', redeemedReward.client_id)
        .single();

      if (client) {
        const newBalance = client.points + redeemedReward.points_spent;

        // Créer transaction de remboursement
        await supabaseAdmin
          .from('points_transactions')
          .insert({
            client_id: redeemedReward.client_id,
            merchant_id: merchantId,
            type: 'adjustment',
            points: redeemedReward.points_spent,
            balance_after: newBalance,
            description: `Remboursement: ${redeemedReward.reward_name}`,
            reference_id: redeemedReward.id
          });

        // Mettre à jour le solde
        await supabaseAdmin
          .from('loyalty_clients')
          .update({ points: newBalance })
          .eq('id', redeemedReward.client_id);
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: use or cancel' },
        { status: 400 }
      );
    }

    const { data: updatedReward, error: updateError } = await supabaseAdmin
      .from('redeemed_rewards')
      .update(updateData)
      .eq('id', redeemedReward.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      redeemedReward: updatedReward,
      action,
      success: true
    });
  } catch (error) {
    console.error('[LOYALTY REDEEM PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
