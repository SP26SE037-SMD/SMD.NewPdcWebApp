import { apiClient } from '@/lib/api-client';
import { ApiResponse, PageableResponse } from '@/types/api';

export interface GroupRequest {
    groupCode: string;
    groupName: string;
    description: string;
    type: 'COMBO' | 'ELECTIVE';
}

export interface GroupResponse {
    groupId: string;
    groupCode: string;
    groupName: string;
    description: string;
    status: string;
    type: 'COMBO' | 'ELECTIVE';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const GroupService = {
    async createGroup(data: GroupRequest): Promise<ApiResponse<GroupResponse>> {
        return apiClient.post<ApiResponse<GroupResponse>>('/api/group', data);
    },

    async getGroups(type?: 'COMBO' | 'ELECTIVE', page: number = 0, size: number = 10): Promise<ApiResponse<PageableResponse<GroupResponse>>> {
        const query = new URLSearchParams();
        if (type) query.append('type', type);
        query.append('page', page.toString());
        query.append('size', size.toString());
        
        const url = `/api/group?${query.toString()}`;
        return apiClient.get<ApiResponse<PageableResponse<GroupResponse>>>(url);
    },

    async getGroupById(id: string): Promise<ApiResponse<GroupResponse>> {
        return apiClient.get<ApiResponse<GroupResponse>>(`/api/group/${id}`);
    }
};
