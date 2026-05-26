import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/curricula/${id}/export-pdf`, {
            method: 'GET',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const arrayBuffer = await backendResponse.arrayBuffer();
        
        const headers = new Headers();
        const contentType = backendResponse.headers.get('content-type') || 'application/pdf';
        const contentDisposition = backendResponse.headers.get('content-disposition') || `attachment; filename="curriculum-${id}.pdf"`;
        
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', contentDisposition);

        return new Response(arrayBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error(`[API /api/curricula/[id]/export-pdf GET] Error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
