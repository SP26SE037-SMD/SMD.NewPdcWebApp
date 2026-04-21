import HocMajorDetailContent from "@/components/hocfdc/hoc-major-detail-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Major Management | HoCFDC Dashboard",
  description: "Detailed curriculum orchestration and PO mapping.",
};

import { Suspense } from "react";

export default function HocMajorDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    }>
      <HocMajorDetailContent />
    </Suspense>
  );
}
