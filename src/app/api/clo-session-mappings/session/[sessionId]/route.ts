import { NextResponse, NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

    console.log(`[PROXY SESSION GET] Fetching by Session ID: ${sessionId}, Token exists: ${!!token}`);

    const response = await fetch(`${BACKEND_URL}/api/clo-session-mappings/session/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error body");
      console.error(`[PROXY SESSION GET] Backend error ${response.status}: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(errorData, { status: response.status });
      } catch {
        return NextResponse.json({ message: errorText }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API /clo-session-mappings/session GET] Error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}
