import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Admin emails - loaded from environment variable
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return envEmails;
}

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return NextResponse.json(
      { error: 'Accès non autorisé' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    isAdmin: true,
    email: userEmail
  });
}
