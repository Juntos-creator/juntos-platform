import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. RUTAS COMPLETAMENTE PÚBLICAS (Nunca deben redirigir a /login)
  const isPublicRoute =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path.startsWith('/privacidad') ||
    path.startsWith('/terminos');

  // Si no está autenticado y quiere entrar a una ruta protegida
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Si ya está autenticado e intenta ir a /login o /register, NO bloquear el Home (/)
  // Solo redirigir si intenta entrar a login/register teniendo sesión activa
  if (user && (path === '/login' || path === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;

    if (role === 'ADMIN' || user.email?.toLowerCase() === 'odel_kiss@hotmail.com') {
      return NextResponse.redirect(new URL('/admin/operations', request.url));
    }
    if (role === 'COMPANION' || role === 'ACOMPANANTE') {
      return NextResponse.redirect(new URL('/companion/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap, robots, imágenes públicas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};