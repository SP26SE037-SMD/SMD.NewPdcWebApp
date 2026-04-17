import { cookies } from 'next/headers';
// Using relative import to bypass potential alias/cache issues
import { AUTH_TOKEN_COOKIE } from '../../../../../../lib/auth';

/**
 * Proxy API for bulk creating material blocks with indices.
 * [REFRESHED VERSION]
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
        const body = await request.json();

        // LOG PAYLOAD SENDING TO BACKEND HERE
        console.log(`\n\n[PROXY WITH-IDX] SENDING TO BACKEND (Material ${id}):`);
        console.log(JSON.stringify(body, null, 2));
        console.log(`\n\n`);

        const baseUrl = process.env.BACKEND_URL || 'http://43.207.156.116';
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}/api/blocks/material/${id}/with-idx`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[PROXY ERROR] POST /api/blocks/material/${id}/with-idx -> ${response.status}: ${errorText}`);
            return new Response(errorText, { 
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
