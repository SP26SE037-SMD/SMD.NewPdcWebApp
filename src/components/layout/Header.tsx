"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, LogOut, Settings, User, Bell, X, 
    ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
    Info, BellRing, Search, CheckCheck, Trash2, Filter,
    Loader2, FileEdit, Eye, CalendarClock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthService } from "@/services/auth.service";
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissLatestNotification,
} from '@/store/slices/notificationSlice';
import { NotificationData } from '@/types/notification';
import { TaskService } from '@/services/task.service';
import { ReviewTaskService } from '@/services/review-task.service';

// Helper: Detect if notification links to a task or review
// Backend returns taskId / reviewId directly on each notification
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
    return { type: null, id: entityId };
}

// Helper: get display content — backend uses "message" field, not "content"
function getNotifContent(n: NotificationData): string {
    return n.message || n.content || '';
}

export type NotiType = 'success' | 'warning' | 'info' | 'system';

export interface Notification {
    id: number;
    title: string;
    content: string;
    date: string;
    unread: boolean;
    type: NotiType;
    isImportant?: boolean;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 1, type: 'info', title: 'Syllabus Review Requested', content: 'You have a new review request for "Advanced Macroeconomics". Please complete by Friday.', date: '2 hours ago', unread: true },
    { id: 2, type: 'warning', title: 'Task Deadline Approaching', content: 'The deadline for "Quantum Bio-Informatics" is in 24 hours. Submit materials now.', date: '5 hours ago', unread: true, isImportant: true },
    { id: 3, type: 'success', title: 'Review Accepted', content: 'Your review for "Urbanism Landscapes" has been accepted by the PDC board.', date: '1 day ago', unread: false },
    { id: 4, type: 'info', title: 'New Material Added', content: 'New reference materials have been added to session 4 of your syllabus.', date: '2 days ago', unread: false },
    { id: 5, type: 'warning', title: 'Comment on Section 2', content: 'Dr. Vos left a comment on your recent syllabus submission regarding CLOs.', date: '3 days ago', unread: false },
    { id: 6, type: 'success', title: 'Syllabus Approved', content: 'Your syllabus for "Micro-Economics 101" was officially approved.', date: '4 days ago', unread: false },
    { id: 7, type: 'system', title: 'Assignment Reminder', content: 'Don\'t forget to assign a reviewer for the new semester tasks.', date: '5 days ago', unread: false },
    { id: 8, type: 'system', title: 'System Maintenance', content: 'System will be down for maintenance this Sunday at 2 AM for 2 hours.', date: '1 week ago', unread: false },
    { id: 9, type: 'info', title: 'Welcome to PDCM', content: 'Explore the new dashboard features and manage your academic projects.', date: '2 weeks ago', unread: false },
];

interface HeaderProps {
    title?: string;
    showSearch?: boolean;
    tabs?: {
        id: string;
        label: string;
        isActive: boolean;
        onClick: () => void;
    }[];
    onBack?: () => void;
    actionButton?: React.ReactNode | {
        label: string;
        icon: string;
        onClick: () => void;
    };
}

const C = {
    primary: "#4caf50",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    surface: "#ffffff",
    primaryContainer: "#c1eeba",
    error: "#a73b21",
    warning: "#855110",
    info: "#00639b",
};

export const TypeIcon = ({ type, size = 16 }: { type: NotiType; size?: number }) => {
    switch (type) {
        case 'success': return <CheckCircle2 size={size} className="text-emerald-500" />;
        case 'warning': return <AlertCircle size={size} className="text-amber-500" />;
        case 'info': return <Info size={size} className="text-sky-500" />;
        case 'system': return <BellRing size={size} className="text-primary" />;
        default: return <Bell size={size} className="text-gray-400" />;
    }
};

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
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return d.toLocaleDateString();
    } catch {
        return dateStr;
    }
}

