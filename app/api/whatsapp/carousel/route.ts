import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoint for carousel messages
const WHAPI_CAROUSEL_URL = 'https://gate.whapi.cloud/messages/carousel';

interface CarouselCard {
  header: {
    type: 'image' | 'video';
    media: string;
  };
  body: {
    text: string;
  };
  buttons: Array<{
    type: 'url' | 'quick_reply';
    title: string;
    url?: string;
    id?: string;
  }>;
}

interface CarouselPayload {
  to: string;
  body: string;
  cards: CarouselCard[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - stricter for campaign sends
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `whatsapp-carousel:${clientIP}`,
      30, // 30 messages per minute max for campaigns
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
    const { phoneNumber, carouselPayload } = body;

    // 3. Validate inputs
    if (!phoneNumber || !carouselPayload) {
      return NextResponse.json(
        { error: 'phoneNumber et carouselPayload sont requis' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // 4. Get global Whapi API key from environment
    const globalWhapiKey = process.env.WHAPI_API_KEY;
    if (!globalWhapiKey) {
      console.error('WHAPI_API_KEY not configured in environment');
      return NextResponse.json(
        { error: 'Service WhatsApp non configuré' },
        { status: 500 }
      );
    }

    // 5. Format phone number for Whapi (remove + prefix)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 6. Prepare the payload
    const payload: CarouselPayload = {
      ...carouselPayload,
      to: formattedPhone,
    };

    // 7. Call Whapi API
    const whapiResponse = await fetch(WHAPI_CAROUSEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error('Whapi Carousel API error:', whapiResponse.status, errorText);

      if (whapiResponse.status === 401) {
        return NextResponse.json(
          { error: 'Erreur de configuration WhatsApp (clé API invalide)' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Échec de l\'envoi du message carousel',
          details: errorText
        },
        { status: 500 }
      );
    }

    const result = await whapiResponse.json();

    // 8. Return success
    return NextResponse.json({
      success: true,
      messageId: result.sent?.id || result.message_id || 'sent',
      message: 'Message carousel envoyé avec succès'
    });

  } catch (error: any) {
    console.error('WhatsApp carousel send error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message carousel' },
      { status: 500 }
    );
  }
}
