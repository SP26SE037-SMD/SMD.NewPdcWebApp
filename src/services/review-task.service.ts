import { apiClient } from "@/lib/api-client";

export interface Reviewer {
  reviewerId: string;
  fullName: string;
  email: string;
  avatarUrl: string;
}

export const REVIEW_TASK_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  APPROVED: "APPROVED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
} as const;

export type ReviewTaskStatus =
  (typeof REVIEW_TASK_STATUS)[keyof typeof REVIEW_TASK_STATUS];

export interface CreateReviewTaskPayload {
  taskId: string;
  reviewerId: string;
  titleTask: string;
  commentMaterial?: string;
  commentSession?: string;
  commentAssessment?: string;
  reviewDate?: string;
  countDown?: number;
  status?: string;
  dueDate: string;
}

export interface ReviewTaskItem {
  reviewId: string;
  titleTask: string;
  content: string;
  commentMaterial?: string;
  commentSession?: string;
  commentAssessment?: string;
  isAccepted?: boolean;
  reviewDate: string;
  dueDate: string;
  status: ReviewTaskStatus;
  task: {
    taskId: string;
    taskName: string;
  };
  reviewer: Reviewer;
}

export interface ReviewTasksPaginatedResponse {
  status: number;
  message: string;
  data: {
    content: ReviewTaskItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ReviewTaskSingleResponse {
  status: number;
  message: string;
  data: ReviewTaskItem;
}

export interface UpdateReviewTaskPayload {
  titleTask: string;
  commentMaterial: string;
  commentSession: string;
  commentAssessment: string;
  reviewDate: string;
  dueDate: string;
  status: string;
  taskId: string;
  reviewerId: string;
}

/**
 * ReviewTaskService - Stubbed out to prevent failing API calls
 * The backend /api/review-tasks is currently causing 500 errors.
 */
export const ReviewTaskService = {
  getReviewTasks: async (accountId: string, status?: string | string[], page: number = 0, size: number = 10) => {
    return {
        status: 200,
        message: "Feature disabled",
        data: {
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
        }
    } as any;
  },

  searchReviewTasks: async (params: any) => {
    return {
        status: 200,
        message: "Feature disabled",
        data: {
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
        }
    } as any;
  },

  updateReviewTaskStatus: async (reviewId: string, status: string) => {
    return { status: 200, message: "Disabled" } as any;
  },

  updateReviewTask: async (reviewId: string, payload: UpdateReviewTaskPayload) => {
    return { status: 200, message: "Disabled" } as any;
  },

  updateReviewTaskAcceptance: async (reviewId: string, isAccepted: boolean) => {
    return { status: 200, message: "Disabled" } as any;
  },

  getReviewTaskById: async (reviewId: string) => {
    return { status: 200, message: "Disabled", data: null } as any;
  },

  getReviewTasksByTaskId: async (taskId: string) => {
    return {
        status: 200,
        message: "Disabled",
        data: {
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
        }
    } as any;
  },

  createReviewTask: async (payload: CreateReviewTaskPayload) => {
    return { status: 200, message: "Disabled" } as any;
  },

  createHoCFDCReviewTask: async (payload: any) => {
    return { status: 200, message: "Disabled" } as any;
  },
};
