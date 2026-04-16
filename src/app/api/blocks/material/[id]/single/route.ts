import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    console.log(`>>> PROXY POST /api/blocks/material/${id}/single`, JSON.stringify(body, null, 2));

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/blocks/material/${id}/single`,
      {
        method: "POST",
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
        console.error(`<<< PROXY POST ERROR [${backendResponse.status}]:`, JSON.stringify(data, null, 2));
    } else {
        console.log(`<<< PROXY POST SUCCESS [${backendResponse.status}]`);
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /blocks/material/[id]/single POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
