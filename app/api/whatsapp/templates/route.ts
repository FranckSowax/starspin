import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';
import {
  syncTemplatesFromMeta,
  createTemplateOnMeta,
  deleteTemplateOnMeta,
} from '@/lib/whatsapp/client';

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
    .from('whatsapp_templates')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST - Sync, create, or submit templates
export async function POST(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, merchantId } = body;

  if (merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // ---- Sync templates from Meta ----
  if (action === 'sync') {
    const config = await getWhatsAppConfig(merchantId);
    if (config.provider !== 'meta') {
      return NextResponse.json({ error: 'Meta Cloud API config required for sync' }, { status: 400 });
    }

    try {
      const metaTemplates = await syncTemplatesFromMeta(config);

      let upserted = 0;
      for (const mt of metaTemplates) {
        const { error } = await adminClient
          .from('whatsapp_templates')
          .upsert({
            merchant_id: merchantId,
            meta_template_id: mt.id,
            name: mt.name,
            language: mt.language,
            category: mt.category,
            status: mt.status,
            components: mt.components,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'merchant_id,name,language' })
          .select();

        if (!error) upserted++;
      }

      return NextResponse.json({ synced: upserted, total: metaTemplates.length });
    } catch (err: any) {
      return NextResponse.json({ error: `Meta API: ${err.message}` }, { status: 400 });
    }
  }

  // ---- Create template ----
  if (action === 'create') {
    const { name, language, category, components, submitToMeta } = body;

    if (!name || !components) {
      return NextResponse.json({ error: 'name and components required' }, { status: 400 });
    }

    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const templateData: any = {
      merchant_id: merchantId,
      name: sanitizedName,
      language: language || 'fr',
      category: category || 'MARKETING',
      status: 'DRAFT',
      components,
    };

    // Submit to Meta if requested
    if (submitToMeta) {
      const config = await getWhatsAppConfig(merchantId);
      if (config.provider !== 'meta') {
        return NextResponse.json({ error: 'Meta Cloud API config required' }, { status: 400 });
      }

      try {
        const metaResult = await createTemplateOnMeta(config, {
          name: sanitizedName,
          language: templateData.language,
          category: templateData.category,
          components,
        });

        templateData.meta_template_id = metaResult.id;
        templateData.status = metaResult.status || 'PENDING';
        templateData.submitted_at = new Date().toISOString();
      } catch (err: any) {
        return NextResponse.json({ error: `Meta API: ${err.message}` }, { status: 400 });
      }
    }

    const { data, error } = await adminClient
      .from('whatsapp_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action. Use "sync" or "create".' }, { status: 400 });
}

// DELETE - Delete template locally and optionally from Meta
export async function DELETE(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const user = await verifyUser(request, adminClient);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  const merchantId = request.nextUrl.searchParams.get('merchantId');
  if (!id || merchantId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch template
  const { data: template } = await adminClient
    .from('whatsapp_templates')
    .select('*')
    .eq('id', id)
    .eq('merchant_id', merchantId)
    .single();

  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete from Meta if it has a meta_template_id
  if (template.meta_template_id) {
    try {
      const config = await getWhatsAppConfig(merchantId);
      if (config.provider === 'meta') {
        await deleteTemplateOnMeta(config, template.name);
      }
    } catch (err) {
      // Non-blocking: template may already be deleted on Meta
      console.warn('Meta template delete failed:', err);
    }
  }

  const { error } = await adminClient
    .from('whatsapp_templates')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
