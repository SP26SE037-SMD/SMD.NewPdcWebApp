import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ syllabusId: string }> }
) {
  try {
    const { syllabusId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(`${API_BASE_URL}/api/syllabus/${syllabusId}/publish`, {
      method: "PATCH",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /syllabus/[syllabusId]/publish PATCH] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
