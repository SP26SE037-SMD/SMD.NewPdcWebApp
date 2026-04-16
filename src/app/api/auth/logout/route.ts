import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from '@/lib/auth';

export async function POST() {
    // 1. Lấy ra cái kho Cookie (chỉ dùng được trên Server)
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // 2. Gọi API Backend để invalidate Token (nếu có token)
    if (token) {
        try {
            const baseUrl = process.env.BACKEND_URL || 'http://43.207.156.116';
            const response = await fetch(`${baseUrl}/api/auth/logout?jwt=${token}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend logout failed with status:", response.status, errorText);
            } else {
                console.log("Backend logout success for token:", token.substring(0, 10) + "...");
            }
        } catch (error) {
            console.error("Backend logout network error:", error);
        }
    }

    // 3. Tiêu diệt Cookie HttpOnly (chứa JWT Token thật)
    cookieStore.set(AUTH_TOKEN_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    // 4. Tiêu diệt Cookie thường (chứa thông tin User để hiển thị UI)
    cookieStore.set(AUTH_USER_COOKIE, '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return NextResponse.json({ success: true });
}
