import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const accessToken = searchParams.get('access_token');
    const fields = searchParams.get('fields');

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    }

    // Direct API call without any token manipulation
    const response = await fetch(
      `https://graph.facebook.com/v16.0/me/accounts?access_token=${accessToken}&fields=${fields}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Facebook API error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
