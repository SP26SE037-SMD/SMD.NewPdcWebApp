const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace sheet_to_json call to include { defval: "" }
    content = content.replace(/XLSX\.utils\.sheet_to_json\(worksheet\)/g, 'XLSX.utils.sheet_to_json(worksheet, { defval: "" })');
    
    // Add filter logic
    content = content.replace(
        /const rows = XLSX\.utils\.sheet_to_json([^;]+);/,
        `const rawRows = XLSX.utils.sheet_to_json$1;
                                                const rows = rawRows.filter((r: any) => Object.keys(r).some((k: any) => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== ''));`
    );

    fs.writeFileSync(file, content);
}

patchFile('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx');
patchFile('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx');
console.log("Patched excel import completely.");
