import { NextResponse, NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

    console.log(`[PROXY SESSION DELETE] Mapping ID: ${id}, Token exists: ${!!token}`);

    const response = await fetch(`${BACKEND_URL}/api/clo-session-mappings/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error body");
      console.error(`[PROXY SESSION DELETE] Backend error ${response.status}: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(errorData, { status: response.status });
      } catch {
        return NextResponse.json({ message: errorText }, { status: response.status });
      }
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API /clo-session-mappings DELETE] Error:`, error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}
