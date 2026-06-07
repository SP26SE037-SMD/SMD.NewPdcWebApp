const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'src/app/dashboard/pdcm/revisions/[taskId]/assessments/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/assessments/page.tsx',
    'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx'
];

for (const file of filesToPatch) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Pass validationResult to CloMappingTab
    const cloMappingTabUsageRegex = /<CloMappingTab\s+assessments=\{assessments\}\s+subjectClos=\{subjectClos\}\s+mappingStates=\{mappingStates\}\s+onMappingChange=\{.*?\}\s+\/>/s;
    content = content.replace(cloMappingTabUsageRegex, `<CloMappingTab
                        assessments={assessments}
                        subjectClos={subjectClos}
                        mappingStates={mappingStates}
                        onMappingChange={(assessmentId, cloIds) => setMappingStates(prev => ({ ...prev, [assessmentId]: cloIds }))}
                        validationResult={mappingValidationResult}
                    />`);

    // 2. Add validationResult to CloMappingTab props
    const cloMappingTabSigRegex = /function CloMappingTab\(\{ assessments, subjectClos, mappingStates, onMappingChange \}: \{\s*assessments: AssessmentItem\[\],\s*subjectClos: any\[\],\s*mappingStates: Record<string, string\[\]>,\s*onMappingChange: \(assessmentId: string, cloIds: string\[\]\) => void\s*\}\) \{/s;
    content = content.replace(cloMappingTabSigRegex, `function CloMappingTab({ assessments, subjectClos, mappingStates, onMappingChange, validationResult }: {
    assessments: AssessmentItem[],
    subjectClos: any[],
    mappingStates: Record<string, string[]>,
    onMappingChange: (assessmentId: string, cloIds: string[]) => void,
    validationResult?: any
}) {`);

    // 3. Pass validationResult to MappingRow
    const mappingRowUsageRegex = /<MappingRow\s+key=\{ass.assessmentId\}\s+assessment=\{ass\}\s+subjectClos=\{subjectClos\}\s+selectedCloIds=\{mappingStates\[ass.assessmentId!\] \|\| \[\]\}\s+onSelectionChange=\{\(ids\) => onMappingChange\(ass.assessmentId!, ids\)\}\s+\/>/s;
    content = content.replace(mappingRowUsageRegex, `<MappingRow
                                    key={ass.assessmentId}
                                    assessment={ass}
                                    subjectClos={subjectClos}
                                    selectedCloIds={mappingStates[ass.assessmentId!] || []}
                                    onSelectionChange={(ids) => onMappingChange(ass.assessmentId!, ids)}
                                    validationResult={validationResult}
                                />`);

    // 4. Add validationResult to MappingRow props
    const mappingRowSigRegex = /function MappingRow\(\{ assessment, subjectClos, selectedCloIds, onSelectionChange \}: \{\s*assessment: AssessmentItem,\s*subjectClos: any\[\],\s*selectedCloIds: string\[\],\s*onSelectionChange: \(ids: string\[\]\) => void\s*\}\) \{/s;
    content = content.replace(mappingRowSigRegex, `function MappingRow({ assessment, subjectClos, selectedCloIds, onSelectionChange, validationResult }: {
    assessment: AssessmentItem,
    subjectClos: any[],
    selectedCloIds: string[],
    onSelectionChange: (ids: string[]) => void,
    validationResult?: any
}) {`);

    // 5. Change Category and Part to Category - Type - Part in MappingRow
    const mappingRowTitleRegex = /<span className="font-bold text-slate-900">\{assessment\.categoryName\} - Part \{assessment\.part\}<\/span>/;
    content = content.replace(mappingRowTitleRegex, `<span className="font-bold text-slate-900">{assessment.categoryName} - {assessment.typeName} - Part {assessment.part}</span>`);

    // 6. Highlight suggested CLOs
    const mappingRowLogicRegex = /const \[isExpanded, setIsExpanded\] = useState\(false\);/;
    const mappingRowLogicNew = `const [isExpanded, setIsExpanded] = useState(false);
    
    const suggestionsForThisAss = validationResult?.data?.filter((d: any) => d.assessment_id === assessment.assessmentId) || [];
    const suggestedCloCodes = suggestionsForThisAss.map((d: any) => {
        const match = d.reasoning ? d.reasoning.match(/\\[Suggested alternative: Map to (.*?)\\]/i) : null;
        return match ? match[1].trim() : null;
    }).filter(Boolean);`;
    content = content.replace(mappingRowLogicRegex, mappingRowLogicNew);

    const cloButtonRegex = /className=\{`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group \$\{isSelected[\s\S]*?'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50\/10'\s*\}\`\}/s;
    const cloButtonNew = `className={\`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group w-full \${isSelected
                                                    ? 'bg-white border-emerald-400 ring-1 ring-emerald-100 shadow-sm'
                                                    : suggestedCloCodes.includes(clo.cloCode)
                                                        ? 'bg-blue-50/30 border-blue-300 ring-1 ring-blue-100 shadow-sm hover:bg-blue-50/50'
                                                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10'
                                                }\`}`;
    content = content.replace(cloButtonRegex, cloButtonNew);

    const cloContentRegex = /<div className="space-y-1">[\s\S]*?<p className=\{`text-\[10px\] font-bold uppercase tracking-wider \$\{isSelected \? 'text-emerald-700' : 'text-slate-500'\}\`\}>\s*\{clo\.cloCode\}\s*<\/p>\s*<p className=\{`text-xs leading-relaxed \$\{isSelected \? 'text-emerald-900' : 'text-slate-600'\}\`\}>\s*\{clo\.description\}\s*<\/p>\s*<\/div>/s;
    const cloContentNew = `<div className="space-y-1 w-full">
                                                <div className="flex justify-between items-center w-full">
                                                    <p className={\`text-[10px] font-bold uppercase tracking-wider \${isSelected ? 'text-emerald-700' : suggestedCloCodes.includes(clo.cloCode) ? 'text-blue-700' : 'text-slate-500'}\`}>
                                                        {clo.cloCode}
                                                    </p>
                                                    {suggestedCloCodes.includes(clo.cloCode) && (
                                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Suggested
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={\`text-xs leading-relaxed \${isSelected ? 'text-emerald-900' : suggestedCloCodes.includes(clo.cloCode) ? 'text-blue-800' : 'text-slate-600'}\`}>
                                                    {clo.description}
                                                </p>
                                            </div>`;
    content = content.replace(cloContentRegex, cloContentNew);

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Patched UI highlights in', file);
}
