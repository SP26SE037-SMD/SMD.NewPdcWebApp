"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  BookOpen,
  ChevronRight,
  Layers,
  LayoutGrid,
  Network,
} from "lucide-react";
import {
  CurriculumFramework,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";

export default function ActiveFrameworksBoard({
  initialData = [],
  isLoading = false,
  error = null,
}: {
  initialData?: CurriculumFramework[];
  isLoading?: boolean;
  error?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredData = initialData.filter(
    (item) =>
      item.status === CURRICULUM_STATUS.SYLLABUS_DEVELOP &&
      (item.curriculumCode.toLowerCase().includes(search.toLowerCase()) ||
        item.curriculumName.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            Active Frameworks <span className="text-zinc-300">/</span>
          </h1>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Syllabus Development Phase Execution
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 border border-zinc-100 shadow-sm rounded-2xl">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search frameworks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none outline-none font-bold text-sm text-zinc-900 placeholder:text-zinc-300 transition-all rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-zinc-300 mb-4" size={32} />
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              Scanning Frameworks...
            </span>
          </div>
        ) : error ? (
          <div className="col-span-full py-20 text-center border-2 border-red-100 bg-red-50/50 rounded-2xl">
            <span className="text-sm font-bold text-red-600">
              Failed to load frameworks: {error}
            </span>
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((curr, idx) => (
            <motion.div
              key={curr.curriculumId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() =>
                router.push(
                  `/dashboard/hocfdc/framework-execution/${curr.curriculumId}`,
                )
              }
              className="group relative bg-white border border-zinc-100 hover:border-zinc-300 transition-all rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow-md flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                    Active
                  </span>
                </div>
                <div className="p-2 border border-zinc-100 bg-zinc-50 rounded-xl group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all text-zinc-400">
                  <ChevronRight size={18} />
                </div>
              </div>

              <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-2 line-clamp-2">
                {curr.curriculumName}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {curr.curriculumCode}
                </span>
                <div className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none truncate">
                  {curr.majorName}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-200 bg-zinc-50/50 rounded-2xl">
            <BookOpen size={48} className="text-zinc-200 mb-4" />
            <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tight">
              No Active Frameworks
            </h3>
            <p className="text-sm font-medium text-zinc-400 mt-1 max-w-sm text-center">
              There are currently no curriculums in the SYLLABUS_DEVELOP
              execution phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
