import { useQuery } from '@tanstack/react-query';
import { ReviewTaskService } from '@/services/review-task.service';

export const useRevisionRequest = (taskId: string, isRevisionRequested: boolean) => {
    return useQuery({
        queryKey: ['revision-request', taskId],
        queryFn: async () => {
            const res = await ReviewTaskService.searchReviewTasks({
                taskId,
                size: 100,
                sortBy: 'reviewDate',
                direction: 'desc'
            });
            // Return the latest one which is at index 0 because of 'desc' sort
            return res.data?.content?.[0] || null;
        },
        enabled: isRevisionRequested && !!taskId,
        staleTime: 5 * 60 * 1000,
    });
};
