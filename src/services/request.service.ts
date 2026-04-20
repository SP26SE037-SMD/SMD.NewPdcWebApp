import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

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
    updateRequest: (id: string, data: RequestUpdatePayload) => {
        return apiClient.put<ApiResponse<any>>(`/api/requests/${id}`, data);
    }
};
