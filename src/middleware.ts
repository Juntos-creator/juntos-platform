import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Permitir libre acceso a la página principal y a todas las vistas
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};