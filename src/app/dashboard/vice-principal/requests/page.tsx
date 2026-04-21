"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface RequestItem {
  requestId: string;
  title: string;
  content?: string;
  comment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  createdBy?: {
    accountId: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  };
  curriculum?: { curriculumId: string; curriculumCode: string; curriculumName: string };
  major?: { majorId: string; majorCode: string; majorName: string };
  createdAt?: string;
  updatedAt?: string;
}

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: "PENDING", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  APPROVED: { label: "APPROVED", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { label: "REJECTED", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function shortenId(id: string) {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "—";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────
   New Request Modal
───────────────────────────────────────────── */
function NewRequestModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ title: "", content: "", comment: "", status: "PENDING" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Tiêu đề là bắt buộc."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Tạo request thất bại");
      setForm({ title: "", content: "", comment: "", status: "PENDING" });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 20 }}>close</span>
          </button>

          <h2 className="text-2xl font-extrabold text-[#1d5c42] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New Request</h2>
          <p className="text-sm text-slate-500 mb-6">Điền thông tin yêu cầu bên dưới</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Tiêu đề *</label>
              <input
                type="text" maxLength={50}
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder="Tối đa 50 ký tự..."
              />
              <p className="text-[10px] text-slate-400 mt-1 text-right">{form.title.length}/50</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Nội dung</label>
              <textarea
                rows={4} value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                placeholder="Mô tả chi tiết yêu cầu..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Ghi chú</label>
              <input
                type="text" value={form.comment}
                onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder="Ghi chú bổ sung (tùy chọn)..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-5 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                Hủy
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#2d6a4f] to-[#1d5c42] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:pointer-events-none">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang tạo...</>
                  : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>Tạo Request</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Detail Modal
