import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // Timeout to avoid hanging when backend is unreachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendResponse = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data;
    try {
      data = await backendResponse.json();
    } catch {
      data = null;
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ENETUNREACH' || error?.name === 'AbortError' || error?.cause?.code === 'ECONNREFUSED';
    console.error(`[API /tasks GET] Error:`, isNetworkError ? `Backend unreachable: ${error?.cause?.code || error?.name}` : error);
    return NextResponse.json(
      { error: isNetworkError ? "Backend server is currently unreachable. Please try again later." : "Internal server error", data: null },
      { status: isNetworkError ? 503 : 500 },
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /api/tasks/[id] DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const backendResponse = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
        console.error(`[API PUT /tasks/${id}] Failed. Body sent:`, body);
    }

    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[API /api/tasks/[id] PUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
