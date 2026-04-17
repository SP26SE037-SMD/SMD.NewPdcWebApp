import { ApiResponse, PageableResponse } from "@/types/api";
import { PO } from "./po.service";

export interface Major {
    majorId: string;
    majorCode: string;
    majorName: string;
    description: string;
    status: string;
    createdAt: string;
    pos?: PO[];
}

export interface MajorListParams {
    search?: string;
    searchBy?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string[];
    [key: string]: any; // Allow for future filters
}


export interface CreateMajorPayload {
    majorCode: string;
    majorName: string;
    description: string;
}

export const MajorService = {
    async getMajors(params?: MajorListParams): Promise<ApiResponse<PageableResponse<Major>>> {
        const query = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => query.append(key, v.toString()));
                    } else {
                        query.append(key, value.toString());
                    }
                }
            });
        }

        const qs = query.toString();
        const response = await fetch(`/api/majors${qs ? `?${qs}` : ''}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to fetch majors');
        }
        return response.json();
    },

    async createMajor(payload: CreateMajorPayload): Promise<ApiResponse<Major>> {
        const response = await fetch('/api/majors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to create major');
        }
        return response.json();
    },

    async updateMajor(majorId: string, payload: CreateMajorPayload): Promise<ApiResponse<Major>> {
        const response = await fetch(`/api/majors/${majorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to update major');
        }
        return response.json();
    },

    async updateMajorStatus(majorId: string, newStatus: string): Promise<ApiResponse<Major>> {
        const response = await fetch(`/api/majors/${majorId}/status?newStatus=${newStatus}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to update major status');
        }
        return response.json();
    },

    async getMajorByCode(code: string): Promise<ApiResponse<Major>> {
        const response = await fetch(`/api/majors/${encodeURIComponent(code)}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to fetch major details');
        }
        return response.json();
    },

    async getMajorById(id: string): Promise<ApiResponse<Major>> {
        const response = await fetch(`/api/majors/${id}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to fetch major by ID');
        }
        return response.json();
    },

    async deleteMajor(majorId: string): Promise<ApiResponse<void>> {
        const response = await fetch(`/api/majors/${majorId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to delete major');
        }
        return response.json();
    }
};

