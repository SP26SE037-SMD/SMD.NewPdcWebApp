import ReuseSubjectContent from "@/components/hopdc/SubjectIntakeReuseContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reuse Subject | HOPDC Dashboard | SMD",
  description: "Reuse and pre-process course materials.",
};

export default function ReuseSubjectPage() {
  return <ReuseSubjectContent />;
}
