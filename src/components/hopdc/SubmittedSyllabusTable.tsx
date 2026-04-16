"use client";

import React from "react";
import {
  Search,
  Clock,
  CheckCircle2,
  ArrowRight,
  User,
  BookOpen,
  FileText,
} from "lucide-react";
import { TaskItem } from "@/services/task.service";
import { useRouter } from "next/navigation";

interface SubmittedSyllabusTableProps {
  tasks: TaskItem[];
  isLoading: boolean;
}

export function SubmittedSyllabusTable({
  tasks,
  isLoading,
}: SubmittedSyllabusTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2.5rem]">
        <BookOpen size={48} className="mx-auto text-zinc-300 mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">
          No submitted syllabi found
        </h3>
        <p className="text-base text-zinc-500">
          Syllabi submitted by PDCM will appear here for review assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-50/50">
            <th className="p-6 text-[11px] font-black uppercase text-zinc-500 tracking-widest">
              Syllabus / Task
            </th>
            <th className="p-6 text-[11px] font-black uppercase text-zinc-500 tracking-widest">
              Status
            </th>
            <th className="p-6 text-[11px] font-black uppercase text-zinc-500 tracking-widest">
              Submitted At
            </th>
            <th className="p-6 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <tr
              key={task.taskId}
              className="hover:bg-zinc-50/50 transition-colors group"
            >
              <td className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-base font-black text-zinc-900">
                      {task.taskName}
                    </p>
                    <p className="text-base text-zinc-500 font-medium">
                      {task.description || "No description provided"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="p-6">
                <div className="px-3 py-1 rounded-lg text-[11px] font-black border flex items-center gap-1.5 w-fit bg-emerald-50 text-emerald-600 border-emerald-100">
                  <CheckCircle2 size={12} />
                  SUBMITTED
                </div>
              </td>
              <td className="p-6">
                <span className="text-base text-zinc-500 font-medium">
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleDateString()
                    : "Pending"}
                </span>
              </td>
              <td className="p-6 text-right">
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/hopdc/reviews/${task.taskId}/information`,
                    )
                  }
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all active:scale-95 flex items-center gap-2 ml-auto shadow-lg shadow-zinc-900/10"
                >
                  Review & Assign
                  <ArrowRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
