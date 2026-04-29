const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

let newContent = content.replace(
    /const acceptTaskMutation = useMutation\(\{[\s\n]*mutationFn: \(taskId: string\) => TaskService\.updateTaskStatus\(taskId, TASK_STATUS\.IN_PROGRESS\),/,
    `const acceptTaskMutation = useMutation({
        mutationFn: (task: any) => {
            if (navTab === 'develop') {
                return TaskService.updateTaskStatus(task.taskId, TASK_STATUS.IN_PROGRESS);
            } else {
                return ReviewTaskService.updateReviewTaskAcceptance(task.reviewId || task.taskId, true);
            }
        },`
);

newContent = newContent.replace(
    /const handleAcceptTask = \(task: any\) => \{[\s\n]*setIsAccepting\(task\.taskId\);[\s\n]*acceptTaskMutation\.mutate\(task\.taskId\);[\s\n]*\};/,
    `const handleAcceptTask = (task: any) => {
        setIsAccepting(task.taskId);
        acceptTaskMutation.mutate(task);
    };`
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
