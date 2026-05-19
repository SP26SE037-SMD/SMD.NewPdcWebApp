"use client";

import React, { use } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SyllabusService } from '@/services/syllabus.service';
import { MaterialService } from '@/services/material.service';
import { SessionService } from '@/services/session.service';
import { AssessmentService } from '@/services/assessment.service';

import { TaskService } from '@/services/task.service';
import { ReviewTaskService } from '@/services/review-task.service';
import { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';
import { ReviewProvider, useReview } from './ReviewContext';
import { ConfirmReviewModal } from './_components/ConfirmReviewModal';
import { Send } from 'lucide-react';
import { useToast } from "@/components/ui/Toast";

function PDCMReviewContent({
    children,
    reviewId,
    task,
    isLoading,
    sidebarItems,
    globalHeaderTabs,
    sidebarSubContent,
    router
}: {
    children: React.ReactNode;
    reviewId: string;
    task: any;
    isLoading: boolean;
    sidebarItems: any[];
    globalHeaderTabs: any[];
    sidebarSubContent: React.ReactNode;
    router: any;
}) {
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const {
        syllabusReview,
        materialsReview,
        sessionsReview,
        assessmentsReview,
        materialEvaluations,
        sessionEvaluations,
        assessmentEvaluations
    } = useReview();
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Detect if we are in Material Detail view
    const isMaterialDetail = pathname.includes('/materials/') && pathname.split('/').length > 6;

    const handleSendReview = async (_status: 'APPROVED' | 'REVISION_REQUESTED', _notes: { material: string; session: string; assessment: string }) => {
        if (!task) return;
        setIsSubmitting(true);
        try {
            // 1. Get current user's accountId
            let reviewerId = '';
            try {
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    reviewerId = meData?.user?.accountId || meData?.user?.id || '';
                }
            } catch {
                console.warn('Could not fetch current user, reviewerId will be empty');
            }

            const taskId: string = task?.taskId || task?.task?.taskId || (task as any)?.taskId || reviewId;

            // Helper: build a section comment in consistent format
            const buildSectionComment = (evals: Record<string, any>, idKey: string): string => {
                const entries = Object.entries(evals);
                if (entries.length === 0) return 'No items evaluated.';
                const hasRejections = entries.some(([, ev]) => ev.status !== 'ACCEPTED');
                if (!hasRejections) return 'All are accept';
                return entries.map(([, ev]) => {
                    const id = ev[idKey] || Object.keys(ev).find(k => k.endsWith('Id')) && ev[Object.keys(ev).find(k => k.endsWith('Id'))!] || 'unknown';
                    if (ev.status === 'ACCEPTED') return `+ ${id}: accept`;
                    return `+ ${id}: ${ev.note || 'rejected'}`;
                }).join('\n');
            };

            // 2. Material comment
            const matEvals: Record<string, any> = (() => {
                try {
                    const saved = localStorage.getItem(`pdcm-review-materials-${reviewId}`);
                    return saved ? JSON.parse(saved) : {};
                } catch { return {}; }
            })();
            const materialComment = buildSectionComment(matEvals, 'materialId');

            // 3. Session comment — overall verdict
            const sessionReviewData = (() => {
                try {
                    const saved = localStorage.getItem(`pdcm-review-sessions-summary-${reviewId}`);
                    return saved ? JSON.parse(saved) : sessionsReview;
                } catch { return sessionsReview; }
            })();
            const sessionComment = (sessionReviewData?.status === 'PASS' || sessionReviewData?.status === 'ACCEPTED')
                ? 'accept'
                : (sessionReviewData?.note ? (() => {
                    try {
                        const inner = JSON.parse(sessionReviewData.note);
                        return inner?.reviewerComment || inner?.aiResult?.conclusion || sessionReviewData.note;
                    } catch { return sessionReviewData.note; }
                })() : (sessionReviewData?.status || 'No session review.'));

            // 4. Assessment comment — overall verdict
            const assessReviewData = (() => {
                try {
                    const saved = localStorage.getItem(`pdcm-review-assessments-summary-${reviewId}`);
                    return saved ? JSON.parse(saved) : assessmentsReview;
                } catch { return assessmentsReview; }
            })();
            const assessmentComment = (assessReviewData?.status === 'PASS' || assessReviewData?.status === 'ACCEPTED')
                ? 'accept'
                : (assessReviewData?.note ? (() => {
                    try {
                        const inner = JSON.parse(assessReviewData.note);
                        return inner?.reviewerComment || inner?.aiResult?.conclusion || assessReviewData.note;
                    } catch { return assessReviewData.note; }
                })() : (assessReviewData?.status || 'No assessment review.'));


            const fullComment = [
                `Review for material:\n${materialComment}`,
                `Review for session: ${sessionComment}`,
                `Review for assessment: ${assessmentComment}`,
            ].join('\n');


            // 5. Call POST /api/v1/reviews-v2
            console.log('[Submit Review] Payload:', { taskId, reviewerId, comment: fullComment });
            const reviewRes = await fetch('/api/v1/reviews-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, reviewerId, comment: fullComment }),
            });

            if (!reviewRes.ok) {
                const errData = await reviewRes.json().catch(() => ({}));
                throw new Error(errData?.message || `Review submission failed (${reviewRes.status})`);
            }

            // 6. Update task status → DONE
            try {
                await fetch(`/api/v1/tasks-v2/${taskId}/status?status=DONE`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (statusErr) {
                console.warn('[Submit Review] Could not update task status to DONE:', statusErr);
            }

            // 7. Invalidate queries & navigate
            queryClient.invalidateQueries({ queryKey: ['pdcm-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['pdcm-review-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['pdcm-task-detail', reviewId] });

            showToast('Review submitted successfully! Task marked as done.', 'success');
            router.push('/dashboard/pdcm');

        } catch (err: any) {
            console.error('[Submit Review] Error:', err);
            showToast(err.message || 'Failed to submit review. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
            setIsConfirmModalOpen(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-[#5a6157] font-black uppercase tracking-widest text-[10px]">Loading Reviewer Workspace...</p>
                </div>
            </div>
        );
    }

    const isCompleted = task?.status && ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'].includes(task.status.toUpperCase());

    const submitReviewAction = !isCompleted ? {
        label: 'Submit Final Review',
        icon: 'send',
        onClick: () => setIsConfirmModalOpen(true)
    } : undefined;

    const activeTab = sidebarItems.find(t => t.isActive);

    return (
        <PDCMBaseLayout
            headerTitle="Reviewer Workspace"
            headerTabs={globalHeaderTabs}
            sidebarItems={isMaterialDetail ? undefined : sidebarItems}
            sidebarSubContent={isMaterialDetail ? undefined : sidebarSubContent}
            actionButton={isMaterialDetail ? undefined : submitReviewAction}
            onBack={isMaterialDetail ? undefined : () => router.push('/dashboard/pdcm')}
            hideHeader={isMaterialDetail}
            fullPage={isMaterialDetail}
        >
            {isMaterialDetail ? (
                children
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-primary-500 shadow-lg shadow-primary-500/20">
                            <span className="material-symbols-outlined text-[20px]">
                                {activeTab?.id === 'information' ? 'info' :
                                    activeTab?.id === 'materials' ? 'menu_book' :
                                        activeTab?.id === 'sessions' ? 'calendar_today' :
                                            activeTab?.id === 'assessments' ? 'assignment' : 'rate_review'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2d342b] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {activeTab?.label || "Workspace"}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.1em]">verification workflow active</p>
                                <span className="text-[#dee1d8]">•</span>
                                <p className="text-[9px] font-bold text-[#5a6157] uppercase tracking-[0.1em]">{task?.taskName || (task as any)?.titleTask || "Syllabus Audit"}</p>
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
            )}


            <ConfirmReviewModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleSendReview}
                isSubmitting={isSubmitting}
                taskTitle={task?.taskName || (task as any)?.titleTask || "Syllabus Audit"}
                reviews={{
                    syllabus: syllabusReview,
                    materials: materialsReview,
                    sessions: sessionsReview,
                    assessments: assessmentsReview
                }}
                evaluations={{
                    materials: materialEvaluations,
                    sessions: sessionEvaluations,
                    assessments: assessmentEvaluations
                }}
            />
        </PDCMBaseLayout>
    );
}

export default function PDCMReviewLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ reviewId: string }>
}) {
    const { reviewId } = use(params);
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: routeTaskData, isLoading } = useQuery({
        queryKey: ['pdcm-task-detail', reviewId], // reviewId is actually taskId now
        queryFn: () => TaskService.getTaskById(reviewId),
        enabled: !!reviewId,
        staleTime: 5 * 60 * 1000,
    });

    const task = routeTaskData?.data;

    const sid = task?.syllabus?.syllabusId || (task as any)?.syllabusId || task?.targetId || (task as any)?.target_id;

    React.useEffect(() => {
        if (sid) {
            queryClient.prefetchQuery({ queryKey: ['pdcm-syllabus-info', sid], queryFn: () => SyllabusService.getSyllabusById(sid), staleTime: 5 * 60 * 1000 });
            queryClient.prefetchQuery({ queryKey: ['pdcm-materials', sid], queryFn: () => MaterialService.getMaterialsBySyllabusId(sid), staleTime: 5 * 60 * 1000 });
            queryClient.prefetchQuery({ queryKey: ['pdcm-sessions', sid], queryFn: () => SessionService.getDetailedSessions(sid, undefined), staleTime: 5 * 60 * 1000 });
            queryClient.prefetchQuery({ queryKey: ['pdcm-assessments', sid], queryFn: () => AssessmentService.getAssessmentsBySyllabusId(sid), staleTime: 5 * 60 * 1000 });
        }
    }, [sid, queryClient]);

    const sidebarItems = [
        { id: 'information', label: 'Information', icon: 'info', onClick: () => router.push(`/dashboard/pdcm/reviews/${reviewId}/information`), isActive: pathname.includes('information') },
        { id: 'materials', label: 'Materials', icon: 'menu_book', onClick: () => router.push(`/dashboard/pdcm/reviews/${reviewId}/materials`), isActive: pathname.includes('materials') },
        { id: 'sessions', label: 'Sessions', icon: 'calendar_today', onClick: () => router.push(`/dashboard/pdcm/reviews/${reviewId}/sessions`), isActive: pathname.includes('sessions') },
        { id: 'assessments', label: 'Assessments', icon: 'assignment', onClick: () => router.push(`/dashboard/pdcm/reviews/${reviewId}/assessments`), isActive: pathname.includes('assessments') },
    ];

    const globalHeaderTabs = [
        { id: 'develop', label: 'My Task', isActive: false, onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'My Review Task', isActive: true, onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];
    ;

    const sidebarSubContent = (
        <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Reviewing Task</p>
            <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2">
                {task?.taskName || (task as any)?.titleTask || "Syllabus Audit"}
            </p>
        </div>
    );

    return (
        <ReviewProvider reviewId={reviewId}>
            <PDCMReviewContent
                reviewId={reviewId}
                task={task}
                isLoading={isLoading}
                sidebarItems={sidebarItems}
                globalHeaderTabs={globalHeaderTabs}
                sidebarSubContent={sidebarSubContent}
                router={router}
            >
                {children}
            </PDCMReviewContent>
        </ReviewProvider>
    );
}
