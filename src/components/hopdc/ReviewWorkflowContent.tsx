"use client";

import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertCircle,
  LayoutGrid,
  Calendar,
  Activity,
  Award,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SyllabusService } from "@/services/syllabus.service";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewWorkflowContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const {
    data: pendingRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pending-review-syllabi"],
    queryFn: () => SyllabusService.getPendingReviewSyllabiByDepartment(),
  });

  const pendingSyllabi = Array.isArray(pendingRes?.data)
    ? pendingRes?.data
    : [];

  const filteredSyllabi = pendingSyllabi.filter(s => 
    (s.syllabusName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subjectName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    s.status !== 'REVISION_REQUESTED'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary rounded-full animate-spin"></div>
          <p className="text-primary font-black uppercase tracking-widest text-[11px]">
            Fetching pending syllabi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Syllabus{" "}
            <span className="text-primary italic font-medium lowercase">
              pending review
            </span>
          </h1>
          <p className="text-muted mt-2 text-base font-medium">
            Review and assign peer-reviewers for submitted syllabi.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by code, name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
          />
        </div>
      </div>

      {filteredSyllabi.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-dashed border-border rounded-[3rem] py-32 flex flex-col items-center text-center px-6"
        >
          <div className="w-20 h-20 bg-background text-muted rounded-full flex items-center justify-center mb-6">
            <BookOpen size={40} />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">
            Workspace empty
          </h3>
          <p className="text-muted max-w-md font-medium tracking-tight">
            There are currently no syllabi awaiting review in your department.
            New submissions will appear here automatically.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredSyllabi.map((syllabus, index) => (
              <motion.div
                key={syllabus.syllabusId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-border rounded-[2.5rem] p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase text-primary tracking-widest">
                        {syllabus.subjectCode}
                      </div>
                      <h3 className="text-xl font-black text-foreground leading-tight truncate max-w-50">
                        {syllabus.syllabusName}
                      </h3>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-background text-primary border border-border rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> PENDING
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-background/30 rounded-2xl p-4 border border-border/50">
                    <div className="text-[11px] font-black uppercase text-muted mb-1 flex items-center gap-1.5 font-mono">
                      <Activity size={12} /> Min bloom
                    </div>
                    <div className="text-base font-black text-foreground">
                      Level {syllabus.minBloomLevel}
                    </div>
                  </div>
                  <div className="bg-background/30 rounded-2xl p-4 border border-border/50">
                    <div className="text-[11px] font-black uppercase text-muted mb-1 flex items-center gap-1.5 font-mono">
                      <Award size={12} /> Min grade
                    </div>
                    <div className="text-base font-black text-foreground">
                      {syllabus.minAvgGrade}/10
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted/50">
                    <Calendar size={14} />
                    <span className="text-base font-bold">
                      {new Date(syllabus.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/hopdc/reviews/${syllabus.syllabusId}/information`,
                      )
                    }
                    className="bg-primary text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20"
                  >
                    Process review <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
