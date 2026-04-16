"use client";

import { useSearchParams } from "next/navigation";
import { TaskList } from "./syllabus/TaskList";

export default function AssignTaskContent() {
  const searchParams = useSearchParams();
  const sprintId = searchParams.get("sprintId") || "";

  if (!sprintId) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900">Missing sprintId</h2>
          <p className="mt-2 text-base text-zinc-500">
            Open this page with sprintId in query params to load tasks.
          </p>
        </div>
      </div>
    );
  }

  return <TaskList sprintId={sprintId} />;
}
