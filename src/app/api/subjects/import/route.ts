import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/subjects/import`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData,
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/subjects/import POST] Backend Error:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Upload failed' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /subjects/import POST] Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
