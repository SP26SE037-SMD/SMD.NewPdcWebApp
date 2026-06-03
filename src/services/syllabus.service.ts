import { ApiResponse } from "@/types/api";

export const SYLLABUS_STATUS = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_REVIEW: "PENDING_REVIEW",
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

export interface ChangedAssessment {
  assessmentIdentifier: string;
  detailChanges: string[];
}

export interface AssessmentDiffResponse {
  addedAssessments: string[];
  removedAssessments: string[];
  changedAssessments: ChangedAssessment[];
}

export interface ChangedSession {
  sessionName: string;
  detailChanges: string[];
}

export interface SessionDiffResponse {
  addedSessions: string[];
  removedSessions: string[];
  changedSessions: ChangedSession[];
}

export interface ComparisonResultContent {
  removed_concepts: string[];
  added_concepts: string[];
  modified_concepts: string[];
  risk_assessment: string;
  risk_reason: string;
}

export interface CompareResult {
  oldSyllabusId: string;
  newSyllabusId: string;
  assessmentDiffResponse?: AssessmentDiffResponse;
  comparisonResult?: ComparisonResultContent;
  sessionDiffResponse?: SessionDiffResponse;
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
  minAvgGrade?: number;
  minAvgMarkToPass?: number;
  credit?: number;
  createdAt?: string;
  approvedDate?: string;
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
      if (response.status === 403) {
        console.warn(`Permission denied for syllabus ${syllabusId}. Using safe fallback.`);
        return {
          status: 403,
          message: "Limited access - Role permissions restricted",
          data: {
            syllabusId: syllabusId,
            syllabusName: "Syllabus Context (Protected)",
            minBloomLevel: 4,
            status: "PROTECTED",
            createdAt: new Date().toISOString(),
            approvedDate: new Date().toISOString(),
            subjectId: "restricted-subject",
            subjectCode: "N/A",
            subjectName: "Subject Details Restricted",
            version: "N/A",
            noCredit: 3,
            scoringScale: 10,
            minAvgMarkToPass: 5,
            decisionLevel: 1,
            credit: 3
          } as any
        };
      }
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

  async compareSyllabus(
    oldSyllabusId: string,
    newSyllabusId: string,
  ): Promise<ApiResponse<CompareResult>> {
    const response = await fetch(
      `/api/syllabus/compare?oldSyllabusId=${oldSyllabusId}&newSyllabusId=${newSyllabusId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to compare syllabuses");
    }

    return response.json();
  },

  async copySyllabus(
    oldSyllabusId: string,
    newSyllabusId: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus/copy?oldSyllabusId=${oldSyllabusId}&newSyllabusId=${newSyllabusId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to copy syllabus");
    }

    return response.json();
  },

  async saveCompareVersion(
    oldId: string,
    newId: string,
    assessmentResult: any,
    analysis: any,
    sessionDiffResponse: any
  ): Promise<ApiResponse<unknown>> {
    const searchParams = new URLSearchParams();
    searchParams.append("oldId", oldId);
    searchParams.append("newId", newId);
    searchParams.append("assessmentResult", JSON.stringify(assessmentResult));
    searchParams.append("analysis", JSON.stringify(analysis));
    searchParams.append("sessionDiffResponse", JSON.stringify(sessionDiffResponse));

    const response = await fetch(
      `/api/syllabus/save-compare-version?${searchParams.toString()}`,
      {
        method: "POST",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to save compare version");
    }

    return response.json();
  },
  async getSyllabusCompareHistory(newSyllabusId: string): Promise<ApiResponse<SyllabusCompareHistory[]>> {
    const response = await fetch(`/api/syllabus/${newSyllabusId}/get-syllabus-compare/HoPDC`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to get compare history");
    }
    return response.json();
  },

  async selectCompareSyllabus(historyId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`/api/syllabus/selected-compare-syllabus?historyId=${historyId}`, {
      method: "PUT",
      credentials: "include",
      headers: { accept: "*/*" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to select compare syllabus");
    }
    return response.json();
  },
  async publishSyllabus(syllabusId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`/api/syllabus/${syllabusId}/publish`, {
      method: "PATCH",
      credentials: "include",
      headers: { accept: "*/*" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to publish syllabus");
    }
    return response.json();
  },
};

export interface SyllabusCompareHistory {
  historyId: string;
  oldSyllabusId: string;
  newSyllabusId: string;
  assessmentDiffJson: string;
  conceptDiffJson: string;
  selectedCompare: boolean;
  createdAt: string;
}


