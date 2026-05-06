import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const backendUrl = `${API_BASE_URL}/api/sessions/bluk`;
        console.log(`[Bulk Create Proxy] Calling Backend: ${backendUrl}`);
        console.log(`[Bulk Create Proxy] Token present: ${!!token}`);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();
        console.log(`[Bulk Create Proxy] Backend Status: ${response.status}`);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: `Raw server response: ${text}` };
        }

        if (!response.ok && data) {
            data._debug_raw = text;
            if (!data.message) {
                data.message = `Backend Error ${response.status}: ${text.slice(0, 100)}`;
            }
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, message: `Proxy Error: ${error.message}` },
            { status: 500 }
        );
    }
}
