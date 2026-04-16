"use client";

import {
  CurriculumService,
  CurriculumFramework,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Signature,
  Check,
  X,
  Clock,
  FileText,
  ChevronRight,
  Search,
  Filter,
  User,
  Loader2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DigitalEnactmentContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState("");
  const [enacted, setEnacted] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    | typeof CURRICULUM_STATUS.STRUCTURE_REVIEW
    | typeof CURRICULUM_STATUS.FINAL_REVIEW
  >(CURRICULUM_STATUS.STRUCTURE_REVIEW);
  const [items, setItems] = useState<CurriculumFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await CurriculumService.getCurriculums({
        status: activeTab,
        search: search || undefined,
      });
      if (response.data && response.data.content) {
        setItems(response.data.content);
      }
    } catch (error) {
      console.error("Failed to fetch curriculums:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const handleStatusUpdate = async (curriculumId: string) => {
    setProcessing((prev) => [...prev, curriculumId]);
    try {
      const nextStatus =
        activeTab === CURRICULUM_STATUS.STRUCTURE_REVIEW
          ? CURRICULUM_STATUS.STRUCTURE_APPROVED
          : CURRICULUM_STATUS.SIGNED;

      // Update Curriculum Status
      await CurriculumService.updateCurriculumStatus(
        curriculumId,
        nextStatus as any,
      );

      // New: Synchronize Subject Statuses if it's Structure Review Enactment
      if (activeTab === CURRICULUM_STATUS.STRUCTURE_REVIEW) {
        await SubjectService.updateSubjectStatusesBulk(
          curriculumId,
          SUBJECT_STATUS.DEFINED,
          undefined, // No departmentId means update all subjects in curriculum
          SUBJECT_STATUS.DRAFT,
        );
      }

      // Temporary hide for smooth animation before/during potential re-fetch
      setEnacted((prev) => [...prev, curriculumId]);

      // Refresh list after small delay for animation
      setTimeout(() => {
        fetchData();
        setEnacted((prev) => prev.filter((id) => id !== curriculumId));
      }, 500);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update curriculum status. Please try again.");
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== curriculumId));
    }
  };

  const filtered = items.filter((item) => !enacted.includes(item.curriculumId));

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Digital Enactment.
          </h1>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab(CURRICULUM_STATUS.STRUCTURE_REVIEW)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === CURRICULUM_STATUS.STRUCTURE_REVIEW
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Structure Review
          </button>
          <button
            onClick={() => setActiveTab(CURRICULUM_STATUS.FINAL_REVIEW)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === CURRICULUM_STATUS.FINAL_REVIEW
                ? "bg-white text-primary shadow-sm"
                : "text-zinc-400 hover:text-primary"
            }`}
          >
            Final Review
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-500 shadow-sm">
            <Clock size={14} className="text-amber-500" />
            {loading ? "..." : filtered.length} Pending
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filter / Tools */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Search Queue
              </p>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="ID, Name, Dept..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Department Filter
              </p>
              {["All", "Software Eng", "Mathematics", "Languages"].map(
                (dept) => (
                  <button
                    key={dept}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all text-left group"
                  >
                    {dept}
                    <ChevronRight
                      size={12}
                      className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                    />
                  </button>
                ),
              )}
            </div>

            <div className="pt-4">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-primary transition-all shadow-md">
                <Filter size={14} />
                Advanced Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="text-base font-black uppercase tracking-[0.2em] text-zinc-500">
                Awaiting Enactment
              </h3>
              <span className="bg-white border border-zinc-200 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">
                {filtered.length} Items
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
                ) : filtered.length === 0 ? (
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
                        You have signed all pending items.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  filtered.map((item, i) => (
                    <motion.div
                      key={item.curriculumId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 hover:bg-zinc-50/80 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-all">
                          <FileText size={24} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-primary uppercase tracking-widest">
                              {item.curriculumCode}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                              {item.major?.majorName || "N/A"}
                            </span>
                          </div>
                          <h4 className="text-xl font-bold text-zinc-900 group-hover:text-primary transition-colors">
                            {item.curriculumName}
                          </h4>
                          <div className="flex items-center gap-4 text-sm font-semibold text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              <User size={12} className="text-zinc-400" /> Staff
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-zinc-400" />{" "}
                              {item.updatedAt
                                ? new Date(item.updatedAt).toLocaleDateString()
                                : "N/A"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs uppercase font-black bg-emerald-50 text-emerald-500`}
                            >
                              Normal Complexity
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                        {activeTab === CURRICULUM_STATUS.STRUCTURE_REVIEW ? (
                          <Link
                            href={`/dashboard/vice-principal/curriculums/${item.curriculumId}/review`}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
                          >
                            <BarChart3 size={14} />
                            Review Matrix
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusUpdate(item.curriculumId)
                            }
                            disabled={processing.includes(item.curriculumId)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing.includes(item.curriculumId) ? (
                              <Clock size={14} className="animate-spin" />
                            ) : (
                              <Signature size={14} />
                            )}
                            {processing.includes(item.curriculumId)
                              ? "Processing..."
                              : "Enact Syllabus"}
                          </button>
                        )}
                        <button className="flex-1 md:flex-none p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all rounded-xl active:scale-95">
                          <X size={18} />
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
  );
}
