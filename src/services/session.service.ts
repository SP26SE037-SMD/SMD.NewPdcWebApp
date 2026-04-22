import { apiClient } from '@/lib/api-client';

export interface SessionMaterialMapping {
    materialId: string;
    materialName?: string;
}

export interface SessionBlockMapping {
    blockId: string;
    content?: string;
    idx?: number;
}

export interface DetailedSessionItem {
    session: string; // This is the sessionId (UUID)
    sessionNumber: number;
    sessionTitle: string;
    teachingMethods: string;
    duration: number;
    material: SessionMaterialMapping[];
    block: SessionBlockMapping[];
}

export interface BulkConfigurePayload {
    syllabusId: string;
    sessionNumber: number;
    sessionTitle: string;
    teachingMethods: string;
    duration: number;
    material: string[]; // Array of material UUIDs
    block: string[]; // Array of block UUIDs
    cloIds?: string[];
}

export interface UpdateSessionBlocksPayload extends Omit<BulkConfigurePayload, 'syllabusId'> {
    sessionId: string;
}

export interface SessionItem {
    sessionId?: string;
    syllabusId: string;
    sessionNumber: number;
    sessionTitle: string;
    content: string; // We'll keep this for internal UI state (the JSON selection)
    teachingMethods: string;
    duration: number;
    cloIds?: string[];
}

export class SessionService {
    // New Detailed Endpoints
    static async getDetailedSessions(syllabusId: string, page = 0, size = 100, status?: string) {
        let url = `/api/session-material-blocks?syllabusId=${syllabusId}&page=${page}&size=${size}`;
        if (status) {
            url += `&status=${status}`;
        }
        let response: any;
        try {
            response = await apiClient.get<any>(url);
        } catch (err) {
            console.warn("API call for detailed sessions failed, providing mock container", err);
            response = { status: 200, message: "Mock Container", data: { content: [] } };
        }

        return response;
    }

    static async bulkConfigureSession(payload: BulkConfigurePayload) {
        return apiClient.post('/api/session-material-blocks/bulk-configure', payload);
    }

    static async updateSessionBlocks(payload: UpdateSessionBlocksPayload) {
        return apiClient.put('/api/session-material-blocks/update', payload);
    }

    // Legacy / Other Helpers
    static async deleteSession(sessionId: string) {
        return apiClient.delete(`/api/sessions/${sessionId}`);
    }

    static async updateSyllabusSessionsStatus(syllabusId: string, newStatus: string) {
        return apiClient.patch(`/api/sessions/syllabus/${syllabusId}/status?newStatus=${newStatus}`, {});
    }

    static async updateSessionStatus(sessionId: string, newStatus: string) {
        return apiClient.patch(`/api/sessions/${sessionId}/status?newStatus=${newStatus}`, {});
    }
}
