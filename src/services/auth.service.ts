import type { User } from "@/lib/auth";

/**
 * AuthService — Single source of truth for all auth-related API calls.
 * All calls go through Next.js API Routes (BFF pattern), NOT directly to Backend.
 */
export const AuthService = {
    /**
     * Login via BFF route. Next.js server handles cookie setting.
     */
    async login(email: string, password: string): Promise<{ user: User }> {
        // 'api/auth/login' gọi đến api/auth/login/route.ts 
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    },

    /**
     * Logout via BFF route. Next.js server handles cookie clearing.
     */
    async logout(): Promise<void> {
        await fetch('/api/auth/logout', { method: 'POST' });
    },

    /**
     * Get current user profile from BFF route (session recovery on page refresh).
     */
    async getProfile(): Promise<User | null> {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) return null;
            const data = await response.json();
            return data.user;
        } catch {
            return null;
        }
    },

    /**
     * Get the Google OAuth2 Auth URL from BFF.
     */
    getGoogleAuthUrl(): string {
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const options = {
            redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "",
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "openid",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ].join(" "),
        };

        const qs = new URLSearchParams(options);
        return `${rootUrl}?${qs.toString()}`;
    },
};
