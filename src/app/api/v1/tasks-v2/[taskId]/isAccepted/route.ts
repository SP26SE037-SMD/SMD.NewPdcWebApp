import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.syllabus.io.vn';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { taskId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const isAccepted = searchParams.get('isAccepted');
    const comment = searchParams.get('comment');
    
    let backendUrl = `${BACKEND_URL}/api/v1/tasks-v2/${taskId}/isAccepted`;
    const queryParts: string[] = [];
    if (isAccepted !== null && isAccepted !== undefined) {
      queryParts.push(`isAccepted=${isAccepted}`);
    }
    if (comment !== null && comment !== undefined) {
      queryParts.push(`comment=${encodeURIComponent(comment)}`);
    }
    if (queryParts.length > 0) {
      backendUrl += `?${queryParts.join('&')}`;
    }

    const backendResponse = await fetch(
      backendUrl, 
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API PATCH isAccepted] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
