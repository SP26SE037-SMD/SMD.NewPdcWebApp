const fs = require('fs');

function add(filepath, objectName) {
    let code = fs.readFileSync(filepath, 'utf8');

    const btnHtml = `
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-slate-100"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import
                    </button>
                    `;
    
    if(objectName === 'Assessments') {
        const btnPattern = /<button\n\s*onClick=\{handleReload\}/;
        if(!code.includes("upload_file") || !code.includes("setIsImportModalOpen(true)")) {
            code = code.replace(btnPattern, btnHtml + "\n<button\n                        onClick={handleReload}");
            fs.writeFileSync(filepath, code);
        }
    }
}

add('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx', 'Assessments');
