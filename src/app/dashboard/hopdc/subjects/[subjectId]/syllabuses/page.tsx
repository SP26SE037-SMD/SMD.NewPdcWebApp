"use client";

import SubjectDetail from "@/components/hopdc/subject/SubjectDetail";
import { useParams } from "next/navigation";

export default function SubjectSyllabusesPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;

  return (
    <div className="min-h-screen bg-background">
      <SubjectDetail id={subjectId} initialViewMode="SYLLABUS" />
    </div>
  );
}
