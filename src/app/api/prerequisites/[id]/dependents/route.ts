import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/prerequisites/${id}/dependents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/prerequisites/${id}/dependents GET] Backend Error:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });

    } catch (error) {
        console.error(`[API /api/prerequisites/[id]/dependents GET] Error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
