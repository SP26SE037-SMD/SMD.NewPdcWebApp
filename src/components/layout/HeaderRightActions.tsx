"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, LogOut, Settings, User, Bell, X, Search,
    ChevronRight, ChevronLeft, BellRing, CheckCheck, Filter,
    Loader2, FileEdit, Eye, ExternalLink, CheckCircle2, Clock,
    AlertTriangle, CalendarClock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthService } from "@/services/auth.service";
import { TypeIcon, NotiType } from './Header';
import {
    markNotificationRead,
    markAllNotificationsRead,
    dismissLatestNotification,
} from '@/store/slices/notificationSlice';
import { NotificationData } from '@/types/notification';
import { TaskService } from '@/services/task.service';
import { ReviewTaskService } from '@/services/review-task.service';

// Helper: Map notification type string to NotiType for icon rendering
function resolveNotiType(typeStr: string): NotiType {
    const t = typeStr?.toLowerCase() || '';
    if (t.includes('success') || t.includes('approved') || t.includes('accepted')) return 'success';
    if (t.includes('warning') || t.includes('deadline') || t.includes('urgent')) return 'warning';
    if (t.includes('system') || t.includes('broadcast')) return 'system';
    return 'info';
}

// Helper: Format timestamp to relative string
function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

// Helper: Detect if notification links to a task or review
function getEntityInfo(n: NotificationData): { type: 'task' | 'review' | null; id: string | null } {
    // 1. Direct taskId / reviewId from API response
    if (n.taskId) return { type: 'task', id: n.taskId };
    if (n.reviewId) return { type: 'review', id: n.reviewId };
    
    // 2. Fallback to relatedEntityId + relatedEntityType
    const entityType = (n.relatedEntityType || '').toUpperCase();
    const entityId = n.relatedEntityId || null;

    if (!entityId) return { type: null, id: null };
    if (entityType.includes('REVIEW') || entityType === 'REVIEW_TASK') return { type: 'review', id: entityId };
    if (entityType.includes('TASK') || entityType === 'SYLLABUS_DEVELOP' || entityType === 'SYLLABUS') return { type: 'task', id: entityId };
    // Fallback: try to detect from type field
    const t = (n.type || '').toUpperCase();
    if (t.includes('REVIEW')) return { type: 'review', id: entityId };
    if (t.includes('TASK') || t.includes('SYLLABUS')) return { type: 'task', id: entityId };
    return { type: null, id: entityId };
}

/* ════════════════════════════════════════════
   Accept Confirmation Modal  
   ════════════════════════════════════════════ */
