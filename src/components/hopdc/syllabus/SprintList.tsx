"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  SprintService,
  SPRINT_STATUS,
  SprintItem,
  SprintStatus,
} from "@/services/sprint.service";
import { RootState } from "@/store";
import { SprintCard, calculateRemainingDays } from "@/components/common/sprint/SprintCard";
import { SprintListLayout } from "@/components/common/sprint/SprintListLayout";

export const SprintsReceive = ({
  curriculumId,
  accountId,
}: {
  curriculumId?: string;
  accountId?: string;
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const departmentId = user?.departmentId;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    SPRINT_STATUS.IN_PROGRESS,
  );
  const [page, setPage] = useState(0);
  const size = 100;

  // Force API call on mount to sync with DB
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["sprints"] });
  }, [queryClient]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "sprints",
      accountId ?? null,
      curriculumId ?? null,
      page,
      statusFilter,
      searchQuery,
    ],
    queryFn: () => {
      const commonParams = {
        page,
        size,
        status: statusFilter === "OVERDUE" 
          ? SPRINT_STATUS.IN_PROGRESS 
          : (statusFilter === "ALL" ? undefined : statusFilter),
        search: searchQuery || undefined,
      };

      if (accountId) {
        return SprintService.getSprintsByAccount(accountId, commonParams);
      }

      return SprintService.getSprints({
        ...commonParams,
        curriculumId,
      });
    },
    enabled: Boolean(accountId || curriculumId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const sprints: SprintItem[] = (data?.data?.content || []).filter(
    (sprint) => {
      if (statusFilter === "OVERDUE") {
        return sprint.status === SPRINT_STATUS.IN_PROGRESS && calculateRemainingDays(sprint.endDate) <= 0;
      }
      if (statusFilter === SPRINT_STATUS.IN_PROGRESS) {
        return sprint.status === SPRINT_STATUS.IN_PROGRESS && calculateRemainingDays(sprint.endDate) > 0;
      }
      return statusFilter === "ALL" || sprint.status === statusFilter;
    }
  );
  const totalPages = data?.data?.totalPages || 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const statusOptions = [
    { id: SPRINT_STATUS.IN_PROGRESS, label: "In Progress" },
    { id: SPRINT_STATUS.COMPLETED, label: "Completed" },
    { id: "OVERDUE", label: "Overdue" },
  ];

  const getSprintHref = (sprint: SprintItem) => {
    if (accountId) {
      if (!sprint.curriculumId) return "#";
      const params = new URLSearchParams({
        curriculumId: sprint.curriculumId,
        sprintId: sprint.sprintId,
      });
      return `/dashboard/hopdc/sprint-management?${params.toString()}`;
    }

    const linkedCurriculumId = curriculumId || sprint.curriculumId;
    if (!linkedCurriculumId) return "#";
    return `/dashboard/hocfdc/framework-execution/${linkedCurriculumId}/sprints/${sprint.sprintId}`;
  };

  const getAssignHref = (sprint: SprintItem) => {
    const params = new URLSearchParams({ sprintId: sprint.sprintId });
    if (sprint.curriculumId) params.set("curriculumId", sprint.curriculumId);
    return `/dashboard/hopdc/assignments?${params.toString()}`;
  };

  return (
    <SprintListLayout
      title={
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            Receive Assigned Sprints
          </h1>
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
      filterType="tabs"
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
          departmentId={departmentId}
          formatDate={formatDate}
          detailHref={getSprintHref(sprint)}
          actions={
            <>
              <Link
                href={getAssignHref(sprint)}
                className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md active:scale-95 rounded-xl"
              >
                MANAGE TASK
              </Link>
            </>
          }
        />
      ))}
    </SprintListLayout>
  );
};
