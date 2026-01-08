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
 * GET /api/loyalty/wallet/apple
 *
 * Génère un fichier .pkpass pour Apple Wallet
 *
 * Query params:
 * - clientId: UUID du client fidélité (qr_code_data)
 *
 * Note: Cette API nécessite les certificats Apple Developer pour fonctionner
 * en production. Pour l'instant, elle retourne les informations nécessaires
 * pour la configuration future.
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[APPLE WALLET] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    // Récupérer le client par son qr_code_data
    const { data: client, error: clientError } = await supabaseAdmin
      .from('loyalty_clients')
      .select('*')
      .eq('qr_code_data', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Récupérer les infos du merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, logo_url, loyalty_card_image_url, background_url')
      .eq('id', client.merchant_id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Vérifier si Apple Wallet est configuré
    const applePassTypeId = process.env.APPLE_PASS_TYPE_ID;
    const appleTeamId = process.env.APPLE_TEAM_ID;
    const appleCertificate = process.env.APPLE_PASS_CERTIFICATE;
    const appleCertPassword = process.env.APPLE_PASS_CERTIFICATE_PASSWORD;

    if (!applePassTypeId || !appleTeamId || !appleCertificate || !appleCertPassword) {
      // Retourner les infos pour configuration future
      return NextResponse.json({
        configured: false,
        message: 'Apple Wallet not configured. Please set the following environment variables:',
        requiredEnvVars: [
          'APPLE_PASS_TYPE_ID',
          'APPLE_TEAM_ID',
          'APPLE_PASS_CERTIFICATE',
          'APPLE_PASS_CERTIFICATE_PASSWORD'
        ],
        passData: {
          organizationName: merchant.business_name,
          serialNumber: client.card_id,
          description: `Carte fidélité ${merchant.business_name}`,
          logoText: merchant.business_name,
          foregroundColor: 'rgb(255, 255, 255)',
          backgroundColor: 'rgb(245, 158, 11)',
          labelColor: 'rgb(255, 255, 255)',
          storeCard: {
            headerFields: [
              {
                key: 'points',
                label: 'POINTS',
                value: client.points
              }
            ],
            primaryFields: [
              {
                key: 'balance',
                label: 'Solde',
                value: `${client.points} pts`
              }
            ],
            secondaryFields: [
              {
                key: 'name',
                label: 'Membre',
                value: client.name || 'Client fidèle'
              }
            ],
            auxiliaryFields: [
              {
                key: 'cardId',
                label: 'N° Carte',
                value: client.card_id
              }
            ],
            backFields: [
              {
                key: 'terms',
                label: 'Conditions',
                value: 'Carte de fidélité valable dans tous les établissements participants.'
              }
            ]
          },
          barcode: {
            format: 'PKBarcodeFormatQR',
            message: client.qr_code_data,
            messageEncoding: 'iso-8859-1'
          }
        }
      });
    }

    // TODO: Implémenter la génération du .pkpass avec passkit-generator
    // Pour l'instant, retourner une erreur indiquant que la fonctionnalité arrive
    return NextResponse.json({
      configured: true,
      message: 'Apple Wallet pass generation coming soon',
      passData: {
        cardId: client.card_id,
        points: client.points,
        merchantName: merchant.business_name
      }
    });

  } catch (error) {
    console.error('[APPLE WALLET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/wallet/apple
 *
 * Enregistre le serial du pass Apple pour les mises à jour push
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { clientId, passSerial } = body;

    if (!clientId || !passSerial) {
      return NextResponse.json(
        { error: 'clientId and passSerial are required' },
        { status: 400 }
      );
    }

    // Mettre à jour le client avec le serial du pass
    const { error } = await supabaseAdmin
      .from('loyalty_clients')
      .update({ apple_pass_serial: passSerial })
      .eq('qr_code_data', clientId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[APPLE WALLET POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
