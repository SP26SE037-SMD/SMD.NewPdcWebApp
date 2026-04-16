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

        const response = await fetch(`${API_BASE_URL}/api/assessments/syllabus/${syllabusId}${queryParams}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[API /assessments/syllabus/${error}] GET Error:`, error);
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
