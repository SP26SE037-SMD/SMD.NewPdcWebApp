"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, X, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
    Info, BellRing, Search, CheckCheck, Filter, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    markNotificationRead,
    markAllNotificationsRead,
    dismissLatestNotification,
} from '@/store/slices/notificationSlice';
import { NotificationData } from '@/types/notification';
import { TaskService } from '@/services/task.service';
import { ReviewTaskService } from '@/services/review-task.service';

function getEntityInfo(n: NotificationData): { type: 'task' | 'review' | 'curriculum' | null; id: string | null } {
    if (n.taskId) return { type: 'task', id: n.taskId };
    if (n.reviewId) return { type: 'review', id: n.reviewId };
    if ((n as any).curriculumId) return { type: 'curriculum', id: (n as any).curriculumId };
    const entityType = (n.relatedEntityType || '').toUpperCase();
    const entityId = n.relatedEntityId || null;
    if (!entityId) return { type: null, id: null };
    if (entityType.includes('REVIEW') || entityType === 'REVIEW_TASK') return { type: 'review', id: entityId };
    if (entityType.includes('CURRICULUM')) return { type: 'curriculum', id: entityId };
    if (entityType.includes('TASK') || entityType === 'SYLLABUS_DEVELOP' || entityType === 'SYLLABUS') return { type: 'task', id: entityId };
    return { type: null, id: entityId };
}

function getNotifContent(n: NotificationData): string {
    return n.message || n.content || '';
}

export type NotiType = 'success' | 'warning' | 'info' | 'system';

export const TypeIcon = ({ type, size = 16 }: { type: NotiType; size?: number }) => {
    switch (type) {
        case 'success': return <CheckCircle2 size={size} className="text-emerald-500" />;
        case 'warning': return <AlertCircle size={size} className="text-amber-500" />;
        case 'info': return <Info size={size} className="text-sky-500" />;
        case 'system': return <BellRing size={size} className="text-[#4caf50]" />;
        default: return <Bell size={size} className="text-gray-400" />;
    }
};

function resolveNotiType(typeStr: string): NotiType {
    const t = typeStr?.toLowerCase() || '';
    if (t.includes('success') || t.includes('approved') || t.includes('accepted')) return 'success';
    if (t.includes('warning') || t.includes('deadline') || t.includes('urgent')) return 'warning';
    if (t.includes('system') || t.includes('broadcast')) return 'system';
    return 'info';
}

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

