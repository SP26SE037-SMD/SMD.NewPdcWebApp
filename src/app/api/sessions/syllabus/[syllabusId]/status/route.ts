import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string }> }
) {
    try {
        const { syllabusId } = await params;
        const { searchParams } = new URL(request.url);
        const newStatus = searchParams.get("newStatus");
        
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const response = await fetch(`${API_BASE_URL}/api/sessions/syllabus/${syllabusId}/status?newStatus=${newStatus}`, {
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
