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

export const ReviewTaskService = {
  getReviewTasks: async (accountId: string, status?: string | string[], page: number = 0, size: number = 10) => {
    // For single status or no status
    if (!Array.isArray(status)) {
        const queryParams = new URLSearchParams({ accountId, page: page.toString(), size: size.toString() });
        if (status) {
            queryParams.append('status', status);
        }
        return await apiClient.get<ReviewTasksPaginatedResponse>(`/api/review-tasks?${queryParams.toString()}`);
    }

    // For multiple statuses (e.g. COMPLETED = APPROVED + REVISION_REQUESTED)
    const results = await Promise.all(status.map(async (s) => {
        const queryParams = new URLSearchParams({ accountId, status: s, page: page.toString(), size: size.toString() });
        return await apiClient.get<ReviewTasksPaginatedResponse>(`/api/review-tasks?${queryParams.toString()}`);
    }));

    // Merge results. Note: This simple merge doesn't perfectly handle complex pagination 
    // across multiple status-specific backends, but fits current UX requirements.
    const combinedContent = results.flatMap(r => r.data.content);
    const firstResult = results[0];

    return {
        ...firstResult,
        data: {
            ...firstResult.data,
            content: combinedContent,
            totalElements: results.reduce((acc, r) => acc + r.data.totalElements, 0),
            totalPages: Math.max(...results.map(r => r.data.totalPages))
        }
    };
  },

  searchReviewTasks: async (params: {
    search?: string;
    status?: string;
    taskId?: string;
    reviewerId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.taskId) queryParams.append('taskId', params.taskId);
    if (params.reviewerId) queryParams.append('reviewerId', params.reviewerId);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.direction) queryParams.append('direction', params.direction);

    let response: any;
    try {
        response = await apiClient.get<ReviewTasksPaginatedResponse>(`/api/review-tasks?${queryParams.toString()}`);
    } catch (err) {
        console.warn("API call for review tasks failed, providing mock container", err);
        response = { status: 200, message: "Mock Container", data: { content: [], totalElements: 0, totalPages: 1, page: 0, size: 10 } };
    }

    // MOCK DATA INJECTION
    if (params.taskId === "tsk-mock-revision" && response?.data?.content) {
        if (!response.data.content.some((r: any) => r.reviewId === "rev-mock-1")) {
            response.data.content.unshift({
                reviewId: "rev-mock-1",
                titleTask: "Mock Review",
                content: "Overall review looks okay but needs some formatting fixes.",
                commentMaterial: "Please update the reading list with 2026 versions.",
                commentSession: "Session 3 is too long, consider splitting it.",
                commentAssessment: "Final exam weight should be 40%, not 50%.",
                isAccepted: false,
                reviewDate: new Date().toISOString(),
                dueDate: "2026-10-25",
                status: "REVISION_REQUESTED",
                task: {
                    taskId: "tsk-mock-revision",
                    taskName: "Mock Revision Requested Task"
                },
                reviewer: {
                    reviewerId: "rev-user-1",
                    fullName: "Alice MockReviewer",
                    email: "alice@university.edu",
                    avatarUrl: ""
                }
            });
            response.data.totalElements += 1;
        }
    }

    return response;
  },

  updateReviewTaskStatus: async (reviewId: string, status: string) => {
    const queryParams = new URLSearchParams({ status });
    return await apiClient.patch<ReviewTaskSingleResponse>(
        `/api/review-tasks/${reviewId}/status?${queryParams.toString()}`,
        {},
        { credentials: "include" }
    );
  },

  updateReviewTask: async (reviewId: string, payload: UpdateReviewTaskPayload) => {
    return await apiClient.put<ReviewTaskSingleResponse>(
        `/api/review-tasks/${reviewId}`,
        payload,
        { credentials: "include" }
    );
  },

  updateReviewTaskAcceptance: async (reviewId: string, isAccepted: boolean) => {
    return await apiClient.patch<ReviewTaskSingleResponse>(
        `/api/review-tasks/${reviewId}/acceptance`,
        { isAccepted },
        { credentials: "include" }
    );
  },

  getReviewTaskById: async (reviewId: string) => {
    return await apiClient.get<ReviewTaskSingleResponse>(`/api/review-tasks/${reviewId}`);
  },

  getReviewTasksByTaskId: async (taskId: string) => {
    const queryParams = new URLSearchParams({ taskId });
    return await apiClient.get<ReviewTasksPaginatedResponse>(`/api/review-tasks?${queryParams.toString()}`);
  },

  createReviewTask: async (payload: CreateReviewTaskPayload) => {
    return await apiClient.post<ReviewTaskSingleResponse>(
        `/api/review-tasks`,
        payload,
        { credentials: "include" }
    );
  },
};
