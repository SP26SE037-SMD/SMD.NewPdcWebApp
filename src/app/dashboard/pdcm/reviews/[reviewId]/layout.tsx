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

    const handleSendReview = async (status: 'APPROVED' | 'REVISION_REQUESTED', notes: { material: string; session: string; assessment: string }) => {
        if (!task) return;
        setIsSubmitting(true);
        try {
            // Format date correctly to ISO string to prevent backend 9999 parsing error
            const formatToISO = (dateStr?: string) => {
                if (!dateStr) return new Date().toISOString();
                try {
                    // Convert "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss"
                    const sanitized = dateStr.includes(' ') && !dateStr.includes('T') 
                        ? dateStr.replace(' ', 'T') 
                        : dateStr;
                    const d = new Date(sanitized);
                    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                } catch (e) {
                    return new Date().toISOString();
                }
            };

            const payload = {
                titleTask: task.titleTask || "Syllabus Review",
                commentMaterial: notes.material || "No comments",
                commentSession: notes.session || "No comments",
                commentAssessment: notes.assessment || "No comments",
                reviewDate: new Date().toISOString(),
                dueDate: formatToISO(task.dueDate),
                status: status,
                taskId: task.task?.taskId || (task as any).taskId || (task as any).syllabusId,
                reviewerId: task.reviewer?.reviewerId || (task as any).reviewerId
            };

            console.log('[API DEBUG] Submitting Review Payload:', payload);

            await ReviewTaskService.updateReviewTask(reviewId, payload);

            // Invalidate queries to refresh dashboard
            queryClient.invalidateQueries({ queryKey: ['pdcm-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['pdcm-review-tasks'] });

            showToast(status === 'APPROVED' ? "Syllabus approved and submitted to supervisor!" : "Revision requests submitted to supervisor.", 'success');
            // Redirect back to dashboard
            router.push('/dashboard/pdcm');
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Failed to submit evaluation. Please try again.", 'error');
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
                                <p className="text-[9px] font-bold text-[#5a6157] uppercase tracking-[0.1em]">{task?.titleTask || "Syllabus Audit"}</p>
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
                taskTitle={task?.titleTask || "Syllabus Audit"}
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
        queryKey: ['pdcm-review-detail', reviewId],
        queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
        enabled: !!reviewId,
        staleTime: 5 * 60 * 1000,
    });

    const task = routeTaskData?.data;

    // Fetch Parent Task to get the actual syllabusId (ReviewTask only contains taskId)
    const { data: parentTaskRes } = useQuery({
        queryKey: ['parent-task-detail', task?.task?.taskId],
        queryFn: () => task?.task?.taskId ? TaskService.getTaskById(task.task.taskId) : null,
        enabled: !!task?.task?.taskId
    });

    const parentTask = parentTaskRes?.data;
    const sid = parentTask?.syllabus?.syllabusId || (task as any)?.syllabusId || task?.task?.taskId;

    React.useEffect(() => {
        if (sid) {
            queryClient.prefetchQuery({ queryKey: ['pdcm-syllabus-info', sid], queryFn: () => SyllabusService.getSyllabusById(sid), staleTime: 5 * 60 * 1000 });
            queryClient.prefetchQuery({ queryKey: ['pdcm-materials', sid], queryFn: () => MaterialService.getMaterialsBySyllabusId(sid, 'PENDING_REVIEW'), staleTime: 5 * 60 * 1000 });
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
        { id: 'develop', label: 'Develop Syllabus', isActive: false, onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'Peer Review', isActive: true, onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];
    ;

    const sidebarSubContent = (
        <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Reviewing Task</p>
            <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2">
                {task?.titleTask || "Syllabus Audit"}
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
