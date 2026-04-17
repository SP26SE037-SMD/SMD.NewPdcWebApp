"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "@/services/task.service";
import { ReviewTaskService } from "@/services/review-task.service";
import { SyllabusService } from "@/services/syllabus.service";
import { motion, AnimatePresence } from "framer-motion";
import { PDCMBaseLayout } from "@/components/layout/PDCMBaseLayout";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";

/* ─── Color tokens matching reference HTML ─── */
const C = {
    surface: "#ffffff",
    surfaceContainerLow: "#ffffff",
    surfaceContainerLowest: "#ffffff",
    surfaceContainer: "#f4f7f1",
    surfaceContainerHigh: "#e4eade",
    surfaceContainerHighest: "#dee5d8",
    surfaceVariant: "#dee5d8",
    primary: "#41683f",
    primaryContainer: "#c1eeba",
    onPrimary: "#eaffe2",
    onPrimaryContainer: "#345a32",
    secondary: "#536350",
    secondaryContainer: "#d5e8cf",
    onSecondaryContainer: "#465643",
    tertiary: "#60622d",
    tertiaryContainer: "#f9fbb7",
    onTertiaryFixed: "#4c4e1b",
    onTertiaryFixedVariant: "#686b35",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    onBackground: "#2d342b",
    outline: "#767d72",
    outlineVariant: "#adb4a8",
    error: "#a73b21",
    errorContainer: "#fd795a",
};

