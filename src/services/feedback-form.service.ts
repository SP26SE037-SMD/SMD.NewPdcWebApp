import { apiClient } from "@/lib/api-client";

export interface FeedbackFormRecord {
  id: string;
  curriculumId: string;
  googleFormId?: string | null;
  formUrl?: string | null;
  editFormURL?: string | null;
  formType: string;
  isActive: boolean;
  createdAt?: string;
}

export interface FeedbackFormSection {
  sectionId: string;
  title?: string;
  orderIndex?: number;
  afterSectionAction?: "NEXT" | "SUBMIT" | "GO_TO_SECTION";
}

export interface FeedbackQuestionOption {
  optionId?: string;
  text?: string;
  optionText?: string;
  goToSectionId?: string | null;
  nextSectionId?: string | null;
}

export interface FeedbackFormQuestion {
  questionId: string;
  type:
    | "TEXT"
    | "SHORT_TEXT"
    | "PARAGRAPH"
    | "RADIO"
    | "CHECKBOX"
    | "DROPDOWN"
    | "SCALE"
    | "LINEAR_SCALE"
    | "DATE"
    | "TIME";
  content: string;
  isRequired?: boolean;
  options?: FeedbackQuestionOption[];
}

export interface FeedbackFormSchemaSection {
  sectionId: string;
  title?: string;
  orderIndex?: number;
  actionAfter?: "NEXT" | "SUBMIT" | "GO_TO_SECTION";
  afterSectionAction?: "NEXT" | "SUBMIT" | "GO_TO_SECTION";
  targetSectionId?: string | null;
  questions?: FeedbackFormQuestion[];
}

export interface FeedbackFormFullSchema {
  formId: string;
  title?: string;
  description?: string;
  sections: FeedbackFormSchemaSection[];
}

export interface FeedbackFormDetail extends FeedbackFormRecord {
  sections?: FeedbackFormSection[];
}

export interface FeedbackCreatePayload {
  departmentId: string;
  formName: string;
  description?: string;
}

export interface FeedbackTriggerBuildResponse {
  success?: boolean;
  message?: string;
}

export interface FeedbackCreateSectionPayload {
  title?: string;
  afterSectionAction?: "NEXT" | "SUBMIT" | "GO_TO_SECTION";
  targetSectionId?: string | null;
}

export interface FeedbackCreateQuestionPayload {
  content: string;
  type:
    | "TEXT"
    | "SHORT_TEXT"
    | "PARAGRAPH"
    | "RADIO"
    | "CHECKBOX"
    | "DROPDOWN"
    | "SCALE"
    | "LINEAR_SCALE"
    | "DATE"
    | "TIME";
  isRequired?: boolean;
  options?: Array<{
    optionText: string;
    nextSectionId?: string | null;
  }>;
}

export interface FeedbackSubmissionRecord {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    answerText?: string;
    selectedOptionId?: string;
    selectedOptionText?: string;
  }>;
}

export interface FeedbackReportData {
  formId: string;
  totalSubmissions: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    type: string;
    optionCounts?: Record<string, number>;
    averageRating?: number;
    textAnswers?: string[];
  }>;
}

export const FeedbackFormService = {
  getFormsByCurriculumId: async (curriculumId: string) => {
    const query = new URLSearchParams({ curriculumId });
    return apiClient.get<FeedbackFormRecord[]>(`/api/v1/forms?${query.toString()}`);
  },

  createForm: async (payload: FeedbackCreatePayload) => {
    return apiClient.post<FeedbackFormRecord>("/api/v1/forms", payload, {
      credentials: "include",
    });
  },

  getFormById: async (formId: string) => {
    return apiClient.get<FeedbackFormDetail>(`/api/v1/forms/${formId}`);
  },

  getFormFullSchema: async (formId: string) => {
    return apiClient.get<FeedbackFormFullSchema>(`/api/v1/forms/${formId}/full`);
  },

  createSection: async (
    formId: string,
    payload: FeedbackCreateSectionPayload,
  ) => {
    return apiClient.post<FeedbackFormSchemaSection>(
      `/api/v1/forms/${formId}/sections`,
      payload,
      { credentials: "include" },
    );
  },

  updateSection: async (
    sectionId: string,
    payload: FeedbackCreateSectionPayload,
  ) => {
    return apiClient.put<FeedbackFormSchemaSection>(
      `/api/v1/forms/sections/${sectionId}`,
      payload,
      { credentials: "include" },
    );
  },

  deleteSection: async (sectionId: string) => {
    return apiClient.delete<{ message?: string }>(
      `/api/v1/forms/sections/${sectionId}`,
      { credentials: "include" },
    );
  },

  createQuestion: async (
    sectionId: string,
    payload: FeedbackCreateQuestionPayload,
  ) => {
    return apiClient.post<FeedbackFormQuestion>(
      `/api/v1/forms/sections/${sectionId}/questions`,
      payload,
      { credentials: "include" },
    );
  },

  updateQuestion: async (
    questionId: string,
    payload: FeedbackCreateQuestionPayload,
  ) => {
    return apiClient.put<FeedbackFormQuestion>(
      `/api/v1/forms/questions/${questionId}`,
      payload,
      { credentials: "include" },
    );
  },

  deleteQuestion: async (questionId: string) => {
    return apiClient.delete<{ message?: string }>(
      `/api/v1/forms/questions/${questionId}`,
      { credentials: "include" },
    );
  },

  triggerBuild: async (formId: string) => {
    return apiClient.post<FeedbackTriggerBuildResponse>(
      `/api/v1/forms/${formId}/trigger-build`,
      {},
      { credentials: "include" },
    );
  },

  getSubmissions: async (formId: string) => {
    return apiClient.get<FeedbackSubmissionRecord[]>(
      `/api/v1/forms/${formId}/submissions`,
    );
  },

  getReport: async (formId: string) => {
    return apiClient.get<FeedbackReportData>(`/api/v1/forms/${formId}/report`);
  },

  scheduleClose: async (formId: string, payload: { closeAt: string }) => {
    return apiClient.post<{ message?: string }>(
      `/api/v1/forms/${formId}/schedule-close`,
      payload,
      { credentials: "include" }
    );
  },
};
