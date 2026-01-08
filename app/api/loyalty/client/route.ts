import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Vérification des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client pour bypass RLS
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Whapi API endpoint for standard text messages
const WHAPI_TEXT_URL = 'https://gate.whapi.cloud/messages/text';
const WHAPI_INTERACTIVE_URL = 'https://gate.whapi.cloud/messages/interactive';

// Loyalty card message templates by language
const LOYALTY_CARD_MESSAGES: Record<string, (businessName: string, points: number, cardUrl: string) => string> = {
  fr: (businessName, points, cardUrl) =>
    `🎁 *CARTE FIDÉLITÉ - ${businessName}* 🎁\n\nFélicitations ! Votre carte de fidélité a été créée.\n\n⭐ *${points} points de bienvenue* offerts !\n\n📱 Accédez à votre carte pour :\n• Consulter votre solde de points\n• Échanger vos points contre des récompenses\n• Ajouter la carte à votre Wallet\n\n👇 Ouvrir ma carte :\n${cardUrl}`,
  en: (businessName, points, cardUrl) =>
    `🎁 *LOYALTY CARD - ${businessName}* 🎁\n\nCongratulations! Your loyalty card has been created.\n\n⭐ *${points} welcome points* offered!\n\n📱 Access your card to:\n• Check your points balance\n• Redeem points for rewards\n• Add card to your Wallet\n\n👇 Open my card:\n${cardUrl}`,
  th: (businessName, points, cardUrl) =>
    `🎁 *บัตรสมาชิก - ${businessName}* 🎁\n\nยินดีด้วย! บัตรสมาชิกของคุณถูกสร้างแล้ว\n\n⭐ *${points} แต้มต้อนรับ* ฟรี!\n\n📱 เข้าถึงบัตรของคุณเพื่อ:\n• ตรวจสอบยอดแต้ม\n• แลกแต้มรับรางวัล\n• เพิ่มบัตรใน Wallet\n\n👇 เปิดบัตรของฉัน:\n${cardUrl}`,
  es: (businessName, points, cardUrl) =>
    `🎁 *TARJETA DE FIDELIDAD - ${businessName}* 🎁\n\n¡Felicidades! Tu tarjeta de fidelidad ha sido creada.\n\n⭐ *${points} puntos de bienvenida* ofrecidos!\n\n📱 Accede a tu tarjeta para:\n• Consultar tu saldo de puntos\n• Canjear puntos por recompensas\n• Añadir la tarjeta a tu Wallet\n\n👇 Abrir mi tarjeta:\n${cardUrl}`,
  pt: (businessName, points, cardUrl) =>
    `🎁 *CARTÃO FIDELIDADE - ${businessName}* 🎁\n\nParabéns! Seu cartão fidelidade foi criado.\n\n⭐ *${points} pontos de boas-vindas* oferecidos!\n\n📱 Acesse seu cartão para:\n• Consultar seu saldo de pontos\n• Trocar pontos por recompensas\n• Adicionar cartão ao Wallet\n\n👇 Abrir meu cartão:\n${cardUrl}`,
};

// Button texts for interactive messages
const LOYALTY_BUTTON_TEXTS: Record<string, string> = {
  fr: 'Ouvrir ma Carte 🎁',
  en: 'Open my Card 🎁',
  th: 'เปิดบัตรของฉัน 🎁',
  es: 'Abrir mi Tarjeta 🎁',
  pt: 'Abrir meu Cartão 🎁',
};

