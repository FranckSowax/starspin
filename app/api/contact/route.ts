import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper to get Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * POST /api/contact
 *
 * Submit a new contact message
 * Body: {
 *   name: string,
 *   email: string,
 *   company?: string,
 *   establishments?: string,
 *   message?: string,
 *   source?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, establishments, message, source = 'contact_page' } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('[CONTACT API] Failed to create Supabase client');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Insert the contact message
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name,
        email: email.toLowerCase(),
        company: company || null,
        establishments: establishments || null,
        message: message || null,
        source,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('[CONTACT API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact message saved successfully',
      id: data.id
    });

  } catch (error) {
    console.error('[CONTACT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contact
 *
 * Get all contact messages (admin only)
 * Query params:
 *   status?: 'new' | 'read' | 'replied' | 'archived' | 'all'
 *   limit?: number
 *   offset?: number
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[CONTACT API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get counts by status
    const { data: statusCounts } = await supabaseAdmin
      .from('contact_messages')
      .select('status')
      .then(({ data }) => {
        const counts = { new: 0, read: 0, replied: 0, archived: 0 };
        data?.forEach(item => {
          if (item.status in counts) {
            counts[item.status as keyof typeof counts]++;
          }
        });
        return { data: counts };
      });

    return NextResponse.json({
      messages: data || [],
      total: count || 0,
      statusCounts
    });

  } catch (error) {
    console.error('[CONTACT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contact
 *
 * Update a contact message (status, notes, etc.)
 * Body: {
 *   id: string,
 *   status?: 'new' | 'read' | 'replied' | 'archived',
 *   notes?: string
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (status) {
      updates.status = status;
      if (status === 'read' && !body.read_at) {
        updates.read_at = new Date().toISOString();
      }
      if (status === 'replied' && !body.replied_at) {
        updates.replied_at = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CONTACT API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data
    });

  } catch (error) {
    console.error('[CONTACT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contact
 *
 * Delete a contact message
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CONTACT API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('[CONTACT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
