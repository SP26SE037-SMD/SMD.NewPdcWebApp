import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(`\n\n[PROXY POST /api/materials] SENDING TO BACKEND:`);
        console.log(JSON.stringify(body, null, 2));
        console.log(`\n\n`);
        
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

        const backendResponse = await fetch(`${BACKEND_URL}/api/materials`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "*/*",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json().catch(() => null);
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error("[API /materials POST] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
