import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoints
const WHAPI_INTERACTIVE_URL = 'https://gate.whapi.cloud/messages/interactive';
const WHAPI_TEXT_URL = 'https://gate.whapi.cloud/messages/text';

// Button text translations (max 25 characters for WhatsApp buttons)
const SPIN_BUTTON_TEXTS: Record<string, string> = {
  fr: 'Tourner la Roue 🎰',
  en: 'Spin the Wheel 🎰',
  es: 'Girar la Rueda 🎰',
  pt: 'Girar a Roda 🎰',
  de: 'Rad drehen 🎰',
  it: 'Gira la Ruota 🎰',
  ar: 'أدر العجلة 🎰',
  zh: '转动轮盘 🎰',
  ja: 'ルーレット 🎰',
  ko: '룰렛 돌리기 🎰',
  th: 'หมุนวงล้อ 🎰',
};

// Card button text translations
const CARD_BUTTON_TEXTS: Record<string, string> = {
  fr: 'Ma Carte 🎁',
  en: 'My Card 🎁',
  es: 'Mi Tarjeta 🎁',
  pt: 'Meu Cartão 🎁',
  de: 'Meine Karte 🎁',
  it: 'La Mia Carta 🎁',
  ar: 'بطاقتي 🎁',
  zh: '我的卡 🎁',
  ja: 'マイカード 🎁',
  ko: '내 카드 🎁',
  th: 'บัตรของฉัน 🎁',
};

// Body text translations - NEW CLIENT (first scan, with loyalty card)
// {{business_name}} will be replaced with merchant name
const NEW_CLIENT_BODY_TEXTS: Record<string, string> = {
  fr: `Merci pour votre avis ! 🎉

🎰 Tournez la roue pour gagner un cadeau {{business_name}}

🎁 Votre carte fidélité est prête ! Cumulez des points à chaque visite et débloquez des récompenses exclusives.`,
  en: `Thank you for your review! 🎉

🎰 Spin the wheel to win a {{business_name}} gift

🎁 Your loyalty card is ready! Earn points with every visit and unlock exclusive rewards.`,
  th: `ขอบคุณสำหรับรีวิว! 🎉

🎰 หมุนวงล้อเพื่อรับของรางวัลจาก {{business_name}}

🎁 บัตรสมาชิกของคุณพร้อมแล้ว! สะสมแต้มทุกครั้งที่มาและรับรางวัลพิเศษ`,
  es: `¡Gracias por tu opinión! 🎉

🎰 Gira la rueda para ganar un regalo de {{business_name}}

🎁 ¡Tu tarjeta de fidelidad está lista! Acumula puntos en cada visita y desbloquea recompensas exclusivas.`,
  pt: `Obrigado pela sua avaliação! 🎉

🎰 Gire a roda para ganhar um presente de {{business_name}}

🎁 Seu cartão fidelidade está pronto! Acumule pontos a cada visita e desbloqueie recompensas exclusivas.`,
};

// Body text translations - RETURNING CLIENT (already has loyalty card)
const RETURNING_CLIENT_BODY_TEXTS: Record<string, string> = {
  fr: `Bon retour ! 👋

🎰 Tournez la roue pour tenter de gagner un cadeau

🎁 Consultez votre carte fidélité pour voir votre solde de points.`,
  en: `Welcome back! 👋

🎰 Spin the wheel to try and win a gift

🎁 Check your loyalty card to see your points balance.`,
  th: `ยินดีต้อนรับกลับ! 👋

🎰 หมุนวงล้อเพื่อลุ้นรับของรางวัล

🎁 ตรวจสอบบัตรสมาชิกเพื่อดูยอดแต้มของคุณ`,
  es: `¡Bienvenido de nuevo! 👋

🎰 Gira la rueda para intentar ganar un regalo

🎁 Consulta tu tarjeta de fidelidad para ver tu saldo de puntos.`,
  pt: `Bem-vindo de volta! 👋

🎰 Gire a roda para tentar ganhar um presente

🎁 Consulte seu cartão fidelidade para ver seu saldo de pontos.`,
};

