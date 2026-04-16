import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const body = await request.json();
    
    const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';
    const targetUrl = `${BACKEND_URL}/api/session-material-blocks/bulk-configure`;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
