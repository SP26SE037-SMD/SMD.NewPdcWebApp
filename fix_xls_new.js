const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace sheet_to_json(worksheet) with sheet_to_json(worksheet, { defval: "" })
    content = content.replace(/XLSX\.utils\.sheet_to_json\(worksheet\)(?!\s*,)/g, 'XLSX.utils.sheet_to_json(worksheet, { defval: "" })');
    content = content.replace(/const rows = XLSX\.utils\.sheet_to_json\(worksheet\)/g, 'const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" })');
    
    // Also apply the empty filter
    const regex = /const rows = XLSX\.utils\.sheet_to_json([^;]+);/;
    const rep = `const rawRows = XLSX.utils.sheet_to_json$1;
                                                const rows = rawRows.filter((r) => Object.keys(r).some(k => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== ''));`;
    content = content.replace(regex, rep);

    fs.writeFileSync(file, content);
}

patchFile('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx');
// The session one was already patched and not reverted (git status only showed assessments reverted, wait: actually we need to make sure we don't double patch sessions).
// Let's NOT patch session here, only assessments.
console.log("Patched xlsx parsing.");
