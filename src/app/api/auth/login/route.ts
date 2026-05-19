import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, accountToUser, isSupportedRole, SUPPORTED_ROLES } from '@/lib/auth';
import type { LoginResponse } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Forward the request to the real Backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data: LoginResponse = await backendResponse.json();

        if (!backendResponse.ok || !data.data?.authenticated) {
            return NextResponse.json(
                { error: data.message || 'Invalid credentials' },
                { status: 401 }
            );
        }

        const { token, account } = data.data;
        const user = accountToUser(account);

        // Validate role — only supported roles can access the application
        if (!user.role || !isSupportedRole(user.role)) {
            console.warn(`[API /auth/login] Unsupported role "${user.role}" for user ${user.email}. Access denied.`);
            return NextResponse.json(
                { error: `Your account is not authorized to access this application. Please try again or contact the administrator.` },
                { status: 403 }
            );
        }

        // Build the response
        const response = NextResponse.json({ user });

        // Set HttpOnly cookie for JWT (JavaScript CANNOT read this)
        const cookieStore = await cookies();
        cookieStore.set(AUTH_TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        // Set regular cookie for user info (JavaScript CAN read this for UI)
        cookieStore.set(AUTH_USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error('[API /auth/login] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
