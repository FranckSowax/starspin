import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoints
const WHAPI_INTERACTIVE_URL = 'https://gate.whapi.cloud/messages/interactive';
const WHAPI_TEXT_URL = 'https://gate.whapi.cloud/messages/text';

// Message templates for NEW clients (first scan + vote)
const NEW_CLIENT_MESSAGES: Record<string, { header: string; body: string; footer: string }> = {
  fr: {
    header: '🎉 Bienvenue !',
    body: 'Merci pour votre avis ! Votre carte fidélité a été créée avec des points de bienvenue offerts !\n\n🎰 Tournez la roue pour gagner un cadeau\n🎁 Consultez votre carte fidélité',
    footer: '⭐ StarSpin'
  },
  en: {
    header: '🎉 Welcome!',
    body: 'Thank you for your review! Your loyalty card has been created with welcome points!\n\n🎰 Spin the wheel to win a gift\n🎁 Check your loyalty card',
    footer: '⭐ StarSpin'
  },
  th: {
    header: '🎉 ยินดีต้อนรับ!',
    body: 'ขอบคุณสำหรับรีวิว! บัตรสมาชิกของคุณถูกสร้างแล้วพร้อมแต้มต้อนรับ!\n\n🎰 หมุนวงล้อเพื่อรับของรางวัล\n🎁 ตรวจสอบบัตรสมาชิกของคุณ',
    footer: '⭐ StarSpin'
  },
  es: {
    header: '🎉 ¡Bienvenido!',
    body: '¡Gracias por tu opinión! Tu tarjeta de fidelidad ha sido creada con puntos de bienvenida!\n\n🎰 Gira la rueda para ganar un regalo\n🎁 Consulta tu tarjeta de fidelidad',
    footer: '⭐ StarSpin'
  },
  pt: {
    header: '🎉 Bem-vindo!',
    body: 'Obrigado pela sua avaliação! Seu cartão fidelidade foi criado com pontos de boas-vindas!\n\n🎰 Gire a roda para ganhar um presente\n🎁 Consulte seu cartão fidelidade',
    footer: '⭐ StarSpin'
  },
  zh: {
    header: '🎉 欢迎！',
    body: '感谢您的评价！您的会员卡已创建并赠送欢迎积分！\n\n🎰 转动轮盘赢取礼物\n🎁 查看您的会员卡',
    footer: '⭐ StarSpin'
  },
  ru: {
    header: '🎉 Добро пожаловать!',
    body: 'Спасибо за отзыв! Ваша карта лояльности создана с приветственными баллами!\n\n🎰 Крутите колесо, чтобы выиграть подарок\n🎁 Проверьте вашу карту лояльности',
    footer: '⭐ StarSpin'
  },
  ar: {
    header: '🎉 أهلاً وسهلاً!',
    body: 'شكراً لتقييمك! تم إنشاء بطاقة الولاء الخاصة بك مع نقاط ترحيبية!\n\n🎰 أدر العجلة للفوز بهدية\n🎁 تحقق من بطاقة الولاء الخاصة بك',
    footer: '⭐ StarSpin'
  },
};

// Message templates for EXISTING clients (returning)
const RETURNING_CLIENT_MESSAGES: Record<string, { header: string; body: (points: number) => string; footer: string }> = {
  fr: {
    header: '👋 Bon retour !',
    body: (points) => `Merci pour votre visite ! Vous avez ${points} points sur votre carte fidélité.\n\n🎰 Tournez la roue pour gagner un cadeau\n🎁 Consultez votre solde et récompenses`,
    footer: '⭐ StarSpin'
  },
  en: {
    header: '👋 Welcome back!',
    body: (points) => `Thank you for your visit! You have ${points} points on your loyalty card.\n\n🎰 Spin the wheel to win a gift\n🎁 Check your balance and rewards`,
    footer: '⭐ StarSpin'
  },
  th: {
    header: '👋 ยินดีต้อนรับกลับ!',
    body: (points) => `ขอบคุณสำหรับการมาเยี่ยมชม! คุณมี ${points} แต้มในบัตรสมาชิก\n\n🎰 หมุนวงล้อเพื่อรับของรางวัล\n🎁 ตรวจสอบยอดแต้มและรางวัล`,
    footer: '⭐ StarSpin'
  },
  es: {
    header: '👋 ¡Bienvenido de nuevo!',
    body: (points) => `¡Gracias por tu visita! Tienes ${points} puntos en tu tarjeta.\n\n🎰 Gira la rueda para ganar un regalo\n🎁 Consulta tu saldo y recompensas`,
    footer: '⭐ StarSpin'
  },
  pt: {
    header: '👋 Bem-vindo de volta!',
    body: (points) => `Obrigado pela sua visita! Você tem ${points} pontos no seu cartão.\n\n🎰 Gire a roda para ganhar um presente\n🎁 Consulte seu saldo e recompensas`,
    footer: '⭐ StarSpin'
  },
  zh: {
    header: '👋 欢迎回来！',
    body: (points) => `感谢您的光临！您的会员卡有 ${points} 积分。\n\n🎰 转动轮盘赢取礼物\n🎁 查看您的余额和奖励`,
    footer: '⭐ StarSpin'
  },
  ru: {
    header: '👋 С возвращением!',
    body: (points) => `Спасибо за визит! У вас ${points} баллов на карте лояльности.\n\n🎰 Крутите колесо, чтобы выиграть подарок\n🎁 Проверьте ваш баланс и награды`,
    footer: '⭐ StarSpin'
  },
  ar: {
    header: '👋 أهلاً بعودتك!',
    body: (points) => `شكراً لزيارتك! لديك ${points} نقطة على بطاقة الولاء.\n\n🎰 أدر العجلة للفوز بهدية\n🎁 تحقق من رصيدك ومكافآتك`,
    footer: '⭐ StarSpin'
  },
};

