"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { RequestService, RequestItem } from "@/services/request.service";
import { PDCMBaseLayout } from "@/components/layout/PDCMBaseLayout";
import CreateRequestModal from "@/components/dashboard/CreateRequestModal";
import RequestDetailModal from "@/components/dashboard/RequestDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, RefreshCw, ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle, Eye } from "lucide-react";

const C = {
  primary: "#41683f",
  primaryDim: "#355c34",
  primaryContainer: "#c1eeba",
  surface: "#f8faf2",
  surfaceContainerLow: "#f1f5eb",
  surfaceContainerHigh: "#e4eade",
  onSurface: "#2d342b",
  onSurfaceVariant: "#5a6157",
  outlineVariant: "#adb4a8",
};

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: "Pending",     color: "#b45309", bg: "#fef3c7", icon: Clock },
  APPROVED:    { label: "Approved",    color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  REJECTED:    { label: "Rejected",    color: "#b91c1c", bg: "#ffe4e6", icon: XCircle },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || { label: status, color: C.onSurfaceVariant, bg: C.surfaceContainerHigh, icon: null };
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {Icon && <Icon size={12} />}
      {cfg.label}
    </span>
  );
};

export default function RequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const {
    data: requestsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pdcm-requests", user?.accountId, statusFilter, page],
    queryFn: () =>
      RequestService.getRequests({
        createdById: user?.accountId,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        size: 10,
        sortBy: "createdAt",
        direction: "desc",
      }),
    enabled: !!user?.accountId,
  });

  const requests: RequestItem[] = (requestsData as any)?.data?.content || [];
  const totalPages: number = (requestsData as any)?.data?.totalPages || 0;

  const sidebarItems = [
    {
      id: "tasks",
      label: "My Tasks",
      icon: "task",
      isActive: false,
      onClick: () => router.push("/dashboard/pdcm/develop"),
    },
    {
      id: "requests",
      label: "My Requests",
      icon: "send",
      isActive: true,
      onClick: () => {},
    },
  ];

  const FILTER_TABS = [
    { id: "all" as StatusFilter, label: "All", icon: "apps" },
    { id: "PENDING" as StatusFilter, label: "Pending", icon: "schedule" },
    { id: "APPROVED" as StatusFilter, label: "Approved", icon: "task_alt" },
    { id: "REJECTED" as StatusFilter, label: "Rejected", icon: "cancel" },
  ];

  return (
    <PDCMBaseLayout
      activeSidebarId="requests"
      sidebarItems={sidebarItems}
      headerTabs={[
        { id: "develop", label: "My Task", isActive: false, onClick: () => router.push("/dashboard/pdcm/develop") },
        ...(user?.role?.toUpperCase() !== 'COLLABORATOR' ? [{ id: "peer-review", label: "My Review Task", isActive: false, onClick: () => router.push("/dashboard/pdcm/peer-review") }] : []),
        { id: "requests", label: "Requests", isActive: true, onClick: () => {} },
      ]}
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Page Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                My Requests
              </h2>
              <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
                List of requests you have sent
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-all"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}40` }}
              >
                <Plus size={18} />
                Create Request
              </button>
            </div>
          </div>
        </header>

        {/* Status Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(0); }}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all"
              style={
                statusFilter === tab.id
                  ? { background: C.primary, color: "white", boxShadow: `0 4px 12px ${C.primary}30` }
                  : { background: C.surfaceContainerHigh, color: C.onSurfaceVariant }
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-100" style={{ background: `${C.primary}04` }}>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400 w-10 text-center">#</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Title</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Type</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Receiver</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Created Date</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <AnimatePresence mode="popLayout">
                    {requests.map((req, idx) => (
                      <motion.tr
                        key={req.requestId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">
                          {page * 10 + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${C.primary}12`, color: C.primary }}
                            >
                              <ClipboardList size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold truncate max-w-[260px]" style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                {req.title || "Untitled"}
                              </p>
                              <p className="text-xs text-zinc-400 truncate max-w-[260px]">{req.content}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border"
                            style={{ background: `${C.primary}08`, color: C.primary, borderColor: `${C.primary}20` }}
                          >
                            {(req as any).type || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-500">
                          {req.receivedBy?.fullName || req.receivedBy?.email || "—"}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-500 whitespace-nowrap">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-50 text-zinc-400 hover:bg-primary-50 hover:text-primary-600 transition-all border border-zinc-200 hover:border-primary-200"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className="py-24 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl"
            style={{ borderColor: `${C.outlineVariant}40`, background: "#fafffe" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.surfaceContainerHigh }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>send</span>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: C.onSurface }}>No requests found</h3>
            <p className="text-sm mb-6" style={{ color: C.onSurfaceVariant }}>Create your first request!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: C.primary }}
            >
              <Plus size={18} />
              Create Request
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 mb-12">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-zinc-100 disabled:opacity-50 hover:bg-zinc-50 transition-all"
            >
              <span className="material-symbols-outlined text-zinc-600">chevron_left</span>
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    page === i ? "text-white shadow-md" : "bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                  }`}
                  style={page === i ? { background: C.primary } : {}}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-zinc-100 disabled:opacity-50 hover:bg-zinc-50 transition-all"
            >
              <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["pdcm-requests"] });
        }}
      />

      <RequestDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </PDCMBaseLayout>
  );
}
