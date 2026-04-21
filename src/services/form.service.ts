import { apiClient } from "@/lib/api-client";

export interface FeedbackForm {
  id: string;
  curriculumId: string;
  googleFormId: string | null;
  formUrl: string | null;
  formEditUrl: string | null;
  formType: string;
  isActive: boolean;
  createdAt: string;
}

export interface FeedbackFormOption {
  optionId: string;
  optionText: string;
  nextSectionId: string | null;
}

export interface FeedbackFormQuestion {
  questionId: string;
  content: string;
  type: "TEXT" | "PARAGRAPH" | "RADIO" | "CHECKBOX" | "DROPDOWN" | "SCALE" | "DATE" | "TIME";
  isRequired: boolean;
  options: FeedbackFormOption[];
}

export interface FeedbackFormSection {
  sectionId: string;
  title: string;
  orderIndex: number;
  afterSectionAction: "NEXT" | "SUBMIT" | "GO_TO_SECTION";
  targetSectionId: string | null;
  questions?: FeedbackFormQuestion[];
}

export interface FullFormSchema {
  formId: string;
  title: string;
  description: string;
  isActive: boolean;
  sections: FeedbackFormSection[];
}

export const FormService = {
  getForms: async (curriculumId: string) => {
    return apiClient.get<FeedbackForm[]>(`/api/v1/forms?curriculumId=${curriculumId}`);
  },

  getFormById: async (formId: string) => {
    return apiClient.get<FeedbackForm>(`/api/v1/forms/${formId}`);
  },

  getFormFullSchema: async (formId: string) => {
    return apiClient.get<FullFormSchema>(`/api/v1/forms/${formId}/full`);
  },

  createForm: async (payload: { curriculumId: string; formType: string }) => {
    return apiClient.post<FeedbackForm>("/api/v1/forms", payload);
  },

  triggerBuild: async (formId: string) => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/forms/${formId}/trigger-build`,
      {}
    );
  },

  // Section CRUD
  createSection: async (formId: string, payload: { title: string; afterSectionAction?: string; targetSectionId?: string | null }) => {
    return apiClient.post<FeedbackFormSection>(`/api/v1/forms/${formId}/sections`, payload);
  },

  updateSection: async (sectionId: string, payload: Partial<FeedbackFormSection>) => {
    return apiClient.put<FeedbackFormSection>(`/api/v1/forms/sections/${sectionId}`, payload);
  },

  deleteSection: async (sectionId: string) => {
    return apiClient.delete(`/api/v1/forms/sections/${sectionId}`);
  },

  // Question CRUD
  createQuestion: async (sectionId: string, payload: { content: string; type: string; isRequired: boolean; options?: any[] }) => {
    return apiClient.post<FeedbackFormQuestion>(`/api/v1/forms/sections/${sectionId}/questions`, payload);
  },

  updateQuestion: async (questionId: string, payload: Partial<FeedbackFormQuestion>) => {
    return apiClient.put<FeedbackFormQuestion>(`/api/v1/forms/questions/${questionId}`, payload);
  },

  deleteQuestion: async (questionId: string) => {
    return apiClient.delete(`/api/v1/forms/questions/${questionId}`);
  },

  getFormReport: async (formId: string) => {
    return apiClient.get<any>(`/api/v1/forms/${formId}/report`);
  },

  getSubmissions: async (formId: string) => {
    return apiClient.get<any[]>(`/api/v1/forms/${formId}/submissions`);
  }
};
