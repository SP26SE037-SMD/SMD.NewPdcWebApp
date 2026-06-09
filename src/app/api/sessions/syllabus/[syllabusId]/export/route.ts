import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.BACKEND_URL || "https://api.syllabus.io.vn";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ syllabusId: string }> }
) {
    try {
        const { syllabusId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${API_BASE_URL}/api/sessions/syllabus/${syllabusId}/export`, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        if (!backendResponse.ok) {
            let errorText = "Export failed";
            try { errorText = await backendResponse.text(); } catch (e) {}
            return NextResponse.json({ status: backendResponse.status, message: errorText }, { status: backendResponse.status });
        }

        const buffer = await backendResponse.arrayBuffer();
        
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": backendResponse.headers.get("Content-Type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": backendResponse.headers.get("Content-Disposition") || `attachment; filename="Syllabus_${syllabusId}_Sessions.xlsx"`,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
