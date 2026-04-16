import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const newStatus = searchParams.get('newStatus');
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        // Backend endpoint: /api/pos/major/{id}/status?newStatus={status}
        const backendResponse = await fetch(`${BACKEND_URL}/api/pos/major/${id}/status?newStatus=${newStatus}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        console.log(`[API /api/pos/major/${id}/status PATCH] Backend Status:`, backendResponse.status);

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/pos/major/${id}/status PATCH] Backend Error Text:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error: any) {
        console.error('[API /api/pos/major/[id]/status PATCH] Frontend Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
