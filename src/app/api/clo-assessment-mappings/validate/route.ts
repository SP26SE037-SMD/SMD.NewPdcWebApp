import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const { searchParams } = new URL(request.url);
        const syllabusId = searchParams.get("syllabusId");

        if (!syllabusId) {
            return NextResponse.json(
                { status: 400, message: "syllabusId is required" },
                { status: 400 }
            );
        }

        // Following the pattern from assessments/validate
        const backendUrl = `${API_BASE_URL}/api/clo-assessment-mappings/syllabus/${syllabusId}/validate`;
        console.log("[CLO Mapping Validate Proxy] Calling:", backendUrl);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: `Raw server response: ${text}` };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, message: `Proxy Error: ${error.message}` },
            { status: 500 }
        );
    }
}
