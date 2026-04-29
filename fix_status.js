const fs = require('fs');
let txt = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

// Replace DevelopCard
const defDevelop = `function DevelopCard({ task, isAccepting, onAccept, router }: any) {
    const isRevision = task.status === 'REVISION_REQUESTED';
    const isCompleted = task.status === 'COMPLETED' || task.status === 'PENDING_REVIEW';
    const syllabusStatus = task.syllabus?.status;
    const subjectCode = task.syllabus?.subject?.code || task.subject?.code || '???';
    const activeStatus = isRevision ? 'REVISION_REQUESTED' : task.status;
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && !isCompleted;
    
    let daysLeft = null;
    if (task.endDate && !isCompleted) {
        const diff = new Date(task.endDate).getTime() - new Date().getTime();
        daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
    }

    const getStatusConfig = () => {
        if (isCompleted) return { label: 'Completed', bg: '#f0fdf4', text: '#166534' };
        if (isRevision) return { label: 'Revision', bg: '#fef2f2', text: '#991b1b', pulse: true };
        switch (task.status) {
            case 'TO_DO': return { label: 'To Do', bg: '#f8fafc', text: '#475569' };
            case 'IN_PROGRESS': return { label: 'In Progress', bg: '#eff6ff', text: '#1d4ed8' };
            default: return { label: task.status, bg: '#f1f5f9', text: '#64748b' };
        }
    };
    const statusConfig = getStatusConfig();`;

txt = txt.replace(/function DevelopCard\(\{ task, isAccepting, onAccept, router \}: any\) \{[\s\S]*?const \{ statusConfig, pulse \} = getStatusConfig\(activeStatus, isOverdue\);/, defDevelop);

// Replace ReviewCard
const defReview = `function ReviewCard({ task, isAccepting, onAccept, router }: any) {
    const isRevision = task.status === 'REVISION_REQUESTED';
    const status = isRevision ? 'REVISION_REQUESTED' : task.status;
    const isCompleted = task.status === 'COMPLETED' || task.status === 'APPROVED' || task.status === 'DONE';
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && !isCompleted;
    const subjectCode = task.subject?.code || task?.task?.syllabus?.subject?.code || '???';

    let daysLeft = null;
    if (task.endDate && !isCompleted) {
        const diff = new Date(task.endDate).getTime() - new Date().getTime();
        daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
    }

    const getStatusConfig = () => {
        if (isCompleted) return { label: 'Completed', bg: '#f0fdf4', text: '#166534' };
        if (isRevision) return { label: 'Revision', bg: '#fef2f2', text: '#991b1b', pulse: true };
        switch (task.status) {
            case 'PENDING':
            case 'TO_DO': return { label: 'To Do', bg: '#f8fafc', text: '#475569' };
            case 'IN_PROGRESS': return { label: 'In Progress', bg: '#eff6ff', text: '#1d4ed8' };
            default: return { label: task.status, bg: '#f1f5f9', text: '#64748b' };
        }
    };
    const statusConfig = getStatusConfig();`;

txt = txt.replace(/function ReviewCard\(\{ task, isAccepting, onAccept, router \}: any\) \{[\s\S]*?const \{ statusConfig, pulse \} = getStatusConfig\(status, isOverdue\);/, defReview);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', txt);
