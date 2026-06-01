import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.syllabus.io.vn';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendUrl = `${BACKEND_URL}/api/curriculums/extract-pdf`;
        console.log(`[BFF] Calling Backend: ${backendUrl}`);

        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData,
        });
        
        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[BFF] Backend Error (${backendResponse.status}):`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: backendResponse.status });
            } catch {
                return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
            }
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /curriculums/extract-pdf POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
