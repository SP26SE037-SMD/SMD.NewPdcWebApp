import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const oldSyllabusId = url.searchParams.get("oldSyllabusId");
    const newSyllabusId = url.searchParams.get("newSyllabusId");

    if (!oldSyllabusId || !newSyllabusId) {
      return NextResponse.json(
        { error: "Missing syllabus IDs for comparison" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/syllabus/compare?oldSyllabusId=${oldSyllabusId}&newSyllabusId=${newSyllabusId}`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      },
    );

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /syllabus/compare POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
