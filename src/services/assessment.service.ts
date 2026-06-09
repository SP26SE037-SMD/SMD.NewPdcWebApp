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
    static async getAssessmentsBySyllabusId(syllabusId: string, page: number = 0, size: number = 1000) {
        let url = `/api/assessments/syllabus/${syllabusId}?page=${page}&size=${size}`;
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

    static async validateAssessments(syllabusId: string, payload: any[]) {
        return apiClient.post(`/api/assessments/validate?syllabusId=${syllabusId}`, payload);
    }

    static async validateAssessmentsSyllabus(syllabusId: string, payload: any[]) {
        return apiClient.post(`/api/assessments/syllabus/${syllabusId}/validate`, payload);
    }

    static async bulkCreateAssessments(payload: any[]) {
        return apiClient.post('/api/assessments/bluk', payload);
    }

    static async importAssessments(syllabusId: string, subjectId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.postFormData(`/api/assessments/import?syllabusId=${syllabusId}&subjectId=${subjectId}`, formData);
    }

    static async exportAssessments(syllabusId: string) {
        return apiClient.download(`/api/assessments/syllabus/${syllabusId}/export`);
    }

    static async bulkDeleteAssessments(assessmentIds: string[]) {
        return apiClient.delete('/api/assessments/bulk', { body: JSON.stringify(assessmentIds) });
    }
}
