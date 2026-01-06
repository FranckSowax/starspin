import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/security';
import { isValidUUID, isValidPhone } from '@/lib/utils/validation';

// Whapi API endpoint for standard text messages
const WHAPI_API_URL = 'https://gate.whapi.cloud/messages/text';

// Congratulation message templates by language
const CONGRATULATION_MESSAGES: Record<string, (prizeName: string, couponUrl: string) => string> = {
  fr: (prizeName, couponUrl) =>
    `🎉 FÉLICITATIONS ! 🎉\n\nVous avez gagné : *${prizeName}* !\n\n🎁 Cliquez sur le lien ci-dessous pour afficher votre coupon avec le QR code et le timer :\n\n${couponUrl}\n\n⏰ Attention : votre coupon expire dans 24h !`,
  en: (prizeName, couponUrl) =>
    `🎉 CONGRATULATIONS! 🎉\n\nYou won: *${prizeName}*!\n\n🎁 Click the link below to view your coupon with QR code and timer:\n\n${couponUrl}\n\n⏰ Warning: your coupon expires in 24h!`,
  es: (prizeName, couponUrl) =>
    `🎉 ¡FELICIDADES! 🎉\n\nHas ganado: *${prizeName}*!\n\n🎁 Haz clic en el enlace para ver tu cupón con código QR y temporizador:\n\n${couponUrl}\n\n⏰ ¡Atención: tu cupón expira en 24h!`,
  pt: (prizeName, couponUrl) =>
    `🎉 PARABÉNS! 🎉\n\nVocê ganhou: *${prizeName}*!\n\n🎁 Clique no link para ver seu cupom com QR code e timer:\n\n${couponUrl}\n\n⏰ Atenção: seu cupom expira em 24h!`,
  de: (prizeName, couponUrl) =>
    `🎉 HERZLICHEN GLÜCKWUNSCH! 🎉\n\nSie haben gewonnen: *${prizeName}*!\n\n🎁 Klicken Sie auf den Link, um Ihren Coupon mit QR-Code und Timer anzuzeigen:\n\n${couponUrl}\n\n⏰ Achtung: Ihr Coupon läuft in 24h ab!`,
  it: (prizeName, couponUrl) =>
    `🎉 CONGRATULAZIONI! 🎉\n\nHai vinto: *${prizeName}*!\n\n🎁 Clicca sul link per visualizzare il tuo coupon con QR code e timer:\n\n${couponUrl}\n\n⏰ Attenzione: il tuo coupon scade tra 24h!`,
  ar: (prizeName, couponUrl) =>
    `🎉 تهانينا! 🎉\n\nلقد فزت بـ: *${prizeName}*!\n\n🎁 انقر على الرابط لعرض قسيمتك مع رمز QR والمؤقت:\n\n${couponUrl}\n\n⏰ تنبيه: قسيمتك تنتهي خلال 24 ساعة!`,
  zh: (prizeName, couponUrl) =>
    `🎉 恭喜！🎉\n\n您赢得了：*${prizeName}*！\n\n🎁 点击下方链接查看您的优惠券、二维码和倒计时：\n\n${couponUrl}\n\n⏰ 注意：您的优惠券将在24小时后过期！`,
  ja: (prizeName, couponUrl) =>
    `🎉 おめでとうございます！🎉\n\n当選：*${prizeName}*！\n\n🎁 以下のリンクをクリックして、QRコードとタイマー付きのクーポンを確認してください：\n\n${couponUrl}\n\n⏰ ご注意：クーポンは24時間で期限切れになります！`,
  ko: (prizeName, couponUrl) =>
    `🎉 축하합니다! 🎉\n\n당첨: *${prizeName}*!\n\n🎁 아래 링크를 클릭하여 QR 코드와 타이머가 있는 쿠폰을 확인하세요:\n\n${couponUrl}\n\n⏰ 주의: 쿠폰은 24시간 후 만료됩니다!`,
  th: (prizeName, couponUrl) =>
    `🎉 ยินดีด้วย! 🎉\n\nคุณชนะ: *${prizeName}*!\n\n🎁 คลิกลิงก์ด้านล่างเพื่อดูคูปองพร้อม QR code และตัวนับเวลา:\n\n${couponUrl}\n\n⏰ คำเตือน: คูปองของคุณหมดอายุใน 24 ชั่วโมง!`,
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

    // 8. Generate coupon URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://starspin.netlify.app';
    const couponUrl = `${baseUrl}/coupon/${merchantId}?code=${couponCode}`;

    // 9. Get congratulation message based on language
    const messageTemplate = CONGRATULATION_MESSAGES[language] || CONGRATULATION_MESSAGES['fr'];
    const message = messageTemplate(prizeName, couponUrl);

    // 10. Format phone number for Whapi (remove + prefix)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    // 11. Call Whapi API with standard text message
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
