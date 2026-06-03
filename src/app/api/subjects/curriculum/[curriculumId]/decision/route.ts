import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.syllabus.io.vn';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ curriculumId: string }> }
) {
  try {
    const { curriculumId } = await params;
    const url = new URL(request.url);
    const decisionNo = url.searchParams.get('decisionNo') || '';

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/subjects/curriculum/${curriculumId}/decision?curriculumId=${curriculumId}&decisionNo=${encodeURIComponent(decisionNo)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[API /api/subjects/curriculum/${curriculumId}/decision PATCH] Backend Error:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json({ error: errorText || 'Backend returned an error' }, { status: backendResponse.status });
      }
    }

    const data = await backendResponse.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[API /api/subjects/curriculum/[curriculumId]/decision PATCH] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
