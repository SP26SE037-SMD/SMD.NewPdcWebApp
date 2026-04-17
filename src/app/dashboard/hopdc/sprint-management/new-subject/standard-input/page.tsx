import { StandardInputContent } from "@/components/hopdc/standard-input-content";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Standard Input | HOPDC Dashboard | SMD",
  description: "Standard input for course materials.",
};

export default function StandardInputPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StandardInputContent />
    </Suspense>
  );
}
