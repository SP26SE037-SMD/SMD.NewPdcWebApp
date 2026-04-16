import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function PUT(
  request: Request
) {
  try {
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    console.log(`>>> PROXY PUT /api/blocks/update-list`, JSON.stringify(body, null, 2));

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/blocks/update-list`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await backendResponse.json().catch(() => null);
    
    if (!backendResponse.ok) {
        console.error(`<<< PROXY PUT ERROR [${backendResponse.status}]:`, JSON.stringify(data, null, 2));
    } else {
        console.log(`<<< PROXY PUT SUCCESS [${backendResponse.status}]`);
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /blocks/update-list PUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
