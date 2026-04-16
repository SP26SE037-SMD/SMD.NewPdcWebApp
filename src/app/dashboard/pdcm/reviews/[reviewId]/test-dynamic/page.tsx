"use client";

import React, { use } from 'react';

export default function TestDynamicPage({ params }: { params: Promise<{ reviewId: string }> }) {
    const { reviewId } = use(params);

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-surface-container-lowest">
            <h1 className="text-3xl font-black text-primary mb-4">Connection Success (Dynamic)</h1>
            <p className="text-on-surface-variant font-medium text-lg">
                If you see this page, Next.js successfully matched the <code>[reviewId]</code> dynamic route.
            </p>
            <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-sm w-full max-w-xl">
                <p className="font-bold opacity-60 uppercase tracking-widest text-[10px] mb-2">Detected Param</p>
                <div className="flex items-center gap-3">
                    <span className="text-amber-600 font-black font-mono bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">{reviewId}</span>
                </div>
                <p className="mt-4 font-bold opacity-60 uppercase tracking-widest text-[10px] mb-2">Location</p>
                <code className="text-on-surface-variant font-mono text-[11px]">src/app/dashboard/pdcm/reviews/[reviewId]/test-dynamic/page.tsx</code>
            </div>
            
            <div className="mt-6 flex gap-4">
                <a href={`/dashboard/pdcm/reviews/${reviewId}/information`} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    Try Information Page
                </a>
            </div>
        </div>
    );
}
