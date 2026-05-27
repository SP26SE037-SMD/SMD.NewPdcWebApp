"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from "@/components/ui/Toast";
import { TaskService } from "@/services/task.service";
import { AccountService } from "@/services/account.service";
import { SprintService } from "@/services/sprint.service";
import { SyllabusService } from "@/services/syllabus.service";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RejectDecisionModal } from "./RejectDecisionModal";

// Helper utilities to sync across components/tabs
export const dispatchDecisionCommentUpdate = (taskId: string, comment: string) => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('final-decision-comment-updated', {
            detail: { taskId, comment }
        }));
    }
};

interface FinalDecisionCardProps {
    syllabusId: string | null;
    taskId?: string | null;
}

export function FinalDecisionCard({ syllabusId, taskId }: FinalDecisionCardProps) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Local states
    const [commentText, setCommentText] = useState("");
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

    // Fetch CREATE/UPDATE SYLLABUS task by taskId or syllabusId
    const { data: createSyllabusTask, error: taskQueryError, isLoading: isTaskQueryLoading } = useQuery({
        queryKey: ['create-syllabus-task-by-id-or-syllabus', taskId, syllabusId],
        queryFn: async () => {
            if (taskId) {
                console.log("[FinalDecisionCard] Fetching task by taskId:", taskId);
                try {
                    const res = await TaskService.getTaskById(taskId);
                    const task = res?.data || null;
                    if (task) {
                        // If this is a REVIEW task, the actual CREATE/UPDATE task is rootTaskId!
                        if (task.action === 'REVIEW' || task.taskName?.toUpperCase().includes('REVIEW SYLLABUS')) {
                            if (task.rootTaskId) {
                                console.log("[FinalDecisionCard] Task is a review task, fetching root task:", task.rootTaskId);
                                const rootRes = await TaskService.getTaskById(task.rootTaskId);
                                return rootRes?.data || null;
                            }
                        }
                        return task;
                    }
                } catch (err) {
                    console.error("[FinalDecisionCard] Error fetching task by ID:", err);
                }
            }

            console.log("[FinalDecisionCard] Fetching tasks for syllabusId:", syllabusId);
            if (!syllabusId) return null;
            try {
                // Try querying by syllabusId first via getTasks
                let res = await TaskService.getTasks({
                    syllabusId: syllabusId,
                    size: 50,
                });
                let list = res?.content || [];

                // Fallback to targetId if syllabusId returned nothing
                if (list.length === 0) {
                    console.log("[FinalDecisionCard] No tasks found by syllabusId, trying targetId...");
                    res = await TaskService.getTasks({
                        targetId: syllabusId,
                        size: 50,
                    });
                    list = res?.content || [];
                }

                console.log("[FinalDecisionCard] API response tasks list:", list);
                // Prioritize active (not DONE/CANCELLED) syllabus tasks
                const activeSyllabusTask = list.find(t =>
                    (t.action === 'CREATE' || t.action === 'UPDATE' || t.type === 'SYLLABUS') &&
                    t.status !== 'DONE'
                );

                const matchedTask = activeSyllabusTask
                    || list.find(t => t.action === 'CREATE' || t.action === 'UPDATE')
                    || list.find(t => t.type === 'SYLLABUS')
                    || list[0]
                    || null;
                console.log("[FinalDecisionCard] Selected syllabus task:", matchedTask);
                return matchedTask;
            } catch (err) {
                console.error("[FinalDecisionCard] Error fetching tasks:", err);
                throw err;
            }
        },
        enabled: !!taskId || !!syllabusId,
    });

    const { data: rawTask } = useQuery({
        queryKey: ['raw-task-by-id', taskId],
        queryFn: async () => {
            if (!taskId) return null;
            try {
                const res = await TaskService.getTaskById(taskId);
                return res?.data || null;
            } catch (err) {
                console.error("[FinalDecisionCard] Error fetching raw task:", err);
                return null;
            }
        },
        enabled: !!taskId,
    });

    const createSyllabusTaskId = createSyllabusTask?.taskId || rawTask?.rootTaskId || taskId || null;
    const sprintId = createSyllabusTask?.sprintId || rawTask?.sprintId || null;

    // Fetch Sprint details (for dueDate restriction)
    const { data: sprintRes } = useQuery({
        queryKey: ["sprint", sprintId],
        queryFn: () => SprintService.getSprintById(sprintId || ""),
        enabled: !!sprintId,
    });
    const sprint = sprintRes?.data;

    // Fetch department accounts for assigning update task
    const departmentId = user?.departmentId || "";
    const { data: departmentAccounts = [] } = useQuery({
        queryKey: ["assignments-department-accounts", departmentId],
        queryFn: () => AccountService.getAccountsByDepartment(departmentId),
        enabled: !!departmentId,
    });

    const filteredAccounts = useMemo(() => {
        return departmentAccounts.filter((acc) => {
            const role = acc.roleName?.toUpperCase();
            return role === "PDCM" || role === "COLLABORATOR";
        });
    }, [departmentAccounts]);

    const pathname = usePathname();

    // Load finalComment from localStorage & setup sync event listeners
    useEffect(() => {
        const keyId = createSyllabusTaskId;
        if (!keyId) return;

        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`final_decision_comment_${keyId}`);
            setCommentText(saved || "");
        }

        const handleStorageUpdate = (e: any) => {
            if (e.detail && e.detail.taskId === keyId) {
                setCommentText(e.detail.comment || "");
            }
        };
        window.addEventListener('final-decision-comment-updated', handleStorageUpdate);

        const handleCrossTabUpdate = (e: StorageEvent) => {
            if (e.key === `final_decision_comment_${keyId}`) {
                setCommentText(e.newValue || "");
            }
        };
        window.addEventListener('storage', handleCrossTabUpdate);

        return () => {
            window.removeEventListener('final-decision-comment-updated', handleStorageUpdate);
            window.removeEventListener('storage', handleCrossTabUpdate);
        };
    }, [createSyllabusTaskId, pathname]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setCommentText(newValue);
        if (createSyllabusTaskId && typeof window !== "undefined") {
            localStorage.setItem(`final_decision_comment_${createSyllabusTaskId}`, newValue);
            dispatchDecisionCommentUpdate(createSyllabusTaskId, newValue);
        }
    };

    const handleAcceptSyllabus = async () => {
        const targetTaskId = createSyllabusTaskId || "";
        if (!targetTaskId) {
            showToast("Cannot find the task ID to accept", "error");
            return;
        }
        setIsSubmittingDecision(true);
        try {
            await TaskService.acceptTask(targetTaskId, true, commentText.trim() || "Approved");
            if (typeof window !== "undefined") {
                localStorage.removeItem(`final_decision_comment_${targetTaskId}`);
                dispatchDecisionCommentUpdate(targetTaskId, "");
            }
            setCommentText("");
            showToast("Syllabus accepted successfully", "success");

            // Redirect back to assignments page
            const redirectSprintId = searchParams.get("sprintId") || sprintId || (typeof window !== "undefined" ? localStorage.getItem("hopdc_last_sprint_id") : "") || "";
            const redirectCurriculumId = searchParams.get("curriculumId") || createSyllabusTask?.curriculumId || rawTask?.curriculumId || (typeof window !== "undefined" ? localStorage.getItem("hopdc_last_curriculum_id") : "") || "";
            
            const isHoCFDC = pathname.includes("hocfdc");
            if (isHoCFDC) {
                const effectiveSprintId = redirectSprintId || sprintId;
                const effectiveCurrId = redirectCurriculumId || createSyllabusTask?.curriculumId || rawTask?.curriculumId;
                if (effectiveSprintId && effectiveCurrId) {
                    router.push(`/dashboard/hocfdc/framework-execution/${effectiveCurrId}/sprints/${effectiveSprintId}`);
                } else {
                    router.back();
                }
            } else {
                if (redirectSprintId && redirectCurriculumId) {
                    router.push(`/dashboard/hopdc/assignments?sprintId=${redirectSprintId}&curriculumId=${redirectCurriculumId}`);
                } else {
                    router.push("/dashboard/hopdc/sprint-management");
                }
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['create-syllabus-task-by-syllabus', syllabusId] }),
                queryClient.invalidateQueries({ queryKey: ["assignments"] }),
                queryClient.invalidateQueries({ queryKey: ["associated-task"] }),
                queryClient.invalidateQueries({ queryKey: ["parent-task"] }),
                queryClient.invalidateQueries({ queryKey: ["assignments", sprintId] }),
            ]);
        } catch (err: any) {
            showToast(err.message || "Failed to accept syllabus", "error");
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    const handleRejectSyllabus = async () => {
        if (!createSyllabusTaskId) {
            showToast("Cannot find the CREATE SYLLABUS task", "error");
            return;
        }
        setIsRejectMode(true);
    };

    const handleConfirmRejection = async (chosenAssignee: string, chosenDueDate: string, chosenComment: string) => {
        if (!createSyllabusTaskId) return;
        setIsSubmittingDecision(true);
        try {
            const cleanTaskName = createSyllabusTask?.taskName?.replace("CREATE SYLLABUS: ", "") || "";
            const updateTaskName = `UPDATE SYLLABUS: ${cleanTaskName}`;

            // 1. Create the new UPDATE SYLLABUS task
            await TaskService.createTask({
                sprintId: sprintId || "",
                assignTo: chosenAssignee,
                taskName: updateTaskName,
                description: chosenComment,
                action: "UPDATE",
                priority: createSyllabusTask?.priority || "NORMAL",
                type: "SYLLABUS",
                targetId: createSyllabusTask?.targetId || syllabusId || undefined,
                rootTaskId: createSyllabusTask?.rootTaskId || undefined,
                dueDate: chosenDueDate,
            });

            // Transition the syllabus to DRAFT status
            const targetSyllabusId = createSyllabusTask?.targetId || syllabusId;
            if (targetSyllabusId && user?.accountId) {
                try {
                    await SyllabusService.updateSyllabusStatus(targetSyllabusId, user.accountId, "DRAFT");
                } catch (error) {
                    console.warn("Soft fail: Unable to update syllabus status to DRAFT", error);
                }
            }

            // 2. Reject task via acceptTask(false) proxy API
            await TaskService.acceptTask(createSyllabusTaskId, false, chosenComment);

            if (typeof window !== "undefined") {
                localStorage.removeItem(`final_decision_comment_${createSyllabusTaskId}`);
                dispatchDecisionCommentUpdate(createSyllabusTaskId, "");
            }
            setCommentText("");
            setIsRejectMode(false);
            showToast("Syllabus rejected and update task assigned", "success");

            // Redirect back to assignments page
            const redirectSprintId = searchParams.get("sprintId") || sprintId || (typeof window !== "undefined" ? localStorage.getItem("hopdc_last_sprint_id") : "") || "";
            const redirectCurriculumId = searchParams.get("curriculumId") || createSyllabusTask?.curriculumId || rawTask?.curriculumId || (typeof window !== "undefined" ? localStorage.getItem("hopdc_last_curriculum_id") : "") || "";
            
            const isHoCFDC = pathname.includes("hocfdc");
            if (isHoCFDC) {
                const effectiveSprintId = redirectSprintId || sprintId;
                const effectiveCurrId = redirectCurriculumId || createSyllabusTask?.curriculumId || rawTask?.curriculumId;
                if (effectiveSprintId && effectiveCurrId) {
                    router.push(`/dashboard/hocfdc/framework-execution/${effectiveCurrId}/sprints/${effectiveSprintId}`);
                } else {
                    router.back();
                }
            } else {
                if (redirectSprintId && redirectCurriculumId) {
                    router.push(`/dashboard/hopdc/assignments?sprintId=${redirectSprintId}&curriculumId=${redirectCurriculumId}`);
                } else {
                    router.push("/dashboard/hopdc/sprint-management");
                }
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['create-syllabus-task-by-syllabus', syllabusId] }),
                queryClient.invalidateQueries({ queryKey: ["assignments"] }),
                queryClient.invalidateQueries({ queryKey: ["associated-task"] }),
                queryClient.invalidateQueries({ queryKey: ["parent-task"] }),
                queryClient.invalidateQueries({ queryKey: ["assignments", sprintId] }),
            ]);
        } catch (err: any) {
            showToast(err.message || "Failed to reject syllabus", "error");
            throw err;
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    if (isTaskQueryLoading) {
        return (
            <div className="pointer-events-auto w-full p-6 rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-md text-left shadow-2xl flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-center py-8 gap-2 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                    <Loader2 className="animate-spin text-amber-600" size={16} />
                    Loading Decision State...
                </div>
            </div>
        );
    }

    if (!createSyllabusTask) {
        return (
            <div className="pointer-events-auto w-full p-6 rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-md text-left shadow-2xl flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="py-4 text-center text-zinc-500 font-bold uppercase tracking-widest text-[10px] flex flex-col items-center gap-2">
                    <AlertCircle className="text-rose-500" size={24} />
                    <span>No syllabus task found</span>
                </div>
            </div>
        );
    }

    if (createSyllabusTask.isAccepted !== null && createSyllabusTask.isAccepted !== undefined) {
        const isAccepted = createSyllabusTask.isAccepted;
        const decisionComment = createSyllabusTask.comment;

        return (
            <div
                id="floating-decision-panel"
                className="relative pointer-events-auto w-full p-6 rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-md text-left shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300"
            >
                {/* Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <div className={`p-1.5 rounded-lg ${isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest block leading-none ${isAccepted ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isAccepted ? 'Syllabus Approved' : 'Syllabus Rejected'}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5 block">
                            Review Decision Completed
                        </span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="text-sm font-black text-zinc-900 leading-tight">
                        {createSyllabusTask?.taskName?.replace("CREATE SYLLABUS: ", "") || "Syllabus Review"}
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        A final decision has already been submitted for this syllabus deliverable.
                    </p>
                </div>

                <div className="space-y-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Decision Comment
                    </span>
                    <div className="w-full p-3 text-xs font-semibold leading-relaxed text-[#2d342b] border border-zinc-200 bg-zinc-50/50 rounded-xl max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {decisionComment ? (
                            decisionComment.split('-').map((item, idx) => {
                                const trimmed = item.trim();
                                if (!trimmed) return null;
                                return (
                                    <div key={idx} className="flex items-start gap-1">
                                        <span className="text-zinc-400 font-bold shrink-0 select-none">•</span>
                                        <span className="whitespace-pre-wrap">{trimmed}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-zinc-400 italic">
                                {isAccepted ? "Approved" : "No comments provided"}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`mt-2 p-3 rounded-xl text-center text-xs font-black uppercase tracking-wider border ${
                    isAccepted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                    {isAccepted ? '✓ Status: Completed' : '✗ Status: Undergoing Revision'}
                </div>
            </div>
        );
    }

    return (
        <div
            id="floating-decision-panel"
            className="relative pointer-events-auto w-full p-6 rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-md text-left shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300"
        >
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 animate-pulse">
                    <AlertCircle size={16} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block leading-none">
                        Final Decision Required
                    </span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5 block">
                        Syllabus Approval
                    </span>
                </div>
            </div>

            <div className="space-y-1">
                <h4 className="text-sm font-black text-zinc-900 leading-tight">
                    {createSyllabusTask?.taskName?.replace("CREATE SYLLABUS: ", "") || "Syllabus Review"}
                </h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Review is complete. You can accept this syllabus, or reject it with comments to assign an update task.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Decision Comment
                </label>
                <textarea
                    value={commentText}
                    onChange={handleCommentChange}
                    placeholder="Provide comments or notes for rejection..."
                    className="w-full p-3 text-sm border border-zinc-200 bg-zinc-50/30 rounded-xl outline-none focus:border-[#0b7a47] focus:bg-white transition-all min-h-[90px] font-medium resize-y"
                />
            </div>

            <div className="flex gap-2.5 pt-2">
                <button
                    onClick={handleAcceptSyllabus}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-3 bg-[#0b7a47] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#096339] disabled:opacity-60 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                    {isSubmittingDecision ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        <Check size={14} />
                    )}
                    Accept Syllabus
                </button>
                <button
                    onClick={handleRejectSyllabus}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 disabled:opacity-60 transition-all shadow-lg shadow-rose-100"
                >
                    Reject & Request Update
                </button>
            </div>

            <RejectDecisionModal
                isOpen={isRejectMode}
                onClose={() => setIsRejectMode(false)}
                onConfirm={handleConfirmRejection}
                originalTask={createSyllabusTask}
                departmentAccounts={departmentAccounts}
                sprintDeadline={sprint?.endDate}
                initialComment={commentText}
                isFloating={true}
            />
        </div>
  );
}
