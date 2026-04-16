import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string }> }
) {
    try {
        const { syllabusId } = await params;
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
        const queryParams = status ? `?status=${status}` : "";

        const backendResponse = await fetch(`${API_BASE_URL}/api/sessions/syllabus/${syllabusId}${queryParams}`, {
            method: "GET",
            headers: {
                accept: "*/*",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const data = await backendResponse.json().catch(() => null);
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
