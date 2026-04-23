import { apiClient } from "@/lib/api-client";

export const CURRICULUM_STATUS = {
  DRAFT: 'DRAFT',
  STRUCTURE_REVIEW: 'STRUCTURE_REVIEW',
  STRUCTURE_APPROVED: 'STRUCTURE_APPROVED',
  SYLLABUS_DEVELOP: 'SYLLABUS_DEVELOP',
  FINAL_REVIEW: 'FINAL_REVIEW',
  SIGNED: 'SIGNED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

// CurriculumStatus
// (Kiểu dữ liệu): Dùng để định nghĩa khuôn mẫu (Type Annotation) giúp trình soạn thảo (VS Code) và TypeScript compiler cảnh báo nếu bạn truyền sai giá trị.
// Ví dụ: function update(status: CurriculumStatus) -> Nếu bạn truyền một chuỗi bất kỳ như "XYZ", nó sẽ báo lỗi ngay lập tức.
export type CurriculumStatus =
  (typeof CURRICULUM_STATUS)[keyof typeof CURRICULUM_STATUS];

export interface APIResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PLO {
  ploId: string;
  ploCode?: string;
  ploName?: string;
  description: string;
  status?: string;
  mappingPOIds?: string[];
  createdAt?: string;
}

export interface CurriculumSubject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  status?: string;
  credits: number;
  degreeLevel?: string;
  timeAllocation?: string;
  description: string;
  studentTasks?: string;
  scoringScale?: number;
  minToPass?: number;
  minBloomLevel?: number;
  departmentId?: string;
  departmentName?: string;
  electiveId?: string;
  decisionNo?: string;
  tool?: string | null;
  approvedDate?: string;
  semester?: number;
  prerequisites?: CurriculumSubject[];
  mappingPLOs?: string[];
}

export interface CurriculumFramework {
  curriculumId: string;
  curriculumCode: string;
  curriculumName: string;
  majorId?: string;
  startYear?: number;
  endYear?: number;
  status: CurriculumStatus;
  major?: {
    majorId: string;
    majorCode: string;
    majorName: string;
  };
  // Extended properties for mock compatibility and dashboard usage
  majorCode?: string;
  majorName?: string;
  frameworkName?: string;
  description?: string;
  version?: string;
  updatedAt?: string;
  createdAt?: string;
  subjects?: CurriculumSubject[];
  plos?: any[];
}

export const CurriculumService = {
  getAllCurriculums: async () => {
    return apiClient.get<CurriculumFramework[]>("/api/curriculums");
  },

  getCurriculumById: async (id: string) => {
    return apiClient.get<any>(`/api/curriculums/${id}`);
  },

  async getCurriculums(params?: {
    search?: string;
    searchBy?: string;
    status?: string;
    page?: number;
    size?: number;
    majorId?: string;
    sort?: string[];
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.searchBy) queryParams.append("searchBy", params.searchBy);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.majorId) queryParams.append("majorId", params.majorId);
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.append("size", params.size.toString());
    if (params?.sort) {
      params.sort.forEach((s) => queryParams.append("sort", s));
    }

    const queryString = queryParams.toString();
    return apiClient.get<{
      status: number;
      message: string;
      data: {
        content: CurriculumFramework[];
        totalElements: number;
        totalPages: number;
        size: number;
        page: number;
      };
    }>(`/api/curriculums${queryString ? `?${queryString}` : ""}`);
  },

  getCurriculumsByMajor: async (majorCode: string) => {
    return apiClient.get<CurriculumFramework[]>(
      `/api/majors/${majorCode}/curriculums`,
    );
  },

  getCurriculumsByMajorId: async (majorId: string) => {
    return apiClient.get<APIResponse<CurriculumFramework[]>>(
      `/api/curriculums/major/${majorId}`,
    );
  },

  createCurriculum: async (payload: Partial<CurriculumFramework>) => {
    return apiClient.post<CurriculumFramework>("/api/curriculums", payload);
  },

  getPloByCurriculumId: async (curriculumId: string, status?: string, size: number = 50) => {
    const params = new URLSearchParams({ page: "0", size: size.toString() });
    if (status) {
      params.append("status", status);
    }
    return apiClient.get<APIResponse<{ content: PLO[] }>>(
      `/api/plos/curriculum/${curriculumId}?${params.toString()}`,
    );
  },

  getSubjectsByCurriculumAndDepartment: async (
    curriculumId: string,
    departmentId: string,
    subjectStatus?: "WAITING_SYLLABUS" | "COMPLETED",
  ) => {
    const params = new URLSearchParams({ curriculumId, departmentId });
    if (subjectStatus) {
      params.set("subjectStatus", subjectStatus);
    }

    return apiClient.get<APIResponse<CurriculumSubject[]>>(
      `/api/curriculum-group-subjects/subjects/by-curriculum?${params.toString()}`,
    );
  },

  updateCurriculum: async (
    id: string,
    payload: Partial<CurriculumFramework>,
  ) => {
    return apiClient.put<CurriculumFramework>(
      `/api/curriculums/${id}`,
      payload,
    );
  },

  updateCurriculumStatus: async (id: string, status: CurriculumStatus) => {
    return apiClient.patch<APIResponse<CurriculumFramework>>(
      `/api/curriculums/${id}/status?status=${status}`,
      {},
    );
  },

  getPLOsByCurriculumId: async (id: string) => {
    return apiClient.get<any>(`/api/plos/curriculum/${id}?page=0&size=100`);
  },

  async bulkCreatePLOs(curriculumId: string, plos: any[]) {
    const payload = plos.map((plo) => ({
      ploCode: plo.ploName || plo.ploCode,
      description: plo.description,
    }));
    return apiClient.post<any>(`/api/plos/curriculum/${curriculumId}`, payload);
  },

  updatePLO: async (
    ploId: string,
    payload: { ploCode?: string; description?: string; curriculumId: string },
  ) => {
    return apiClient.put<APIResponse<PLO>>(`/api/plos/${ploId}`, payload);
  },

  updatePloStatusByCurriculum: async (curriculumId: string, newStatus: string) => {
    return apiClient.patch<any>(
      `/api/plos/curriculum/${curriculumId}/status?newStatus=${newStatus}`,
      {},
    );
  },

  deleteCurriculum: async (id: string): Promise<APIResponse<void>> => {
    return apiClient.delete<APIResponse<void>>(`/api/curriculums/${id}`);
  },
  deletePLO: async (ploId: string) => {
    return apiClient.delete<APIResponse<void>>(`/api/plos/${ploId}`);
  },
};