// Reminder message templates for existing clients
const LOYALTY_REMINDER_MESSAGES: Record<string, (businessName: string, points: number, cardUrl: string) => string> = {
  fr: (businessName, points, cardUrl) =>
    `👋 *${businessName}* - Rappel Fidélité\n\nVous avez déjà une carte de fidélité chez nous !\n\n⭐ Votre solde actuel : *${points} points*\n\n📱 Consultez votre carte pour :\n• Voir vos points et récompenses disponibles\n• Échanger vos points\n• Ajouter la carte à votre Wallet\n\n👇 Accéder à ma carte :\n${cardUrl}`,
  en: (businessName, points, cardUrl) =>
    `👋 *${businessName}* - Loyalty Reminder\n\nYou already have a loyalty card with us!\n\n⭐ Your current balance: *${points} points*\n\n📱 Check your card to:\n• View your points and available rewards\n• Redeem your points\n• Add card to your Wallet\n\n👇 Access my card:\n${cardUrl}`,
  th: (businessName, points, cardUrl) =>
    `👋 *${businessName}* - แจ้งเตือนบัตรสมาชิก\n\nคุณมีบัตรสมาชิกกับเราแล้ว!\n\n⭐ ยอดแต้มปัจจุบัน: *${points} แต้ม*\n\n📱 ตรวจสอบบัตรของคุณเพื่อ:\n• ดูแต้มและรางวัลที่มี\n• แลกแต้ม\n• เพิ่มบัตรใน Wallet\n\n👇 เข้าถึงบัตรของฉัน:\n${cardUrl}`,
  es: (businessName, points, cardUrl) =>
    `👋 *${businessName}* - Recordatorio de Fidelidad\n\n¡Ya tienes una tarjeta de fidelidad con nosotros!\n\n⭐ Tu saldo actual: *${points} puntos*\n\n📱 Consulta tu tarjeta para:\n• Ver tus puntos y recompensas disponibles\n• Canjear tus puntos\n• Añadir la tarjeta a tu Wallet\n\n👇 Acceder a mi tarjeta:\n${cardUrl}`,
  pt: (businessName, points, cardUrl) =>
    `👋 *${businessName}* - Lembrete de Fidelidade\n\nVocê já tem um cartão fidelidade conosco!\n\n⭐ Seu saldo atual: *${points} pontos*\n\n📱 Consulte seu cartão para:\n• Ver seus pontos e recompensas disponíveis\n• Trocar seus pontos\n• Adicionar cartão ao Wallet\n\n👇 Acessar meu cartão:\n${cardUrl}`,
};

// Reminder button texts
const LOYALTY_REMINDER_BUTTON_TEXTS: Record<string, string> = {
  fr: 'Voir ma Carte 👀',
  en: 'View my Card 👀',
  th: 'ดูบัตรของฉัน 👀',
  es: 'Ver mi Tarjeta 👀',
  pt: 'Ver meu Cartão 👀',
};

/**
 * Envoie un message WhatsApp avec le lien de la carte fidélité
 */
async function sendLoyaltyCardWhatsApp(
  phone: string,
  merchantId: string,
  businessName: string,
  welcomePoints: number,
  qrCodeData: string,
  language: string = 'fr'
): Promise<void> {
  const globalWhapiKey = process.env.WHAPI_API_KEY;
  if (!globalWhapiKey) {
    console.log('[LOYALTY] WHAPI_API_KEY not configured, skipping WhatsApp');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
  const cardUrl = `${baseUrl}/card/${qrCodeData}`;

  // Format phone number for Whapi (remove + prefix)
  const formattedPhone = phone.replace(/^\+/, '');

  // Get message template
  const messageTemplate = LOYALTY_CARD_MESSAGES[language] || LOYALTY_CARD_MESSAGES['fr'];
  const message = messageTemplate(businessName, welcomePoints, cardUrl);

  // Get button text
  const buttonText = LOYALTY_BUTTON_TEXTS[language] || LOYALTY_BUTTON_TEXTS['fr'];

  // Try interactive message first
  try {
    const interactivePayload = {
      to: formattedPhone,
      type: 'button',
      header: {
        type: 'text',
        text: `🎁 ${businessName}`
      },
      body: {
        text: `Félicitations ! Votre carte de fidélité a été créée avec ${welcomePoints} points de bienvenue !`
      },
      footer: {
        text: '⭐ Programme Fidélité'
      },
      action: {
        buttons: [
          {
            type: 'url',
            title: buttonText.substring(0, 25),
            id: `card_${Date.now()}`,
            url: cardUrl
          }
        ]
      }
    };

    const interactiveResponse = await fetch(WHAPI_INTERACTIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactivePayload),
    });

    if (interactiveResponse.ok) {
      console.log('[LOYALTY] WhatsApp interactive message sent successfully');
      return;
    }

    console.log('[LOYALTY] Interactive message failed, falling back to text');
  } catch (error) {
    console.log('[LOYALTY] Interactive message error, falling back to text');
  }

  // Fallback to text message
  try {
    const textResponse = await fetch(WHAPI_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
      }),
    });

    if (textResponse.ok) {
      console.log('[LOYALTY] WhatsApp text message sent successfully');
    } else {
      console.error('[LOYALTY] WhatsApp text message failed:', await textResponse.text());
    }
  } catch (error) {
    console.error('[LOYALTY] WhatsApp send error:', error);
  }
}

