import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const curriculumId = searchParams.get("curriculumId");
    const departmentId = searchParams.get("departmentId");
    const newStatus = searchParams.get("newStatus");
    const oldStatus = searchParams.get("oldStatus");

    if (!curriculumId || !newStatus) {
      return NextResponse.json(
        { error: "curriculumId and newStatus query parameters are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // Use URLSearchParams to build the backend query string
    const backendParams = new URLSearchParams();
    backendParams.append("curriculum_id", curriculumId);
    if (departmentId) backendParams.append("department_id", departmentId);
    backendParams.append("newStatus", newStatus);
    if (oldStatus) backendParams.append("oldStatus", oldStatus);

    const backendUrl = `${BACKEND_URL}/api/subjects/curriculum/department/status?${backendParams.toString()}`;

    const backendResponse = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "accept": "*/*",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[API /api/subjects/bulk-status PATCH] Backend Error:`, errorText);
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
    console.error(`[API /api/subjects/bulk-status PATCH] Error:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
