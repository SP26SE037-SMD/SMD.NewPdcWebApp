import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api';

export interface CloAssessmentMapping {
    id: string;
    cloId: string;
    cloCode: string;
    cloName: string;
    assessmentId: string;
    assessmentPart: number;
    assessmentStatus: string;
    syllabusId: string;
}

export interface CloSessionMapping {
    id: string;
    cloId: string;
    cloCode: string;
    cloName: string;
    sessionId: string;
    sessionNumber: number;
    sessionTitle: string;
    syllabusId: string;
}

export interface MappingBatchRequest<T> {
    mappings: T[];
}

export class MappingService {
    // --- Assessment Mappings ---
    static async getAssessmentMappings(assessmentId: string): Promise<ApiResponse<CloAssessmentMapping[]>> {
        return apiClient.get<ApiResponse<CloAssessmentMapping[]>>(`/api/clo-assessment-mappings/assessment/${assessmentId}`);
    }

    static async createAssessmentMappingsBatch(mappings: { cloId: string; assessmentId: string }[]): Promise<ApiResponse<CloAssessmentMapping[]>> {
        return apiClient.post<ApiResponse<CloAssessmentMapping[]>>('/api/clo-assessment-mappings/batch', { mappings });
    }

    static async deleteAssessmentMapping(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<ApiResponse<void>>(`/api/clo-assessment-mappings/${id}`);
    }

    // --- Session Mappings ---
    static async getSessionMappings(sessionId: string): Promise<ApiResponse<CloSessionMapping[]>> {
        return apiClient.get<ApiResponse<CloSessionMapping[]>>(`/api/clo-session-mappings/session/${sessionId}`);
    }

    static async createSessionMappingsBatch(mappings: { cloId: string; sessionId: string }[]): Promise<ApiResponse<CloSessionMapping[]>> {
        return apiClient.post<ApiResponse<CloSessionMapping[]>>('/api/clo-session-mappings/batch', { mappings });
    }

    static async deleteSessionMapping(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<ApiResponse<void>>(`/api/clo-session-mappings/${id}`);
    }
}
