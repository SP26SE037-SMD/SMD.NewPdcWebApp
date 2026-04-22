import { apiClient } from "@/lib/api-client";
import { ApiResponse, PageableResponse, ApiResponseWithoutData } from "@/types/api";

export const SUBJECT_STATUS = {
    DRAFT: 'DRAFT',
    DEFINED: 'DEFINED',
    WAITING_SYLLABUS: 'WAITING_SYLLABUS',
    PENDING_REVIEW: 'PENDING_REVIEW',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED',
} as const;

export type SubjectStatus = typeof SUBJECT_STATUS[keyof typeof SUBJECT_STATUS];

export interface SubjectListParams {
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateSubjectPayload {
  subjectCode: string;
  subjectName: string;
  minBloomLevel: number;
  credits: number;
  degreeLevel: string;
  timeAllocation: string;
  description: string;
  studentTasks: string;
  scoringScale: number;
  minToPass: number;
  tool: string;
  departmentId: string;
}

export interface PrerequisiteItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  prerequisiteSubjectCode: string;
  prerequisiteSubjectName: string;
  isMandatory: boolean;
  createdAt: string | Date;
}

export interface Subject {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    degreeLevel: string;
    timeAllocation: string;
    description: string;
    studentTasks: string;
    scoringScale: number;
    minToPass?: number;
    minBloomLevel?: number;
    decisionNo: string | null;
    tool: string | null;
    approvedDate: string | null;
    isApproved: boolean;
    status: SubjectStatus;
    department?: {
        departmentId: string;
        departmentCode: string;
        departmentName: string;
        description: string;
        createdAt: string;
    };
    preRequisite?: PrerequisiteItem[];
    createdAt: string;
}

export interface SubjectResponse {
  status: number;
  message: string;
  data: {
    content: Subject[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface SubjectDetail {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  degreeLevel: string;
  timeAllocation: string;
  description: string;
  studentTasks: string;
  scoringScale: number;
  minToPass: number;
  minBloomLevel?: number;
  decisionNo: string | null;
  tool: string | null;
  approvedDate: string | null;
  status?: string; curriculumId?: string;
  createdAt?: string;
  department?: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
  } | null;
  preRequisite?: PrerequisiteItem[];
}

export const SubjectService = {
  createElective: async (data: any): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>("/api/electives", data);
  },
  async getSubjects(params?: {
    search?: string;
    searchBy?: string;
    status?: string; curriculumId?: string;
    departmentId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: "asc" | "desc";
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.searchBy)
      queryParams.append("searchBy", params.searchBy || "code");
    if (params?.status) queryParams.append("status", params.status); if (params?.curriculumId) queryParams.append("curriculumId", params.curriculumId);
    if (params?.departmentId)
      queryParams.append("departmentId", params.departmentId);
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.append("size", params.size.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.direction) queryParams.append("direction", params.direction);

    const queryString = queryParams.toString();
    return apiClient.get<SubjectResponse>(
      `/api/subjects${queryString ? `?${queryString}` : ""}`,
    );
  },

  async getSubjectById(id: string): Promise<ApiResponse<Subject>> {
    return apiClient.get<ApiResponse<Subject>>(`/api/subjects/${id}`);
  },

  async getSubjectDetail(id: string): Promise<SubjectDetail> {
    const response = await apiClient.get<ApiResponse<SubjectDetail>>(
      `/api/subjects/${id}`,
    );
    return response.data;
  },

  async getDepartments(params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageableResponse<any>>> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.page !== undefined)
      query.append("page", params.page.toString());
    if (params?.size !== undefined)
      query.append("size", params.size.toString());

    const qs = query.toString();
    const response = await fetch(`/api/departments${qs ? `?${qs}` : ""}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to fetch departments",
      );
    }
    return response.json();
  },

  async createSubject(
    payload: CreateSubjectPayload,
  ): Promise<ApiResponse<unknown>> {
    return apiClient.post<ApiResponse<unknown>>("/api/subjects", payload);
  },

  async importSubjects(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/subjects/import", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to import subjects",
      );
    }
    return response.json();
  },

  async updateSubject(
    id: string,
    payload: any,
  ): Promise<ApiResponseWithoutData> {
    const response = await fetch(`/api/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to update subject",
      );
    }
    return response.json();
  },

  async updateSubjectStatus(subjectId: string, newStatus: string): Promise<ApiResponseWithoutData> {
    const response = await fetch(`/api/subjects/${subjectId}/status?status=${newStatus}`, {
      method: "PATCH",
      credentials: "include",
    });
    return response.json();
  },
  async updateSubjectStatusesBulk(
    curriculumId: string,
    newStatus: string,
    departmentId?: string,
    oldStatus?: string
  ): Promise<ApiResponseWithoutData> {
    const params = new URLSearchParams();
    params.append("curriculumId", curriculumId);
    if (departmentId) params.append("departmentId", departmentId);
    params.append("newStatus", newStatus);
    if (oldStatus) params.append("oldStatus", oldStatus);

    const response = await fetch(
      `/api/subjects/bulk-status?${params.toString()}`,
      {
        method: "PATCH",
        headers: { accept: "*/*" },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to update subject status bulk"
      );
    }
    return response.json();
  },

  // Prerequisite Methods
  async addPrerequisite(payload: {
    subjectId: string;
    prerequisiteSubjectId: string;
    isMandatory: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await fetch("/api/prerequisites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to add prerequisite",
      );
    }
    return response.json();
  },

  async getPrerequisites(
    subjectId: string,
  ): Promise<ApiResponse<PrerequisiteItem[]>> {
    const response = await fetch(
      `/api/prerequisites/${subjectId}/requirements`,
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to fetch prerequisites",
      );
    }
    return response.json();
  },

  async getDependents(
    subjectId: string,
  ): Promise<ApiResponse<PrerequisiteItem[]>> {
    const response = await fetch(
      `/api/prerequisites/${subjectId}/dependents`,
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to fetch dependents",
      );
    }
    return response.json();
  },

  async deletePrerequisite(id: string): Promise<ApiResponseWithoutData> {
    const response = await fetch(`/api/prerequisites/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || "Failed to delete prerequisite",
      );
    }
    return response.json();
  },
};
