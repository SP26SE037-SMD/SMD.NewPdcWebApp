const fs = require('fs');

const fileAssessments = 'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx';
const fileSessions = 'src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx';
const fileMaterials = 'src/app/dashboard/pdcm/tasks/[taskId]/materials/page.tsx';

// 1. Fix ReferenceError in assessments by either adding state or mocking the onClick
let assessmentsContent = fs.readFileSync(fileAssessments, 'utf-8');

// Replace "setIsImportModalOpen(true)" with a safe check if it doesn't exist
// Or just add the state if it's missing. Let's look at how we did materials:
// onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : alert('Import clicked')}

// First, remove the refresh buttons.
// The block looks like:
/*
                    <button
                        onClick={...}
                        ...
                        className="...refresh..."
                        ...
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>
*/

// Let's just redefine the whole flex gap-4 block for each to be exactly what user wants.

const templates = {
  sessions: `                <div className="flex gap-4">
                    <button
                        onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : console.log('Import clicked')}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8]"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import
                    </button>
                    
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white hover:bg-[#345332]"
                        style={{ background: '#41683f' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Session
                    </button>
                </div>`,

  assessments: `                <div className="flex gap-4">
                    <button
                        onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : alert('Tính năng import đang phát triển')}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8]"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import
                    </button>
                    
                    <button
                        onClick={handleAddComponent}
                        disabled={isSaving || !syllabusId}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white hover:bg-[#345332] disabled:opacity-70"
                        style={{ background: '#41683f' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Assessment
                    </button>
                </div>`,

  materials: `                <div className="flex gap-4">
                    <button
                        onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : alert('Tính năng import đang phát triển')}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8]"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import
                    </button>

                    <button
                        onClick={() => router.push(\`/dashboard/pdcm/materials/new?syllabusId=\${syllabusId}&taskId=\${taskId}\`)}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white hover:bg-[#345332]"
                        style={{ background: '#41683f' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Material
                    </button>
                </div>`
};

let cS = fs.readFileSync(fileSessions, 'utf8');
cS = cS.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Empty State ── \*\/\}/, templates.sessions + '\n            </div>\n\n            {/* ── Empty State ── */}');
fs.writeFileSync(fileSessions, cS);

let cA = fs.readFileSync(fileAssessments, 'utf8');
cA = cA.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Scrollable Bento Grid List of Assessments ── \*\/\}/, templates.assessments + '\n            </div>\n\n            {/* ── Scrollable Bento Grid List of Assessments ── */}');
// Also fix the setIsImportModalOpen error globally in assessments button just in case we missed matching:
cA = cA.replace(/onClick=\{\(\) => setIsImportModalOpen\(true\)\}/g, "onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : alert('Development in progress')}");
fs.writeFileSync(fileAssessments, cA);

let cM = fs.readFileSync(fileMaterials, 'utf8');
cM = cM.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Content Area ── \*\/\}/, templates.materials + '\n            </div>\n\n            {/* ── Content Area ── */}');
fs.writeFileSync(fileMaterials, cM);

console.log('Fixed 3 files');
