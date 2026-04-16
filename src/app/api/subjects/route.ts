import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams.toString();

        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/subjects${searchParams ? `?${searchParams}` : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/subjects POST] Backend Error Text:`, errorText);
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
        console.error('[API /subjects GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/subjects POST] Backend Error Text:`, errorText);
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
        console.error('[API /subjects POST] Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
