import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

let supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseAdmin;
}

// Status progression order — never go backward
const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4, // special: always allowed
};

// GET - Webhook verification (Meta subscription handshake)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST - Receive status updates from Meta
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ ok: true }, { status: 200 });

  // Validate signature
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get('x-hub-signature-256');
    const rawBody = await request.text();

    if (signature) {
      const expectedSig = 'sha256=' + createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse body from raw text
    const body = JSON.parse(rawBody);
    await processWebhookBody(adminClient, body);
  } else {
    // No secret configured — parse directly but skip validation
    const body = await request.json();
    await processWebhookBody(adminClient, body);
  }

  // Always return 200 to Meta
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhookBody(adminClient: SupabaseClient, body: any) {
  const entries = body?.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const statuses = change?.value?.statuses || [];

      for (const status of statuses) {
        const metaMessageId = status.id;
        const newStatus = status.status; // sent, delivered, read, failed
        const timestamp = status.timestamp;

        if (!metaMessageId || !newStatus) continue;

        // Find the message in our DB
        const { data: message } = await adminClient
          .from('whatsapp_campaign_messages')
          .select('id, status')
          .eq('meta_message_id', metaMessageId)
          .single();

        if (!message) continue;

        const currentOrder = STATUS_ORDER[message.status] ?? 0;
        const newOrder = STATUS_ORDER[newStatus] ?? 0;

        // Only advance status (never go backward), except 'failed' always applies
        if (newStatus !== 'failed' && newOrder <= currentOrder) continue;

        const updateData: any = {
          status: newStatus,
        };

        const isoTimestamp = timestamp
          ? new Date(Number(timestamp) * 1000).toISOString()
          : new Date().toISOString();

        if (newStatus === 'sent') {
          updateData.sent_at = isoTimestamp;
        } else if (newStatus === 'delivered') {
          updateData.delivered_at = isoTimestamp;
        } else if (newStatus === 'read') {
          updateData.read_at = isoTimestamp;
        } else if (newStatus === 'failed') {
          updateData.failed_at = isoTimestamp;
          updateData.error_message = status.errors?.[0]?.title
            || status.errors?.[0]?.message
            || 'Unknown error';
        }

        await adminClient
          .from('whatsapp_campaign_messages')
          .update(updateData)
          .eq('id', message.id);
      }
    }
  }
}
