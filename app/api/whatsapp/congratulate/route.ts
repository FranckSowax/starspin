import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoint for interactive messages with buttons
const WHAPI_API_URL = 'https://gate.whapi.cloud/messages/interactive';

// Congratulation message templates by language (without URL in text)
const CONGRATULATION_MESSAGES: Record<string, (prizeName: string) => { body: string; footer: string; buttonText: string }> = {
  fr: (prizeName) => ({
    body: `🎉 FÉLICITATIONS ! 🎉\n\nVous avez gagné : *${prizeName}* !\n\n🎁 Cliquez sur le bouton ci-dessous pour afficher votre coupon avec le QR code.`,
    footer: '⏰ Votre coupon expire dans 24h !',
    buttonText: 'Voir votre Prix',
  }),
  en: (prizeName) => ({
    body: `🎉 CONGRATULATIONS! 🎉\n\nYou won: *${prizeName}*!\n\n🎁 Click the button below to view your coupon with QR code.`,
    footer: '⏰ Your coupon expires in 24h!',
    buttonText: 'View your Prize',
  }),
  es: (prizeName) => ({
    body: `🎉 ¡FELICIDADES! 🎉\n\nHas ganado: *${prizeName}*!\n\n🎁 Haz clic en el botón para ver tu cupón con código QR.`,
    footer: '⏰ ¡Tu cupón expira en 24h!',
    buttonText: 'Ver tu Premio',
  }),
  pt: (prizeName) => ({
    body: `🎉 PARABÉNS! 🎉\n\nVocê ganhou: *${prizeName}*!\n\n🎁 Clique no botão para ver seu cupom com QR code.`,
    footer: '⏰ Seu cupom expira em 24h!',
    buttonText: 'Ver seu Prêmio',
  }),
  de: (prizeName) => ({
    body: `🎉 HERZLICHEN GLÜCKWUNSCH! 🎉\n\nSie haben gewonnen: *${prizeName}*!\n\n🎁 Klicken Sie auf den Button, um Ihren Coupon mit QR-Code anzuzeigen.`,
    footer: '⏰ Ihr Coupon läuft in 24h ab!',
    buttonText: 'Preis ansehen',
  }),
  it: (prizeName) => ({
    body: `🎉 CONGRATULAZIONI! 🎉\n\nHai vinto: *${prizeName}*!\n\n🎁 Clicca sul pulsante per visualizzare il tuo coupon con QR code.`,
    footer: '⏰ Il tuo coupon scade tra 24h!',
    buttonText: 'Vedi il tuo Premio',
  }),
  ar: (prizeName) => ({
    body: `🎉 تهانينا! 🎉\n\nلقد فزت بـ: *${prizeName}*!\n\n🎁 انقر على الزر لعرض قسيمتك مع رمز QR.`,
    footer: '⏰ قسيمتك تنتهي خلال 24 ساعة!',
    buttonText: 'عرض جائزتك',
  }),
  zh: (prizeName) => ({
    body: `🎉 恭喜！🎉\n\n您赢得了：*${prizeName}*！\n\n🎁 点击下方按钮查看您的优惠券和二维码。`,
    footer: '⏰ 您的优惠券将在24小时后过期！',
    buttonText: '查看奖品',
  }),
  ja: (prizeName) => ({
    body: `🎉 おめでとうございます！🎉\n\n当選：*${prizeName}*！\n\n🎁 ボタンをクリックして、QRコード付きのクーポンを確認してください。`,
    footer: '⏰ クーポンは24時間で期限切れになります！',
    buttonText: '賞品を見る',
  }),
  ko: (prizeName) => ({
    body: `🎉 축하합니다! 🎉\n\n당첨: *${prizeName}*!\n\n🎁 버튼을 클릭하여 QR 코드가 있는 쿠폰을 확인하세요.`,
    footer: '⏰ 쿠폰은 24시간 후 만료됩니다!',
    buttonText: '상품 보기',
  }),
  th: (prizeName) => ({
    body: `🎉 ยินดีด้วย! 🎉\n\nคุณชนะ: *${prizeName}*!\n\n🎁 คลิกปุ่มด้านล่างเพื่อดูคูปองพร้อม QR code`,
    footer: '⏰ คูปองของคุณหมดอายุใน 24 ชั่วโมง!',
    buttonText: 'ดูรางวัล',
  }),
};

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(
      `whatsapp-congrats:${clientIP}`,
      10, // 10 messages per minute max
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
    const { merchantId, phoneNumber, prizeName, couponCode, language = 'fr' } = body;

    // 3. Validate inputs
    if (!merchantId || !phoneNumber || !prizeName || !couponCode) {
      return NextResponse.json(
        { error: 'merchantId, phoneNumber, prizeName et couponCode sont requis' },
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

    // 6. Get merchant data to check workflow mode
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, workflow_mode')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant fetch error:', merchantError);
      return NextResponse.json(
        { error: 'Marchand introuvable' },
        { status: 404 }
      );
    }

    // 7. Only send if WhatsApp workflow is enabled
    if (merchant.workflow_mode !== 'whatsapp') {
      return NextResponse.json(
        { success: true, skipped: true, message: 'Mode WhatsApp non activé' }
      );
    }

    // 8. Generate coupon URL with language
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
    const couponUrl = `${baseUrl}/coupon/${merchantId}?code=${couponCode}&lang=${language}`;

    // 9. Get congratulation message based on language
    const messageTemplate = CONGRATULATION_MESSAGES[language] || CONGRATULATION_MESSAGES['fr'];
    const messageContent = messageTemplate(prizeName);

    // 10. Format phone number for Whapi (remove + prefix)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 11. Call Whapi API with interactive message (CTA button)
    const whapiResponse = await fetch(WHAPI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${globalWhapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        type: 'cta_url',
        body: {
          text: messageContent.body,
        },
        footer: {
          text: messageContent.footer,
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: messageContent.buttonText,
            url: couponUrl,
          },
        },
      }),
    });

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

    // 12. Return success
    return NextResponse.json({
      success: true,
      messageId: result.sent?.id || result.message_id || 'sent',
      message: 'Message de félicitations envoyé avec succès'
    });

  } catch (error: any) {
    console.error('WhatsApp congratulation send error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
