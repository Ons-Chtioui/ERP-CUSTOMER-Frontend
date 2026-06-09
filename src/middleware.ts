import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes publiques (non protégées)
const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/_next',
  '/favicon.ico',
  '/api',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // En développement, on laisse tout passer (optionnel)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Laisser passer les routes publiques
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Récupérer le token depuis le cookie
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_ACCESS_SECRET || 'fallback_secret',
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};