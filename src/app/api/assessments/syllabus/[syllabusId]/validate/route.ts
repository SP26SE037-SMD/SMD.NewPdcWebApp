import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string }> }
) {
    try {
        const { syllabusId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
        const body = await request.json();

        const backendResponse = await fetch(
            `${API_BASE_URL}/api/assessments/validate?syllabusId=${syllabusId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "*/*",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
                cache: "no-store",
            }
        );

        const data = await backendResponse.json().catch(() => null);
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
