import { Metadata } from "next";
import SprintManagementContent from "@/components/hopdc/SprintManagementContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tasks | HOPDC Dashboard | SMD",
  description: "Manage course tasks.",
};

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center bg-zinc-50 rounded-xl m-4">Loading tasks...</div>}>
      <SprintManagementContent />
    </Suspense>
  );
}
