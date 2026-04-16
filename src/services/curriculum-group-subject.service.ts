import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface CurriculumGroupSubjectRequest {
    curriculumId?: string | null;
    groupId?: string | null;
    subjectId: string;
    semester: number;
}

export interface CurriculumGroupSubjectResponse {
    id: string;
    curriculumId: string;
    curriculumCode: string;
    curriculumName: string;
    groupId: string;
    groupCode: string;
    groupName: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    semester: number;
}

export interface BulkConfigureRequest {
    curriculumId: string;
    deleteSubjectsList?: string[];
    semesterMappings: {
        semesterNo: number;
        subjects: {
            subjectId: string;
            groupId: string | null;
        }[];
    }[];
}

export class CurriculumGroupSubjectService {
    static async getSubjectsByGroup(groupId: string): Promise<ApiResponse<any>> {
        return apiClient.get<ApiResponse<any>>(`/api/curriculum-group-subjects/subjects?searchType=group&searchId=${groupId}&page=0&size=100`);
    }

    static async getSubjectsByCurriculum(curriculumId: string): Promise<ApiResponse<any>> {
        return apiClient.get<ApiResponse<any>>(`/api/curriculum-group-subjects/semester-mappings?curriculumId=${curriculumId}`);
    }

    static async addSubject(data: CurriculumGroupSubjectRequest): Promise<ApiResponse<CurriculumGroupSubjectResponse>> {
        return apiClient.post<ApiResponse<CurriculumGroupSubjectResponse>>('/api/curriculum-group-subjects', data);
    }

    static async bulkConfigure(data: BulkConfigureRequest): Promise<ApiResponse<any>> {
        return apiClient.post<ApiResponse<any>>('/api/curriculum-group-subjects/bulk-configure', data);
    }

    static async getDepartmentsByCurriculum(curriculumId: string): Promise<ApiResponse<any>> {
        return apiClient.get<ApiResponse<any>>(`/api/curriculum-group-subjects/departments/by-curriculum?curriculumId=${curriculumId}`);
    }
}
