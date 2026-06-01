import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const backendUrl = `${API_BASE_URL}/api/sessions/bluk`;
        console.log(`[Bulk Create Proxy] Calling Backend: ${backendUrl}`);
        console.log(`[Bulk Create Proxy] Token: ${token}`);

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
        
        try {
            const fs = require('fs');
            fs.writeFileSync('last_backend_bulk_error.log', `Status: ${response.status}\nBody: ${text}\nPayload sent: ${JSON.stringify(body)}`);
        } catch(err) {
            console.error("Failed to write log", err);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: `Raw server response: ${text}` };
        }

        if (!response.ok && data) {
            data._debug_raw = text;
            if (response.status === 400 && Array.isArray(data.errors)) {
                const fieldErrors = data.errors.map((e: any) => `${e.field}: ${e.defaultMessage}`).join(', ');
                data.message = `Validation Error: ${fieldErrors}`;
            } else if (!data.message) {
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
