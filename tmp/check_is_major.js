const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    "const isMajorTask = !syllabusId && realTask && !realTask?.syllabus;",
    "const isMajorTask = !!realTask?.majorId;"
);

fs.writeFileSync(file, data);
console.log("Updated isMajorTask condition!");
