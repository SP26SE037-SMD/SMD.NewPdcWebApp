"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TaskItem, TaskService } from "@/services/task.service";
import { motion, AnimatePresence } from "framer-motion";
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
  User,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

export default function VPTasksPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const tabs = [
    { id: "ALL", label: "All Tasks" },
    { id: "TO_DO", label: "To Do" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "DONE", label: "Done" },
    { id: "OVERDUE", label: "Overdue" },
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
        createdBy: user?.accountId || undefined,
        page,
        size: 10,
        sortBy: "deadline",
        direction: "asc",
      });

      const payload = response || {
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

  const { refreshTaskTrigger } = useSelector(
    (state: RootState) => state.notification,
  );

  useEffect(() => {
    if (refreshTaskTrigger > 0) {
      fetchTasks();
    }
  }, [refreshTaskTrigger]);

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

  const getStatusClass = (status: string) => {
    if (status === "IN_PROGRESS") return "bg-secondary/10 text-secondary";
    if (status === "DONE") return "bg-primary/10 text-primary";
    if (status === "TO_DO")
      return "bg-surface-container-highest text-on-surface-variant";
    if (status === "REVISION_REQUESTED" || status === "OVERDUE")
      return "bg-error/10 text-error";
    return "bg-outline/10 text-on-surface-variant";
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
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
            <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-1">
              Task Management
            </h1>
            <p className="text-on-surface-variant text-base max-w-xl">
              Monitor and track all tasks you have created and assigned to other members.
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
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-none mb-6"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon =
              tab.id === "TO_DO"
                ? Clock
                : tab.id === "IN_PROGRESS"
                  ? Play
                  : tab.id === "DONE"
                    ? CheckCircle2
                    : tab.id === "OVERDUE"
                      ? AlertCircle
                      : CheckSquare;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(0);
                }}
                className={`relative group flex items-center gap-2.5 px-6 py-3 rounded-2xl text-base font-bold transition-all duration-300 whitespace-nowrap
                ${
                  isActive
                    ? "text-white"
                    : "bg-white/50 hover:bg-white border border-outline/10 text-on-surface-variant hover:border-primary/20"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-linear-to-r from-primary to-primary/80 rounded-2xl shadow-lg shadow-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`relative z-10 h-4 w-4 ${isActive ? "text-white" : "text-primary/60 group-hover:text-primary"}`}
                />
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 py-0.5 px-2 rounded-lg text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-primary/5 text-primary"}`}
                >
                  {statusCounts[tab.id] ?? 0}
                </span>
              </button>
            );
          })}
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
            <table className="w-full text-left text-sm border-separate border-spacing-y-3 px-3">
              <thead>
                <tr>
                  <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-xs">
                    Task Information
                  </th>
                  <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-xs">
                    Status
                  </th>
                  <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-xs">
                    Timeline
                  </th>
                  <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-xs text-right">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                          <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                        </div>
                        <p className="text-sm font-bold text-primary/60 uppercase tracking-widest">
                          Loading Tasks...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : tasks.length > 0 ? (
                  tasks.map((task, idx) => {
                    const assignTo = (task as any).assignTo;
                    return (
                    <motion.tr
                      key={task.taskId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group bg-white/60 hover:bg-white border border-outline/10 transition-all duration-300 shadow-sm hover:shadow-md ${
                        expandedTaskId === task.taskId
                          ? "bg-white shadow-md z-10 relative"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-6 rounded-l-2xl">
                        <div className="flex flex-col gap-1.5 max-w-md">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(task.taskId);
                              }}
                              className={`p-1 rounded-lg hover:bg-primary/5 transition-all ${expandedTaskId === task.taskId ? "rotate-180 text-primary" : "text-on-surface-variant/40"}`}
                            >
                              <ChevronDown size={18} />
                            </button>
                            <span className="font-bold text-[#2d3335] text-lg transition-colors">
                              {task.taskName}
                            </span>
                          </div>

                          <AnimatePresence>
                            {expandedTaskId === task.taskId ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mt-2 space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                                      Task Description
                                    </span>
                                  </div>
                                  <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                                    {task.description || "No description provided."}
                                  </p>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="flex items-center gap-3 mt-1 pl-8">
                                <p className="line-clamp-1 text-sm text-on-surface-variant/60 leading-relaxed font-medium italic flex-1">
                                  {task.description || "No description provided."}
                                </p>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>

                      <td className="px-5 py-6">
                        <div className="flex flex-col gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest w-max shadow-sm ${getStatusClass(task.status)}`}
                          >
                            {task.status === "DONE" && (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {task.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <CalendarDays className="w-4 h-4 text-primary/40" />
                            <span className="text-sm font-bold">
                              {formatDate(task.deadline || (task as any).dueDate)}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg w-max ${
                              task.priority?.toUpperCase() === "HIGH"
                                ? "bg-error/10 text-error"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {task.priority || "NORMAL"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-6 rounded-r-2xl text-right">
                        {assignTo ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-on-surface">
                                {assignTo.fullName}
                              </span>
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={12} />
                              </div>
                            </div>
                            <span className="text-xs text-on-surface-variant/60 truncate max-w-[150px]">
                              {assignTo.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium italic text-on-surface-variant/50">
                            Unassigned
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center shadow-inner border border-outline/5">
                          <CheckSquare className="h-10 w-10 text-outline/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-on-surface">
                            No Tasks Found
                          </p>
                          <p className="text-sm text-on-surface-variant/70 font-medium">
                            You haven't created any tasks in this category.
                          </p>
                        </div>
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
