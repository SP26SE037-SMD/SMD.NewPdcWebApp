const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/services/task.service.ts';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "syllabus: {",
  "syllabusId?: string;\n  syllabus?: {"
);

fs.writeFileSync(file, data);
