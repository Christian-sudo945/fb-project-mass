import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAuthenticated(request: NextRequest): boolean {
  const token = 
    request.cookies.get('fb_access_token')?.value || 
    request.cookies.get('fb_token')?.value ||
    request.nextUrl.searchParams.get('Token');
  const hasHash = request.nextUrl.hash.includes('access_token=');
  
  return !!token || hasHash;
}

export function middleware(request: NextRequest) {
  const isAuthed = isAuthenticated(request);
  const { pathname } = request.nextUrl;

  // Force redirect to dashboard if authenticated and trying to access root
  if (isAuthed && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Force redirect to root if not authenticated and trying to access dashboard
  if (!isAuthed && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*'
  ],
};
