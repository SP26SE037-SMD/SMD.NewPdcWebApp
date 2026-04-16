"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "@/services/notification.service";
import { NotificationData } from "@/types/notification";
import { TaskService } from "@/services/task.service";
import { ReviewTaskService } from "@/services/review-task.service";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Clock,
    ChevronRight,
    X,
    Bell,
    FileEdit,
    Eye,
    CalendarClock,
    Loader2,
    CheckCircle2,
    Info,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ─── Color tokens ─── */
const C = {
    primary: "#4caf50",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    surfaceVariant: "#dee5d8",
    surfaceContainer: "#f4f7f1",
    surfaceContainerHigh: "#e4eade",
    error: "#a73b21",
    errorContainer: "#ffdad2",
    warning: "#8a6b00",
    warningContainer: "#ffeea4",
};

/* ─── Helpers ─── */
const calcDaysLeft = (dateStr: string) => {
    if (!dateStr) return Infinity;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
};
const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

/* ─── Notification Icon by type ─── */
const NotifIcon = ({ type, isRead }: { type: string; isRead: boolean }) => {
    const t = (type || "").toUpperCase();
    const baseClass = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative";

    if (t === "TASK" || t === "SYLLABUS_DEVELOP") {
        return (
            <div className={baseClass} style={{ background: `${C.primaryContainer}60`, color: C.onPrimaryContainer }}>
                <FileEdit size={18} />
                {!isRead && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: C.primary }} />}
            </div>
        );
    }
    if (t === "REVIEW" || t === "SYLLABUS_REVIEW") {
        return (
            <div className={baseClass} style={{ background: "#e8dcf450", color: "#6a3ea1" }}>
                <Eye size={18} />
                {!isRead && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#6a3ea1" }} />}
            </div>
        );
    }
    return (
        <div className={baseClass} style={{ background: `${C.surfaceVariant}80`, color: C.onSurfaceVariant }}>
            <Info size={18} />
            {!isRead && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: C.primary }} />}
        </div>
    );
};

/* ════════════════════════════════════════
   Confirmation Sub-Modal
   ════════════════════════════════════════ */
