import { ApiResponse, PageableResponse } from "@/types/api";

export interface PO {
    poId: string;
    poCode: string;
    description: string;
    status: string;
    createdAt: string;
}

export interface CreatePOPload {
    poCode: string;
    description: string;
}

export const PoService = {
    async getPOsByMajorId(majorId: string, params?: { page?: number; size?: number }): Promise<ApiResponse<PageableResponse<PO>>> {
        const query = new URLSearchParams();
        if (params?.page !== undefined) query.append('page', params.page.toString());
        if (params?.size !== undefined) query.append('size', params.size.toString());
        
        const response = await fetch(`/api/pos/major/${majorId}?${query.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to fetch POs');
        }
        return response.json();
    },

    async createMultiplePOs(majorId: string, pos: CreatePOPload[]): Promise<ApiResponse<PO[]>> {
        const response = await fetch(`/api/pos/major/${majorId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pos)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to create bulk POs');
        }
        return response.json();
    },

    async updatePOsStatusByMajor(majorId: string, newStatus: string): Promise<ApiResponse<any>> {
        const response = await fetch(`/api/pos/major/${majorId}/status?newStatus=${newStatus}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to update POs status');
        }
        return response.json();
    }
};
