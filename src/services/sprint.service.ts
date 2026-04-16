import { apiClient } from "@/lib/api-client";

export const SPRINT_STATUS = {
  PLANNING: "PLANNING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type SprintStatus = (typeof SPRINT_STATUS)[keyof typeof SPRINT_STATUS];

export interface SprintPayload {
  sprintName: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  departmentId: string;
  curriculumId: string;
}

export interface SprintItem {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  status: string;
  curriculumId?: string;
  departmentId?: string;
}

export interface SprintQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
  status?: string;
  search?: string;
  curriculumId?: string;
}

export interface SprintListResponse {
  status: number;
  message: string;
  data?: {
    content?: SprintItem[];
    totalPages?: number;
    totalElements?: number;
  };
}

export interface SprintCreateResponse {
  status: number;
  message: string;
  data?: SprintItem;
}

export interface SprintUpdateResponse {
  status: number;
  message: string;
  data?: SprintItem;
}

export const SprintService = {
  getSprints: async (params?: SprintQueryParams) => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const sortBy = params?.sortBy ?? "startDate";
    const direction = params?.direction ?? "desc";
    
    let url = `/api/sprints?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
    
    if (params?.status) {
      url += `&status=${encodeURIComponent(params.status)}`;
    }
    if (params?.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }
    if (params?.curriculumId) {
      url += `&curriculumId=${encodeURIComponent(params.curriculumId)}`;
    }

    return apiClient.get<SprintListResponse>(url, {
      credentials: "include",
    });
  },

  getSprintById: async (sprintId: string) => {
    return apiClient.get<{ status: number; message: string; data?: SprintItem }>(
      `/api/sprints/${sprintId}`,
      {
        credentials: "include",
      },
    );
  },

  getSprintsByAccount: async (
    accountId: string,
    params?: SprintQueryParams,
  ) => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? "startDate";
    const direction = params?.direction ?? "desc";

    let url = `/api/sprints/account/${accountId}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
    
    if (params?.status) {
      url += `&status=${encodeURIComponent(params.status)}`;
    }
    if (params?.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }

    return apiClient.get<SprintListResponse>(url, {
      credentials: "include",
    });
  },

  createSprint: async (payload: SprintPayload) => {
    return apiClient.post<SprintCreateResponse>("/api/sprints", payload, {
      credentials: "include",
    });
  },

  updateSprint: async (sprintId: string, payload: SprintPayload) => {
    return apiClient.put<SprintUpdateResponse>(
      `/api/sprints/${sprintId}`,
      payload,
      {
        credentials: "include",
      },
    );
  },

  updateSprintStatus: async (
    sprintId: string,
    status: SprintStatus | string,
  ) => {
    return apiClient.patch<SprintUpdateResponse>(
      `/api/sprints/${sprintId}?status=${encodeURIComponent(status)}`,
      {},
      {
        credentials: "include",
      },
    );
  },

  deleteSprint: async (sprintId: string) => {
    const response = await fetch(`/api/sprints/${sprintId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to delete sprint");
    }

    return response.json().catch(() => ({
      status: 1000,
      message: "Sprint deleted successfully",
    }));
  },
};
