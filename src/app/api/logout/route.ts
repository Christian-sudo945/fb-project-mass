import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = NextResponse.redirect(new URL('/', baseUrl), { status: 307 });
    
    // Clear all cookies
    response.cookies.delete('fb_token');
    response.cookies.delete('auth-storage');
    response.cookies.delete('kicker-theme');
    
    return response;
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/', baseUrl), { status: 307 });
  }
}
