import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { syncTemplates } from '@/lib/whatsapp/meta-api';
import type { WaBusinessConfig, MetaTemplate } from '@/lib/whatsapp/meta-api';

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

// POST - Sync templates from Meta
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Verify user
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { merchantId } = await request.json();
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get merchant's WA config
  const { data: config } = await adminClient
    .from('wa_business_config')
    .select('*')
    .eq('merchant_id', merchantId)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'WhatsApp Business not configured' }, { status: 400 });
  }

  try {
    const waConfig: WaBusinessConfig = {
      waba_id: config.waba_id,
      phone_number_id: config.phone_number_id,
      access_token: config.access_token,
      business_id: config.business_id,
      app_id: config.app_id,
    };

    const metaTemplates = await syncTemplates(waConfig);

    // Upsert each template into DB
    const results = [];
    for (const mt of metaTemplates) {
      // Extract components
      const headerComp = mt.components?.find((c: any) => c.type === 'HEADER');
      const bodyComp = mt.components?.find((c: any) => c.type === 'BODY');
      const footerComp = mt.components?.find((c: any) => c.type === 'FOOTER');
      const buttonsComp = mt.components?.find((c: any) => c.type === 'BUTTONS');

      const templateData = {
        merchant_id: merchantId,
        meta_template_id: mt.id,
        name: mt.name,
        language: mt.language,
        category: mt.category,
        status: mt.status,
        header_type: headerComp?.format || 'NONE',
        header_content: headerComp?.text || null,
        body_text: bodyComp?.text || '',
        footer_text: footerComp?.text || null,
        buttons: JSON.stringify(buttonsComp?.buttons || []),
        meta_response: JSON.stringify(mt),
      };

      // Set approved_at if status is APPROVED
      if (mt.status === 'APPROVED') {
        (templateData as any).approved_at = new Date().toISOString();
      }

      const { data, error } = await adminClient
        .from('wa_templates')
        .upsert(templateData, {
          onConflict: 'merchant_id,name,language',
        })
        .select()
        .single();

      if (data) results.push(data);
      if (error) console.error(`Sync template ${mt.name} error:`, error);
    }

    return NextResponse.json({ synced: results.length, templates: results });
  } catch (err: any) {
    return NextResponse.json({ error: `Meta API: ${err.message}` }, { status: 400 });
  }
}
