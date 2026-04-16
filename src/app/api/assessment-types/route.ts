import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const page = searchParams.get("page") || "0";
        const size = searchParams.get("size") || "100";
        const sort = searchParams.get("sort") || "typeName,asc";

        const token = request.cookies.get("smd-token")?.value;

        const queryParams = new URLSearchParams({
            search,
            page,
            size,
            sort,
        });

        const response = await fetch(`${API_BASE_URL}/api/assessment-types?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}
