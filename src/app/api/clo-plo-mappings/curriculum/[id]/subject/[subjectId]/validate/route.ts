import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
    try {
        const { id, subjectId } = await params;
        const body = await request.json();
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        // Backend endpoint: /api/clo-plo-mappings/curriculum/{id}/subject/{subjectId}/validate
        const backendResponse = await fetch(`${BACKEND_URL}/api/clo-plo-mappings/curriculum/${id}/subject/${subjectId}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body),
        });

        console.log(`[API /api/clo-plo-mappings/curriculum/${id}/subject/${subjectId}/validate POST] Backend Status:`, backendResponse.status);

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[API /api/clo-plo-mappings/curriculum/${id}/subject/${subjectId}/validate POST] Backend Error Text:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error: any) {
        console.error('[API /api/clo-plo-mappings/curriculum/[id]/subject/[subjectId]/validate POST] Frontend Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
