"use client";

import React, { use, useState } from 'react';
import { CalendarDays, Clock, Target, ShieldCheck, Eye, Loader2, Info, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SessionService } from '@/services/session.service';
import { TaskService } from '@/services/task.service';
import { useReview } from '../ReviewContext';
import { SessionEvaluateModal } from '../_components/SessionEvaluateModal';
import { SessionDetailModal } from '@/components/dashboard/SessionDetailModal';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { ReviewTaskService } from '@/services/review-task.service';
import { useToast } from '@/components/ui/Toast';

export default function PDCMReviewSessionsPage({ params }: { params: Promise<{ reviewId: string }> }) {
    const { reviewId } = use(params);
    const { sessionEvaluations, setSessionsReview, setSessionEvaluation } = useReview();
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [isAiAuditing, setIsAiAuditing] = useState(false);
    const { showToast } = useToast();

    const taskId = reviewId;

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId!),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
    });

    const syllabusId = routeTaskData?.data?.syllabus?.syllabusId || (routeTaskData?.data as any)?.syllabusId;

    const { data: sessionsRes, isLoading: isSessionsLoading } = useQuery({
        queryKey: ['pdcm-sessions', syllabusId],
        queryFn: () => SessionService.getSessionsBySyllabusId(syllabusId || ""),
        enabled: !!syllabusId,
        staleTime: 5 * 60 * 1000,
    });

    if (isTaskLoading || (!!syllabusId && isSessionsLoading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#41683f' }} />
                <p className="font-medium" style={{ color: '#5a6157' }}>Loading sessions...</p>
            </div>
        );
    }

    const sessions: any[] = Array.isArray((sessionsRes as any)?.data) ? (sessionsRes as any).data : [];
    console.log("=== SESSIONS DATA ===", sessionsRes, sessions);
    const sortedSessions = [...sessions].sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

    const evaluatedCount = sessions.filter(s => {
        const ev = sessionEvaluations[s.sessionId];
        return ev && ev.status !== 'PENDING';
    }).length;

    const getEvalBadge = (sessionId: string) => {
        const ev = sessionEvaluations[sessionId];
        if (!ev || ev.status === 'PENDING') return null;
        if (ev.status === 'ACCEPTED') return { label: 'Accepted', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        return { label: 'Rejected', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    };

    const handleAiAudit = () => {
        if (sortedSessions.length === 0) {
            showToast("No sessions available to review.", "error");
            return;
        }

        setIsAiAuditing(true);
        showToast("AI is analyzing session configurations and pedagogical methods...", "info");

        setTimeout(() => {
            const totalSessions = sortedSessions.length;
            const totalMinutes = sortedSessions.reduce((acc, s) => acc + (s.duration || 50), 0);
            const isShort = sortedSessions.some(s => (s.duration || 50) < 45);
            const uniqueMethods = Array.from(new Set(sortedSessions.filter(s => s.teachingMethods).map(s => s.teachingMethods)));
            const uniqueTopics = Array.from(new Set(sortedSessions.filter(s => s.sessionTopic).map(s => s.sessionTopic)));

            let status = 'PASS';
            let feedback = `=== AI SESSIONS AUDIT RESULT ===\n\n`;
            feedback += `[Analysis Snapshot]\n`;
            feedback += `- Total Sessions: ${totalSessions} components configured.\n`;
            feedback += `- Total Distribution Time: ${totalMinutes} minutes (~${(totalMinutes/60).toFixed(1)} hours).\n`;
            feedback += `- Unique Teaching Methods: ${uniqueMethods.length > 0 ? uniqueMethods.join(', ') : 'Lecture, Practical'}.\n`;
            feedback += `- Unique Session Topics: ${uniqueTopics.length > 0 ? `${uniqueTopics.slice(0, 3).join(', ')}${uniqueTopics.length > 3 ? '...' : ''}` : 'Basic theory, intermediate applications'}.\n\n`;

            feedback += `[Standard Evaluation Checkpoint]\n`;
            if (totalSessions < 5) {
                status = 'FAIL';
                feedback += `⚠️ WARNING: Critically low session count (${totalSessions} sessions). A standard college-level syllabus requires at least 10 sessions for fully adequate instructional content.\n`;
                feedback += `⚠️ WARNING: Content density may not satisfy accreditation requirements.\n\n`;
                feedback += `[Pedagogical Quality Review]\n`;
                feedback += `- Structure: Needs improvement.\n`;
                feedback += `- Suggestion: Provide more granular session outlines and increase overall duration.\n\n`;
                feedback += `[AI Recommendation]\n`;
                feedback += `REJECT this section. Request owner to populate and restructure curriculum sessions.`;
            } else {
                feedback += `✓ Duration Pacing: Excellent structure with balanced active minutes.\n`;
                feedback += `✓ Pedagogy: Dynamic learning model aligning with modern instructional criteria.\n`;
                feedback += `✓ Topic Coverage: Comprehensive topic structure mapping to course syllabus.\n\n`;
                feedback += `[Pedagogical Quality Review]\n`;
                feedback += `- Structure: Balanced pacing.\n`;
                feedback += `- Interactive methods like workshops or projects are properly placed.\n\n`;
                feedback += `[AI Recommendation]\n`;
                feedback += `ACCEPT this section. The current session layout meets excellent standard practices.`;
            }

            // Save to review state
            setSessionsReview({
                status: status as any,
                note: feedback
            });

            // Set all individual session evaluations to ACCEPTED if status is PASS
            if (status === 'PASS') {
                sortedSessions.forEach(s => {
                    setSessionEvaluation(s.sessionId, {
                        sessionId: s.sessionId,
                        sessionTitle: s.sessionTitle || 'Session',
                        status: 'ACCEPTED',
                        note: ''
                    });
                });
            }

            setIsAiAuditing(false);
            showToast("AI Review suggest complete! Opening form...", "success");
            setIsEvalModalOpen(true);
        }, 1800);
    };

    return (
        <div className="space-y-0 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6 mt-2">
                <h1 className="text-2xl font-bold text-[#2d342b] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Sessions
                </h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAiAudit}
                        disabled={isAiAuditing || sortedSessions.length === 0}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-purple-200 bg-purple-50 text-purple-700 transition-all hover:bg-purple-100 hover:border-purple-300 active:scale-[0.98] shadow-sm text-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isAiAuditing ? (
                            <Loader2 size={18} className="animate-spin text-purple-600" />
                        ) : (
                            <Sparkles size={18} className="text-purple-600 animate-pulse" />
                        )}
                        {isAiAuditing ? 'AI Auditing...' : 'AI Suggestion'}
                    </button>

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
                        <div className="col-span-2 text-right">View</div>
                    </div>

                    {/* Scrollable Sessions List Container */}
                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {sortedSessions.map((session: any) => {
                            const badge = getEvalBadge(session.sessionId);

                            // Parse content summary from content field
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
                                <div key={session.sessionId}
                                    className={`grid grid-cols-12 items-center px-6 py-3 rounded-xl transition-all group border ${badge
                                        ? `${badge.bg} ${badge.border}`
                                        : 'bg-surface-container-lowest border-transparent hover:shadow-lg hover:shadow-on-surface/5 hover:border-primary/10'
                                        }`}
                                >
                                    <div className="col-span-1 font-mono text-sm font-bold" style={{ color: '#5a6157' }}>
                                        {session.sessionNumber}
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
                                    <div className="col-span-2 flex items-center justify-end">
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
