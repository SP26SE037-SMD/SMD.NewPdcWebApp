import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const syllabusId = searchParams.get('syllabusId');
        
        if (!syllabusId) {
            return NextResponse.json({ status: 400, message: "Missing syllabusId" }, { status: 400 });
        }

        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const response = await fetch(`${API_BASE_URL}/api/sessions/batch?syllabusId=${syllabusId}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const syllabusId = searchParams.get('syllabusId');
        
        if (!syllabusId) {
            return NextResponse.json({ status: 400, message: "Missing syllabusId" }, { status: 400 });
        }

        const body = await request.json();
        const cookieStore = request.cookies;
        const token = cookieStore.get("smd-token")?.value;

        const response = await fetch(`${API_BASE_URL}/api/sessions/batch?syllabusId=${syllabusId}`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
