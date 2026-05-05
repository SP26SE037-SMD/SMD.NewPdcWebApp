import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const response = await fetch(`${API_BASE_URL}/swagger/v1/swagger.json`, {
            method: 'GET',
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            }
        });

        const text = await response.text();
        fs.writeFileSync('swagger_dump.json', text);

        return NextResponse.json({ success: true, status: response.status });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
