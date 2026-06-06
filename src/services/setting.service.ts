import { apiClient } from '@/lib/api-client';
import { ApiResponse, PageableResponse } from '@/types/api';

export interface SystemSetting {
    id: string;
    code: string;
    value: string;
    description: string;
}

export const SettingService = {
    async getSettings(search?: string, page: number = 0, size: number = 100): Promise<ApiResponse<PageableResponse<SystemSetting>>> {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        query.append('page', page.toString());
        query.append('size', size.toString());
        
        const url = `/api/settings?${query.toString()}`;
        return apiClient.get<ApiResponse<PageableResponse<SystemSetting>>>(url);
    }
};
