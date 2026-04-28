const fs = require('fs');

const files = {
  sessions: 'src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx',
  assessments: 'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx',
  materials: 'src/app/dashboard/pdcm/tasks/[taskId]/materials/page.tsx'
};

const templates = {
  sessions: `                <div className="flex gap-4">
                    <button
                        onClick={() => refetchSessions()}
                        disabled={isFetchingSessions}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8] disabled:opacity-70"
                        style={{ borderColor: '#41683f', color: '#41683f', background: 'transparent' }}
                    >
                        <span className={\`material-symbols-outlined text-[18px] \${isFetchingSessions ? 'animate-spin' : ''}\`}>refresh</span>
                        Refresh
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
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
                        onClick={handleReload}
                        disabled={isSaving || !syllabusId}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8] disabled:opacity-70"
                        style={{ borderColor: '#41683f', color: '#41683f', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
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
                        New Component
                    </button>
                </div>`,

  materials: `                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8] disabled:opacity-70"
                        style={{ borderColor: '#41683f', color: '#41683f', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen && typeof setIsImportModalOpen === 'function' ? setIsImportModalOpen(true) : alert('Import Material clicked')}
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

for (const [key, filePath] of Object.entries(files)) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Use regex to locate the flex gap-4 div and replace it
  // This looks for `<div className="flex gap-4">...</div>` exactly.
  // Because they can span multiple lines, we need a regex that captures everything until its closing div or the next adjacent node.
  
  // For safety, let's target specific known strings in each file
  if (key === 'sessions') {
      content = content.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Empty State ── \*\/\}/, templates.sessions + '\n            </div>\n\n            {/* ── Empty State ── */}');
  } else if (key === 'assessments') {
      content = content.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Scrollable Bento Grid List of Assessments ── \*\/\}/, templates.assessments + '\n            </div>\n\n            {/* ── Scrollable Bento Grid List of Assessments ── */}');
  } else if (key === 'materials') {
      content = content.replace(/<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ── Content Area ── \*\/\}/, templates.materials + '\n            </div>\n\n            {/* ── Content Area ── */}');
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated ' + key);
}
