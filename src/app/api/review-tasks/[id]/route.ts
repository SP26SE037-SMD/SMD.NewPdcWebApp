import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!BACKEND_URL) {
      console.error("[API /review-tasks] BACKEND_URL not configured");
      return NextResponse.json({ error: "Backend service not configured" }, { status: 500 });
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/review-tasks/${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();
    return NextResponse.json({ error: "Backend error", message: text }, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /review-tasks] GET Error:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as any).message },
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

    if (!BACKEND_URL) {
      console.error("[API /review-tasks] BACKEND_URL not configured");
      return NextResponse.json({ error: "Backend service not configured" }, { status: 500 });
    }

    console.log(`[API /review-tasks] PUT Calling backend: ${BACKEND_URL}/api/review-tasks/${id}`);

    const backendResponse = await fetch(`${BACKEND_URL}/api/review-tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const contentType = backendResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await backendResponse.json();
      if (backendResponse.status >= 400) {
        return NextResponse.json(
          { ...data, _debug_sentPayload: body, _debug_id: id },
          { status: backendResponse.status }
        );
      }
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();
    console.error(`[API /review-tasks] Backend returned non-JSON response:`, text);
    return NextResponse.json(
      { 
        error: "Backend Error", 
        message: text.slice(0, 500),
        sentPayload: body,
        idFromContext: id
      },
      { status: backendResponse.status }
    );
  } catch (error) {
    console.error(`[API /review-tasks] PUT Crash:`, error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: (error as any).message
      },
      { status: 500 },
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

    if (!BACKEND_URL) {
      return NextResponse.json({ error: "Backend service not configured" }, { status: 500 });
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/review-tasks/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = backendResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();
    return NextResponse.json({ error: "Backend error", message: text }, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /review-tasks] DELETE Error:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as any).message },
      { status: 500 },
    );
  }
}
