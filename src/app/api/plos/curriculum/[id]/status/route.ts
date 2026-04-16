import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const newStatus = searchParams.get('newStatus');

    if (!newStatus) {
      return NextResponse.json({ error: 'Missing newStatus parameter' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

    const backendResponse = await fetch(`${BACKEND_URL}/api/plos/curriculum/${id}/status?newStatus=${newStatus}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
    }

    try {
        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch {
        return new NextResponse(null, { status: backendResponse.status });
    }
  } catch (error: any) {
    console.error('[API /api/plos/curriculum/[id]/status PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
