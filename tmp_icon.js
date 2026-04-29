const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

let newContent = content.replace(
    /<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: C\.surfaceContainer, color: C\.onSurfaceVariant }}>\s*<span className="material-symbols-outlined text-2xl">menu_book<\/span>\s*<\/div>/g,
    `<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={
                status === 'TO_DO' ? { background: '#fef3c7', color: '#b45309' } :
                status === 'IN_PROGRESS' ? { background: '#e0f2fe', color: '#0369a1' } :
                syllabusStatus === 'PENDING_REVIEW' ? { background: '#f3e8ff', color: '#0369a1' } :
                status === 'REVISION_REQUESTED' ? { background: '#ffe4e6', color: '#b91c1c' } :
                { background: '#dcfce7', color: '#15803d' }
            }>
                <span className="material-symbols-outlined text-2xl">
                    {status === 'TO_DO' ? 'list_alt' :
                     status === 'IN_PROGRESS' ? 'edit_document' :
                     syllabusStatus === 'PENDING_REVIEW' ? 'hourglass_top' :
                     status === 'REVISION_REQUESTED' ? 'history_edu' :
                     // DONE
                     'task_alt'}
                </span>
            </div>`
);

newContent = newContent.replace(
    /<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: C\.secondaryContainer, color: C\.secondary }}>\s*<span className="material-symbols-outlined text-2xl">rate_review<\/span>\s*<\/div>/g,
    `<div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={
                status === 'PENDING' ? { background: '#fef3c7', color: '#b45309' } :
                status === 'IN_PROGRESS' ? { background: '#e0f2fe', color: '#0369a1' } :
                status === 'REVISION_REQUESTED' ? { background: '#ffe4e6', color: '#b91c1c' } :
                isCompleted ? { background: '#dcfce7', color: '#15803d' } :
                { background: C.secondaryContainer, color: C.secondary }
            }>
                <span className="material-symbols-outlined text-2xl">
                    {status === 'PENDING' ? 'pending_actions' :
                     status === 'IN_PROGRESS' ? 'rate_review' :
                     status === 'REVISION_REQUESTED' ? 'feedback' :
                     isCompleted ? 'verified' :
                     'rate_review'}
                </span>
            </div>`
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
