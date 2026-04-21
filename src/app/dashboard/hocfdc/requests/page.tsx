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
  createdBy?: { accountId: string; email?: string; fullName?: string };
  curriculum?: { curriculumId: string; curriculumCode: string; curriculumName: string };
  major?: { majorId: string; majorCode: string; majorName: string };
  createdAt?: string;
}

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface MajorItem {
  majorId: string;
  majorCode: string;
  majorName: string;
}

interface CurriculumShort {
  curriculumId: string;
  curriculumCode: string;
  curriculumName: string;
  status: string;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:  { label: "PENDING",  bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  APPROVED: { label: "APPROVED", bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500" },
  REJECTED: { label: "REJECTED", bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
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
   Fieldset wrapper
───────────────────────────────────────────── */
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all";
const selectCls = `${inputCls} cursor-pointer`;

/* ─────────────────────────────────────────────
   New Request Modal (HoCFDC version)
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
  const initialForm = {
    requestType: "normal" as "normal" | "curriculum",
    title: "",
    content: "",
    majorId: "",
    curriculumId: "",
  };
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Major dropdown data
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);

  // Curriculum dropdown data (depends on selected major)
  const [curriculums, setCurriculums] = useState<CurriculumShort[]>([]);
  const [currLoading, setCurrLoading] = useState(false);

  // Fetch majors when modal opens
  useEffect(() => {
    if (!open) return;
    setMajorsLoading(true);
    fetch("/api/majors?page=0&size=100&sort=majorCode,asc")
      .then((r) => r.json())
      .then((json) => setMajors(json.data?.content ?? []))
      .catch(() => setMajors([]))
      .finally(() => setMajorsLoading(false));
  }, [open]);

  // Fetch curriculums when major changes
  useEffect(() => {
    setCurriculums([]);
    setForm((f) => ({ ...f, curriculumId: "" }));
    if (!form.majorId) return;
    setCurrLoading(true);
    fetch(`/api/curriculums/major/${form.majorId}`)
      .then((r) => r.json())
      .then((json) => setCurriculums(Array.isArray(json.data) ? json.data : []))
      .catch(() => setCurriculums([]))
      .finally(() => setCurrLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.majorId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setForm({ title: "", content: "", comment: "", requestType: "normal", majorId: "", curriculumId: "" });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Tiêu đề là bắt buộc."); return; }
    if (form.requestType === "curriculum" && !form.majorId) { setError("Vui lòng chọn Major."); return; }
    if (form.requestType === "curriculum" && !form.curriculumId) { setError("Vui lòng chọn Curriculum."); return; }

    setLoading(true); setError(null);
    try {
      const payload: Record<string, string> = {
        title: form.title,
        content: form.content,
        status: "PENDING",
      };
      if (form.requestType === "curriculum") {
        if (form.majorId) payload.majorId = form.majorId;
        if (form.curriculumId) payload.curriculumId = form.curriculumId;
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Tạo request thất bại");
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
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 relative overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>close</span>
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#2d6a4f]" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>add_box</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#1d5c42]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Tạo Request mới
              </h2>
            </div>
            <p className="text-sm text-slate-400 ml-12">Điền thông tin yêu cầu bên dưới</p>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}

            <form id="new-request-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Request Type */}
              <Field label="Loại yêu cầu" required>
                <div className="grid grid-cols-2 gap-3">
                  {(["normal", "curriculum"] as const).map((type) => {
                    const isSelected = form.requestType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, requestType: type, majorId: "", curriculumId: "" }))}
                        className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          isSelected
                            ? "border-[#2d6a4f] bg-emerald-50 text-[#1d5c42] shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 18, fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {type === "normal" ? "description" : "menu_book"}
                        </span>
                        {type === "normal" ? "Normal" : "Curriculum"}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Conditional: Major + Curriculum dropdowns */}
              <AnimatePresence>
                {form.requestType === "curriculum" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden space-y-4"
                  >
                    {/* Major dropdown */}
                    <Field label="Major" required>
                      <div className="relative">
                        <select
                          id="new-request-major-select"
                          value={form.majorId}
                          onChange={(e) => setForm((f) => ({ ...f, majorId: e.target.value }))}
                          className={selectCls}
                          disabled={majorsLoading}
                        >
                          <option value="">
                            {majorsLoading ? "Đang tải..." : "— Chọn Major —"}
                          </option>
                          {majors.map((m) => (
                            <option key={m.majorId} value={m.majorId}>
                              {m.majorCode} – {m.majorName}
                            </option>
                          ))}
                        </select>
                        {majorsLoading && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-[#2d6a4f] rounded-full animate-spin" />
                        )}
                      </div>
                    </Field>

                    {/* Curriculum dropdown (depends on major) */}
                    <Field label="Curriculum" required>
                      <div className="relative">
                        <select
                          id="new-request-curriculum-select"
                          value={form.curriculumId}
                          onChange={(e) => setForm((f) => ({ ...f, curriculumId: e.target.value }))}
                          className={selectCls}
                          disabled={!form.majorId || currLoading}
                        >
                          <option value="">
                            {!form.majorId
                              ? "Chọn Major trước..."
                              : currLoading
                              ? "Đang tải..."
                              : curriculums.length === 0
                              ? "Không có curriculum"
                              : "— Chọn Curriculum —"}
                          </option>
                          {curriculums.map((c) => (
                            <option key={c.curriculumId} value={c.curriculumId}>
                              {c.curriculumCode} – {c.curriculumName}
                            </option>
                          ))}
                        </select>
                        {currLoading && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-[#2d6a4f] rounded-full animate-spin" />
                        )}
                      </div>
                      {form.majorId && !currLoading && curriculums.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">{curriculums.length} curriculum tìm thấy</p>
                      )}
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-1" />

