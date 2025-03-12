import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('fb_token');
  const hasTokenParam = request.nextUrl.searchParams.has('Token');
  const isAuthPath = request.nextUrl.pathname === '/dashboard';
  const isHomePath = request.nextUrl.pathname === '/';

  // Protect dashboard access
  if (isAuthPath && !token && !hasTokenParam) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Prevent authenticated users from accessing home
  if (isHomePath && token) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard'],
};
