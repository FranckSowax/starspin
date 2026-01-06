import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export type NotificationType = 'feedback' | 'spin' | 'coupon_used' | 'new_customer';

interface CreateNotificationParams {
  merchantId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification({
  merchantId,
  type,
  title,
  message,
  data = {},
}: CreateNotificationParams): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        merchant_id: merchantId,
        type,
        title,
        message,
        data,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Notification creation error:', error);
    return false;
  }
}

// Helper functions for common notification types

export async function notifyNewFeedback(
  merchantId: string,
  rating: number,
  customerIdentifier: string | null,
  isPositive: boolean
): Promise<void> {
  const emoji = isPositive ? '⭐' : '📝';
  const sentiment = isPositive ? 'positif' : 'négatif';
  const customer = customerIdentifier || 'Un client anonyme';

  await createNotification({
    merchantId,
    type: 'feedback',
    title: `${emoji} Nouvel avis ${sentiment}`,
    message: `${customer} a laissé un avis de ${rating} étoile${rating > 1 ? 's' : ''}.`,
    data: { rating, customerIdentifier, isPositive },
  });
}

export async function notifyNewSpin(
  merchantId: string,
  prizeName: string | null,
  customerIdentifier: string | null
): Promise<void> {
  const customer = customerIdentifier || 'Un client';

  if (prizeName) {
    await createNotification({
      merchantId,
      type: 'spin',
      title: '🎰 Nouveau tour de roue',
      message: `${customer} a gagné "${prizeName}" !`,
      data: { prizeName, customerIdentifier },
    });
  } else {
    await createNotification({
      merchantId,
      type: 'spin',
      title: '🎰 Tour de roue',
      message: `${customer} a tourné la roue.`,
      data: { customerIdentifier },
    });
  }
}

export async function notifyCouponUsed(
  merchantId: string,
  couponCode: string,
  prizeName: string
): Promise<void> {
  await createNotification({
    merchantId,
    type: 'coupon_used',
    title: '✅ Coupon utilisé',
    message: `Le coupon "${couponCode}" pour "${prizeName}" a été validé.`,
    data: { couponCode, prizeName },
  });
}

export async function notifyNewCustomer(
  merchantId: string,
  customerIdentifier: string,
  isWhatsApp: boolean
): Promise<void> {
  const type = isWhatsApp ? 'WhatsApp' : 'Email';

  await createNotification({
    merchantId,
    type: 'new_customer',
    title: '👤 Nouveau client',
    message: `Un nouveau client s'est enregistré via ${type}: ${customerIdentifier}`,
    data: { customerIdentifier, isWhatsApp },
  });
}
