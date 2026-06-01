import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.syllabus.io.vn';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ majorId: string }> }
) {
    try {
        const { majorId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        // Get query parameters (search, page, size, sort)
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '100'; // Default to 100 for review screen
        const sort = searchParams.getAll('sort');

        // Construct backend URL with query params
        const backendUrl = new URL(`${BACKEND_URL}/api/regulations/major/${majorId}`);
        if (search) backendUrl.searchParams.append('search', search);
        backendUrl.searchParams.append('page', page);
        backendUrl.searchParams.append('size', size);
        if (sort && sort.length > 0) {
            sort.forEach(s => backendUrl.searchParams.append('sort', s));
        } else {
            backendUrl.searchParams.append('sort', 'createdAt,desc');
        }

        const backendResponse = await fetch(backendUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
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

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[API /regulations/major/[majorId] GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
