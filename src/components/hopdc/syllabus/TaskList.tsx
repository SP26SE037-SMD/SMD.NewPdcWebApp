"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { AccountService, DepartmentAccount } from "@/services/account.service";
import { SprintService } from "@/services/sprint.service";
import {
  SubjectSyllabusOption,
  SyllabusService,
} from "@/services/syllabus.service";
import { SubjectService } from "@/services/subject.service";
import { CloPloService } from "@/services/cloplo.service";
import {
  TASK_STATUS,
  TASK_TYPE,
  TaskItem,
  TaskStatus,
  TaskService,
} from "@/services/task.service";
import { RootState } from "@/store";
import { User } from "@/lib/auth";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Plus,
  BookText,
  Layers,
  Loader2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateSyllabusModal } from "../subject/CreateSyllabusModal";
import { CreateSyllabusTaskModal } from "./CreateSyllabusTaskModal";
import { ManageSyllabusSourcesModal } from "./ManageSyllabusSourcesModal";
import { ViewReviewDetailsModal } from "./ViewReviewDetailsModal";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface TaskListProps {
  sprintId: string;
}

interface TaskSelectionState {
  accountId: string;
  syllabusId: string;
  deadline: string;
}

const toInputDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getAccountLabel = (account: DepartmentAccount): string => {
  if (account.fullName && account.email) {
    return `${account.fullName} (${account.email})`;
  }

  return account.fullName || account.email || account.accountId;
};

const getSyllabusLabel = (syllabus: SubjectSyllabusOption): string => {
  const subject = [syllabus.subjectCode, syllabus.subjectName]
    .filter(Boolean)
    .join(" - ");

  let label = syllabus.syllabusName;
  if (subject) {
    label = `${label} (${subject})`;
  }

  if (syllabus.status) {
    label = `${label} [${syllabus.status}]`;
  }

  return label;
};

const getTaskStatusConfig = (status?: string) => {
  const normalized = status?.toUpperCase() || "UNKNOWN";

  switch (normalized) {
    case "DONE":
      return {
        color: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: CheckCircle2,
      };
    case "IN_PROGRESS":
      return {
        color: "bg-amber-500",
        text: "text-amber-600",
        bg: "bg-amber-50",
        icon: Clock,
      };
    case "TO_DO":
      return {
        color: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50",
        icon: Calendar,
      };
    case "REVISION_REQUESTED":
      return {
        color: "bg-rose-500",
        text: "text-rose-600",
        bg: "bg-rose-50",
        icon: AlertCircle,
      };
    case "CANCELLED":
      return {
        color: "bg-zinc-300",
        text: "text-zinc-400",
        bg: "bg-zinc-50",
        icon: AlertCircle,
      };
    default:
      return {
        color: "bg-zinc-400",
        text: "text-zinc-600",
        bg: "bg-zinc-50",
        icon: AlertCircle,
      };
  }
};

