const fs = require('fs');
const path = require('path');

const extractCode = `
                                                        {(() => {
                                                            const match = item.reasoning ? item.reasoning.match(/\\[Suggested alternative: (.*?)\\]/i) : null;
                                                            const suggestion = match ? match[1] : null;
                                                            const cleanReasoning = item.reasoning ? item.reasoning.replace(/\\s*\\[Suggested alternative: .*?\\]/i, '').trim() : '';
                                                            return (
                                                                <>
                                                                    {cleanReasoning && (
                                                                        <p className="text-[11px] text-slate-500 mt-2 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                                            "{cleanReasoning}"
                                                                        </p>
                                                                    )}
                                                                    {suggestion && (
                                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                                                            <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                                                            Suggested: Map to {suggestion}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
`;

const replaceTarget = /\{item\.reasoning && \(\s*<p className="text-\[11px\] text-slate-500 mt-2 italic bg-white\/50 p-2 rounded-lg border border-slate-100">\s*"{item\.reasoning}"\s*<\/p>\s*\)\}/g;

const filesToPatch = [
    'src/app/dashboard/pdcm/revisions/[taskId]/sessions/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/sessions/page.tsx',
    'src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx'
];

for (const file of filesToPatch) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(replaceTarget, extractCode);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched SessionMappingValidationModal in', file);
    }
}
