"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';
import { Loader2 } from 'lucide-react';
import { TaskService, TASK_STATUS } from '@/services/task.service';
import { ReviewTaskService } from '@/services/review-task.service';
import { SyllabusService } from '@/services/syllabus.service';
import { RootState } from '@/store';

/* ─── Modern Design Tokens ─── */
const C = {
    primary: '#409b43',
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
    
    const { data: syllabusRes } = useQuery({
        queryKey: ['syllabus', effectiveSyllabusId],
        queryFn: () => SyllabusService.getSyllabusById(effectiveSyllabusId!),
        enabled: !!effectiveSyllabusId && status === 'IN_PROGRESS' && !task.syllabusStatus
    });

    const syllabusStatus = syllabusStatusFromTask || (syllabusRes?.data?.status || '').trim().toUpperCase().replace(/\s+/g, '_');

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group px-6 py-5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-zinc-50/50"
            
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={
                status === 'TO_DO' ? { background: '#fef3c7', color: '#b45309' } :
                status === 'IN_PROGRESS' ? { background: '#e0f2fe', color: '#0369a1' } :
                syllabusStatus === 'PENDING_REVIEW' ? { background: '#f3e8ff', color: '#0369a1' } :
                status === 'REVISION_REQUESTED' ? { background: '#ffe4e6', color: '#b91c1c' } :
                { background: '#dcfce7', color: '#15803d' }
            }>
                <span className="material-symbols-outlined text-2xl">
                    {status === 'TO_DO' ? 'list_alt' :
                     status === 'IN_PROGRESS' ? 'edit_document' :
                     syllabusStatus === 'PENDING_REVIEW' ? 'hourglass_top' :
                     status === 'REVISION_REQUESTED' ? 'history_edu' :
                     // DONE
                     'task_alt'}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold truncate pr-4" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Task'}</h3>
                </div>
                <p className="text-sm truncate" style={{ color: C.onSurfaceVariant }}>{task.description || 'No description provided.'}</p>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-48 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {syllabusStatus === 'PENDING_REVIEW' ? 'PENDING REVIEW' : 
                         status === 'TO_DO' ? 'TO DO' : 
                         status === 'IN_PROGRESS' ? 'IN PROGRESS' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : 'DONE'}
                    </span>
                    <DaysLeftBadge daysLeft={daysLeft} />
                </div>
            </div>

            <div className="flex items-center justify-end w-full md:w-36 shrink-0 mt-4 md:mt-0">
                {status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: `1px solid ${C.outline}30` }}
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={16} className="animate-spin" />
                            : <><span className="material-symbols-outlined text-[18px]">edit</span>Accept</>}
                    </button>
                ) : (status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && syllabusStatus === 'PENDING_REVIEW')) ? (
                    <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold w-full md:w-auto" style={{ color: C.onSurfaceVariant, background: '#f5f5f5' }}>
                        <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                        Pending Review
                    </span>
                ) : (
                    <button
                        onClick={() => {
                            const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                            router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white w-full md:w-auto flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
                        style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}40` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>Do Task
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group px-6 py-5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-zinc-50/50"
            
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={
                status === 'PENDING' ? { background: '#fef3c7', color: '#b45309' } :
                status === 'IN_PROGRESS' ? { background: '#e0f2fe', color: '#0369a1' } :
                status === 'REVISION_REQUESTED' ? { background: '#ffe4e6', color: '#b91c1c' } :
                isCompleted ? { background: '#dcfce7', color: '#15803d' } :
                { background: C.secondaryContainer, color: C.secondary }
            }>
                <span className="material-symbols-outlined text-2xl">
                    {status === 'PENDING' ? 'pending_actions' :
                     status === 'IN_PROGRESS' ? 'rate_review' :
                     status === 'REVISION_REQUESTED' ? 'feedback' :
                     isCompleted ? 'verified' :
                     'rate_review'}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold truncate pr-4" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Review'}</h3>
                </div>
                <p className="text-sm truncate" style={{ color: C.onSurfaceVariant }}>{task.description || 'No details provided.'}</p>
                
                {/* Reviewer info */}
                <div className="flex items-center gap-2 mt-2 bg-zinc-50 px-3 py-1.5 rounded-lg w-max max-w-full">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 bg-white" style={{ color: C.onSurface, borderColor: C.surfaceVariant }}>
                        {(task.taskName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs flex gap-1 items-center truncate">
                        <span className="font-semibold" style={{ color: C.onSurface }}>{task.reviewer?.fullName || 'Assigned Reviewer'}</span>
                        <span className="text-zinc-400">&bull;</span>
                        <span className="text-zinc-500 truncate">{task.reviewer?.email || 'reviewer@university.edu'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-48 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {status === 'PENDING' ? 'PEER REVIEW' : 
                         status === 'IN_PROGRESS' ? 'IN REVIEW' : 
                         status === 'APPROVED' ? 'APPROVED' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : status}
                    </span>
                    {!isCompleted && <DaysLeftBadge daysLeft={daysLeft} />}
                </div>
            </div>

            <div className="flex items-center justify-end w-full md:w-40 shrink-0 mt-4 md:mt-0">
                {status === 'PENDING' || status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: `1px solid ${C.outline}30` }}
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={16} className="animate-spin" />
                            : <><span className="material-symbols-outlined text-[18px]">fact_check</span>Accept</>}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: `1px solid ${C.outline}30` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>Result
                    </button>
                ) : (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white w-full md:w-auto flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
                        style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}40` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>Review
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
        completed: 'DONE',
        overdue: undefined,
        revision_requested: undefined
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
            if (navTab === 'develop') {
                return await TaskService.getTasksV2({
                    assignTo: user?.accountId,
                    action: statusTab === 'all' ? ['CREATE', 'UPDATE'] : statusTab === 'revision_requested' ? 'UPDATE' : 'CREATE',
                    type: 'SYLLABUS',
                    status: developStatusMapping[statusTab],
                    page: page,
                    size: 10
                });
            } else {
                return await ReviewTaskService.getReviewTasks(user?.accountId || "", params.status as string | string[], params.page, params.size);
            }
        },
        enabled: !!user?.accountId,
    });

    const acceptTaskMutation = useMutation({
        mutationFn: (task: any) => {
            if (navTab === 'develop') {
                return TaskService.updateTaskStatus(task.taskId, TASK_STATUS.IN_PROGRESS);
            } else {
                return ReviewTaskService.updateReviewTaskAcceptance(task.reviewId || task.taskId, true);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdcm-tasks'] });
            setIsAccepting(null);
        },
        onError: () => setIsAccepting(null)
    });

    const handleAcceptTask = (task: any) => {
        setIsAccepting(task.taskId);
        acceptTaskMutation.mutate(task);
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
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.onSurface }}>
                                {navTab === 'develop' ? 'Development Task' : 'Review Task'}
                            </h2>
                            <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
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
                                ? { background: C.primary, color: 'white', boxShadow: '0 4px 12px rgba(64,155,67,0.25)' }
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
                    <div className="flex flex-col mb-12 bg-white rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-200">
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