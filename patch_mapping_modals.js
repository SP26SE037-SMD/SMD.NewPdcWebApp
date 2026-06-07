const fs = require('fs');
const path = require('path');

function extractSuggestion(reasoning) {
    if (!reasoning) return { clean: '', suggestion: null };
    const match = reasoning.match(/\[Suggested alternative: (.*?)\]/i);
    if (match) {
        return {
            clean: reasoning.replace(/\s*\[Suggested alternative: .*?\]/i, '').trim(),
            suggestion: match[1]
        };
    }
    return { clean: reasoning, suggestion: null };
}

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
    'src/app/dashboard/pdcm/revisions/[taskId]/assessments/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/assessments/page.tsx',
    'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx'
];

for (const file of filesToPatch) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(replaceTarget, extractCode);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched MappingValidationModal in', file);
    }
}

// Now handle the REVIEW mode (AssessmentAISuggestionModal)
const reviewPagePath = path.join(__dirname, 'src/app/dashboard/pdcm/reviews/[reviewId]/assessments/page.tsx');
if (fs.existsSync(reviewPagePath)) {
    let content = fs.readFileSync(reviewPagePath, 'utf8');
    
    // Add mapping validation errors to warnings
    const mappingWarningsCode = `
            warnings: (mappingValidData?.data || []).map((m: any) => {
               const match = m.reasoning ? m.reasoning.match(/\\[Suggested alternative: (.*?)\\]/i) : null;
               return {
                  label: 'Alignment Issue',
                  detail: match ? m.reasoning.replace(/\\s*\\[Suggested alternative: .*?\\]/i, '').trim() : m.reasoning,
                  suggestion: match ? match[1] : null,
               };
            }),
`;
    content = content.replace(/warnings:\s*\[\],[\s]*unmappedClos/, mappingWarningsCode.trim() + '\n            unmappedClos');
    fs.writeFileSync(reviewPagePath, content, 'utf8');
    console.log('Patched REVIEW page.tsx');
}

const reviewModalPath = path.join(__dirname, 'src/app/dashboard/pdcm/reviews/[reviewId]/_components/AssessmentAISuggestionModal.tsx');
if (fs.existsSync(reviewModalPath)) {
    let content = fs.readFileSync(reviewModalPath, 'utf8');
    
    // Render suggestion in the modal
    const warningRenderOld = `                                                    <div>
                                                        <p className="text-xs font-bold text-amber-800">{w.label}</p>
                                                        {w.detail && <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{w.detail}</p>}
                                                    </div>`;
                                                    
    const warningRenderNew = `                                                    <div>
                                                        <p className="text-xs font-bold text-amber-800">{w.label}</p>
                                                        {w.detail && <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{w.detail}</p>}
                                                        {w.suggestion && (
                                                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-200/60 bg-amber-100/50 text-amber-700 text-[10px] font-bold">
                                                                <Sparkles size={10} className="text-amber-500" />
                                                                Suggested: Map to {w.suggestion}
                                                            </div>
                                                        )}
                                                    </div>`;
    content = content.replace(warningRenderOld, warningRenderNew);
    fs.writeFileSync(reviewModalPath, content, 'utf8');
    console.log('Patched AssessmentAISuggestionModal.tsx');
}

console.log('Done!');