// Button texts (max 20 characters for WhatsApp)
const BUTTON_TEXTS: Record<string, { spin: string; card: string }> = {
  fr: { spin: 'Tourner la Roue 🎰', card: 'Ma Carte 🎁' },
  en: { spin: 'Spin the Wheel 🎰', card: 'My Card 🎁' },
  th: { spin: 'หมุนวงล้อ 🎰', card: 'บัตรของฉัน 🎁' },
  es: { spin: 'Girar Rueda 🎰', card: 'Mi Tarjeta 🎁' },
  pt: { spin: 'Girar Roda 🎰', card: 'Meu Cartão 🎁' },
  zh: { spin: '转动轮盘 🎰', card: '我的卡 🎁' },
  ru: { spin: 'Крутить колесо 🎰', card: 'Моя карта 🎁' },
  ar: { spin: 'أدر العجلة 🎰', card: 'بطاقتي 🎁' },
};

/**
 * POST /api/whatsapp/combined
 *
 * Sends a single WhatsApp message with 2 buttons:
 * 1. Spin the Wheel
 * 2. Open Loyalty Card
 *
 * Body: {
 *   merchantId: string,
 *   phoneNumber: string,
 *   cardQrCode: string,
 *   isNewClient: boolean,
 *   points?: number (for returning clients),
 *   language?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `whatsapp-combined:${clientIP}`,
      5,
      60000
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

    // 2. Parse request body
    const body = await request.json();
    const { merchantId, phoneNumber, cardQrCode, isNewClient, points = 0, language = 'fr' } = body;

    // 3. Validate inputs
    if (!merchantId || !phoneNumber || !cardQrCode) {
      return NextResponse.json(
        { error: 'merchantId, phoneNumber, and cardQrCode are required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // 4. Initialize Supabase admin client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service not configured' },
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

    // 5. Get global Whapi API key
    const globalWhapiKey = process.env.WHAPI_API_KEY;
    if (!globalWhapiKey) {
      console.error('WHAPI_API_KEY not configured');
      return NextResponse.json(
        { error: 'WhatsApp service not configured' },
        { status: 500 }
      );
    }

    // 6. Get merchant data
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, workflow_mode')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // 7. Check WhatsApp workflow
    if (merchant.workflow_mode !== 'whatsapp') {
      return NextResponse.json(
        { error: 'WhatsApp mode not enabled for this merchant' },
        { status: 400 }
      );
    }

    // 8. Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
    const spinUrl = `${baseUrl}/spin/${merchantId}?phone=${encodeURIComponent(phoneNumber)}&lang=${language}`;
    const cardUrl = `${baseUrl}/card/${cardQrCode}`;

    // 9. Format phone number
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 10. Get translated texts
    const buttonTexts = BUTTON_TEXTS[language] || BUTTON_TEXTS['fr'];
    const businessName = merchant.business_name || 'StarSpin';

    let headerText: string;
    let bodyText: string;
    let footerText: string;

    if (isNewClient) {
      const template = NEW_CLIENT_MESSAGES[language] || NEW_CLIENT_MESSAGES['fr'];
      headerText = `${template.header} - ${businessName}`;
      bodyText = template.body;
      footerText = template.footer;
    } else {
      const template = RETURNING_CLIENT_MESSAGES[language] || RETURNING_CLIENT_MESSAGES['fr'];
      headerText = `${template.header} - ${businessName}`;
      bodyText = template.body(points);
      footerText = template.footer;
    }

    // 11. Try sending interactive message with 2 URL buttons
    // Structure based on Whapi documentation: https://support.whapi.cloud/help-desk/sending/send-message-with-buttons
    const timestamp = Date.now();
    const interactivePayload = {
      to: formattedPhone,
      type: 'button',
      header: {
        text: headerText.substring(0, 60) // Max 60 chars for header
      },
      body: {
        text: bodyText
      },
      footer: {
        text: footerText
      },
      action: {
        buttons: [
          {
            type: 'url',
            title: buttonTexts.spin.substring(0, 25), // Max 25 chars
            id: `spin_${timestamp}`,
            url: spinUrl
          },
          {
            type: 'url',
            title: buttonTexts.card.substring(0, 25), // Max 25 chars
            id: `card_${timestamp + 1}`,
            url: cardUrl
          }
        ]
      }
    };

    console.log('[WHATSAPP COMBINED] Sending payload:', JSON.stringify(interactivePayload, null, 2));

    let whapiResponse = await fetch(WHAPI_INTERACTIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(interactivePayload),
    });

    // 12. If interactive fails, fallback to text message
    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('[WHATSAPP COMBINED] Interactive message failed:', whapiResponse.status, errorText);
      console.error('[WHATSAPP COMBINED] Falling back to text message');

      const spinButtonText = buttonTexts.spin;
      const cardButtonText = buttonTexts.card;

      const textMessage = `${headerText}

${bodyText}

👉 ${spinButtonText}
${spinUrl}

👉 ${cardButtonText}
${cardUrl}

${footerText}`;

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
      console.error('[WHATSAPP COMBINED] Final API error:', whapiResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message' },
        { status: 500 }
      );
    }

    const result = await whapiResponse.json();
    console.log('[WHATSAPP COMBINED] Message sent successfully:', result);

    return NextResponse.json({
      success: true,
      messageId: result.sent?.id || result.message_id || 'sent',
      message: 'Combined WhatsApp message sent successfully'
    });

  } catch (error: any) {
    console.error('WhatsApp combined send error:', error);
    return NextResponse.json(
      { error: 'Error sending message' },
      { status: 500 }
    );
  }
}
