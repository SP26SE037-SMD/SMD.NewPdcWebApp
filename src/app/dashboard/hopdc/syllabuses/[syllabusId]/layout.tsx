"use client";

import React, { use, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle, ArrowLeft, Info, BookOpen, CalendarDays, ClipboardCheck } from 'lucide-react';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { useQuery } from "@tanstack/react-query";
import { SyllabusService } from "@/services/syllabus.service";
import Link from 'next/link';

const navItems = [
    { id: 'information', label: 'Information', icon: Info },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'sessions', label: 'Sessions', icon: CalendarDays },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
];

export default function SyllabusWorkspaceLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: Promise<{ syllabusId: string }>
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { syllabusId } = use(params);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const { data: routeSyllabusData, isLoading, error: apiError } = useQuery({
        queryKey: ['hopdc-syllabus-detail', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId),
        enabled: !!syllabusId,
    });

    const syllabus = routeSyllabusData?.data;
    const displayTitle = syllabus?.syllabusName || 'Syllabus Details';

    const effectiveError = apiError || (routeSyllabusData && !syllabus ? new Error(routeSyllabusData.message || "Syllabus not found") : null);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d6a4f]"></div>
            </div>
        );
    }

    if (effectiveError && !syllabus) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center p-12 rounded-[24px] bg-white border border-zinc-200/60 max-w-md w-full shadow-sm">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500/80" />
                    <h2 className="text-xl font-bold mb-2 text-zinc-900">Syllabus Not Found</h2>
                    <p className="text-sm mb-8 text-zinc-500">The syllabus does not exist or you don&apos;t have access.</p>
                    <button onClick={() => router.push('/dashboard/hopdc/subjects')}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-[#2d6a4f] text-white hover:bg-[#1d5c42] transition-colors">
                        Return to Subjects
                    </button>
                </div>
            </div>
        );
    }

    const activeTab = navItems.find(n => pathname.includes(`/${n.id}`))?.id || 'information';

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/30">
            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/60">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="py-6 flex flex-col gap-6">
                        {/* Top Bar: Back Button & Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => router.push(`/dashboard/hopdc/subjects/${syllabus?.subjectId || ''}`)}
                                className="flex items-center gap-2 px-3 py-1.5 -ml-3 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors group"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="font-semibold text-sm">Back to Subject</span>
                            </button>

                            <button
                                onClick={() => setIsInfoModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-sm font-semibold transition-all border border-zinc-200/80"
                            >
                                <Info size={16} />
                                Syllabus Info
                            </button>
                        </div>

                        {/* Title area */}
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-2.5 py-1 rounded-md bg-[#2d6a4f]/10 text-[#2d6a4f] text-xs font-bold uppercase tracking-wider">
                                    {syllabus?.subjectCode || 'Syllabus'}
                                </span>
                                {syllabus?.status && (
                                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider">
                                        {syllabus.status.replace(/_/g, ' ')}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                                {displayTitle}
                            </h1>
                        </div>

                        {/* Horizontal Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-transparent">
                            {navItems.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <Link
                                        key={tab.id}
                                        href={`/dashboard/hopdc/syllabuses/${syllabusId}/${tab.id}`}
                                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                                            isActive 
                                                ? "text-[#2d6a4f]" 
                                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-t-lg"
                                        }`}
                                    >
                                        <Icon size={18} className={isActive ? "text-[#2d6a4f]" : "text-zinc-400"} />
                                        {tab.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2d6a4f] rounded-t-full shadow-[0_-2px_8px_rgba(45,106,79,0.4)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>

            <SyllabusInfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)} 
                syllabusId={syllabusId} 
            />
        </div>
    );
}
