import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const newStatus = searchParams.get("newStatus");

    const cookieStore = request.cookies;
    const token = cookieStore.get("smd-token")?.value;

    const response = await fetch(`${API_BASE_URL}/api/materials/${id}/status?newStatus=${newStatus}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      // Backend expects empty body if query params are used, or may require body if data was sent
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API ERROR] PATCH Material Status failed:`, error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}
