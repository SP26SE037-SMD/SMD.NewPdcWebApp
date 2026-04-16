import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let id = "unknown";
  try {
    ({ id } = await params);
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const backendUrl = new URL(`${BACKEND_URL}/api/subjects/${id}`);

    if (token) {
      // Some backend endpoints in this system accept/require jwt via query param.
      backendUrl.searchParams.set("jwt", token);
    }

    const backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[API /api/subjects/${id} GET] Backend Error:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json(
          { error: errorText || "Backend returned an error" },
          { status: backendResponse.status },
        );
      }
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /api/subjects/${id} GET] Error:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
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

    const backendResponse = await fetch(`${BACKEND_URL}/api/subjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `[API /api/subjects/${id} PUT] Backend Error Text:`,
        errorText,
      );
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json(
          { error: errorText || "Backend returned an error" },
          { status: backendResponse.status },
        );
      }
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /subjects/[id] PUT] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const backendResponse = await fetch(`${BACKEND_URL}/api/subjects/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `[API /api/subjects/${id} DELETE] Backend Error Text:`,
        errorText,
      );
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json(
          { error: errorText || "Backend returned an error" },
          { status: backendResponse.status },
        );
      }
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /subjects/[id] DELETE] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
