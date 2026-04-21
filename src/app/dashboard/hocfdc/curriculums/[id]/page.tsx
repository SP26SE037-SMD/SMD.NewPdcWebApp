"use client";

import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import CurriculumBuilder from "@/components/hocfdc/CurriculumBuilder";
import CurriculumDetail from "@/components/hocfdc/CurriculumDetail";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import {
  ChevronLeft,
  Layers,
  Share2,
  MoreHorizontal,
  Loader2,
  Calendar,
  Target,
  Rocket,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

export default function BuilderPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const curriculum = data?.data;
  const isDraft = curriculum?.status === "DRAFT";

  // Fetch Existing Subjects for Drafts
  const { data: mappedSubjectsData, isLoading: isLoadingMapped } = useQuery({
    queryKey: ["curriculum-mapped-subjects", id],
    queryFn: () => CurriculumGroupSubjectService.getSubjectsByCurriculum(id),
    enabled: !!isDraft && !!id,
    refetchOnWindowFocus: false,
  });

  const initialSubjects = (
    mappedSubjectsData?.data?.semesterMappings || []
  ).flatMap((sem: any) =>
    (sem.subjects || []).map((sub: any) => ({
      subjectId: sub.subjectId,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      credits: sub.credit ?? sub.credits ?? 3,
      semester: Number(sem.semesterNo),
      groupId: sub.groupId,
    })),
  );

  if (isLoading || (isDraft && isLoadingMapped)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-zinc-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-semibold text-sm">
          Decoding Framework Architecture...
        </p>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-zinc-400">
        <p className="font-semibold text-sm text-red-400">
          Framework not found in established repository.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs font-black uppercase tracking-widest text-primary underline"
        >
          Backward to Repository
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDraft ? "p-8" : ""}`}>
      {/* Header only for Builder Mode. Detail Mode has its own sticky header */}
      {isDraft && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 overflow-hidden mb-6">
          <div className="space-y-4 max-w-2xl">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Repository
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">
                  {curriculum.status}
                </div>
                <span className="text-zinc-300">/</span>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={12} /> Established{" "}
                  {new Date(curriculum.createdAt).toLocaleDateString()}
                </div>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-baseline gap-3">
                {curriculum.curriculumCode}
                <span className="text-sm font-medium text-zinc-400 tracking-normal">
                  — {curriculum.majorName}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-3">
              <button className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all shadow-sm">
                <Share2 size={18} />
              </button>
              <button className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all shadow-sm">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit items-center gap-1">
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/hocfdc/curriculums/${id}/mapping/po-plo`,
                  )
                }
                className="px-6 py-3 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2.5"
              >
                <Target size={16} /> Matrix
              </button>
              <button
                onClick={() => {
                  const hasPLOs = (curriculum?.plos?.length || 0) > 0;
                  const hasSubjects = initialSubjects.length > 0;

                  if (!hasPLOs || !hasSubjects) {
                    let errorMsg;
                    if (!hasPLOs && !hasSubjects)
                      errorMsg =
                        "Curriculum must have PLOs and at least one mapped subject.";
                    else if (!hasPLOs)
                      errorMsg =
                        "Curriculum framework must have Program Learning Outcomes (PLOs) defined.";
                    else
                      errorMsg =
                        "Curriculum must have at least one subject mapped to the framework.";

                    showToast(errorMsg, "error");
                    return;
                  }
                  router.push(`/dashboard/hocfdc/curriculums/${id}/review`);
                }}
                className="px-6 py-3 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2.5"
              >
                Submit for Review <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Branching based on Status */}
      {isDraft ? (
        <CurriculumBuilder
          curriculumId={id}
          initialSubjects={initialSubjects}
        />
      ) : (
        <div className="min-h-screen">
          {/* CurriculumDetail passes full mock visualization for Read-Only modes */}
          <CurriculumDetail id={id} />
        </div>
      )}
    </div>
  );
}
