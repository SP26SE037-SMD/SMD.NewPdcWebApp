import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

async function handleRequest(request: Request, context: { params: Promise<{ path?: string[] }> }) {
    try {
        const params = await context.params;
        const subPath = params.path ? params.path.join('/') : '';
        const url = new URL(request.url);
        const searchParams = url.searchParams.toString();
        
        let backendUrl = `${BACKEND_URL}/api/v1/forms`;
        if (subPath) {
            backendUrl += `/${subPath}`;
        }
        if (searchParams) {
            backendUrl += `?${searchParams}`;
        }
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
            method: request.method,
            headers,
        };

        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            const body = await request.json().catch(() => null);
            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }
        }

        const backendResponse = await fetch(backendUrl, fetchOptions);

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
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
        console.error('[API /v1/forms PROXY] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
