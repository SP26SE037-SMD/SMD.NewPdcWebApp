"use client";

import { useMemo, useState } from "react";
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
  ChevronDown,
  ChevronRight,
  PlusCircle,
  ClipboardCheck,
  Loader2,
  BookOpen,
  ExternalLink,
  Plus,
  BookText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateReviewTaskModal } from "./CreateReviewTaskModal";
import { CreateSyllabusModal } from "../subject/CreateSyllabusModal";
import { ReviewTaskItemRow } from "./ReviewTaskItemRow";
import {
  ReviewTaskItem,
  ReviewTaskService,
  REVIEW_TASK_STATUS,
} from "@/services/review-task.service";
import { ManageSyllabusSourcesModal } from "./ManageSyllabusSourcesModal";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";

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
    case "WAITING_SYLLABUS":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "DEFINED":
      return {
        text: "text-indigo-600",
        bg: "bg-indigo-50",
        border: "border-indigo-100",
      };
    case "ARCHIVED":
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
    case "DRAFT":
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
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSyllabusOpen, setIsCreateSyllabusOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: reviewTasksRes, isLoading: isReviewTasksLoading } = useQuery({
    queryKey: ["review-tasks-by-task", task.taskId],
    queryFn: () => ReviewTaskService.getReviewTasksByTaskId(task.taskId),
    enabled: isExpanded,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: subjectDetailRes } = useQuery({
    queryKey: ["subject-detail-for-task", task.subjectId],
    queryFn: () => SubjectService.getSubjectDetail(task.subjectId!),
    enabled: !!task.subjectId,
  });

  const subjectDetail = subjectDetailRes;

  const reviewTasks = reviewTasksRes?.data?.content || [];
  const latestReview = reviewTasks[0];
  const isLatestFromHoCFDC = latestReview?.reviewer?.role === "HOCFDC";

  const hasActiveReview = reviewTasks.some(
    (r: any) =>
      r.status === REVIEW_TASK_STATUS.PENDING ||
      r.status === REVIEW_TASK_STATUS.IN_PROGRESS ||
      r.isAccepted === null ||
      r.isAccepted === undefined,
  );

  const handleCreateReview = async (payload: any) => {
    await ReviewTaskService.createReviewTask(payload);
    await queryClient.invalidateQueries({
      queryKey: ["review-tasks-by-task", task.taskId],
    });
    router.refresh();
  };

  const goToSubjectDetail = () => {
    const isReadOnly = task.status === TASK_STATUS.DONE;
    router.push(
      `/dashboard/hopdc/sprint-management/new-subject?subjectId=${task.subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}${isReadOnly ? "&readOnly=true" : ""}`,
    );
  };

  const isReusedSubject = task.type === TASK_TYPE.REUSED_SUBJECT;
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

  return (
    <div className="group relative bg-white border border-zinc-100 hover:border-zinc-300 transition-all rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch">
        <div className={`w-2 ${statusConfig.color}`} />

        <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-1 flex items-center justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
            >
              {isExpanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-current/20 rounded-md`}
              >
                <StatusIcon size={12} />
                {task.status || "UNKNOWN"}
              </span>
            </div>

            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
              Task: {task.taskName || "N/A"}
            </h3>

            <p className="text-base font-medium text-zinc-500 line-clamp-2">
              Description: {task.description || "N/A"}
            </p>

            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                  Subject Status
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${getSubjectStatusConfig(task.subjectStatus).bg} ${getSubjectStatusConfig(task.subjectStatus).text} ${getSubjectStatusConfig(task.subjectStatus).border}`}
                  >
                    {task.subjectStatus || "DRAFT"}
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
          </div>

          <div className="lg:col-span-4 grid grid-cols-1 gap-3 border-l border-zinc-100 pl-6">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                Assignee
              </p>
              <select
                value={selectedAccountId}
                onChange={(e) => onSelectionChange("accountId", e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-emerald-400 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                disabled={hasAssignedAccount || isReusedSubject}
              >
                {isReusedSubject ? (
                  <option value={currentUser?.accountId}>
                    HoPDC (Self-Mapping)
                  </option>
                ) : (
                  <>
                    <option value="">Select account...</option>
                    {hasAssignedAccount &&
                      selectedAccountId &&
                      !hasSelectedAccountInOptions && (
                        <option value={selectedAccountId}>
                          {lockedAccountLabel}
                        </option>
                      )}
                    {pdcmAccounts.map((account) => (
                      <option key={account.accountId} value={account.accountId}>
                        {getAccountLabel(account)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {!isReusedSubject && (
              <div className="space-y-1">
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                  Syllabus
                </p>
                {hasAssignedAccount ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-base text-zinc-700 min-h-10 flex items-center">
                    {isSyllabusLoading
                      ? "Loading..."
                      : selectedSyllabus
                        ? getSyllabusLabel(selectedSyllabus as any)
                        : "N/A"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSyllabusId}
                      onChange={(e) =>
                        onSelectionChange("syllabusId", e.target.value)
                      }
                      disabled={isSyllabusLoading}
                      className="w-[240px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-emerald-400 disabled:bg-zinc-100 truncate"
                    >
                      <option value="">Select syllabus...</option>
                      {syllabusOptions.map((s) => (
                        <option key={s.syllabusId} value={s.syllabusId}>
                          {getSyllabusLabel(s)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreateSyllabusOpen(true)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0 disabled:opacity-50"
                      title="Create New Syllabus"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const s = syllabusOptions.find(
                          (opt) => opt.syllabusId === selectedSyllabusId,
                        );
                        onManageSources(
                          selectedSyllabusId,
                          s ? getSyllabusLabel(s) : "",
                        );
                      }}
                      disabled={!selectedSyllabusId}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors shrink-0 disabled:opacity-50 disabled:grayscale disabled:bg-zinc-100 disabled:border-zinc-200"
                      title="Manage Reference Materials"
                    >
                      <BookText size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isReusedSubject && (
              <div className="space-y-1">
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                  Deadline
                </p>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <input
                    type="date"
                    value={selectedDeadline}
                    onChange={(e) =>
                      onSelectionChange("deadline", e.target.value)
                    }
                    disabled={hasAssignedAccount}
                    className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-emerald-400 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-2">
            <div className="flex flex-col gap-2 min-w-[160px]">
              <button
                type="button"
                onClick={() => {
                  if (isReusedSubject) {
                    onComplete(task);
                  } else {
                    onSave(task, selectedSyllabusId);
                  }
                }}
                disabled={
                  isSaving ||
                  isCompleting ||
                  (hasAssignedAccount && !isReusedSubject) ||
                  (isReusedSubject && isDone)
                }
                className={`flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 rounded-xl disabled:opacity-60 ${
                  isReusedSubject
                    ? isDone
                      ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                    : hasAssignedAccount
                      ? "bg-zinc-100 text-zinc-400 border border-zinc-200"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {isSaving || isCompleting
                  ? "Processing..."
                  : isReusedSubject
                    ? isDone
                      ? "MAPPING DONE"
                      : "MARK AS DONE"
                    : hasAssignedAccount
                      ? "SAVED TASK"
                      : "SAVE TASK"}
              </button>

              {!isReusedSubject && (
                <div className="relative group/btn">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    disabled={hasActiveReview || isDone || isLatestFromHoCFDC}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm rounded-xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    title={
                      isDone
                        ? "Task is already completed"
                        : hasActiveReview
                          ? "A review is already in progress"
                          : isLatestFromHoCFDC
                            ? "Review from HoCFDC must be acknowledged first"
                            : "Assign Reviewer"
                    }
                  >
                    <PlusCircle size={16} />
                    {isDone 
                      ? "Task Finished" 
                      : hasActiveReview 
                        ? "Review Active" 
                        : isLatestFromHoCFDC
                          ? "HoCFDC Locked"
                          : "Assign Reviewer"}
                  </button>
                  {(hasActiveReview || isDone || isLatestFromHoCFDC) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-900 text-white text-[9px] font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {isDone 
                        ? "Cannot assign reviewer to a finished task" 
                        : isLatestFromHoCFDC
                          ? "Review feedback from HoCFDC must be acknowledged first"
                          : "Ongoing review must be finished first"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-50/50 border-t border-zinc-100"
          >
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-zinc-400" />
                  <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    Review Cycle Logs
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {reviewTasks.length} AUDITS FOUND
                </span>
              </div>

              {isReviewTasksLoading ? (
                <div className="flex items-center gap-3 text-zinc-400 py-6">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Fetching Review History...
                  </span>
                </div>
              ) : reviewTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {reviewTasks.map((review: ReviewTaskItem, idx: number) => (
                    <ReviewTaskItemRow
                      key={review.reviewId}
                      review={review}
                      onRecreateTask={() => setIsModalOpen(true)}
                      isLatest={idx === 0}
                      isTaskDone={isDone}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
                  <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                    No review activities recorded yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateReviewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReview}
        taskId={task.taskId}
        taskName={task.taskName}
        reviewers={pdcmAccounts}
        taskDeadline={task.deadline}
        sprintDeadline={sprintDeadline}
        assigneeId={task.account?.accountId}
      />

      <CreateSyllabusModal
        subjectId={task.subjectId || ""}
        accountEmail={user?.email || ""}
        minBloomLevel={subjectDetail?.minBloomLevel || 0}
        minAvgGrade={subjectDetail?.minToPass || 0}
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
      queryClient.invalidateQueries({ queryKey: ["hopdc-receive-task-curriculum-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["syllabus"] }),
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["review-tasks-by-task"] })
    ]);
    
    router.refresh();
    router.push("/dashboard/hopdc/sprint-management");
  };

  const { data: departmentAccounts = [], isLoading: isAccountsLoading } =
    useQuery({
      queryKey: ["assignments-department-accounts", departmentId],
      queryFn: () => AccountService.getAccountsByDepartment(departmentId),
      enabled: !!departmentId,
    });

  const pdcmAccounts = useMemo<DepartmentAccount[]>(() => {
    return departmentAccounts.filter(
      (account) => account.roleName?.toUpperCase() === "PDCM",
    );
  }, [departmentAccounts]);

  const {
    data: tasksRes,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useQuery({
    queryKey: ["assignments", sprintId, departmentId],
    queryFn: () =>
      TaskService.getTasksBySprintIdAndDepartmentId(sprintId, departmentId),
    enabled: !!sprintId && !!departmentId,
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
    return tasksRes?.data?.content || [];
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

  const taskTypes = useMemo(() => {
    const types = Array.from(new Set(tasks.map((t) => t.type || "OTHER")));
    return types.sort();
  }, [tasks]);

  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Set default type when tasks load
  useMemo(() => {
    if (taskTypes.length > 0 && !selectedType) {
      setSelectedType(taskTypes[0]);
    }
  }, [taskTypes, selectedType]);

  const filteredTasks = useMemo(() => {
    if (!selectedType) return tasks;
    return tasks.filter((t) => (t.type || "OTHER") === selectedType);
  }, [tasks, selectedType]);

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
          await CloPloService.updateClosStatus(
            targetTask.subjectId,
            "INTERNAL_REVIEW",
          );
        } catch (error) {
          console.warn("Soft fail: Unable to update CLOs to INTERNAL_REVIEW", error);
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
          console.warn("Soft fail: Unable to update syllabus to IN_PROGRESS", error);
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
        queryKey: ["assignments", sprintId, departmentId],
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
        queryKey: ["assignments", sprintId, departmentId],
      });
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to complete task", "error");
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
        Back to Sprint Management
      </button>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            Assign Tasks
          </h1>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            {sprint?.sprintName || "Sprint Management"}
          </p>
        </div>

        {sprint?.endDate && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl shadow-sm">
            <Clock size={16} className="text-amber-600" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">
                  Sprint Deadline
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

      {taskTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100/50 rounded-2xl w-fit border border-zinc-200">
          {taskTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
                selectedType === type
                  ? "bg-white text-[var(--primary)] shadow-sm shadow-zinc-200 border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
              }`}
            >
              {type.replace(/_/g, " ")}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                selectedType === type ? "bg-[var(--primary)] text-white" : "bg-zinc-200 text-zinc-600"
              }`}>
                {tasks.filter(t => (t.type || "OTHER") === type).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-base font-medium text-zinc-500">
            No tasks found for {selectedType?.replace(/_/g, " ") || "this type"}.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const originalIndex = tasks.findIndex(t => t.taskId === task.taskId);
            return (
              <TaskRow
              key={task.taskId}
              task={task}
              pdcmAccounts={pdcmAccounts}
              syllabusOptions={syllabiByTaskId[task.taskId]}
              onSave={handleSaveTask}
              isSaving={
                saveTaskMutation.isPending &&
                saveTaskMutation.variables?.taskId === task.taskId
              }
              saveError={saveErrorByTaskId[task.taskId]}
              saveSuccess={saveSuccessByTaskId[task.taskId]}
              isSyllabusLoading={syllabiQueries[originalIndex]?.isLoading ?? false}
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
            />
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
    </div>
  );
}
