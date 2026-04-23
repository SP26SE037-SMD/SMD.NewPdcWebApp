"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TaskItem, TaskService } from "@/services/task.service";
import { motion } from "framer-motion";
import {
  Search,
  CheckSquare,
  Loader2,
  RefreshCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const tabs = [
    { id: "ALL", label: "All Tasks" },
    { id: "TO_DO", label: "To Do" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "DONE", label: "Done" },
    { id: "REVISION_REQUESTED", label: "Revision Requested" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchValue.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TaskService.getTasks({
        search: search || undefined,
        status: activeTab === "ALL" ? undefined : activeTab,
        accountId: user?.accountId || undefined,
        page,
        size: 10,
        sortBy: "deadline",
        direction: "asc",
      });

      const payload = response?.data || {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      };

      setTasks(payload.content || []);
      setTotalPages(Math.max(1, payload.totalPages || 1));
      setTotalElements(payload.totalElements || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks");
      setTasks([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.accountId) return;
    fetchTasks();
  }, [user?.accountId, activeTab, search, page]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: totalElements };
    tasks.forEach((task) => {
      const key = task.status || "UNKNOWN";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [tasks, totalElements]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  const getPriorityClass = (priority: string) => {
    const normalized = priority?.toUpperCase();
    if (normalized === "HIGH") return "text-error";
    if (normalized === "MEDIUM") return "text-secondary";
    return "text-primary";
  };

  const getStatusClass = (status: string) => {
    if (status === "IN_PROGRESS") return "bg-secondary/10 text-secondary";
    if (status === "DONE") return "bg-primary/10 text-primary";
    if (status === "TO_DO")
      return "bg-surface-container-highest text-on-surface-variant";
    if (status === "REVISION_REQUESTED") return "bg-error/10 text-error";
    return "bg-outline/10 text-on-surface-variant";
  };

  const handleStartTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setStartingTaskId(taskId);
    try {
      await TaskService.updateTaskStatus(
        taskId,
        "IN_PROGRESS",
        user?.accountId || "",
      );
      await fetchTasks();
    } catch (err: any) {
      console.error("Failed to start task:", err);
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleRowClick = (task: TaskItem) => {
    if (task.status === "IN_PROGRESS" || task.status === "TO_DO") {
      const majorId = task.majorId || task.major?.majorId;
      const url = `/dashboard/hocfdc/tasks/${task.taskId}${majorId ? `?majorId=${majorId}` : ""}`;
      router.push(url);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="text-on-surface-variant mt-2 text-base max-w-xl">
              Streamline your workflow. Manage and track all curriculum and
              syllabus evaluations seamlessly.
            </p>
          </div>

          <button
            onClick={fetchTasks}
            disabled={loading || !user?.accountId}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline/30 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-xl mb-5"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by task name"
            className="w-full rounded-2xl border border-outline/20 bg-surface px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-5"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface hover:bg-surface-container border border-outline/20 text-on-surface-variant"
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-black/10">
                {statusCounts[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-outline/20 bg-surface/40 p-2 shadow-xl shadow-black/5 backdrop-blur-2xl"
        >
          {error && (
            <div className="m-3 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-lowest/50">
                <tr className="border-b border-outline/20">
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    No.
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    Title
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    Major
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    Status
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    Priority
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">
                    Due Date
                  </th>
                  <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Loading tasks...</p>
                      </div>
                    </td>
                  </tr>
                ) : tasks.length > 0 ? (
                  tasks.map((task, idx) => (
                    <motion.tr
                      key={task.taskId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleRowClick(task)}
                      className={`group border-b border-outline/10 transition-all hover:bg-surface-container-lowest/80 ${
                        task.status === "IN_PROGRESS" || task.status === "TO_DO"
                          ? "cursor-pointer"
                          : ""
                      }`}
                    >
                      <td className="p-5 font-bold text-on-surface/80">
                        {page * 10 + idx + 1}
                      </td>
                      <td className="p-5">
                        <span className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors">
                          {task.taskName}
                        </span>
                        <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                          {task.description}
                        </p>
                      </td>
                      <td className="p-5">
                        {task.major ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-primary uppercase tracking-wider">
                              {task.major.majorCode}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium max-w-[160px] truncate">
                              {task.major.majorName}
                            </span>
                          </div>
                        ) : task.majorId ? (
                          <span className="text-xs text-on-surface-variant font-mono">
                            {task.majorId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusClass(task.status)}`}
                        >
                          {task.status === "DONE" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <Clock className="h-3 w-3" />
                          )}
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${getPriorityClass(task.priority)}`}
                        >
                          {task.priority?.toUpperCase() === "HIGH" && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {task.priority || "-"}
                        </span>
                      </td>
                      <td className="p-5 text-on-surface-variant">
                        <div className="flex w-max items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-1 border border-outline/10">
                          <CalendarDays className="w-4 h-4 text-primary/70" />
                          <span className="font-medium whitespace-nowrap">
                            {formatDate(task.deadline)}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        {task.status === "TO_DO" ? (
                          <button
                            onClick={(e) => handleStartTask(e, task.taskId)}
                            disabled={startingTaskId === task.taskId}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm shadow-primary/20 transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {startingTaskId === task.taskId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                            Start Task
                          </button>
                        ) : task.status === "IN_PROGRESS" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const majorId =
                                task.majorId || task.major?.majorId;
                              const url = `/dashboard/hocfdc/tasks/${task.taskId}${majorId ? `?majorId=${majorId}` : ""}`;
                              router.push(url);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary active:scale-95"
                          >
                            Do Task
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant">
                            —
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <CheckSquare className="h-10 w-10 text-outline" />
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm opacity-70">
                          Try changing filter or search keyword.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs font-medium text-on-surface-variant">
              Total: {totalElements} tasks
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0 || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline/20 bg-surface text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-semibold text-on-surface-variant">
                Page {page + 1} / {Math.max(1, totalPages)}
              </span>

              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={loading || page >= totalPages - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline/20 bg-surface text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
