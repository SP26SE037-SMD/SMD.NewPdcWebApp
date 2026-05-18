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
import { MappingService } from '@/services/mapping.service';

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

    const handleAiAudit = async () => {
        if (sortedSessions.length === 0) {
            showToast("No sessions available to review.", "error");
            return;
        }

        setIsAiAuditing(true);
        showToast("AI is analyzing session configurations and pedagogical methods...", "info");

        try {
            // 1. Prepare sessions payload
            const sessionsPayload = sortedSessions.map(s => ({
                syllabusId: s.syllabusId || syllabusId || "",
                sessionNumber: s.sessionNumber,
                sessionTitle: s.sessionTitle || "",
                teachingMethods: s.teachingMethods || "",
                sessionTopic: s.sessionTopic || "",
                sessionType: s.sessionType || "",
                duration: s.duration || 0
            }));

            // 2. Call Session validate API
            console.log("Calling Session validation API...");
            const sessionValidateRes = await SessionService.validateSessionsSyllabus(syllabusId || "", sessionsPayload);
            const sessionValidData = sessionValidateRes?.data;
            const isSessionsValid = sessionValidData?.valid !== false; // default true if not specified
            const sessionErrors = sessionValidData?.errors || [];
            const quotas = sessionValidData?.remainingQuotas || { theory: 0, practice: 0, selfStudy: 0 };

            // 3. Call CLO-Session Mapping GET API
            console.log("Calling CLO-Session Mapping GET API...");
            const mappingsRes = await MappingService.getSyllabusSessionMappings(syllabusId || "");
            const mappings = Array.isArray(mappingsRes?.data) ? mappingsRes.data : [];

            // 4. Map the fetched mappings to required payload pairs { cloId, sessionId }
            // Note: Since a session can be linked to multiple CLOs and a CLO can be linked to multiple sessions,
            // the response array contains multiple items representing this many-to-many relationship.
            const mappingsPayload = mappings.map((m: any) => ({
                cloId: m.cloId || m.clo_id || "",
                sessionId: m.sessionId || m.session_id || ""
            })).filter(pair => pair.cloId && pair.sessionId);

            // 5. Call Mapping validate API
            console.log("Calling Mapping validation API with payload:", mappingsPayload);
            const mappingsValidateRes = await MappingService.validateSyllabusSessionMappings(syllabusId || "", mappingsPayload);
            const mappingValidData = mappingsValidateRes?.data;
            const isMappingsValid = mappingValidData?.is_valid !== false; // default true if not specified
            const isAllClosMapped = mappingValidData?.is_all_clos_mapped !== false;
            const isAllSessionsMapped = mappingValidData?.is_all_sessions_mapped !== false;
            const unmappedClos = mappingValidData?.unmapped_clos || [];
            const unmappedSessions = mappingValidData?.unmapped_sessions || [];
            const mappingsList = mappingValidData?.data || [];

            // 6. Build Feedback Markdown
            let status = (isSessionsValid && isMappingsValid) ? 'PASS' : 'FAIL';
            let feedback = `=== AI SESSIONS & MAPPINGS AUDIT RESULT ===\n\n`;

            feedback += `[1. Sessions Allocation Review]\n`;
            feedback += `✓ Status: ${isSessionsValid ? 'VALID' : 'INVALID'}\n`;
            feedback += `- Total Sessions: ${sortedSessions.length} configured.\n`;
            feedback += `- Session Pacing Quotas:\n`;
            feedback += `  • Theory (Lý thuyết): ${quotas.theory || 0} hours remaining.\n`;
            feedback += `  • Practice (Thực hành): ${quotas.practice || 0} hours remaining.\n`;
            feedback += `  • Self-Study (Tự học): ${quotas.selfStudy || 0} hours remaining.\n\n`;

            if (sessionErrors.length > 0) {
                feedback += `⚠️ SESSION VALIDATION WARNINGS/ERRORS:\n`;
                sessionErrors.forEach((err: any) => {
                    feedback += `  • [Week ${err.week || 'N/A'}] (Code: ${err.code || 'ERR'}): ${err.message || 'Validation error'}\n`;
                });
                feedback += `\n`;
            }

            feedback += `[2. CLO-Session Mappings Review]\n`;
            feedback += `✓ Status: ${isMappingsValid ? 'VALID' : 'INVALID'}\n`;
            feedback += `- All CLOs Mapped: ${isAllClosMapped ? 'Yes' : 'No'}\n`;
            feedback += `- All Sessions Mapped: ${isAllSessionsMapped ? 'Yes' : 'No'}\n\n`;

            if (unmappedClos.length > 0) {
                feedback += `⚠️ UNMAPPED CLOs DETECTED:\n`;
                unmappedClos.forEach((clo: any) => {
                    feedback += `  • CLO [${clo.clo_code || clo.cloCode || 'N/A'}]: ${clo.suggestion || 'Please map to appropriate sessions.'}\n`;
                });
                feedback += `\n`;
            }

            if (unmappedSessions.length > 0) {
                feedback += `⚠️ UNMAPPED SESSIONS DETECTED:\n`;
                unmappedSessions.forEach((s: any) => {
                    feedback += `  • Session [${s.chapter_title || s.chapterTitle || s.sessionTitle || 'N/A'}]: ${s.suggestion || 'Please map to corresponding CLOs.'}\n`;
                });
                feedback += `\n`;
            }

            if (mappingsList.length > 0) {
                feedback += `[3. AI Alignment Analysis]\n`;
                mappingsList.slice(0, 5).forEach((m: any) => {
                    feedback += `  • Link [Session ↔ CLO]: Confidence Score = ${m.confidence_score || m.confidenceScore || 0}%\n`;
                    if (m.reasoning) {
                        feedback += `    Reasoning: ${m.reasoning}\n`;
                    }
                });
                if (mappingsList.length > 5) {
                    feedback += `  • And ${mappingsList.length - 5} other mapping links successfully evaluated.\n`;
                }
                feedback += `\n`;
            }

            feedback += `[AI Recommendation]\n`;
            if (status === 'PASS') {
                feedback += `ACCEPT this section. All structural session pacing and CLO-session mapping constraints are fully satisfied.`;
            } else {
                feedback += `REJECT this section. Remediation required for the items listed above.`;
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

        } catch (error: any) {
            console.error("AI API validation failed:", error);
            showToast(`Gợi ý AI thất bại: ${error.message || error}`, "error");
            setIsAiAuditing(false);
        }
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
