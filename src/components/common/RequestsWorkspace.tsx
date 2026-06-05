"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  Eye,
  Send,
  Inbox,
} from "lucide-react";
import { RequestItem, RequestService } from "@/services/request.service";
import RequestsWorkspaceCreateModal from "./requests/RequestsWorkspaceCreateModal";
import RequestsWorkspaceDetailModal from "./requests/RequestsWorkspaceDetailModal";

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
  role: "HoCFDC" | "HoPDC" | "VP";
}

export default function RequestsWorkspace({ role }: RequestsWorkspaceProps) {
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
  const [requestSource, setRequestSource] = useState<"CREATED" | "RECEIVED">(
    role === "VP" ? "RECEIVED" : "CREATED",
  );
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
  });

  const tabs = [
    { id: "ALL", label: "All Requests" },
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
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
      const createdById =
        requestSource === "CREATED" ? user.accountId : undefined;
      const receivedById =
        requestSource === "RECEIVED" ? user.accountId : undefined;

      const [allRes, pendingRes, approvedRes] = await Promise.all([
        RequestService.getRequests({
          page: 0,
          size: 3,
          search: search || undefined,
          createdById,
          receivedById,
        }),
        RequestService.getRequests({
          page: 0,
          size: 3,
          search: search || undefined,
          createdById,
          receivedById,
          status: "PENDING",
        }),
        RequestService.getRequests({
          page: 0,
          size: 3,
          search: search || undefined,
          createdById,
          receivedById,
          status: "APPROVED",
        }),
      ]);

      setStatusCounts({
        ALL: allRes?.data?.totalElements || 0,
        PENDING: pendingRes?.data?.totalElements || 0,
        APPROVED: approvedRes?.data?.totalElements || 0,
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
      const createdById =
        requestSource === "CREATED" ? user.accountId : undefined;
      const receivedById =
        requestSource === "RECEIVED" ? user.accountId : undefined;

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

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleOpenDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowDetailModal(true);
  };

  const handleSuccess = () => {
    fetchRequests();
    fetchStatusCounts();
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
      return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    if (status === "APPROVED")
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (status === "REJECTED")
      return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    return "bg-zinc-100 text-zinc-500 border border-zinc-200";
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
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-1">
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

              {role !== "VP" && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>NEW REQUEST</span>
                </button>
              )}
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
            {role !== "VP" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex bg-zinc-100/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:max-w-[480px] border border-white/60 shadow-inner"
              >
                <button
                  onClick={() => handleSourceTabChange("CREATED")}
                  className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 overflow-hidden ${
                    requestSource === "CREATED"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                  }`}
                >
                  {requestSource === "CREATED" && (
                    <motion.div
                      layoutId="sourceTabActive"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 rounded-xl shadow-lg shadow-primary/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Send size={14} className={requestSource === "CREATED" ? "transform -rotate-12 transition-transform" : ""} />
                    CREATED
                  </span>
                </button>
                <button
                  onClick={() => handleSourceTabChange("RECEIVED")}
                  className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 overflow-hidden ${
                    requestSource === "RECEIVED"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                  }`}
                >
                  {requestSource === "RECEIVED" && (
                    <motion.div
                      layoutId="sourceTabActive"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 rounded-xl shadow-lg shadow-primary/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Inbox size={14} className={requestSource === "RECEIVED" ? "animate-bounce" : ""} />
                    RECEIVED
                  </span>
                </button>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex p-1 bg-surface-container-highest/30 rounded-xl w-full xl:w-auto overflow-x-auto custom-scrollbar"
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
                    className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-white text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50"
                    }`}
                  >
                    <ClipboardList
                      className={`h-4 w-4 ${
                        isActive ? "text-primary" : "text-on-surface-variant/70"
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`py-0.5 px-2 rounded-lg text-[10px] font-black ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-outline/10 text-on-surface-variant"
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
            className="rounded-3xl border border-outline/20 bg-surface p-2 shadow-xl shadow-black/5"
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
                          const targetUser =
                            requestSource === "CREATED"
                              ? req.receivedBy
                              : req.createdBy;
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

                            {/* No Continue button in the table row list */}
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
                          <p className="text-lg font-medium">
                            No requests found
                          </p>
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

      <RequestsWorkspaceCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        role={role}
        user={user}
        requests={requests}
        onSuccess={handleSuccess}
      />

      <RequestsWorkspaceDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequestId(null);
        }}
        requestId={selectedRequestId}
        role={role}
        requestSource={requestSource}
        onSuccess={handleSuccess}
      />
    </>
  );
}
