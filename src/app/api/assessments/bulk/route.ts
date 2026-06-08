import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const backendUrl = `${API_BASE_URL}/api/assessments/bulk`;
        console.log("[Assessment Bulk Delete Proxy] Calling:", backendUrl, "with body:", body);

        const response = await fetch(backendUrl, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();

        let data;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { message: `Raw server response: ${text}` };
            }
        } else {
            data = null;
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, message: `Proxy Error: ${error.message}` },
            { status: 500 }
        );
    }
}
