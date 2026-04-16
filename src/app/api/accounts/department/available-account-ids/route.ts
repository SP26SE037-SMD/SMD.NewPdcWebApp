import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syllabusId = searchParams.get("syllabusId");

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const url = new URL(`${BACKEND_URL}/api/accounts/department/available-account-ids`);
    if (syllabusId) url.searchParams.set("syllabusId", syllabusId);

    const backendResponse = await fetch(url.toString(), {
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
    console.error("[API /accounts/department/available-account-ids GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
