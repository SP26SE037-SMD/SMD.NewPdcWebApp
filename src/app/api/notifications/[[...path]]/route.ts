import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

/**
 * Catch-all BFF proxy for /api/notifications/*
 * Forwards GET, POST, PUT, DELETE to the backend with auth token.
 */

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // Build backend URL
    const subPath = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendPath = `/api/notifications${subPath ? `/${subPath}` : ''}${queryString ? `?${queryString}` : ''}`;
    const targetUrl = `${BACKEND_URL}${backendPath}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: '*/*',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Attach body for non-GET methods
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON — proceed without body
      }
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);
    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API /notifications] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}
