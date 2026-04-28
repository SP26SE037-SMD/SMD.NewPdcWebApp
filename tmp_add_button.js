const fs = require('fs');

function add(filepath, label) {
    let code = fs.readFileSync(filepath, 'utf8');

    // 1. add imports
    if (!code.includes("import * as XLSX from 'xlsx';")) {
        code = code.replace("import {\n    Save,", "import * as XLSX from 'xlsx';\nimport {\n    Save,");
    }

    // 2. add states
    if (!code.includes("const [isImportModalOpen")) {
        code = code.replace("const [initialSessionJson", "const [isImportModalOpen, setIsImportModalOpen] = useState(false);\n    const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n    const [previewData, setPreviewData] = useState<any[]>([]);\n    const [previewPage, setPreviewPage] = useState(1);\n    const [initialSessionJson");
        code = code.replace("const [initialAssessmentJson", "const [isImportModalOpen, setIsImportModalOpen] = useState(false);\n    const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n    const [previewData, setPreviewData] = useState<any[]>([]);\n    const [previewPage, setPreviewPage] = useState(1);\n    const [initialAssessmentJson");
    }
    
    // 3. add button
    const btnHtml = `
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-outline-variant/10 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        Import ${label}
                    </button>`;
                    
    if (!code.includes("Import " + label)) {
        if (code.includes("Submit Review")) {
           code = code.replace(
               '<button\n                        onClick={handleSubmitSyllabus}', 
               btnHtml + '\n                    <button\n                        onClick={handleSubmitSyllabus}'
           );
           code = code.replace(
               '<button\n                        disabled={isSaving}', 
               btnHtml + '\n                    <button\n                        disabled={isSaving}'
           );
        }
    }
    fs.writeFileSync(filepath, code);
}

add('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx', 'Sessions');
add('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx', 'Assessments');
