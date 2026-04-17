"use client";

import React, { use, useState } from 'react';
import { CalendarDays, Clock, Target, ShieldCheck, Eye, Loader2, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SessionService } from '@/services/session.service';
import { TaskService } from '@/services/task.service';
import { useReview } from '../ReviewContext';
import { SessionEvaluateModal } from '../_components/SessionEvaluateModal';
import { SessionDetailModal } from '@/components/dashboard/SessionDetailModal';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { ReviewTaskService } from '@/services/review-task.service';

export default function PDCMReviewSessionsPage({ params }: { params: Promise<{ reviewId: string }> }) {
    const { reviewId } = use(params);
    const { sessionEvaluations } = useReview();
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    const { data: reviewTaskRes, isLoading: isReviewTaskLoading } = useQuery({
        queryKey: ['pdcm-review-detail', reviewId],
        queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
        enabled: !!reviewId,
        staleTime: 5 * 60 * 1000,
    });

    const taskId = reviewTaskRes?.data?.task?.taskId;

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId!),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
    });

    const syllabusId = (routeTaskData?.data as any)?.syllabusId || routeTaskData?.data?.syllabus?.syllabusId;

    const { data: sessionsRes, isLoading: isSessionsLoading } = useQuery({
        queryKey: ['pdcm-sessions', syllabusId],
        queryFn: () => SessionService.getDetailedSessions(syllabusId || "", 0, 100),
        enabled: !!syllabusId,
        staleTime: 5 * 60 * 1000,
    });

    if (isReviewTaskLoading || isTaskLoading || (!!syllabusId && isSessionsLoading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#41683f' }} />
                <p className="font-medium" style={{ color: '#5a6157' }}>Loading sessions...</p>
            </div>
        );
    }

    const sessions: any[] = (sessionsRes as any)?.data?.content || [];
    const sortedSessions = [...sessions].sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

    const evaluatedCount = sessions.filter(s => {
        const ev = sessionEvaluations[s.session];
        return ev && ev.status !== 'PENDING';
    }).length;

    const getEvalBadge = (sessionId: string) => {
        const ev = sessionEvaluations[sessionId];
        if (!ev || ev.status === 'PENDING') return null;
        if (ev.status === 'ACCEPTED') return { label: 'Accepted', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        return { label: 'Rejected', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    };

    return (
        <div className="space-y-0 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6 mt-2">
                <h1 className="text-2xl font-bold text-[#2d342b] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Sessions
                </h1>

                <button
                    onClick={() => setIsEvalModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md text-sm text-white"
                    style={{ backgroundColor: '#4caf50' }}
                >
                    <ShieldCheck size={18} />
                    Evaluate Now
                    {evaluatedCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">
                            {evaluatedCount}/{sortedSessions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Empty State ── */}
            {sortedSessions.length === 0 && (
                <div className="text-center py-24 rounded-2xl" style={{ background: '#ffffff', border: '2px dashed #adb4a8' }}>
                    <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                        <CalendarDays size={48} />
                    </div>
                    <h3 className="font-bold mt-4 mb-2" style={{ color: '#5a6157', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Sessions Found</h3>
                    <p className="text-sm" style={{ color: '#adb4a8' }}>
                        No curriculum sessions have been submitted for this syllabus yet.
                    </p>
                </div>
            )}

            {/* ── Editorial Table — matches develop page ── */}
            {sortedSessions.length > 0 && (
                <div className="space-y-6">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/10">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">Session Title</div>
                        <div className="col-span-4">Content Summary</div>
                        <div className="col-span-2">Teaching Method</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1 text-right">View</div>
                    </div>

                    {/* Scrollable Sessions List Container */}
                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {sortedSessions.map((session: any) => {
                            const badge = getEvalBadge(session.session);

                            // Parse content summary from material and block arrays
                            let contentParts: Array<{ heading: string; detail: string }> = [];

                            if (Array.isArray(session.material) && session.material.length > 0) {
                                // Extract materials and their corresponding blocks if any
                                contentParts = session.material.map((mat: any) => {
                                    const blocksForMat = Array.isArray(session.block)
                                        ? session.block.map((b: any) => b.content || b.blockName || 'Value').join(', ')
                                        : '';

                                    return {
                                        heading: mat.materialName || 'Chapter',
                                        detail: blocksForMat || 'Selected'
                                    };
                                });
                            } else if (session.content) {
                                // Fallback to legacy content field
                                try {
                                    const parsed = JSON.parse(session.content);
                                    if (Array.isArray(parsed)) {
                                        contentParts = parsed.slice(0, 3).map((item: any) => ({
                                            heading: item.materialTitle || 'Section',
                                            detail: (item.blockNames && item.blockNames.length > 0)
                                                ? item.blockNames.join(', ')
                                                : (item.blockName || 'Selected')
                                        }));
                                    }
                                } catch {
                                    if (session.content.trim()) {
                                        contentParts = [{ heading: 'Content', detail: session.content.substring(0, 120) }];
                                    }
                                }
                            }

                            return (
                                <div key={session.session}
                                    className={`grid grid-cols-12 items-center px-6 py-3 rounded-xl transition-all group border ${badge
                                        ? `${badge.bg} ${badge.border}`
                                        : 'bg-surface-container-lowest border-transparent hover:shadow-lg hover:shadow-on-surface/5 hover:border-primary/10'
                                        }`}
                                >
                                    <div className="col-span-1 font-mono text-[10px]" style={{ color: '#5a6157' }}>
                                        #{String(session.sessionNumber).padStart(3, '0')}
                                    </div>
                                    <div className="col-span-3">
                                        <h4 className="text-sm font-black leading-tight uppercase tracking-tight" style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {session.sessionTitle || `Session ${session.sessionNumber}`}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1" style={{ color: '#5a6157' }}>
                                            <span className="text-[9px] font-bold text-slate-400">• {session.duration || 50} MIN</span>
                                        </div>
                                    </div>
                                    <div className="col-span-4 pr-8">
                                        {contentParts.length > 0 ? (
                                            <div className="space-y-2">
                                                {contentParts.map((part, pi) => (
                                                    <div key={pi}>
                                                        <h5 className="text-[10px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#41683f' }}>
                                                            {part.heading}
                                                        </h5>
                                                        <p className="text-sm line-clamp-2" style={{ color: 'rgba(90,97,87,0.8)' }}>
                                                            {part.detail}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic" style={{ color: '#adb4a8' }}>No content assigned.</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest">
                                            {session.teachingMethods || 'Lecture'}
                                        </span>
                                    </div>
                                    <div className="col-span-1">
                                        {badge ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${badge.color} ${badge.bg} border ${badge.border}`}>
                                                {badge.label}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-surface-variant text-on-surface-variant">
                                                PENDING
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end">
                                        <button
                                            onClick={() => {
                                                setSelectedSession(session);
                                                setIsDetailModalOpen(true);
                                            }}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/10 active:scale-90"
                                            title="View Details & CLO Mapping"
                                        >
                                            <Eye size={13} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Session Detail Modal */}
            <SessionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                session={selectedSession}
                subjectId={routeTaskData?.data?.subjectId}
            />

            {/* Session Evaluate Modal */}
            <SessionEvaluateModal
                isOpen={isEvalModalOpen}
                onClose={() => setIsEvalModalOpen(false)}
                sessions={sessions.map((s: any) => ({
                    sessionId: s.sessionId,
                    sessionNumber: s.sessionNumber,
                    sessionTitle: s.sessionTitle,
                    teachingMethods: s.teachingMethods,
                    duration: s.duration,
                }))}
                taskId={reviewId}
            />

        </div>
    );
}
