import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string, accountId: string }> }
) {
    try {
        const { syllabusId, accountId } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        console.log(`[BFF] PDCM Submit - Updating Syllabus Status:
        - SyllabusId: ${syllabusId}
        - AccountId: ${accountId}
        - Status: ${status}
        - Token present: ${!!token}`);

        const backendUrl = `${API_BASE_URL}/api/syllabus/${syllabusId}/account/${accountId}/status?status=${status}`;
        console.log(`[BFF] Backend URL: ${backendUrl}`);

        const response = await fetch(backendUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
        });

        const data = await response.json().catch(() => ({}));
        console.log(`[BFF] Backend Response (${response.status}):`, JSON.stringify(data));
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
