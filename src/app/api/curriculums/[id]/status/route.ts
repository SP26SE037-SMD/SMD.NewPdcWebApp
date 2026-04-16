import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

        const backendResponse = await fetch(`${BACKEND_URL}/api/curriculums/${id}/status?status=${status}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API /curriculums/[id]/status PATCH] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
