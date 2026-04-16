import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, accountToUser } from '@/lib/auth';
import type { LoginResponse } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=No+code+provided', request.url));
    }

    try {
        // Validation: Ensure env vars are loaded
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            console.error('[Google Callback] Missing Environment Variables');
            return NextResponse.redirect(new URL('/login?error=Configuration+error', request.url));
        }

        // 1. Exchange code for Google Tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();
        // console.log(tokens);

        if (!tokenResponse.ok) {
            console.error('[Google Callback] Token Exchange Failed:', tokens);
            return NextResponse.redirect(new URL('/login?error=Google+exchange+failed', request.url));
        }

        // 2. Send Google ID Token to Java Backend to perform "Social Login"
        // Note: Java Backend endpoint must handle verification of this token
        const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login-google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idToken: tokens.id_token
            }),
        });

        const data: LoginResponse = await backendResponse.json();

        if (!backendResponse.ok || !data.data?.authenticated) {
            console.error('[Google Callback] Backend Auth Failed:', data);
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(data.message || 'Backend auth failed')}`, request.url));
        }

        // 3. Success! Set cookies and redirect to dashboard
        const { token, account } = data.data;
        const user = accountToUser(account);
        console.log(user);

        // Map role to correct dashboard path
        const ROLE_PATHS: Record<string, string> = {
            'PDCM': 'pdcm',
            'HoPDC': 'hopdc',
            'HoCFDC': 'hocfdc',
            'VP': 'vice-principal',
            'COLLABORATOR': 'collaborator',
        };
        const dashboardPath = `/dashboard/${ROLE_PATHS[user.role] || 'pdcm'}`;
        console.log(dashboardPath);

        const response = NextResponse.redirect(new URL(dashboardPath, request.url));
        const cookieStore = await cookies();

        // HttpOnly Token Cookie
        cookieStore.set(AUTH_TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        // Regular User Cookie
        cookieStore.set(AUTH_USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return response;

    } catch (error) {
        console.error('[Google Callback] Critical Error:', error);
        return NextResponse.redirect(new URL('/login?error=Internal+server+error', request.url));
    }
}
