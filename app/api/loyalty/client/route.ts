import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Service role client pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/loyalty/client
 *
 * Query params:
 * - merchantId: UUID du merchant (obligatoire)
 * - clientId: UUID du client fidélité (optionnel)
 * - qrCode: QR code data du client (optionnel)
 * - phone: Numéro de téléphone (optionnel)
 * - email: Email du client (optionnel)
 *
 * Returns: LoyaltyClient ou liste de clients
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const clientId = searchParams.get('clientId');
    const qrCode = searchParams.get('qrCode');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    // Recherche par ID client spécifique
    if (clientId) {
      const { data, error } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('id', clientId)
        .eq('merchant_id', merchantId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json({ client: data });
    }

    // Recherche par QR code
    if (qrCode) {
      const { data, error } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('qr_code_data', qrCode)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Client not found', found: false }, { status: 404 });
      }

      return NextResponse.json({ client: data, found: true });
    }

    // Recherche par téléphone
    if (phone) {
      const { data, error } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('phone', phone)
        .single();

      if (error) {
        return NextResponse.json({ client: null, found: false });
      }

      return NextResponse.json({ client: data, found: true });
    }

    // Recherche par email
    if (email) {
      const { data, error } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        return NextResponse.json({ client: null, found: false });
      }

      return NextResponse.json({ client: data, found: true });
    }

    // Liste tous les clients du merchant
    const { data, error } = await supabaseAdmin
      .from('loyalty_clients')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: data });
  } catch (error) {
    console.error('[LOYALTY CLIENT GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/client
 *
 * Crée un nouveau client fidélité ou retourne l'existant
 *
 * Body: {
 *   merchantId: string,
 *   name?: string,
 *   phone?: string,
 *   email?: string,
 *   userToken?: string (lien avec feedback)
 * }
 *
 * Returns: { client: LoyaltyClient, isNew: boolean, welcomePoints?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, name, phone, email, userToken } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'phone or email is required' },
        { status: 400 }
      );
    }

    // Vérifier que le merchant existe et a la fidélité activée
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, loyalty_enabled, welcome_points')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.loyalty_enabled) {
      return NextResponse.json(
        { error: 'Loyalty program not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Vérifier si le client existe déjà (par phone ou email)
    let existingClient = null;

    if (phone) {
      const { data } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('phone', phone)
        .single();
      existingClient = data;
    }

    if (!existingClient && email) {
      const { data } = await supabaseAdmin
        .from('loyalty_clients')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('email', email.toLowerCase())
        .single();
      existingClient = data;
    }

    // Si existe, mettre à jour last_visit et retourner
    if (existingClient) {
      const { data: updatedClient, error: updateError } = await supabaseAdmin
        .from('loyalty_clients')
        .update({
          last_visit: new Date().toISOString(),
          // Mettre à jour le user_token si fourni
          ...(userToken && { user_token: userToken })
        })
        .eq('id', existingClient.id)
        .select()
        .single();

      if (updateError) {
        console.error('[LOYALTY CLIENT] Update error:', updateError);
      }

      return NextResponse.json({
        client: updatedClient || existingClient,
        isNew: false
      });
    }

    // Générer un nouveau card_id
    const { data: cardIdResult } = await supabaseAdmin
      .rpc('generate_loyalty_card_id', { p_merchant_id: merchantId });

    const cardId = cardIdResult || `STAR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    // Générer un QR code unique
    const qrCodeData = uuidv4();

    // Créer le nouveau client
    const welcomePoints = merchant.welcome_points || 50;

    const { data: newClient, error: createError } = await supabaseAdmin
      .from('loyalty_clients')
      .insert({
        merchant_id: merchantId,
        card_id: cardId,
        name: name || null,
        phone: phone || null,
        email: email ? email.toLowerCase() : null,
        points: welcomePoints,
        total_purchases: 0,
        total_spent: 0,
        qr_code_data: qrCodeData,
        user_token: userToken || null,
        status: 'active',
        last_visit: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('[LOYALTY CLIENT] Create error:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Créer la transaction de points de bienvenue
    if (welcomePoints > 0) {
      await supabaseAdmin
        .from('points_transactions')
        .insert({
          client_id: newClient.id,
          merchant_id: merchantId,
          type: 'welcome',
          points: welcomePoints,
          balance_after: welcomePoints,
          description: 'Points de bienvenue'
        });
    }

    return NextResponse.json({
      client: newClient,
      isNew: true,
      welcomePoints
    });
  } catch (error) {
    console.error('[LOYALTY CLIENT POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/loyalty/client
 *
 * Met à jour un client fidélité
 *
 * Body: {
 *   clientId: string,
 *   merchantId: string,
 *   updates: Partial<LoyaltyClient>
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, merchantId, updates } = body;

    if (!clientId || !merchantId) {
      return NextResponse.json(
        { error: 'clientId and merchantId are required' },
        { status: 400 }
      );
    }

    // Champs autorisés pour mise à jour
    const allowedFields = ['name', 'phone', 'email', 'status'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = key === 'email' ? updates[key]?.toLowerCase() : updates[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('loyalty_clients')
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error('[LOYALTY CLIENT PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
