import { Metadata } from "next";
import SprintManagementContent from "@/components/hopdc/SprintManagementContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sprint Management | HOPDC Dashboard | SMD",
  description: "Manage course sprints.",
};

export default function SprintManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center bg-zinc-50 rounded-xl m-4">Loading sprints...</div>}>
      <SprintManagementContent />
    </Suspense>
  );
}
