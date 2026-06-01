import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string }> }
) {
    try {
        const { syllabusId } = await params;
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const backendUrl = `${API_BASE_URL}/api/clo-assessment-mappings/syllabus/${syllabusId}`;
        console.log("[CLO Assessment Mapping Syllabus Proxy] Calling:", backendUrl);

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, message: `Proxy Error: ${error.message}` },
            { status: 500 }
        );
    }
}
