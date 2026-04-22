"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Search,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  Eye,
  Activity,
  Box,
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useRouter } from "next/navigation";

export default function HoCFDCDashboardContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<string>("INTERNAL_REVIEW");
  const [sortBy, setSortBy] = useState<"NAME" | "CURRICULUM_COUNT">("NAME");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const router = useRouter();

  // Fetch Majors
  const { data: majorResponse, isLoading: isMajorsLoading } = useQuery({
    queryKey: ["majors-hoc", search, selectedStatus],
    queryFn: () => MajorService.getMajors({ search, status: selectedStatus }),
  });

  // Fetch all Curriculums to count them per major
  const { data: curriculumResponse } = useQuery({
    queryKey: ["all-curriculums-counts-hoc"],
    queryFn: () => CurriculumService.getCurriculums({ size: 1000 }),
  });

  const majors = (majorResponse?.data?.content || []).filter(
    (m) => m.status !== "DRAFT",
  );
  const curriculumsList = curriculumResponse?.data?.content || [];

  // Calculate counts per major code
  const curriculumCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    curriculumsList.forEach((curr) => {
      const code = curr.major?.majorCode || curr.majorCode;
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [curriculumsList]);

  const sortedMajors = useMemo(() => {
    return [...majors].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "NAME") {
        comparison = a.majorName.localeCompare(b.majorName);
      } else if (sortBy === "CURRICULUM_COUNT") {
        const countA = curriculumCountsMap[a.majorCode] || 0;
        const countB = curriculumCountsMap[b.majorCode] || 0;
        comparison = countA - countB;
      }
      return sortDir === "ASC" ? comparison : -comparison;
    });
  }, [majors, sortBy, sortDir, curriculumCountsMap]);

  const handleOpenDetail = (id: string) => {
    router.push(`/dashboard/hocfdc/${encodeURIComponent(id)}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="px-8 py-10 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white sticky top-0 z-20">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
            View Majors.
          </h1>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Filters Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search major code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-full py-2.5 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between px-6 py-2.5 bg-white border border-zinc-100 rounded-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-300 transition-all shadow-sm"
              >
                {selectedStatus ? selectedStatus.replace("_", " ") : "Show all"}
                <ChevronDown
                  size={14}
                  className={`opacity-40 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1"
                  >
                    {["", "INTERNAL_REVIEW", "PUBLISHED", "ARCHIVED"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setIsStatusOpen(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                            selectedStatus === status
                              ? "bg-primary text-white"
                              : "text-zinc-500 hover:bg-zinc-50"
                          }`}
                        >
                          {status === ""
                            ? "Show All"
                            : status.replace("_", " ")}
                        </button>
                      ),
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Sorting Dropdown */}
            <div className="relative w-full sm:w-64">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between px-6 py-2.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-300 transition-all shadow-sm"
              >
                Sort By:{" "}
                <span className="text-zinc-900">
                  {sortBy === "NAME" ? "Major Name" : "Curriculum Count"} (
                  {sortDir})
                </span>
                <ChevronDown
                  size={14}
                  className={`opacity-40 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1 min-w-[240px]"
                  >
                    {[
                      {
                        label: "Name (A-Z)",
                        by: "NAME" as const,
                        dir: "ASC" as const,
                      },
                      {
                        label: "Name (Z-A)",
                        by: "NAME" as const,
                        dir: "DESC" as const,
                      },
                      {
                        label: "Most Curriculums",
                        by: "CURRICULUM_COUNT" as const,
                        dir: "DESC" as const,
                      },
                      {
                        label: "Least Curriculums",
                        by: "CURRICULUM_COUNT" as const,
                        dir: "ASC" as const,
                      },
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSortBy(opt.by);
                          setSortDir(opt.dir);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors ${
                          sortBy === opt.by && sortDir === opt.dir
                            ? "bg-primary text-white"
                            : "text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Major Grid */}
        {isMajorsLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-300">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-black text-xs uppercase tracking-widest">
              Synchronizing Strategic Data...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {sortedMajors.map((major) => (
                <motion.div
                  key={major.majorId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm hover:shadow-2xl hover:border-zinc-200 transition-all duration-500 group relative flex flex-col h-full overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-zinc-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                          {major.majorCode}
                        </span>
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                            major.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                              : major.status === "INTERNAL_REVIEW"
                                ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                                : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {major.status?.replace("_", " ")}
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-zinc-900 leading-tight tracking-tight group-hover:text-primary transition-colors pr-4">
                        {major.majorName}
                      </h3>
                    </div>
                    <button className="text-zinc-300 hover:text-zinc-900 transition-colors p-1 bg-zinc-50 rounded-lg">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100/50 space-y-1 group/item hover:bg-white hover:border-zinc-200 transition-all">
                      <span className="text-xs font-black text-zinc-900 uppercase tracking-widest block">
                        Curriculums
                      </span>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-black text-zinc-900 leading-none">
                          {curriculumCountsMap[major.majorCode] || 0}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 mb-0.5 lowercase">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => handleOpenDetail(major.majorId)}
                      className="w-full py-3.5 bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                    >
                      View Detail
                      <Eye
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
              {majors.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Box size={48} className="mx-auto text-zinc-100" />
                  <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                    No majors exists
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
