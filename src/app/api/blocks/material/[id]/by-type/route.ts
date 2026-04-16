import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const { searchParams } = new URL(request.url);
    
    // Get backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';
    
    // Construct target URL
    const targetUrl = new URL(`${BACKEND_URL}/api/blocks/material/${id}/by-type`);
    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    console.log('Proxying GET /api/blocks/material/[id]/by-type to:', targetUrl.toString());

    try {
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Backend Error (Blocks by-type):', data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy Error (Blocks by-type):', error);
        return NextResponse.json(
            { status: 500, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
