import { Metadata } from "next";
import { Suspense } from "react";
import SprintManagementContent from "@/components/hopdc/SprintManagementContent";

export const metadata: Metadata = {
  title: "Sprint Management | HOPDC Dashboard | SMD",
  description: "Manage course sprints.",
};

export default function SprintManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SprintManagementContent />
    </Suspense>
  );
}
