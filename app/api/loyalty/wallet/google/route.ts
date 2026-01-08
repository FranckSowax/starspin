import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Vérification des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client pour bypass RLS
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Google Wallet API URLs
const GOOGLE_WALLET_API_URL = 'https://walletobjects.googleapis.com/walletobjects/v1';

/**
 * GET /api/loyalty/wallet/google
 *
 * Génère un lien Google Wallet pour ajouter la carte de fidélité
 *
 * Query params:
 * - clientId: UUID du client fidélité (qr_code_data)
 *
 * Note: Cette API nécessite les credentials Google Cloud pour fonctionner
 * en production. Pour l'instant, elle retourne les informations nécessaires
 * pour la configuration future.
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[GOOGLE WALLET] Missing SUPABASE_SERVICE_ROLE_KEY');
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

    // Vérifier si Google Wallet est configuré
    const googleIssuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const googleServiceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
    const googlePrivateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

    if (!googleIssuerId || !googleServiceAccountEmail || !googlePrivateKey) {
      // Retourner les infos pour configuration future
      return NextResponse.json({
        configured: false,
        message: 'Google Wallet not configured. Please set the following environment variables:',
        requiredEnvVars: [
          'GOOGLE_WALLET_ISSUER_ID',
          'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
          'GOOGLE_WALLET_PRIVATE_KEY'
        ],
        passData: {
          // LoyaltyClass (template pour tous les passes du merchant)
          loyaltyClass: {
            id: `${googleIssuerId || 'ISSUER_ID'}.starspin_${merchant.id}`,
            issuerName: merchant.business_name,
            programName: `Programme Fidélité ${merchant.business_name}`,
            programLogo: {
              sourceUri: {
                uri: merchant.logo_url || 'https://starspin.netlify.app/logo.png'
              }
            },
            heroImage: merchant.loyalty_card_image_url || merchant.background_url ? {
              sourceUri: {
                uri: merchant.loyalty_card_image_url || merchant.background_url
              }
            } : undefined,
            hexBackgroundColor: '#f59e0b',
            localizedProgramName: {
              defaultValue: {
                language: 'fr',
                value: `Programme Fidélité ${merchant.business_name}`
              }
            },
            reviewStatus: 'UNDER_REVIEW'
          },
          // LoyaltyObject (instance pour ce client spécifique)
          loyaltyObject: {
            id: `${googleIssuerId || 'ISSUER_ID'}.starspin_${client.id}`,
            classId: `${googleIssuerId || 'ISSUER_ID'}.starspin_${merchant.id}`,
            state: 'ACTIVE',
            accountId: client.card_id,
            accountName: client.name || 'Client fidèle',
            loyaltyPoints: {
              label: 'Points',
              balance: {
                int: client.points
              }
            },
            barcode: {
              type: 'QR_CODE',
              value: client.qr_code_data,
              alternateText: client.card_id
            },
            textModulesData: [
              {
                header: 'N° Carte',
                body: client.card_id
              },
              {
                header: 'Membre depuis',
                body: client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'Aujourd\'hui'
              }
            ]
          }
        }
      });
    }

    // TODO: Implémenter la génération du JWT et du lien Google Wallet
    // avec googleapis et jsonwebtoken
    return NextResponse.json({
      configured: true,
      message: 'Google Wallet pass generation coming soon',
      passData: {
        cardId: client.card_id,
        points: client.points,
        merchantName: merchant.business_name
      }
    });

  } catch (error) {
    console.error('[GOOGLE WALLET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/wallet/google
 *
 * Enregistre l'ID du pass Google pour les mises à jour
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
    const { clientId, passId } = body;

    if (!clientId || !passId) {
      return NextResponse.json(
        { error: 'clientId and passId are required' },
        { status: 400 }
      );
    }

    // Mettre à jour le client avec l'ID du pass Google
    const { error } = await supabaseAdmin
      .from('loyalty_clients')
      .update({ google_pass_id: passId })
      .eq('qr_code_data', clientId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[GOOGLE WALLET POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