const getSubjectStatusConfig = (status?: string) => {
  const normalized = status?.toUpperCase() || "DRAFT";

  switch (normalized) {
    case "COMPLETED":
      return {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    case "PENDING_REVIEW":
      return {
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
    case "IN_PROGRESS":
    case "WAITING_SYLLABUS":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "ARCHIVED":
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
    default:
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
  }
};

const getSyllabusStatusConfig = (status?: string) => {
  const normalized = status?.toUpperCase() || "DRAFT";

  switch (normalized) {
    case "PUBLISHED":
    case "APPROVED":
      return {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    case "PENDING_REVIEW":
    case "REVIEWING":
      return {
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
    case "IN_PROGRESS":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "REVISION_REQUESTED":
      return {
        text: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    default:
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
  }
};

interface TaskRowProps {
  task: TaskItem;
  pdcmAccounts: DepartmentAccount[];
  syllabusOptions: SubjectSyllabusOption[];
  onSave: (task: TaskItem, syllabusId: string) => void;
  isSaving: boolean;
  saveError: string;
  saveSuccess: string;
  isSyllabusLoading: boolean;
  selection: Partial<TaskSelectionState>;
  onSelectionChange: (field: keyof TaskSelectionState, value: string) => void;
  curriculumId: string;
  sprintId: string;
  onComplete: (task: TaskItem) => void;
  isCompleting: boolean;
  currentUser: User | null;
  onManageSources: (syllabusId: string, syllabusName: string) => void;
  sprintDeadline?: string;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  isUpdatingStatus: boolean;
  onOpenTaskModal: (
    mode: "CREATE" | "UPDATE" | "REVIEW",
    parentTask: TaskItem,
  ) => void;
  validatingTaskId?: string | null;
  children?: (TaskItem & { children?: TaskItem[] })[];
  level?: number;
}

function TaskRow({
  task,
  pdcmAccounts,
  syllabusOptions,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
  isSyllabusLoading,
  selection,
  onSelectionChange,
  curriculumId,
  sprintId,
  onComplete,
  isCompleting,
  currentUser,
  onManageSources,
  sprintDeadline,
  onUpdateStatus,
  isUpdatingStatus,
  onOpenTaskModal,
  validatingTaskId = null,
  children = [],
  level = 0,
}: TaskRowProps) {
  const isThisValidating = validatingTaskId === task.taskId;

  // Helper to find subject information from the task itself or from any of its children recursively
  const getResolvedSubjectInfo = (): { subjectId?: string; subjectStatus?: string } => {
    if (task.subjectId || task.subject?.subjectId) {
      return {
        subjectId: task.subjectId || task.subject?.subjectId,
        subjectStatus: task.subjectStatus || task.subject?.status,
      };
    }
    const findInChildren = (list: any[]): { subjectId?: string; subjectStatus?: string } | null => {
      for (const child of list) {
        if (child.subjectId || child.subject?.subjectId) {
          return {
            subjectId: child.subjectId || child.subject?.subjectId,
            subjectStatus: child.subjectStatus || child.subject?.status,
          };
        }
        if (child.children && child.children.length > 0) {
          const res = findInChildren(child.children);
          if (res) return res;
        }
      }
      return null;
    };
    return findInChildren(children) || {};
  };

  const resolvedSubject = getResolvedSubjectInfo();
  const subjectId = resolvedSubject.subjectId || "";
  const subjectStatus = resolvedSubject.subjectStatus || "DRAFT";

  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSyllabusOpen, setIsCreateSyllabusOpen] = useState(false);
  const [isReviewDetailsOpen, setIsReviewDetailsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const keyId = task.taskId;
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
  }, [task.taskId, pathname]);
  const { data: subjectRes } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => SubjectService.getSubjectById(subjectId),
    enabled: !!subjectId && isCreateSyllabusOpen,
  });
  const subjectDetail = subjectRes?.data;

  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();


  const goToSubjectDetail = async () => {
    if (task.status === TASK_STATUS.TO_DO) {
      try {
        await TaskService.updateTaskStatus(
          task.taskId,
          TASK_STATUS.IN_PROGRESS,
        );
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }

    const isReadOnly = task.status === TASK_STATUS.DONE;
    router.push(
      `/dashboard/hopdc/sprint-management/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&tab=subject${isReadOnly ? "&readOnly=true" : ""}`,
    );
  };

  const goToSyllabusDetail = async () => {
    if (task.status === TASK_STATUS.TO_DO) {
      try {
        await TaskService.updateTaskStatus(
          task.taskId,
          TASK_STATUS.IN_PROGRESS,
        );
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }

    const isReadOnly = task.status === TASK_STATUS.DONE;
    router.push(
      `/dashboard/hopdc/sprint-management/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&syllabusId=${task.targetId}&tab=syllabus${isReadOnly ? "&readOnly=true" : ""}`,
    );
  };

  const handleCreateReview = async (payload: any) => {
    // Review feature disabled as requested
  };

  // action=UPDATE means self-do task (like reused subject), action=CREATE means assignable to subordinate
  const isReusedSubject =
    task.action === "UPDATE" ||
    task.type === TASK_TYPE.REUSED_SUBJECT ||
    task.type === "SUBJECT";
  const isDone = task.status === TASK_STATUS.DONE;

  const statusConfig = getTaskStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  const selectedAccountId =
    selection.accountId ?? task.account?.accountId ?? "";
  const hasAssignedAccount = Boolean(task.account?.accountId);
  const selectedDeadline = selection.deadline ?? toInputDate(task.deadline);
  const selectedSyllabusId =
    selection.syllabusId ||
    task.syllabus?.syllabusId ||
    syllabusOptions[0]?.syllabusId ||
    "";

  const selectedSyllabus =
    syllabusOptions.find((s) => s.syllabusId === selectedSyllabusId) ||
    (task.syllabus?.syllabusId && task.syllabus?.syllabusName
      ? {
        syllabusId: task.syllabus?.syllabusId,
        syllabusName: task.syllabus?.syllabusName,
      }
      : null);

  const hasSelectedAccountInOptions = pdcmAccounts.some(
    (a) => a.accountId === selectedAccountId,
  );
  const lockedAccountLabel = task.account?.fullName?.trim()
    ? `${task.account?.fullName} (${selectedAccountId})`
    : selectedAccountId;

  const isSyllabusTask = level === 1;
  const hasDecisionBlock =
    isSyllabusTask &&
    children.length > 0 &&
    children.some((c) => c.status === TASK_STATUS.DONE);

  return (
    <div
      className={`group relative transition-all ${level > 0 ? "ml-8 mt-4" : ""}`}
    >
      {/* Tree Line Connector */}
      {level > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-px bg-zinc-200">
          <div className="absolute top-8 left-0 w-4 h-px bg-zinc-200" />
        </div>
      )}

      <div
        className={`transition-all duration-300 ${level === 0
            ? "bg-gradient-to-br from-slate-50 via-white to-zinc-50/30 border-zinc-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-2xl border overflow-hidden"
            : level === 1
              ? "bg-emerald-50/5 border-emerald-200 hover:shadow-md rounded-2xl border overflow-hidden"
              : "bg-indigo-50/5 border-indigo-100 hover:shadow-md rounded-2xl border overflow-hidden"
          }`}
      >
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className={`${level === 0 ? "w-3" : "w-2"} ${statusConfig.color} transition-all`} />

          <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-1 flex items-center justify-center">
              {children.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-2 rounded-xl transition-all bg-zinc-100 text-zinc-500 hover:bg-zinc-200 ${isExpanded ? "rotate-180" : ""
                    }`}
                >
                  <ArrowLeft size={16} className="-rotate-90" />
                </button>
              )}
            </div>

            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center gap-3">
                {level === 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-white text-[9px] font-black uppercase tracking-widest leading-none shadow-sm">
                    Subject
                  </span>
                )}
                {level === 0 ? (
                  <div className="relative flex items-center gap-2 group/status">
                    <div className="relative">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onUpdateStatus(
                            task.taskId,
                            e.target.value as TaskStatus,
                          )
                        }
                        disabled={isUpdatingStatus}
                        className={`inline-flex items-center gap-1.5 pl-2 pr-6 py-0.5 text-[11px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-current/20 rounded-md outline-none cursor-pointer hover:brightness-95 transition-all appearance-none disabled:opacity-50`}
                      >
                        <option value={TASK_STATUS.TO_DO}>TO DO</option>
                        <option value={TASK_STATUS.IN_PROGRESS}>
                          IN PROGRESS
                        </option>
                        <option value={TASK_STATUS.DONE}>DONE</option>
                      </select>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-current ml-1" />
                      </div>
                    </div>
                    {isUpdatingStatus && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                    )}
                  </div>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-current/20 rounded-md`}
                    style={{ wordSpacing: "0.2em" }}
                  >
                    <StatusIcon size={12} />
                    {(task.status || "UNKNOWN").replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <h3
                className={`font-black tracking-tight flex items-center gap-2 ${level === 0 ? "text-xl text-zinc-900" : "text-base text-zinc-800"}`}
              >
                {level === 0 && <BookText size={18} className="text-zinc-600 shrink-0" />}
                <span>{task.taskName || "N/A"}</span>
              </h3>

              <p className="text-sm font-medium text-zinc-500 line-clamp-2 italic">
                {task.description || "N/A"}
              </p>

              {(level === 0 ||
                task.type === "SUBJECT" ||
                task.type === TASK_TYPE.NEW_SUBJECT) &&
                !(task.taskName?.toUpperCase().includes("REVIEW SYLLABUS") || task.action === "REVIEW") && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                        Subject Status
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${getSubjectStatusConfig(subjectStatus).bg} ${getSubjectStatusConfig(subjectStatus).text} ${getSubjectStatusConfig(subjectStatus).border}`}
                          style={{ wordSpacing: "0.2em" }}
                        >
                          {(subjectStatus || "DRAFT").replace(/_/g, " ")}
                        </span>
                        <button
                          onClick={goToSubjectDetail}
                          className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Subject Detail
                          <ExternalLink
                            size={12}
                            className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {level === 1 && (
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                      Syllabus Status
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${getSyllabusStatusConfig(task.syllabus?.status || task.syllabusStatus || undefined).bg} ${getSyllabusStatusConfig(task.syllabus?.status || task.syllabusStatus || undefined).text} ${getSyllabusStatusConfig(task.syllabus?.status || task.syllabusStatus || undefined).border}`}
                        style={{ wordSpacing: "0.2em" }}
                      >
                        {(task.syllabus?.status ||
                          task.syllabusStatus ||
                          "DRAFT").replace(/_/g, " ")}
                      </span>
                      <button
                        onClick={goToSyllabusDetail}
                        className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Syllabus Detail
                        <ExternalLink
                          size={12}
                          className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Accept/Reject decision box was moved to Column 4 */}
            </div>

            <div
              className={`${isSyllabusTask ? "lg:col-span-3" : "lg:col-span-4"} grid grid-cols-1 gap-3 border-l border-zinc-100 pl-6`}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                  Assignee
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-200">
                    {task.account?.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-zinc-700">
                    {task.account?.fullName || "Unassigned"}
                  </span>
                </div>
              </div>

              {(task.taskName?.toUpperCase().includes("REVIEW SYLLABUS") || task.action === "REVIEW") && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-100/50">
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    {task.status !== TASK_STATUS.DONE ? "Syllabus Review Unavailable" : "Syllabus Review Available"}
                  </p>
                  <div className="mt-1">
                    {task.status !== TASK_STATUS.DONE ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 select-none cursor-not-allowed uppercase tracking-wider">
                        <Lock size={12} className="shrink-0 text-zinc-400" />
                        Waiting Reviewer
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const targetSyllabusId = task.syllabus?.syllabusId || task.targetId || "null";
                          router.push(
                            `/dashboard/hopdc/sprint-management/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&syllabusId=${targetSyllabusId}&tab=syllabus&readOnly=true`
                          );
                        }}
                        className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Review Detail
                        <ExternalLink
                          size={12}
                          className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {level < 2 && !(task.taskName?.toUpperCase().includes("REVIEW SYLLABUS") || task.action === "REVIEW") && (
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    Workflow Actions
                  </p>
                  <button
                    onClick={() =>
                      onOpenTaskModal(level === 0 ? "CREATE" : "REVIEW", {
                        ...task,
                        subjectId: subjectId || task.subjectId,
                        subjectStatus: (subjectStatus as any) || task.subjectStatus,
                      })
                    }
                    disabled={isThisValidating}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-primary text-white text-[10px] font-black uppercase rounded-lg hover:brightness-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isThisValidating && level === 0 ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    {level === 0 ? "Create Syllabus" : "Review Syllabus"}
                  </button>
                </div>
              )}

              {/* Subtasks Progress under Assignee & Actions (Syllabus Task Only) */}
              {isSyllabusTask && children.length > 0 && (
                <div className="w-full space-y-2 mt-2 pt-2 border-t border-zinc-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded-md bg-zinc-100 text-zinc-500">
                        <Layers size={10} />
                      </div>
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        Subtasks
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-900 bg-zinc-50 px-1.5 py-0.5 rounded-md border border-zinc-100">
                      {
                        children.filter((c) => c.status === TASK_STATUS.DONE)
                          .length
                      }
                      /{children.length} Done
                    </span>
                  </div>

                  <div className="flex gap-1 h-1.5 w-full">
                    {children.map((child) => (
                      <div
                        key={child.taskId}
                        title={`${child.taskName}: ${child.status}`}
                        className={`flex-1 rounded-full transition-all duration-300 ${child.status === TASK_STATUS.DONE
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : child.status === TASK_STATUS.IN_PROGRESS
                              ? "bg-amber-500"
                              : "bg-zinc-200"
                          }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter text-zinc-400">
                    <span>
                      {Math.round(
                        (children.filter((c) => c.status === TASK_STATUS.DONE)
                          .length /
                          children.length) *
                        100,
                      )}
                      % Progress
                    </span>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Done</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>IP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column 4: HoPDC Decision Required/Reminder for Syllabus Tasks, or Subtasks block for other tasks */}
            {isSyllabusTask ? (
              <div className="lg:col-span-4 border-l border-zinc-100 pl-6 flex flex-col justify-center">
                {hasDecisionBlock ? (
                  <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-200/50 text-amber-700">
                        <AlertCircle size={14} />
                      </div>
                      <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                        Final Decision Required
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onUpdateStatus(task.taskId, TASK_STATUS.DONE)
                        }
                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-200"
                      >
                        Accept Syllabus
                      </button>
                      <button
                        onClick={() => {
                          const comment = (
                            document.getElementById(
                              `comment-${task.taskId}`,
                            ) as HTMLTextAreaElement
                          )?.value;
                          if (!comment) {
                            showToast(
                              "Please add a comment for rejection",
                              "error",
                            );
                            return;
                          }
                          onOpenTaskModal("UPDATE", task);
                        }}
                        className="flex-1 py-2 bg-rose-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-700 transition-all shadow-sm hover:shadow-rose-200"
                      >
                        Reject & Request Update
                      </button>
                    </div>
                    <textarea
                      id={`comment-${task.taskId}`}
                      value={commentText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCommentText(val);
                        localStorage.setItem(
                          `final_decision_comment_${task.taskId}`,
                          val,
                        );
                        window.dispatchEvent(new CustomEvent('final-decision-comment-updated', {
                          detail: { taskId: task.taskId, comment: val }
                        }));
                      }}
                      placeholder="Add comments for the creator..."
                      className="w-full p-3 text-xs border border-amber-200 rounded-lg outline-none focus:border-amber-400 bg-white/50 focus:bg-white transition-all min-h-[60px] font-medium"
                    />
                  </div>
                ) : task.status === TASK_STATUS.TO_DO ||
                  task.status === TASK_STATUS.IN_PROGRESS ? (
                  <div className="w-full p-4 rounded-xl border border-amber-200/60 border-dashed bg-amber-50/10 flex items-start gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="mt-0.5 p-2 rounded-[10px] bg-white border border-amber-200 text-amber-500 shadow-sm">
                      <BookText
                        size={16}
                        className="text-amber-500 animate-pulse"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">
                          Review Task Status
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-[8px] font-black text-amber-600 uppercase tracking-tight border border-amber-100">
                          Not Found
                        </span>
                      </div>
                      <p className="text-[12px] font-bold text-amber-600/70 leading-relaxed">
                        This Create Syllabus task does not have a Review
                        Syllabus task for peer review yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-4 rounded-xl border border-zinc-200 border-dashed bg-zinc-50/50 flex items-start gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="mt-0.5 p-2 rounded-[10px] bg-white border border-zinc-200 text-zinc-400 shadow-sm">
                      <Clock size={16} className="animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                          In Peer Review Workflow
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-zinc-200 text-[8px] font-black text-zinc-500 uppercase tracking-tight">
                          Pending
                        </span>
                      </div>
                      <p className="text-[12px] font-bold text-zinc-400 leading-relaxed">
                        This syllabus is currently being reviewed. Once the peer
                        review is completed, you will be required to perform a{" "}
                        <span className="text-zinc-600">Final Review</span> here
                        to approve it for institutional use.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center">
                {children.length > 0 ? (
                  <div className="w-full max-w-[180px] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-zinc-100 text-zinc-500">
                          <Layers size={10} />
                        </div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                          Subtasks
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-900 bg-zinc-50 px-1.5 py-0.5 rounded-md border border-zinc-100">
                        {
                          children.filter((c) => c.status === TASK_STATUS.DONE)
                            .length
                        }
                        /{children.length} Done
                      </span>
                    </div>

                    <div className="flex gap-1 h-1.5 w-full">
                      {children.map((child) => (
                        <div
                          key={child.taskId}
                          title={`${child.taskName}: ${child.status}`}
                          className={`flex-1 rounded-full transition-all duration-300 ${child.status === TASK_STATUS.DONE
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                              : child.status === TASK_STATUS.IN_PROGRESS
                                ? "bg-amber-500"
                                : "bg-zinc-200"
                            }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter text-zinc-400">
                      <span>
                        {Math.round(
                          (children.filter((c) => c.status === TASK_STATUS.DONE)
                            .length /
                            children.length) *
                          100,
                        )}
                        % Progress
                      </span>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Done</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>IP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center lg:items-end gap-1 opacity-40">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      No Subtasks
                    </span>
                    <div className="h-1 w-24 bg-zinc-100 rounded-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Recursive Children Rendering */}
      <AnimatePresence>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TaskRow
                key={child.taskId}
                task={child}
                level={level + 1}
                pdcmAccounts={pdcmAccounts}
                syllabusOptions={syllabusOptions}
                onSave={onSave}
                isSaving={isSaving}
                saveError={saveError}
                saveSuccess={saveSuccess}
                isSyllabusLoading={isSyllabusLoading}
                selection={selection}
                onSelectionChange={onSelectionChange}
                curriculumId={curriculumId}
                sprintId={sprintId}
                onComplete={onComplete}
                isCompleting={isCompleting}
                currentUser={currentUser}
                onManageSources={onManageSources}
                onUpdateStatus={onUpdateStatus}
                isUpdatingStatus={isUpdatingStatus}
                onOpenTaskModal={onOpenTaskModal}
                validatingTaskId={validatingTaskId}
              >
                {child.children}
              </TaskRow>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateSyllabusModal
        subjectId={task.subjectId || ""}
        accountEmail={user?.email || ""}
        minBloomLevel={subjectDetail?.minBloomLevel || 0}
        isOpen={isCreateSyllabusOpen}
        onClose={() => setIsCreateSyllabusOpen(false)}
        onSuccess={async (newSyllabus: any) => {
          setIsCreateSyllabusOpen(false);
          await queryClient.invalidateQueries({
            queryKey: ["assign-task-syllabi", task.subjectId],
          });
          const newId = newSyllabus?.data?.syllabusId;
          if (newId) {
            onSelectionChange("syllabusId", newId);
          }
        }}
      />
      <ViewReviewDetailsModal
        isOpen={isReviewDetailsOpen}
        onClose={() => setIsReviewDetailsOpen(false)}
        taskName={task.taskName}
        taskId={task.taskId}
        syllabusId={task.syllabus?.syllabusId || task.targetId || undefined}
      />
    </div>
  );
}

export function TaskList({ sprintId }: TaskListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const departmentId = user?.departmentId || "";
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const curriculumId = searchParams.get("curriculumId") || "";

  const goToReceiveTasks = async () => {
    // Clear context when manually navigating back
    if (typeof window !== "undefined") {
      localStorage.removeItem("hopdc_last_sprint_id");
      localStorage.removeItem("hopdc_last_curriculum_id");
    }

    // Aggressive revalidation of all dashboard data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sprints"] }),
      queryClient.invalidateQueries({
        queryKey: ["hopdc-receive-task-curriculum-detail"],
      }),
      queryClient.invalidateQueries({ queryKey: ["syllabus"] }),
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
    ]);

    router.refresh();
    router.push("/dashboard/hopdc/sprint-management");
  };

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<
    "CREATE" | "UPDATE" | "REVIEW"
  >("CREATE");
  const [taskModalParentTask, setTaskModalParentTask] =
    useState<TaskItem | null>(null);
  const [validatingTaskId, setValidatingTaskId] = useState<string | null>(null);

  const onOpenTaskModal = async (
    mode: "CREATE" | "UPDATE" | "REVIEW",
    parentTask: TaskItem,
  ) => {
    if (mode === "CREATE") {
      setValidatingTaskId(parentTask.taskId);
      try {
        if (!curriculumId || !parentTask.subjectId) {
          showToast("Missing curriculum or subject info", "error");
          return;
        }

        const res = await CloPloService.getMappingsBySubjectAndCurriculum(
          parentTask.subjectId,
          curriculumId,
        );
        const mappings = res.data || [];

        if (mappings.length === 0) {
          showToast(
            "Môn học này chưa có CLOs hoặc CLO-PLO mapping. Vui lòng cấu hình trước khi tạo Syllabus!",
            "warning",
          );
          return;
        }
      } catch (err) {
        showToast(
          "Không thể kiểm tra dữ liệu CLO-PLO. Vui lòng thử lại.",
          "error",
        );
        return;
      } finally {
        setValidatingTaskId(null);
      }
    }

    setTaskModalMode(mode);
    setTaskModalParentTask(parentTask);
    setIsTaskModalOpen(true);
  };

  const { data: departmentAccounts = [], isLoading: isAccountsLoading } =
    useQuery({
      queryKey: ["assignments-department-accounts", departmentId],
      queryFn: () => AccountService.getAccountsByDepartment(departmentId),
      enabled: !!departmentId,
    });

  const pdcmAccounts = useMemo<DepartmentAccount[]>(() => {
    // Return all department accounts for now since roleName might differ (e.g. PDCM_LEAD)
    // or the backend might return roles differently.
    return departmentAccounts;
  }, [departmentAccounts]);

  const {
    data: tasksRes,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useQuery({
    queryKey: ["assignments", sprintId],
    queryFn: () => TaskService.getTasksV2({ sprintId, size: 100 }),
    enabled: !!sprintId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: sprintRes } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => SprintService.getSprintById(sprintId),
    enabled: !!sprintId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const sprint = sprintRes?.data;

  const tasks = useMemo<TaskItem[]>(() => {
    return tasksRes?.content || [];
  }, [tasksRes]);

  const [selectionByTaskId, setSelectionByTaskId] = useState<
    Record<string, TaskSelectionState>
  >({});
  const [saveErrorByTaskId, setSaveErrorByTaskId] = useState<
    Record<string, string>
  >({});
  const [saveSuccessByTaskId, setSaveSuccessByTaskId] = useState<
    Record<string, string>
  >({});

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [selectedSyllabusIdForSources, setSelectedSyllabusIdForSources] =
    useState("");
  const [selectedSyllabusNameForSources, setSelectedSyllabusNameForSources] =
    useState("");

  const taskActions = useMemo(() => {
    const actions = Array.from(
      new Set(tasks.map((t) => t.action || "OTHER")),
    ).filter((action) => action !== "REVIEW");
    return actions.sort();
  }, [tasks]);

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Set default action when tasks load
  useEffect(() => {
    if (taskActions.length > 0 && !selectedAction) {
      setSelectedAction(taskActions[0]);
    }
  }, [taskActions, selectedAction]);

  const getMockTasks = (): TaskItem[] => {
    return [
      {
        taskId: "mock-root-1",
        taskName: "CREATE SUBJECT: SOFTWARE ARCHITECTURE (SE301)",
        description:
          "Develop full syllabus including CLOs, PLO mapping, and course content.",
        action: "CREATE",
        status: TASK_STATUS.IN_PROGRESS,
        priority: "HIGH",
        type: TASK_TYPE.NEW_SUBJECT,
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        createdAt: new Date().toISOString(),
        subjectStatus: "DRAFT",
        subjectId: "sub-mock-1",
        account: { accountId: "hopdc-1", fullName: "HoPDC Manager" },
      } as any,
      {
        taskId: "mock-child-1.1",
        rootTaskId: "mock-root-1",
        taskName: "CREATE SYLLABUS",
        description: "Draft the initial syllabus structure and CLO mappings.",
        action: "CREATE",
        status: TASK_STATUS.DONE,
        priority: "MEDIUM",
        type: "SYLLABUS_DEVELOP",
        deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        account: { accountId: "creator-1", fullName: "Nguyen Van A (Creator)" },
        targetId: "syl-mock-1",
        syllabus: { syllabusId: "syl-mock-1", syllabusName: "Syllabus V1.0" },
      } as any,
      {
        taskId: "mock-subchild-1.1.1",
        rootTaskId: "mock-child-1.1",
        taskName: "REVIEW SYLLABUS",
        description:
          "Peer review of the initial draft for Software Architecture.",
        action: "CREATE",
        status: TASK_STATUS.DONE,
        priority: "MEDIUM",
        type: "REVIEW",
        deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        account: { accountId: "reviewer-1", fullName: "Tran Thi B (Reviewer)" },
      } as any,
      {
        taskId: "mock-child-1.2",
        rootTaskId: "mock-root-1",
        taskName: "UPDATE SYLLABUS (RE-WORK)",
        description:
          "Fix the CLO mappings as per the review comments in Task 1.1.1. Please detail the Software Design Pattern section.",
        action: "CREATE",
        status: TASK_STATUS.IN_PROGRESS,
        priority: "HIGH",
        type: "SYLLABUS_UPDATE",
        deadline: new Date(Date.now() + 86400000 * 6).toISOString(),
        createdAt: new Date().toISOString(),
        account: { accountId: "creator-1", fullName: "Nguyen Van A (Creator)" },
        targetId: "syl-mock-1",
      } as any,
    ];
  };

  const groupedTasks = useMemo(() => {
    const taskMap: Record<string, TaskItem & { children?: TaskItem[] }> = {};
    const roots: (TaskItem & { children?: TaskItem[] })[] = [];

    // Combine mock and real tasks to build the full tree structure
    const allTasksForTree = [
      ...(selectedAction === "CREATE" ? getMockTasks() : []),
      ...tasks,
    ];

    // First pass: initialize map with all tasks
    allTasksForTree.forEach((task) => {
      taskMap[task.taskId] = { ...task, children: [] };
    });

    // Second pass: build hierarchy
    allTasksForTree.forEach((task) => {
      const currentTaskInMap = taskMap[task.taskId];
      if (task.rootTaskId && taskMap[task.rootTaskId]) {
        // Attach as child if parent exists in our map
        taskMap[task.rootTaskId].children?.push(currentTaskInMap);
      } else {
        // If it's a root, only include it if it matches the selected action
        if (!selectedAction || (task.action || "OTHER") === selectedAction) {
          roots.push(currentTaskInMap);
        }
      }
    });

    return roots;
  }, [tasks, selectedAction]);

  const saveTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: Parameters<typeof TaskService.updateTask>[1];
    }) => {
      const result = await TaskService.updateTask(taskId, payload);

      // Get subjectId for the task to update CLO status
      const targetTask = tasks.find((t) => t.taskId === taskId);
      if (targetTask?.subjectId) {
        try {
          await (CloPloService as any).updateClosStatus(
            targetTask.subjectId,
            "INTERNAL_REVIEW",
          );
        } catch (error) {
          console.warn(
            "Soft fail: Unable to update CLOs to INTERNAL_REVIEW",
            error,
          );
        }
      }

      // Transition the active syllabus to IN_PROGRESS upon HoPDC assignment
      if (payload.syllabusId && user?.accountId) {
        try {
          await SyllabusService.updateSyllabusStatus(
            payload.syllabusId,
            user.accountId,
            "IN_PROGRESS",
          );
        } catch (error) {
          console.warn(
            "Soft fail: Unable to update syllabus to IN_PROGRESS",
            error,
          );
        }
      }

      return result;
    },
    onSuccess: async (_, variables) => {
      setSaveErrorByTaskId((prev) => ({ ...prev, [variables.taskId]: "" }));
      setSaveSuccessByTaskId((prev) => ({
        ...prev,
        [variables.taskId]: "Saved successfully",
      }));
      setSelectionByTaskId((prev) => {
        const next = { ...prev };
        delete next[variables.taskId];
        return next;
      });
      showToast("Task assignment saved successfully", "success");
      await queryClient.invalidateQueries({
        queryKey: ["assignments", sprintId],
      });
    },
    onError: (error, variables) => {
      setSaveSuccessByTaskId((prev) => ({ ...prev, [variables.taskId]: "" }));
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save task";
      setSaveErrorByTaskId((prev) => ({
        ...prev,
        [variables.taskId]: errorMsg,
      }));
      showToast(errorMsg, "error");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (task: TaskItem) => {
      // Step 1: Assign to current HoPDC and lock current published syllabus
      const accountId = user?.accountId || "";
      let syllabusId = task.syllabus?.syllabusId || "";

      // For reused subjects, if no syllabus is assigned to the task yet,
      // we automatically fetch the current PUBLISHED syllabus for that subject.
      if (!syllabusId && task.type === TASK_TYPE.REUSED_SUBJECT) {
        const res = await SyllabusService.getSyllabiBySubject(
          task.subjectId!,
          "PUBLISHED",
        );
        const data = res?.data;
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === "object") {
          const dataRecord = data as Record<string, any>;
          list = dataRecord.content || dataRecord.items || [];
        }

        if (list.length > 0) {
          syllabusId = list[0].syllabusId;
        }
      }

      if (!accountId) {
        throw new Error("Missing account information. Please login again.");
      }
      if (!syllabusId) {
        throw new Error(
          "Unabled to find assignment data (Syllabus) for Fast-track.",
        );
      }

      await TaskService.updateTask(task.taskId, {
        accountId,
        syllabusId,
        taskName: task.taskName,
        description: task.description,
        priority: task.priority,
        type: task.type,
        deadline: toInputDate(task.deadline),
      });

      // Step 2: Transition to DONE
      return TaskService.updateTaskStatus(task.taskId, TASK_STATUS.DONE);
    },
    onSuccess: async () => {
      showToast("Task completed successfully", "success");
      await queryClient.invalidateQueries({
        queryKey: ["assignments", sprintId],
      });
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to complete task", "error");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }) => {
      return TaskService.updateTaskStatus(taskId, status);
    },
    onSuccess: async (_, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${variables.taskId}`);
        window.dispatchEvent(new CustomEvent('final-decision-comment-updated', {
          detail: { taskId: variables.taskId, comment: "" }
        }));
      }
      showToast("Status updated successfully", "success");
      await queryClient.invalidateQueries({
        queryKey: ["assignments", sprintId],
      });
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update status", "error");
    },
  });

  const handleSelectionChange = (
    taskId: string,
    field: keyof TaskSelectionState,
    value: string,
  ) => {
    setSelectionByTaskId((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...(field === "syllabusId" ? { accountId: "" } : {}),
        [field]: value,
      },
    }));

    setSaveSuccessByTaskId((prev) => ({ ...prev, [taskId]: "" }));
    setSaveErrorByTaskId((prev) => ({ ...prev, [taskId]: "" }));
  };

  const handleSaveTask = (task: TaskItem, resolvedSyllabusId?: string) => {
    const selected = selectionByTaskId[task.taskId] || {
      accountId: "",
      syllabusId: "",
      deadline: "",
    };

    const accountId = selected.accountId ?? task.account?.accountId ?? "";
    const syllabusId =
      resolvedSyllabusId ??
      selected.syllabusId ??
      task.syllabus?.syllabusId ??
      "";
    const deadline = selected.deadline ?? toInputDate(task.deadline);

    if (!accountId || !syllabusId || !deadline) {
      const errorMsg = "Please choose account, syllabus and deadline";
      setSaveSuccessByTaskId((prev) => ({ ...prev, [task.taskId]: "" }));
      setSaveErrorByTaskId((prev) => ({
        ...prev,
        [task.taskId]: errorMsg,
      }));
      showToast(errorMsg, "error");
      return;
    }

    saveTaskMutation.mutate({
      taskId: task.taskId,
      payload: {
        accountId,
        syllabusId,
        taskName: task.taskName,
        description: task.description,
        priority: task.priority,
        deadline,
        type: task.type,
      },
    });
  };

  const syllabiQueries = useQueries({
    queries: tasks.map((task) => ({
      queryKey: ["assign-task-syllabi", task.subjectId],
      queryFn: () =>
        SyllabusService.getSyllabiBySubject(task.subjectId as string),
      enabled: !!task.subjectId,
    })),
  });

  const syllabiByTaskId = useMemo<
    Record<string, SubjectSyllabusOption[]>
  >(() => {
    return tasks.reduce<Record<string, SubjectSyllabusOption[]>>(
      (acc, task, index) => {
        const queryData = syllabiQueries[index]?.data?.data;
        acc[task.taskId] = Array.isArray(queryData) ? queryData : [];
        return acc;
      },
      {},
    );
  }, [tasks, syllabiQueries]);

  if (isTasksLoading) {
    return (
      <div className="flex min-h-55 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <span className="text-base font-semibold">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (isTasksError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-base text-red-700">
        {(tasksError as Error)?.message || "Failed to load tasks."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <button
        onClick={goToReceiveTasks}
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#0b7a47] hover:border-emerald-200 transition-colors w-fit"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Curriculum Deliverables
      </button>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            Deliverable Execution
          </h1>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            {sprint?.sprintName || "Curriculum Deliverables"}
          </p>
        </div>

        {sprint?.endDate && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl shadow-sm">
            <Clock size={16} className="text-amber-600" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">
                  Deliverable Deadline
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-200/50 text-[9px] font-black text-amber-700 uppercase tracking-tight">
                  {(() => {
                    const diff =
                      new Date(sprint.endDate).getTime() - new Date().getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return days > 0
                      ? `${days} days remaining`
                      : days === 0
                        ? "Ends today"
                        : "Expired";
                  })()}
                </span>
              </div>
              <span className="text-sm font-black text-zinc-900 leading-none">
                {new Date(sprint.endDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {taskActions.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100/50 rounded-2xl w-fit border border-zinc-200">
          {taskActions.map((action) => (
            <button
              key={action}
              onClick={() => setSelectedAction(action)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${selectedAction === action
                  ? "bg-white text-[var(--primary)] shadow-sm shadow-zinc-200 border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                }`}
            >
              {action.replace(/_/g, " ")}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] ${selectedAction === action
                    ? "bg-[var(--primary)] text-white"
                    : "bg-zinc-200 text-zinc-600"
                  }`}
              >
                {tasks.filter((t) => (t.action || "OTHER") === action).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {groupedTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-base font-medium text-zinc-500">
            No tasks found for{" "}
            {selectedAction?.replace(/_/g, " ") || "this action"}.
          </div>
        ) : (
          groupedTasks.map((task) => {
            const originalIndex = tasks.findIndex(
              (t) => t.taskId === task.taskId,
            );
            return (
              <TaskRow
                key={task.taskId}
                task={task}
                pdcmAccounts={pdcmAccounts}
                syllabusOptions={syllabiByTaskId[task.taskId] || []}
                onSave={handleSaveTask}
                isSaving={
                  saveTaskMutation.isPending &&
                  saveTaskMutation.variables?.taskId === task.taskId
                }
                saveError={saveErrorByTaskId[task.taskId]}
                saveSuccess={saveSuccessByTaskId[task.taskId]}
                isSyllabusLoading={
                  originalIndex !== -1
                    ? (syllabiQueries[originalIndex]?.isLoading ?? false)
                    : false
                }
                selection={selectionByTaskId[task.taskId] || {}}
                onSelectionChange={(field, value) =>
                  handleSelectionChange(task.taskId, field, value)
                }
                curriculumId={curriculumId}
                sprintId={sprintId}
                onComplete={(t) => completeTaskMutation.mutate(t)}
                isCompleting={completeTaskMutation.isPending}
                currentUser={user as User | null}
                onManageSources={(id, name) => {
                  setSelectedSyllabusIdForSources(id);
                  setSelectedSyllabusNameForSources(name);
                  setIsSourcesModalOpen(true);
                }}
                sprintDeadline={sprint?.endDate}
                onUpdateStatus={(taskId, status) =>
                  updateStatusMutation.mutate({ taskId, status })
                }
                isUpdatingStatus={
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.taskId === task.taskId
                }
                onOpenTaskModal={onOpenTaskModal}
                validatingTaskId={validatingTaskId}
              >
                {task.children}
              </TaskRow>
            );
          })
        )}
      </div>
      <ManageSyllabusSourcesModal
        syllabusId={selectedSyllabusIdForSources}
        syllabusName={selectedSyllabusNameForSources}
        isOpen={isSourcesModalOpen}
        onClose={() => {
          setIsSourcesModalOpen(false);
          setSelectedSyllabusIdForSources("");
        }}
      />

      <CreateSyllabusTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalParentTask(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["assignments"] });
        }}
        mode={taskModalMode}
        sprintId={sprintId}
        rootTaskId={taskModalParentTask?.taskId || null}
        subjectId={taskModalParentTask?.subjectId}
        subjectName={taskModalParentTask?.taskName?.replace(
          "CREATE SUBJECT: ",
          "",
        )}
        targetId={
          taskModalParentTask?.targetId ||
          taskModalParentTask?.syllabus?.syllabusId ||
          taskModalParentTask?.syllabusId
        }
        accounts={departmentAccounts}
        currentUserEmail={user?.email || ""}
        sprintDeadline={sprint?.endDate}
        initialData={
          taskModalMode === "UPDATE"
            ? {
              taskName: `UPDATE SYLLABUS: ${taskModalParentTask?.taskName?.replace("CREATE SYLLABUS: ", "") || ""}`,
              description:
                (
                  document.getElementById(
                    `comment-${taskModalParentTask?.taskId}`,
                  ) as HTMLTextAreaElement
                )?.value || "",
              priority: taskModalParentTask?.priority,
              dueDate: taskModalParentTask?.deadline,
              assignTo: taskModalParentTask?.account?.accountId,
            }
            : taskModalMode === "REVIEW"
              ? {
                taskName: `REVIEW SYLLABUS: ${taskModalParentTask?.taskName?.replace("CREATE SYLLABUS: ", "") || ""}`,
                description: `Review syllabus content for ${taskModalParentTask?.taskName?.replace("CREATE SYLLABUS: ", "") || ""}`,
                priority: "MEDIUM",
                dueDate: taskModalParentTask?.deadline,
                excludeAccountId: taskModalParentTask?.account?.accountId,
              }
              : {
                taskName: `CREATE SYLLABUS: Syllabus for ${taskModalParentTask?.taskName?.replace("CREATE SUBJECT: ", "") || ""} v1`,
                description: `Draft syllabus content for Syllabus for ${taskModalParentTask?.taskName?.replace("CREATE SUBJECT: ", "") || ""} v1`,
                priority: "MEDIUM",
              }
        }
      />
    </div>
  );
}
