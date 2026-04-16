import React from "react";
import { ShieldCheck, Layers, Award, Palette } from "lucide-react";

export default function VPSkeleton() {
    return (
        <div className="p-8 space-y-12 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-zinc-200 rounded-lg"></div>
                    <div className="h-4 w-96 bg-zinc-100 rounded-md"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-zinc-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm w-56">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex-shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-3 w-16 bg-zinc-100 rounded"></div>
                            <div className="h-4 w-24 bg-zinc-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priorities Skeleton */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-40 bg-zinc-200 rounded-md"></div>
                    <div className="h-4 w-16 bg-zinc-100 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 rounded-[2rem] border border-zinc-100 bg-white space-y-6 h-48">
                            <div className="flex items-start justify-between">
                                <div className="h-3 w-24 bg-zinc-100 rounded"></div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-5 w-3/4 bg-zinc-200 rounded"></div>
                                <div className="h-4 w-1/2 bg-zinc-100 rounded"></div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-zinc-50">
                                <div className="h-2 w-full bg-zinc-50 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Categories Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="h-6 w-32 bg-zinc-200 rounded-md"></div>
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50">
                                <div className="w-12 h-12 rounded-xl bg-zinc-200 flex-shrink-0"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-4 w-32 bg-zinc-200 rounded"></div>
                                    <div className="h-3 w-20 bg-zinc-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Collaborators Skeleton */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="h-6 w-48 bg-zinc-200 rounded-md"></div>
                        <div className="h-4 w-16 bg-zinc-100 rounded"></div>
                    </div>
                    <div className="bg-white rounded-[3rem] border border-zinc-100 p-8 divide-y divide-zinc-50">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between py-6 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-full bg-zinc-200 flex-shrink-0"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-zinc-200 rounded"></div>
                                        <div className="h-3 w-24 bg-zinc-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="hidden md:flex gap-12">
                                    <div className="h-8 w-16 bg-zinc-100 rounded"></div>
                                    <div className="h-8 w-16 bg-zinc-100 rounded"></div>
                                </div>
                                <div className="h-8 w-24 bg-zinc-100 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
