import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  BarChart3,
  BookOpen,
  Target,
  Layout,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  CurriculumService,
  CURRICULUM_STATUS,
  PLO,
} from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { GroupService } from "@/services/group.service";
import { PoService, PO } from "@/services/po.service";
import { PoPloService } from "@/services/poplo.service";
import StepNavigation from "./StepNavigation";
import { SubjectService } from "@/services/subject.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { MajorService } from "@/services/major.service";
import { RequestService } from "@/services/request.service";

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
}

interface AuditResults {
  totalCredits: number;
  totalSubjects: number;
  totalSemesters: number;
  hasCycles: boolean;
  mappingPloCoverage: number;
  unmappedSubjects: string[];
  distribution: {
    department: number;
    combo: number;
    elective: number;
  };
}

export default function ReviewPublishStep({ onNext, onBack }: StepProps) {
  const searchParams = useSearchParams();
  const curriculumId = searchParams.get("id");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  // 1. Fetch Data
  const { data: curriculumRes, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId!),
    enabled: !!curriculumId,
  });

  const curriculum = curriculumRes?.data;
  const majorId = curriculum?.major?.majorId || curriculum?.majorId;

  const { data: majorRes } = useQuery({
    queryKey: ["major", majorId],
    queryFn: () => MajorService.getMajorById(majorId as string),
    enabled: !!majorId && !curriculum?.major?.majorName,
  });

  const major = majorRes?.data || curriculum?.major;

  const { data: mappedData, isLoading: isLoadingMapped } = useQuery({
    queryKey: ["curriculum-mapped-subjects", curriculumId],
    queryFn: () =>
      CurriculumGroupSubjectService.getSubjectsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const { data: departmentsRes, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["curriculum-departments", curriculumId],
    queryFn: () =>
      CurriculumGroupSubjectService.getDepartmentsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const { data: groupsRes } = useQuery({
    queryKey: ["all-groups"],
    queryFn: () => GroupService.getGroups(undefined, 0, 1000),
  });

  const { data: posRes, isLoading: isLoadingPos } = useQuery({
    queryKey: ["pos-major", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId as string, { size: 100 }),
    enabled: !!majorId,
  });

  const { data: plosRes, isLoading: isLoadingPlos } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId!, "ACTIVE", 100),
    enabled: !!curriculumId,
  });

  const { data: mappingsRes, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const groups = (groupsRes?.data as any)?.content || [];
  const semesterMappings = mappedData?.data?.semesterMappings || [];
  const distinctDepartments = (departmentsRes?.data as any) || [];
  const pos = ((posRes?.data as any)?.content as PO[]) || [];
  const plos = ((plosRes?.data as any)?.content as PLO[]) || [];
  const initialMappings = mappingsRes?.data || [];

  const mappingsSet = useMemo(() => {
    return new Set(initialMappings.map((m) => `${m.poId}||${m.ploId}`));
  }, [initialMappings]);

  const isMapped = (poId: string, ploId: string) =>
    mappingsSet.has(`${poId}||${ploId}`);
  const getPoStats = (poId: string) =>
    plos.filter((plo) => isMapped(poId, plo.ploId)).length;
  const getPloCoverage = (ploId: string) =>
    pos.filter((po) => isMapped(po.poId, ploId)).length;

  // 2. Audit Logic & Statistics Calculation
  const audit = useMemo((): AuditResults => {
    const results: AuditResults = {
      totalCredits: 0,
      totalSubjects: 0,
      totalSemesters: 0,
      hasCycles: false,
      mappingPloCoverage: 0,
      unmappedSubjects: [],
      distribution: {
        department: distinctDepartments.length,
        combo: 0,
        elective: 0,
      },
    };

    if (!semesterMappings.length) return results;

    const allSubjects: any[] = [];
    const semesters = new Set<number>();
    const comboGroupIds = new Set<string>();
    const electiveGroupIds = new Set<string>();

    semesterMappings.forEach((sem: any) => {
      semesters.add(sem.semesterNo);
      (sem.subjects || []).forEach((sub: any) => {
        results.totalCredits += sub.credit || 0;
        results.totalSubjects += 1;
        allSubjects.push(sub);

        if (sub.groupId) {
          const group = groups.find((g: any) => g.groupId === sub.groupId);
          if (group?.type === "ELECTIVE") {
            electiveGroupIds.add(sub.groupId);
          } else if (group?.type === "COMBO") {
            comboGroupIds.add(sub.groupId);
          }
        }
      });
    });

    results.distribution.combo = comboGroupIds.size;
    results.distribution.elective = electiveGroupIds.size;
    results.totalSemesters = semesters.size;

    const adj = new Map<string, string[]>();
    allSubjects.forEach((s) => {
      adj.set(s.subjectCode, s.prerequisiteSubjectCodes || []);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (u: string): boolean => {
      if (recStack.has(u)) return true;
      if (visited.has(u)) return false;
      visited.add(u);
      recStack.add(u);
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (hasCycle(v)) return true;
      }
      recStack.delete(u);
      return false;
    };

    for (const subCode of adj.keys()) {
      if (!visited.has(subCode)) {
        if (hasCycle(subCode)) {
          results.hasCycles = true;
          break;
        }
      }
    }

    return results;
  }, [semesterMappings, groups, distinctDepartments]);

  // 3. Finalize Mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const toastId = toast.loading("Submitting curriculum for review...");
      try {
        // 1. Update curriculum status
        await CurriculumService.updateCurriculumStatus(
          curriculumId!,
          CURRICULUM_STATUS.STRUCTURE_REVIEW,
        );

        // 2. Create review task (request)
        const curriculumName = curriculum?.curriculumNameEn || curriculum?.curriculumName || "Untitled Curriculum";
        const majorName = major?.majorName || "Unknown Major";
        
        await RequestService.createRequest({
          title: `Review: ${curriculum?.curriculumCode || curriculumName}`.substring(0, 50),
          content: `Review curriculum ${curriculumName} of major ${majorName}`,
          status: "PENDING",
          createdById: user?.accountId || "",
          curriculumId: curriculumId!,
          majorId: majorId as string,
        });
        
        toast.success("Curriculum submitted successfully!", { id: toastId });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Submission failed", { id: toastId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum", curriculumId] });
      router.push("/dashboard/hocfdc/curriculums?submitted=true&status=STRUCTURE_REVIEW");
    },
  });

  const isLoading =
    isLoadingCurriculum ||
    isLoadingMapped ||
    isLoadingPos ||
    isLoadingPlos ||
    isLoadingMappings ||
    isLoadingDepts;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Performing Pre-Flight Audit...
        </p>
      </div>
    );
  }

  const distTotal =
    audit.distribution.department +
      audit.distribution.combo +
      audit.distribution.elective || 1;
  const deptPct = Math.round((audit.distribution.department / distTotal) * 100);
  const comboPct = Math.round((audit.distribution.combo / distTotal) * 100);
  const electivePct = 100 - deptPct - comboPct;

  return (
    <div className="min-h-screen px-4 md:px-12 pb-20 pt-10 font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="mb-10 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">
            Pre-Flight Review
          </h1>
          <p className="text-zinc-500 max-w-xl leading-relaxed font-medium">
            Verify structural integrity and mapping coverage before final
            submission.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <ShieldCheck size={14} /> Structure Validated
            </span>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 max-w-5xl mx-auto">
        {/* Audit Status Card */}
        <div className="col-span-12 md:col-span-8 bg-zinc-900 overflow-hidden rounded-2xl p-8 relative flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
              <span className="px-3 py-1 bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/10 italic">
                Internal Audit Engine
              </span>
              <h2 className="text-white text-3xl font-extrabold mt-4 tracking-tight">
                {audit.hasCycles ? "Action Required" : "Ready for Review"}
              </h2>
              <p className="text-white/50 text-xs font-medium mt-2 max-w-sm">
                {audit.hasCycles
                  ? "Circular dependencies detected in prerequisites. Please resolve before publishing."
                  : "Curriculum structure satisfies all institutional prerequisite and credit constraints."}
              </p>
            </div>
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border-2 ${audit.hasCycles ? "bg-red-500/10 border-red-500 text-red-500" : "bg-emerald-500/10 border-emerald-500 text-emerald-500"}`}
            >
              {audit.hasCycles ? (
                <AlertTriangle size={32} />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-white/10 text-white/90">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${audit.hasCycles ? "bg-red-500" : "bg-emerald-500"}`}
              />
              <span className="text-xs font-bold">
                {audit.hasCycles ? "Prereq Cycles Found" : "No Prereq Cycles"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold">Credits Validated</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold">Groups Aligned</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-8 shadow-sm border border-zinc-200 flex flex-col justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
            <BarChart3 size={14} /> Architecture Stats
          </h3>
          <div className="space-y-8 flex-grow">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-black text-zinc-900 leading-none">
                  {audit.totalCredits}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  Total Credits
                </span>
              </div>
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-primary h-full rounded-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 group hover:border-primary transition-colors">
                <span className="block text-3xl font-black text-zinc-900 group-hover:text-primary transition-colors">
                  {audit.totalSubjects}
                </span>
                <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mt-1">
                  Subjects
                </span>
              </div>
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 group hover:border-emerald-500 transition-colors">
                <span className="block text-3xl font-black text-zinc-900 group-hover:text-emerald-500 transition-colors">
                  {audit.totalSemesters}
                </span>
                <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mt-1">
                  Semesters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Review */}
        <div className="col-span-12 md:col-span-5 bg-white rounded-2xl p-8 shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Layout size={18} className="text-primary" /> Basic Setup
            </h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Curriculum Identity
              </label>
              <p className="text-sm font-bold text-zinc-900 mt-1">
                {curriculum?.curriculumNameEn || curriculum?.curriculumName}
              </p>
              <p className="text-xs font-medium text-zinc-500 mt-0.5 italic">
                {curriculum?.curriculumNameVi || curriculum?.curriculumName}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-inner">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Major Framework
                </label>
                <div className="text-sm font-bold text-zinc-900 mt-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {major?.majorName ||
                    curriculum?.majorCode ||
                    "Standard Major"}
                </div>
              </div>
              {curriculum?.specialization && (
                <div className="mt-4 pt-4 border-t border-zinc-200/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Specialization
                  </label>
                  <p className="text-sm font-bold text-zinc-900 mt-1">
                    {curriculum.specialization.specializationName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distribution Breakdown */}
        <div className="col-span-12 md:col-span-7 bg-white rounded-2xl p-8 shadow-sm border border-zinc-200">
          <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" /> Subject Distribution
          </h3>

          <div className="flex h-8 rounded-xl overflow-hidden mb-8 shadow-inner bg-zinc-50 p-1">
            <div
              style={{ width: deptPct === 0 ? "0%" : `${deptPct}%` }}
              className="bg-zinc-900 flex items-center justify-center text-[8px] text-white font-black uppercase tracking-widest rounded-l-lg border-r border-white/10"
            >
              Department
            </div>
            <div
              style={{ width: comboPct === 0 ? "0%" : `${comboPct}%` }}
              className="bg-primary flex items-center justify-center text-[8px] text-white font-black uppercase tracking-widest border-r border-white/10"
            >
              Combo
            </div>
            <div
              style={{ width: electivePct === 0 ? "0%" : `${electivePct}%` }}
              className="bg-zinc-200 flex items-center justify-center text-[8px] text-zinc-500 font-black uppercase tracking-widest rounded-r-lg"
            >
              Elective
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-center group hover:bg-zinc-900 transition-all">
              <span className="block text-2xl font-black text-zinc-900 group-hover:text-white transition-colors">
                {audit.distribution.department}
              </span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                Department Found.
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-center group hover:bg-primary transition-all">
              <span className="block text-2xl font-black text-primary group-hover:text-white transition-colors">
                {audit.distribution.combo}
              </span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                Combo Groups
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-center group hover:bg-zinc-200 transition-all">
              <span className="block text-2xl font-black text-zinc-400 group-hover:text-zinc-600 transition-colors">
                {audit.distribution.elective}
              </span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                Elective Groups
              </span>
            </div>
          </div>
        </div>

        {/* Mapping Matrix Layout from MappingStep.tsx */}
        <section className="col-span-12">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] overflow-hidden flex flex-col gap-6 border border-zinc-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary">
                    grid_on
                  </span>
                  Matrix Alignment
                </h3>
                <p className="text-xs text-zinc-500 font-medium italic">
                  Consolidated PO-PLO mapping interactives (Read-Only).
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    circle
                  </span>
                  <span className="text-xs font-bold text-zinc-600">
                    Mapped
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-200 text-sm">
                    circle
                  </span>
                  <span className="text-xs font-bold text-zinc-600">
                    Unmapped
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-600 rounded-tl-xl w-[280px] sticky left-0 z-20">
                      Program Learning Outcomes
                    </th>
                    {pos.map((po, idx) => (
                      <th
                        key={po.poId}
                        className="p-4 bg-zinc-50 border-b border-zinc-200 text-center min-w-[120px] group/header relative"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {po.poCode || `PO-${idx + 1}`}
                        </span>
                        <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-zinc-900 text-white text-[10px] rounded-xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800">
                          <p className="font-black text-indigo-400 mb-1 tracking-widest uppercase border-b border-zinc-800 pb-2">
                            {po.poCode}
                          </p>
                          <p className="font-medium leading-relaxed mt-2 text-zinc-300 line-clamp-4">
                            {po.description}
                          </p>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 bg-[#f8faf8] border-b border-[#e1ede3] text-center rounded-tr-xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                        Coverage
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plos.map((plo) => {
                    const coverage = getPloCoverage(plo.ploId);
                    const isUnmapped = coverage === 0;
                    return (
                      <tr
                        key={plo.ploId}
                        className={`group hover:bg-zinc-50 transition-colors font-medium ${isUnmapped ? "bg-red-50/10" : ""}`}
                      >
                        <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50 transition-colors z-10 w-[280px]">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`font-bold text-sm ${isUnmapped ? "text-red-600" : "text-zinc-900"}`}
                            >
                              {plo.ploCode || "PLO-XX"}
                            </span>
                            <span
                              className={`text-xs line-clamp-2 leading-relaxed ${isUnmapped ? "text-red-400 font-bold" : "text-zinc-500"}`}
                            >
                              {plo.description}
                            </span>
                          </div>
                        </td>
                        {pos.map((po) => {
                          const mapped = isMapped(po.poId, plo.ploId);
                          return (
                            <td
                              key={po.poId}
                              className={`p-4 border-b border-zinc-100 text-center transition-all ${mapped ? "bg-indigo-50/30" : ""}`}
                            >
                              <span
                                className={`material-symbols-outlined transition-all ${mapped ? "text-primary scale-125" : "text-zinc-200"}`}
                                style={{
                                  fontVariationSettings: mapped
                                    ? "'FILL' 1"
                                    : "'FILL' 0",
                                }}
                              >
                                circle
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-4 border-b border-[#e1ede3] bg-[#f8faf8] text-center group-hover:bg-[#f0f5f1] transition-colors">
                          <span
                            className={`text-xs font-black ${isUnmapped ? "text-red-500" : "text-primary"}`}
                          >
                            {coverage}/{pos.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10">
                      PO Support Count
                    </td>
                    {pos.map((po) => (
                      <td
                        key={po.poId}
                        className="p-4 bg-zinc-50 border-t border-zinc-200 text-center"
                      >
                        <span
                          className={`text-[10px] font-black ${getPoStats(po.poId) === 0 ? "text-red-400" : "text-primary"}`}
                        >
                          {getPoStats(po.poId)}
                        </span>
                      </td>
                    ))}
                    <td className="p-4 bg-[#f8faf8] border-t border-[#e1ede3] text-center rounded-br-xl">
                      <span className="text-[10px] font-bold text-zinc-500">
                        Total
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation */}
      <div className="max-w-5xl mx-auto mt-12">
        <StepNavigation
          onNext={() => finalizeMutation.mutate()}
          onBack={onBack}
          nextLabel={
            finalizeMutation.isPending ? "Submitting..." : "Finalize & Submit"
          }
          nextIcon={finalizeMutation.isPending ? "sync" : "send"}
        />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
