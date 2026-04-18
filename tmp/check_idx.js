const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    "const syllabusInfo = (syllabusId || subjectId) ? syllabusInfoDB[syllabusId || subjectId] : undefined;",
    "const uniqueId = syllabusId || subjectId || '';\n    const syllabusInfo = uniqueId ? syllabusInfoDB[uniqueId] : undefined;"
);

data = data.replace(
    "dispatch(setSyllabusInfo({",
    "dispatch(setSyllabusInfo({"
)

fs.writeFileSync(file, data);
console.log("Fixed Index");
