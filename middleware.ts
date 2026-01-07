import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin'];

// Routes that require admin privileges
const ADMIN_ROUTES = ['/admin', '/api/admin'];

// Admin emails - loaded from environment variable
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return envEmails;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log pour debug
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute) {
    console.log('[MIDDLEWARE] Route protégée:', pathname);
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    console.log('[MIDDLEWARE] Nombre total de cookies:', allCookies.length);
    console.log('[MIDDLEWARE] Cookies Supabase:', supabaseCookies.map(c => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      // Afficher les 50 premiers caractères pour debug
      valuePreview: c.value?.substring(0, 50) + '...'
    })));
  }

  // Create response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get current session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (isProtectedRoute) {
    console.log('[MIDDLEWARE] User trouvé:', !!user);
    console.log('[MIDDLEWARE] User email:', user?.email);
    console.log('[MIDDLEWARE] Erreur auth:', error?.message);
  }

  // Check if route requires authentication
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && (!user || error)) {
    console.log('[MIDDLEWARE] Redirection vers login - pas de session valide');
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin authorization for admin routes
  if (isAdminRoute && user) {
    const adminEmails = getAdminEmails();
    const userEmail = user.email?.toLowerCase();

    // If no admin emails configured, deny access (fail-secure)
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured. Admin access denied.');
      return NextResponse.json(
        { error: 'Admin access not configured. Please set ADMIN_EMAILS environment variable.' },
        { status: 403 }
      );
    }

    // Check if user is admin
    if (!userEmail || !adminEmails.includes(userEmail)) {
      console.warn(`Unauthorized admin access attempt by: ${userEmail}`);

      // For API routes, return JSON error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }

      // For page routes, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
