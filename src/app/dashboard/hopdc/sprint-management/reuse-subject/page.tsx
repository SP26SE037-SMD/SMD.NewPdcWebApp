import ReuseSubjectContent from "@/components/hopdc/SubjectIntakeReuseContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reuse Subject | HOPDC Dashboard | SMD",
  description: "Reuse and pre-process course materials.",
};

export default function ReuseSubjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReuseSubjectContent />
    </Suspense>
  );
}
