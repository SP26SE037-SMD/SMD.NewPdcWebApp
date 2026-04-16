import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ syllabusId: string }> }
) {
  try {
    const { syllabusId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(`${API_BASE_URL}/api/syllabus/${syllabusId}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /syllabus/[syllabusId] GET] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
