import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    let bodyData = undefined;
    const contentType = request.headers.get("content-type");
    if (contentType && (contentType.includes("application/json") || contentType.includes("application/x-www-form-urlencoded"))) {
      bodyData = await request.text();
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/syllabus/save-compare-version`, {
      method: "POST",
      headers: {
        accept: "*/*",
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: bodyData
    });

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /syllabus/save-compare-version POST] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
