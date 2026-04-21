import { use } from "react";
import { SprintsManagement } from "@/components/hocfdc/SprintsManagement";

export default function DepartmentSprintsPage({
  params,
}: {
  params: Promise<{ curriculumId: string }>;
}) {
  const { curriculumId } = use(params);
  return <SprintsManagement curriculumId={curriculumId} />;
}
