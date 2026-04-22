"use client";

import React, { useState } from "react";
import {
  Plus,
  ChevronLeft,
  KanbanSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SprintService,
  SPRINT_STATUS,
  SprintStatus,
} from "@/services/sprint.service";
import { CurriculumService, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { CreateSprintModal } from "@/components/hocfdc/CreateSprintModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useToast } from "@/components/ui/Toast";
import { SprintCard } from "@/components/common/sprint/SprintCard";
import { SprintListLayout } from "@/components/common/sprint/SprintListLayout";

export const SprintsManagement = ({
  curriculumId,
  isEmbedded = false
}: {
  curriculumId: string;
  isEmbedded?: boolean;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const size = 100;

  const user = useSelector((state: RootState) => state.auth.user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sprints", curriculumId, page, statusFilter, searchQuery],
    queryFn: () =>
      SprintService.getSprints({
        page,
        size,
        status:
          statusFilter === "ALL" ? undefined : (statusFilter as SprintStatus),
        search: searchQuery || undefined,
        curriculumId: curriculumId,
      }),
  });

  const { data: curriculumRes } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
    enabled: !!curriculumId,
  });

  const curriculum = curriculumRes?.data;
  const sprints = data?.data?.content || [];
  const totalPages = (data as any)?.data?.totalPages || 0;

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ sprintId, status }: { sprintId: string; status: string }) =>
      SprintService.updateSprintStatus(sprintId, status),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast(`Sprint updated to ${res.data?.status}`, "success");
        queryClient.invalidateQueries({ queryKey: ["sprints"] });
        
        if (res.data?.status === SPRINT_STATUS.COMPLETED) {
          window.location.reload();
        }
      } else {
        showToast(res.message || "Update failed", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Connection error", "error"),
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) => SprintService.deleteSprint(sprintId),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast("Sprint deleted successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["sprints"] });
      } else {
        showToast(res.message || "Delete failed", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Connection error", "error"),
  });

  const handleStatusChange = (sprintId: string, newStatus: string) => {
    updateStatusMutation.mutate({ sprintId, status: newStatus });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const statusOptions = [
    { id: "ALL", label: "ALL" },
    ...Object.values(SPRINT_STATUS).map((s) => ({ id: s, label: s })),
  ];

  return (
    <>
      <SprintListLayout
        title={
          !isEmbedded && (
            <>
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
              >
                <ChevronLeft
                  className="group-hover:-translate-x-0.5 transition-transform"
                  size={20}
                />
              </button>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-baseline gap-3">
                  Manage Sprints
                  <span className="text-4xl font-black text-zinc-400">
                    for {curriculum?.curriculumName || "..."}
                  </span>
                </h1>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                  Subject Development & Execution
                </p>
              </div>
            </>
          )
        }
        extraHeader={
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={curriculum?.status !== CURRICULUM_STATUS.SYLLABUS_DEVELOP}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-md hover:shadow-lg hover:opacity-90 active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Plus size={16} strokeWidth={3} />
              Initialize Sprint
            </button>
            {curriculum?.status !== CURRICULUM_STATUS.SYLLABUS_DEVELOP && (
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5 bg-amber-50/50 px-3 py-1 rounded-lg border border-amber-100">
                <AlertCircle size={12} />
                Available only in Syllabus Development status
              </p>
            )}
          </div>
        }
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setPage(0);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(s) => {
          setStatusFilter(s);
          setPage(0);
        }}
        statusOptions={statusOptions}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        itemCount={sprints.length}
        pagination={{
          page,
          totalPages,
          setPage,
        }}
      >
        {sprints.map((sprint, idx) => (
          <SprintCard
            key={sprint.sprintId}
            sprint={sprint}
            index={idx}
            formatDate={formatDate}
            detailHref={`/dashboard/hocfdc/framework-execution/${curriculumId}/sprints/${sprint.sprintId}`}
            actions={(total, closed, tasksLoading) => (
              <>
                {sprint.status === SPRINT_STATUS.PLANNING && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "DANGEROUS: Permanent Sprint Deletion? This will erase all planning data for this cycle.",
                        )
                      ) {
                        deleteSprintMutation.mutate(sprint.sprintId);
                      }
                    }}
                    disabled={deleteSprintMutation.isPending}
                    className="p-3 bg-white border border-zinc-100 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all rounded-xl shadow-sm disabled:opacity-50"
                    title="Delete Sprint"
                  >
                    {deleteSprintMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}

                {sprint.status === SPRINT_STATUS.IN_PROGRESS && (
                  <></>
                )}

                <Link
                  href={`/dashboard/hocfdc/framework-execution/${curriculumId}/sprints/${sprint.sprintId}`}
                  className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 rounded-xl"
                >
                  BOARD <KanbanSquare size={14} />
                </Link>
              </>
            )}
          />
        ))}
      </SprintListLayout>

      <CreateSprintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        curriculumId={curriculumId}
      />
    </>
  );
};
