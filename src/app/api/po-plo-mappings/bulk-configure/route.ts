import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/po-plo-mappings/bulk-configure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'close',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body),
        });

        const responseText = await backendResponse.text();
        
        if (!backendResponse.ok) {
            console.error(`[API /bulk-configure POST] Backend returned ${backendResponse.status}:`, responseText, "Payload was:", JSON.stringify(body));
        }

        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            data = { message: responseText };
        }

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /po-plo-mappings/bulk-configure POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
