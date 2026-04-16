import { Metadata } from "next";
import SprintManagementContent from "@/components/hopdc/SprintManagementContent";

export const metadata: Metadata = {
  title: "Sprint Management | HOPDC Dashboard | SMD",
  description: "Manage course sprints.",
};

export default function SprintManagementPage() {
  return <SprintManagementContent />;
}
