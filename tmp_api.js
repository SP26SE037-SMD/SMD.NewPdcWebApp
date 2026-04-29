const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

let newContent = content.replace(
    /return await TaskService\.getTasks\(params as any\);/,
    `if (navTab === 'develop') {
                return await TaskService.getTasks(params as any);
            } else {
                return await ReviewTaskService.getReviewTasks(params.accountId, params.status as string | string[], params.page, params.size);
            }`
);

// We need to import ReviewTaskService
if (!newContent.includes('ReviewTaskService')) {
    newContent = newContent.replace(
        /import { TaskService, TASK_STATUS } from '@\/services\/task\.service';/,
        `import { TaskService, TASK_STATUS } from '@/services/task.service';\nimport { ReviewTaskService } from '@/services/review-task.service';`
    );
}

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
