import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_USER_COOKIE, AUTH_TOKEN_COOKIE, ROLE_PATHS, introspectToken } from '@/lib/auth';

function getUserFromCookie(request: NextRequest) {
    const userCookie = request.cookies.get(AUTH_USER_COOKIE)?.value;
    if (!userCookie) return null;
    try {
        return JSON.parse(decodeURIComponent(userCookie));
    } catch {
        return null;
    }
}

//Proxy (Middleware) chạy độc lập và chạy TRƯỚC toàn bộ ứng dụng React,
//trước cả khi layout.tsx của app hay AuthProvider kịp khởi động.
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const user = getUserFromCookie(request);
    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

    // 1. Dashboard access check
    if (pathname.startsWith('/dashboard')) {
        // No user or no token -> redirect to login
        if (!user || !token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Token exists -> VALIDATE with backend
        const isValid = await introspectToken(token);
        if (!isValid) {
            console.warn(`[Proxy] Invalid token for ${user.email}. Redirecting to login.`);
            const response = NextResponse.redirect(new URL('/login', request.url));
            
            // Clear invalid session cookies
            response.cookies.delete(AUTH_TOKEN_COOKIE);
            response.cookies.delete(AUTH_USER_COOKIE);
            return response;
        }
    }

    // 2. Already logged in but accessing /login -> redirect to their dashboard
    if (pathname.startsWith('/login') && user && token) {
        // Even for login, we should probably check if token is still valid if we want to skip login
        const isValid = await introspectToken(token);
        if (isValid) {
            const targetPath = ROLE_PATHS[user.role] || '/';
            return NextResponse.redirect(new URL('/dashboard/' + targetPath, request.url));
        }
    }

    // 3. RBAC: Check if user's role matches the dashboard sub-path
    if (pathname.startsWith('/dashboard/') && user) {
        const requiredSegment = pathname.split('/')[2]; // 'pdcm', 'hopdc', etc.

        if (ROLE_PATHS[user.role] !== requiredSegment) {
            return NextResponse.redirect(new URL('/dashboard/' + ROLE_PATHS[user.role], request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