export const NotificationPanel = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const {
        notifications,
        unreadCount,
        isLoading: notiLoading,
        latestRealtimeNotification,
    } = useSelector((state: RootState) => state.notification);
    
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isAllNotiModalOpen, setIsAllNotiModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    
    const [notiPage, setNotiPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingNotifId, setLoadingNotifId] = useState<string | null>(null);
    const [filterUnread, setFilterUnread] = useState(false);
    
    const notiRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setIsNotiOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleNotifNavigate = useCallback(async (n: NotificationData) => {
        const entity = getEntityInfo(n);
        if (!entity.id || !entity.type) return;
        setLoadingNotifId(n.notificationId);
        dispatch(markNotificationRead(n.notificationId));
        
        try {
            const role = user?.role || '';
            setIsNotiOpen(false); setIsAllNotiModalOpen(false);

            // ROLE: VICE PRINCIPAL (VP)
            if (role === 'VP') {
                if (entity.type === 'curriculum') {
                    router.push(`/dashboard/vice-principal/curriculums/${entity.id}/review`);
                } else {
                    router.push(`/dashboard/vice-principal/digital-enactment`);
                }
                setLoadingNotifId(null);
                return;
            }

            // ROLE: HOPDC
            if (role === 'HOPDC') {
                if (entity.type === 'review') {
                    router.push(`/dashboard/hopdc/reviews/${entity.id}`);
                } else if (entity.type === 'task') {
                    router.push(`/dashboard/hopdc/assignments`);
                }
                setLoadingNotifId(null);
                return;
            }

            // ROLE: PDCM
            if (role === 'PDCM') {
                if (entity.type === 'task') {
                    const res = await TaskService.getTaskById(entity.id);
                    const task = res?.data;
                    if (task) {
                        const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
                        if (status === 'TO_DO') {
                            setLoadingNotifId(null);
                            return; // Open confirm modal logic would be handled here if needed in PDCM scope
                        }
                        const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                        router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                    } else {
                        router.push(`/dashboard/pdcm/tasks/${entity.id}/information`);
                    }
                } else if (entity.type === 'review') {
                    const res = await ReviewTaskService.getReviewTaskById(entity.id);
                    const review = res?.data;
                    if (review) {
                        const status = (review.status || '').toUpperCase().replace(/\s+/g, '_');
                        if (status === 'PENDING') {
                            setLoadingNotifId(null);
                            return; // Open confirm modal logic would be handled here
                        }
                        router.push(`/dashboard/pdcm/reviews/${review.reviewId}/information`);
                    } else {
                        router.push(`/dashboard/pdcm/reviews/${entity.id}/information`);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch entity detail:', err);
            // Fallback routing
            if (user?.role === 'PDCM') {
                if (entity.type === 'task') router.push(`/dashboard/pdcm/tasks/${entity.id}/information`);
                else if (entity.type === 'review') router.push(`/dashboard/pdcm/reviews/${entity.id}/information`);
            }
        } finally {
            setLoadingNotifId(null);
        }
    }, [dispatch, router, user?.role]);

    return (
        <>
            <div className="relative" ref={notiRef}>
                <button 
                    onClick={() => setIsNotiOpen(!isNotiOpen)}
                    className={`relative p-2.5 transition-all rounded-full group ${isNotiOpen ? 'bg-[#4caf50]/10 text-[#4caf50] shadow-inner' : 'text-[#5a6157] hover:text-[#4caf50] hover:bg-[#4caf50]/5'}`}
                >
                    <Bell size={20} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full ring-2 ring-white flex items-center justify-center translate-x-1/4 -translate-y-1/4" style={{ zIndex: 10 }}>
                            <span className="text-[9px] font-black text-white leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        </div>
                    )}
                </button>

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
                                <div className="h-1 bg-gradient-to-r from-[#4caf50] to-emerald-400" />
                                <div className="px-4 py-3.5 flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#4caf50]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <BellRing size={18} className="text-[#4caf50]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-[#4caf50] uppercase tracking-widest mb-0.5">New notification</p>
                                        <p className="text-[13px] font-bold text-[#2d342b] truncate">{latestRealtimeNotification.title}</p>
                                        <p className="text-[11px] text-[#5a6157] line-clamp-1 mt-0.5 opacity-70">{latestRealtimeNotification.message || latestRealtimeNotification.content}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(dismissLatestNotification());
                                        }}
                                        className="p-1 rounded-lg hover:bg-black/5 text-[#5a6157]/40 hover:text-[#5a6157] transition-colors shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="h-[2px] bg-black/5">
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
                                                {unreadCount > 0 ? `${unreadCount} NEW UPDATES` : ''}
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

                            <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                {notiLoading && notifications.length === 0 ? (
                                    <div className="flex items-center justify-center py-14">
                                        <Loader2 className="animate-spin text-[#4caf50]" size={24} />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#f4f7f1' }}>
                                            <BellRing size={24} className="text-[#5a6157]/30" />
                                        </div>
                                        <p className="text-sm font-bold text-[#2d342b]/40">No Notification</p>
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
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm' : 'bg-[#2d342b]/[0.04]'}`}>
                                                    <TypeIcon type={resolveNotiType(n.type)} size={16} />
                                                </div>
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
                                                                    : entity.type === 'curriculum'
                                                                        ? 'bg-blue-50 text-blue-600'
                                                                        : 'bg-emerald-50 text-emerald-600'
                                                            }`}>
                                                                {entity.type === 'review' ? '● Review' : entity.type === 'curriculum' ? '● Curriculum' : '● Task'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                                    All Notification
                                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1.5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {isAllNotiModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
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
                                                    Notification
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
                                                                            : entity.type === 'curriculum'
                                                                                ? 'bg-blue-100 text-blue-800'
                                                                                : 'bg-emerald-100 text-emerald-800'
                                                                    }`}>
                                                                        {entity.type === 'review' ? '● Review Task' : entity.type === 'curriculum' ? '● Curriculum Review' : '● Develop Task'}
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
                                            <BellRing size={28} className="text-[#5a6157]/20" />
                                        </div>
                                        <p className="text-lg font-bold text-[#2d342b]/30">No notifications found</p>
                                        <p className="text-sm text-[#5a6157]/20 mt-1">Try adjusting your filters or search</p>
                                    </div>
                                )}
                            </div>

                            {totalNotiPages > 1 && (
                                <div className="shrink-0 px-10 py-6 flex justify-between items-center border-t border-[#2d342b]/8 bg-[#fcfdfa]">
                                    <button 
                                        disabled={notiPage === 0}
                                        onClick={() => setNotiPage(p => Math.max(0, p - 1))}
                                        className="flex items-center gap-1.5 text-[12px] font-bold text-[#5a6157] disabled:opacity-20 hover:bg-[#2d342b]/5 px-4 py-2.5 rounded-xl transition-all"
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
                                                        ? 'bg-[#4caf50] text-white shadow-sm' 
                                                        : 'hover:bg-[#2d342b]/5 text-[#5a6157]'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        disabled={notiPage >= totalNotiPages - 1}
                                        onClick={() => setNotiPage(p => Math.min(totalNotiPages - 1, p + 1))}
                                        className="flex items-center gap-1.5 text-[12px] font-bold text-[#5a6157] disabled:opacity-20 hover:bg-[#2d342b]/5 px-4 py-2.5 rounded-xl transition-all"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
