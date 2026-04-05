import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createTemplate, buildTemplateComponents, deleteTemplate as deleteMetaTemplate } from '@/lib/whatsapp/meta-api';
import type { WaBusinessConfig, TemplateCategory, HeaderType, TemplateButton } from '@/lib/whatsapp/meta-api';

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

async function verifyUser(request: NextRequest, adminClient: SupabaseClient) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET - List templates for a merchant
export async function GET(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await adminClient
    .from('wa_templates')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST - Create template (optionally submit to Meta)
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { merchantId, name, language, category, headerType, headerContent, bodyText, footerText, buttons, submitToMeta } = body;

  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!name || !bodyText) return NextResponse.json({ error: 'name and bodyText required' }, { status: 400 });

  // Save to DB
  const templateData: any = {
    merchant_id: merchantId,
    name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    language: language || 'fr',
    category: category || 'MARKETING',
    status: 'DRAFT',
    header_type: headerType || 'NONE',
    header_content: headerContent || null,
    body_text: bodyText,
    footer_text: footerText || null,
    buttons: JSON.stringify(buttons || []),
  };

  // Submit to Meta if requested
  if (submitToMeta) {
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

      const components = buildTemplateComponents({
        headerType: (headerType || 'NONE') as HeaderType,
        headerContent,
        bodyText,
        footerText,
        buttons: (buttons || []) as TemplateButton[],
      });

      const metaResult = await createTemplate(waConfig, {
        name: templateData.name,
        language: templateData.language,
        category: templateData.category as TemplateCategory,
        components,
      });

      templateData.meta_template_id = metaResult.id;
      templateData.status = metaResult.status || 'PENDING';
      templateData.meta_response = JSON.stringify(metaResult);
      templateData.submitted_at = new Date().toISOString();
    } catch (err: any) {
      return NextResponse.json({ error: `Meta API: ${err.message}` }, { status: 400 });
    }
  }

  const { data, error } = await adminClient
    .from('wa_templates')
    .insert(templateData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (!id || merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get template to check if it's on Meta
  const { data: template } = await adminClient
    .from('wa_templates')
    .select('*')
    .eq('id', id)
    .eq('merchant_id', merchantId)
    .single();

  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete from Meta if submitted
  if (template.meta_template_id) {
    const { data: config } = await adminClient
      .from('wa_business_config')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    if (config) {
      try {
        await deleteMetaTemplate({
          waba_id: config.waba_id,
          phone_number_id: config.phone_number_id,
          access_token: config.access_token,
        }, template.name);
      } catch (err) {
        // Non-blocking: template may already be deleted on Meta
        console.warn('Meta template delete failed:', err);
      }
    }
  }

  const { error } = await adminClient.from('wa_templates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
