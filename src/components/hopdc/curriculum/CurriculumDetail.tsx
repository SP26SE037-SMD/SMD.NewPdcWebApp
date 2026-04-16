"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Target, Table, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CurriculumDetail as ICurriculumDetail } from "../SprintManagementContent";
import { CurriculumService } from "@/services/curriculum.service";
import { TaskService, TaskItem } from "@/services/task.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface CurriculumDetailProps {
  curriculum: ICurriculumDetail;
  sprintId?: string;
  onBack: () => void;
  onOpenTask: (task: TaskItem) => void;
}

export const CurriculumDetail = ({
  curriculum,
  sprintId,
  onBack,
  onOpenTask,
}: CurriculumDetailProps) => {
  const { user, isLoading: isAuthLoading } = useSelector(
    (state: RootState) => state.auth,
  );
  const departmentId = user?.departmentId;
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<
    "all" | "new_subject" | "reuse_subject"
  >("all");

  const { data: ploRes, isLoading: isPlosLoading } = useQuery({
    queryKey: ["curriculum-plos", curriculum.curriculumId, "DRAFT"],
    queryFn: () =>
      CurriculumService.getPloByCurriculumId(curriculum.curriculumId, "DRAFT"),
    enabled: !!curriculum.curriculumId,
  });

  const apiPlos = Array.isArray(ploRes?.data?.content)
    ? ploRes.data.content
    : [];
  const displayedPlos = apiPlos.length > 0 ? apiPlos : curriculum.plos;

  const { data: tasksRes, isLoading: isTasksLoading } = useQuery({
    queryKey: ["curriculum-task-subjects", sprintId, departmentId],
    queryFn: () =>
      TaskService.getTasksBySprintIdAndDepartmentId(sprintId!, departmentId!),
    enabled: !!sprintId && !!departmentId,
  });

  const taskItems: TaskItem[] = tasksRes?.data?.content || [];

  const taskRows = useMemo(
    () =>
      taskItems
        .filter((task) => {
          const status = task.subjectStatus?.toUpperCase();
          return status === "WAITING_SYLLABUS" || status === "COMPLETED";
        })
        .filter((task) => {
          if (subjectTypeFilter === "all") {
            return true;
          }

          if (subjectTypeFilter === "new_subject") {
            return task.subjectStatus?.toUpperCase() === "WAITING_SYLLABUS";
          }

          return task.subjectStatus?.toUpperCase() === "COMPLETED";
        }),
    [subjectTypeFilter, taskItems],
  );

  const getSubjectTypeLabel = (status?: string) => {
    const normalizedStatus = status?.toUpperCase();
    if (normalizedStatus === "COMPLETED") {
      return "REUSE_SUBJECT";
    }

    if (normalizedStatus === "WAITING_SYLLABUS") {
      return "NEW_SUBJECT";
    }

    return "N/A";
  };

  const getSubjectTypeBadge = (status?: string) => {
    const normalizedStatus = status?.toUpperCase();
    if (normalizedStatus === "COMPLETED") {
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }

    if (normalizedStatus === "WAITING_SYLLABUS") {
      return "bg-amber-50 text-amber-600 border-amber-100";
    }

    return "bg-zinc-50 text-zinc-500 border-zinc-100";
  };

  const openTask = (task: TaskItem) => {
    if (!task.subjectId || !task.subjectStatus) {
      return;
    }

    onOpenTask(task);
  };

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#0b7a47] hover:border-emerald-200 transition-colors"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Task List
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Framework:{" "}
            <span className="text-primary-500 italic">
              {curriculum.curriculumCode}
            </span>
          </h1>
          <p className="text-base text-[#64748b] mt-2">
            {curriculum.curriculumName}
          </p>
        </div>
        <div className="px-5 py-3 bg-[#f8fafc] border border-zinc-100 rounded-2xl flex items-center gap-4">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase text-[#64748b]">
              Status
            </p>
            <p className="text-base font-bold text-amber-600">
              {curriculum.status}
            </p>
          </div>
          <div className="w-px h-6 bg-zinc-200" />
          <div className="text-center">
            <p className="text-[11px] font-black uppercase text-[#64748b]">
              Major
            </p>
            <p className="text-base font-bold text-zinc-900">
              {curriculum.major.majorCode}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Part 1: PLOs */}
        <section className="bg-white p-6 rounded-4xl border border-[#e2e8f0] shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
            <div className="w-10 h-10 bg-primary-500/5 text-primary-500 rounded-xl flex items-center justify-center">
              <Target size={20} />
            </div>
            <h3 className="text-xl font-bold text-[#1e293b]">
              Program Outcomes (PLOs)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isPlosLoading && (
              <div className="text-base text-[#64748b]">Loading PLOs...</div>
            )}

            {!isPlosLoading && displayedPlos.length === 0 && (
              <div className="text-base text-[#64748b]">
                No PLO data available.
              </div>
            )}

            {!isPlosLoading &&
              displayedPlos.map((plo) => (
                <div
                  key={plo.ploId}
                  className="p-4 bg-[#f8fafc] rounded-xl group/plo border border-transparent hover:border-primary-500/20 transition-all"
                >
                  <h4 className="text-base font-bold text-zinc-800">
                    {plo.ploName || plo.ploCode || "PLO"}
                  </h4>
                  <p className="text-base text-[#64748b] leading-relaxed mt-1 opacity-100">
                    {plo.description || "No description"}
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* Part 2: Task Subject */}
        <section className="bg-white rounded-4xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-xl flex items-center justify-center">
                <Table size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#1e293b]">
                Task of Subjects
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase text-[#64748b]">
                Filter Type:
              </span>
              <select
                value={subjectTypeFilter}
                onChange={(e) =>
                  setSubjectTypeFilter(
                    e.target.value as "all" | "new_subject" | "reuse_subject",
                  )
                }
                className="bg-[#f8fafc] border border-zinc-100 rounded-lg px-3 py-1.5 text-sm font-bold text-zinc-900 outline-none focus:border-primary-500 transition-colors"
              >
                <option value="all">All</option>
                <option value="new_subject">New Subject</option>
                <option value="reuse_subject">Reuse Subject</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="p-6 text-[11px] font-black uppercase text-[#64748b]">
                    Task Name
                  </th>
                  <th className="p-6 text-[11px] font-black uppercase text-[#64748b]">
                    Description
                  </th>
                  <th className="p-6 text-[11px] font-black uppercase text-[#64748b]">
                    Status of Task
                  </th>
                  <th className="p-6 text-[11px] font-black uppercase text-[#64748b]">
                    Status of Subject
                  </th>
                  <th className="p-6 text-[11px] font-black uppercase text-[#64748b]">
                    Type of Subject
                  </th>
                  <th className="p-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(isTasksLoading || isAuthLoading) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-base text-[#64748b] text-center"
                    >
                      Loading tasks...
                    </td>
                  </tr>
                )}

                {!isTasksLoading &&
                  !isAuthLoading &&
                  !!sprintId &&
                  taskRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-base text-[#64748b] text-center"
                      >
                        No tasks found.
                      </td>
                    </tr>
                  )}

                {taskRows.map((task) => (
                  <tr
                    key={task.taskId}
                    className="hover:bg-[#f8fafc] transition-colors group/row"
                  >
                    <td className="p-6 text-base text-zinc-600">
                      {task.taskName}
                    </td>
                    <td className="p-6 text-base text-zinc-500 max-w-88">
                      <p className="line-clamp-2">
                        {task.description || "N/A"}
                      </p>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-black border w-fit inline-block ${
                          task.status?.toUpperCase() === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : task.status?.toUpperCase() === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-black border w-fit inline-block ${
                          task.subjectStatus?.toUpperCase() === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {task.subjectStatus || "N/A"}
                      </span>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-black border w-fit inline-block ${getSubjectTypeBadge(
                          task.subjectStatus,
                        )}`}
                      >
                        {getSubjectTypeLabel(task.subjectStatus)}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => openTask(task)}
                        disabled={!task.subjectId || !task.subjectStatus}
                        className="flex items-center gap-2 ml-auto px-4 py-2 bg-[#1e293b] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                      >
                        {task.subjectStatus?.toUpperCase() ===
                        "WAITING_SYLLABUS"
                          ? "Process"
                          : "View"}
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {!sprintId && !isAuthLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-base text-[#64748b] text-center"
                    >
                      Missing sprintId. Please open from Sprint Board.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
