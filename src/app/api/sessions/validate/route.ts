import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

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

        // Correct backend URL: /api/sessions/syllabus/{syllabusId}/validate
        const backendUrl = `${API_BASE_URL}/api/sessions/syllabus/${syllabusId}/validate`;
        console.log("[Validate Proxy] Calling:", backendUrl);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();
        
        try {
            const fs = require('fs');
            fs.writeFileSync('last_backend_error.log', `URL: ${backendUrl}\nStatus: ${response.status}\nBody: ${text}\nPayload sent: ${JSON.stringify(body)}`);
        } catch(err) {
            console.error("Failed to write log", err);
        }
        
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
