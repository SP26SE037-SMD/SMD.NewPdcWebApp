import LoginForm from "@/components/login-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | SMD",
    description: "Secure login to the Syllabus Management & Digitalization Portal.",
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-12">
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors group text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>

                <p className="mt-8 text-center text-xs text-zinc-400">
                    © 2026 SMD Project Team · FPT University Capstone Implementation
                </p>
            </div>
        </div>
    );
}
