const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace sheet_to_json(worksheet) with sheet_to_json(worksheet, { defval: "" })
    content = content.replace(/XLSX\.utils\.sheet_to_json\(worksheet\)(?!\s*,)/g, 'XLSX.utils.sheet_to_json(worksheet, { defval: "" })');
    content = content.replace(/const rows = XLSX\.utils\.sheet_to_json\(worksheet\)/g, 'const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" })');
    fs.writeFileSync(file, content);
}

patchFile('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx');
patchFile('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx');
console.log("Patched xlsx parsing.");
