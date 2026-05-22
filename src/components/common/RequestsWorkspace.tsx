"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const getInitials = (name?: string) => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

interface RequestsWorkspaceProps {
  role: "HoCFDC" | "HoPDC";
}

export default function RequestsWorkspace({ role }: RequestsWorkspaceProps) {
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

  // Split tabs for createdBy (CREATED) and receiveBy (RECEIVED)
  const [requestSource, setRequestSource] = useState<"CREATED" | "RECEIVED">("CREATED");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumFramework[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    comment: "",
    status: "PENDING",
    majorId: "",
    curriculumId: "",
  });

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
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

  const fetchStatusCounts = async () => {
    if (!user?.accountId) return;
    try {
      const createdById = requestSource === "CREATED" ? user.accountId : undefined;
      const receivedById = requestSource === "RECEIVED" ? user.accountId : undefined;

      const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        RequestService.getRequests({ page: 0, size: 3, search: search || undefined, createdById, receivedById }),
        RequestService.getRequests({ page: 0, size: 3, search: search || undefined, createdById, receivedById, status: "PENDING" }),
        RequestService.getRequests({ page: 0, size: 3, search: search || undefined, createdById, receivedById, status: "APPROVED" }),
        RequestService.getRequests({ page: 0, size: 3, search: search || undefined, createdById, receivedById, status: "REJECTED" }),
      ]);

      setStatusCounts({
        ALL: allRes?.data?.totalElements || 0,
        PENDING: pendingRes?.data?.totalElements || 0,
        APPROVED: approvedRes?.data?.totalElements || 0,
        REJECTED: rejectedRes?.data?.totalElements || 0,
      });
    } catch (err) {
      console.error("Failed to load status counts", err);
    }
  };

  const fetchRequests = async () => {
    if (!user?.accountId) return;
    setLoading(true);
    setError(null);
    try {
      const createdById = requestSource === "CREATED" ? user.accountId : undefined;
      const receivedById = requestSource === "RECEIVED" ? user.accountId : undefined;

      let sortByParam = "createdAt";
      let directionParam: "asc" | "desc" = "desc";

      switch (sortBy) {
        case "title-asc":
          sortByParam = "title";
          directionParam = "asc";
          break;
        case "title-desc":
          sortByParam = "title";
          directionParam = "desc";
          break;
        case "major-asc":
          sortByParam = "major";
          directionParam = "asc";
          break;
        case "major-desc":
          sortByParam = "major";
          directionParam = "desc";
          break;
        case "curriculum-asc":
          sortByParam = "curriculum";
          directionParam = "asc";
          break;
        case "curriculum-desc":
          sortByParam = "curriculum";
          directionParam = "desc";
          break;
        case "date-asc":
          sortByParam = "createdAt";
          directionParam = "asc";
          break;
        case "date-desc":
        default:
          sortByParam = "createdAt";
          directionParam = "desc";
          break;
      }

      const statusParam = activeTab === "ALL" ? undefined : activeTab;

      const response = await RequestService.getRequests({
        page,
        size: 10,
        sortBy: sortByParam,
        direction: directionParam,
        search: search || undefined,
        status: statusParam,
        createdById,
        receivedById,
      });

      if (response && response.data) {
        setRequests(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setRequests([]);
        setTotalPages(1);
        setTotalElements(0);
      }
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
    fetchStatusCounts();
  }, [search, requestSource, user?.accountId]);

  useEffect(() => {
    fetchRequests();
  }, [search, activeTab, page, requestSource, sortBy, user?.accountId]);

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
        curriculumId: createForm.curriculumId,
        majorId: createForm.majorId,
      });

      closeCreateModal();
      toast.success("Request created successfully!");
      fetchRequests();
      fetchStatusCounts();
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
      if (response && response.data) {
        setSelectedRequest(response.data);
      } else {
        setSelectedRequest(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load request detail");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFixCurriculum = async (request: RequestItem) => {
    const majorId = request.major?.majorId || request.curriculum?.major?.majorId;
    const curriculumId = request.curriculum?.curriculumId;

    if (!curriculumId || !majorId) {
      toast.error("Required information missing for this request");
      return;
    }

    const toastId = toast.loading("Analyzing curriculum state...");
    try {
      const curRes = await CurriculumService.getCurriculumById(curriculumId);
      const curriculum = curRes?.data || curRes;
      const status = curriculum?.status || curriculum?.curriculumStatus;

      if (role === "HoCFDC") {
        // HoCFDC logic
        if (status === "DRAFT") {
          const res = await TaskService.getTasks({ majorId, size: 100 });
          const task = res?.content?.find(
            (t) =>
              t.majorId === majorId ||
              t.major?.majorId === majorId ||
              t.curriculumId === curriculumId,
          );

          if (task) {
            toast.success("Navigating to task builder...", { id: toastId });
            router.push(`/dashboard/hocfdc/tasks/${task.taskId}?majorId=${majorId}`);
          } else {
            toast.error("Original task not found. Please use the Tasks menu.", {
              id: toastId,
            });
          }
        } else if (status === "SYLLABUS_DEVELOP") {
          toast.success("Navigating to syllabus workspace...", { id: toastId });
          const feedback = request.comment || "";
          router.push(
            `/dashboard/hocfdc/curriculums/${curriculumId}?isFromRejected=true&feedback=${encodeURIComponent(feedback)}`,
          );
        } else {
          toast.error(`Curriculum is currently in ${status} status.`, {
            id: toastId,
          });
        }
      } else {
        // HoPDC logic
        if (status === "DRAFT") {
          const res = await TaskService.getTasks({ majorId, size: 100 });
          const task = res?.content?.find(
            (t) =>
              t.majorId === majorId ||
              t.major?.majorId === majorId ||
              t.curriculumId === curriculumId,
          );

          if (task) {
            toast.success("Navigating to assignment workspace...", { id: toastId });
            router.push(
              `/dashboard/hopdc/assignments?sprintId=${task.sprintId}&curriculumId=${curriculumId}`,
            );
          } else {
            toast.error("Original task not found.", { id: toastId });
          }
        } else {
          toast.success("Navigating to curriculum deliverables...", { id: toastId });
          router.push(`/dashboard/hopdc/sprint-management`);
        }
      }
    } catch (err) {
      console.error("Navigation error:", err);
      toast.error("Failed to analyze curriculum state", { id: toastId });
    }
  };

  const handleContinueToSprint = (request: RequestItem) => {
    const curriculumId = request.curriculum?.curriculumId;
    if (!curriculumId) {
      toast.error("Curriculum information missing");
      return;
    }

    if (role === "HoCFDC") {
      router.push(`/dashboard/hocfdc/curriculums/${curriculumId}`);
    } else {
      router.push(`/dashboard/hopdc/sprint-management`);
    }
  };

  const handleSourceTabChange = (source: "CREATED" | "RECEIVED") => {
    setRequestSource(source);
    setPage(0);
    setActiveTab("ALL");
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
  };

  const getStatusClass = (status: string) => {
    if (status === "PENDING")
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    if (status === "APPROVED")
      return "bg-primary/10 text-primary border border-primary/20";
    return "bg-error/10 text-error border border-error/20";
  };

  return (
    <>
      <div className="space-y-8 p-4">
        <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5"
          >
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-1">
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
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/80 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <ClipboardList className="h-4 w-4" />
                <span>NEW REQUEST</span>
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full md:max-w-md"
            >
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by request title or curriculum code..."
                className="w-full rounded-2xl border border-outline/20 bg-white/60 px-11 py-3 text-sm text-on-surface outline-none transition focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </motion.div>

            {/* Request Source Segmented Tabs */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex bg-zinc-100 p-1.5 rounded-2xl w-full md:max-w-md border border-zinc-200/50"
            >
              <button
                onClick={() => handleSourceTabChange("CREATED")}
                className={`flex-1 relative py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  requestSource === "CREATED" ? "text-white" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {requestSource === "CREATED" && (
                  <motion.div
                    layoutId="sourceTabActive"
                    className="absolute inset-0 bg-primary rounded-xl shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Created</span>
              </button>
              <button
                onClick={() => handleSourceTabChange("RECEIVED")}
                className={`flex-1 relative py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  requestSource === "RECEIVED" ? "text-white" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {requestSource === "RECEIVED" && (
                  <motion.div
                    layoutId="sourceTabActive"
                    className="absolute inset-0 bg-primary rounded-xl shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Received</span>
              </button>
            </motion.div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-none w-full xl:w-auto"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
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
                    <ClipboardList
                      className={`relative z-10 h-4 w-4 ${
                        isActive ? "text-white" : "text-primary/60 group-hover:text-primary"
                      }`}
                    />
                    <span className="relative z-10">{tab.label}</span>
                    <span
                      className={`relative z-10 py-0.5 px-2 rounded-lg text-[10px] font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-primary/5 text-primary"
                      }`}
                    >
                      {statusCounts[tab.id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Sort Dropdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 bg-white hover:bg-white/80 border border-outline/10 px-4 py-2.5 rounded-2xl shadow-sm w-full sm:w-auto self-stretch sm:self-start xl:self-auto justify-between sm:justify-start"
            >
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                className="bg-transparent text-xs font-bold text-zinc-700 outline-none pr-8 cursor-pointer appearance-none flex-1 sm:flex-initial"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.25rem center",
                  backgroundSize: "1rem",
                }}
              >
                <option value="date-desc">Date Submitted (Newest)</option>
                <option value="date-asc">Date Submitted (Oldest)</option>
                <option value="title-asc">Title (A - Z)</option>
                <option value="title-desc">Title (Z - A)</option>
              </select>
            </motion.div>
          </div>

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
                    <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                      No.
                    </th>
                    <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                      Title
                    </th>
                    <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                      {requestSource === "CREATED" ? "Receiver" : "Created By"}
                    </th>
                    <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                      Status
                    </th>
                    <th className="px-5 py-2 font-bold text-on-surface-variant/60 uppercase tracking-widest text-[10px] whitespace-nowrap">
                      Date Submitted
                    </th>
                    <th className="px-5 py-2 font-bold text-center text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">Loading requests...</p>
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
                        className="group bg-white/60 hover:bg-white border border-outline/10 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <td className="px-5 py-6 rounded-l-2xl font-bold text-on-surface/80">
                          {page * 10 + idx + 1}
                        </td>
                        <td className="px-5 py-6">
                          <div className="flex flex-col gap-1 max-w-sm">
                            <span className="font-bold text-[#2d3335] text-base group-hover:text-primary transition-colors duration-300">
                              {req.title}
                            </span>
                            <p className="line-clamp-2 text-xs text-on-surface-variant/70 leading-relaxed font-medium">
                              {req.content}
                            </p>
                          </div>
                        </td>
                        {(() => {
                          const targetUser = requestSource === "CREATED" ? req.receivedBy : req.createdBy;
                          return (
                            <td className="px-5 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex-shrink-0 shadow-xs">
                                  {getInitials(targetUser?.fullName)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-sm text-[#2d3335] line-clamp-1">
                                    {targetUser?.fullName || "Unknown"}
                                  </span>
                                  <span className="text-xs text-on-surface-variant/70 font-medium line-clamp-1">
                                    {targetUser?.email || "-"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })()}
                        <td className="px-5 py-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusClass(
                              req.status,
                            )}`}
                          >
                            {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                            {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                            {req.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-6 text-on-surface-variant">
                          <div className="flex w-max items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-1 border border-outline/10 font-bold">
                            <CalendarDays className="w-4 h-4 text-primary/40" />
                            <span className="text-sm font-bold whitespace-nowrap">
                              {formatDate(req.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-6 rounded-r-2xl text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenDetail(req.requestId)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white active:scale-95"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Detail
                            </button>

                            {req.status === "APPROVED" && (
                              <button
                                onClick={() => handleContinueToSprint(req)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-primary to-primary/80 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/10 transition duration-300 hover:scale-105 active:scale-95"
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
                                className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-error to-error/80 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-error/10 transition duration-300 hover:scale-105 active:scale-95"
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
                      <td
                        colSpan={6}
                        className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <ClipboardList className="h-10 w-10 text-outline" />
                          <p className="text-lg font-medium">No requests found</p>
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
                  onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
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

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Create New Request</h2>
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

              {/* Content */}
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
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="">{loadingMajors ? "Loading majors..." : "Select major"}</option>
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
                        setCreateForm((prev) => ({ ...prev, curriculumId: e.target.value }))
                      }
                      disabled={!createForm.majorId || loadingCurriculums}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none disabled:opacity-50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="">
                        {loadingCurriculums ? "Loading curriculums..." : "Select curriculum"}
                      </option>
                      {curriculums.map((curriculum) => (
                        <option key={curriculum.curriculumId} value={curriculum.curriculumId}>
                          {curriculum.curriculumCode} - {curriculum.curriculumName}
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
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
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
                      setCreateForm((prev) => ({ ...prev, content: e.target.value }))
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
                      setCreateForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    placeholder="Any additional notes or justification for this request..."
                    rows={3}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
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

      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Request Specification</h2>
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

              {/* Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      Synchronizing Data...
                    </p>
                  </div>
                ) : selectedRequest ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Current Status
                        </label>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider ${getStatusClass(
                            selectedRequest.status,
                          )}`}
                        >
                          {selectedRequest.status === "PENDING" && <Clock size={12} />}
                          {selectedRequest.status === "APPROVED" && <CheckCircle2 size={12} />}
                          {selectedRequest.status === "REJECTED" && <XCircle size={12} />}
                          {selectedRequest.status}
                        </span>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Submission Timeline
                        </label>
                        <p className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <CalendarDays size={16} className="text-primary" />
                          {formatDate(selectedRequest.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">
                        Request Overview
                      </label>
                      <h4 className="text-lg font-bold text-zinc-900 mb-3">{selectedRequest.title}</h4>
                      <p className="text-zinc-600 leading-relaxed text-sm font-medium">
                        {selectedRequest.content}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Originating Authority
                        </label>
                        <p className="text-sm font-bold text-zinc-900">
                          {selectedRequest.createdBy?.fullName ||
                            selectedRequest.createdBy?.email ||
                            "-"}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Target Framework
                        </label>
                        <p className="text-sm font-bold text-zinc-900">
                          {selectedRequest.curriculum?.curriculumCode || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Academic Major
                        </label>
                        <p className="text-sm font-bold text-zinc-900">
                          {selectedRequest.major?.majorName ||
                            selectedRequest.curriculum?.major?.majorName ||
                            "-"}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                          Last Modified
                        </label>
                        <p className="text-sm font-bold text-zinc-900">
                          {formatDate(selectedRequest.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.comment && (
                      <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 italic">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-3">
                          Decision Comment
                        </label>
                        <p className="text-zinc-700 text-sm font-medium leading-relaxed">
                          "{selectedRequest.comment}"
                        </p>
                      </div>
                    )}

                    {selectedRequest && !detailLoading && (
                      <div className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-6">
                        {selectedRequest.status === "APPROVED" && (
                          <button
                            onClick={() => handleContinueToSprint(selectedRequest)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                          >
                            <FastForward className="h-4 w-4" />
                            Continue to Curriculum Overview
                          </button>
                        )}
                        {selectedRequest.status === "REJECTED" && (
                          <button
                            onClick={() => handleFixCurriculum(selectedRequest)}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
                          >
                            <Wrench className="h-4 w-4" />
                            Update Curriculum
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-14 text-center text-zinc-400 italic">
                    No detailed metadata available for this entity.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-8 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold shadow-lg shadow-zinc-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
