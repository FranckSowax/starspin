import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoints
const WHAPI_INTERACTIVE_URL = 'https://gate.whapi.cloud/messages/interactive';
const WHAPI_TEXT_URL = 'https://gate.whapi.cloud/messages/text';

// Button text translations (max 25 characters for WhatsApp buttons)
const BUTTON_TEXTS: Record<string, string> = {
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

// Body text translations
const BODY_TEXTS: Record<string, string> = {
  fr: 'Merci pour votre avis ! 🎉 Cliquez sur le bouton pour tourner la roue et gagner un cadeau.',
  en: 'Thank you for your review! 🎉 Click the button to spin the wheel and win a gift.',
  es: '¡Gracias por tu opinión! 🎉 Haz clic en el botón para girar la rueda y ganar un regalo.',
  pt: 'Obrigado pela sua avaliação! 🎉 Clique no botão para girar a roda e ganhar um presente.',
  de: 'Danke für Ihre Bewertung! 🎉 Klicken Sie auf den Button, um das Rad zu drehen.',
  it: 'Grazie per la tua recensione! 🎉 Clicca il pulsante per girare la ruota e vincere.',
  ar: 'شكراً لتقييمك! 🎉 انقر على الزر لتدوير العجلة والفوز بهدية.',
  zh: '感谢您的评价！🎉 点击按钮转动轮盘赢取礼物。',
  ja: 'レビューありがとうございます！🎉 ボタンをクリックしてルーレットを回そう。',
  ko: '리뷰 감사합니다! 🎉 버튼을 클릭하여 룰렛을 돌리고 선물을 받으세요.',
  th: 'ขอบคุณสำหรับรีวิว! 🎉 คลิกปุ่มเพื่อหมุนวงล้อและรับของรางวัล',
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
    const { merchantId, phoneNumber, language = 'fr' } = body;

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
    const buttonText = BUTTON_TEXTS[language] || BUTTON_TEXTS['fr'];
    // Get body text and remove {{spin_url}} placeholder (URL is now in the button)
    let bodyText = merchant.whatsapp_message_template || BODY_TEXTS[language] || BODY_TEXTS['fr'];
    bodyText = bodyText.replace(/\{\{spin_url\}\}/gi, '').trim();

    // 11. Try sending interactive message with URL button first
    const interactivePayload = {
      to: formattedPhone,
      type: 'button',
      header: {
        type: 'text',
        text: merchant.business_name || 'StarSpin'
      },
      body: {
        text: bodyText
      },
      footer: {
        text: '🎰 StarSpin'
      },
      action: {
        buttons: [
          {
            type: 'url',
            title: buttonText.substring(0, 25), // Max 25 chars for button title
            id: `spin_${Date.now()}`,
            url: spinUrl
          }
        ]
      }
    };

    let whapiResponse = await fetch(WHAPI_INTERACTIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactivePayload),
    });

    // 12. If interactive message fails, fallback to text message
    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('Interactive message failed, trying text fallback:', whapiResponse.status, errorText);

      // Prepare fallback text message
      const textMessage = `🎉 *${merchant.business_name || 'StarSpin'}*

${bodyText}

👉 ${buttonText}
${spinUrl}

🎰 Bonne chance !`;

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
