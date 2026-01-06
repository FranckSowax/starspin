import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoint for text messages
const WHAPI_API_URL = 'https://gate.whapi.cloud/messages/text';

// Call-to-action text translations
const CTA_TEXTS: Record<string, string> = {
  fr: '👉 Tournez la roue maintenant',
  en: '👉 Spin the wheel now',
  es: '👉 Gira la rueda ahora',
  pt: '👉 Gire a roda agora',
  de: '👉 Drehen Sie jetzt das Rad',
  it: '👉 Gira la ruota ora',
  ar: '👉 أدر العجلة الآن',
  zh: '👉 现在转动轮盘',
  ja: '👉 今すぐルーレットを回す',
  ko: '👉 지금 룰렛 돌리기',
  th: '👉 หมุนวงล้อเลย',
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

    // 8. Generate spin URL with phone number for congratulation message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
    const spinUrl = `${baseUrl}/spin/${merchantId}?phone=${encodeURIComponent(phoneNumber)}`;

    // 9. Get CTA text based on language
    const ctaText = CTA_TEXTS[language] || CTA_TEXTS['fr'];

    // 10. Prepare message with custom template or default
    const defaultTemplate = `🎉 *${merchant.business_name || 'StarSpin'}*

Merci pour votre avis ! Vous avez maintenant une chance de gagner un cadeau en tournant notre roue de la fortune.

${ctaText}
${spinUrl}

🎰 Bonne chance !`;

    const message = merchant.whatsapp_message_template
      ? merchant.whatsapp_message_template.replace(/\{\{spin_url\}\}/g, spinUrl)
      : defaultTemplate;

    // 11. Format phone number for Whapi (remove + prefix)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 12. Call Whapi API with text message
    const whapiResponse = await fetch(WHAPI_API_URL, {
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

    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('Whapi API error:', whapiResponse.status, errorText);

      // Handle specific Whapi errors
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
