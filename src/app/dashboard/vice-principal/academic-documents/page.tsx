import AcademicDocumentsContent from "@/components/vp/academic-documents-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Documents | Office of the VP",
  description: "Secure archival of institutional academic documents and regulations.",
};

export default function AcademicDocumentsPage() {
  return <AcademicDocumentsContent />;
}