export function Header({ title, showSearch = true, tabs = [], onBack, actionButton }: HeaderProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
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
    const [loadingNotifId, setLoadingNotifId] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        open: boolean; type: 'task' | 'review'; id: string; name: string; loading: boolean;
    }>({ open: false, type: 'task', id: '', name: '', loading: false });
    const [filterUnread, setFilterUnread] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await AuthService.logout();
            // Clear any local persistence if necessary
            // Hard redirect to login to reset all store states
            window.location.href = '/login';
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if API fails, we should try to clear local session
            window.location.href = '/login';
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setIsNotiOpen(false);
            }
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
                                 (getNotifContent(n)).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterUnread ? !n.isRead : true;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, filterUnread, notifications]);

    const totalNotiPages = Math.ceil(filteredNotis.length / 5);
    const paginatedNotis = filteredNotis.slice(notiPage * 5, (notiPage + 1) * 5);

    const handleMarkRead = (id: string) => {
        dispatch(markNotificationRead(id));
    };

    const handleMarkAllRead = () => {
        dispatch(markAllNotificationsRead());
    };

    /* ── Navigate to task/review from notification ── */
    const handleNotifNavigate = useCallback(async (n: NotificationData) => {
        const entity = getEntityInfo(n);
        if (!entity.id || !entity.type) return;
        setLoadingNotifId(n.notificationId);
        dispatch(markNotificationRead(n.notificationId));
        try {
            if (entity.type === 'task') {
                const res = await TaskService.getTaskById(entity.id);
                const task = res?.data;
                if (task) {
                    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
                    if (status === 'TO_DO') {
                        setLoadingNotifId(null);
                        setConfirmState({ open: true, type: 'task', id: task.taskId, name: task.taskName || 'Untitled Task', loading: false });
                        return;
                    }
                    const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                    setIsNotiOpen(false); setIsAllNotiModalOpen(false);
                    router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                }
            } else {
                const res = await ReviewTaskService.getReviewTaskById(entity.id);
                const review = res?.data;
                if (review) {
                    const status = (review.status || '').toUpperCase().replace(/\s+/g, '_');
                    if (status === 'PENDING') {
                        setLoadingNotifId(null);
                        setConfirmState({ open: true, type: 'review', id: review.reviewId, name: review.titleTask || 'Untitled Review', loading: false });
                        return;
                    }
                    setIsNotiOpen(false); setIsAllNotiModalOpen(false);
                    router.push(`/dashboard/pdcm/reviews/${review.reviewId}/information`);
                }
            }
        } catch (err) {
            console.error('Failed to fetch entity detail:', err);
            // If we can't fetch detail, we fall back to direct navigation BUT only as a last resort
            // The user wants confirmation for new tasks, so it's safer to just navigate if we can't check
            // However, most of the time this succeeds if it's a valid ID.
            if (entity.type === 'task') router.push(`/dashboard/pdcm/tasks/${entity.id}/information`);
            else router.push(`/dashboard/pdcm/reviews/${entity.id}/information`);
            setIsNotiOpen(false); setIsAllNotiModalOpen(false);
        } finally {
            setLoadingNotifId(null);
        }
    }, [dispatch, router]);

    /* ── Accept Task/Review confirmation ── */
    const handleConfirmAccept = useCallback(async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
            if (confirmState.type === 'task') {
                await TaskService.updateTaskStatus(confirmState.id, 'IN_PROGRESS', user?.accountId || '');
                setConfirmState(prev => ({ ...prev, open: false, loading: false }));
                setIsNotiOpen(false); setIsAllNotiModalOpen(false);
                router.push(`/dashboard/pdcm/tasks/${confirmState.id}/information`);
            } else {
                await ReviewTaskService.updateReviewTaskStatus(confirmState.id, 'IN_PROGRESS');
                setConfirmState(prev => ({ ...prev, open: false, loading: false }));
                setIsNotiOpen(false); setIsAllNotiModalOpen(false);
                router.push(`/dashboard/pdcm/reviews/${confirmState.id}/information`);
            }
        } catch (err) {
            console.error('Failed to accept:', err);
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }, [confirmState, user?.accountId, router]);

    return (
        <header className="w-full fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#f0f2ef] h-16 flex items-center">
            <div className="grid items-center px-6 w-full h-full" style={{ gridTemplateColumns: '1fr auto 1fr' }}>

                {/* Left: Logo / Back */}
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/5 transition-all text-[24px]"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <img src="/icon-with-name.png" alt="SMD" className="h-8 w-auto cursor-pointer" onClick={() => router.push('/dashboard/pdcm/develop')} />
                    {title && !tabs.length && (
                        <>
                            <div className="h-6 w-px bg-gray-200"></div>
                            <h2 className="text-lg font-bold tracking-tight text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {title}
                            </h2>
                        </>
                    )}
                </div>

                {/* Center: Tabs */}
                <nav className="flex gap-8 justify-center">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={tab.onClick}
                            className={`transition-all duration-200 font-medium pb-2 relative whitespace-nowrap ${
                                tab.isActive 
                                    ? 'text-primary font-semibold' 
                                    : 'text-on-surface/60 hover:text-on-surface'
                            }`}
                        >
                            {tab.label}
                            {tab.isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transition-all duration-300"></div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-4 justify-end">
                    {actionButton && (React.isValidElement(actionButton) ? (
                        actionButton
                    ) : (
                        <button 
                            onClick={(actionButton as any).onClick}
                            className="btn-pdcm-ghost px-4 py-2 rounded-xl text-xs shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">{(actionButton as any).icon}</span>
                            {(actionButton as any).label}
                        </button>
                    ))}

                    {/* Notification System */}
                    <div className="relative" ref={notiRef}>
                        <button 
                            onClick={() => setIsNotiOpen(!isNotiOpen)}
                            className={`relative p-2.5 transition-all rounded-full group ${isNotiOpen ? 'bg-primary/10 text-primary shadow-inner' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'}`}
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
                                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(65,104,63,0.22)] border border-primary/15 overflow-hidden">
                                        {/* Green accent bar */}
                                        <div className="h-1 bg-gradient-to-r from-primary to-emerald-400" />
                                        <div className="px-4 py-3.5 flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <BellRing size={18} className="text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">New notification</p>
                                                <p className="text-[13px] font-bold text-on-surface truncate">{latestRealtimeNotification.title}</p>
                                                <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5 opacity-70">{latestRealtimeNotification.message || latestRealtimeNotification.content}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dispatch(dismissLatestNotification());
                                                }}
                                                className="p-1 rounded-lg hover:bg-on-surface/5 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="h-[2px] bg-on-surface/5">
                                            <motion.div
                                                initial={{ width: '100%' }}
                                                animate={{ width: '0%' }}
                                                transition={{ duration: 5, ease: 'linear' }}
                                                className="h-full bg-primary/30"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isNotiOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.96 }}
                                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                                    className="absolute right-0 mt-3 w-[400px] bg-white rounded-2xl overflow-hidden z-[100]"
                                    style={{ boxShadow: '0 20px 60px rgba(45,52,43,0.15), 0 0 0 1px rgba(45,52,43,0.06)' }}
                                >
                                    {/* ─ Refined Header ─ */}
                                    <div className="relative overflow-hidden bg-[#fcfdfa] border-b border-[#2d342b]/8">
                                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #4caf50, transparent)', transform: 'translate(30%, -40%)' }} />
                                        <div className="relative px-6 py-5 flex justify-between items-center">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-[#4caf50]/15">
                                                    <Bell size={20} className="text-[#4caf50]" />
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-black text-[#1a1f18] tracking-tight">Notifications</p>
                                                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#4caf50]">
                                                        {unreadCount > 0 ? `${unreadCount} NEW UPDATES` : 'All caught up!'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={handleMarkAllRead} 
                                                className="text-[10px] font-black px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 bg-white text-[#1a1f18] border border-[#2d342b]/15 shadow-sm hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]"
                                            >
                                                <CheckCheck size={14} />
                                                Mark all read
                                            </button>
                                        </div>
                                    </div>

                                    {/* ─ Notification list ─ */}
                                    <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                        {notiLoading && notifications.length === 0 ? (
                                            <div className="flex items-center justify-center py-14">
                                                <Loader2 className="animate-spin text-primary" size={24} />
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-14">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#f4f7f1' }}>
                                                    <BellRing size={24} className="text-on-surface-variant/30" />
                                                </div>
                                                <p className="text-sm font-bold text-on-surface/40">No notifications yet</p>
                                                <p className="text-[11px] text-on-surface-variant/30 mt-0.5">We'll notify you when something arrives</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-0">
                                                {notifications.slice(0, 6).map((n: NotificationData, idx: number) => {
                                                    const entity = getEntityInfo(n);
                                                    const hasAction = !!entity.id;
                                                    return (
                                                    <motion.div key={n.notificationId}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className={`relative px-5 py-4 transition-all group flex gap-4 cursor-pointer border-b border-[#2d342b]/5 last:border-0 ${
                                                            !n.isRead 
                                                                ? 'bg-[#4caf50]/[0.03] hover:bg-[#4caf50]/[0.06]' 
                                                                : 'bg-white hover:bg-[#fcfdfa]'
                                                        }`}
                                                        onClick={() => hasAction ? handleNotifNavigate(n) : handleMarkRead(n.notificationId)}
                                                    >
                                                        {/* Icon */}
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm' : 'bg-on-surface/[0.04]'}`}>
                                                            <TypeIcon type={resolveNotiType(n.type)} size={16} />
                                                        </div>
                                                        {/* Content */}
                                                        <div className="grow min-w-0 flex flex-col">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={`text-[13.5px] font-black leading-snug line-clamp-1 ${!n.isRead ? 'text-[#1a1f18]' : 'text-[#2d342b]/85'}`}>
                                                                    {n.title}
                                                                </p>
                                                                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 shadow-sm" style={{ background: '#4caf50' }} />}
                                                            </div>
                                                            {getNotifContent(n) && (
                                                                <p className="text-[12px] text-[#4b5249] font-bold line-clamp-2 leading-relaxed mt-1">{getNotifContent(n)}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] font-black text-[#5a6157]/90 bg-[#2d342b]/5 px-2 py-0.5 rounded-md uppercase tracking-wider">{formatDate(n.createdAt)}</span>
                                                                {entity.type && (
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-[2px] rounded-md ${
                                                                        entity.type === 'review' 
                                                                            ? 'bg-purple-50 text-purple-500' 
                                                                            : 'bg-emerald-50 text-emerald-600'
                                                                    }`}>
                                                                        {entity.type === 'review' ? '● Review' : '● Task'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Action Button */}
                                                        {hasAction && (
                                                            <div className="shrink-0 self-center flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleNotifNavigate(n);
                                                                    }}
                                                                    disabled={loadingNotifId === n.notificationId}
                                                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 border ${
                                                                        !n.isRead 
                                                                            ? 'bg-[#4caf50] text-white border-[#4caf50] shadow-sm' 
                                                                            : 'bg-white text-[#5a6157] border-[#2d342b]/10 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]'
                                                                    }`}
                                                                >
                                                                    {loadingNotifId === n.notificationId ? (
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            {entity.type === 'review' ? 'Review' : 'View'}
                                                                            <ChevronRight size={12} />
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-[#fcfdfa] border-t border-[#2d342b]/8">
                                        <button 
                                            onClick={() => { setIsNotiOpen(false); setIsAllNotiModalOpen(true); }}
                                            className="w-full py-4.5 text-[12px] font-black text-[#1a1f18] hover:bg-[#4caf50] hover:text-white transition-all flex items-center justify-center gap-3 group"
                                        >
                                            View Full Notification Hub
                                            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* User Menu */}
                    <div className="relative" ref={menuRef}>
                        <div 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-on-surface/5 transition-all cursor-pointer group border border-on-surface/5 bg-surface shadow-sm hover:shadow-md h-12"
                        >
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105 border-2 border-white shadow-sm"
                                style={{ background: C.primaryContainer, color: '#345a32' }}>
                                {user ? user.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AA'}
                            </div>
                            <div className="hidden lg:block mr-1">
                                <p className="text-[11px] font-bold text-on-surface leading-tight truncate max-w-[100px]">{user?.fullName || "Professor Archer"}</p>
                                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider opacity-60">PDCM</p>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 text-on-surface-variant ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </div>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-on-surface/5 py-4 overflow-hidden z-[100]"
                                >
                                    <div className="px-6 pb-4 mb-4 border-b border-on-surface/5">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black border border-on-surface/5 bg-primary/5 text-primary">
                                                {user ? user.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AA'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface line-clamp-1">{user?.fullName || "Professor Archer"}</p>
                                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest leading-tight">Member</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2 space-y-1">
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-on-surface/5 text-sm font-medium transition-all group">
                                            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <User size={18} />
                                            </div>
                                            My Profile
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-on-surface/5 text-sm font-medium transition-all group">
                                            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <Settings size={18} />
                                            </div>
                                            Settings
                                        </button>
                                        <div className="pt-3 mt-3 border-t border-on-surface/5">
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
            </div>

            {/* ═══ NOTIFICATION HUB MODAL ═══ */}
            <AnimatePresence>
                {isAllNotiModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                            style={{ background: 'rgba(45,52,43,0.55)', backdropFilter: 'blur(12px)' }}
                            onClick={() => setIsAllNotiModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.96, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 24 }}
                            transition={{ type: 'spring', bounce: 0.12, duration: 0.4 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden flex flex-col"
                            style={{ maxHeight: 'calc(100vh - 80px)', boxShadow: '0 32px 80px rgba(45,52,43,0.25)' }}
                        >
                            {/* ─ Modal Header ─ */}
                            <div className="relative overflow-hidden shrink-0 bg-white border-b border-[#2d342b]/5">
                                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(circle, #4caf50, transparent)', transform: 'translate(30%, -30%)' }} />
                                
                                <div className="relative px-8 pt-8 pb-6">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#f4f7f1]">
                                                <BellRing size={24} className="text-[#4caf50]" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-[#1a1f18] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                    Notification Hub
                                                </h3>
                                                <p className="text-[11px] font-black uppercase tracking-widest mt-1 text-[#4caf50]">
                                                    {filteredNotis.length} ACTIVE NOTIFICATIONS
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsAllNotiModalOpen(false)}
                                            className="p-2.5 rounded-xl transition-all hover:bg-[#2d342b]/5 active:scale-95 text-[#5a6157]"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative grow">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a6157]/40" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Search notifications..."
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setNotiPage(0); }}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-[13px] font-bold text-[#1a1f18] placeholder:text-[#5a6157]/40 bg-[#f4f7f1] border border-[#2d342b]/5 focus:border-[#4caf50]/30 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => { setFilterUnread(!filterUnread); setNotiPage(0); }}
                                            className={`px-4 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95 border ${
                                                filterUnread 
                                                    ? 'bg-[#4caf50] text-white border-[#4caf50]' 
                                                    : 'bg-white text-[#5a6157] border-[#2d342b]/10 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]'
                                            }`}
                                        >
                                            <Filter size={13} />
                                            {filterUnread ? 'Unread only' : 'All notifications'}
                                        </button>
                                        <button onClick={handleMarkAllRead} 
                                            className="px-4 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95 bg-white text-[#5a6157] border border-[#2d342b]/10 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]"
                                        >
                                            <CheckCheck size={13} />
                                            Read all
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ─ Modal Content ─ */}
                            <div className="grow overflow-y-auto px-1 group/list custom-scrollbar">
                                {filteredNotis.length > 0 ? (
                                    <div className="divide-y divide-[#2d342b]/5">
                                        {paginatedNotis.map((n: NotificationData, idx: number) => {
                                            const entity = getEntityInfo(n);
                                            const hasAction = !!entity.id;
                                            return (
                                                <motion.div key={n.notificationId}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className={`relative px-8 py-6 transition-all group flex gap-6 cursor-pointer border-l-[4px] ${
                                                        !n.isRead 
                                                            ? 'bg-[#4caf50]/[0.02] border-l-[#4caf50]' 
                                                            : 'bg-white border-l-transparent hover:bg-[#fcfdfa]'
                                                    }`}
                                                    onClick={() => hasAction ? handleNotifNavigate(n) : handleMarkRead(n.notificationId)}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                                        !n.isRead ? 'bg-white border-[#4caf50]/20 shadow-sm' : 'bg-[#f4f7f1] border-transparent'
                                                    }`}>
                                                        <TypeIcon type={resolveNotiType(n.type)} size={22} />
                                                    </div>
                                                    <div className="grow min-w-0">
                                                        <div className="flex justify-between items-start gap-4 mb-1.5">
                                                            <h4 className={`text-[16px] font-black leading-snug line-clamp-1 ${!n.isRead ? 'text-[#1a1f18]' : 'text-[#2d342b]/85'}`}>
                                                                {n.title}
                                                            </h4>
                                                            <span className="text-[10px] font-black px-3 py-1 bg-[#2d342b]/5 text-[#4b5249] rounded-full shrink-0 uppercase tracking-wider">
                                                                {formatDate(n.createdAt)}
                                                            </span>
                                                        </div>
                                                        {getNotifContent(n) && (
                                                            <p className="text-[14px] text-[#2d342b]/80 leading-relaxed line-clamp-2 mb-4 font-medium">{getNotifContent(n)}</p>
                                                        )}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                {entity.type && (
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-[3px] rounded-md ${
                                                                        entity.type === 'review' 
                                                                            ? 'bg-purple-100 text-purple-800' 
                                                                            : 'bg-emerald-100 text-emerald-800'
                                                                    }`}>
                                                                        {entity.type === 'review' ? '● Review Task' : '● Develop Task'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {hasAction && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleNotifNavigate(n);
                                                                        }}
                                                                        disabled={loadingNotifId === n.notificationId}
                                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all active:scale-95 border bg-white text-[#1a1f18] border-[#2d342b]/15 hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50]"
                                                                    >
                                                                        {loadingNotifId === n.notificationId ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                {entity.type === 'review' ? 'Review detail' : 'Task detail'}
                                                                                <ChevronRight size={12} />
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f4f7f1' }}>
                                            <BellRing size={28} className="text-on-surface-variant/20" />
                                        </div>
                                        <p className="text-lg font-bold text-on-surface/30">No notifications found</p>
                                        <p className="text-sm text-on-surface-variant/20 mt-1">Try adjusting your filters or search</p>
                                    </div>
                                )}
                            </div>

                            {/* ─ Modal Footer ─ */}
                            {totalNotiPages > 1 && (
                                <div className="shrink-0 px-10 py-6 flex justify-between items-center border-t border-[#2d342b]/8 bg-[#fcfdfa]">
                                    <button 
                                        disabled={notiPage === 0}
                                        onClick={() => setNotiPage(p => Math.max(0, p - 1))}
                                        className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant disabled:opacity-20 hover:bg-on-surface/5 px-4 py-2.5 rounded-xl transition-all"
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                    
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: totalNotiPages }).map((_, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setNotiPage(i)}
                                                className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-all ${
                                                    notiPage === i 
                                                        ? 'text-white shadow-md' 
                                                        : 'bg-transparent text-on-surface-variant hover:bg-on-surface/5'
                                                }`}
                                                style={notiPage === i ? { background: '#4caf50' } : {}}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        disabled={notiPage >= totalNotiPages - 1}
                                        onClick={() => setNotiPage(p => p + 1)}
                                        className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant disabled:opacity-20 hover:bg-on-surface/5 px-4 py-2.5 rounded-xl transition-all"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ Accept Confirmation Modal ═══ */}
            <AnimatePresence>
                {confirmState.open && (
                    <>
                        <motion.div key="confirm-backdrop" 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000]" 
                            style={{ background: 'rgba(45,47,44,0.3)', backdropFilter: 'blur(12px)' }}
                            onClick={() => setConfirmState(prev => ({ ...prev, open: false }))} />
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
                                        {confirmState.type === 'task' ? 'Accept New Task?' : 'Accept Review?'}
                                    </h3>
                                    
                                    <p className="text-base text-[#5a6157] leading-relaxed px-4">
                                        Would you like to start working on this? This will update the status to <span className="font-extrabold text-[#4caf50]">In Progress</span>.
                                    </p>
                                </div>

                                {/* Entity Details Card */}
                                <div className="px-8 py-3">
                                    <div className="bg-[#f4f7f1]/60 rounded-2xl p-4 border border-[#4caf50]/10 text-center">
                                        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#8a9186] mb-1.5">Project Assignment</p>
                                        <p className="text-[15px] font-bold text-[#2d342b] leading-tight">{confirmState.name}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-8 pb-10 pt-6 flex flex-col gap-3">
                                    <button 
                                        onClick={handleConfirmAccept} 
                                        disabled={confirmState.loading}
                                        className="w-full py-4.5 rounded-2xl text-[16px] font-black tracking-wide transition-all bg-[#4caf50] text-white hover:brightness-105 active:scale-[0.97] flex items-center justify-center gap-3 shadow-[0_12px_24px_rgba(76,175,80,0.3)] disabled:opacity-50"
                                    >
                                        {confirmState.loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                        {confirmState.loading ? 'Accepting...' : 'Yes, start now'}
                                    </button>
                                    
                                    <button 
                                        onClick={() => setConfirmState(prev => ({ ...prev, open: false }))} 
                                        disabled={confirmState.loading}
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
        </header>
    );
}
