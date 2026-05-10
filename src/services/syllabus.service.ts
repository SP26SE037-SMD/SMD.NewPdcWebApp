import { ApiResponse } from "@/types/api";

export const SYLLABUS_STATUS = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_REVIEW: "PENDING_REVIEW",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type SyllabusStatus =
  (typeof SYLLABUS_STATUS)[keyof typeof SYLLABUS_STATUS];

export interface CreateSyllabusPayload {
  subjectId: string;
  syllabusName: string;
  minBloomLevel: number;
}

export interface SubjectSyllabus {
  syllabusId: string;
  syllabusName: string;
  status?: SyllabusStatus;
  minBloomLevel?: number;
  minAvgMarkToPass?: number;
  createdAt?: string;
}

export interface DepartmentSyllabusOption {
  syllabusId: string;
  syllabusName: string;
  subjectCode?: string;
  subjectName?: string;
}

export interface SubjectSyllabusOption {
  syllabusId: string;
  syllabusName: string;
  status?: SyllabusStatus;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
}

export interface PendingReviewSyllabus extends SubjectSyllabusOption {
  minBloomLevel: number;
  minAvgMarkToPass: number;
  createdAt: string;
}

export interface SyllabusActionLog {
  logId: string;
  syllabusId: string;
  actionByFullName?: string;
  actionType?: string;
  createdAt?: string;
  note?: string;
}
export const SyllabusService = {
  async createSyllabusByAccount(
    email: string,
    payload: CreateSyllabusPayload,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus/account/${encodeURIComponent(email)}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to create syllabus");
    }
    return response.json();
  },

  async getSyllabiBySubject(
    subjectId: string,
    status?: string,
  ): Promise<ApiResponse<SubjectSyllabusOption[]>> {
    const searchParams = new URLSearchParams();
    if (status) {
      searchParams.set("status", status);
    }

    const response = await fetch(
      `/api/syllabus/subject/${subjectId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
      {
        method: "GET",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch subject syllabi");
    }

    return response.json();
  },

  async getSyllabusLogsBySyllabusId(
    syllabusId: string,
  ): Promise<ApiResponse<SyllabusActionLog[]>> {
    const response = await fetch(`/api/syllabus-logs/syllabus/${syllabusId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || "Failed to fetch syllabus action logs",
      );
    }

    return response.json();
  },

  async archiveSyllabusByAccount(
    syllabusId: string,
    accountId: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus/${syllabusId}/account/${accountId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to archive syllabus");
    }

    return response.json().catch(() => ({
      status: 1000,
      message: "Syllabus archived successfully",
    }));
  },

  async getSyllabusById(syllabusId: string): Promise<
    ApiResponse<{
      syllabusId: string;
      syllabusName: string;
      minBloomLevel: number;
      status: string;
      createdAt: string;
      approvedDate: string;
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      version?: string | number;
      courseName?: string;
      courseCode?: string;
      description?: string;
      noCredit?: number;
      scoringScale?: number;
      minAvgMarkToPass?: number;
      decisionLevel?: number;
      credit?: number;
    }>
  > {
    const response = await fetch(`/api/syllabus/${syllabusId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });
 
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch syllabus details");
    }

    return response.json();
  },

  async getPendingReviewSyllabiByDepartment(): Promise<ApiResponse<PendingReviewSyllabus[]>> {
    const response = await fetch(`/api/syllabus/pending-review/department`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || "Failed to fetch pending review syllabi",
      );
    }

    return response.json();
  },

  async getInProgressSyllabiByDepartment(): Promise<
    ApiResponse<DepartmentSyllabusOption[]>
  > {
    const response = await fetch(`/api/syllabus/in-progress/department`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || "Failed to fetch in-progress syllabi",
      );
    }

    return response.json();
  },

  async updateSyllabusStatus(
    syllabusId: string,
    accountId: string,
    status: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus/${syllabusId}/account/${accountId}/status?status=${status}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to update syllabus status");
    }

    return response.json();
  },
};
