import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface RequestPermission {
    permissionId: string;
    permissionName: string;
    description?: string;
    createdAt?: string;
}

export interface RequestRole {
    roleId: string;
    roleName: string;
    description?: string;
    permissions?: RequestPermission[];
    createdAt?: string;
}

export interface RequestCreatedBy {
    accountId: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    role?: RequestRole | string;
    isActive?: boolean;
    createdAt?: string;
    lastLogin?: string;
    departmentName?: string;
    departmentId?: string;
}

export interface RequestCurriculum {
    curriculumId: string;
    curriculumCode?: string;
    curriculumName?: string;
    startYear?: number;
    endYear?: number;
    status?: string;
    description?: string;
    major?: {
        majorId: string;
        majorCode?: string;
        majorName?: string;
    };
}

export interface RequestMajor {
    majorId: string;
    majorCode?: string;
    majorName?: string;
    description?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RequestItem {
    requestId: string;
    title: string;
    content: string;
    comment?: string;
    status: string;
    createdBy?: RequestCreatedBy;
    createdById?: string;
    curriculum?: RequestCurriculum;
    major?: RequestMajor;
    createdAt?: string;
    updatedAt?: string;
}

export interface RequestListData {
    content: RequestItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export type RequestListResponse = ApiResponse<RequestListData>;
export type RequestDetailResponse = ApiResponse<RequestItem>;

export interface RequestQueryParams {
    search?: string;
    status?: string;
    curriculumId?: string;
    majorId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: "asc" | "desc";
}

export interface CreateRequestPayload {
    title: string;
    content: string;
    comment?: string;
    status?: string;
    createdById: string;
    curriculumId: string;
    majorId: string;
}

export interface RequestUpdatePayload {
    title?: string;
    content?: string;
    comment?: string;
    status: "APPROVED" | "REJECTED";
    createdById?: string;
    curriculumId?: string;
    majorId?: string;
}

export const RequestService = {
    getRequests: async (params?: RequestQueryParams) => {
        const queryParams = new URLSearchParams();

        const page = params?.page ?? 0;
        const size = params?.size ?? 10;
        const sortBy = params?.sortBy ?? "createdAt";
        const direction = params?.direction ?? "desc";

        queryParams.append("page", page.toString());
        queryParams.append("size", size.toString());
        queryParams.append("sortBy", sortBy);
        queryParams.append("direction", direction);

        if (params?.search) queryParams.append("search", params.search);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.curriculumId)
            queryParams.append("curriculumId", params.curriculumId);
        if (params?.majorId) queryParams.append("majorId", params.majorId);

        return apiClient.get<RequestListResponse>(
            `/api/requests?${queryParams.toString()}`,
        );
    },

    getRequestById: async (id: string) => {
        return apiClient.get<RequestDetailResponse>(`/api/requests/${id}`);
    },

    createRequest: async (payload: CreateRequestPayload) => {
        return apiClient.post<RequestDetailResponse>("/api/requests", payload, {
            credentials: "include",
        });
    },

    updateRequest: (id: string, data: RequestUpdatePayload) => {
        return apiClient.put<RequestDetailResponse>(`/api/requests/${id}`, data);
    },

    updateRequestStatus: async (id: string, status: string, comment: string = "") => {
        return apiClient.patch<RequestDetailResponse>(
            `/api/requests/${id}/status?status=${status}&comment=${encodeURIComponent(comment)}`,
            {}
        );
    },
};