/**
 * Envoie un message WhatsApp de rappel pour un client existant
 */
async function sendLoyaltyReminderWhatsApp(
  phone: string,
  businessName: string,
  currentPoints: number,
  qrCodeData: string,
  language: string = 'fr'
): Promise<void> {
  const globalWhapiKey = process.env.WHAPI_API_KEY;
  if (!globalWhapiKey) {
    console.log('[LOYALTY] WHAPI_API_KEY not configured, skipping WhatsApp reminder');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
  const cardUrl = `${baseUrl}/card/${qrCodeData}`;

  // Format phone number for Whapi (remove + prefix)
  const formattedPhone = phone.replace(/^\+/, '');

  // Get reminder message template
  const messageTemplate = LOYALTY_REMINDER_MESSAGES[language] || LOYALTY_REMINDER_MESSAGES['fr'];
  const message = messageTemplate(businessName, currentPoints, cardUrl);

  // Get button text
  const buttonText = LOYALTY_REMINDER_BUTTON_TEXTS[language] || LOYALTY_REMINDER_BUTTON_TEXTS['fr'];

  // Try interactive message first
  try {
    const interactivePayload = {
      to: formattedPhone,
      type: 'button',
      header: {
        type: 'text',
        text: `👋 ${businessName}`
      },
      body: {
        text: `Vous avez déjà une carte fidélité ! Votre solde : ${currentPoints} points ⭐`
      },
      footer: {
        text: '📱 Consultez votre carte'
      },
      action: {
        buttons: [
          {
            type: 'url',
            title: buttonText.substring(0, 25),
            id: `reminder_${Date.now()}`,
            url: cardUrl
          }
        ]
      }
    };

    const interactiveResponse = await fetch(WHAPI_INTERACTIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactivePayload),
    });

    if (interactiveResponse.ok) {
      console.log('[LOYALTY] WhatsApp reminder interactive message sent successfully');
      return;
    }

    console.log('[LOYALTY] Reminder interactive message failed, falling back to text');
  } catch (error) {
    console.log('[LOYALTY] Reminder interactive message error, falling back to text');
  }

  // Fallback to text message
  try {
    const textResponse = await fetch(WHAPI_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
      }),
    });

    if (textResponse.ok) {
      console.log('[LOYALTY] WhatsApp reminder text message sent successfully');
    } else {
      console.error('[LOYALTY] WhatsApp reminder text message failed:', await textResponse.text());
    }
  } catch (error) {
    console.error('[LOYALTY] WhatsApp reminder send error:', error);
  }
}

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
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY CLIENT GET] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error', clients: [] },
        { status: 200 } // Return 200 with empty array to not break UI
      );
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const clientId = searchParams.get('clientId');
    const qrCode = searchParams.get('qrCode');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!merchantId && !qrCode) {
      return NextResponse.json(
        { error: 'merchantId or qrCode is required' },
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
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY CLIENT POST] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

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

    // Si existe, mettre à jour last_visit et envoyer message de rappel
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

      const clientData = updatedClient || existingClient;

      // Envoyer message de rappel WhatsApp (si phone fourni)
      if (phone && clientData.qr_code_data) {
        // Fire and forget - ne pas bloquer la réponse
        sendLoyaltyReminderWhatsApp(
          phone,
          merchant.business_name || 'StarSpin',
          clientData.points || 0,
          clientData.qr_code_data,
          body.language || 'fr'
        ).catch((error) => {
          console.error('[LOYALTY CLIENT] WhatsApp reminder send error:', error);
        });
      }

      return NextResponse.json({
        client: clientData,
        isNew: false,
        cardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app'}/card/${clientData.qr_code_data}`
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

    // Envoyer le message WhatsApp avec le lien de la carte (si phone fourni)
    if (phone) {
      // Fire and forget - ne pas bloquer la réponse
      sendLoyaltyCardWhatsApp(
        phone,
        merchantId,
        merchant.business_name || 'StarSpin',
        welcomePoints,
        qrCodeData,
        body.language || 'fr'
      ).catch((error) => {
        console.error('[LOYALTY CLIENT] WhatsApp send error:', error);
      });
    }

    return NextResponse.json({
      client: newClient,
      isNew: true,
      welcomePoints,
      cardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app'}/card/${qrCodeData}`
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
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[LOYALTY CLIENT PATCH] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

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
