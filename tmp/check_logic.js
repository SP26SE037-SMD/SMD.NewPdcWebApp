const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Fix subjectId extraction
data = data.replace(
    "const subjectId = syllabusData?.subjectId;",
    "const subjectId = syllabusData?.subjectId || realTask?.subjectId || realTask?.subject?.subjectId;"
);

// 2. Fix the syllabusData early return
data = data.replace(
    /if \(!syllabusData\) {\s*return \(\s*<div className="flex flex-col items-center justify-center py-20 px-4 text-center">[\s\S]*?<\/div>\s*\);\s*}/g,
    `if (!syllabusData && !subjectData && !isMajorTask) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: C.surfaceContainer }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>info</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: C.onSurface }}>No Data Available</h3>
                <p style={{ color: C.onSurfaceVariant }} className="max-w-sm">
                    We couldn't retrieve the subject or syllabus details for this task.
                </p>
            </div>
        );
    }`
);

fs.writeFileSync(file, data);
console.log("Replaced logic");
