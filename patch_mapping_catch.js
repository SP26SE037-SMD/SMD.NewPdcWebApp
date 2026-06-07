const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'src/app/dashboard/pdcm/revisions/[taskId]/assessments/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/assessments/page.tsx',
    'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx'
];

const replaceTarget = /catch\s*\(\s*error:\s*any\s*\)\s*\{[\s\S]*?showToast\(\s*errMsg,\s*"error"\s*\);\s*\}/g;

const newCatchBlock = `catch (error: any) {
            if (error.data?.data && typeof error.data.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data.data);
                setIsMappingResultModalOpen(true);
            } else if (error.data && typeof error.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data);
                setIsMappingResultModalOpen(true);
            } else {
                const errMsg = error.message || "Failed to validate mappings";
                showToast(errMsg, "error");
            }
        }`;

for (const file of filesToPatch) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(replaceTarget, newCatchBlock);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched handleValidateMappings in', file);
    }
}
