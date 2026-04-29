"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';
import { Loader2 } from 'lucide-react';
import { TaskService, TASK_STATUS } from '@/services/task.service';
import { SyllabusService } from '@/services/syllabus.service';
import { RootState } from '@/store';

/* ─── Modern Design Tokens ─── */
const C = {
    primary: '#2d342b',
    secondary: '#4d5149',
    surface: '#f9fbf8',
    surfaceVariant: '#e1e4dc',
    onSurface: '#191c18',
    onSurfaceVariant: '#43493f',
    outline: '#74796e',
    error: '#ba1a1a',
    primaryContainer: '#d3e8d0',
    onPrimaryContainer: '#0d1f11',
    secondaryContainer: '#dfe4d8',
    onSecondaryContainer: '#111d13',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f5ee',
    surfaceContainer: '#edf1e8',
    surfaceContainerHigh: '#e7ebe3',
};

/* ─── Shared Components ─── */
const DaysLeftBadge = ({ daysLeft }: { daysLeft: number | null }) => {
    if (daysLeft === null) return null;
    if (daysLeft <= 3)
        return (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: C.error, background: `${C.error}18` }}>
                {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft} DAYS LEFT`}
            </span>
        );
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: C.onSurfaceVariant, background: C.surfaceVariant }}>
            {daysLeft} DAYS LEFT
        </span>
    );
};

/* ─── Develop Task Card ─── */
const DevelopCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');

    const effectiveSyllabusId = task.syllabus?.syllabusId || task.syllabus?.syllabusId;

    // Fetch syllabus details if task is In Progress to check its specific status
    const syllabusStatusFromTask = (task.syllabusStatus || '').trim().toUpperCase().replace(/\s+/g, '_');
    
    // Fetch syllabus details if not provided by parent to check its specific status
    const { data: syllabusRes } = useQuery({
        queryKey: ['syllabus', effectiveSyllabusId],
        queryFn: () => SyllabusService.getSyllabusById(effectiveSyllabusId!),
        enabled: !!effectiveSyllabusId && status === 'IN_PROGRESS' && !task.syllabusStatus
    });

    const syllabusStatus = syllabusStatusFromTask || (syllabusRes?.data?.status || '').trim().toUpperCase().replace(/\s+/g, '_');

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl hover:scale-[1.01] transition-all flex flex-col h-full"
            style={{ background: C.surfaceContainerLowest, boxShadow: '0 8px 32px rgba(45,52,43,0.06)' }}
        >
            <div className="mb-2 h-5 flex items-center">
                <DaysLeftBadge daysLeft={daysLeft} />
            </div>

            <div className="flex flex-col grow mb-4">
                <div className="mb-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {syllabusStatus === 'PENDING_REVIEW' ? 'PENDING REVIEW' : 
                         status === 'TO_DO' ? 'TO DO' : 
                         status === 'IN_PROGRESS' ? 'IN PROGRESS' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : 'DONE'}
                    </span>
                </div>
                <h3 className="text-lg font-bold mb-1 line-clamp-1" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Task'}</h3>
                <p className="text-xs line-clamp-2" style={{ color: C.onSurfaceVariant }}>{task.description || 'No description provided.'}</p>
            </div>

            <div className="mt-auto flex justify-end">
                {status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm"
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>edit</span>Accept</>}
                    </button>
                ) : (status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && syllabusStatus === 'PENDING_REVIEW')) ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold" style={{ color: C.onSurfaceVariant, background: C.surfaceVariant }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hourglass_top</span>
                        Pending Review
                    </span>
                ) : (
                    <button
                        onClick={() => {
                            const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                            router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                        }}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>task</span>Do Task
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Review Task Card ─── */
const ReviewCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
    const isCompleted = ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'].includes(status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl hover:scale-[1.01] transition-all flex flex-col h-full"
            style={{ background: C.surfaceContainerLowest, boxShadow: '0 8px 32px rgba(45,52,43,0.06)' }}
        >
            {!isCompleted && (
                <div className="mb-2 h-5 flex items-center">
                    <DaysLeftBadge daysLeft={daysLeft} />
                </div>
            )}

            <div className={`flex flex-col grow mb-4 ${isCompleted ? 'pt-5' : ''}`}>
                <div className="mb-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {status === 'PENDING' ? 'PEER REVIEW' : 
                         status === 'IN_PROGRESS' ? 'IN REVIEW' : 
                         status === 'APPROVED' ? 'APPROVED' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : status}
                    </span>
                </div>
                <h3 className="text-lg font-bold mb-1 line-clamp-1" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Review'}</h3>
                <p className="text-xs line-clamp-2" style={{ color: C.onSurfaceVariant }}>{task.description || 'No details provided.'}</p>
            </div>

            {/* Reviewer info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0" style={{ background: C.secondaryContainer, color: C.secondary, borderColor: C.surfaceVariant }}>
                    {(task.taskName || 'R').charAt(0).toUpperCase()}
                </div>
                <div className="text-[11px]">
                    <p className="font-bold line-clamp-1" style={{ color: C.onSurface }}>{task.reviewer?.fullName || 'Assigned Reviewer'}</p>
                    <p className="opacity-60 truncate" style={{ color: C.onSurfaceVariant }}>{task.reviewer?.email || 'reviewer@university.edu'}</p>
                </div>
            </div>

            {/* Button pinned to bottom */}
            <div className="mt-auto">
                {status === 'PENDING' || status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost w-full py-2.5 rounded-lg text-sm"
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>fact_check</span>Accept &amp; Review</>}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="btn-pdcm-ghost w-full py-2.5 rounded-lg text-sm"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>visibility</span>View Result
                    </button>
                ) : (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="btn-pdcm-ghost w-full py-2.5 rounded-lg text-sm"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>rate_review</span>Review Now
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Sidebar Nav Item ─── */
const NavItem = ({ icon, label, active }: { icon: string; label: string; active?: boolean }) => (
    <a
        href="#"
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
        style={active
            ? { background: '#ffffff', color: C.primary, fontWeight: 600, boxShadow: '0 1px 4px rgba(45,52,43,0.08)' }
            : { color: `${C.onSurface}b3`, fontWeight: 500 }
        }
    >
        <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
        {label}
    </a>
);

/* ─── Main Component ─── */
export default function PDCMDashboardContent({ defaultTab = 'develop' }: { defaultTab?: 'develop' | 'peer-review' }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useSelector((state: RootState) => state.auth);

    const navTab = defaultTab;
    const [statusTab, setStatusTab] = useState<'all' | 'todo' | 'inprogress' | 'completed' | 'overdue' | 'revision_requested'>('all');
    const [page, setPage] = useState(0);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);

    // Reset page and handle tab visibility when navTab changes
    React.useEffect(() => {
        setPage(0);
        // If switching to peer-review while on 'revision_requested', reset to 'all'
        if (navTab === 'peer-review' && statusTab === 'revision_requested') {
            setStatusTab('all');
        }
    }, [navTab, statusTab]);

    const developStatusMapping: Record<string, string | string[] | undefined> = {
        all: undefined,
        todo: 'TO_DO',
        inprogress: 'IN_PROGRESS',
        completed: ['COMPLETED', 'PENDING_REVIEW', 'IN_PROGRESS'],
        overdue: undefined,
        revision_requested: 'REVISION_REQUESTED'
    };

    const reviewStatusMapping: Record<string, string | string[] | undefined> = {
        all: undefined,
        todo: 'PENDING',
        inprogress: 'IN_PROGRESS',
        completed: ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'],
        overdue: undefined,
    };

    const { data: tasksData, isLoading: isLoadingTasks, error: tasksError, refetch: refetchTasks } = useQuery({
        queryKey: ['pdcm-tasks', user?.accountId, statusTab, page, navTab],
        queryFn: async () => {
            const params = { 
                accountId: user?.accountId || "", 
                size: 10,
                page: page,
                status: navTab === 'develop' ? developStatusMapping[statusTab] : reviewStatusMapping[statusTab],
                type: navTab === 'develop' ? 'SYLLABUS_DEVELOP' : 'PEER_REVIEW'
            };
            return await TaskService.getTasks(params as any);
        },
        enabled: !!user?.accountId,
    });

    const acceptTaskMutation = useMutation({
        mutationFn: (taskId: string) => TaskService.updateTaskStatus(taskId, TASK_STATUS.IN_PROGRESS),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdcm-tasks'] });
            setIsAccepting(null);
        },
        onError: () => setIsAccepting(null)
    });

    const handleAcceptTask = (task: any) => {
        setIsAccepting(task.taskId);
        acceptTaskMutation.mutate(task.taskId);
    };

    const tasks = tasksData?.data?.content || [];
    const totalPages = tasksData?.data?.totalPages || 0;

    const globalHeaderTabs: any[] = [];

    const sidebarItems = [
        { id: 'tasks', label: 'My Tasks', icon: 'task', isActive: true, onClick: () => router.push('/dashboard/pdcm/develop') },
    ];

    return (
        <PDCMBaseLayout
            activeSidebarId={navTab === 'develop' ? 'tasks' : 'reviews'}
            headerTabs={globalHeaderTabs}
            sidebarItems={sidebarItems}
        >
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <header className="mb-10">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.onSurface }}>
                                {navTab === 'develop' ? 'Development Pipeline' : 'Peer Review Queue'}
                            </h2>
                            <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
                                {navTab === 'develop' ? 'Manage your syllabus development tasks and deadlines.' : 'Evaluate and provide feedback on your peers\' work.'}
                            </p>
                        </div>
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: C.surfaceContainerHigh }}>
                            <button 
                                onClick={() => router.push('/dashboard/pdcm/develop')}
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${navTab === 'develop' ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                                style={navTab === 'develop' ? { color: C.primary } : {}}
                            >
                                Develop
                            </button>
                            <button 
                                onClick={() => router.push('/dashboard/pdcm/peer-review')}
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${navTab === 'peer-review' ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                                style={navTab === 'peer-review' ? { color: C.primary } : {}}
                            >
                                Review
                            </button>
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'all', label: 'All Tasks', icon: 'apps' },
                        { id: 'todo', label: 'To Do', icon: 'list_alt' },
                        { id: 'inprogress', label: 'In Progress', icon: 'pending' },
                        { id: 'completed', label: 'Completed', icon: 'task_alt' },
                        ...(navTab === 'develop' ? [{ id: 'revision_requested', label: 'Revisions', icon: 'history_edu' }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusTab(tab.id as any)}
                            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                            style={statusTab === tab.id
                                ? { background: C.primary, color: 'white', boxShadow: '0 4px 12px rgba(45,52,43,0.2)' }
                                : { background: C.surfaceContainerHigh, color: C.onSurfaceVariant }
                            }
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {isLoadingTasks ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="text-sm font-bold uppercase tracking-widest">Loading tasks...</p>
                    </div>
                ) : tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        <AnimatePresence mode="popLayout">
                            {tasks.map((task: any) => (
                                navTab === 'develop' 
                                    ? <DevelopCard key={task.taskId} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                                    : <ReviewCard key={task.reviewId || task.taskId} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: C.outline + '20', background: C.surfaceContainerLowest }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.surfaceContainer }}>
                            <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>task</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: C.onSurface }}>No tasks available</h3>
                        <p className="text-sm" style={{ color: C.onSurfaceVariant }}>You're all caught up! Check back later.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 mb-12">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white shadow-sm border border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 hover:shadow"
                        >
                            <span className="material-symbols-outlined text-zinc-600">chevron_left</span>
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${page === i ? 'bg-primary text-white shadow-md' : 'bg-white border text-zinc-600 border-zinc-100 hover:bg-zinc-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white shadow-sm border border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 hover:shadow"
                        >
                            <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </PDCMBaseLayout>
    );
}