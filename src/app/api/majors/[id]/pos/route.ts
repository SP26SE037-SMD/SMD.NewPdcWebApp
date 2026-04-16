import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/majors/${id}/pos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /majors/[id]/pos POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/majors/${id}/pos?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        console.log(`[API /majors/${id}/pos GET] Backend Status:`, backendResponse.status);

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /majors/${id}/pos GET] Backend Error Text:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API /majors/[id]/pos GET] Frontend Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
