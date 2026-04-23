"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Search,
  ClipboardList,
  Loader2,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  X,
  Eye,
  Wrench,
  FastForward,
} from "lucide-react";
import { toast } from "sonner";
import { TaskService } from "@/services/task.service";
import {
  RequestItem,
  RequestService,
} from "@/services/request.service";
import { Major, MajorService } from "@/services/major.service";
import {
  CurriculumFramework,
  CurriculumService,
} from "@/services/curriculum.service";

export default function RequestsPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumFramework[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );

  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    comment: "",
    status: "PENDING",
    majorId: "",
    curriculumId: "",
  });

  const tabs = [
    { id: "ALL", label: "All Requests" },
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchValue.trim());
      setPage(0);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await RequestService.getRequests({
        search: search || undefined,
        status: activeTab === "ALL" ? undefined : activeTab,
        page,
        size: 10,
        sortBy: "createdAt",
        direction: "desc",
      });

      const payload = response?.data || {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      };

      setRequests(payload.content || []);
      setTotalPages(Math.max(1, payload.totalPages || 1));
      setTotalElements(payload.totalElements || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load requests");
      setRequests([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, activeTab, page]);

  const fetchMajors = async () => {
    if (majors.length > 0) return;
    setLoadingMajors(true);
    try {
      const response = await MajorService.getMajors({ size: 100, page: 0 });
      setMajors(response?.data?.content || []);
    } catch (err) {
      setMajors([]);
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchCurriculumsByMajor = async (majorId: string) => {
    if (!majorId) {
      setCurriculums([]);
      return;
    }
    setLoadingCurriculums(true);
    try {
      const response = (await CurriculumService.getCurriculumsByMajorId(
        majorId,
      )) as any;
      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setCurriculums(items);
    } catch (err) {
      setCurriculums([]);
    } finally {
      setLoadingCurriculums(false);
    }
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    await fetchMajors();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      title: "",
      content: "",
      comment: "",
      status: "PENDING",
      majorId: "",
      curriculumId: "",
    });
    setCurriculums([]);
  };

  const handleMajorChange = async (majorId: string) => {
    setCreateForm((prev) => ({ ...prev, majorId, curriculumId: "" }));
    await fetchCurriculumsByMajor(majorId);
  };

  const handleCreateRequest = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setError("Title and content are required");
      return;
    }
    if (!createForm.majorId || !createForm.curriculumId) {
      setError("Please choose major and curriculum");
      return;
    }
    if (!user?.accountId) {
      setError("User profile is not ready. Please reload and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await RequestService.createRequest({
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        comment: createForm.comment.trim() || undefined,
        status: createForm.status,
        createdById: user.accountId,
        majorId: createForm.majorId,
        curriculumId: createForm.curriculumId,
      });
      closeCreateModal();
      fetchRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = async (requestId: string) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setSelectedRequest(null);

    try {
      const response = await RequestService.getRequestById(requestId);
      setSelectedRequest(response?.data || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load request detail");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFixCurriculum = async (request: RequestItem) => {
    // Try multiple ways to get the majorId
    const majorId = request.major?.majorId || request.curriculum?.major?.majorId;
    
    console.log("Attempting to fix curriculum for request:", request.requestId, "MajorID:", majorId);

    if (!majorId) {
      toast.error("Major information missing for this request");
      return;
    }

    const toastId = toast.loading("Finding associated task...");
    try {
      // Increase size to 100 to ensure we find it in the list if filtering isn't perfect
      const res = await TaskService.getTasks({ majorId, size: 100 });
      
      // Fallback search in case the API returned more tasks than requested or if filtering was client-side
      const task = res?.data?.content?.find(t => 
        t.majorId === majorId || 
        t.major?.majorId === majorId || 
        t.curriculumId === request.curriculum?.curriculumId
      );
      
      if (task) {
        toast.success("Task found, redirecting...", { id: toastId });
        if (router) {
          router.push(`/dashboard/hocfdc/tasks/${task.taskId}?majorId=${majorId}`);
        } else {
          console.error("Router instance is missing!");
          window.location.href = `/dashboard/hocfdc/tasks/${task.taskId}?majorId=${majorId}`;
        }
      } else {
        console.warn("Task search returned:", res?.data?.content);
        toast.error("Could not find the original task for this curriculum. Please go to Tasks menu directly.", { id: toastId });
      }
    } catch (err) {
      console.error("Navigation error:", err);
      toast.error("Failed to navigate to task detail", { id: toastId });
    }
  };

  const handleContinueToSprint = (request: RequestItem) => {
    const curriculumId = request.curriculum?.curriculumId;
    if (curriculumId) {
      if (router) {
        router.push(`/dashboard/hocfdc/curriculums/${curriculumId}`);
      } else {
        window.location.href = `/dashboard/hocfdc/curriculums/${curriculumId}`;
      }
    } else {
      toast.error("Curriculum information missing");
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: totalElements };
    requests.forEach((req) => {
      const key = req.status || "UNKNOWN";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [requests, totalElements]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
  };

  const getStatusClass = (status: string) => {
    if (status === "PENDING")
      return "bg-secondary-container text-on-secondary-container";
    if (status === "APPROVED") return "bg-primary/10 text-primary";
    return "bg-error/10 text-error";
  };

  return (
    <>
      <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
        <div className="space-y-8 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Requests
              </h1>
              <p className="text-on-surface-variant mt-2 text-base max-w-xl">
                Monitor, approve, and manage all change requests submitted
                across your departments seamlessly.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRequests}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-outline/30 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={openCreateModal}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <ClipboardList className="h-4 w-4" />
                <span>New Request</span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-xl"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by request title"
              className="w-full rounded-2xl border border-outline/20 bg-surface px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
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
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-black/10 text-inherit">
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
                      Curriculum
                    </th>
                    <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">
                      Status
                    </th>
                    <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">
                      Date Submitted
                    </th>
                    <th className="p-5 font-semibold text-center text-on-surface-variant uppercase tracking-wider text-xs">
                      Actions
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
                          <p className="text-sm font-medium">
                            Loading requests...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : requests.length > 0 ? (
                    requests.map((req, idx) => (
                      <motion.tr
                        key={req.requestId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group border-b border-outline/10 transition-all hover:bg-surface-container-lowest/80"
                      >
                        <td className="p-5 font-bold text-on-surface/80">
                          {page * 10 + idx + 1}
                        </td>
                        <td className="p-5">
                          <span className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors">
                            {req.title}
                          </span>
                          <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                            {req.content}
                          </p>
                        </td>
                        <td className="p-5 text-on-surface-variant">
                          {req.major?.majorName ||
                            req.curriculum?.major?.majorName ||
                            "-"}
                        </td>
                        <td className="p-5 text-on-surface-variant">
                          {req.curriculum?.curriculumCode || "-"}
                        </td>
                        <td className="p-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusClass(req.status)}`}
                          >
                            {req.status === "PENDING" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {req.status === "APPROVED" && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            {req.status === "REJECTED" && (
                              <XCircle className="h-3 w-3" />
                            )}
                            {req.status}
                          </span>
                        </td>
                        <td className="p-5 text-on-surface-variant">
                          <div className="flex w-max items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-1 border border-outline/10">
                            <CalendarDays className="w-4 h-4 text-primary/70" />
                            <span className="font-medium whitespace-nowrap">{formatDate(req.createdAt)}</span>
                         </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(req.requestId)}
                            className="inline-flex items-center gap-2 rounded-xl border border-outline/20 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Detail
                          </button>

                          {req.status === "APPROVED" && (
                            <button
                              onClick={() => handleContinueToSprint(req)}
                              className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                            >
                              <FastForward className="h-3.5 w-3.5" />
                              Continue
                            </button>
                          )}

                          {req.status === "REJECTED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFixCurriculum(req);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl bg-error/10 px-4 py-1.5 text-xs font-bold text-error transition hover:bg-error/20 active:scale-95"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              Update Curriculum
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30">
                       <div className="flex flex-col items-center justify-center gap-3">
                        <ClipboardList className="h-10 w-10 text-outline" />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm opacity-70">Try changing filter or search keyword.</p>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-xs font-medium text-on-surface-variant">
                Total: {totalElements} requests
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

    {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Create New Request</h2>
            <button
              onClick={closeCreateModal}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Create New Request
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                    System Change Governance
                  </p>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Target Major
                    </label>
                    <select
                      value={createForm.majorId}
                      onChange={(e) => handleMajorChange(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                    >
                      <option value="">
                        {loadingMajors ? "Loading majors..." : "Select major"}
                      </option>
                      {majors.map((major) => (
                        <option key={major.majorId} value={major.majorId}>
                          {major.majorCode} - {major.majorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Curriculum Framework
                    </label>
                    <select
                      value={createForm.curriculumId}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          curriculumId: e.target.value,
                        }))
                      }
                      disabled={!createForm.majorId || loadingCurriculums}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none disabled:opacity-50"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                    >
                      <option value="">
                        {loadingCurriculums
                          ? "Loading curriculums..."
                          : "Select curriculum"}
                      </option>
                      {curriculums.map((curriculum) => (
                        <option
                          key={curriculum.curriculumId}
                          value={curriculum.curriculumId}
                        >
                          {curriculum.curriculumCode} -{" "}
                          {curriculum.curriculumName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Request Title
                  </label>
                  <input
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter a descriptive title for this request"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Detailed Content
                  </label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Provide a detailed description of the proposed changes..."
                    rows={4}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Additional Justification (Optional)
                  </label>
                  <textarea
                    value={createForm.comment}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="Any additional notes or justification for this request..."
                    rows={3}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                  />
                </div>
              </div>

              <div className="px-8 py-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3">
                <button
                  onClick={closeCreateModal}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    {showDetailModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Request Detail</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Request Specification
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                    Detailed Governance Review
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

          {detailLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading request detail...</p>
            </div>
          ) : (
            <>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</p>
                      <p className="mt-1 text-sm font-semibold text-on-surface">{selectedRequest.status}</p>
                    </div>
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Created At</p>
                      <p className="mt-1 text-sm text-on-surface">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</p>
                    <p className="mt-1 text-sm font-semibold text-on-surface">{selectedRequest.title}</p>
                  </div>

                  <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Content</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{selectedRequest.content}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Created By</p>
                      <p className="mt-1 text-sm text-on-surface">
                        {selectedRequest.createdBy?.fullName
                          || selectedRequest.createdBy?.email
                          || (selectedRequest.createdBy?.accountId
                              ? `User (${selectedRequest.createdBy.accountId.slice(0, 8)}...)`
                              : "-")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Curriculum</p>
                      <p className="mt-1 text-sm text-on-surface">
                        {selectedRequest.curriculum?.curriculumCode || "-"}
                        {selectedRequest.curriculum?.curriculumName
                          ? ` - ${selectedRequest.curriculum.curriculumName}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Major</p>
                      <p className="mt-1 text-sm text-on-surface">{selectedRequest.major?.majorName || selectedRequest.curriculum?.major?.majorName || "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Updated At</p>
                      <p className="mt-1 text-sm text-on-surface">{formatDate(selectedRequest.updatedAt)}</p>
                    </div>
                  </div>

                  {selectedRequest.comment && (
                    <div className="rounded-2xl border border-outline/20 bg-zinc-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Comment</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{selectedRequest.comment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-14 text-center text-sm text-on-surface-variant">
                  No detail data.
                </div>
              )}

              {selectedRequest && !detailLoading && (
                <div className="mt-8 flex justify-end gap-3 border-t border-outline/10 pt-6">
                  {selectedRequest.status === "APPROVED" && (
                    <button
                      onClick={() => handleContinueToSprint(selectedRequest)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                      <FastForward className="h-4 w-4" />
                      Continue to Sprint Planning
                    </button>
                  )}
                  {selectedRequest.status === "REJECTED" && (
                    <button
                      onClick={() => handleFixCurriculum(selectedRequest)}
                      className="inline-flex items-center gap-2 rounded-xl bg-error px-6 py-2.5 text-sm font-bold text-on-primary transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-error/20"
                    >
                      <Wrench className="h-4 w-4" />
                      Update Curriculum
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
