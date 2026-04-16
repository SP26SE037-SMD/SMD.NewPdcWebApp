import dynamic from "next/dynamic";
import { Metadata } from "next";
import VPSkeleton from "@/components/skeletons/vp-skeleton";
import ManageMajorsContent from "@/components/vp/manage-majors-content";

// Using next/dynamic ensures this Client Component is split into a separate JS chunk.
// It will be streamed to the client only when needed, and while loading,
// the server streams the VPSkeleton instantly as the placeholder (Streaming + Suspense).
const VPDashboardContent = dynamic(
  () => import("@/components/dashboard/vp-content"),
  {
    loading: () => <VPSkeleton />,
  },
);

export const metadata: Metadata = {
  title: "Manage Majors | VP Dashboard | SMD",
  description: "Add new academic majors or suspend existing program standards.",
};

export default function VPDashboard() {
  return <ManageMajorsContent />;
}