/* ─── Days-left badge helper ─── */
const DaysLeftBadge = ({ daysLeft }: { daysLeft: number | null }) => {
    if (daysLeft === null) return null;
    if (daysLeft <= 2)
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
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
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
                         status === 'TO_DO' ? 'DRAFT' : 
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
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>edit</span>Edit
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Review Task Card ─── */
const ReviewCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
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
                        {status === 'TO_DO' ? 'PEER REVIEW' : status === 'IN_PROGRESS' ? 'IN REVIEW' : status === 'APPROVED' ? 'APPROVED' : 'REVISION REQ'}
                    </span>
                </div>
                <h3 className="text-lg font-bold mb-1 line-clamp-1" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Review'}</h3>
                <p className="text-xs line-clamp-2" style={{ color: C.onSurfaceVariant }}>{task.description || 'No details provided.'}</p>
            </div>

            {/* Reviewer info — more compact */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0" style={{ background: C.secondaryContainer, color: C.secondary, borderColor: C.surfaceVariant }}>
                    {(task.taskName || 'R').charAt(0).toUpperCase()}
                </div>
                <div className="text-[11px]">
                    <p className="font-bold line-clamp-1" style={{ color: C.onSurface }}>{task.reviewer?.fullName || 'Assigned Reviewer'}</p>
                    <p className="opacity-60 truncate" style={{ color: C.onSurfaceVariant }}>{task.reviewer?.email || 'reviewer@university.edu'}</p>
                </div>
            </div>

            {/* Button pinned to bottom - only show if not completed */}
            {!isCompleted && (
                <div className="mt-auto">
                    {status === 'TO_DO' ? (
                        <button
                            onClick={() => onAccept(task)}
                            disabled={isAccepting === task.taskId}
                            className="btn-pdcm-ghost w-full py-2.5 rounded-lg text-sm"
                        >
                            {isAccepting === task.taskId
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>fact_check</span>Accept &amp; Review</>}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push(`/dashboard/pdcm/reviews/${task.originalReviewId}/information`)}
                            className="btn-pdcm-ghost w-full py-2.5 rounded-lg text-sm"
                        >
                            <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>fact_check</span>Review
                        </button>
                    )}
                </div>
            )}
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
        queryKey: ['pdcm-tasks', user?.accountId, statusTab, page],
        queryFn: async () => {
            const response = await TaskService.getTasks({ 
                accountId: user?.accountId || "", 
                size: 10,
                page: page,
                status: developStatusMapping[statusTab]
            });

            // Enrichment: If tasks are IN_PROGRESS, fetch their syllabus status to allow filtering
            if (response.data?.content) {
                const enrichedContent = await Promise.all(response.data.content.map(async (task: any) => {
                    const status = (task.status || '').trim().toUpperCase().replace(/\s+/g, '_');
                    const hasSyllabus = !!(task.syllabus?.syllabusId || task.syllabus?.syllabusId);
                    
                    if (status === 'IN_PROGRESS' && hasSyllabus && !task.syllabusStatus) {
                        try {
                            const syllabusId = task.syllabus?.syllabusId || task.syllabus?.syllabusId;
                            const sylRes = await SyllabusService.getSyllabusById(syllabusId!);
                            return { ...task, syllabusStatus: sylRes.data?.status || null };
                        } catch (e) {
                            console.error("Failed to enrich task syllabus status:", e);
                            return task;
                        }
                    }
                    return task;
                }));
                // Return a new object to ensure React state updates properly
                return {
                    ...response,
                    data: {
                        ...response.data,
                        content: enrichedContent
                    }
                };
            }
            return response;
        },
        enabled: !!user?.accountId && navTab === 'develop'
    });

    const { data: reviewTasksData, isLoading: isLoadingReviewTasks, error: reviewTasksError, refetch: refetchReviewTasks } = useQuery({
        queryKey: ['pdcm-review-tasks', user?.accountId, statusTab, page],
        queryFn: () => ReviewTaskService.getReviewTasks(
            user?.accountId || "", 
            reviewStatusMapping[statusTab],
            page,
            10
        ),
        enabled: !!user?.accountId && navTab === 'peer-review'
    });

    const isLoading = navTab === 'develop' ? isLoadingTasks : isLoadingReviewTasks;
    const error = navTab === 'develop' ? tasksError : reviewTasksError;

    const handleAcceptTask = async (task: any) => {
        setIsAccepting(task.taskId);
        try {
            if (task.type === 'REVIEW') {
                // Use originalReviewId (reviewId) for the status update API
                await ReviewTaskService.updateReviewTaskStatus(task.originalReviewId, 'IN_PROGRESS');
                await refetchReviewTasks();
                // Navigate using originalReviewId (reviewId)
                router.push(`/dashboard/pdcm/reviews/${task.originalReviewId}/information`);
            } else {
                await TaskService.updateTaskStatus(task.taskId, 'IN_PROGRESS', user?.accountId || "");
                await refetchTasks();
                // Navigate to task details after accepting
                router.push(`/dashboard/pdcm/tasks/${task.taskId}/information`);
            }
        } catch (err) {
            console.error("Failed to accept task:", err);
            // Replace alert with a better UI if possible, but keeping for now as per current pattern
            alert("Failed to accept task. Please try again.");
        } finally {
            setIsAccepting(null);
        }
    };

    const apiTasks = tasksData?.data?.content || [];
    const apiReviewTasks = reviewTasksData?.data?.content || [];

    /* ── Sorting & Overdue Logic ── */
    const isOverdue = (deadlineStr: string | null) => {
        if (!deadlineStr) return false;
        const d = new Date(deadlineStr);
        return d.getTime() < Date.now();
    };

    const sortByDeadlineWithOverdueAtBottom = (a: any, b: any) => {
        const statusA = (a.status || '').toUpperCase().replace(/\s+/g, '_');
        const statusB = (b.status || '').toUpperCase().replace(/\s+/g, '_');
        const overdueA = isOverdue(a.deadline) && statusA !== 'COMPLETED';
        const overdueB = isOverdue(b.deadline) && statusB !== 'COMPLETED';

        if (overdueA && !overdueB) return 1; // A move down
        if (!overdueA && overdueB) return -1; // B move down

        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
    };

    const developTasksFiltered = [...apiTasks]
        .filter(task => {
            const status = (task.status || '').trim().toUpperCase().replace(/\s+/g, '_');
            const sylStatus = (task.syllabusStatus || '').trim().toUpperCase().replace(/\s+/g, '_');
            const isTaskCompleted = status === 'COMPLETED' || status === 'DONE' || status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && sylStatus === 'PENDING_REVIEW');
            
            if (statusTab === 'overdue') return isOverdue(task.deadline) && !isTaskCompleted;
            
            // Special logic: IN_PROGRESS task with PENDING_REVIEW syllabus goes to Completed
            if (statusTab === 'inprogress') {
                const isActuallyInReview = status === 'IN_PROGRESS' && sylStatus === 'PENDING_REVIEW';
                if (isActuallyInReview) return false;
                return status === 'IN_PROGRESS';
            }
            
            if (statusTab === 'completed') {
                return isTaskCompleted;
            }

            // For 'all' tab, exclude completed tasks
            if (statusTab === 'all') {
                return !isTaskCompleted;
            }
            
            return true;
        })
        .sort(sortByDeadlineWithOverdueAtBottom);

    let reviewTasksFiltered = apiReviewTasks
        .map((rt: any) => ({
            taskId: rt.task?.taskId || rt.reviewId, // Use syllabus taskId for URL navigation
            taskName: rt.titleTask,
            description: rt.content,
            deadline: rt.dueDate,
            status: rt.status === 'PENDING' ? 'TO_DO' : rt.status,
            type: 'REVIEW',
            originalReviewId: rt.reviewId, // Keep reviewId for status update API
            reviewKey: rt.reviewId // Unique key for rendering
        }))
        .filter(task => {
            const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
            const isTaskCompleted = ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'].includes(status);

            if (statusTab === 'overdue') return isOverdue(task.deadline) && !isTaskCompleted;
            if (statusTab === 'all') return !isTaskCompleted;
            if (statusTab === 'completed') return isTaskCompleted;

            return true;
        })
        .sort(sortByDeadlineWithOverdueAtBottom);

    // Removed fallback logic - now relying on real API data


    const headerTabs = [
        { id: 'develop', label: 'Develop Syllabus', isActive: navTab === 'develop', onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'Peer Review', isActive: navTab === 'peer-review', onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];

    const statusTabs = [
        { id: 'all', label: 'All Tasks' },
        { id: 'todo', label: 'To Do' },
        { id: 'inprogress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'revision_requested', label: 'Revision Requested' },
        { id: 'overdue', label: 'Overdue' },
    ].filter(tab => {
        if (navTab === 'peer-review' && tab.id === 'revision_requested') return false;
        return true;
    });

    return (
        <PDCMBaseLayout
            headerTitle="Task Management"
            headerTabs={headerTabs}
        >
            <div className="w-full">
                {/* Dashboard Notification Alerts */}
                <DashboardAlerts />

                {/* Page Summary Header */}
                <header className="flex flex-col mb-12 gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Project Workspace
                            </h1>
                        </div>
                    </div>
                    
                    {/* Enhanced Status Tabs with Animated Underline */}
                    <div className="flex items-center gap-8 border-b border-outline-variant/30">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusTab(tab.id as any)}
                                className={`pb-4 text-sm font-bold transition-all relative ${
                                    statusTab === tab.id 
                                        ? 'text-primary' 
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                {tab.label}
                                {statusTab === tab.id && (
                                    <motion.div
                                        layoutId="statusUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin mb-4" size={40} style={{ color: C.primary }} />
                        <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>Loading workspace...</p>
                    </div>
                ) : (error) ? (
                    <div className="text-center py-24 rounded-2xl border border-dashed bg-surface-container-low/50" style={{ borderColor: C.outlineVariant }}>
                        <ShieldCheck size={48} className="mx-auto mb-4" style={{ color: C.outlineVariant }} />
                        <p className="text-lg font-medium" style={{ color: C.onSurfaceVariant }}>No tasks found</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`${navTab}-${statusTab}`} 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {navTab === 'develop' ? (
                                <section className="w-full">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="material-symbols-outlined text-3xl" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>edit_document</span>
                                        <h2 className="text-2xl font-bold" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            Develop Syllabus - {statusTabs.find(t => t.id === statusTab)?.label}
                                        </h2>
                                    </div>
                                    
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                                            {developTasksFiltered.length === 0 ? (
                                                <div className="col-span-full py-24 text-center rounded-2xl border border-dashed bg-surface-container-low/50" style={{ borderColor: C.outlineVariant }}>
                                                    <ShieldCheck size={48} className="mx-auto mb-4" style={{ color: C.outlineVariant }} />
                                                    <p className="text-lg font-medium" style={{ color: C.onSurfaceVariant }}>No tasks found</p>
                                                </div>
                                            ) : (
                                                developTasksFiltered.map(task => (
                                                    <DevelopCard key={task.taskId} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <section className="w-full">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="material-symbols-outlined text-3xl" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                                        <h2 className="text-2xl font-bold" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            Peer Review Pipeline - {statusTabs.find(t => t.id === statusTab)?.label}
                                        </h2>
                                    </div>
                                    
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pb-4">
                                            {reviewTasksFiltered.length === 0 ? (
                                                <div className="col-span-full py-24 text-center rounded-2xl border border-dashed bg-surface-container-low/50" style={{ borderColor: C.outlineVariant }}>
                                                    <ShieldCheck size={48} className="mx-auto mb-4" style={{ color: C.outlineVariant }} />
                                                    <p className="text-lg font-medium" style={{ color: C.onSurfaceVariant }}>No tasks found</p>
                                                </div>
                                            ) : (
                                                reviewTasksFiltered.map(task => (
                                                    <ReviewCard key={task.reviewKey} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Pagination Controls */}
                            {((navTab === 'develop' && (tasksData?.data?.totalPages ?? 0) > 1) || 
                              (navTab === 'peer-review' && (reviewTasksData?.data?.totalPages ?? 0) > 1)) && (
                                <div className="mt-12 flex justify-center items-center gap-4">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        className="btn-pdcm-ghost px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                                        Previous
                                    </button>
                                    <span className="text-sm font-bold opacity-60" style={{ color: C.onSurface }}>
                                        Page {page + 1} of {navTab === 'develop' ? (tasksData?.data?.totalPages || 1) : (reviewTasksData?.data?.totalPages || 1)}
                                    </span>
                                    <button
                                        disabled={page >= (navTab === 'develop' ? (tasksData?.data?.totalPages || 1) - 1 : (reviewTasksData?.data?.totalPages || 1) - 1)}
                                        onClick={() => setPage(p => p + 1)}
                                        className="btn-pdcm-ghost px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                                    >
                                        Next
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </PDCMBaseLayout>
    );
}
