import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const accountId = searchParams.get("accountId");
        
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/status?status=${status}&accountId=${accountId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
