"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, Loader2, LogIn, AlertCircle, Clock } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loginAction, clearError } from "@/store/slices/authSlice";
import { RootState, AppDispatch } from "@/store";
import { ROLE_PATHS } from "@/lib/auth";
import { AuthService } from "@/services/auth.service";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const { user, error, isLoading } = useSelector((state: RootState) => state.auth);
    const [urlError, setUrlError] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Initial error from URL
    useEffect(() => {
        const errorParam = searchParams.get("error");
        const reasonParam = searchParams.get("reason");

        if (errorParam) {
            setUrlError(decodeURIComponent(errorParam));
        }
        if (reasonParam === 'session_expired') {
            setSessionExpired(true);
        }
        // Clean URL params
        if (errorParam || reasonParam) {
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            url.searchParams.delete("reason");
            window.history.replaceState({}, "", url.toString());
        }
    }, [searchParams]);

    // Redirect if already logged in or after successful login
    useEffect(() => {
        if (user) {
            const targetPath = '/dashboard/' + (ROLE_PATHS[user.role] || '');
            router.push(targetPath);
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setUrlError(null);
        dispatch(clearError());

        // Fire and forget: Redux authSlice tự động catch lỗi và ghi vào state.error
        // Nếu thành công, state.user có dữ liệu, useEffect bên trên sẽ tự bắt được và gọi router.push()
        dispatch(loginAction({ email, password }));
    };

    const handleGoogleLogin = () => {
        window.location.href = AuthService.getGoogleAuthUrl();
    };

    return (
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 p-8 md:p-10 space-y-8">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h1>
                <p className="text-sm font-medium text-zinc-500">Sign in to your account to continue</p>
            </div>

            {sessionExpired && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <Clock className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-xs font-bold text-amber-700 leading-none mb-1">Session Expired</p>
                        <p className="text-xs font-medium text-amber-600 leading-relaxed">
                            Your session has expired. Please sign in again to continue.
                        </p>
                    </div>
                </div>
            )}

            {(urlError || error) && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs font-semibold text-red-600 leading-relaxed">
                        {urlError || error}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@university.edu"
                                required
                                disabled={isLoading}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary/20 cursor-pointer" />
                        <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-700 transition-colors">Remember me</span>
                    </label>
                    <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white rounded-xl py-3.5 font-bold text-sm transition-all hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <LogIn size={18} />
                            Sign In
                        </>
                    )}
                </button>
            </form>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <span className="bg-white px-4">Or continue with</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-zinc-200 text-zinc-700 rounded-xl py-3 font-bold text-sm transition-all hover:bg-zinc-50 active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Google
            </button>
        </div>
    );
}
