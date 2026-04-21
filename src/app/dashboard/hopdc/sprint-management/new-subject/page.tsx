import NewSubjectContent from "@/components/hopdc/SubjectIntakeNewContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Subject | HOPDC Dashboard | SMD",
  description: "Create a new subject for Curriculum.",
};

export default function NewSubjectPage() {
  return <NewSubjectContent />;
}
