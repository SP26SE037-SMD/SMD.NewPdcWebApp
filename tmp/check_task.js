const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/services/task.service.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/curriculumId\?: string \| null;/g, "curriculumId?: string | null;\n  majorId?: string | null;\n  major?: { majorId: string; majorCode: string; majorName: string; } | null;");
fs.writeFileSync(file, data);