───────────────────────────────────────────── */
function DetailModal({ request, onClose, onStatusChange }: { request: RequestItem; onClose: () => void; onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const changeStatus = async (status: string) => {
    if (status === "REJECTED" && !rejectReason.trim()) return;

    setUpdating(true);
    try {
      // 1. If REJECTED, first call PUT to update the comment field specifically
      if (status === "REJECTED") {
        const updatePayload = {
          title: request.title,
          content: request.content,
          comment: rejectReason,
          status: request.status, // Keep current status for the PUT update
          createdById: request.createdBy?.accountId,
          curriculumId: request.curriculum?.curriculumId,
          majorId: request.major?.majorId,
        };

        await fetch(`/api/requests/${request.requestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
      }

      // 2. Call PATCH to update the status
      const url = `/api/requests/${request.requestId}/status?status=${status}`;
      await fetch(url, { method: "PATCH" });

      onStatusChange();
      onClose();
    } catch (err) {
      console.error("Failed to update request:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 20 }}>close</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2d6a4f]">inbox</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shortenId(request.requestId)}</p>
              <h2 className="text-lg font-extrabold text-[#1d5c42]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{request.title}</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-400 font-semibold">Trạng thái</span>
              <StatusBadge status={request.status} />
            </div>
            {request.createdBy && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Người gửi</span>
                <span className="font-bold text-slate-800">{request.createdBy.fullName ?? request.createdBy.email ?? "—"}</span>
              </div>
            )}
            {request.curriculum && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Curriculum</span>
                <span className="font-bold text-slate-800">{request.curriculum.curriculumCode}</span>
              </div>
            )}
            {request.major && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Major</span>
                <span className="font-bold text-slate-800">{request.major.majorCode}</span>
              </div>
            )}
            <div className="py-3 border-b border-slate-100">
              <p className="text-slate-400 font-semibold mb-2">Nội dung</p>
              <p className="text-slate-700 leading-relaxed">{request.content || "—"}</p>
            </div>

            {/* Rejection Input */}
            {isRejecting && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                <p className="text-[#991b1b] font-bold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span> Lý do Từ chối <span className="text-red-400">*</span>
                </p>
                <textarea
                  autoFocus
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do tại sao bạn từ chối yêu cầu này..."
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-red-50/30 focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all text-slate-700 resize-none"
                />
              </motion.div>
            )}

            {/* Show reason if already rejected */}
            {request.status === "REJECTED" && request.comment && !isRejecting && (
              <div className="py-3 bg-red-50/50 rounded-xl px-4 border border-red-100">
                <p className="text-red-800 font-bold mb-1 text-xs uppercase tracking-tight">Lý do Reject</p>
                <p className="text-red-700 italic">{request.comment}</p>
              </div>
            )}
          </div>

          {request.status === "PENDING" && (
            <div className="flex gap-3 mt-6">
              {isRejecting ? (
                <>
                  <button onClick={() => setIsRejecting(false)} disabled={updating}
                    className="flex-1 px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                    Hủy
                  </button>
                  <button onClick={() => changeStatus("REJECTED")} disabled={updating || !rejectReason.trim()}
                    className="flex-[2] px-5 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all text-sm flex items-center justify-center gap-2">
                    {updating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Xác nhận Từ chối"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsRejecting(true)} disabled={updating}
                    className="flex-1 px-5 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-all text-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">cancel</span> Từ chối
                  </button>
                  <button onClick={() => changeStatus("APPROVED")} disabled={updating}
                    className="flex-1 px-5 py-3 bg-gradient-to-br from-[#2d6a4f] to-[#1d5c42] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2">
                    {updating
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    Phê duyệt
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Table Skeleton (outside component to avoid remount loops)
───────────────────────────────────────────── */
const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 6 }).map((_, j) => (
          <td key={j} className="px-8 py-5">
            <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: `${60 + (i * j * 7) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function RequestManagementPage() {

  // State
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailRequest, setDetailRequest] = useState<RequestItem | null>(null);

  // KPI counters
  const [kpiTotal, setKpiTotal] = useState(0);
  const [kpiPending, setKpiPending] = useState(0);
  const [kpiApproved, setKpiApproved] = useState(0);

  /* ── Refs to access latest filter values without recreating fetchRequests ── */
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  /* ── Stable fetch list ── */
  const fetchRequests = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        size: String(PAGE_SIZE),
        sortBy: "createdAt",
        direction: "desc",
      });
      if (searchQueryRef.current) params.set("search", searchQueryRef.current);
      if (statusFilterRef.current) params.set("status", statusFilterRef.current);

      const res = await fetch(`/api/requests?${params.toString()}`);
      const json = await res.json();
      const paged: PagedResponse<RequestItem> = json.data;
      setRequests(paged.content ?? []);
      setTotalElements(paged.totalElements ?? 0);
      setTotalPages(paged.totalPages ?? 1);
      setPage(p);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ⚠️ Empty deps → stable, reads filters via refs

  /* ── Fetch KPIs (full count without filters) ── */
  const fetchKPIs = useCallback(async () => {
    try {
      const all = await fetch("/api/requests?page=0&size=1&sortBy=createdAt&direction=desc");
      const allJson = await all.json();
      setKpiTotal(allJson.data?.totalElements ?? 0);

      const pending = await fetch("/api/requests?page=0&size=1&status=PENDING");
      const pendingJson = await pending.json();
      setKpiPending(pendingJson.data?.totalElements ?? 0);

      const approved = await fetch("/api/requests?page=0&size=1&status=APPROVED");
      const approvedJson = await approved.json();
      setKpiApproved(approvedJson.data?.totalElements ?? 0);
    } catch { /* silent */ }
  }, []);

  // ← Only fetch on mount, not on every filter state change
  useEffect(() => { fetchRequests(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchKPIs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards = [
    { label: "Total Requests", value: kpiTotal, icon: "inbox", bg: "bg-[#2d6a4f]", text: "text-white", sub: "Tất cả yêu cầu" },
    { label: "Pending Approval", value: kpiPending, icon: "pending_actions", bg: "bg-amber-50", text: "text-amber-800", sub: "Chờ phê duyệt" },
    { label: "Completed", value: kpiApproved, icon: "check_circle", bg: "bg-emerald-50", text: "text-emerald-800", sub: "Đã phê duyệt" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Content ── */}
      <div className="pt-10 px-10 pb-12 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <h1
              className="text-4xl font-extrabold tracking-tight text-[#1d5c42] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              REQUEST MANAGEMENT
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2d6a4f]" style={{ fontSize: 18 }}>info</span>
              Quản lý tất cả yêu cầu từ giảng viên và bộ môn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRequests(page)}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              REFRESH
            </button>
          </div>
        </motion.div>

        {/* ── KPI Bento Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
        >
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={`${card.bg} p-6 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <p className={`font-bold text-xs uppercase tracking-widest ${card.text} opacity-80`}>{card.label}</p>
                <span className={`material-symbols-outlined ${card.text} opacity-70`} style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </div>
              <div>
                <span className={`text-3xl font-extrabold ${card.text}`}>{card.value.toLocaleString()}</span>
                <p className={`text-xs mt-0.5 ${card.text} opacity-60`}>{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-wrap items-center gap-4 mb-6 shadow-sm"
        >
          {/* Search */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>search</span>
            <input
              id="request-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRequests(0)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              placeholder="Tìm theo tiêu đề..."
            />
          </div>
          {/* Status filter */}
          <select
            id="request-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
            id="request-search-btn"
            onClick={() => fetchRequests(0)}
            className="px-5 py-3 bg-[#2d6a4f] text-white font-bold rounded-xl hover:bg-[#1d5c42] transition-all text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
            Lọc
          </button>
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(45,51,53,0.05)] border border-slate-100"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["ID", "Tiêu đề", "Người gửi", "Ngày gửi", "Trạng thái", "Actions"].map((col, i) => (
                  <th
                    key={col}
                    className={`px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ${i === 5 ? "text-right" : ""}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <TableSkeleton />
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="material-symbols-outlined text-5xl opacity-30">inbox</span>
                      <p className="font-bold">Không có yêu cầu nào</p>
                      <p className="text-sm">Thử bỏ bộ lọc hoặc tạo request mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => (
                  <motion.tr
                    key={req.requestId}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-emerald-50/30 transition-colors cursor-pointer"
                    onClick={() => setDetailRequest(req)}
                  >
                    {/* ID */}
                    <td className="px-8 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                        {shortenId(req.requestId)}
                      </span>
                    </td>
                    {/* Title */}
                    <td className="px-8 py-5 max-w-[220px]">
                      <p className="font-bold text-slate-800 text-sm truncate">{req.title}</p>
                      {req.curriculum && (
                        <p className="text-xs text-slate-400 mt-0.5">{req.curriculum.curriculumCode}</p>
                      )}
                    </td>
                    {/* Sender */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[#2d6a4f] font-black text-xs shrink-0 border border-emerald-200">
                          {req.createdBy?.fullName
                            ? req.createdBy.fullName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                          {req.createdBy?.fullName ?? req.createdBy?.email ?? "—"}
                        </span>
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-8 py-5">
                      <span className="text-sm text-slate-500">{formatDate(req.createdAt)}</span>
                    </td>
                    {/* Status */}
                    <td className="px-8 py-5">
                      <StatusBadge status={req.status} />
                    </td>
                    {/* Actions */}
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`view-request-${req.requestId}`}
                        onClick={() => setDetailRequest(req)}
                        className="p-2 text-slate-400 hover:text-[#2d6a4f] transition-colors rounded-lg hover:bg-emerald-50"
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_new</span>
                      </button>
                      <button
                        id={`menu-request-${req.requestId}`}
                        className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                        title="Thêm tùy chọn"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── Pagination Footer ── */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Showing {Math.min(page * PAGE_SIZE + 1, totalElements)}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements.toLocaleString()} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRequests(page - 1)}
                disabled={page === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i;
                return (
                  <button
                    key={p}
                    onClick={() => fetchRequests(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${p === page
                        ? "bg-[#2d6a4f] text-white shadow-md shadow-emerald-900/20"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300"
                      }`}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                onClick={() => fetchRequests(page + 1)}
                disabled={page >= totalPages - 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Modals ── */}
      {detailRequest && (
        <DetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onStatusChange={() => { fetchRequests(page); fetchKPIs(); }}
        />
      )}
    </div>
  );
}
