"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Check,
  Clock,
  FileText,
  Loader2,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface RequestItem {
  requestId: string;
  title: string;
  content: string;
  comment: string;
  status: string;
  createdBy: any;
  curriculum: {
    curriculumId: string;
    curriculumCode: string;
    curriculumName: string;
    startYear: number;
    endYear: number;
    status: string;
    major: {
      majorId: string;
      majorCode: string;
      majorName: string;
    };
  };
  major: {
    majorId: string;
    majorCode: string;
    majorName: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DigitalEnactmentContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Thêm filter status=PENDING
      const response = await fetch("/api/requests?status=PENDING");
      const data = await response.json();
      if (data?.data?.content) {
        setItems(data.data.content);
        setTotal(data.data.totalElements || data.data.content.length);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestClick = async (request: RequestItem) => {
    setProcessing((prev) => [...prev, request.requestId]);
    try {
      // Khi bấm vào, lấy requestId đưa vào api get request by requestId
      const response = await fetch(`/api/requests/${request.requestId}`);
      const data = await response.json();

      if (data?.data) {
        const reqData = data.data;
        const curId =
          reqData.curriculum?.curriculumId || request.curriculum?.curriculumId;
        const majId = reqData.major?.majorId || request.major?.majorId;

        // Lưu vào localStorage
        if (reqData.requestId)
          localStorage.setItem("requestId", reqData.requestId);
        if (curId) localStorage.setItem("curriculumId", curId);
        if (majId) localStorage.setItem("majorId", majId);

        // Chuyển hướng đến trang review (Optional, nhưng thường sẽ đi tiếp sau khi click)
        if (curId) {
          router.push(`/dashboard/vice-principal/curriculums/${curId}/review`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch request detail:", error);
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== request.requestId));
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Request Enactment
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-500 shadow-sm">
              <Clock size={14} className="text-amber-500" />
              {loading ? "..." : total} Pending
            </div>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Content List (Mở rộng chiếm 12 cột vì đã xoá Filter) */}
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <h3 className="text-base tracking-[0.2em] text-zinc-500">
                  Awaiting Request
                </h3>
                <span className="bg-white border border-zinc-200 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">
                  {total} Items
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-32 flex flex-col items-center justify-center text-zinc-400"
                    >
                      <Loader2
                        className="animate-spin mb-4"
                        size={40}
                        strokeWidth={1.5}
                      />
                      <p className="text-xs font-black uppercase tracking-widest leading-none">
                        Synchronizing Queue...
                      </p>
                    </motion.div>
                  ) : items.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-24 text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <Check size={40} strokeWidth={3} />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-zinc-900">
                          Strategic Approval.
                        </h1>
                        <p className="text-zinc-500 text-base">
                          You have processed all pending items.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    items.map((item, i) => (
                      <motion.div
                        key={item.requestId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 hover:bg-zinc-50/80 transition-all"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-all">
                            <FileText size={24} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-primary uppercase tracking-widest">
                                {item.curriculum?.curriculumCode || "N/A"}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                {item.major?.majorName ||
                                  item.curriculum?.major?.majorName ||
                                  "N/A"}
                              </span>
                            </div>
                            <h4 className="text-xl font-bold text-zinc-900 group-hover:text-primary transition-colors">
                              {item.title ||
                                item.curriculum?.curriculumName ||
                                "Untitled Request"}
                            </h4>
                            <div className="flex items-center gap-4 text-sm font-semibold text-zinc-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                {item.status || "PENDING"}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock size={12} className="text-zinc-400" />{" "}
                                {item.updatedAt
                                  ? new Date(
                                      item.updatedAt,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                          <button
                            onClick={() => handleRequestClick(item)}
                            disabled={processing.includes(item.requestId)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95 shadow-lg shadow-zinc-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing.includes(item.requestId) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <BarChart3 size={14} />
                            )}
                            Review Request
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
