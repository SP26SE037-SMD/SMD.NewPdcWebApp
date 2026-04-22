"use client";

import { use } from "react";
import { SprintDetailView } from "@/components/hocfdc/SprintDetailView";

export default function SprintBoardPage({ 
    params 
}: { 
    params: Promise<{ curriculumId: string, sprintId: string }> 
}) {
    const { sprintId, curriculumId } = use(params);
    return <SprintDetailView sprintId={sprintId} curriculumId={curriculumId} />;
}
