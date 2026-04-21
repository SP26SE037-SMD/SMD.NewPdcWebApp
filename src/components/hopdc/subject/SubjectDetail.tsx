import { Building2, Calendar, FileText, Tag } from "lucide-react";
import type { SubjectDetail as SubjectDetailType } from "@/services/subject.service";

interface SubjectDetailProps {
  subject: SubjectDetailType;
}

export function SubjectDetail({ subject }: SubjectDetailProps) {
  const subjectAttributes = [
    { label: "Subject Name", value: subject.subjectName || "N/A" },

    { label: "Subject Code", value: subject.subjectCode || "N/A" },
    { label: "Credits", value: subject.credits ?? "N/A" },
    { label: "Degree Level", value: subject.degreeLevel || "N/A" },

    { label: "Time Allocation", value: subject.timeAllocation || "N/A" },
    {
      label: "Prerequisites",
      value: `${subject.preRequisite?.length ?? 0} subject(s)`,
    },
    {
      label: "Subject Description",
      value: subject.description || "N/A",
    },
    { label: "Student Tasks", value: subject.studentTasks || "N/A" },
    { label: "Scoring Scale", value: subject.scoringScale || "N/A" },
    { label: "Min Average to Pass", value: subject.minToPass ?? "N/A" },
  ];

  const approvedDateLabel = subject.approvedDate
    ? new Date(subject.approvedDate).toLocaleDateString()
    : "Not yet approved";

  const createdDateLabel = subject.createdAt
    ? new Date(subject.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-7 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-3">
          <div>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              {subject.subjectCode} - {subject.subjectName}
            </h1>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-base font-black uppercase tracking-[0.16em] text-zinc-500 mb-3">
          Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjectAttributes.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3"
            >
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-900 wrap-break-word">
                {String(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-base font-black uppercase tracking-[0.16em] text-zinc-500 mb-3">
          Governance
        </h3>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Decision No.
              </p>
              <p className="text-base font-bold text-zinc-900 mt-0.5">
                {subject.decisionNo || "Pending Approval"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              <Calendar size={14} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Approved Date
              </p>
              <p className="text-base font-bold text-zinc-900 mt-0.5">
                {approvedDateLabel}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Department
              </p>
              <p className="text-base font-bold text-zinc-900 mt-0.5">
                {subject.department?.departmentName || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              <Calendar size={14} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Created Date
              </p>
              <p className="text-base font-bold text-zinc-900 mt-0.5">
                {createdDateLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
