const fs = require('fs');
let txt = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

// Update colors
txt = txt.replace(/primary:\s*'[^']+'/, "primary: '#409b43ff'");
txt = txt.replace(/surfaceContainerLow:\s*'[^']+'/, "surfaceContainerLow: '#ffffff'");
txt = txt.replace(/surfaceContainer:\s*'[^']+'/, "surfaceContainer: '#ffffff'");
txt = txt.replace(/surfaceContainerHigh:\s*'[^']+'/, "surfaceContainerHigh: '#f3f4f6'");

// Make setNavTab state
txt = txt.replace(/const navTab = defaultTab;/, "const [navTab, setNavTab] = useState<'develop' | 'peer-review'>(defaultTab);");

// Update buttons to use setNavTab instead of router.push
txt = txt.replace(/onClick=\{\(\) => router.push\('\/dashboard\/pdcm'\)\}/g, "onClick={() => setNavTab('develop')}");
txt = txt.replace(/onClick=\{\(\) => router.push\('\/dashboard\/pdcm\/peer-review'\)\}/g, "onClick={() => setNavTab('peer-review')}");

// Fix the grid to flex list
txt = txt.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">/, '<div className="flex flex-col gap-4 mb-12">');

// Update sidebar spacing and padding to remove 'pt-16 mt-4' because header is now fixed logic maybe? 
// The user asked "Cho sidebar xích lên cho tôi đi ạ".
txt = txt.replace(/<div className="flex flex-1 pt-16 mt-4">/, '<div className="flex flex-1 pt-[64px] mt-0">');

// Rewrite DevelopCard
const developCardOldStart = txt.indexOf('function DevelopCard');
const developCardOldEnd = txt.indexOf('function ReviewCard');

const newDevelopCard = `function DevelopCard({ task, isAccepting, onAccept, router }: any) {
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

    const { statusConfig, pulse } = getStatusConfig(activeStatus, isOverdue);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative flex items-center justify-between bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(64,155,67,0.15)] border border-gray-100 hover:border-[#409b43ff]/30 cursor-pointer overflow-hidden"
            onClick={() => {
                if (activeStatus === 'TO_DO' || syllabusStatus === 'PENDING_REVIEW') return;
                const basePath = isRevision ? 'revisions' : 'tasks';
                router.push(\`/dashboard/pdcm/\${basePath}/\${task.taskId}/information\`);
            }}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#409b43ff] to-[#76c278] opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center gap-6 flex-1 min-w-0 pr-6">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center bg-[#409b43ff]/10 text-[#409b43ff] shadow-[0_4px_12px_rgba(64,155,67,0.1)] shrink-0">
                    <span className="font-extrabold text-sm">{subjectCode.substring(0, 3)}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-70">CODE</span>
                </div>
                
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <span 
                            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                        >
                            {statusConfig.label}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{subjectCode}</h4>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 leading-snug truncate group-hover:text-[#409b43ff] transition-colors">
                        {task.taskName || 'Untitled Task'}
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</span>
                    {task.endDate ? (
                        <span className={\`font-black text-sm \${isOverdue ? 'text-red-600' : 'text-gray-700'}\`}>
                            {new Date(task.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    ) : (
                        <span className="text-sm font-bold text-gray-300">N/A</span>
                    )}
                </div>

                <div className="w-px h-10 bg-gray-100 hidden md:block"></div>

                <div className="flex items-center w-40 justify-end">
                    {activeStatus === 'TO_DO' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAccept(task); }}
                            disabled={isAccepting === task.taskId}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#409b43ff] to-[#51b855] text-white shadow-lg shadow-[#409b43ff]/30 hover:shadow-[#409b43ff]/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isAccepting === task.taskId ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="material-symbols-outlined text-[18px]">play_arrow</span>}
                            <span>Accept</span>
                        </button>
                    ) : syllabusStatus === 'PENDING_REVIEW' ? (
                        <span className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                            Reviewing
                        </span>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const basePath = isRevision ? 'revisions' : 'tasks';
                                router.push(\`/dashboard/pdcm/\${basePath}/\${task.taskId}/information\`);
                            }}
                            className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-700 group-hover:bg-[#409b43ff] group-hover:text-white transition-all hover:shadow-lg hover:shadow-[#409b43ff]/30 active:scale-95 border border-gray-200 group-hover:border-[#409b43ff]"
                        >
                            <span>Open</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

`;

const developCardReplaced = txt.substring(0, developCardOldStart) + newDevelopCard + txt.substring(developCardOldEnd);
txt = developCardReplaced;

// Rewrite ReviewCard
const reviewCardOldStart = txt.indexOf('function ReviewCard');
const reviewCardOldEnd = txt.indexOf('export default function PDCMDashboardContent');

const newReviewCard = `function ReviewCard({ task, isAccepting, onAccept, router }: any) {
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

    const { statusConfig, pulse } = getReviewStatusConfig(status, isOverdue);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative flex items-center justify-between bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(64,155,67,0.15)] border border-gray-100 hover:border-[#409b43ff]/30 cursor-pointer overflow-hidden"
            onClick={() => {
                if (status === 'PENDING' || status === 'TO_DO') return;
                router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`);
            }}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#409b43ff] to-[#76c278] opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center gap-6 flex-1 min-w-0 pr-6">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center bg-blue-50 text-[#409b43ff] shadow-[0_4px_12px_rgba(64,155,67,0.1)] shrink-0 border border-blue-100 group-hover:bg-[#409b43ff]/10 transition-colors">
                    <span className="font-extrabold text-sm">{subjectCode.substring(0, 3)}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-70">REV</span>
                </div>
                
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <span 
                            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                        >
                            {statusConfig.label}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{subjectCode}</h4>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 leading-snug truncate group-hover:text-[#409b43ff] transition-colors">
                        {task.taskName || task.titleTask || 'Untitled Review'}
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review By</span>
                    {task.endDate ? (
                        <span className={\`font-black text-sm \${isOverdue ? 'text-red-600' : 'text-gray-700'}\`}>
                            {new Date(task.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    ) : (
                        <span className="text-sm font-bold text-gray-300">N/A</span>
                    )}
                </div>

                <div className="w-px h-10 bg-gray-100 hidden md:block"></div>

                <div className="flex items-center w-40 justify-end">
                    {status === 'PENDING' || status === 'TO_DO' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAccept(task); }}
                            disabled={isAccepting === (task.reviewId || task.taskId)}
                            className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isAccepting === (task.reviewId || task.taskId) ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="material-symbols-outlined text-[18px]">play_arrow</span>}
                            <span>Start</span>
                        </button>
                    ) : isCompleted ? (
                       <span className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-green-50 text-[#409b43ff] border border-[#409b43ff]/30 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Done
                        </span>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`);
                            }}
                            className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-700 group-hover:bg-[#409b43ff] group-hover:text-white transition-all hover:shadow-lg hover:shadow-[#409b43ff]/30 active:scale-95 border border-gray-200 group-hover:border-[#409b43ff]"
                        >
                            <span>Review</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

`;

const reviewCardReplaced = txt.substring(0, reviewCardOldStart) + newReviewCard + txt.substring(reviewCardOldEnd);
txt = reviewCardReplaced;

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', txt);
console.log('Update layout and replace cards successfully');
