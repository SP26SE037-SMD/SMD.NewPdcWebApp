import { apiClient } from '@/lib/api-client';

export interface AssessmentItem {
    assessmentId?: string;
    categoryId: string;
    categoryName?: string;
    typeId: string;
    typeName?: string;
    syllabusId: string;
    part: number;
    weight: number;
    completionCriteria: string;
    duration: number;
    questionType: string;
    knowledgeSkill: string;
    gradingGuide: string;
    note: string;
    status: string;
    cloIds?: string[];
    createdAt?: string;
}

export interface AssessmentCategory {
    categoryId: string;
    categoryName: string;
    description: string;
}

export interface AssessmentType {
    typeId: string;
    typeName: string;
}

export interface PaginatedResponse<T> {
    status: number;
    message: string;
    data: {
        content: T[];
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
}

export class AssessmentService {
    static async getAssessmentsBySyllabusId(syllabusId: string, status?: string) {
        let url = `/api/assessments/syllabus/${syllabusId}`;
        if (status) {
            url += `?status=${status}`;
        }
        console.log("ASSESSMENT SERVICE GET URL:", url);
        let response: any;
        try {
            response = await apiClient.get<any>(url);
        } catch (err) {
            console.warn("API call for assessments failed, providing mock container", err);
            response = { status: 200, message: "Mock Container", data: { content: [] } };
        }

        return response;
    }

    static async createAssessment(assessment: Omit<AssessmentItem, 'assessmentId' | 'createdAt'>) {
        return apiClient.post('/api/assessments', assessment);
    }

    static async updateAssessment(assessmentId: string, assessment: Partial<AssessmentItem>) {
        return apiClient.put(`/api/assessments/${assessmentId}`, assessment);
    }

    static async deleteAssessment(assessmentId: string) {
        return apiClient.delete(`/api/assessments/${assessmentId}`);
    }

    static async updateAssessmentStatus(assessmentId: string, status: string) {
        return apiClient.patch(`/api/assessments/${assessmentId}/status?status=${status}`, {});
    }

    static async getCategories(size: number = 100) {
        return apiClient.get<PaginatedResponse<AssessmentCategory>>(`/api/assessment-categories?size=${size}`);
    }

    static async getTypes(size: number = 100) {
        return apiClient.get<PaginatedResponse<AssessmentType>>(`/api/assessment-types?size=${size}`);
    }

    static async updateSyllabusAssessmentsStatus(syllabusId: string, newStatus: string) {
        return apiClient.patch(`/api/assessments/syllabus/${syllabusId}/status?newStatus=${newStatus}`, {});
    }
}
