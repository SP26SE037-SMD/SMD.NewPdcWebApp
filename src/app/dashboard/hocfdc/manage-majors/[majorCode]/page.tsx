import HocMajorDetailContent from "@/components/hocfdc/hoc-major-detail-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Major Management | HoCFDC Dashboard",
  description: "Detailed curriculum orchestration and PO mapping.",
};

export default function HocMajorDetailPage() {
  return <HocMajorDetailContent />;
}
