const fs = require('fs');

function patch(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const regex = /const rows = XLSX\.utils\.sheet_to_json([^;]+);/;
    const rep = `const rawRows = XLSX.utils.sheet_to_json$1;
                                                const rows = rawRows.filter((r) => Object.keys(r).some(k => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== ''));`;
    content = content.replace(regex, rep);
    fs.writeFileSync(filepath, content);
}

patch('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx');
patch('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx');
console.log("Empty rows filter applied");
