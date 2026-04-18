const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "const syllabusId = realTask?.syllabus?.syllabusId;",
  "const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;\n    console.log('EXTRACTED SYLLABUS_ID: ', syllabusId);"
);

fs.writeFileSync(file, data);
