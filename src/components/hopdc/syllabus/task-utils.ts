import { DepartmentAccount } from "@/services/account.service";
import { SubjectSyllabusOption } from "@/services/syllabus.service";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
  Flag,
} from "lucide-react";

export const toInputDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const getAccountLabel = (account: DepartmentAccount): string => {
  if (account.fullName && account.email) {
    return `${account.fullName} (${account.email})`;
  }
  return account.fullName || account.email || account.accountId;
};

export const getSyllabusLabel = (syllabus: SubjectSyllabusOption): string => {
  const subject = [syllabus.subjectCode, syllabus.subjectName]
    .filter(Boolean)
    .join(" - ");

  let label = syllabus.syllabusName;
  if (subject) {
    label = `${label} (${subject})`;
  }

  if (syllabus.status) {
    label = `${label} [${syllabus.status}]`;
  }

  return label;
};

export interface TaskStatusConfig {
  color: string;
  text: string;
  bg: string;
  icon: LucideIcon;
}

export const getTaskStatusConfig = (status?: string): TaskStatusConfig => {
  const normalized = status?.toUpperCase() || "UNKNOWN";

  switch (normalized) {
    case "DONE":
      return {
        color: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: CheckCircle2,
      };
    case "IN_PROGRESS":
      return {
        color: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50",
        icon: Clock,
      };
    case "TO_DO":
      return {
        color: "bg-zinc-500",
        text: "text-zinc-600",
        bg: "bg-zinc-100",
        icon: Calendar,
      };
    case "OVERDUE":
      return {
        color: "bg-rose-500",
        text: "text-rose-600",
        bg: "bg-rose-50",
        icon: AlertCircle,
      };
    default:
      return {
        color: "bg-zinc-400",
        text: "text-zinc-600",
        bg: "bg-zinc-50",
        icon: AlertCircle,
      };
  }
};

export const getSubjectStatusConfig = (status?: string) => {
  const normalized = status?.toUpperCase() || "DRAFT";

  switch (normalized) {
    case "COMPLETED":
      return {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    case "PENDING_REVIEW":
      return {
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
    case "IN_PROGRESS":
    case "WAITING_SYLLABUS":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "ARCHIVED":
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
    default:
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
  }
};

export const getSyllabusStatusConfig = (status?: string) => {
  const normalized = status?.toUpperCase() || "DRAFT";

  switch (normalized) {
    case "PUBLISHED":
    case "APPROVED":
      return {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    case "PENDING_REVIEW":
    case "REVIEWING":
      return {
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
    case "IN_PROGRESS":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "REVISION_REQUESTED":
      return {
        text: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    default:
      return {
        text: "text-zinc-500",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
  }
};

export interface PriorityConfig {
  color: string;
  fill: string;
  label: string;
}

export const getPriorityConfig = (priority?: string): PriorityConfig => {
  const normalized = priority?.toUpperCase() || "NORMAL";

  switch (normalized) {
    case "URGENT":
      return {
        color: "text-rose-500",
        fill: "currentColor",
        label: "Urgent",
      };
    case "HIGH":
      return {
        color: "text-amber-500",
        fill: "currentColor",
        label: "High",
      };
    case "NORMAL":
    case "MEDIUM":
      return {
        color: "text-blue-500",
        fill: "currentColor",
        label: "Normal",
      };
    case "LOW":
      return {
        color: "text-zinc-400",
        fill: "currentColor",
        label: "Low",
      };
    default:
      return {
        color: "text-zinc-300",
        fill: "none",
        label: "No Priority",
      };
  }
};
