import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") || "true";

    if (!id) {
      return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const body = await request.json();

    const backendUrl = `${BACKEND_URL}/api/accounts?id=${id}&status=${status}`;

    const backendResponse = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /accounts PUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
