"use client";

import SyllabusListBySubject from "@/components/hopdc/subjects/SyllabusListBySubject";
import { useParams } from "next/navigation";

export default function SubjectSyllabusPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;

  return (
    <div className="min-h-screen bg-background">
      <SyllabusListBySubject subjectId={subjectId} />
    </div>
  );
}
