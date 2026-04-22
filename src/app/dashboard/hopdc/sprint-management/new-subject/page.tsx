import NewSubjectContent from "@/components/hopdc/SubjectIntakeNewContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Subject | HOPDC Dashboard | SMD",
  description: "Create a new subject for Curriculum.",
};

export default function NewSubjectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading subject formulation...</div>}>
      <NewSubjectContent />
    </Suspense>
  );
}
