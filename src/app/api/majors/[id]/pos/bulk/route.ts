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
        const body = await request.json(); // Expecting an array of POs
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        // Assuming Backend has a bulk insert endpoint like /api/majors/{id}/pos/bulk
        // If not, we might need to loop or coordinate with user. 
        // For now, following standard bulk pattern.
        const backendResponse = await fetch(`${BACKEND_URL}/api/majors/${id}/pos/bulk`, {
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
        console.error('[API /majors/[id]/pos/bulk POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
