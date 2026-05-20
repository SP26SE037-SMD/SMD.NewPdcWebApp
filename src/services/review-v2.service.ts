import { apiClient } from "@/lib/api-client";

export interface ReviewV2 {
  reviewId: string;
  taskId: string;
  reviewerId: string;
  comment: string;
  reviewDate?: string;
  status?: string;
}

export const ReviewV2Service = {
  getReviewByTaskId: async (taskId: string): Promise<{ status: number; message: string; data: ReviewV2[] }> => {
    return apiClient.get(`/api/v1/reviews-v2/by-task/${taskId}`);
  }
};
