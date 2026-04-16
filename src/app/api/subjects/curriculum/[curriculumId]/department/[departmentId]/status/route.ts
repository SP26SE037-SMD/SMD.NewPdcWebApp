import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ curriculumId: string; departmentId: string }> },
) {
  try {
    const { curriculumId, departmentId } = await params;
    const { searchParams } = new URL(request.url);
    const newStatus = searchParams.get("newStatus");

    if (!newStatus) {
        return NextResponse.json({ error: "newStatus query parameter is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendUrl = `${BACKEND_URL}/api/subjects/curriculum/${curriculumId}/department/${departmentId}/status?newStatus=${newStatus}`;

    const backendResponse = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "accept": "*/*",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[API /api/subjects/curriculum/.../status PATCH] Backend Error:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json(
          { error: errorText || "Backend returned an error" },
          { status: backendResponse.status },
        );
      }
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /api/subjects/curriculum/.../status PATCH] Error:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