const ConfirmAcceptModal = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    taskName,
    type,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    taskName: string;
    type: "task" | "review";
}) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div key="confirm-bg" 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1001]" 
                    style={{ background: "rgba(45,47,44,0.3)", backdropFilter: "blur(12px)" }}
                    onClick={onClose} />
                <motion.div key="confirm-modal"
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="fixed inset-0 z-[1002] flex items-center justify-center p-6 pointer-events-none">
                    <div className="w-full max-w-[400px] rounded-[32px] overflow-hidden pointer-events-auto bg-white shadow-[0_32px_80px_rgba(65,104,63,0.28)] border border-[#4caf50]/10">
                        {/* Header with Icon */}
                        <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-[#f8faf7] to-white">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-[#4caf50]/20 rounded-[28px] blur-xl animate-pulse" />
                                <div className="relative w-20 h-20 rounded-[28px] flex items-center justify-center bg-gradient-to-br from-[#4caf50] to-[#2e7d32] text-white shadow-lg shadow-[#4caf50]/30 transform -rotate-3">
                                    <CheckCircle2 size={40} className="transform rotate-3" />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black mb-3 text-[#1a1f18]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif", letterSpacing: "-0.02em" }}>
                                {type === "task" ? "Accept New Task?" : "Accept Review?"}
                            </h3>
                            
                            <p className="text-base text-[#5a6157] leading-relaxed px-4">
                                Would you like to start working on this? This will update the status to <span className="font-extrabold text-[#4caf50]">In Progress</span>.
                            </p>
                        </div>

                        {/* Entity Details Card */}
                        <div className="px-8 py-3">
                            <div className="bg-[#f4f7f1]/60 rounded-2xl p-4 border border-[#4caf50]/10 text-center">
                                <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#8a9186] mb-1.5">Project Assignment</p>
                                <p className="text-[15px] font-bold text-[#2d342b] leading-tight">{taskName}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-8 pb-10 pt-6 flex flex-col gap-3">
                            <button 
                                onClick={onConfirm} 
                                disabled={isLoading}
                                className="w-full py-4.5 rounded-2xl text-[16px] font-black tracking-wide transition-all bg-[#4caf50] text-white hover:brightness-105 active:scale-[0.97] flex items-center justify-center gap-3 shadow-[0_12px_24px_rgba(76,175,80,0.3)] disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {isLoading ? "Accepting..." : "Yes, start now"}
                            </button>
                            
                            <button 
                                onClick={onClose} 
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-2xl text-[14px] font-bold transition-all text-[#5a6157] hover:bg-[#f4f7f1] active:scale-[0.98] disabled:opacity-50"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

/* ════════════════════════════════════════
   Main DashboardAlerts Modal
   ════════════════════════════════════════ */
export default function DashboardAlerts() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useSelector((state: RootState) => state.auth);
    const [isOpen, setIsOpen] = useState(false);

    // Confirmation sub-modal state
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        type: "task" | "review";
        id: string;
        name: string;
        loading: boolean;
    }>({ open: false, type: "task", id: "", name: "", loading: false });

    // Loading state for "View" buttons (fetching detail before redirect)
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    // Fetch notifications
    const { data: notifData, isLoading: isLoadingNotifs, refetch: refetchNotifs } = useQuery({
        queryKey: ["dashboard-alerts-notifs", user?.accountId],
        queryFn: () => NotificationService.getMyNotifications(0, 20, false),
        enabled: !!user?.accountId,
        staleTime: 15_000,
    });

    // Also fetch tasks TO_DO + reviews PENDING for the action items
    const { data: todoTasksData, isLoading: isLoadingTodo } = useQuery({
        queryKey: ["dashboard-alerts-todo", user?.accountId],
        queryFn: () => TaskService.getTasks({ accountId: user?.accountId || "", status: "TO_DO", size: 50 }),
        enabled: !!user?.accountId,
        staleTime: 30_000,
    });

    const { data: pendingReviewsData, isLoading: isLoadingPendingReviews } = useQuery({
        queryKey: ["dashboard-alerts-pending-reviews", user?.accountId],
        queryFn: () => ReviewTaskService.getReviewTasks(user?.accountId || "", "PENDING", 0, 50),
        enabled: !!user?.accountId,
        staleTime: 30_000,
    });

    // Urgent items (due ≤ 3 days)
    const { data: inProgressTasksData } = useQuery({
        queryKey: ["dashboard-alerts-inprogress", user?.accountId],
        queryFn: () => TaskService.getTasks({ accountId: user?.accountId || "", status: "IN_PROGRESS", size: 50 }),
        enabled: !!user?.accountId,
        staleTime: 30_000,
    });

    const { data: inProgressReviewsData } = useQuery({
        queryKey: ["dashboard-alerts-inprogress-reviews", user?.accountId],
        queryFn: () => ReviewTaskService.getReviewTasks(user?.accountId || "", "IN_PROGRESS", 0, 50),
        enabled: !!user?.accountId,
        staleTime: 30_000,
    });

    const isLoading = isLoadingNotifs || isLoadingTodo || isLoadingPendingReviews;

    const notifications: NotificationData[] = notifData?.data?.content || [];
    const todoTasks = todoTasksData?.data?.content || [];
    const pendingReviews = pendingReviewsData?.data?.content || [];
    const inProgressTasks = inProgressTasksData?.data?.content || [];
    const inProgressReviews = inProgressReviewsData?.data?.content || [];

    // Urgent calculations
    const THREE_DAYS_MS = 3 * 86400000;
    const now = Date.now();
    const urgentTasks = inProgressTasks.filter((t: any) => {
        if (!t.deadline) return false;
        const diff = new Date(t.deadline).getTime() - now;
        return diff > 0 && diff <= THREE_DAYS_MS;
    });
    const urgentReviews = inProgressReviews.filter((r: any) => {
        if (!r.dueDate) return false;
        const diff = new Date(r.dueDate).getTime() - now;
        return diff > 0 && diff <= THREE_DAYS_MS;
    });

    const totalItems = todoTasks.length + pendingReviews.length + urgentTasks.length + urgentReviews.length + notifications.length;

    // Auto-open when data ready and there are items (ONLY ONCE PER SESSION)
    useEffect(() => {
        const hasNotified = sessionStorage.getItem('pdcm_dashboard_notified');
        if (!hasNotified && !isLoading && totalItems > 0) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem('pdcm_dashboard_notified', 'true');
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [isLoading, totalItems]);

    /* ── Action: View Task (fetch detail then redirect) ── */
    const handleViewTask = useCallback(async (taskId: string) => {
        setLoadingItemId(taskId);
        try {
            const res = await TaskService.getTaskById(taskId);
            const task = res?.data;
            if (task) {
                const status = (task.status || "").toUpperCase().replace(/\s+/g, "_");
                const basePath = status === "REVISION_REQUESTED" ? "revisions" : "tasks";
                setIsOpen(false);
                router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
            }
        } catch (err) {
            console.error("Failed to fetch task:", err);
            setIsOpen(false);
            router.push(`/dashboard/pdcm/tasks/${taskId}/information`);
        } finally {
            setLoadingItemId(null);
        }
    }, [router]);

    /* ── Action: View Review Task (fetch detail then redirect) ── */
    const handleViewReview = useCallback(async (reviewId: string) => {
        setLoadingItemId(reviewId);
        try {
            const res = await ReviewTaskService.getReviewTaskById(reviewId);
            const review = res?.data;
            if (review) {
                setIsOpen(false);
                router.push(`/dashboard/pdcm/reviews/${review.reviewId}/information`);
            }
        } catch (err) {
            console.error("Failed to fetch review:", err);
            setIsOpen(false);
            router.push(`/dashboard/pdcm/reviews/${reviewId}/information`);
        } finally {
            setLoadingItemId(null);
        }
    }, [router]);

    /* ── Action: Accept Task (TO_DO → IN_PROGRESS) ── */
    const handleAcceptTask = useCallback(async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
            await TaskService.updateTaskStatus(confirmState.id, "IN_PROGRESS", user?.accountId || "");
            // Refetch queries
            queryClient.invalidateQueries({ queryKey: ["dashboard-alerts-todo"] });
            queryClient.invalidateQueries({ queryKey: ["pdcm-tasks"] });
            setConfirmState(prev => ({ ...prev, open: false, loading: false }));
            // Navigate to the task
            setIsOpen(false);
            router.push(`/dashboard/pdcm/tasks/${confirmState.id}/information`);
        } catch (err) {
            console.error("Failed to accept task:", err);
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }, [confirmState.id, user?.accountId, queryClient, router]);

    /* ── Action: Accept Review (PENDING → IN_PROGRESS) ── */
    const handleAcceptReview = useCallback(async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
            await ReviewTaskService.updateReviewTaskStatus(confirmState.id, "IN_PROGRESS");
            queryClient.invalidateQueries({ queryKey: ["dashboard-alerts-pending-reviews"] });
            queryClient.invalidateQueries({ queryKey: ["pdcm-review-tasks"] });
            setConfirmState(prev => ({ ...prev, open: false, loading: false }));
            setIsOpen(false);
            router.push(`/dashboard/pdcm/reviews/${confirmState.id}/information`);
        } catch (err) {
            console.error("Failed to accept review:", err);
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }, [confirmState.id, queryClient, router]);

    /* ── Handle notification click based on taskId / reviewId ── */
    const handleNotifClick = useCallback(async (notif: NotificationData) => {
        // Mark as read
        try { await NotificationService.markAsRead(notif.notificationId); } catch { }
        refetchNotifs();

        // Direct taskId / reviewId from API
        if (notif.taskId) {
            await handleViewTask(notif.taskId);
        } else if (notif.reviewId) {
            await handleViewReview(notif.reviewId);
        } else if (notif.relatedEntityId) {
            // Fallback to relatedEntityId
            const entityType = (notif.relatedEntityType || notif.type || "").toUpperCase();
            if (entityType.includes("REVIEW")) {
                await handleViewReview(notif.relatedEntityId);
            } else {
                await handleViewTask(notif.relatedEntityId);
            }
        }
    }, [handleViewTask, handleViewReview, refetchNotifs]);

    if (totalItems === 0 && !isLoading) return null;

    return (
        <>
            {/* ═══ Confirmation Sub-Modal ═══ */}
            <ConfirmAcceptModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
                onConfirm={confirmState.type === "task" ? handleAcceptTask : handleAcceptReview}
                isLoading={confirmState.loading}
                taskName={confirmState.name}
                type={confirmState.type}
            />

            {/* ═══ Main Modal ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[998]"
                            style={{ background: "rgba(45,52,43,0.3)", backdropFilter: "blur(6px)" }}
                            onClick={() => setIsOpen(false)} />

                        {/* Modal */}
                        <motion.div key="modal"
                            initial={{ opacity: 0, scale: 0.96, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 24 }}
                            transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
                            className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
                            <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl overflow-hidden pointer-events-auto"
                                style={{ background: "#fff", boxShadow: "0 24px 80px rgba(45,52,43,0.18), 0 0 0 1px rgba(45,52,43,0.04)" }}>

                                {/* ── Header ── */}
                                <div className="flex items-center justify-between px-6 py-5 shrink-0"
                                    style={{ background: `linear-gradient(145deg, ${C.primaryContainer}28, #ffffff)`, borderBottom: `1px solid ${C.surfaceVariant}` }}>
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                                            style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
                                            <Bell size={24} />
                                            {totalItems > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                                                    style={{ background: C.error }}>
                                                    {totalItems > 99 ? "99+" : totalItems}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold tracking-tight"
                                                style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                                Notifications
                                            </h2>
                                            <p className="text-xs font-medium"
                                                style={{ color: totalItems > 0 ? C.primary : C.onSurfaceVariant }}>
                                                {totalItems > 0
                                                    ? `${totalItems} item${totalItems > 1 ? "s" : ""} need your attention`
                                                    : "ALL CAUGHT UP!"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsOpen(false)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                        style={{ color: C.onSurfaceVariant, background: C.surfaceContainerHigh }}>
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* ── Content ── */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#fafcf8" }}>

                                    {/* === Section: Tasks Awaiting Confirmation === */}
                                    {todoTasks.length > 0 && (
                                        <div>
                                            <div className="px-5 pt-4 pb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>
                                                    Tasks Awaiting Confirmation
                                                </span>
                                            </div>
                                            {todoTasks.map((task: any, i: number) => (
                                                <motion.div key={task.taskId}
                                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-3 px-5 py-3.5 transition-colors group"
                                                    style={{ borderBottom: `1px solid ${C.surfaceVariant}40` }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = `${C.surfaceContainerHigh}80`)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                    <NotifIcon type="TASK" isRead={false} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold truncate" style={{ color: C.onSurface }}>{task.taskName}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                                style={{ color: C.onPrimaryContainer, background: `${C.primaryContainer}80` }}>
                                                                To Do
                                                            </span>
                                                            {task.deadline && (
                                                                <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: C.onSurfaceVariant }}>
                                                                    <CalendarClock size={9} /> {formatDeadline(task.deadline)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setConfirmState({ open: true, type: "task", id: task.taskId, name: task.taskName || "Untitled Task", loading: false })}
                                                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95"
                                                        style={{ background: C.primary, color: "#fff" }}>
                                                        Accept
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* === Section: Reviews Awaiting Acceptance === */}
                                    {pendingReviews.length > 0 && (
                                        <div>
                                            <div className="px-5 pt-4 pb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6a3ea1" }}>
                                                    Peer Reviews Awaiting Acceptance
                                                </span>
                                            </div>
                                            {pendingReviews.map((review: any, i: number) => (
                                                <motion.div key={review.reviewId}
                                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-3 px-5 py-3.5 transition-colors group"
                                                    style={{ borderBottom: `1px solid ${C.surfaceVariant}40` }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = `${C.surfaceContainerHigh}80`)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                    <NotifIcon type="REVIEW" isRead={false} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold truncate" style={{ color: C.onSurface }}>{review.titleTask || "Untitled Review"}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                                style={{ color: "#6a3ea1", background: "#e8dcf480" }}>
                                                                Peer Review
                                                            </span>
                                                            {review.dueDate && (
                                                                <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: C.onSurfaceVariant }}>
                                                                    <CalendarClock size={9} /> {formatDeadline(review.dueDate)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setConfirmState({ open: true, type: "review", id: review.reviewId, name: review.titleTask || "Untitled Review", loading: false })}
                                                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95"
                                                        style={{ background: "#6a3ea1", color: "#fff" }}>
                                                        Accept
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* === Section: Urgent Items (≤ 3 days) === */}
                                    {(urgentTasks.length > 0 || urgentReviews.length > 0) && (
                                        <div>
                                            <div className="px-5 pt-4 pb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.warning }}>
                                                    <AlertTriangle size={11} /> Urgent — Due Within 3 Days
                                                </span>
                                            </div>
                                            {urgentTasks.map((task: any, i: number) => {
                                                const days = calcDaysLeft(task.deadline);
                                                return (
                                                    <motion.div key={task.taskId}
                                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="flex items-center gap-3 px-5 py-3.5 transition-colors group"
                                                        style={{ borderBottom: `1px solid ${C.surfaceVariant}40` }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = `${C.warningContainer}30`)}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                                            style={{ background: `${C.warningContainer}60`, color: C.warning }}>
                                                            <Clock size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-bold truncate" style={{ color: C.onSurface }}>{task.taskName}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                                    style={{ color: C.warning, background: `${C.warningContainer}60` }}>
                                                                    {days}d left
                                                                </span>
                                                                <span className="text-[10px] font-medium" style={{ color: C.onSurfaceVariant }}>
                                                                    {formatDeadline(task.deadline)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewTask(task.taskId)}
                                                            disabled={loadingItemId === task.taskId}
                                                            className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1"
                                                            style={{ background: `${C.warningContainer}`, color: C.warning }}>
                                                            {loadingItemId === task.taskId ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                                                            View
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                            {urgentReviews.map((review: any, i: number) => {
                                                const days = calcDaysLeft(review.dueDate);
                                                return (
                                                    <motion.div key={review.reviewId}
                                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: (urgentTasks.length + i) * 0.03 }}
                                                        className="flex items-center gap-3 px-5 py-3.5 transition-colors group"
                                                        style={{ borderBottom: `1px solid ${C.surfaceVariant}40` }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = `${C.warningContainer}30`)}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                                            style={{ background: `${C.errorContainer}50`, color: C.error }}>
                                                            <Clock size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-bold truncate" style={{ color: C.onSurface }}>{review.titleTask || "Untitled Review"}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                                    style={{ color: C.error, background: `${C.errorContainer}50` }}>
                                                                    {days}d left · Review
                                                                </span>
                                                                <span className="text-[10px] font-medium" style={{ color: C.onSurfaceVariant }}>
                                                                    {formatDeadline(review.dueDate)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewReview(review.reviewId)}
                                                            disabled={loadingItemId === review.reviewId}
                                                            className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1"
                                                            style={{ background: `${C.errorContainer}80`, color: C.error }}>
                                                            {loadingItemId === review.reviewId ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                                                            View
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* === Section: Recent Notifications === */}
                                    {notifications.length > 0 && (
                                        <div>
                                            <div className="px-5 pt-4 pb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                                                    Recent Notifications
                                                </span>
                                            </div>
                                            {notifications.slice(0, 8).map((notif, i) => (
                                                <motion.div key={notif.notificationId}
                                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer"
                                                    style={{ borderBottom: `1px solid ${C.surfaceVariant}30` }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = `${C.surfaceContainerHigh}60`)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                    onClick={() => handleNotifClick(notif)}>
                                                    <NotifIcon type={notif.reviewId ? 'REVIEW' : notif.taskId ? 'TASK' : notif.type} isRead={notif.isRead} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-semibold truncate"
                                                            style={{ color: C.onSurface, fontWeight: notif.isRead ? 500 : 700 }}>
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-[11px] truncate mt-0.5" style={{ color: C.onSurfaceVariant }}>
                                                            {notif.message || notif.content}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                                        <span className="text-[10px] font-medium" style={{ color: C.onSurfaceVariant }}>
                                                            {timeAgo(notif.createdAt)}
                                                        </span>
                                                        {(notif.taskId || notif.reviewId || notif.relatedEntityId) && (
                                                            <span className="text-[9px] font-bold flex items-center gap-0.5"
                                                                style={{ color: C.primary }}>
                                                                View <ChevronRight size={10} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {totalItems === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <Sparkles size={40} style={{ color: C.primaryContainer }} />
                                            <p className="text-sm font-bold mt-3" style={{ color: C.onSurface }}>All caught up!</p>
                                            <p className="text-xs" style={{ color: C.onSurfaceVariant }}>No pending items right now.</p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Footer ── */}
                                <div className="px-6 py-3.5 flex items-center justify-between shrink-0"
                                    style={{ borderTop: `1px solid ${C.surfaceVariant}`, background: "#fff" }}>
                                    <p className="text-[10px] font-medium" style={{ color: C.onSurfaceVariant }}>
                                        Click any item to navigate directly
                                    </p>
                                    <button onClick={() => setIsOpen(false)}
                                        className="px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
                                        style={{ background: C.primary, color: "#fff" }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
