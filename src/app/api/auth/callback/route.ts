import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get the base URL from environment or default
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  try {
    // Handle hash fragment with token
    const hash = request.nextUrl.hash;
    if (hash) {
      const match = hash.match(/access_token=([^&]+)/);
      if (match) {
        const token = decodeURIComponent(match[1]);
        return NextResponse.redirect(`${baseUrl}/dashboard?Token=${encodeURIComponent(token)}`);
      }
    }
    // Remove decryption of token
    const token = request.nextUrl.searchParams.get('token');
    if (token) {
      return NextResponse.redirect(`${baseUrl}/dashboard?Token=${encodeURIComponent(token)}`);
    }

    // Handle code flow
    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/error?message=No_auth_code`);
    }

    const tokenUrl = new URL('https://graph.facebook.com/v16.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_FB_APP_ID!);
    tokenUrl.searchParams.append('client_secret', process.env.FB_APP_SECRET!);
    tokenUrl.searchParams.append('redirect_uri', baseUrl);
    tokenUrl.searchParams.append('code', code);

    const response = await fetch(tokenUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    if (!data.access_token) {
      console.error('Token exchange failed:', data);
      return NextResponse.redirect(`${baseUrl}/error?message=Auth_failed`);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?Token=${encodeURIComponent(data.access_token)}`);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(`${baseUrl}/error?message=Server_error`);
  }
}

