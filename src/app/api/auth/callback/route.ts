import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://a104-120-28-252-18.ngrok-free.app ';

  if (!code) {
    console.error('No code provided');
    return NextResponse.redirect(`${baseUrl}/error?message=No_code_provided`);
  }

  try {
    const tokenResponse = await fetch(
      'https://graph.facebook.com/v16.0/oauth/access_token?' +
      `client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
      `&client_secret=${process.env.FB_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(baseUrl + '/api/auth/callback')}` +
      `&code=${code}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return NextResponse.redirect(`${baseUrl}/error?message=Auth_failed`);
    }

    const response = NextResponse.redirect(`${baseUrl}/dashboard?Token=${tokenData.access_token}`);
    
    // Set HTTP-only cookie
    response.cookies.set('fb_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(`${baseUrl}/error?message=Server_error`);
  }
}