// Legacy body texts (fallback when no loyalty card)
const BODY_TEXTS: Record<string, string> = {
  fr: 'Merci pour votre avis ! 🎉 Tournez la roue pour gagner un cadeau.',
  en: 'Thank you for your review! 🎉 Spin the wheel to win a gift.',
  es: '¡Gracias por tu opinión! 🎉 Gira la rueda para ganar un regalo.',
  pt: 'Obrigado pela sua avaliação! 🎉 Gire a roda para ganhar um presente.',
  de: 'Danke für Ihre Bewertung! 🎉 Drehen Sie das Rad, um zu gewinnen.',
  it: 'Grazie per la tua recensione! 🎉 Gira la ruota per vincere.',
  ar: 'شكراً لتقييمك! 🎉 أدر العجلة للفوز بهدية.',
  zh: '感谢您的评价！🎉 转动轮盘赢取礼物。',
  ja: 'レビューありがとうございます！🎉 ルーレットを回して景品をゲット。',
  ko: '리뷰 감사합니다! 🎉 룰렛을 돌려 선물을 받으세요.',
  th: 'ขอบคุณสำหรับรีวิว! 🎉 หมุนวงล้อเพื่อรับของรางวัล',
};

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - strict limit for WhatsApp API calls
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `whatsapp:${clientIP}`,
      5, // 5 messages per minute max
      60000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { merchantId, phoneNumber, language = 'fr', cardUrl, isNewClient = true } = body;

    // 3. Validate inputs
    if (!merchantId || !phoneNumber) {
      return NextResponse.json(
        { error: 'merchantId et phoneNumber sont requis' },
        { status: 400 }
      );
    }

    if (!isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'ID marchand invalide' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // 4. Initialize Supabase admin client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service non configuré' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 5. Get global Whapi API key from environment
    const globalWhapiKey = process.env.WHAPI_API_KEY;
    if (!globalWhapiKey) {
      console.error('WHAPI_API_KEY not configured in environment');
      return NextResponse.json(
        { error: 'Service WhatsApp non configuré' },
        { status: 500 }
      );
    }

    // 6. Get merchant data
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, whatsapp_message_template, workflow_mode')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant fetch error:', merchantError);
      return NextResponse.json(
        { error: 'Marchand introuvable' },
        { status: 404 }
      );
    }

    // 7. Check if merchant has WhatsApp workflow enabled
    if (merchant.workflow_mode !== 'whatsapp') {
      return NextResponse.json(
        { error: 'Le mode WhatsApp n\'est pas activé pour ce marchand' },
        { status: 400 }
      );
    }

    // 8. Generate spin URL with phone number and language
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
    const spinUrl = `${baseUrl}/spin/${merchantId}?phone=${encodeURIComponent(phoneNumber)}&lang=${language}`;

    // 9. Format phone number for Whapi (remove + prefix)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 10. Get translated texts
    const spinButtonText = SPIN_BUTTON_TEXTS[language] || SPIN_BUTTON_TEXTS['fr'];
    const cardButtonText = CARD_BUTTON_TEXTS[language] || CARD_BUTTON_TEXTS['fr'];
    const businessName = merchant.business_name || 'StarSpin';

    // Select body text based on context:
    // - If cardUrl provided + isNewClient: use NEW_CLIENT message (welcome + loyalty card)
    // - If cardUrl provided + !isNewClient: use RETURNING_CLIENT message
    // - Otherwise: use legacy BODY_TEXTS or merchant template
    let bodyText: string;

    if (cardUrl && isNewClient) {
      // New client with loyalty card
      bodyText = NEW_CLIENT_BODY_TEXTS[language] || NEW_CLIENT_BODY_TEXTS['fr'];
      bodyText = bodyText.replace(/\{\{business_name\}\}/gi, businessName);
    } else if (cardUrl && !isNewClient) {
      // Returning client with loyalty card
      bodyText = RETURNING_CLIENT_BODY_TEXTS[language] || RETURNING_CLIENT_BODY_TEXTS['fr'];
    } else {
      // No loyalty card - use legacy message or merchant template
      bodyText = merchant.whatsapp_message_template || BODY_TEXTS[language] || BODY_TEXTS['fr'];
    }

    // Clean up any remaining placeholders
    bodyText = bodyText.replace(/\{\{spin_url\}\}/gi, '').trim();

    // 11. Build buttons array - always spin, optionally card
    const timestamp = Date.now();
    const buttons: Array<{ type: string; title: string; id: string; url: string }> = [
      {
        type: 'url',
        title: spinButtonText.substring(0, 25),
        id: `spin_${timestamp}`,
        url: spinUrl
      }
    ];

    // Add card button if cardUrl is provided
    if (cardUrl) {
      buttons.push({
        type: 'url',
        title: cardButtonText.substring(0, 25),
        id: `card_${timestamp + 1}`,
        url: cardUrl
      });
    }

    // 12. Build header text based on context
    let headerText: string;
    if (cardUrl && isNewClient) {
      headerText = `🎉 ${businessName}`;
    } else if (cardUrl && !isNewClient) {
      headerText = `👋 ${businessName}`;
    } else {
      headerText = businessName;
    }

    // 13. Try sending interactive message with URL button(s)
    const interactivePayload = {
      to: formattedPhone,
      type: 'button',
      header: {
        text: headerText.substring(0, 60)
      },
      body: {
        text: bodyText
      },
      footer: {
        text: '⭐ StarSpin'
      },
      action: {
        buttons
      }
    };

    console.log('[WHATSAPP SEND] Sending with', buttons.length, 'button(s), isNewClient:', isNewClient);

    let whapiResponse = await fetch(WHAPI_INTERACTIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactivePayload),
    });

    // 14. If interactive message fails, fallback to text message
    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('Interactive message failed, trying text fallback:', whapiResponse.status, errorText);

      // Prepare fallback text message with header
      let textMessage = `*${headerText}*

${bodyText}

👉 ${spinButtonText}
${spinUrl}`;

      // Add card link if available
      if (cardUrl) {
        textMessage += `

👉 ${cardButtonText}
${cardUrl}`;
      }

      textMessage += `

⭐ StarSpin`;

      whapiResponse = await fetch(WHAPI_TEXT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${globalWhapiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedPhone,
          body: textMessage,
        }),
      });
    }

    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('Whapi API error:', whapiResponse.status, errorText);

      if (whapiResponse.status === 401) {
        return NextResponse.json(
          { error: 'Erreur de configuration WhatsApp' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Échec de l\'envoi du message WhatsApp' },
        { status: 500 }
      );
    }

    const result = await whapiResponse.json();

    // 13. Return success
    return NextResponse.json({
      success: true,
      messageId: result.sent?.id || result.message_id || 'sent',
      message: 'Message WhatsApp envoyé avec succès'
    });

  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
