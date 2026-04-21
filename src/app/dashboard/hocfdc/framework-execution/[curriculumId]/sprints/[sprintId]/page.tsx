"use client";

import { use } from "react";
import { SprintDetailView } from "@/components/hocfdc/SprintDetailView";

export default function SprintBoardPage({ 
    params 
}: { 
    params: Promise<{ curriculumId: string, sprintId: string }> 
}) {
    const { sprintId } = use(params);
    return <SprintDetailView sprintId={sprintId} />;
}
