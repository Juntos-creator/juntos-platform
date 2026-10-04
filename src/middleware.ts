import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. RUTAS PÚBLICAS PERMITIDAS (NO REDIRIGIR NUNCA AL LOGIN)
  // Permitir la página principal '/', login, registro, activos estáticos e imágenes
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Para rutas privadas (como /profile, /admin, etc.) se puede comprobar la cookie de Supabase
  // Si no hay cookies de sesión en rutas privadas, ahí sí va al login:
  const token = req.cookies.get('sb-access-token')?.value || 
                req.cookies.get('supabase-auth-token')?.value ||
                req.cookies.getAll().some(c => c.name.includes('auth-token') || c.name.includes('sb-'));

  // Si intenta entrar a una ruta protegida sin sesión, redirigir
  if (!token && (pathname.startsWith('/profile') || pathname.startsWith('/admin'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Coincidir con todas las rutas excepto recursos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};