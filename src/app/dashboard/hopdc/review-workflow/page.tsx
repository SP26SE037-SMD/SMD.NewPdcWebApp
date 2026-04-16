import ReviewWorkflowContent from "@/components/hopdc/ReviewWorkflowContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Workflow | HOPDC Dashboard | SMD",
  description: "Review and assign reviewers for pending syllabi.",
};

export default function ReviewWorkflowPage() {
  return <ReviewWorkflowContent />;
}
