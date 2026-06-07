const fs = require('fs');
const path = require('path');

const files = [
    'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx',
    'src/app/dashboard/pdcm/revisions/[taskId]/assessments/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/assessments/page.tsx'
];

files.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error("File not found:", fullPath);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Add saveError state
    content = content.replace(
        /const \[validationSummary, setValidationSummary\] = useState<any>\(null\);/,
        'const [validationSummary, setValidationSummary] = useState<any>(null);\n    const [saveError, setSaveError] = useState<string | null>(null);'
    );

    // 2. Clear saveError on close
    content = content.replace(
        /setIsPreviewOpen\(false\);\s*\}\s*\}\}/g,
        'setIsPreviewOpen(false); setSaveError(null); } }}'
    );

    // 3. Render saveError before Editable Preview Table
    content = content.replace(
        /\{\/\* Editable Preview Table \*\/\}/,
        `{saveError && (
                                        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-1">
                                            <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                                            <div className="flex-1">
                                                <ul className="text-xs font-medium list-disc list-outside ml-3 space-y-1">
                                                    {saveError.split('\\n').map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editable Preview Table */}`
    );

    // 4. Clear saveError on Back button
    content = content.replace(
        /setValidationSummary\(null\);\s*\}\}/,
        'setValidationSummary(null); setSaveError(null); }}'
    );

    // 5. Clear saveError on success
    content = content.replace(
        /setImportFile\(null\);/,
        'setImportFile(null);\n                                                setSaveError(null);'
    );

    // 6. Set saveError on validation failure
    content = content.replace(
        /if \(globalErrs\.length > 0\) \{\n\s+errorMsg \+= '\\n' \+ globalErrs\.map\(\(e: any\) => e\.message\)\.join\('\\n'\);\n\s+\}/,
        `if (globalErrs.length > 0) {
                                                     errorMsg += '\\n' + globalErrs.map((e: any) => e.message).join('\\n');
                                                     setSaveError(globalErrs.map((e: any) => e.message).join('\\n'));
                                                 }`
    );

    // 7. Set saveError on catch failure
    content = content.replace(
        /\} else \{\n\s+showToast\((error\?\.message \|\| '[^']+'), 'error'\);\n\s+\}/,
        `} else {
                                                 const errMsg = $1;
                                                 setSaveError(errMsg);
                                                 showToast(errMsg, 'error');
                                             }`
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log("Patched", relPath);
});
