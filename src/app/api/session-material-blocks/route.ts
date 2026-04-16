import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const { searchParams } = new URL(request.url);
    
    const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';
    const targetUrl = new URL(`${BACKEND_URL}/api/session-material-blocks`);
    
    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    try {
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
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
