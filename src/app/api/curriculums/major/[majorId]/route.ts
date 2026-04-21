import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function GET(
    request: Request,
    context: { params: Promise<{ majorId: string }> }
) {
    try {
        const { majorId } = await context.params;
        const url = new URL(request.url);
        const searchParams = url.searchParams.toString();

        const backendUrl = `${BACKEND_URL}/api/curriculums/major/${majorId}${searchParams ? `?${searchParams}` : ''}`;

        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /curriculums/major/[majorId] GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