function AcceptConfirmModal({ 
    isOpen, onClose, onConfirm, isLoading, name, type 
}: { 
    isOpen: boolean; onClose: () => void; onConfirm: () => void; 
    isLoading: boolean; name: string; type: 'task' | 'review'; 
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div key="confirm-backdrop" 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000]" 
                        style={{ background: 'rgba(45,47,44,0.3)', backdropFilter: 'blur(12px)' }}
                        onClick={onClose} />
                    <motion.div key="confirm-panel"
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="fixed inset-0 z-[1001] flex items-center justify-center p-6 pointer-events-none">
                        <div className="w-full max-w-[400px] rounded-[32px] overflow-hidden pointer-events-auto bg-white shadow-[0_32px_80px_rgba(65,104,63,0.28)] border border-[#4caf50]/10">
                            {/* Header with Icon */}
                            <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-[#f8faf7] to-white">
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-[#4caf50]/20 rounded-[28px] blur-xl animate-pulse" />
                                    <div className="relative w-20 h-20 rounded-[28px] flex items-center justify-center bg-gradient-to-br from-[#4caf50] to-[#2e7d32] text-white shadow-lg shadow-[#4caf50]/30 transform -rotate-3">
                                        <CheckCircle2 size={40} className="transform rotate-3" />
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-black mb-3 text-[#1a1f18]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                                    {type === 'task' ? 'Accept New Task?' : 'Accept Review?'}
                                </h3>
                                
                                <p className="text-base text-[#5a6157] leading-relaxed px-4">
                                    Would you like to start working on this? This will update the status to <span className="font-extrabold text-[#4caf50]">In Progress</span>.
                                </p>
                            </div>

                            {/* Entity Details Card */}
                            <div className="px-8 py-3">
                                <div className="bg-[#f4f7f1]/60 rounded-2xl p-4 border border-[#4caf50]/10 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#8a9186] mb-1.5">Project Assignment</p>
                                    <p className="text-[15px] font-bold text-[#2d342b] leading-tight">{name}</p>
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
                                    {isLoading ? 'Accepting...' : 'Yes, start now'}
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
}

/* ════════════════════════════════════════════
   Notification Action Button
   ════════════════════════════════════════════ */
function NotifActionButton({
    notif,
    onNavigate,
    loadingId,
}: {
    notif: NotificationData;
    onNavigate: (n: NotificationData) => void;
    loadingId: string | null;
}) {
    const entity = getEntityInfo(notif);
    if (!entity.id) return null;

    const isLoading = loadingId === notif.notificationId;

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onNavigate(notif); }}
            disabled={isLoading}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            style={{ 
                background: entity.type === 'review' ? '#e8dcf4' : '#c1eeba60',
                color: entity.type === 'review' ? '#6a3ea1' : '#345a32',
            }}
        >
            {isLoading 
                ? <Loader2 size={11} className="animate-spin" /> 
                : entity.type === 'review' ? <Eye size={11} /> : <FileEdit size={11} />
            }
            {entity.type === 'review' ? 'Review' : 'View'}
            <ChevronRight size={10} />
        </button>
    );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export function HeaderRightActions() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const {
        notifications,
        unreadCount,
        isLoading: notiLoading,
        latestRealtimeNotification,
    } = useSelector((state: RootState) => state.notification);
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isAllNotiModalOpen, setIsAllNotiModalOpen] = useState(false);
    
    // Modal state
    const [notiPage, setNotiPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUnread, setFilterUnread] = useState(false);

    // Loading / action states
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        open: boolean; type: 'task' | 'review'; id: string; name: string; loading: boolean;
        notifId: string;
    }>({ open: false, type: 'task', id: '', name: '', loading: false, notifId: '' });
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await AuthService.logout();
            window.location.href = '/login';
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = '/login';
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) setIsNotiOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-dismiss the realtime toast after 5 seconds
    useEffect(() => {
        if (!latestRealtimeNotification) return;
        const timer = setTimeout(() => {
            dispatch(dismissLatestNotification());
        }, 5000);
        return () => clearTimeout(timer);
    }, [latestRealtimeNotification, dispatch]);

    const filteredNotis = useMemo(() => {
        return notifications.filter((n: NotificationData) => {
            const matchesSearch = (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (n.content || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterUnread ? !n.isRead : true;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, filterUnread, notifications]);

    const handleMarkRead = (id: string) => {
        dispatch(markNotificationRead(id));
    };

    const handleMarkAllRead = () => {
        dispatch(markAllNotificationsRead());
    };

    const totalNotiPages = Math.ceil(filteredNotis.length / 5);
    const paginatedNotis = filteredNotis.slice(notiPage * 5, (notiPage + 1) * 5);

    /* ── Navigate to task/review from notification ── */
    const handleNotifNavigate = useCallback(async (notif: NotificationData) => {
        const entity = getEntityInfo(notif);
        if (!entity.id || !entity.type) return;

        setLoadingId(notif.notificationId);

        // Mark as read
        dispatch(markNotificationRead(notif.notificationId));

        try {
            if (entity.type === 'task') {
                const res = await TaskService.getTaskById(entity.id);
                const task = res?.data;
                if (task) {
                    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
                    // If TO_DO, show accept confirmation
                    if (status === 'TO_DO') {
                        setLoadingId(null);
                        setConfirmState({
                            open: true, type: 'task', id: task.taskId,
                            name: task.taskName || 'Untitled Task', loading: false,
                            notifId: notif.notificationId,
                        });
                        return;
                    }
                    // Otherwise redirect
                    const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                    setIsNotiOpen(false);
                    setIsAllNotiModalOpen(false);
                    router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                }
            } else {
                const res = await ReviewTaskService.getReviewTaskById(entity.id);
                const review = res?.data;
                if (review) {
                    const status = (review.status || '').toUpperCase().replace(/\s+/g, '_');
                    // If PENDING, show accept confirmation
                    if (status === 'PENDING') {
                        setLoadingId(null);
                        setConfirmState({
                            open: true, type: 'review', id: review.reviewId,
                            name: review.titleTask || 'Untitled Review', loading: false,
                            notifId: notif.notificationId,
                        });
                        return;
                    }
                    setIsNotiOpen(false);
                    setIsAllNotiModalOpen(false);
                    router.push(`/dashboard/pdcm/reviews/${review.reviewId}/information`);
                }
            }
        } catch (err) {
            console.error("Failed to fetch entity:", err);
            // Fallback: navigate anyway
            if (entity.type === 'task') {
                setIsNotiOpen(false);
                setIsAllNotiModalOpen(false);
                router.push(`/dashboard/pdcm/tasks/${entity.id}/information`);
            } else {
                setIsNotiOpen(false);
                setIsAllNotiModalOpen(false);
                router.push(`/dashboard/pdcm/reviews/${entity.id}/information`);
            }
        } finally {
            setLoadingId(null);
        }
    }, [dispatch, router]);

    /* ── Accept Task (TO_DO → IN_PROGRESS) ── */
    const handleConfirmAcceptTask = useCallback(async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
            await TaskService.updateTaskStatus(confirmState.id, 'IN_PROGRESS', user?.accountId || '');
            setConfirmState(prev => ({ ...prev, open: false, loading: false }));
            setIsNotiOpen(false);
            setIsAllNotiModalOpen(false);
            router.push(`/dashboard/pdcm/tasks/${confirmState.id}/information`);
        } catch (err) {
            console.error("Failed to accept task:", err);
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }, [confirmState.id, user?.accountId, router]);

    /* ── Accept Review (PENDING → IN_PROGRESS) ── */
    const handleConfirmAcceptReview = useCallback(async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
            await ReviewTaskService.updateReviewTaskStatus(confirmState.id, 'IN_PROGRESS');
            setConfirmState(prev => ({ ...prev, open: false, loading: false }));
            setIsNotiOpen(false);
            setIsAllNotiModalOpen(false);
            router.push(`/dashboard/pdcm/reviews/${confirmState.id}/information`);
        } catch (err) {
            console.error("Failed to accept review:", err);
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }, [confirmState.id, router]);

    /* ── Render single notification item ── */
    const renderNotifItem = (n: NotificationData, variant: 'compact' | 'full' = 'compact') => {
        const entity = getEntityInfo(n);
        const hasAction = !!entity.id;
        const isCompact = variant === 'compact';

        return (
            <div 
                key={n.notificationId} 
                className={`group transition-all ${hasAction ? 'cursor-pointer' : ''} ${
                    isCompact 
                        ? `px-5 py-4 flex gap-3.5 border-l-[3px] ${!n.isRead ? 'bg-[#4caf50]/[0.02] border-l-[#4caf50] hover:bg-[#4caf50]/[0.04]' : 'bg-transparent border-l-transparent hover:bg-[#2d342b]/[0.02]'}`
                        : `px-7 py-5 rounded-2xl border flex gap-5 items-start ${!n.isRead ? 'bg-white border-[#4caf50]/10 shadow-md shadow-[#4caf50]/5' : 'bg-[#2d342b]/[0.01] border-transparent opacity-[0.92] hover:opacity-100 hover:bg-white hover:border-[#2d342b]/5'}`
                }`}
                onClick={() => hasAction && handleNotifNavigate(n)}
            >
                {/* Icon */}
                <div className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl flex items-center justify-center shrink-0 border relative ${
                    !n.isRead ? 'bg-white border-[#4caf50]/10 shadow-sm' : 'bg-[#2d342b]/5 border-transparent'
                }`}>
                    <TypeIcon type={resolveNotiType(n.type)} size={isCompact ? 18 : 22} />
                    {!n.isRead && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4caf50] rounded-full ring-2 ring-white" />
                    )}
                </div>

                {/* Content */}
                <div className="grow min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                        <p className={`${isCompact ? 'text-[14px]' : 'text-base'} font-black leading-tight truncate ${!n.isRead ? 'text-[#1a1f18]' : 'text-[#2d342b]/85'}`}>
                            {n.title}
                        </p>
                        {!isCompact && (
                            <span className="text-[10px] font-black text-[#1a1f18] bg-[#2d342b]/8 px-2.5 py-1 rounded-full uppercase shrink-0 tracking-wider">
                                {formatDate(n.createdAt)}
                            </span>
                        )}
                    </div>
                    <p className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} text-[#2d342b]/80 font-bold line-clamp-2 leading-relaxed mb-3`}>
                        {n.content}
                    </p>
                    <div className="flex items-center gap-2">
                        {hasAction && (
                            <NotifActionButton notif={n} onNavigate={handleNotifNavigate} loadingId={loadingId} />
                        )}
                        {!n.isRead && !hasAction && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(n.notificationId); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-[#4caf50] hover:underline"
                            >
                                Mark read
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex items-center gap-4">
            {/* ═══ Accept Confirmation Modal ═══ */}
            <AcceptConfirmModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
                onConfirm={confirmState.type === 'task' ? handleConfirmAcceptTask : handleConfirmAcceptReview}
                isLoading={confirmState.loading}
                name={confirmState.name}
                type={confirmState.type}
            />

            {/* Notification System */}
            <div className="relative" ref={notiRef}>
                <button 
                    onClick={() => setIsNotiOpen(!isNotiOpen)}
                    className={`relative p-2.5 transition-all rounded-full group ${isNotiOpen ? 'bg-[#4caf50]/10 text-[#4caf50] shadow-inner' : 'text-[#5a6157] hover:text-[#4caf50] hover:bg-[#4caf50]/5'}`}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full ring-2 ring-white flex items-center justify-center">
                            <span className="text-[9px] font-black text-white leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        </div>
                    )}
                </button>

                {/* Realtime New Notification Toast */}
                <AnimatePresence>
                    {latestRealtimeNotification && !isNotiOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute right-0 mt-2 w-80 cursor-pointer z-[200]"
                            onClick={() => {
                                setIsNotiOpen(true);
                                dispatch(dismissLatestNotification());
                            }}
                        >
                            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(65,104,63,0.22)] border border-[#4caf50]/15 overflow-hidden">
                                {/* Green accent bar */}
                                <div className="h-1 bg-gradient-to-r from-[#4caf50] to-emerald-400" />
                                <div className="px-4 py-3.5 flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#4caf50]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <BellRing size={18} className="text-[#4caf50]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-[#4caf50] uppercase tracking-widest mb-0.5">New notification</p>
                                        <p className="text-[13px] font-bold text-[#2d342b] truncate">{latestRealtimeNotification.title}</p>
                                        <p className="text-[11px] text-[#5a6157] line-clamp-1 mt-0.5 opacity-70">{latestRealtimeNotification.content}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(dismissLatestNotification());
                                        }}
                                        className="p-1 rounded-lg hover:bg-[#2d342b]/5 text-[#5a6157]/40 hover:text-[#5a6157] transition-colors shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                {/* Progress bar */}
                                <div className="h-[2px] bg-[#2d342b]/5">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 5, ease: 'linear' }}
                                        className="h-full bg-[#4caf50]/30"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ Notification Popover (Bell Dropdown) ═══ */}
                <AnimatePresence>
                    {isNotiOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-[420px] bg-white rounded-3xl shadow-[0_24px_54px_rgba(65,104,63,0.18)] border border-[#2d342b]/10 overflow-hidden z-[200]"
                        >
                            {/* Header */}
                            <div className="px-5 py-5 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #f8faf2, #ffffff)', borderBottom: '1px solid rgba(45,52,43,0.06)' }}>
                                <div>
                                    <p className="text-[15px] font-black text-[#2d342b]">Notifications</p>
                                    {unreadCount > 0 && (
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#4caf50' }}>
                                            {unreadCount} new update{unreadCount > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                <button onClick={handleMarkAllRead} className="text-[10px] font-black text-[#4caf50] hover:bg-[#4caf50]/10 px-3.5 py-2 rounded-xl transition-all uppercase tracking-widest border border-[#4caf50]/15 bg-white">
                                    Mark all read
                                </button>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                                {notiLoading && notifications.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-[#4caf50]" size={24} />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 opacity-40">
                                        <BellRing size={32} className="mb-2" />
                                        <p className="text-sm font-bold">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#2d342b]/[0.04]">
                                        {notifications.slice(0, 6).map((n: NotificationData) => renderNotifItem(n, 'compact'))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <button 
                                onClick={() => { setIsNotiOpen(false); setIsAllNotiModalOpen(true); }}
                                className="w-full py-4 text-xs font-bold text-[#4caf50] hover:bg-[#2d342b]/3 transition-all flex items-center justify-center gap-2 border-t border-[#2d342b]/5"
                                style={{ background: 'rgba(45,52,43,0.015)' }}
                            >
                                View Full Notification
                                <ChevronRight size={14} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ Full Notifications Modal ═══ */}
                <AnimatePresence>
                    {isAllNotiModalOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-150 flex flex-col items-center justify-center p-4"
                            style={{ background: 'rgba(45,52,43,0.2)', backdropFilter: 'blur(6px)' }}
                            onClick={() => setIsAllNotiModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-4xl bg-[#fafcf8] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative max-h-[85vh] border border-[#2d342b]/10"
                            >
                                <button 
                                    onClick={() => setIsAllNotiModalOpen(false)}
                                    className="absolute top-5 right-5 p-2.5 bg-white hover:bg-rose-50 text-[#5a6157] hover:text-rose-500 rounded-2xl transition-all shadow-sm z-10 border border-[#2d342b]/5"
                                >
                                    <X size={20} />
                                </button>

                                {/* Header */}
                                <div className="px-10 py-8 border-b border-[#2d342b]/5 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#c1eeba]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                    <h3 className="text-2xl font-black text-[#2d342b] mb-1 tracking-tight relative z-10" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Notifications
                                    </h3>
                                    <p className="text-sm text-[#5a6157] font-medium relative z-10">
                                        Stay updated on your tasks and review activities.
                                    </p>
                                    
                                    <div className="mt-6 flex gap-3 relative z-10">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6157] opacity-40" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Search notifications..."
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setNotiPage(0); }}
                                                className="w-full pl-11 pr-4 py-3.5 bg-[#2d342b]/4 border border-transparent focus:border-[#4caf50]/20 focus:bg-white rounded-2xl outline-none text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => { setFilterUnread(!filterUnread); setNotiPage(0); }}
                                            className={`px-5 py-3 rounded-[18px] text-[12px] font-black flex items-center gap-2 border transition-all ${
                                                filterUnread 
                                                    ? 'bg-[#4caf50] text-white border-[#4caf50] shadow-md shadow-[#4caf50]/20' 
                                                    : 'bg-white text-[#1a1f18] border-[#2d342b]/15 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]'
                                            }`}
                                        >
                                            <Filter size={15} />
                                            {filterUnread ? 'Unread only' : 'All notifications'}
                                        </button>
                                        <button 
                                            onClick={handleMarkAllRead}
                                            className="px-5 py-3 rounded-[18px] text-[12px] font-black bg-white text-[#1a1f18] border border-[#2d342b]/15 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50] transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <CheckCheck size={16} />
                                            Mark all read
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="grow overflow-y-auto px-6 pb-8 custom-scrollbar">
                                    {paginatedNotis.length > 0 ? (
                                        <div className="space-y-0 px-2 mt-5 divide-y divide-[#2d342b]/[0.08]">
                                            {paginatedNotis.map((n: NotificationData) => renderNotifItem(n, 'full'))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                            <BellRing size={56} className="mb-4" />
                                            <p className="text-lg font-bold">No notifications found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalNotiPages > 1 && (
                                    <div className="px-10 py-6 border-t border-[#2d342b]/10 flex justify-between items-center bg-[#fcfdfa]">
                                        <button 
                                            disabled={notiPage === 0}
                                            onClick={() => setNotiPage(p => Math.max(0, p - 1))}
                                            className="flex items-center gap-2 text-sm font-black text-[#1a1f18] disabled:opacity-20 hover:bg-[#4caf50] hover:text-white px-5 py-2.5 rounded-2xl transition-all border border-transparent hover:border-[#4caf50]"
                                        >
                                            <ChevronLeft size={18} /> Previous
                                        </button>
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: totalNotiPages }).map((_, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setNotiPage(i)}
                                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                                        notiPage === i 
                                                            ? 'bg-[#4caf50] text-white shadow-lg shadow-[#4caf50]/20 scale-110' 
                                                            : 'bg-[#2d342b]/5 text-[#5a6157] hover:bg-[#2d342b]/10'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            disabled={notiPage >= totalNotiPages - 1}
                                            onClick={() => setNotiPage(p => p + 1)}
                                            className="flex items-center gap-2 text-sm font-black text-[#5a6157] disabled:opacity-20 hover:bg-[#2d342b]/5 px-5 py-2.5 rounded-2xl transition-all"
                                        >
                                            Next <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
                <div 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-white transition-all cursor-pointer group border border-[#2d342b]/5 bg-white shadow-sm hover:shadow-md h-12"
                >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105 border-2 border-white shadow-sm"
                        style={{ background: '#c1eeba', color: '#345a32' }}>
                        {user ? user.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AA'}
                    </div>
                    <div className="hidden lg:block mr-1">
                        <p className="text-[11px] font-bold text-[#2d342b] leading-tight truncate max-w-[100px]">{user?.fullName || "Professor Archer"}</p>
                        <p className="text-[9px] text-[#5a6157] font-bold uppercase tracking-wider opacity-60">PDCM</p>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 text-[#5a6157] ${isMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-[0_24px_54px_rgba(65,104,63,0.18)] border border-[#2d342b]/10 overflow-hidden z-50 overflow-y-auto max-h-[85vh] scrollbar-hide"
                        >
                            <div className="px-6 py-6 border-b border-[#2d342b]/5 bg-linear-to-br from-[#c1eeba]/40 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-md border-2 border-white"
                                        style={{ background: '#c1eeba', color: '#345a32' }}>
                                        {user ? user.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AA'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#2d342b] line-clamp-1">{user?.fullName || "Professor Archer"}</p>
                                        <p className="text-[10px] text-[#5a6157] font-bold uppercase tracking-widest leading-tight">Member</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-2 space-y-1">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2d342b]/5 text-sm font-medium transition-all group">
                                    <div className="w-8 h-8 rounded-xl bg-[#2d342b]/5 flex items-center justify-center text-[#5a6157] group-hover:bg-[#4caf50]/10 group-hover:text-[#4caf50] transition-colors">
                                        <User size={18} />
                                    </div>
                                    My Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2d342b]/5 text-sm font-medium transition-all group">
                                    <div className="w-8 h-8 rounded-xl bg-[#2d342b]/5 flex items-center justify-center text-[#5a6157] group-hover:bg-[#4caf50]/10 group-hover:text-[#4caf50] transition-colors">
                                        <Settings size={18} />
                                    </div>
                                    Settings
                                </button>
                                <div className="pt-3 mt-3 border-t border-[#2d342b]/5">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-600 text-sm font-bold transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                                            <LogOut size={18} />
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
