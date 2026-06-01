import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        // Extract syllabusId from query params
        const { searchParams } = new URL(request.url);
        const syllabusId = searchParams.get("syllabusId");

        if (!syllabusId) {
            return NextResponse.json(
                { status: 400, message: "syllabusId is required" },
                { status: 400 }
            );
        }

        const backendUrl = `${API_BASE_URL}/api/sessions/syllabus/${syllabusId}/validate`;
        console.log("[Validate Proxy] Calling Backend:", backendUrl);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        console.log("[Validate Proxy] Backend Status:", response.status);

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("[Validate Proxy] Failed to parse JSON response:", text.substring(0, 200));
            data = { status: response.status, message: `Raw server response: ${text}` };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("[Validate Proxy] CRITICAL ERROR:", error);
        return NextResponse.json(
            { status: 500, message: `Proxy Error: ${error.message}` },
            { status: 500 }
        );
    }
}
