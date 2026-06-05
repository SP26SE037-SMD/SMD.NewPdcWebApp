import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const syllabusId = url.searchParams.get("syllabusId");
        const subjectId = url.searchParams.get("subjectId");
        
        const formData = await request.formData();
        
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const backendUrl = `${API_BASE_URL}/api/sessions/import?syllabusId=${syllabusId}&subjectId=${subjectId}`;
        console.log("[Session Import Proxy] Calling:", backendUrl);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
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
