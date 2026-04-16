"use client";

import React, { use, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "@/services/task.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';

const C = {
    surface: "#ffffff",
    surfaceContainerLow: "#f1f5eb",
    surfaceContainerLowest: "#ffffff",
    primary: "#41683f",
    primaryContainer: "#c1eeba",
    onPrimary: "#eaffe2",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    outlineVariant: "#adb4a8",
};

const navItems = [
    { id: 'information', label: 'Information', icon: 'info' },
    { id: 'materials', label: 'Materials', icon: 'menu_book' },
    { id: 'sessions', label: 'Sessions', icon: 'calendar_today' },
    { id: 'assessments', label: 'Assessments', icon: 'assignment' },
    { id: 'submit', label: 'Submit Syllabus', icon: 'send', isAction: true },
];

export default function TaskWorkspaceLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: Promise<{ taskId: string }>
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { taskId } = use(params);
    const { user } = useSelector((state: RootState) => state.auth);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const { data: routeTaskData, isLoading, error: apiError } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const displayId = realTask?.taskId || taskId;
    const displayTitle = realTask?.taskName || 'Task Workspace';

    const effectiveError = apiError || (routeTaskData && !realTask ? new Error(routeTaskData.message || "Task not found") : null);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: C.surface }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: C.primary }}></div>
            </div>
        );
    }

    if (effectiveError && !realTask) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.surface }}>
                <div className="text-center p-12 rounded-3xl border max-w-md w-full" style={{ background: C.surfaceContainerLowest, borderColor: `${C.outlineVariant}33` }}>
                    <AlertCircle size={40} className="mx-auto mb-4" style={{ color: '#a73b21' }} />
                    <h2 className="text-xl font-bold mb-2" style={{ color: C.onSurface }}>Task Not Found</h2>
                    <p className="text-sm mb-6" style={{ color: C.onSurfaceVariant }}>The assigned task does not exist or you don&apos;t have access.</p>
                    <button onClick={() => router.push('/dashboard/pdcm')}
                        className="w-full py-3 rounded-xl font-bold text-sm"
                        style={{ background: C.primary, color: C.onPrimary }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const activeTab = navItems.find(n => pathname.includes(`/${n.id}`))?.id || 'information';

    const sidebarItems = navItems.filter(n => !n.isAction).map(n => ({
        ...n,
        isActive: n.id === activeTab,
        onClick: () => router.push(`/dashboard/pdcm/tasks/${displayId}/${n.id}`)
    }));

    const globalHeaderTabs = [
        { id: 'develop', label: 'Develop Syllabus', isActive: true, onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'Peer Review', isActive: false, onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];

    const sidebarSubContent = (
        <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Developing Syllabus</p>
            <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2">
                {displayTitle}
            </p>
        </div>
    );

    return (
        <PDCMBaseLayout
            headerTitle="Task Management"
            headerTabs={globalHeaderTabs}
            sidebarItems={sidebarItems}
            sidebarSubContent={sidebarSubContent}
            onBack={() => router.push('/dashboard/pdcm')}
            actionButton={realTask?.status === 'PENDING_REVIEW' ? undefined : {
                label: 'Submit Syllabus',
                icon: 'send',
                onClick: () => router.push(`/dashboard/pdcm/tasks/${displayId}/submit`)
            }}
        >
            <div className="flex flex-col min-h-screen">
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </div>

            {!pathname.endsWith('/information') && (
                <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="fixed bottom-10 right-10 h-10 pl-3 pr-4 rounded-full flex items-center gap-2 shadow-xl z-50 border-2 transition-all hover:scale-105"
                    style={{ background: '#4caf50', color: '#ffffff', borderColor: 'white' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                    <span className="font-bold text-xs whitespace-nowrap">Syllabus Info</span>
                </button>
            )}
            <SyllabusInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} syllabusId={realTask?.syllabusId} />
        </PDCMBaseLayout>
    );
}
