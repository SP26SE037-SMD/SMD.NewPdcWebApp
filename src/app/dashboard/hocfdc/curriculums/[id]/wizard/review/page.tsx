"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CurriculumService, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import CurriculumStudioLayout from "@/components/hocfdc/CurriculumStudioLayout";
import { 
  School, 
  Award, 
  Layers, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  Loader2,
  Calendar,
  Building2,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

export default function WizardReviewPage() {
  const { id: curriculumId } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Fetch Curriculum
  const { data: curriculumRes, isLoading: isLoadingCurriculum, isError: isErrorCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
    enabled: !!curriculumId,
  });
  const curriculum = curriculumRes?.data;

  // 2. Fetch PLOs - Unified with Detail Page logic
  const { data: plosRes, isLoading: isLoadingPLOs } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPLOsByCurriculumId(curriculumId),
    enabled: !!curriculumId,
  });
  const plos = (plosRes?.data?.content || plosRes?.data || []) as any[];

  // 3. Fetch Semester Mappings
  const { data: mappedData, isLoading: isLoadingMapped } = useQuery({
    queryKey: ["curriculum-mapped-subjects", curriculumId],
    queryFn: () => CurriculumGroupSubjectService.getSubjectsByCurriculum(curriculumId),
    enabled: !!curriculumId,
  });
  const mappedSubjects = mappedData?.data?.semesterMappings || [];

  // Unified Loading State
  const isGlobalLoading = isLoadingCurriculum || isLoadingPLOs || isLoadingMapped;

  // Calculate Total Credits safely
  const totalCredits = useMemo(() => {
    if (!mappedSubjects || !Array.isArray(mappedSubjects)) return 0;
    return mappedSubjects.reduce(
      (acc: number, sem: any) =>
        acc +
        (sem.subjects?.reduce(
          (sAcc: number, sub: any) => sAcc + (Number(sub.credit ?? sub.credits ?? 3)),
          0,
        ) || 0),
      0,
    );
  }, [mappedSubjects]);

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: () => CurriculumService.updateCurriculumStatus(curriculumId, CURRICULUM_STATUS.STRUCTURE_REVIEW),
    onSuccess: () => {
      showToast("Curriculum submitted for official review.", "success");
      // Invalidate both the list and the specific detail query
      queryClient.invalidateQueries({ queryKey: ["curriculums"] });
      queryClient.invalidateQueries({ queryKey: ["curriculum", curriculumId] });
      queryClient.invalidateQueries({ queryKey: ["curriculum-details", curriculumId] });
      
      // Force a hard redirect to ensure the detail page is fully "reloaded" as requested
      window.location.href = `/dashboard/hocfdc/curriculums/${curriculumId}`;
    },
    onError: () => {
      showToast("Submission failed. Please check validation rules.", "error");
    }
  });

  if (isErrorCurriculum) {
    return (
      <CurriculumStudioLayout activeStep={5} curriculumId={curriculumId}>
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <p className="font-bold">Failed to load curriculum framework for review.</p>
          <button onClick={() => router.back()} className="mt-4 text-xs underline uppercase tracking-widest">Return to Course Builder</button>
        </div>
      </CurriculumStudioLayout>
    );
  }

  return (
    <CurriculumStudioLayout
      activeStep={5}
      curriculumId={curriculumId}
      curriculumCode={curriculum?.curriculumCode}
      majorName={curriculum?.majorName}
      isLoading={isGlobalLoading}
    >
      {!isGlobalLoading && curriculum && (
        <div className="space-y-12 animate-in fade-in duration-700">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#2d3335] mb-4 uppercase">Final Curriculum Review</h2>
            <p className="text-[#5a6062] max-w-2xl text-lg leading-relaxed italic">
              Please verify the academic framework before submitting for final department approval. Once submitted, the curriculum will be locked for editing during the review cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {/* Section 1: Basic Information */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#ebeef0] ring-1 ring-black/5">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-2xl font-black text-[#2d3335] flex items-center gap-3 uppercase tracking-tight">
                  <School className="text-primary" size={28} />
                  Basic Identity
                </h3>
                <button 
                  onClick={() => router.push(`/dashboard/hocfdc/curriculums/new?id=${curriculumId}`)}
                  className="text-primary text-xs font-black uppercase tracking-widest hover:underline"
                >
                  Edit Parameters
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#adb3b5]">Framework Code</label>
                  <p className="text-xl font-bold text-[#2d3335]">{curriculum?.curriculumCode || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#adb3b5]">Target Major</label>
                  <p className="text-xl font-bold text-[#2d3335]">{curriculum?.majorName || "Standard Program"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#adb3b5]">Structural Load</label>
                  <p className="text-xl font-bold text-primary">{totalCredits} Total Credits</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#adb3b5]">Establishment</label>
                  <p className="text-xl font-bold text-[#2d3335]">{curriculum?.createdAt ? new Date(curriculum.createdAt).getFullYear() : "2024"}</p>
                </div>
              </div>
            </section>

            {/* Section 2: PLO Definitions */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#ebeef0] ring-1 ring-black/5">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-[#2d3335] flex items-center gap-3 uppercase tracking-tight">
                  <Award className="text-primary" size={28} />
                  Program Learning Outcomes
                </h3>
                <span className="px-4 py-1.5 bg-[#b1f0ce] text-[#1d5c42] text-[10px] font-black rounded-full uppercase tracking-widest">
                  {plos.length} Outcomes Defined
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plos.map((plo, idx) => (
                  <div key={plo.ploId || idx} className="flex gap-6 p-6 rounded-3xl bg-[#f1f4f5]/50 border border-[#ebeef0] hover:border-primary/20 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-[#2d3335] uppercase tracking-tighter">{plo.ploCode || plo.ploName}</h4>
                      <p className="text-sm text-[#5a6062] leading-relaxed line-clamp-3 italic">"{plo.description}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Semester Structure */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#ebeef0] ring-1 ring-black/5">
              <h3 className="text-2xl font-black text-[#2d3335] flex items-center gap-3 uppercase tracking-tight mb-10">
                <Layers className="text-primary" size={28} />
                Semester Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-10">
                {[...mappedSubjects]
                  .sort((a: any, b: any) => Number(a.semesterNo) - Number(b.semesterNo))
                  .map((semester: any) => (
                    <div key={semester.semesterNo} className="flex flex-col gap-4 p-6 rounded-[2rem] bg-[#f1f4f5]/30 border border-[#ebeef0] shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#2d3335] text-white flex items-center justify-center font-black text-sm uppercase">
                            S{semester.semesterNo}
                          </div>
                          <h4 className="text-xs font-black text-[#2d3335] uppercase tracking-widest">Semester {semester.semesterNo}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-primary uppercase">{semester.subjects?.length || 0} Modules</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {(semester.subjects || []).map((sub: any) => (
                          <div key={sub.subjectId} className="p-4 bg-white rounded-2xl border border-[#ebeef0] shadow-sm hover:border-primary/20 transition-all group">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#adb3b5] group-hover:text-primary transition-colors">
                                {sub.subjectCode}
                              </span>
                              <span className="text-[9px] font-black text-[#adb3b5]">{sub.credit ?? sub.credits ?? 3} CR</span>
                            </div>
                            <h5 className="text-[11px] font-black text-[#2d3335] leading-tight uppercase tracking-tighter">
                              {sub.subjectName}
                            </h5>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Final Submission Card */}
          <div className="p-10 rounded-[3rem] bg-[#2d3335] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl transition-all group-hover:scale-150 duration-1000" />
            <div className="relative z-10 max-w-xl">
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">Ready for Submission?</h3>
              <p className="text-[#adb3b5] leading-relaxed italic text-lg opacity-80">
                Ensure you have checked the mapping matrix and semester architecture for accuracy. Submitting will notify the Curriculum Committee and Dean for their review.
              </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto relative z-10">
              <button 
                onClick={() => router.back()}
                className="flex-1 md:flex-none px-8 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] border border-white/10"
              >
                Back to Courses
              </button>
              <button 
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                className="flex-1 md:flex-none px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </CurriculumStudioLayout>
  );
}
