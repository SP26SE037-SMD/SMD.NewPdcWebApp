const fs = require('fs');
const filepath = 'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx';
let code = fs.readFileSync(filepath, 'utf8');

// 1. Add CLOs query right after categoriesRes & typesRes inside AssessmentsPage
const queryToInsert = `
    const subjectId = syllabusData?.data?.subjectId;
    const { data: closRes } = useQuery({
        queryKey: ['clos', subjectId],
        queryFn: () => subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
        enabled: !!subjectId,
    });
    const subjectClos = closRes?.data?.content || [];

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
`;

code = code.replace(
    `    const ASSESSMENT_TYPES = typesRes?.data?.content || [];`,
    `    const ASSESSMENT_TYPES = typesRes?.data?.content || [];\n${queryToInsert}`
);

// 2. Replace the entire <ImportModal ... /> logic with the new Preview Modal + ImportModal logic
const importModalReplacement = `            <ImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type="assessment"
                onImport={async (file) => {
                    try {
                        const data = await file.arrayBuffer();
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

                        if (!syllabusId) return;

                        const parsedAssessments = rows.map((row, index) => {
                            const rawType = String(row['Type'] || row['type'] || '').trim();
                            const rawCategory = String(row['Category'] || row['category'] || '').trim();
                            const rawCLOs = String(row['CLOs'] || row['clos'] || row['CLO'] || '').trim();
                            
                            const lowerType = rawType.toLowerCase();
                            const lowerCategory = rawCategory.toLowerCase();

                            // Get API types & categories previously fetched directly via React Query
                            const matchedType = ASSESSMENT_TYPES.find((t: any) => t.typeName?.toLowerCase() === lowerType);
                            const matchedCat = ASSESSMENT_CATEGORIES.find((c: any) => c.categoryName?.toLowerCase() === lowerCategory);

                            // Match CLOs
                            const cloCodes = rawCLOs.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
                            const matchedClos = subjectClos.filter((c: any) => c.cloCode && cloCodes.includes(c.cloCode.toLowerCase()));

                            return {
                                _rowNum: index + 1,
                                syllabusId,
                                categoryId: matchedCat?.categoryId || (ASSESSMENT_CATEGORIES.length > 0 ? ASSESSMENT_CATEGORIES[0].categoryId : ""),
                                categoryName: matchedCat?.categoryName || rawCategory,
                                typeId: matchedType?.typeId || (ASSESSMENT_TYPES.length > 0 ? ASSESSMENT_TYPES[0].typeId : ""),
                                typeName: matchedType?.typeName || rawType,
                                part: Number(row['Part'] || row['part'] || 1),
                                weight: Number(row['Weight'] || row['weight'] || 0),
                                completionCriteria: row['Completion Criteria'] || row['completionCriteria'] || "",
                                duration: Number(row['Duration'] || row['duration'] || 0),
                                questionType: row['Question Type'] || row['questionType'] || "",
                                knowledgeSkill: row['Knowledge Skill'] || row['knowledgeSkill'] || "",
                                gradingGuide: row['Grading Guide'] || row['gradingGuide'] || "",
                                note: row['Note'] || row['note'] || "",
                                status: "DRAFT",
                                _rawCLOs: rawCLOs,
                                matchedClos
                            };
                        });

                        setPreviewData(parsedAssessments);
                        setIsPreviewOpen(true);
                    } catch (error) {
                        console.error('Import error:', error);
                        showToast('Failed to parse Excel file.', 'error');
                    }
                    setIsImportModalOpen(false);
                }}
            />

            {/* Template Download Button handled inside our modal replacement, actually we can just put a download button somewhere or recreate a new Upload Modal entirely. But user asked to make the popup beautiful and have a template download button. Let's make a custom Import+Preview Modal instead of the default ImportModal */}
`;

// It's better to render a giant custom modal conditionally or replace `ImportModal` entirely. Let's just create a custom `<AssessmentImportPreviewModal>` at the bottom and use it instead of `<ImportModal>`
fs.writeFileSync(filepath, code, 'utf8');