              {/* Title */}
              <Field label="Tiêu đề" required>
                <input
                  type="text"
                  maxLength={50}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                  placeholder="Tối đa 50 ký tự..."
                  id="new-request-title"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{form.title.length}/50</p>
              </Field>

              {/* Content */}
              <Field label="Nội dung">
                <textarea
                  rows={3}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className={`${inputCls} resize-none`}
                  placeholder="Mô tả chi tiết yêu cầu..."
                  id="new-request-content"
                />
              </Field>


            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4 border-t border-slate-100 shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="new-request-form"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#2d6a4f] to-[#1d5c42] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang tạo...</>
                  : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>Gửi Request</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Detail Modal (read-only for HoCFDC)
───────────────────────────────────────────── */
function DetailModal({ request, onClose }: { request: RequestItem; onClose: () => void }) {
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
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>close</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2d6a4f]" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shortenId(request.requestId)}</p>
              <h2 className="text-lg font-extrabold text-[#1d5c42]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{request.title}</h2>
            </div>
          </div>

          <div className="space-y-0 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400 font-semibold">Trạng thái</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400 font-semibold">Ngày gửi</span>
              <span className="font-bold text-slate-700">{formatDate(request.createdAt)}</span>
            </div>
            {request.major && (
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400 font-semibold">Major</span>
                <span className="font-bold text-slate-700">{request.major.majorCode} – {request.major.majorName}</span>
              </div>
            )}
            {request.curriculum && (
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400 font-semibold">Curriculum</span>
                <span className="font-bold text-slate-700">{request.curriculum.curriculumCode}</span>
              </div>
            )}
            {request.content && (
              <div className="py-3">
                <p className="text-slate-400 font-semibold mb-2">Nội dung</p>
                <p className="text-slate-700 leading-relaxed text-sm">{request.content}</p>
              </div>
            )}
            {request.status === "REJECTED" && request.comment && (
              <div className="py-3 bg-red-50/50 rounded-xl px-4 border border-red-100 mt-2">
                <p className="text-red-800 font-bold mb-1 text-xs uppercase tracking-tight">Lý do Từ chối</p>
                <p className="text-red-700 italic text-sm">{request.comment}</p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
          >
            Đóng
          </button>
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
        {Array.from({ length: 5 }).map((_, j) => (
          <td key={j} className="px-8 py-5">
            <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: `${50 + ((i + 1) * (j + 1) * 7) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function HoCFDCRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<RequestItem | null>(null);

  // KPI
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
        page: String(p), size: String(PAGE_SIZE),
        sortBy: "createdAt", direction: "desc",
      });
      // Read from refs → always latest value, doesn't recreate callback
      if (searchQueryRef.current) params.set("search", searchQueryRef.current);
      if (statusFilterRef.current) params.set("status", statusFilterRef.current);

      const res = await fetch(`/api/requests?${params}`);
      const json = await res.json();
      const paged: PagedResponse<RequestItem> = json.data;
      setRequests(paged.content ?? []);
      setTotalElements(paged.totalElements ?? 0);
      setTotalPages(paged.totalPages ?? 1);
      setPage(p);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ⚠️ Empty deps → stable reference, reads filters via refs

  /* ── KPIs ── */
  const fetchKPIs = useCallback(async () => {
    try {
      const [allR, pendingR, approvedR] = await Promise.all([
        fetch("/api/requests?page=0&size=1").then((r) => r.json()),
        fetch("/api/requests?page=0&size=1&status=PENDING").then((r) => r.json()),
        fetch("/api/requests?page=0&size=1&status=APPROVED").then((r) => r.json()),
      ]);
      setKpiTotal(allR.data?.totalElements ?? 0);
      setKpiPending(pendingR.data?.totalElements ?? 0);
      setKpiApproved(approvedR.data?.totalElements ?? 0);
    } catch { /* silent */ }
  }, []);

  // ← Fetch only once on mount, NOT on every filter state change
  useEffect(() => { fetchRequests(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchKPIs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const kpiCards = [
    { label: "My Requests",      value: kpiTotal,   icon: "inbox",          bg: "bg-[#2d6a4f]", text: "text-white",       sub: "Tất cả yêu cầu" },
    { label: "Đang chờ duyệt",   value: kpiPending, icon: "pending_actions", bg: "bg-amber-50",  text: "text-amber-800",  sub: "Chờ phê duyệt" },
    { label: "Đã phê duyệt",     value: kpiApproved,icon: "check_circle",    bg: "bg-emerald-50",text: "text-emerald-800",sub: "Hoàn thành" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="pt-10 px-10 pb-12 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#1d5c42] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              REQUEST MANAGEMENT
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2d6a4f]" style={{ fontSize: 18 }}>info</span>
              Gửi và theo dõi các yêu cầu liên quan đến chương trình đào tạo
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
            <button
              id="hocfdc-new-request-btn"
              onClick={() => setShowNewModal(true)}
              className="px-6 py-3 bg-gradient-to-br from-[#2d6a4f] to-[#1d5c42] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
              NEW REQUEST
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
          <div className="flex-1 min-w-[260px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>search</span>
            <input
              id="hocfdc-request-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRequests(0)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              placeholder="Tìm theo tiêu đề..."
            />
          </div>
          <select
            id="hocfdc-request-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
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
                {["ID", "Tiêu đề / Curriculum", "Ngày gửi", "Trạng thái", "Actions"].map((col, i) => (
                  <th
                    key={col}
                    className={`px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
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
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-600">Chưa có yêu cầu nào</p>
                        <p className="text-sm mt-1">Tạo request đầu tiên để bắt đầu</p>
                      </div>
                      <button
                        onClick={() => setShowNewModal(true)}
                        className="mt-2 px-5 py-2.5 bg-gradient-to-br from-[#2d6a4f] to-[#1d5c42] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                        Tạo Request
                      </button>
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
                    {/* Title + curriculum badge */}
                    <td className="px-8 py-5 max-w-[280px]">
                      <p className="font-bold text-slate-800 text-sm truncate">{req.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {req.major && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                            {req.major.majorCode}
                          </span>
                        )}
                        {req.curriculum && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md">
                            {req.curriculum.curriculumCode}
                          </span>
                        )}
                        {!req.major && !req.curriculum && (
                          <span className="text-[10px] text-slate-400">Normal request</span>
                        )}
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
                        id={`hocfdc-view-${req.requestId}`}
                        onClick={() => setDetailRequest(req)}
                        className="p-2 text-slate-400 hover:text-[#2d6a4f] transition-colors rounded-lg hover:bg-emerald-50"
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_new</span>
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
              Showing {requests.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements.toLocaleString()} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRequests(page - 1)}
                disabled={page === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchRequests(i)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    i === page
                      ? "bg-[#2d6a4f] text-white shadow-md shadow-emerald-900/20"
                      : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => fetchRequests(page + 1)}
                disabled={page >= totalPages - 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Modals ── */}
      <NewRequestModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={() => { fetchRequests(0); fetchKPIs(); }}
      />
      {detailRequest && (
        <DetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
        />
      )}
    </div>
  );
}
