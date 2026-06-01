"use client";

import SubjectDetail from "@/components/hocfdc/SubjectDetail";
import { useParams } from "next/navigation";

export default function SubjectSyllabusesPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="min-h-screen bg-background">
      <SubjectDetail id={id} initialViewMode="SYLLABUS" />
    </div>
  );
}
