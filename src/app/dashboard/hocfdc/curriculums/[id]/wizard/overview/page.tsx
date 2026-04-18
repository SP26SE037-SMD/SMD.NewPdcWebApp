"use client";

import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import CurriculumBuilder from "@/components/hocfdc/CurriculumBuilder";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ArrowRight } from "lucide-react";
import CurriculumStudioLayout from "@/components/hocfdc/CurriculumStudioLayout";

export default function WizardOverviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

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
    enabled: !!id,
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

  return (
    <CurriculumStudioLayout
      activeStep={4}
      curriculumId={id}
      curriculumCode={curriculum?.curriculumCode}
      majorName={curriculum?.majorName}
      isLoading={isLoading || isLoadingMapped}
    >
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#ebeef0] shadow-sm ring-1 ring-black/5">
           <CurriculumBuilder
              curriculumId={id}
              initialSubjects={initialSubjects}
            />
        </div>

        {/* Wizard Navigation */}
        <div className="flex justify-between items-center pt-8">
           <button 
             onClick={() => router.back()}
             className="flex items-center gap-3 px-8 py-4 border border-[#dee3e6] text-[#5a6062] font-black rounded-2xl hover:bg-[#f1f4f5] transition-all uppercase tracking-widest text-[10px]"
           >
              <ChevronLeft size={16} /> Previous Step
           </button>
           <button 
             onClick={() => router.push(`/dashboard/hocfdc/curriculums/${id}/wizard/review`)}
             className="flex items-center gap-3 px-12 py-4 bg-[#2d3335] text-white font-black rounded-2xl shadow-xl shadow-black/10 hover:bg-black hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-widest text-[10px]"
           >
              Review & Publish <ArrowRight size={16} />
           </button>
        </div>
      </div>
    </CurriculumStudioLayout>
  );
}
