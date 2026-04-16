import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        if (!token) {
            console.warn('[Session Update Proxy] Unauthorized: smd-token cookie not found');
            return NextResponse.json(
                { status: 401, message: 'Unauthenticated: Please re-login' },
                { status: 401 }
            );
        }

        const targetUrl = `${BACKEND_URL}/api/session-material-blocks/update`;
        console.log(`[Session Update Proxy] Forwarding to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });

        console.log('Backend Status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('Backend Response JSON:', JSON.stringify(data, null, 2));
        } else {
            const rawText = await response.text();
            console.log('Backend Response Text (Non-JSON):', rawText);
            data = { status: response.status, message: rawText || 'Non-JSON response from backend' };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { status: 500, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
