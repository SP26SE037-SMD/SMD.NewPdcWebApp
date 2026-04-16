import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(`${BACKEND_URL}/api/clos/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json().catch(() => ({
      status: backendResponse.ok ? 1000 : backendResponse.status,
      message: backendResponse.ok
        ? "CLO deleted successfully"
        : "Failed to delete CLO",
    }));

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /clos/[id] DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
