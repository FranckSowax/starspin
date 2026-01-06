import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase admin client
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// GET - List all campaigns for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: campaigns, error } = await supabase
      .from('whatsapp_campaigns')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaigns });

  } catch (error: any) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, name, mainMessage, cards } = body;

    if (!merchantId || !name || !mainMessage || !cards) {
      return NextResponse.json(
        { error: 'merchantId, name, mainMessage and cards are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: campaign, error } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        merchant_id: merchantId,
        name,
        main_message: mainMessage,
        cards,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign });

  } catch (error: any) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, merchantId, name, mainMessage, cards, isFavorite, incrementSendCount } = body;

    if (!id || !merchantId) {
      return NextResponse.json(
        { error: 'id and merchantId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (mainMessage !== undefined) updates.main_message = mainMessage;
    if (cards !== undefined) updates.cards = cards;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;

    // If incrementing send count, update last_sent_at too
    if (incrementSendCount) {
      const { data: current } = await supabase
        .from('whatsapp_campaigns')
        .select('send_count')
        .eq('id', id)
        .eq('merchant_id', merchantId)
        .single();

      updates.send_count = (current?.send_count || 0) + 1;
      updates.last_sent_at = new Date().toISOString();
    }

    const { data: campaign, error } = await supabase
      .from('whatsapp_campaigns')
      .update(updates)
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign });

  } catch (error: any) {
    console.error('Campaigns PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const merchantId = searchParams.get('merchantId');

    if (!id || !merchantId) {
      return NextResponse.json(
        { error: 'id and merchantId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('whatsapp_campaigns')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Error deleting campaign:', error);
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Campaigns DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
